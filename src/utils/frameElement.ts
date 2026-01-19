import type { Joint, FrameSection, Material } from '../types/structuralTypes';
import type { Matrix } from './matrixUtils';
import { zeros, matrixMultiply, transpose } from './matrixUtils';

/**
 * Calculate 3D frame element local stiffness matrix (12x12)
 * DOFs: [ux1, uy1, uz1, rx1, ry1, rz1, ux2, uy2, uz2, rx2, ry2, rz2]
 */
export function frameElementStiffness(
    jointI: Joint,
    jointJ: Joint,
    section: FrameSection,
    material: Material
): Matrix {
    const dx = jointJ.x - jointI.x;
    const dy = jointJ.y - jointI.y;
    const dz = jointJ.z - jointI.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (L < 1e-6) {
        throw new Error('Frame element has zero length');
    }

    const E = material.E * 1e6; // Convert MPa to Pa
    const G = material.G * 1e6;
    const A = section.properties.A;
    const Iy = section.properties.Iy; // Strong axis (about local z)
    const Iz = section.properties.Iz; // Weak axis (about local y)
    const J = section.properties.J;

    // Local stiffness matrix in local coordinates
    const k = zeros(12, 12);

    // Axial stiffness
    const EA_L = (E * A) / L;
    k[0][0] = EA_L;
    k[0][6] = -EA_L;
    k[6][0] = -EA_L;
    k[6][6] = EA_L;

    // Torsional stiffness
    const GJ_L = (G * J) / L;
    k[3][3] = GJ_L;
    k[3][9] = -GJ_L;
    k[9][3] = -GJ_L;
    k[9][9] = GJ_L;

    // Bending stiffness (local Y-Z plane, about local Z axis)
    const EIz_L3 = (E * Iz) / (L * L * L);
    const EIz_L2 = (E * Iz) / (L * L);
    const EIz_L = (E * Iz) / L;

    k[1][1] = 12 * EIz_L3;
    k[1][5] = 6 * EIz_L2;
    k[1][7] = -12 * EIz_L3;
    k[1][11] = 6 * EIz_L2;

    k[5][1] = 6 * EIz_L2;
    k[5][5] = 4 * EIz_L;
    k[5][7] = -6 * EIz_L2;
    k[5][11] = 2 * EIz_L;

    k[7][1] = -12 * EIz_L3;
    k[7][5] = -6 * EIz_L2;
    k[7][7] = 12 * EIz_L3;
    k[7][11] = -6 * EIz_L2;

    k[11][1] = 6 * EIz_L2;
    k[11][5] = 2 * EIz_L;
    k[11][7] = -6 * EIz_L2;
    k[11][11] = 4 * EIz_L;

    // Bending stiffness (local X-Z plane, about local Y axis)
    const EIy_L3 = (E * Iy) / (L * L * L);
    const EIy_L2 = (E * Iy) / (L * L);
    const EIy_L = (E * Iy) / L;

    k[2][2] = 12 * EIy_L3;
    k[2][4] = -6 * EIy_L2;
    k[2][8] = -12 * EIy_L3;
    k[2][10] = -6 * EIy_L2;

    k[4][2] = -6 * EIy_L2;
    k[4][4] = 4 * EIy_L;
    k[4][8] = 6 * EIy_L2;
    k[4][10] = 2 * EIy_L;

    k[8][2] = -12 * EIy_L3;
    k[8][4] = 6 * EIy_L2;
    k[8][8] = 12 * EIy_L3;
    k[8][10] = 6 * EIy_L2;

    k[10][2] = -6 * EIy_L2;
    k[10][4] = 2 * EIy_L;
    k[10][8] = 6 * EIy_L2;
    k[10][10] = 4 * EIy_L;

    return k;
}

/**
 * Calculate coordinate transformation matrix from local to global coordinates
 */
export function frameTransformationMatrix(jointI: Joint, jointJ: Joint, orientation: number): Matrix {
    const dx = jointJ.x - jointI.x;
    const dy = jointJ.y - jointI.y;
    const dz = jointJ.z - jointI.z;
    const L = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (L < 1e-6) {
        throw new Error('Frame element has zero length');
    }

    // Direction cosines for local x-axis (along member)
    const cx = dx / L;
    const cy = dy / L;
    const cz = dz / L;

    // Local y-axis (perpendicular to member, in global XZ plane if possible)
    let lyx: number, lyy: number, lyz: number;

    if (Math.abs(cy) > 0.99) {
        // Member is nearly vertical, use global X as reference
        lyx = 1;
        lyy = 0;
        lyz = 0;
    } else {
        // Use global Y as up direction
        const temp = Math.sqrt(cx * cx + cz * cz);
        lyx = -cx * cy / temp;
        lyy = temp;
        lyz = -cz * cy / temp;
    }

    // Local z-axis = cross(x, y)
    let lzx = cy * lyz - cz * lyy;
    let lzy = cz * lyx - cx * lyz;
    let lzz = cx * lyy - cy * lyx;

    // Apply orientation rotation (rotation about local x-axis)
    if (Math.abs(orientation) > 1e-6) {
        const theta = (orientation * Math.PI) / 180;
        const cos_theta = Math.cos(theta);
        const sin_theta = Math.sin(theta);

        const lyx_new = cos_theta * lyx - sin_theta * lzx;
        const lyy_new = cos_theta * lyy - sin_theta * lzy;
        const lyz_new = cos_theta * lyz - sin_theta * lzz;

        const lzx_new = sin_theta * lyx + cos_theta * lzx;
        const lzy_new = sin_theta * lyy + cos_theta * lzy;
        const lzz_new = sin_theta * lyz + cos_theta * lzz;

        lyx = lyx_new;
        lyy = lyy_new;
        lyz = lyz_new;
        lzx = lzx_new;
        lzy = lzy_new;
        lzz = lzz_new;
    }

    // 3x3 rotation matrix
    const R3 = [
        [cx, cy, cz],
        [lyx, lyy, lyz],
        [lzx, lzy, lzz],
    ];

    // Construct 12x12 transformation matrix
    const T = zeros(12, 12);
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                T[i * 3 + j][i * 3 + k] = R3[j][k];
            }
        }
    }

    return T;
}

/**
 * Transform local stiffness matrix to global coordinates
 */
export function transformStiffnessToGlobal(localK: Matrix, T: Matrix): Matrix {
    const TT = transpose(T);
    const temp = matrixMultiply(TT, localK);
    return matrixMultiply(temp, T);
}
