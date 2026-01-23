import numpy as np
import time
import math
from typing import List, Dict, Tuple, Optional
from models import (
    StructuralModel, Joint, Frame, AnalysisResults, 
    JointDisplacement, DetailedFrameResult, FrameForces,
    LoadCombination, JointReaction, Restraint
)
from .matrix_utils import zeros, zeros_vector, solve_linear_system, assemble_global, create_sparse_matrix, assemble_sparse, solve_sparse
from .frame_element import frame_element_stiffness, frame_transformation_matrix, transform_stiffness_to_global
from .geometry_utils import is_point_on_segment, get_segment_intersection

GRAVITY = 9.81

def get_default_restraint() -> Restraint:
    return Restraint(ux=False, uy=False, uz=False, rx=False, ry=False, rz=False)

def preprocess_intersections(model: StructuralModel) -> StructuralModel:
    """
    Detects intersections between frames and other frames or joints.
    Splits frames at intersections and adds new joints.
    """
    
    # 1. Map existing joints
    joints_map = {j.id: j for j in model.joints}
    next_joint_id = max([j.id for j in model.joints]) + 1 if model.joints else 1
    
    # Track split points for each frame: frame_id -> list of (t, point_coords)
    # t is purely for sorting, we assume linear interpolation 0..1
    frame_splits: Dict[int, List[Tuple[float, float, float]]] = {}
    
    # Helper to add split
    def add_split(f_id: int, pt: Tuple[float, float, float]):
        if f_id not in frame_splits:
            frame_splits[f_id] = []
        # Check if point already waiting to be split (avoid duplicates)
        for _, existing_pt in frame_splits[f_id]:
            if np.linalg.norm(np.array(pt) - np.array(existing_pt)) < 1e-4:
                return
        
        # Calculate t for sorting
        frame = next((f for f in model.frames if f.id == f_id), None)
        if not frame: return
        
        jI = joints_map[frame.jointI]
        jJ = joints_map[frame.jointJ]
        start = np.array([jI.x, jI.y, jI.z])
        end = np.array([jJ.x, jJ.y, jJ.z])
        length = np.linalg.norm(end - start)
        dist = np.linalg.norm(np.array(pt) - start)
        t = dist / length if length > 0 else 0
        
        frame_splits[f_id].append((t, pt))

    # A. Check Node-on-Frame (T-Junctions)
    # Iterate all joints vs all frames
    for j in model.joints:
        j_coords = (j.x, j.y, j.z)
        for f in model.frames:
            # Skip if joint is endpoint of frame
            if f.jointI == j.id or f.jointJ == j.id:
                continue
                
            jI = joints_map[f.jointI]
            jJ = joints_map[f.jointJ]
            start = (jI.x, jI.y, jI.z)
            end = (jJ.x, jJ.y, jJ.z)
            
            if is_point_on_segment(j_coords, start, end):
                # print(f"Joint {j.id} lies on Frame {f.id}")
                add_split(f.id, j_coords)

    # B. Check Frame-Frame Intersections (Crossings)
    # Compare every unique pair of frames
    frames = model.frames
    for i in range(len(frames)):
        for k in range(i + 1, len(frames)):
            f1 = frames[i]
            f2 = frames[k]
            
            # Get coords
            jI1 = joints_map[f1.jointI]
            jJ1 = joints_map[f1.jointJ]
            p1_start = (jI1.x, jI1.y, jI1.z)
            p1_end = (jJ1.x, jJ1.y, jJ1.z)
            
            jI2 = joints_map[f2.jointI]
            jJ2 = joints_map[f2.jointJ]
            p2_start = (jI2.x, jI2.y, jI2.z)
            p2_end = (jJ2.x, jJ2.y, jJ2.z)
            
            # Check for common joints (connected at endpoints)
            common_joints = {f1.jointI, f1.jointJ}.intersection({f2.jointI, f2.jointJ})
            if common_joints:
                continue # Already connected
            
            intersection = get_segment_intersection(p1_start, p1_end, p2_start, p2_end)
            if intersection:
                # print(f"Intersection between Frame {f1.id} and {f2.id} at {intersection}")
                add_split(f1.id, intersection)
                add_split(f2.id, intersection)

    # C. Apply Splits
    if not frame_splits:
        return model # No changes
        
    new_frames = []
    # Keep frames that weren't split
    for f in model.frames:
        if f.id not in frame_splits:
            new_frames.append(f)
            
    # Process split frames
    result_joints = list(model.joints)
    
    # We need to assign existing joint IDs if the split point matches an existing joint
    # OR create new joints if it's a new point (crossing)
    
    next_frame_id = max([f.id for f in model.frames]) + 1
    
    for f_id, splits in frame_splits.items():
        original_frame = next(f for f in model.frames if f.id == f_id)
        
        # Sort splits by distance from start
        splits.sort(key=lambda x: x[0])
        
        current_start_node = original_frame.jointI
        
        for _, pt in splits:
            # Check if this point matches an existing joint
            match_joint = None
            for j in result_joints:
                if np.linalg.norm(np.array([j.x, j.y, j.z]) - np.array(pt)) < 1e-4:
                    match_joint = j
                    break
            
            if match_joint:
                mid_node_id = match_joint.id
            else:
                # Create ne joint
                mid_node_id = next_joint_id
                new_joint = Joint(id=mid_node_id, x=pt[0], y=pt[1], z=pt[2])
                result_joints.append(new_joint)
                next_joint_id += 1
            
            # Create segment
            new_frame = Frame(
                id=next_frame_id,
                jointI=current_start_node,
                jointJ=mid_node_id,
                sectionId=original_frame.sectionId,
                orientation=original_frame.orientation,
                offsetY=original_frame.offsetY,
                offsetZ=original_frame.offsetZ
            )
            new_frames.append(new_frame)
            next_frame_id += 1
            
            current_start_node = mid_node_id
            
        # Final segment
        new_frame = Frame(
            id=next_frame_id,
            jointI=current_start_node,
            jointJ=original_frame.jointJ,
            sectionId=original_frame.sectionId,
            orientation=original_frame.orientation,
            offsetY=original_frame.offsetY,
            offsetZ=original_frame.offsetZ
        )
        new_frames.append(new_frame)
        next_frame_id += 1

    # Update model
    model.joints = result_joints
    model.frames = new_frames
    
    # print(f"Preprocessing complete. Total Joints: {len(model.joints)}, Total Frames: {len(model.frames)}")
    return model

