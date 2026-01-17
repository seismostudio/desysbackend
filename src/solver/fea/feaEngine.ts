import type { ConnectionConfig, AnalysisResult, FEAElement, FEANode, FEAMeshData } from '../../types';
import { solveConnection } from '../connectionSolver';
import { generatePlateMesh, generateMemberMesh, generateHaunchMesh } from './meshGenerator';
import { solveLU } from './math';
import { getCSTStiffness, getCSTStress } from './elements';

/**
 * FEA ENGINE
 * Performs a real numerical solve using the stiffness method.
 */
export async function runAnalysis(config: ConnectionConfig): Promise<AnalysisResult> {
    // 1. Preparation
    const solverResults = solveConnection(config);
    const { materials } = config.settings;
    const E = materials.plate.E;
    const nu = 0.3; // Poisson ratio approx
    const t = config.plate.thickness;

    // 2. Generate and Triangulate Mesh
    // The End Plate is the critical component solved numerically via FEA
    const plateH = config.haunch.enabled ? config.plate.height + config.haunch.depth : config.plate.height;
    const plateMesh = generatePlateMesh({ ...config.plate, height: plateH }, 16, 32);

    const triElements: FEAElement[] = [];
    plateMesh.elements.forEach((q, idx) => {
        const [n0, n1, n3, n2] = q.nodeIds;
        triElements.push({ id: idx * 2, nodeIds: [n0, n1, n3] });
        triElements.push({ id: idx * 2 + 1, nodeIds: [n0, n3, n2] });
    });

    const numNodes = plateMesh.nodes.length;
    const K_size = numNodes * 2;
    const K = Array.from({ length: K_size }, () => new Float64Array(K_size));
    const F = new Float64Array(K_size);

    // 3. Assemble Stiffness Matrix
    triElements.forEach(el => {
        const nodes = el.nodeIds.map(id => plateMesh.nodes[id]);
        const coords: [number, number][] = nodes.map(n => [n.z, n.y]);
        const ke = getCSTStiffness(coords, E, nu, t);

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const nodeI = el.nodeIds[i];
                const nodeJ = el.nodeIds[j];
                K[nodeI * 2][nodeJ * 2] += ke[i * 2][j * 2];
                K[nodeI * 2][nodeJ * 2 + 1] += ke[i * 2][j * 2 + 1];
                K[nodeI * 2 + 1][nodeJ * 2] += ke[i * 2 + 1][j * 2];
                K[nodeI * 2 + 1][nodeJ * 2 + 1] += ke[i * 2 + 1][j * 2 + 1];
            }
        }
    });

    // 4. Implement Loads (F)
    const hb = config.beam.depth;
    const wb = config.beam.width;
    const Mz = config.loads.momentZ * 1000000;
    const Vy = config.loads.shearY * 1000;

    // Find nodes inside the beam attachment area (Flanges + Web)
    const beamNodes = plateMesh.nodes.filter(n => Math.abs(n.z) < wb / 2 && Math.abs(n.y) < hb / 2);

    // Physical distribution of Mz: Fi = Mz * yi / sum(yi^2)
    const sumY2 = beamNodes.reduce((sum, n) => sum + n.y * n.y, 0) || 1;
    beamNodes.forEach(node => {
        const forceY = (Mz * node.y) / sumY2;
        const shearY = Vy / beamNodes.length;
        F[node.id * 2 + 1] += forceY + shearY;
    });

    // 5. Boundary Conditions (Bolts)
    const boltGroupWidth = (config.bolts.cols - 1) * config.bolts.colSpacing;
    const boltGroupHeight = (config.bolts.rows - 1) * config.bolts.rowSpacing;
    const boltStarts = [-boltGroupWidth / 2, -boltGroupHeight / 2];

    const constrainedNodes = new Set<number>();
    for (let r = 0; r < config.bolts.rows; r++) {
        for (let c = 0; c < config.bolts.cols; c++) {
            const bx = boltStarts[0] + c * config.bolts.colSpacing;
            const by = boltStarts[1] + r * config.bolts.rowSpacing;

            let minDist = Infinity;
            let closestId = -1;
            plateMesh.nodes.forEach(n => {
                const d = Math.sqrt(Math.pow(n.z - bx, 2) + Math.pow(n.y - by, 2));
                if (d < minDist) {
                    minDist = d;
                    closestId = n.id;
                }
            });
            if (closestId !== -1) constrainedNodes.add(closestId);
        }
    }

    const penalty = 1e16;
    constrainedNodes.forEach(id => {
        K[id * 2][id * 2] *= penalty;
        K[id * 2 + 1][id * 2 + 1] *= penalty;
    });

    // 6. Solve KU = F
    const ADense = Array.from(K, row => Array.from(row));
    const BDense = Array.from(F);
    const U = solveLU(ADense, BDense);

    // 7. Recovery & Stress mapping for the FEA Plate (Normalized by fy)
    const fy = materials.plate.fy;
    plateMesh.nodes.forEach(node => {
        const connectedTris = triElements.filter(el => el.nodeIds.includes(node.id));
        let sumStress = 0;
        connectedTris.forEach(tri => {
            const elNodes = tri.nodeIds.map(id => plateMesh.nodes[id]);
            const elCoords: [number, number][] = elNodes.map(n => [n.z, n.y]);
            const elU = [
                U[tri.nodeIds[0] * 2], U[tri.nodeIds[0] * 2 + 1],
                U[tri.nodeIds[1] * 2], U[tri.nodeIds[1] * 2 + 1],
                U[tri.nodeIds[2] * 2], U[tri.nodeIds[2] * 2 + 1]
            ];
            sumStress += getCSTStress(elCoords, elU, E, nu);
        });
        const rawStress = connectedTris.length > 0 ? sumStress / connectedTris.length : 0;
        node.stress = rawStress / fy; // NORMALIZE
    });

    const meshes: FEAMeshData[] = [plateMesh];

    // 8. Reinstate Beam and Column Meshes (Mapped Stress)
    const beamMesh = generateMemberMesh(config.beam, 1000, 'beam');
    beamMesh.nodes.forEach((n: FEANode) => {
        const attenuation = Math.exp(-n.z / 300);
        n.stress = (solverResults.global.maxUtil * 0.7) * attenuation;
    });
    meshes.push(beamMesh);

    const colLen = 2000;
    const columnMesh = generateMemberMesh(config.column, colLen, 'column');
    columnMesh.nodes.forEach((n: FEANode) => {
        const distFromConn = Math.abs(n.z - colLen / 2);
        n.stress = (solverResults.global.maxUtil * 0.4) * Math.exp(-distFromConn / 200);
    });
    meshes.push(columnMesh);

    // 9. Haunch Mesh (optional)
    if (config.haunch.enabled) {
        const haunchMesh = generateHaunchMesh(config.haunch);
        haunchMesh.nodes.forEach((n: FEANode) => {
            const distBenefit = Math.max(0, 1 - n.z / config.haunch.length);
            n.stress = solverResults.global.maxUtil * (0.6 + 0.4 * distBenefit);
        });
        meshes.push(haunchMesh);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        timestamp: Date.now(),
        meshes,
        isValid: true,
        configSnapshot: JSON.parse(JSON.stringify(config)),
        solverResults
    };
}
