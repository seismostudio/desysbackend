
import type { ConnectionConfig, SolverResult } from '../types';
import { solveBolts } from './boltSolver';
import { solvePlate } from './plateSolver';
import { solveWelds } from './weldSolver';
import { solveColumn } from './columnSolver';

export function solveConnection(config: ConnectionConfig): SolverResult {
    // 0. Standardize Units (Convert kN/kNm to N/Nmm for internal calculation)
    const convertedLoads = {
        axial: config.loads.axial * 1000,
        shearY: config.loads.shearY * 1000,
        shearZ: config.loads.shearZ * 1000,
        momentX: config.loads.momentX * 1000000,
        momentY: config.loads.momentY * 1000000,
        momentZ: config.loads.momentZ * 1000000,
    };
    // 1. Calculate Dynamic Edge Distances (link Plate Dim to Bolt Layout)
    const totalRowHeight = (config.bolts.rows - 1) * config.bolts.rowSpacing;
    const totalColWidth = (config.bolts.cols - 1) * config.bolts.colSpacing;

    // Assume bolts are centered on the plate
    const dynamicEdgeX = (config.plate.width - totalColWidth) / 2;
    const dynamicEdgeY = (config.plate.height - totalRowHeight) / 2;

    const c: ConnectionConfig = {
        ...config,
        loads: convertedLoads,
        bolts: {
            ...config.bolts,
            edgeDistanceX: Math.max(dynamicEdgeX, 0),
            edgeDistanceY: Math.max(dynamicEdgeY, 0)
        }
    };

    // 2. Calculate Bolt Forces
    const boltRes = solveBolts(c);

    // 3. Calculate Plate Stresses
    const plateRes = solvePlate(c, boltRes.maxForce, boltRes.tension.demand);

    // 3. Calculate Weld Stresses
    const weldRes = solveWelds(c);

    // 4. Calculate Column Resistance
    const beamFlangeForce = convertedLoads.momentZ / (config.beam.depth - config.beam.flangeThickness);

    const nullUtil = { utilization: 0, capacity: 0, demand: 0 };
    const colRes = config.settings.calculation.checkColumnResistance
        ? solveColumn(c, boltRes.shear.demand, boltRes.tension.demand, beamFlangeForce)
        : {
            flangeBending: nullUtil,
            webTension: nullUtil,
            webCompression: nullUtil,
            webShear: nullUtil,
            bearing: nullUtil
        };

    // 5. Global Assessment
    const utils = [
        { name: "Bolt Shear", val: boltRes.shear.utilization },
        { name: "Bolt Tension", val: boltRes.tension.utilization },
        { name: "Bolt Combined", val: boltRes.combined.utilization },
        { name: "Plate Bearing", val: plateRes.bearing.utilization },
        { name: "Plate Yielding", val: plateRes.yielding.utilization },
        { name: "Weld Stress", val: weldRes.stress.utilization },
    ];

    if (config.settings.calculation.checkColumnResistance) {
        utils.push(
            { name: "Column Flange Bending", val: colRes.flangeBending.utilization },
            { name: "Column Web Tension", val: colRes.webTension.utilization },
            { name: "Column Web Compression", val: colRes.webCompression.utilization },
            { name: "Column Web Shear", val: colRes.webShear.utilization },
            { name: "Column Bearing", val: colRes.bearing.utilization }
        );
    }

    let maxUtil = 0;
    let gov = { component: "None", mode: "None", utilization: 0 };

    for (const u of utils) {
        if (u.val > maxUtil) {
            maxUtil = u.val;
            gov = { component: u.name.split(' ')[0], mode: u.name, utilization: u.val };
        }
    }

    return {
        designCode: config.settings.calculation.code,
        philosophy: config.settings.calculation.philosophy,
        columnAnalysisEnabled: config.settings.calculation.checkColumnResistance,
        bolts: boltRes,
        plate: plateRes,
        welds: weldRes,
        column: colRes,
        global: {
            maxUtil,
            governingFailure: gov,
            isSafe: maxUtil <= 1.0
        }
    };
}
