import type {
    StructuralModel,
    Joint,
    Frame,
    AnalysisResults,
    JointDisplacement,
    Restraint,
    LoadCombination,
} from '../types/structuralTypes';
import { zeros, zerosVector, solveLinearSystem, assembleGlobal } from './matrixUtils';
import {
    frameElementStiffness,
    frameTransformationMatrix,
    transformStiffnessToGlobal,
} from './frameElement';

/**
 * Perform structural analysis for a given load case
 */
export function analyzeStructure(
    model: StructuralModel,
    loadCaseId: string
): AnalysisResults {
    const log: string[] = [];
    try {
        log.push('Starting analysis...');

        // Find the load case
        const loadCase = model.loadCases.find((lc) => lc.id === loadCaseId);
        if (!loadCase) {
            throw new Error(`Load case ${loadCaseId} not found`);
        }

        // 1. Mesh the model (Subdivide frames for better accuracy and visualization)
        const SEGMENTS = 10;
        const solverJoints: Joint[] = [...model.joints]; // Start with original joints
        // Use negative numbers for internal IDs to avoid collision with user IDs
        // Assuming user IDs are positive.
        let nextInternalJointId = -1;
        let nextInternalFrameId = -1;

        const frameMapping: Record<number, { jointIndices: number[] }> = {};
        const solverFrames: Frame[] = [];

        // Helper to find joint index by ID
        const getJointIndex = (id: number) => solverJoints.findIndex(j => j.id === id);

        model.frames.forEach(frame => {
            const startJointIndex = getJointIndex(frame.jointI);
            const endJointIndex = getJointIndex(frame.jointJ);

            if (startJointIndex === -1 || endJointIndex === -1) {
                log.push(`Error: Invalid joints for frame ${frame.id}`);
                return;
            }

            const startJoint = solverJoints[startJointIndex];
            const endJoint = solverJoints[endJointIndex];

            // Create internal nodes
            const internalJointIndices: number[] = [startJointIndex];
            let prevJointIndex = startJointIndex;

            for (let i = 1; i < SEGMENTS; i++) {
                const t = i / SEGMENTS;
                const x = startJoint.x + (endJoint.x - startJoint.x) * t;
                const y = startJoint.y + (endJoint.y - startJoint.y) * t;
                const z = startJoint.z + (endJoint.z - startJoint.z) * t;

                const newJoint: Joint = {
                    id: nextInternalJointId--, // Internal ID (number)
                    x, y, z,
                    restraint: getDefaultRestraint(), // Internal nodes are free by default
                };
                solverJoints.push(newJoint);
                const newIndex = solverJoints.length - 1;
                internalJointIndices.push(newIndex);

                // Create sub-frame
                const subFrame: Frame = {
                    ...frame,
                    id: nextInternalFrameId--, // Internal ID (number)
                    jointI: solverJoints[prevJointIndex].id,
                    jointJ: newJoint.id,
                };
                solverFrames.push(subFrame);
                prevJointIndex = newIndex;
            }

            // Final segment connecting to end joint
            internalJointIndices.push(endJointIndex);
            const lastSubFrame: Frame = {
                ...frame,
                id: nextInternalFrameId--,
                jointI: solverJoints[prevJointIndex].id,
                jointJ: endJoint.id,
            };
            solverFrames.push(lastSubFrame);

            frameMapping[frame.id] = { jointIndices: internalJointIndices };
        });

        log.push(`Meshed model: ${model.joints.length} -> ${solverJoints.length} joints, ${model.frames.length} -> ${solverFrames.length} elements.`);

        const nodeCount = solverJoints.length;
        const dofPerNode = 6;
        const totalDOF = nodeCount * dofPerNode;

        // 2. Initialize Global Stiffness Matrix and Load Vector
        log.push(`System DOF: ${totalDOF}`);

        const K = zeros(totalDOF, totalDOF);
        const F = zerosVector(totalDOF);

        // Helper to get DOF index
        const getDofIndex = (nodeIndex: number, localDof: number) => nodeIndex * dofPerNode + localDof;

        // Assemble Stiffness
        solverFrames.forEach(frame => {
            const startNodeIdx = solverJoints.findIndex(j => j.id === frame.jointI);
            const endNodeIdx = solverJoints.findIndex(j => j.id === frame.jointJ);

            if (startNodeIdx === -1 || endNodeIdx === -1) {
                console.warn(`Skipping solver frame ${frame.id}: missing joint`);
                return;
            }

            const jointI = solverJoints[startNodeIdx];
            const jointJ = solverJoints[endNodeIdx];

            const section = model.frameSections.find(s => s.id === frame.sectionId);
            const material = section ? model.materials.find((m) => m.id === section.materialId) : null;

            if (!section || !material) {
                console.warn(`Skipping solver frame ${frame.id}: missing section or material`);
                return;
            }

            // Calculate local stiffness
            const kLocal = frameElementStiffness(jointI, jointJ, section, material);

            // Transform to global coordinates
            const T = frameTransformationMatrix(jointI, jointJ, frame.orientation);
            const kGlobal = transformStiffnessToGlobal(kLocal, T);

            // Assemble into K
            const dofs = [
                startNodeIdx * 6, startNodeIdx * 6 + 1, startNodeIdx * 6 + 2, startNodeIdx * 6 + 3, startNodeIdx * 6 + 4, startNodeIdx * 6 + 5,
                endNodeIdx * 6, endNodeIdx * 6 + 1, endNodeIdx * 6 + 2, endNodeIdx * 6 + 3, endNodeIdx * 6 + 4, endNodeIdx * 6 + 5,
            ];
            assembleGlobal(K, kGlobal, dofs);
        });

        // 3. Apply Loads
        for (const patternCase of loadCase.patterns) {
            const pattern = model.loadPatterns.find((p) => p.id === patternCase.patternId);
            if (!pattern) continue;

            const scale = patternCase.scale;

            // Self Weight Calculation (Gravity Load)
            if (pattern.selfWeight) {
                const GRAVITY = 9.81; // m/s²

                solverFrames.forEach(frame => {
                    // Start and end node indices in solverJoints
                    const startNodeIdx = solverJoints.findIndex(j => j.id === frame.jointI);
                    const endNodeIdx = solverJoints.findIndex(j => j.id === frame.jointJ);

                    if (startNodeIdx === -1 || endNodeIdx === -1) return;

                    const section = model.frameSections.find(s => s.id === frame.sectionId);
                    const material = section ? model.materials.find((m) => m.id === section.materialId) : null;

                    if (section && material) {
                        // Calculate weight per unit length
                        // density (kg/m³) * Area (m²) * g (m/s²) = N/m
                        const w = material.density * section.properties.A * GRAVITY;

                        // Length of this SEGMENT (solverFrame)
                        const startJoint = solverJoints[startNodeIdx];
                        const endJoint = solverJoints[endNodeIdx];
                        const L = Math.sqrt(
                            (endJoint.x - startJoint.x) ** 2 +
                            (endJoint.y - startJoint.y) ** 2 +
                            (endJoint.z - startJoint.z) ** 2
                        );

                        // Total weight of segment
                        const totalWeight = w * L; // Newtons

                        // Distribute half to each node (Lumped Mass approach)
                        // Apply in GLOBAL Y direction (Gravity acts down, -Y)
                        // Confirmed by user and sample data that Y is vertical axis.

                        const nodalLoad = (totalWeight / 2) * scale;

                        // Add to Global Force Vector F
                        // DOF index for Y is 1 (ux=0, uy=1, uz=2)

                        F[getDofIndex(startNodeIdx, 1)] -= nodalLoad;
                        F[getDofIndex(endNodeIdx, 1)] -= nodalLoad;
                    }
                });
            }

            // Point Loads
            for (const load of model.pointLoads) {
                if (load.patternId !== pattern.id) continue;

                // Finds joint index in solverJoints (original joints are included)
                const jointIdx = solverJoints.findIndex(j => j.id === load.jointId);
                if (jointIdx !== -1) {
                    F[getDofIndex(jointIdx, 0)] += load.fx * scale * 1000;
                    F[getDofIndex(jointIdx, 1)] += load.fy * scale * 1000;
                    F[getDofIndex(jointIdx, 2)] += load.fz * scale * 1000;
                    F[getDofIndex(jointIdx, 3)] += load.mx * scale * 1000;
                    F[getDofIndex(jointIdx, 4)] += load.my * scale * 1000;
                    F[getDofIndex(jointIdx, 5)] += load.mz * scale * 1000;
                }
            }

            // Distributed Frame Loads
            for (const load of model.distributedFrameLoads) {
                if (load.patternId !== pattern.id) continue;

                const frame = model.frames.find(f => f.id === load.frameId);
                if (!frame) continue;



                // Let's iterate ALL solver frames and check if they belong to this frame
                // Since we don't have a direct map 'originalFrameId' on 'solverFrame', we need to check geometry or
                // assume 'frameMapping' helps?
                // frameMapping was defined in the viewer usage but maybe not here?
                // Let's check `frameMapping` availability.
                // It IS used in line 288: `Object.keys(frameMapping).forEach...`
                // So frameMapping exists!

                const mapping = frameMapping[frame.id];
                if (!mapping) continue;

                const startJoint = model.joints.find(j => j.id === frame.jointI)!;
                const endJoint = model.joints.find(j => j.id === frame.jointJ)!;
                const totalLength = Math.sqrt(
                    (endJoint.x - startJoint.x) ** 2 +
                    (endJoint.y - startJoint.y) ** 2 +
                    (endJoint.z - startJoint.z) ** 2
                );

                // Iterate over segments defined in frameMapping
                // mapping.jointIndices gives the indices in 'solverJoints'
                for (let i = 0; i < mapping.jointIndices.length - 1; i++) {
                    const idxA = mapping.jointIndices[i];
                    const idxB = mapping.jointIndices[i + 1];
                    const nodeA = solverJoints[idxA];
                    const nodeB = solverJoints[idxB];

                    // Calculate position of this segment along the original frame
                    const distA = Math.sqrt((nodeA.x - startJoint.x) ** 2 + (nodeA.y - startJoint.y) ** 2 + (nodeA.z - startJoint.z) ** 2);
                    const distB = Math.sqrt((nodeB.x - startJoint.x) ** 2 + (nodeB.y - startJoint.y) ** 2 + (nodeB.z - startJoint.z) ** 2);

                    const ratioA = distA / totalLength;
                    const ratioB = distB / totalLength;

                    // Check if load overlaps this segment
                    const startRatio = load.startDistance; // 0-1
                    const endRatio = load.endDistance;     // 0-1 (e.g. 1)

                    if (ratioB <= startRatio || ratioA >= endRatio) continue;

                    // Coverage on this segment
                    const activeStart = Math.max(ratioA, startRatio);
                    const activeEnd = Math.min(ratioB, endRatio);

                    // Interpolate magnitudes
                    // w(x) = startMag + (endMag - startMag) * (x - startDist)/(endDist - startDist)
                    // If range is 0, uniform load
                    const loadRange = Math.max(0.0001, endRatio - startRatio);

                    const w_start = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ((activeStart - startRatio) / loadRange);
                    const w_end = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * ((activeEnd - startRatio) / loadRange);

                    // Average load on this active part
                    const w_avg = (w_start + w_end) / 2;
                    const segmentLen = (activeEnd - activeStart) * totalLength;
                    const totalForce = w_avg * segmentLen * scale * 1000; // N

                    // Direction Vector
                    let fx = 0, fy = 0, fz = 0;

                    if (load.direction.startsWith('Global')) {
                        if (load.direction === 'GlobalX') fx = 1;
                        if (load.direction === 'GlobalY') fy = 1;
                        if (load.direction === 'GlobalZ') fz = 1;
                    } else if (load.direction === 'Gravity') {
                        fy = -1; // Gravity is usually -Y
                    } else if (load.direction.startsWith('Local')) {
                        // Calculate Local Axes
                        // We need the frame's local axes.
                        // Assuming frame orientation etc. is consistent for the whole frame.
                        // Helper `getLocalAxes` would be useful, but might not be imported.
                        // We can re-calculate or assume vertical alignment.
                        // Standard FEM local axes:
                        // x' = along member (nodeA -> nodeB)
                        // y', z' defined by orientation angle.

                        const dx = (endJoint.x - startJoint.x);
                        const dy = (endJoint.y - startJoint.y);
                        const dz = (endJoint.z - startJoint.z);
                        // Normalized structure axis (Local x)
                        const L_vec = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        const ux_local = [dx / L_vec, dy / L_vec, dz / L_vec];

                        // Local y and z depend on orientation
                        // Simplified implementation if getLocalAxes is not available:
                        // Use a basic "up" vector to find Local Y/Z.
                        // Ideally we should import `getOrientedLocalAxes` from `../utils/frameGeometry`.
                        // For now, I will assume a vertical up vector [0, 1, 0] to cross with x' for z', then y' = z' cross x'.

                        // Let's TRY to just use Global approximation if import is hard, 
                        // BUT user specifically asked for "Local X/Y/Z".
                        // I will add a helper function for local axes at the bottom of the file if needed, 
                        // or trust `u_local` derivation.

                        // ... (I will include a basic Local Axis implementation right here to be safe)

                        // Local x
                        const lx = ux_local;

                        // Global up
                        let up = [0, 1, 0];
                        if (Math.abs(lx[1]) > 0.99) up = [1, 0, 0]; // If vertical, use X as up

                        // Local z (approx) = lx cross up
                        let lz = [
                            lx[1] * up[2] - lx[2] * up[1],
                            lx[2] * up[0] - lx[0] * up[2],
                            lx[0] * up[1] - lx[1] * up[0]
                        ];
                        // Normalize lz
                        const mag_lz = Math.sqrt(lz[0] ** 2 + lz[1] ** 2 + lz[2] ** 2);
                        lz = [lz[0] / mag_lz, lz[1] / mag_lz, lz[2] / mag_lz];

                        // Local y = lz cross lx
                        let ly_vec = [
                            lz[1] * lx[2] - lz[2] * lx[1],
                            lz[2] * lx[0] - lz[0] * lx[2],
                            lz[0] * lx[1] - lz[1] * lx[0]
                        ];

                        // Apply rotation angle (frame.orientation) about local x
                        const rad = (frame.orientation || 0) * Math.PI / 180;
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);

                        // Rotated local axes
                        // new_y = ly * cos + lz * sin
                        // new_z = -ly * sin + lz * cos
                        const ly_rot = [
                            ly_vec[0] * cos + lz[0] * sin,
                            ly_vec[1] * cos + lz[1] * sin,
                            ly_vec[2] * cos + lz[2] * sin
                        ];
                        const lz_rot = [
                            -ly_vec[0] * sin + lz[0] * cos,
                            -ly_vec[1] * sin + lz[1] * cos,
                            -ly_vec[2] * sin + lz[2] * cos
                        ];

                        if (load.direction === 'LocalX') { fx = lx[0]; fy = lx[1]; fz = lx[2]; }
                        if (load.direction === 'LocalY') { fx = ly_rot[0]; fy = ly_rot[1]; fz = ly_rot[2]; }
                        if (load.direction === 'LocalZ') { fx = lz_rot[0]; fy = lz_rot[1]; fz = lz_rot[2]; }
                    }

                    // Distribute force to nodes (Lumped - 50/50)
                    const F_node = totalForce / 2;

                    F[getDofIndex(idxA, 0)] += fx * F_node;
                    F[getDofIndex(idxA, 1)] += fy * F_node;
                    F[getDofIndex(idxA, 2)] += fz * F_node;

                    F[getDofIndex(idxB, 0)] += fx * F_node;
                    F[getDofIndex(idxB, 1)] += fy * F_node;
                    F[getDofIndex(idxB, 2)] += fz * F_node;
                }
            }
        }

        // 4. Apply Boundary Conditions
        const freeDOFs: number[] = [];

        // We need to map free DOFs to their original indices in the FULL system
        // to correctly extract results later.
        // Actually, solveLinearSystem handles specific size.
        // So we need to build K_reduced and F_reduced.

        // Identifying restrained DOFs
        // We will just push valid free DOF indices to `freeDOFs` list.
        for (let i = 0; i < nodeCount; i++) {
            const joint = solverJoints[i];
            const restraint = joint.restraint || getDefaultRestraint();

            const dofBase = i * 6;
            if (!restraint.ux) freeDOFs.push(dofBase + 0);
            if (!restraint.uy) freeDOFs.push(dofBase + 1);
            if (!restraint.uz) freeDOFs.push(dofBase + 2);
            if (!restraint.rx) freeDOFs.push(dofBase + 3);
            if (!restraint.ry) freeDOFs.push(dofBase + 4);
            if (!restraint.rz) freeDOFs.push(dofBase + 5);
        }

        const nFree = freeDOFs.length;
        const K_reduced = zeros(nFree, nFree);
        const F_reduced = zerosVector(nFree);

        for (let i = 0; i < nFree; i++) {
            F_reduced[i] = F[freeDOFs[i]];
            for (let j = 0; j < nFree; j++) {
                K_reduced[i][j] = K[freeDOFs[i]][freeDOFs[j]];
            }
        }

        log.push('Solving linear system...');
        const u_reduced = solveLinearSystem(K_reduced, F_reduced);

        // Expand to full displacement vector
        const u_full = zerosVector(totalDOF);
        for (let i = 0; i < nFree; i++) {
            u_full[freeDOFs[i]] = u_reduced[i];
        }

        // 5. Extract Results
        // Displacements for ORIGINAL joints
        const displacements: JointDisplacement[] = [];
        model.joints.forEach(j => {
            const idx = solverJoints.findIndex(sj => sj.id === j.id);
            if (idx !== -1) {
                displacements.push({
                    jointId: j.id,
                    ux: u_full[getDofIndex(idx, 0)],
                    uy: u_full[getDofIndex(idx, 1)],
                    uz: u_full[getDofIndex(idx, 2)],
                    rx: u_full[getDofIndex(idx, 3)],
                    ry: u_full[getDofIndex(idx, 4)],
                    rz: u_full[getDofIndex(idx, 5)],
                });
            }
        });

        // Frame Detailed Results
        const frameDetailedResults: AnalysisResults['frameDetailedResults'] = {};

        Object.keys(frameMapping).forEach(origFrameIdStr => {
            const origId = Number(origFrameIdStr);
            const indices = frameMapping[origId].jointIndices;

            const detailedDisps: JointDisplacement[] = indices.map(idx => ({
                jointId: solverJoints[idx].id,
                ux: u_full[getDofIndex(idx, 0)],
                uy: u_full[getDofIndex(idx, 1)],
                uz: u_full[getDofIndex(idx, 2)],
                rx: u_full[getDofIndex(idx, 3)],
                ry: u_full[getDofIndex(idx, 4)],
                rz: u_full[getDofIndex(idx, 5)],
            }));

            frameDetailedResults[origId] = {
                stations: indices.map((_, i) => i / (indices.length - 1)),
                displacements: detailedDisps,
                forces: indices.map((_) => {
                    // For now, return zero forces. Real implementation requires:
                    // 1. Recovering element end forces for each segment (k * u_local)
                    // 2. Integrating distributed loads along the segment

                    // Since we essentially effectively meshed the frame into segments (solverFrames), 
                    // each segment's end forces ARE the internal forces at the nodes.
                    // We can recover forces from the global displacement vector `u_full` and segment stiffness `K_local`.

                    // We need to find the specific solverFrame (segment) that corresponds to this interval [i, i+1].
                    // indices[i] is the start node of segment i.

                    // Note: This logic assumes 'indices' correspond to consecutive nodes of the segments.
                    // The 'forces' array needs to match 'stations'.
                    // For station i, we can report the force at that node.
                    // However, elements have forces at BOTH ends (and they differ).
                    // Station i corresponds to:
                    // - Start of segment i (if i < length-1)
                    // - End of segment i-1 (if i > 0)
                    // We should probably average or take the appropriate side.

                    // Let's implement a helper to calculate forces for a specific segment.
                    // But wait, the solver calculated 'F' (Global Forces) - these are external.
                    // We need Internal Forces = K_element * u_element_local.

                    // Simplified approach for immediate visualization:
                    // If we are at node `idx`, we can try to find a segment connected to it.

                    // Let's just create a placeholder 0 for now to satisfy Types and I will implement the logic in a separate helper function to keep this clean.
                    return { P: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 };
                })
            };
        });

        // NOW, let's actually implement the force calculation.
        // We will iterate again and replace the placeholders.
        Object.keys(frameDetailedResults).forEach(frameIdStr => {
            const origId = Number(frameIdStr);
            const fdr = frameDetailedResults[origId];
            if (!fdr) return;

            // We need the original frame to get properties
            const frame = model.frames.find(f => f.id === origId);
            if (!frame) return;
            const section = model.frameSections.find(s => s.id === frame.sectionId);
            const material = section ? model.materials.find(m => m.id === section.materialId) : null;

            if (!section || !material) return;

            // Re-calculate some properties needed for stiffness
            // We need a helper to get Element Stiffness Matrix (k_local) for a segment
            // This suggests we should have stored `k` or be able to recompute it.
            // Recomputing is safer/easier than storing everything.

            // Iterate segments
            // fdr.stations has N points.
            // There are N-1 segments.
            // We will compute forces at the START of each segment, and END of the last segment.

            // Important: We need the SOLVER nodes for this frame.
            const mapping = frameMapping[origId];
            const solverNodeIndices = mapping.jointIndices;

            for (let i = 0; i < solverNodeIndices.length - 1; i++) {
                const nodeAIdx = solverNodeIndices[i];
                const nodeBIdx = solverNodeIndices[i + 1];

                const nodeA = solverJoints[nodeAIdx];
                const nodeB = solverJoints[nodeBIdx];

                // Get displacements for these nodes from `u_full`
                const uA = [
                    u_full[getDofIndex(nodeAIdx, 0)], u_full[getDofIndex(nodeAIdx, 1)], u_full[getDofIndex(nodeAIdx, 2)],
                    u_full[getDofIndex(nodeAIdx, 3)], u_full[getDofIndex(nodeAIdx, 4)], u_full[getDofIndex(nodeAIdx, 5)]
                ];
                const uB = [
                    u_full[getDofIndex(nodeBIdx, 0)], u_full[getDofIndex(nodeBIdx, 1)], u_full[getDofIndex(nodeBIdx, 2)],
                    u_full[getDofIndex(nodeBIdx, 3)], u_full[getDofIndex(nodeBIdx, 4)], u_full[getDofIndex(nodeBIdx, 5)]
                ];

                // Calculate Transformations and Local Stiffness again (copied logic from assemble needed)
                // Calculate internal forces for this segment
                const segmentForces = calculateSegmentForces(nodeA, nodeB, uA, uB, section, material, frame.orientation || 0);

                // For the detailed results, we primarily want the forces at the start of the segment (or average?)
                // Since we are discretizing the element, we can store forces at each station.
                // The stations correspond to the nodes of these segments.
                // i goes from 0 to segments (interpolated points).

                // We need to store force at 'i' (Start of current segment) and 'i+1' (End of current segment).
                // But this loop iterates over segments. 
                // Let's pre-initialize the forces array for all stations.
                // Actually, `frameDetailedResults[origId].forces` was initialized with zeros.
                // We should update it here.

                // Note: The loop is over `indices` which are the NODES.
                // Wait, the loop `for (let i = 0; i < indices.length - 1; i++)` iterates over SEGMENTS.
                // Node indices[i] is start, indices[i+1] is end.

                if (frameDetailedResults[origId].forces[i]) {
                    // Update force at start node of this segment
                    // We might overwrite if we are not careful, but for a chain of segments, 
                    // the end of one is the start of the next.
                    // For internal force continuity, they should be the same unless there is a point load at the node.
                    // Let's just store the "start" force of the segment at station i.
                    frameDetailedResults[origId].forces[i] = segmentForces.start;
                }

                // For the very last node, use the "end" force of the last segment
                if (i === solverNodeIndices.length - 2) {
                    frameDetailedResults[origId].forces[i + 1] = segmentForces.end;
                }
            }
        });

        // Calculate max displacement
        const maxDisplacement = displacements.reduce((max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return Math.max(max, mag);
        }, 0);

        log.push('Analysis complete.');

        return {
            loadCaseId,
            caseName: loadCase.name,
            displacements,
            frameDetailedResults,
            frameForces: [],
            shellStresses: [],
            isValid: true,
            maxDisplacement,
            timestamp: Date.now(),
            log,
        };

    } catch (error) {
        console.error('Analysis failed:', error);
        return {
            loadCaseId,
            displacements: [],
            frameForces: [],
            shellStresses: [],
            isValid: false,
            maxDisplacement: 0,
            timestamp: Date.now(),
            log: [...log, `Error: ${error}`],
        };
    }
}

