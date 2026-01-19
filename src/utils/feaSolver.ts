import type {
    StructuralModel,
    Joint,
    Frame,
    AnalysisResults,
    JointDisplacement,
    Restraint,
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
                displacements: detailedDisps
            };
        });

        // Calculate max displacement
        const maxDisplacement = displacements.reduce((max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return Math.max(max, mag);
        }, 0);

        log.push('Analysis complete.');

        return {
            loadCaseId,
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
