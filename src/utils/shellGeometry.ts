import type { Joint } from '../types/structuralTypes';
import type { Vector3 } from './frameGeometry';

/**
 * Calculate the area of a shell/plate defined by multiple joints
 * Uses the shoelace formula for polygons in 3D space
 * @param joints - Array of joints forming the shell (in order)
 * @returns Area in m²
 */
export function calculateShellArea(joints: Joint[]): number {
    if (joints.length < 3) return 0;

    // For triangular shell
    if (joints.length === 3) {
        const v1 = {
            x: joints[1].x - joints[0].x,
            y: joints[1].y - joints[0].y,
            z: joints[1].z - joints[0].z,
        };
        const v2 = {
            x: joints[2].x - joints[0].x,
            y: joints[2].y - joints[0].y,
            z: joints[2].z - joints[0].z,
        };
        const cross = crossProduct(v1, v2);
        return 0.5 * Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
    }

    // For quadrilateral and larger polygons, use triangulation
    let totalArea = 0;
    for (let i = 1; i < joints.length - 1; i++) {
        const v1 = {
            x: joints[i].x - joints[0].x,
            y: joints[i].y - joints[0].y,
            z: joints[i].z - joints[0].z,
        };
        const v2 = {
            x: joints[i + 1].x - joints[0].x,
            y: joints[i + 1].y - joints[0].y,
            z: joints[i + 1].z - joints[0].z,
        };
        const cross = crossProduct(v1, v2);
        totalArea += 0.5 * Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
    }

    return totalArea;
}

/**
 * Get the normal vector (local Z-axis) of a shell
 * @param joints - Array of joints forming the shell (at least 3)
 * @returns Unit normal vector
 */
export function getShellNormal(joints: Joint[]): Vector3 {
    if (joints.length < 3) {
        return { x: 0, y: 0, z: 1 }; // Default upward
    }

    // Use first three points to determine normal
    const v1 = {
        x: joints[1].x - joints[0].x,
        y: joints[1].y - joints[0].y,
        z: joints[1].z - joints[0].z,
    };
    const v2 = {
        x: joints[2].x - joints[0].x,
        y: joints[2].y - joints[0].y,
        z: joints[2].z - joints[0].z,
    };

    const normal = crossProduct(v1, v2);
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);

    if (length > 0) {
        return {
            x: normal.x / length,
            y: normal.y / length,
            z: normal.z / length,
        };
    }

    return { x: 0, y: 0, z: 1 }; // Default
}

/**
 * Get local coordinate system for a shell
 * Local Z-axis: Normal to the shell surface
 * Local X-axis: Along first edge
 * Local Y-axis: Perpendicular to X and Z (right-hand rule)
 * 
 * @param joints - Array of joints forming the shell
 * @returns Local axes
 */
export function getShellLocalAxes(joints: Joint[]): {
    x: Vector3;
    y: Vector3;
    z: Vector3;
} {
    if (joints.length < 3) {
        return {
            x: { x: 1, y: 0, z: 0 },
            y: { x: 0, y: 1, z: 0 },
            z: { x: 0, y: 0, z: 1 },
        };
    }

    // Local Z is normal
    const localZ = getShellNormal(joints);

    // Local X along first edge
    const edge = {
        x: joints[1].x - joints[0].x,
        y: joints[1].y - joints[0].y,
        z: joints[1].z - joints[0].z,
    };
    const edgeLength = Math.sqrt(edge.x * edge.x + edge.y * edge.y + edge.z * edge.z);
    const localX: Vector3 = {
        x: edge.x / edgeLength,
        y: edge.y / edgeLength,
        z: edge.z / edgeLength,
    };

    // Local Y from cross product
    const localY = crossProduct(localZ, localX);
    const yLength = Math.sqrt(localY.x * localY.x + localY.y * localY.y + localY.z * localY.z);
    if (yLength > 0) {
        localY.x /= yLength;
        localY.y /= yLength;
        localY.z /= yLength;
    }

    return { x: localX, y: localY, z: localZ };
}

/**
 * Get the centroid of a shell
 * @param joints - Array of joints
 * @returns Centroid coordinates
 */
export function getShellCentroid(joints: Joint[]): { x: number; y: number; z: number } {
    if (joints.length === 0) return { x: 0, y: 0, z: 0 };

    const sum = joints.reduce(
        (acc, joint) => ({
            x: acc.x + joint.x,
            y: acc.y + joint.y,
            z: acc.z + joint.z,
        }),
        { x: 0, y: 0, z: 0 }
    );

    return {
        x: sum.x / joints.length,
        y: sum.y / joints.length,
        z: sum.z / joints.length,
    };
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
