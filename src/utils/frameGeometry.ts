import type { Joint } from '../types/structuralTypes';

export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface LocalAxes {
    x: Vector3; // Local X-axis (along frame)
    y: Vector3; // Local Y-axis
    z: Vector3; // Local Z-axis
}

/**
 * Calculate the length of a frame between two joints
 * @param jointI - Start joint
 * @param jointJ - End joint
 * @returns Length in meters
 */
export function calculateFrameLength(jointI: Joint, jointJ: Joint): number {
    const dx = jointJ.x - jointI.x;
    const dy = jointJ.y - jointI.y;
    const dz = jointJ.z - jointI.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Get local coordinate system for a frame
 * Local X-axis: Along the frame from jointI to jointJ
 * Local Y-axis and Z-axis: Perpendicular to X, following right-hand rule
 * 
 * @param jointI - Start joint
 * @param jointJ - End joint
 * @returns Local axes
 */
export function getLocalAxes(jointI: Joint, jointJ: Joint): LocalAxes {
    // Local X-axis (along frame)
    const dx = jointJ.x - jointI.x;
    const dy = jointJ.y - jointI.y;
    const dz = jointJ.z - jointI.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const localX: Vector3 = {
        x: dx / length,
        y: dy / length,
        z: dz / length,
    };

    // Determine local Y and Z axes
    // If frame is vertical (parallel to global Y), use special case
    const tolerance = 1e-6;
    const isVertical = Math.abs(localX.x) < tolerance && Math.abs(localX.z) < tolerance;

    let localY: Vector3;
    let localZ: Vector3;

    if (isVertical) {
        // For vertical members, align local Z with global Z
        localZ = { x: 0, y: 0, z: 1 };
        localY = crossProduct(localZ, localX);
        normalizeVector(localY);
    } else {
        // For non-vertical members, local Y in horizontal plane
        const globalY: Vector3 = { x: 0, y: 1, z: 0 };
        localZ = crossProduct(localX, globalY);
        normalizeVector(localZ);
        localY = crossProduct(localZ, localX);
        normalizeVector(localY);
    }

    return { x: localX, y: localY, z: localZ };
}

/**
 * Cross product of two vectors
 */
function crossProduct(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x,
    };
}

/**
 * Normalize a vector (modify in place)
 */
function normalizeVector(v: Vector3): void {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length > 0) {
        v.x /= length;
        v.y /= length;
        v.z /= length;
    }
}

/**
 * Rotate a vector around an axis by an angle
 * @param vector - Vector to rotate
 * @param axis - Axis of rotation (unit vector)
 * @param angleDegrees - Rotation angle in degrees
 * @returns Rotated vector
 */
export function rotateVector(vector: Vector3, axis: Vector3, angleDegrees: number): Vector3 {
    const angleRadians = (angleDegrees * Math.PI) / 180;
    const c = Math.cos(angleRadians);
    const s = Math.sin(angleRadians);
    const t = 1 - c;

    // Rodrigues' rotation formula
    const rotated: Vector3 = {
        x: (t * axis.x * axis.x + c) * vector.x +
            (t * axis.x * axis.y - s * axis.z) * vector.y +
            (t * axis.x * axis.z + s * axis.y) * vector.z,
        y: (t * axis.x * axis.y + s * axis.z) * vector.x +
            (t * axis.y * axis.y + c) * vector.y +
            (t * axis.y * axis.z - s * axis.x) * vector.z,
        z: (t * axis.x * axis.z - s * axis.y) * vector.x +
            (t * axis.y * axis.z + s * axis.x) * vector.y +
            (t * axis.z * axis.z + c) * vector.z,
    };

    return rotated;
}

/**
 * Get the orientation-adjusted local axes
 * @param localAxes - Original local axes
 * @param orientationDegrees - Rotation angle around local X-axis in degrees
 * @returns Rotated local axes
 */
export function getOrientedLocalAxes(localAxes: LocalAxes, orientationDegrees: number): LocalAxes {
    if (Math.abs(orientationDegrees) < 1e-6) {
        return localAxes; // No rotation
    }

    // Rotate Y and Z axes around X-axis
    const rotatedY = rotateVector(localAxes.y, localAxes.x, orientationDegrees);
    const rotatedZ = rotateVector(localAxes.z, localAxes.x, orientationDegrees);

    return {
        x: localAxes.x,
        y: rotatedY,
        z: rotatedZ,
    };
}
