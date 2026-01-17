
import type { FEAMeshData, FEANode, FEAElement, Dimensions, PlateDimensions, HaunchConfig } from '../../types';

/**
 * MESH GENERATOR
 * Generates structured shell meshes for connection components.
 */

export function generatePlateMesh(plate: PlateDimensions, nx = 20, ny = 40): FEAMeshData {
    const nodes: FEANode[] = [];
    const elements: FEAElement[] = [];

    // Plate in YZ plane at X = thickness
    const origin: [number, number, number] = [plate.thickness, -plate.height / 2, -plate.width / 2];
    const uVec: [number, number, number] = [0, plate.height, 0];
    const vVec: [number, number, number] = [0, 0, plate.width];

    for (let j = 0; j <= ny; j++) {
        const fv = j / ny;
        for (let i = 0; i <= nx; i++) {
            const fu = i / nx;
            nodes.push({
                id: nodes.length,
                x: origin[0] + fu * uVec[0] + fv * vVec[0],
                y: origin[1] + fu * uVec[1] + fv * vVec[1],
                z: origin[2] + fu * uVec[2] + fv * vVec[2]
            });
        }
    }

    for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
            const n0 = j * (nx + 1) + i;
            const n1 = n0 + 1;
            const n2 = (j + 1) * (nx + 1) + i;
            const n3 = n2 + 1;
            elements.push({ id: elements.length, nodeIds: [n0, n1, n3, n2] });
        }
    }

    return { nodes, elements, componentId: 'plate' };
}

// export function generateMemberMesh(dim: Dimensions, length: number, componentId: string, nx_profile = 20, nz = 30): FEAMeshData {
export function generateMemberMesh(dim: Dimensions, length: number, componentId: string, nz = 30): FEAMeshData {
    const nodes: FEANode[] = [];
    const elements: FEAElement[] = [];

    const w = dim.width;
    const h = dim.depth;
    const tf = dim.flangeThickness;
    // const tw = dim.webThickness;

    const addGrid = (origin: [number, number, number], uVec: [number, number, number], vVec: [number, number, number], nu: number, nv: number) => {
        const baseIdx = nodes.length;
        for (let j = 0; j <= nv; j++) {
            const fv = j / nv;
            for (let i = 0; i <= nu; i++) {
                const fu = i / nu;
                nodes.push({
                    id: nodes.length,
                    x: origin[0] + fu * uVec[0] + fv * vVec[0],
                    y: origin[1] + fu * uVec[1] + fv * vVec[1],
                    z: origin[2] + fu * uVec[2] + fv * vVec[2]
                });
            }
        }
        for (let j = 0; j < nv; j++) {
            for (let i = 0; i < nu; i++) {
                const n0 = baseIdx + j * (nu + 1) + i;
                const n1 = n0 + 1;
                const n2 = baseIdx + (j + 1) * (nu + 1) + i;
                const n3 = n2 + 1;
                elements.push({ id: elements.length, nodeIds: [n0, n1, n3, n2] });
            }
        }
    };

    // Member grew along Z axis
    // Top Flange
    addGrid([-w / 2, h / 2, 0], [w, 0, 0], [0, 0, length], 10, nz);
    // Web
    addGrid([0, -h / 2 + tf, 0], [0, h - 2 * tf, 0], [0, 0, length], 10, nz);
    // Bottom Flange
    addGrid([-w / 2, -h / 2, 0], [w, 0, 0], [0, 0, length], 10, nz);

    return { nodes, elements, componentId };
}

export function generateHaunchMesh(haunch: HaunchConfig, nu = 10, nv = 10): FEAMeshData {
    const nodes: FEANode[] = [];
    const elements: FEAElement[] = [];

    const L = haunch.length;
    const D = haunch.depth;
    const fw = haunch.flangeWidth;

    // 1. WEB MESH (Triangle in YZ plane, centered in X)
    for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        const vz = v * L;
        const localH = D * (1 - v);
        for (let i = 0; i <= nu; i++) {
            const u = i / nu;
            nodes.push({
                id: nodes.length,
                x: 0,
                y: -u * localH,
                z: vz
            });
        }
    }

    const webCols = nu + 1;
    for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
            const n0 = j * webCols + i;
            const n1 = n0 + 1;
            const n2 = (j + 1) * webCols + i;
            const n3 = n2 + 1;
            elements.push({ id: elements.length, nodeIds: [n0, n1, n3, n2] });
        }
    }

    // 2. FLANGE MESH (Rectangle along hypotenuse)
    const baseIdx = nodes.length;

    // Origin for flange is (0, -D, 0). 
    // uVec is across (X-axis): [-fw/2, 0, 0] to [fw/2, 0, 0] -> [fw, 0, 0]
    // vVec is along hypotenuse: [0, D, L]
    const flangeOrigin: [number, number, number] = [-fw / 2, -D, 0];
    const uVecFlange: [number, number, number] = [fw, 0, 0];
    const vVecFlange: [number, number, number] = [0, D, L];

    for (let j = 0; j <= nv; j++) {
        const fv = j / nv;
        for (let i = 0; i <= nu; i++) {
            const fu = i / nu;
            nodes.push({
                id: nodes.length,
                x: flangeOrigin[0] + fu * uVecFlange[0] + fv * vVecFlange[0],
                y: flangeOrigin[1] + fu * uVecFlange[1] + fv * vVecFlange[1],
                z: flangeOrigin[2] + fu * uVecFlange[2] + fv * vVecFlange[2]
            });
        }
    }

    for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
            const n0 = baseIdx + j * (nu + 1) + i;
            const n1 = n0 + 1;
            const n2 = baseIdx + (j + 1) * (nu + 1) + i;
            const n3 = n2 + 1;
            elements.push({ id: elements.length, nodeIds: [n0, n1, n3, n2] });
        }
    }

    return { nodes, elements, componentId: 'haunch' };
}