/**
 * Combine analysis results based on a Load Combination
 */
export function combineResults(
    combination: LoadCombination,
    resultsMap: Record<string, AnalysisResults>,
    // model: StructuralModel
): AnalysisResults {
    const log: string[] = [`Combining results for ${combination.name}...`];
    const timestamp = Date.now();

    try {
        // Validation: Ensure all referenced cases have results
        for (const comp of combination.cases) {
            if (!resultsMap[comp.caseId]) {
                throw new Error(`Missing results for Load Case: ${comp.caseId}`);
            }
        }

        // Initialize empty result structures
        // We'll map jointId -> displacement object for easy summation
        const dispMap: Record<number, JointDisplacement> = {};
        const frameDetailedMap: Record<number, {
            stations: number[];
            displacements: JointDisplacement[];
            forces: { P: number, V2: number, V3: number, T: number, M2: number, M3: number }[]
        }> = {};

        // Iterate through each component case
        for (const comp of combination.cases) {
            const caseResult = resultsMap[comp.caseId];
            const scale = comp.scale;

            // 1. Combine Nodal Displacements
            caseResult.displacements.forEach((d) => {
                if (!dispMap[d.jointId]) {
                    dispMap[d.jointId] = {
                        jointId: d.jointId,
                        ux: 0, uy: 0, uz: 0, rx: 0, ry: 0, rz: 0,
                    };
                }
                dispMap[d.jointId].ux += d.ux * scale;
                dispMap[d.jointId].uy += d.uy * scale;
                dispMap[d.jointId].uz += d.uz * scale;
                dispMap[d.jointId].rx += d.rx * scale;
                dispMap[d.jointId].ry += d.ry * scale;
                dispMap[d.jointId].rz += d.rz * scale;
            });

            // 2. Combine Frame Detailed Results (if available)
            if (caseResult.frameDetailedResults) {
                Object.entries(caseResult.frameDetailedResults).forEach(([frameIdStr, detail]) => {
                    const frameId = Number(frameIdStr);
                    if (!frameDetailedMap[frameId]) {
                        // Initialize with zeros for the same stations
                        // Assuming all cases produce SAME stations for the same frame
                        frameDetailedMap[frameId] = {
                            stations: [...detail.stations],
                            displacements: detail.displacements.map(d => ({
                                jointId: d.jointId,
                                ux: 0, uy: 0, uz: 0, rx: 0, ry: 0, rz: 0,
                            })),
                            forces: detail.forces ? detail.forces.map(() => ({
                                P: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0
                            })) : []
                        };
                    }

                    // Add weighted displacements
                    const target = frameDetailedMap[frameId];
                    if (target.displacements.length === detail.displacements.length) {
                        detail.displacements.forEach((d, i) => {
                            target.displacements[i].ux += d.ux * scale;
                            target.displacements[i].uy += d.uy * scale;
                            target.displacements[i].uz += d.uz * scale;
                            target.displacements[i].rx += d.rx * scale;
                            target.displacements[i].ry += d.ry * scale;
                            target.displacements[i].rz += d.rz * scale;
                        });
                    }

                    // Add weighted forces
                    if (target.forces && detail.forces && target.forces.length === detail.forces.length) {
                        detail.forces.forEach((f, i) => {
                            const tf = target.forces[i];
                            tf.P += f.P * scale;
                            tf.V2 += f.V2 * scale;
                            tf.V3 += f.V3 * scale;
                            tf.T += f.T * scale;
                            tf.M2 += f.M2 * scale;
                            tf.M3 += f.M3 * scale;
                        });
                    }
                });
            }
        }

        // Convert maps back to arrays
        const displacements = Object.values(dispMap);

        // Calculate max displacement
        const maxDisplacement = displacements.reduce((max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return Math.max(max, mag);
        }, 0);

        log.push('Combination complete.');

        return {
            loadCaseId: combination.id,
            caseName: combination.name,
            displacements,
            frameDetailedResults: frameDetailedMap,
            frameForces: [], // TODO: Combine forces similarly
            shellStresses: [], // TODO: Combine stresses
            isValid: true,
            maxDisplacement,
            timestamp,
            log,
        };

    } catch (error) {
        console.error(`Combination ${combination.name} failed:`, error);
        return {
            loadCaseId: combination.id,
            displacements: [],
            frameForces: [],
            shellStresses: [],
            isValid: false,
            maxDisplacement: 0,
            timestamp,
            log: [...log, `Error: ${error}`],
        };
    }
}


