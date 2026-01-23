import numpy as np
import math
from models import Joint, Frame, FrameSection, Material

def frame_element_stiffness(
    joint_i: Joint,
    joint_j: Joint,
    section: FrameSection,
    material: Material
) -> np.ndarray:
    dx = joint_j.x - joint_i.x
    dy = joint_j.y - joint_i.y
    dz = joint_j.z - joint_i.z
    L = math.sqrt(dx * dx + dy * dy + dz * dz)

    if L < 1e-6:
        raise ValueError('Frame element has zero length')

    E = material.E * 1e6 # MPa to Pa
    G = material.G * 1e6
    A = section.properties.A
    Iy = section.properties.Iy # Strong axis (usually) - check correspondence with source
    Iz = section.properties.Iz # Weak axis
    J = section.properties.J

    # In source (frameElement.ts):
    # Iy = section.properties.Iy (Strong axis about local z?? - Source says "Strong axis (about local z)")
    # Iz = section.properties.Iz (Weak axis about local y?? - Source says "Weak axis (about local y)")
    # Let's double check the TS code logic.
    # TS Code:
    # Bending stiffness (local Y-Z plane, about local Z axis) -> Uses Iz
    # k[1][1] = 12 * EIz / L^3 ... for DoF 1 (uy)
    # This implies Iz is MOI about Z axis.
    # Standard 3D Beams:
    # Local x: along member
    # Local y: minor axis? or major?
    # Local z: major axis? or minor?
    # Usually Iy is MOI about Y axis, Iz is MOI about Z axis.
    # DoF 1 is uy (translation in y). Bending in xy plane? No, local coords.
    # If we translate in y, we bend about z. So stiffness depends on Iz.
    # TS line 53: k[1][1] uses Iz. Correct.
    # DoF 2 is uz (translation in z). Bending in xz plane. Bending about y.
    # TS line 78: k[2][2] uses Iy. Correct.
    
    # So: Iz is MOI about local Z. Iy is MOI about local Y.
    # Ensure section properties match this convention.

    k = np.zeros((12, 12))

    # Axial
    EA_L = (E * A) / L
    k[0, 0] = EA_L
    k[0, 6] = -EA_L
    k[6, 0] = -EA_L
    k[6, 6] = EA_L

    # Torsion
    GJ_L = (G * J) / L
    k[3, 3] = GJ_L
    k[3, 9] = -GJ_L
    k[9, 3] = -GJ_L
    k[9, 9] = GJ_L

    # Bending about Z (Major/Minor depending on section orientation)
    # Controls displacement in Y (v) and rotation about Z (theta_z)
    EIz_L3 = (E * Iz) / (L ** 3)
    EIz_L2 = (E * Iz) / (L ** 2)
    EIz_L = (E * Iz) / L

    # DoFs: uy1(1), rz1(5), uy2(7), rz2(11)
    k[1, 1] = 12 * EIz_L3
    k[1, 5] = 6 * EIz_L2
    k[1, 7] = -12 * EIz_L3
    k[1, 11] = 6 * EIz_L2

    k[5, 1] = 6 * EIz_L2
    k[5, 5] = 4 * EIz_L
    k[5, 7] = -6 * EIz_L2
    k[5, 11] = 2 * EIz_L

    k[7, 1] = -12 * EIz_L3
    k[7, 5] = -6 * EIz_L2
    k[7, 7] = 12 * EIz_L3
    k[7, 11] = -6 * EIz_L2

    k[11, 1] = 6 * EIz_L2
    k[11, 5] = 2 * EIz_L
    k[11, 7] = -6 * EIz_L2
    k[11, 11] = 4 * EIz_L

    # Bending about Y
    # Controls displacement in Z (w) and rotation about Y (theta_y)
    EIy_L3 = (E * Iy) / (L ** 3)
    EIy_L2 = (E * Iy) / (L ** 2)
    EIy_L = (E * Iy) / L

    # DoFs: uz1(2), ry1(4), uz2(8), ry2(10)
    # Note signs for ry are often flipped depending on coord system right-hand rule
    # Checking TS code:
    # k[2][4] = -6 * EIy_L2
    # k[2][2] = 12 ... 
    
    k[2, 2] = 12 * EIy_L3
    k[2, 4] = -6 * EIy_L2
    k[2, 8] = -12 * EIy_L3
    k[2, 10] = -6 * EIy_L2

    k[4, 2] = -6 * EIy_L2
    k[4, 4] = 4 * EIy_L
    k[4, 8] = 6 * EIy_L2
    k[4, 10] = 2 * EIy_L

    k[8, 2] = -12 * EIy_L3
    k[8, 4] = 6 * EIy_L2
    k[8, 8] = 12 * EIy_L3
    k[8, 10] = 6 * EIy_L2

    k[10, 2] = -6 * EIy_L2
    k[10, 4] = 2 * EIy_L
    k[10, 8] = 6 * EIy_L2
    k[10, 10] = 4 * EIy_L

    return k

def frame_transformation_matrix(joint_i: Joint, joint_j: Joint, orientation: float) -> np.ndarray:
    dx = joint_j.x - joint_i.x
    dy = joint_j.y - joint_i.y
    dz = joint_j.z - joint_i.z
    L = math.sqrt(dx * dx + dy * dy + dz * dz)

    if L < 1e-6:
        raise ValueError('Frame element has zero length')

    # Direction cosines for local x (cx, cy, cz)
    cx = dx / L
    cy = dy / L
    cz = dz / L

    # Local y-axis
    lyx, lyy, lyz = 0.0, 0.0, 0.0

    if abs(cy) > 0.99:
        # Vertical member
        lyx = 1.0
        lyy = 0.0
        lyz = 0.0
    else:
        # Global Y is up
        temp = math.sqrt(cx * cx + cz * cz)
        lyx = -cx * cy / temp
        lyy = temp
        lyz = -cz * cy / temp

    # Local z-axis = cross(x, y)
    lzx = cy * lyz - cz * lyy
    lzy = cz * lyx - cx * lyz
    lzz = cx * lyy - cy * lyx

    # Orientation rotation
    if abs(orientation) > 1e-6:
        theta = (orientation * math.pi) / 180.0
        cos_theta = math.cos(theta)
        sin_theta = math.sin(theta)

        lyx_new = cos_theta * lyx - sin_theta * lzx
        lyy_new = cos_theta * lyy - sin_theta * lzy
        lyz_new = cos_theta * lyz - sin_theta * lzz

        lzx_new = sin_theta * lyx + cos_theta * lzx
        lzy_new = sin_theta * lyy + cos_theta * lzy
        lzz_new = sin_theta * lyz + cos_theta * lzz

        lyx, lyy, lyz = lyx_new, lyy_new, lyz_new
        lzx, lzy, lzz = lzx_new, lzy_new, lzz_new

    # 3x3 Rotation matrix
    R = np.array([
        [cx, cy, cz],
        [lyx, lyy, lyz],
        [lzx, lzy, lzz]
    ])

    # 12x12 Transformation matrix
    T = np.zeros((12, 12))
    # Fill diagonal blocks
    for i in range(4):
        T[i*3:(i+1)*3, i*3:(i+1)*3] = R

    return T

def transform_stiffness_to_global(local_k: np.ndarray, T: np.ndarray) -> np.ndarray:
    # K_global = T^T * K_local * T
    return T.T @ local_k @ T
