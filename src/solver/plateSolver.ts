import type { ConnectionConfig, UtilizationResult } from '../types';

/**
 * PLATE SOLVER
 * Calculates bearing and yielding resistance of the end plate.
 * Supports Eurocode 3 (EN 1993-1-8) and AISC 360 (LRFD/ASD).
 */
export function solvePlate(config: ConnectionConfig, maxBoltShear: number, maxBoltTension: number): {
    bearing: UtilizationResult;
    yielding: UtilizationResult;
    stressDistribution: 'uniform' | 'linear' | 'plastic';
} {
    const { plate, bolts, settings, columnRotation } = config;
    const { materials, calculation } = settings;
    const isAISC = calculation.code === 'AISC360';
    const isLRFD = calculation.philosophy === 'LRFD';

    const fu = materials.plate.fu;
    const fy = materials.plate.fy;
    const d = bolts.diameter;
    const d0 = d + 2; // Standard hole clearance
    const t = plate.thickness;
    const isWeakAxis = columnRotation === 90;

    let bearingUtil, yieldingUtil;
    let Fb_Rd, Fy_Rd;

    if (isAISC) {
        // --- AISC 360 Chapter J3.10 (Bearing and Tearout) ---
        const Lc_edge = bolts.edgeDistanceY - 0.5 * d0;
        const Lc_spacing = bolts.rowSpacing - d0;
        const Lc = Math.min(Lc_edge, Lc_spacing);

        // Rn = 1.2 * Lc * t * Fu <= 2.4 * d * t * Fu
        const Rn_bearing = 2.4 * d * t * fu;
        const Rn_tearout = 1.2 * Lc * t * fu;
        const Rn = Math.min(Rn_bearing, Rn_tearout);

        const phi = calculation.phiOverride || 0.75;
        const omega = calculation.omegaOverride || 2.0;

        if (isLRFD) {
            Fb_Rd = phi * Rn;
            Fy_Rd = 0.9 * (plate.width * t * fy); // Simplified yielding check for gross section
        } else {
            Fb_Rd = Rn / omega;
            Fy_Rd = (plate.width * t * fy) / 1.67;
        }
        bearingUtil = maxBoltShear / Fb_Rd;
        yieldingUtil = (maxBoltTension * bolts.cols) / Fy_Rd;
    } else {
        // --- EUROCODE 3 (EN 1993-1-8) ---
        const gammaM2 = calculation.gammaM2;
        const e1 = bolts.edgeDistanceY;
        const p1 = bolts.rowSpacing;
        const e2 = bolts.edgeDistanceX;
        const p2 = bolts.colSpacing;

        const alpha_b = Math.min(e1 / (3 * d0), p1 / (3 * d0) - 0.25, materials.bolt.fub / fu, 1.0);
        const k1 = Math.min(2.8 * e2 / d0 - 1.7, 1.4 * p2 / d0 - 1.7, 2.5);

        const reductionFactor = isWeakAxis ? 0.8 : 1.0;
        Fb_Rd = (k1 * alpha_b * fu * d * t * reductionFactor) / gammaM2;
        bearingUtil = maxBoltShear / Fb_Rd;

        // T-Stub Component Method (Simplified Mode 1)
        // Leverage arm 'm'
        const m = 0.8 * bolts.edgeDistanceX;
        const leff = Math.min(p1, 2 * Math.PI * m);
        const Mpl_Rd = (0.25 * leff * t * t * fy) / calculation.gammaM0;
        Fy_Rd = (4 * Mpl_Rd) / m;
        yieldingUtil = maxBoltTension / Fy_Rd;
    }

    return {
        bearing: {
            utilization: bearingUtil,
            capacity: Fb_Rd,
            demand: maxBoltShear
        },
        yielding: {
            utilization: yieldingUtil,
            capacity: Fy_Rd,
            demand: maxBoltTension
        },
        stressDistribution: calculation.stressDistribution
    };
}