def analyze_structure(model: StructuralModel, load_case_id: str, config: Optional['SolverConfig'] = None) -> AnalysisResults:
    from models import SolverConfig
    
    # Use default config if not provided
    if config is None:
        config = SolverConfig()
    
    log = []
    
    # 0. Preprocess: Handle Intersections (Optional)
    if config.enable_intersection_check:
        log.append("Running intersection detection...")
        model = preprocess_intersections(model)
    else:
        log.append("Skipping intersection detection (disabled in config)")

    start_time = time.time()
    try:
        log.append('Starting analysis...')
        
        load_case = next((lc for lc in model.loadCases if lc.id == load_case_id), None)
        if not load_case:
            raise ValueError(f"Load case {load_case_id} not found")

        # 1. Mesh the model
        SEGMENTS = min(max(config.meshing_segments, 1), 20)  # Clamp to [1, 20]
        solver_joints: List[Joint] = list(model.joints)
        next_internal_joint_id = -1
        next_internal_frame_id = -1
        
        frame_mapping: Dict[int, Dict[str, List[int]]] = {} # frame_id -> {jointIndices: []}
        solver_frames: List[Frame] = []
        
        # Helper to find joint index
        # Optimize this: map ID to index
        joint_id_to_index = {j.id: i for i, j in enumerate(solver_joints)}
        
        for frame in model.frames:
            start_joint_idx = joint_id_to_index.get(frame.jointI)
            end_joint_idx = joint_id_to_index.get(frame.jointJ)
            
            if start_joint_idx is None or end_joint_idx is None:
                log.append(f"Error: Invalid joints for frame {frame.id}")
                continue
                
            start_joint = solver_joints[start_joint_idx]
            end_joint = solver_joints[end_joint_idx]
            
            internal_joint_indices = [start_joint_idx]
            prev_joint_idx = start_joint_idx
            
            # Create segments
            for i in range(1, SEGMENTS):
                t = i / SEGMENTS
                x = start_joint.x + (end_joint.x - start_joint.x) * t
                y = start_joint.y + (end_joint.y - start_joint.y) * t
                z = start_joint.z + (end_joint.z - start_joint.z) * t
                
                new_joint = Joint(
                    id=next_internal_joint_id,
                    x=x, y=y, z=z,
                    restraint=get_default_restraint()
                )
                next_internal_joint_id -= 1
                
                solver_joints.append(new_joint)
                new_index = len(solver_joints) - 1
                joint_id_to_index[new_joint.id] = new_index
                internal_joint_indices.append(new_index)
                
                sub_frame = Frame(
                    id=next_internal_frame_id,
                    jointI=solver_joints[prev_joint_idx].id,
                    jointJ=new_joint.id,
                    sectionId=frame.sectionId,
                    orientation=frame.orientation,
                    offsetY=frame.offsetY,
                    offsetZ=frame.offsetZ
                )
                next_internal_frame_id -= 1
                solver_frames.append(sub_frame)
                prev_joint_idx = new_index
                
            # Final segment
            internal_joint_indices.append(end_joint_idx)
            last_sub_frame = Frame(
                id=next_internal_frame_id,
                jointI=solver_joints[prev_joint_idx].id,
                jointJ=end_joint.id,
                sectionId=frame.sectionId,
                orientation=frame.orientation,
                offsetY=frame.offsetY,
                offsetZ=frame.offsetZ
            )
            next_internal_frame_id -= 1
            solver_frames.append(last_sub_frame)
            
            frame_mapping[frame.id] = {'jointIndices': internal_joint_indices}
            
        log.append(f"Meshed model: {len(model.joints)} -> {len(solver_joints)} joints, {len(model.frames)} -> {len(solver_frames)} elements.")
        
        node_count = len(solver_joints)
        dof_per_node = 6
        total_dof = node_count * dof_per_node
        
        
        log.append(f"System DOF: {total_dof}")
        
        # Use sparse or dense matrices based on config
        use_sparse = config.use_sparse_solver and total_dof > 100  # Only use sparse for larger systems
        
        if use_sparse:
            log.append(f"Using sparse matrix solver (DOF={total_dof})")
            K = create_sparse_matrix(total_dof)
        else:
            log.append(f"Using dense matrix solver (DOF={total_dof})")
            K = np.zeros((total_dof, total_dof))
        
        F = np.zeros(total_dof)
        
        def get_dof_index(node_idx: int, local_dof: int):
            return node_idx * dof_per_node + local_dof
            
        # Assemble Stiffness
        for frame in solver_frames:
            start_node_idx = joint_id_to_index.get(frame.jointI)
            end_node_idx = joint_id_to_index.get(frame.jointJ)
            
            if start_node_idx is None or end_node_idx is None: 
                continue
                
            joint_i = solver_joints[start_node_idx]
            joint_j = solver_joints[end_node_idx]
            
            section = next((s for s in model.frameSections if s.id == frame.sectionId), None)
            material = next((m for m in model.materials if m.id == section.materialId), None) if section else None
            
            if not section or not material:
                continue
                
            k_local = frame_element_stiffness(joint_i, joint_j, section, material)
            T = frame_transformation_matrix(joint_i, joint_j, frame.orientation)
            k_global = transform_stiffness_to_global(k_local, T)
            
            # Assembly indices
            dofs = []
            for node_idx in [start_node_idx, end_node_idx]:
                base = node_idx * 6
                dofs.extend([base + k for k in range(6)])
                
            if use_sparse:
                assemble_sparse(K, k_global, dofs)
            else:
                assemble_global(K, k_global, dofs)
            
        # Apply Loads
        for pattern_case in load_case.patterns:
            pattern = next((p for p in model.loadPatterns if p.id == pattern_case.patternId), None)
            if not pattern: continue
            
            scale = pattern_case.scale
            
            # Self Weight
            if pattern.selfWeight:
                for frame in solver_frames:
                    start_node_idx = joint_id_to_index.get(frame.jointI)
                    end_node_idx = joint_id_to_index.get(frame.jointJ)
                    if start_node_idx is None or end_node_idx is None: continue
                    
                    section = next((s for s in model.frameSections if s.id == frame.sectionId), None)
                    material = next((m for m in model.materials if m.id == section.materialId), None) if section else None
                    
                    if section and material:
                        w = material.density * section.properties.A * GRAVITY
                        
                        joint_i = solver_joints[start_node_idx]
                        joint_j = solver_joints[end_node_idx]
                        L = math.sqrt((joint_j.x - joint_i.x)**2 + (joint_j.y - joint_i.y)**2 + (joint_j.z - joint_i.z)**2)
                        
                        total_weight = w * L
                        nodal_load = (total_weight / 2) * scale
                        
                        # Apply in Global Y (-Y for gravity)
                        # DOF 1 is Y
                        F[get_dof_index(start_node_idx, 1)] -= nodal_load
                        F[get_dof_index(end_node_idx, 1)] -= nodal_load
            
            # Point Loads
            for load in model.pointLoads:
                if load.patternId != pattern.id: continue
                
                joint_idx = joint_id_to_index.get(load.jointId)
                if joint_idx is not None:
                    F[get_dof_index(joint_idx, 0)] += load.fx * scale * 1000
                    F[get_dof_index(joint_idx, 1)] += load.fy * scale * 1000
                    F[get_dof_index(joint_idx, 2)] += load.fz * scale * 1000
                    F[get_dof_index(joint_idx, 3)] += load.mx * scale * 1000
                    F[get_dof_index(joint_idx, 4)] += load.my * scale * 1000
                    F[get_dof_index(joint_idx, 5)] += load.mz * scale * 1000
                    
            # Distributed Loads (Complex)
            for load in model.distributedFrameLoads:
                if load.patternId != pattern.id: continue
                
                frame = next((f for f in model.frames if f.id == load.frameId), None)
                if not frame: continue
                
                mapping = frame_mapping.get(frame.id)
                if not mapping: continue
                
                start_joint = next((j for j in model.joints if j.id == frame.jointI), None)
                end_joint = next((j for j in model.joints if j.id == frame.jointJ), None)
                
                total_length = math.sqrt(
                    (end_joint.x - start_joint.x)**2 + 
                    (end_joint.y - start_joint.y)**2 + 
                    (end_joint.z - start_joint.z)**2
                )
                
                indices = mapping['jointIndices']
                for i in range(len(indices) - 1):
                    idx_a = indices[i]
                    idx_b = indices[i+1]
                    node_a = solver_joints[idx_a]
                    node_b = solver_joints[idx_b]
                    
                    dist_a = math.sqrt((node_a.x - start_joint.x)**2 + (node_a.y - start_joint.y)**2 + (node_a.z - start_joint.z)**2)
                    dist_b = math.sqrt((node_b.x - start_joint.x)**2 + (node_b.y - start_joint.y)**2 + (node_b.z - start_joint.z)**2)
                    
                    ratio_a = dist_a / total_length
                    ratio_b = dist_b / total_length
                    
                    start_ratio = load.startDistance
                    end_ratio = load.endDistance
                    
                    if ratio_b <= start_ratio or ratio_a >= end_ratio: continue
                    
                    active_start = max(ratio_a, start_ratio)
                    active_end = min(ratio_b, end_ratio)
                    
                    load_range = max(0.0001, end_ratio - start_ratio)
                    w_start = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ((active_start - start_ratio) / load_range)
                    w_end = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ((active_end - start_ratio) / load_range)
                    
                    w_avg = (w_start + w_end) / 2
                    segment_len = (active_end - active_start) * total_length
                    total_force = w_avg * segment_len * scale * 1000
                    
                    fx, fy, fz = 0., 0., 0.
                    
                    if load.direction.startswith('Global'):
                        if load.direction == 'GlobalX': fx = 1.
                        if load.direction == 'GlobalY': fy = 1.
                        if load.direction == 'GlobalZ': fz = 1.
                    elif load.direction == 'Gravity':
                        fy = -1.
                    elif load.direction.startswith('Local'):
                        # Calculate Local Axes
                        dx = end_joint.x - start_joint.x
                        dy = end_joint.y - start_joint.y
                        dz = end_joint.z - start_joint.z
                        L_vec = math.sqrt(dx*dx + dy*dy + dz*dz)
                        lx = [dx/L_vec, dy/L_vec, dz/L_vec]
                        
                        up = [0., 1., 0.]
                        if abs(lx[1]) > 0.99: up = [1., 0., 0.]
                        
                        lz = np.cross(lx, up)
                        lz = lz / np.linalg.norm(lz)
                        ly = np.cross(lz, lx)
                        
                        rad = (frame.orientation or 0) * math.pi / 180
                        c = math.cos(rad)
                        s = math.sin(rad)
                        
                        ly_rot = ly * c + lz * s
                        lz_rot = -ly * s + lz * c
                        
                        if load.direction == 'LocalX': fx, fy, fz = lx
                        if load.direction == 'LocalY': fx, fy, fz = ly_rot
                        if load.direction == 'LocalZ': fx, fy, fz = lz_rot
                        
                    f_node = total_force / 2
                    
                    F[get_dof_index(idx_a, 0)] += fx * f_node
                    F[get_dof_index(idx_a, 1)] += fy * f_node
                    F[get_dof_index(idx_a, 2)] += fz * f_node
                    
                    F[get_dof_index(idx_b, 0)] += fx * f_node
                    F[get_dof_index(idx_b, 1)] += fy * f_node
                    F[get_dof_index(idx_b, 2)] += fz * f_node

        # Apply Boundary Conditions
        free_dofs = []
        for i in range(node_count):
            joint = solver_joints[i]
            # Use default restraint if none (all false -> all free)
            restraint = joint.restraint or get_default_restraint()
            
            dof_base = i * 6
            if not restraint.ux: free_dofs.append(dof_base + 0)
            if not restraint.uy: free_dofs.append(dof_base + 1)
            if not restraint.uz: free_dofs.append(dof_base + 2)
            if not restraint.rx: free_dofs.append(dof_base + 3)
            if not restraint.ry: free_dofs.append(dof_base + 4)
            if not restraint.rz: free_dofs.append(dof_base + 5)
            
        n_free = len(free_dofs)
        
        # Reduced System
        log.append(f'Solving system... (Free DOF: {n_free})')
        
        if use_sparse:
            # For sparse matrices, use proper slicing
            K_reduced = K[free_dofs, :][:, free_dofs]
            F_reduced = F[free_dofs]
            u_reduced = solve_sparse(K_reduced, F_reduced)
        else:
            # For dense matrices, use np.ix_
            ix_grid = np.ix_(free_dofs, free_dofs)
            K_reduced = K[ix_grid]
            F_reduced = F[free_dofs]
            u_reduced = solve_linear_system(K_reduced, F_reduced)
        
        u_full = np.zeros(total_dof)
        u_full[free_dofs] = u_reduced
        
        # Extract Results
        displacements: List[JointDisplacement] = []
        for joint in model.joints:
            idx = joint_id_to_index.get(joint.id)
            if idx is not None:
                displacements.append(JointDisplacement(
                    jointId=joint.id,
                    ux=u_full[get_dof_index(idx, 0)],
                    uy=u_full[get_dof_index(idx, 1)],
                    uz=u_full[get_dof_index(idx, 2)],
                    rx=u_full[get_dof_index(idx, 3)],
                    ry=u_full[get_dof_index(idx, 4)],
                    rz=u_full[get_dof_index(idx, 5)],
                ))
                
        frame_detailed_results: Dict[str, DetailedFrameResult] = {}
        
        for orig_frame_id, mapping in frame_mapping.items():
            indices = mapping['jointIndices']
            detailed_disps = []
            for idx in indices:
                detailed_disps.append(JointDisplacement(
                    jointId=solver_joints[idx].id,
                    ux=u_full[get_dof_index(idx, 0)],
                    uy=u_full[get_dof_index(idx, 1)],
                    uz=u_full[get_dof_index(idx, 2)],
                    rx=u_full[get_dof_index(idx, 3)],
                    ry=u_full[get_dof_index(idx, 4)],
                    rz=u_full[get_dof_index(idx, 5)],
                ))
            
            # Placeholder forces initially
            frame_detailed_results[str(orig_frame_id)] = DetailedFrameResult(
                stations=[i / (len(indices) - 1) for i in range(len(indices))],
                displacements=detailed_disps,
                forces=[FrameForces(P=0, V2=0, V3=0, T=0, M2=0, M3=0) for _ in indices]
            )
            
        # Calculate Member Forces
        for frame_id_str, fdr in frame_detailed_results.items():
            orig_id = int(frame_id_str)
            frame = next((f for f in model.frames if f.id == orig_id), None)
            if not frame: continue
            
            section = next((s for s in model.frameSections if s.id == frame.sectionId), None)
            material = next((m for m in model.materials if m.id == section.materialId), None) if section else None
            
            if not section or not material: continue
            
            mapping = frame_mapping[orig_id]
            indices = mapping['jointIndices']
            
            for i in range(len(indices) - 1):
                idx_a = indices[i]
                idx_b = indices[i+1]
                node_a = solver_joints[idx_a]
                node_b = solver_joints[idx_b]
                
                u_a_vals = u_full[get_dof_index(idx_a, 0):get_dof_index(idx_a, 6)+1] # Slice? range is exclusive
                u_b_vals = u_full[get_dof_index(idx_b, 0):get_dof_index(idx_b, 6)+1]
                
                # Slices in numpy: stop is exclusive. 
                # idx_a * 6 to idx_a * 6 + 6
                sl_a = slice(idx_a * 6, idx_a * 6 + 6)
                sl_b = slice(idx_b * 6, idx_b * 6 + 6)
                u_a = u_full[sl_a]
                u_b = u_full[sl_b]
                
                forces = calculate_segment_forces(node_a, node_b, u_a, u_b, section, material, frame.orientation or 0)
                
                # FDR.forces is a list of Pydantic models. We need to replace them.
                # However, Pydantic models are immutable if frozen=True, but here they are standard.
                # Construct FrameForces object
                if i < len(fdr.forces):
                    fdr.forces[i] = forces['start']
                
                if i == len(indices) - 2:
                    fdr.forces[i+1] = forces['end']

        # Max Disp
        max_disp = 0
        for d in displacements:
            disp = math.sqrt(d.ux**2 + d.uy**2 + d.uz**2)
            if disp > max_disp: max_disp = disp
            
        # Reactions
        log.append('Calculating reactions...')
        # R = K * u - F
        # Use numpy matrix multiplication
        reaction_forces = K @ u_full - F
        
        reactions = []
        for joint in model.joints:
            idx = joint_id_to_index.get(joint.id)
            if idx is not None:
                base = idx * 6
                # Convert N -> kN, Nm -> kNm (divide by 1000)
                reactions.append(JointReaction(
                    jointId=joint.id,
                    fx=reaction_forces[base+0]/1000,
                    fy=reaction_forces[base+1]/1000,
                    fz=reaction_forces[base+2]/1000,
                    mx=reaction_forces[base+3]/1000,
                    my=reaction_forces[base+4]/1000,
                    mz=reaction_forces[base+5]/1000
                ))
        
        log.append('Analysis complete.')
        
        return AnalysisResults(
            loadCaseId=load_case_id,
            caseName=load_case.name,
            displacements=displacements,
            frameDetailedResults=frame_detailed_results,
            reactions=reactions,
            isValid=True,
            maxDisplacement=max_disp,
            timestamp=start_time * 1000,
            log=log
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return AnalysisResults(
            loadCaseId=load_case_id,
            displacements=[],
            reactions=[],
            frameDetailedResults=None,
            isValid=False,
            maxDisplacement=0,
            timestamp=start_time * 1000,
            log=log + [f"Error: {str(e)}"]
        )

def calculate_segment_forces(node_a, node_b, u_a, u_b, section, material, orientation):
    # Returns {'start': FrameForces, 'end': FrameForces}
    
    L = math.sqrt((node_b.x - node_a.x)**2 + (node_b.y - node_a.y)**2 + (node_b.z - node_a.z)**2)
    zero_forces = FrameForces(P=0, V2=0, V3=0, T=0, M2=0, M3=0)
    
    if L < 0.0001:
        return {'start': zero_forces, 'end': zero_forces}
        
    # Transformation
    cx = (node_b.x - node_a.x) / L
    cy = (node_b.y - node_a.y) / L
    cz = (node_b.z - node_a.z) / L
    
    beta = orientation * math.pi / 180
    
    R = np.zeros((3, 3))
    
    if abs(cx) < 0.001 and abs(cz) < 0.001:
        # Vertical
        if cy > 0:
            R[0, 1] = 1
            R[1, 0] = -1 * math.cos(beta); R[1, 2] = math.sin(beta)
            R[2, 0] = math.sin(beta); R[2, 2] = math.cos(beta)
        else:
            R[0, 1] = -1
            R[1, 0] = 1 * math.cos(beta); R[1, 2] = math.sin(beta)
            R[2, 0] = -math.sin(beta); R[2, 2] = math.cos(beta)
    else:
        C1 = math.sqrt(cx*cx + cz*cz)
        s = math.sin(beta)
        c = math.cos(beta)
        
        R[0, 0] = cx; R[0, 1] = cy; R[0, 2] = cz
        R[1, 0] = (-cx * cy * c - cz * s) / C1
        R[1, 1] = C1 * c
        R[1, 2] = (-cy * cz * c + cx * s) / C1
        R[2, 0] = (cx * cy * s - cz * c) / C1
        R[2, 1] = -C1 * s
        R[2, 2] = (cy * cz * s + cx * c) / C1
        
    u_a_trans = transform3(u_a[0:3], R)
    r_a_trans = transform3(u_a[3:6], R)
    u_b_trans = transform3(u_b[0:3], R)
    r_b_trans = transform3(u_b[3:6], R)
    
    E = material.E * 1e6
    G = material.G * 1e6
    A = section.properties.A
    Ix = section.properties.J # Torsion
    Iy = section.properties.Iy
    Iz = section.properties.Iz
    
    L2 = L * L
    L3 = L * L * L
    
    # Stiffness Coeffs
    k_bz_1 = (12 * E * Iz) / L3
    k_bz_2 = (6 * E * Iz) / L2
    k_bz_3 = (4 * E * Iz) / L
    k_bz_4 = (2 * E * Iz) / L
    
    k_by_1 = (12 * E * Iy) / L3
    k_by_2 = (6 * E * Iy) / L2
    k_by_3 = (4 * E * Iy) / L
    k_by_4 = (2 * E * Iy) / L
    
    # Forces
    
    # 1. Axial P
    # P = (EA/L) * (uB - uA)
    # Tension positive
    P = (E * A / L) * (u_b_trans[0] - u_a_trans[0])
    
    # 2. Torsion T
    T = (G * Ix / L) * (r_b_trans[0] - r_a_trans[0])
    
    # 3. Shear V2 (Major Shear / Shear Y) & Moment M3 (Major Moment / Moment Z)
    # Using stiffness eq for start node forces
    # Fy_A = k*u ...
    Fy_A = k_bz_1 * u_a_trans[1] + k_bz_2 * r_a_trans[2] - k_bz_1 * u_b_trans[1] + k_bz_2 * r_b_trans[2]
    Mz_A = k_bz_2 * u_a_trans[1] + k_bz_3 * r_a_trans[2] - k_bz_2 * u_b_trans[1] + k_bz_4 * r_b_trans[2]
    
    # End node forces
    # Fy_B ...
    # Easier: Equilibrium. Fy_B = -Fy_A (if no loads). 
    # Mz_B = ...
    
    # Internal Force Convention:
    # Shear V2 at start is Fy_A.
    # Moment M3 at start is -Mz_A (Standard convention: CCW reaction -> sagging negative? Check TS)
    # TS says: Moment M3 at start = -Mz_A
    
    V2 = Fy_A
    M3 = -Mz_A
    
    # 4. Shear V3 (Minor Shear / Shear Z) & Moment M2 (Minor Moment / Moment Y)
    # Bending in X-Z plane.
    # Fz_A = k_by_1 * uz_A + (-k_by_2) * ry_A + ... etc
    # Check checks signs on stiffness matrix in frame_element.py
    # k[2][2]=12... k[2][4]=-6...
    # Fz_A = k22*uzA + k24*ryA + k28*uzB + k2_10*ryB
    
    Fz_A = (12*E*Iy/L3) * u_a_trans[2] + (-6*E*Iy/L2) * r_a_trans[1] + (-12*E*Iy/L3) * u_b_trans[2] + (-6*E*Iy/L2) * r_b_trans[1]
    
    # My_A = k42*uzA + k44*ryA + ...
    # k42 = -6... k44=4...
    My_A = (-6*E*Iy/L2) * u_a_trans[2] + (4*E*Iy/L) * r_a_trans[1] + (6*E*Iy/L2) * u_b_trans[2] + (2*E*Iy/L) * r_b_trans[1]
    
    V3 = Fz_A
    M2 = My_A # Sign? Usually M at start is My_A.
    
    # Return same forces for start and end (assuming no loads on segment, linear interpolation in reality but here constant/step for simple)
    # Wait, simple beam theory says Shear matches, Moment varies linearly.
    # But if we mesh finely, constant assumption might be "okay" for visualization ??
    # TS code does:
    # frameDetailedResults[origId].forces[i] = segmentForces.start
    # ...
    # frameDetailedResults[origId].forces[i+1] = segmentForces.end
    
    # So we DO need end forces.
    
    # End Forces (Reactions at B)
    # P_B = -P_A (Equilibrium) = -P => But internal force P is constant. P is tension.
    
    # Shear V2 at end = -Fy_B ??
    # Internal V2(x) is constant if no load.
    # V2_end = V2_start?
    # Yes, if no load.
    
    # Moment M3 varies. M(x) = M_start + V*x
    # M3 at end (L) = M3_start + V2 * L
    # Check with Mz_B calculation
    # Mz_B = k...
    Mz_B = k_bz_2 * u_a_trans[1] + k_bz_4 * r_a_trans[2] - k_bz_2 * u_b_trans[1] + k_bz_3 * r_b_trans[2]
    # M_int_end = Mz_B. (Reaction at B is Mz_B. Internal moment at B is Mz_B)
    # Check signs.
    
    
    My_B = (6*E*Iy/L2) * u_a_trans[2] + (2*E*Iy/L) * r_a_trans[1] + (-6*E*Iy/L2) * u_b_trans[2] + (4*E*Iy/L) * r_b_trans[1]
    
    # Let's stick with stiffness results which are accurate for nodal equilibrium.
    M3_end = Mz_B
    M2_end = -My_B 

    # Convert to kN and kNm
    start_forces = FrameForces(
        P=P/1000.0, 
        V2=V2/1000.0, 
        V3=V3/1000.0, 
        T=T/1000.0, 
        M2=M2/1000.0, 
        M3=M3/1000.0
    )
    
    end_forces = FrameForces(
        P=P/1000.0, 
        V2=V2/1000.0, 
        V3=V3/1000.0, 
        T=T/1000.0, 
        M2=M2_end/1000.0, 
        M3=M3_end/1000.0
    )
    
    return {'start': start_forces, 'end': end_forces}

def transform3(vec, rot_local):
    return [
        rot_local[0,0]*vec[0] + rot_local[0,1]*vec[1] + rot_local[0,2]*vec[2],
        rot_local[1,0]*vec[0] + rot_local[1,1]*vec[1] + rot_local[1,2]*vec[2],
        rot_local[2,0]*vec[0] + rot_local[2,1]*vec[1] + rot_local[2,2]*vec[2]
    ]

def combine_results(combination: LoadCombination, results_map: Dict[str, AnalysisResults]) -> AnalysisResults:
    log = [f"Combining results for {combination.name}..."]
    
    disp_map: Dict[int, JointDisplacement] = {}
    frame_det_map: Dict[int, DetailedFrameResult] = {}
    
    try:
        # Check presence
        for case in combination.cases:
            if case.caseId not in results_map:
                raise ValueError(f"Missing results for {case.caseId}")
                
        for case in combination.cases:
            result = results_map[case.caseId]
            scale = case.scale
            
            # Combine Displacements
            for d in result.displacements:
                if d.jointId not in disp_map:
                    disp_map[d.jointId] = JointDisplacement(
                        jointId=d.jointId, ux=0, uy=0, uz=0, rx=0, ry=0, rz=0
                    )
                target = disp_map[d.jointId]
                target.ux += d.ux * scale
                target.uy += d.uy * scale
                target.uz += d.uz * scale
                target.rx += d.rx * scale
                target.ry += d.ry * scale
                target.rz += d.rz * scale
                
            # Combine Detailed Results
            if result.frameDetailedResults:
                for fid_str, detail in result.frameDetailedResults.items():
                    fid = int(fid_str)
                    if fid not in frame_det_map:
                        # Init
                        frame_det_map[fid] = DetailedFrameResult(
                            stations=detail.stations,
                            displacements=[JointDisplacement(
                                jointId=jd.jointId, ux=0, uy=0, uz=0, rx=0, ry=0, rz=0
                            ) for jd in detail.displacements],
                            forces=[FrameForces(P=0,V2=0,V3=0,T=0,M2=0,M3=0) for _ in detail.forces]
                        )
                        
                    target = frame_det_map[fid]
                    
                    # Add Disps
                    for i, d in enumerate(detail.displacements):
                        t = target.displacements[i]
                        t.ux += d.ux * scale
                        t.uy += d.uy * scale
                        t.uz += d.uz * scale
                        t.rx += d.rx * scale
                        t.ry += d.ry * scale
                        t.rz += d.rz * scale
                        
                    # Add Forces
                    for i, f in enumerate(detail.forces):
                        t = target.forces[i]
                        t.P += f.P * scale
                        t.V2 += f.V2 * scale
                        t.V3 += f.V3 * scale
                        t.T += f.T * scale
                        t.M2 += f.M2 * scale
                        t.M3 += f.M3 * scale
        
        # Combine Reactions
        reaction_map = {}
        for case in combination.cases:
            result = results_map[case.caseId]
            scale = case.scale
            for r in result.reactions:
                if r.jointId not in reaction_map:
                    reaction_map[r.jointId] = JointReaction(
                        jointId=r.jointId, fx=0, fy=0, fz=0, mx=0, my=0, mz=0
                    )
                t = reaction_map[r.jointId]
                t.fx += r.fx * scale
                t.fy += r.fy * scale
                t.fz += r.fz * scale
                t.mx += r.mx * scale
                t.my += r.my * scale
                t.mz += r.mz * scale
                
        max_disp = 0
        for d in disp_map.values():
            val = math.sqrt(d.ux**2 + d.uy**2 + d.uz**2)
            if val > max_disp: max_disp = val
            
        return AnalysisResults(
            loadCaseId=combination.id,
            caseName=combination.name,
            displacements=list(disp_map.values()),
            frameDetailedResults={str(k): v for k, v in frame_det_map.items()},
            reactions=list(reaction_map.values()),
            isValid=True,
            maxDisplacement=max_disp,
            timestamp=time.time()*1000,
            log=log
        )

    except Exception as e:
        return AnalysisResults(
            loadCaseId=combination.id,
            displacements=[],
            reactions=[],
            isValid=False,
            maxDisplacement=0,
            timestamp=time.time()*1000,
            log=log + [f"Error: {e}"]
        )
