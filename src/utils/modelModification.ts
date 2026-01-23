import type { StructuralModel, Frame, Joint } from '../types/structuralTypes';

/**
 * Divides a frame into multiple segments.
 * Removes the original frame and adds new frames and joints to the model.
 * 
 * @param model Current structural model
 * @param frameId ID of the frame to divide
 * @param segments Number of segments to divide into (must be >= 2)
 * @returns Updated structural model
 */
export function divideFrame(model: StructuralModel, frameId: number, segments: number): StructuralModel {
    if (segments < 2) return model;

    const frameIndex = model.frames.findIndex(f => f.id === frameId);
    if (frameIndex === -1) return model;

    const originalFrame = model.frames[frameIndex];
    const jointI = model.joints.find(j => j.id === originalFrame.jointI);
    const jointJ = model.joints.find(j => j.id === originalFrame.jointJ);

    if (!jointI || !jointJ) return model;

    // Remove original frame
    const newFrames = [...model.frames];
    newFrames.splice(frameIndex, 1);

    const newJoints = [...model.joints];

    // Find max IDs to generate new ones
    let nextJointId = Math.max(...model.joints.map(j => j.id), 0) + 1;
    let nextFrameId = Math.max(...model.frames.map(f => f.id), 0) + 1;

    let prevJointId = originalFrame.jointI;

    for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const x = jointI.x + (jointJ.x - jointI.x) * t;
        const y = jointI.y + (jointJ.y - jointI.y) * t;
        const z = jointI.z + (jointJ.z - jointI.z) * t;

        const newJoint: Joint = {
            id: nextJointId++,
            x,
            y,
            z
        };
        newJoints.push(newJoint);

        const newFrame: Frame = {
            ...originalFrame,
            id: nextFrameId++,
            jointI: prevJointId,
            jointJ: newJoint.id,
        };
        newFrames.push(newFrame);

        prevJointId = newJoint.id;
    }

    // Final segment connecting to original end joint
    const finalFrame: Frame = {
        ...originalFrame,
        id: nextFrameId++,
        jointI: prevJointId,
        jointJ: originalFrame.jointJ,
    };
    newFrames.push(finalFrame);

    return {
        ...model,
        joints: newJoints,
        frames: newFrames,
    };
}