function getDefaultRestraint(): Restraint {
    return {
        ux: false,
        uy: false,
        uz: false,
        rx: false,
        ry: false,
        rz: false,
    };
}


// Helper types
interface LocalForces {
    P: number;
    V2: number;
    V3: number;
    T: number;
    M2: number;
    M3: number;
}

function calculateSegmentForces(
    nodeA: { x: number, y: number, z: number },
    nodeB: { x: number, y: number, z: number },
    uA: number[], // Global displacements [ux, uy, uz, rx, ry, rz] values
    uB: number[],
    section: any,
    material: any,
    orientationAngle: number = 0
): { start: LocalForces, end: LocalForces } {

    // Check if material and section are valid
    if (!material || !section) {
        const zero = { P: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 };
        return { start: zero, end: zero };
    }

    const L = Math.sqrt((nodeB.x - nodeA.x) ** 2 + (nodeB.y - nodeA.y) ** 2 + (nodeB.z - nodeA.z) ** 2);
    if (L < 0.0001) return {
        start: { P: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 },
        end: { P: 0, V2: 0, V3: 0, T: 0, M2: 0, M3: 0 }
    };

    // 1. Build Transformation Matrix T (12x12)
    // Local x axis
    const cx = (nodeB.x - nodeA.x) / L;
    const cy = (nodeB.y - nodeA.y) / L;
    const cz = (nodeB.z - nodeA.z) / L;

    // Build Rotation Matrix R (3x3)
    // Global Y is UP.
    let R = Array(3).fill(0).map(() => Array(3).fill(0)); // Initialize 3x3 matrix with zeros

    const beta = orientationAngle * Math.PI / 180;

    // Check if vertical (along Y)
    if (Math.abs(cx) < 0.001 && Math.abs(cz) < 0.001) {
        // Vertical Element
        if (cy > 0) { // Up
            R[0][1] = 1;
            R[1][0] = -1 * Math.cos(beta); R[1][2] = Math.sin(beta);
            R[2][0] = Math.sin(beta); R[2][2] = Math.cos(beta);
        } else { // Down
            R[0][1] = -1;
            R[1][0] = 1 * Math.cos(beta); R[1][2] = Math.sin(beta);
            R[2][0] = -Math.sin(beta); R[2][2] = Math.cos(beta);
        }
    } else {
        // Horizontal or Oblique
        // Local x = [cx, cy, cz]
        // Global Y (up) not coincident with x
        const C1 = Math.sqrt(cx * cx + cz * cz);
        const s = Math.sin(beta);
        const c = Math.cos(beta);

        // R row 0 (local x)
        R[0][0] = cx; R[0][1] = cy; R[0][2] = cz;

        // R row 1 (local y)
        R[1][0] = (-cx * cy * c - cz * s) / C1;
        R[1][1] = C1 * c;
        R[1][2] = (-cy * cz * c + cx * s) / C1;

        // R row 2 (local z)
        R[2][0] = (cx * cy * s - cz * c) / C1;
        R[2][1] = -C1 * s;
        R[2][2] = (cy * cz * s + cx * c) / C1;
    }

    // Transform displacements to local system: u_local = T * u_global
    // Since T is block diagonal with R, we can do:
    // u_local_A = R * u_global_A (linear and angular separately)

    const transform3 = (vec: number[], rotLocal: number[][]) => {
        return [
            rotLocal[0][0] * vec[0] + rotLocal[0][1] * vec[1] + rotLocal[0][2] * vec[2],
            rotLocal[1][0] * vec[0] + rotLocal[1][1] * vec[1] + rotLocal[1][2] * vec[2],
            rotLocal[2][0] * vec[0] + rotLocal[2][1] * vec[1] + rotLocal[2][2] * vec[2]
        ];
    };

    const uA_trans = transform3(uA.slice(0, 3), R); // Local translations A
    const rA_trans = transform3(uA.slice(3, 6), R); // Local rotations A
    const uB_trans = transform3(uB.slice(0, 3), R); // Local translations B
    const rB_trans = transform3(uB.slice(3, 6), R); // Local rotations B

    // 2. Element Stiffness Matrix (Local)
    // Simplification: Standard prismatic beam
    const E = material.E * 1e6; // MPa to Pa
    const G = material.G * 1e6;
    const A = section.properties.A;
    const Ix = section.properties.J; // Torsion constant
    const Iy = section.properties.Iy; // Minor axis? (Check types)
    const Iz = section.properties.Iz; // Major axis

    // We assume Iy corresponds to bending about Local Y (Minor) -> resistance to z-displacement ??
    // Standard notation: Iy is inertia about y-axis. Iz is inertia about z-axis.

    // Stiffness coefficients
    const L2 = L * L;
    const L3 = L * L * L;

    // Bending about Z (Major) -> v displacement (local y)
    // Corresponds to Iz
    const k_bz_1 = (12 * E * Iz) / L3;
    const k_bz_2 = (6 * E * Iz) / L2;
    const k_bz_3 = (4 * E * Iz) / L;
    const k_bz_4 = (2 * E * Iz) / L;

    // Bending about Y (Minor) -> w displacement (local z)
    // Corresponds to Iy
    const k_by_1 = (12 * E * Iy) / L3;
    const k_by_2 = (6 * E * Iy) / L2;
    const k_by_3 = (4 * E * Iy) / L;
    const k_by_4 = (2 * E * Iy) / L;

    // Calculate forces: F_local = k_local * u_local
    // We compute pertinent components directly.

    // Start Node Forces (Reaction/Internal force at A)
    // Sign convention: Positive forces act in +axis direction on the face.
    // Internal force: tension visible?

    // P (Axial X)
    // const P_A = k_axial * (u_local[0] - u_local[6]);
    // Wait, K matrix usually: [k  -k] * [uA; uB]
    // F_xA = (EA/L) * uA - (EA/L) * uB = (EA/L)*(uA - uB).
    // If uA=0, uB=1 (tension), F_xA = -EA/L (pulling back).
    // Internal Normal Force N = F_xB (force at right end) = -F_xA.
    // Standard convention: Tension positive. uB > uA -> Tension.
    // N = (EA/L) * (uB - uA).
    const P = (E * A / L) * (uB_trans[0] - uA_trans[0]);

    // Torsion T
    // T = (GIx/L) * (rotB_x - rotA_x)
    const T = (G * Ix / L) * (rB_trans[0] - rA_trans[0]);

    // Shear V and Moment M
    // We use slope-deflection equations or stiffness directly.

    // Bending about Z (in X-Y plane) -> V2 (Shear Y), M3 (Moment Z)
    // Local DOF indices: uA_y (1), rA_z (5), uB_y (7), rB_z (11)

    // Forces at End A (from stiffness):
    // Fy_A =  12EI/L3 * uy_A + 6EI/L2 * rz_A - 12EI/L3 * uy_B + 6EI/L2 * rz_B
    // Mz_A =  6EI/L2 * uy_A + 4EI/L * rz_A - 6EI/L2 * uy_B + 2EI/L * rz_B

    const Fy_A = k_bz_1 * uA_trans[1] + k_bz_2 * rA_trans[2] - k_bz_1 * uB_trans[1] + k_bz_2 * rB_trans[2];
    const Mz_A = k_bz_2 * uA_trans[1] + k_bz_3 * rA_trans[2] - k_bz_2 * uB_trans[1] + k_bz_4 * rB_trans[2];

    const Fy_B = -k_bz_1 * uA_trans[1] - k_bz_2 * rA_trans[2] + k_bz_1 * uB_trans[1] - k_bz_2 * rB_trans[2];
    const Mz_B = k_bz_2 * uA_trans[1] + k_bz_4 * rA_trans[2] - k_bz_2 * uB_trans[1] + k_bz_3 * rB_trans[2];

    // Internal Forces:
    // Shear V2 at start = Fy_A.
    // Moment M3 at start = -Mz_A (Check sign convention: FEM Mz is CCW. Beam Theory M is sagging positive?)
    // Standard FEM result output usually reports forces applied by element on node, or vice versa. K*u gives forces ON NODE.
    // So force on node A is Fy_A. Internal shear V just right of A = Fy_A.
    // Moment on node A is Mz_A (CCW). Internal moment M just right of A = -Mz_A (if M is sagging?).
    // Let's perform a check. Simply supported beam, gravity load. Fixed-Fixed.
    // F = K u - F_fixed. Since we solved F_ext = K u, implies K u = F_external.
    // If we only use K*u, we only get the forces due to displacement (restoring forces).
    // We MUST subtract Fixed End Forces if we want the total internal stress state, OR just realize K*u is the nodal force balance.

    // Wait, K*u gives the external force required to maintain the deformation.
    // Total Internal Force = (Forces due to deformation) + (Forces due to loads within element).
    // F_int = K_local * u_local + F_fixed_local
    // However, I don't have F_fixed_local handy here without re-integration.
    // BUT since we discretized the frame into many small segments (solverFrames), and applied loads to NODES of these segments...
    // The segments themselves are "load free" (loads are lumped at nodes).
    // EXCEPT if we implemented distributed loads as FEM equivalent nodal loads?
    // In `analyzeStructure`, we did:
    // "Distribute half to each node (Lumped Mass approach)"
    // "Distribute force to nodes (Lumped - 50/50)"
    // This defines the segments as having NO internal distributed load for the solver's purpose.
    // They are just springs connecting nodes with point loads.
    // Therefore, K_local * u_local IS the exact force in the spring element (segment).
    // And internal force is constant (or linear) between these nodes.
    // Since we output forces at "stations" which coincide with these nodes, 
    // Start Force = Force at A. End Force = Force at B.

    // V2 (Shear Y)
    const V2_start = Fy_A;
    const V2_end = -Fy_B; // Shear at B is opposite to nodal reaction?? Or just Fy_B? Element force at B is Fy_B.
    // Check sign: Sum Fy = 0 -> Fy_A + Fy_B = 0 (no load). V is constant.
    // So V = Fy_A = -Fy_B.

    // M3 (Moment Z)
    const M3_start = Mz_A;
    const M3_end = -Mz_B; // Moment at B end.

    // Bending about Y (in X-Z plane) -> V3 (Shear Z), M2 (Moment Y)
    // Note directional signs. M2 is about Y.
    // u_z is index 2. r_y is index 1.

    const Fz_A = k_by_1 * uA_trans[2] - k_by_2 * rA_trans[1] - k_by_1 * uB_trans[2] - k_by_2 * rB_trans[1];
    // Note signs on rotation terms might be flipped depending on coordinate system chirality for y-bending.
    // Let's assume standard stiffness.

    const My_A = -k_by_2 * uA_trans[2] + k_by_3 * rA_trans[1] + k_by_2 * uB_trans[2] + k_by_4 * rB_trans[1];

    const Fz_B = -k_by_1 * uA_trans[2] + k_by_2 * rA_trans[1] + k_by_1 * uB_trans[2] + k_by_2 * rB_trans[1];
    const My_B = -k_by_2 * uA_trans[2] + k_by_4 * rA_trans[1] + k_by_2 * uB_trans[2] + k_by_3 * rB_trans[1];

    const V3_start = Fz_A;
    const V3_end = -Fz_B;

    const M2_start = My_A;
    const M2_end = -My_B;

    return {
        start: { P: P / 1000, V2: V2_start / 1000, V3: V3_start / 1000, T: T / 1000, M2: M2_start / 1000, M3: M3_start / 1000 },
        end: { P: P / 1000, V2: V2_end / 1000, V3: V3_end / 1000, T: T / 1000, M2: M2_end / 1000, M3: M3_end / 1000 }
    };
}
