import type { ConnectionConfig, UtilizationResult } from '../types';

/**
 * COLUMN SOLVER
 * Calculates column component resistances.
 * Supports Eurocode 3 (EN 1993-1-8) and AISC 360 (Chapter J10).
 */
export function solveColumn(config: ConnectionConfig, maxBoltShear: number, maxBoltTension: number, beamFlangeForce: number): {
    flangeBending: UtilizationResult;
    webTension: UtilizationResult;
    webCompression: UtilizationResult;
    webShear: UtilizationResult;
    bearing: UtilizationResult;
} {
    const { column, beam, settings, columnRotation } = config;
    const { materials, calculation } = settings;
    const isAISC = calculation.code === 'AISC360';
    const isLRFD = calculation.philosophy === 'LRFD';

    const fu = materials.member.fu;
    const fy = materials.member.fy;
    const E = materials.member.E;
    const isWeakAxis = columnRotation === 90;

    let resFB, resWT, resWC, resWS, resB;

    if (isAISC) {
        // --- AISC 360 Chapter J10 ---
        const tf = isWeakAxis ? column.webThickness : column.flangeThickness;
        const tw = isWeakAxis ? column.flangeThickness : column.webThickness;
        // k = distance from outer face of flange to web toe of fillet
        const k = column.flangeThickness + (column.rootRadius || 0);
        const N = beam.flangeThickness; // Bearing length

        // J10.1 Flange Local Bending
        const Rn_FB = 6.25 * tf * tf * fy;
        const phi_FB = 0.90;
        const omega_FB = 1.67;
        const capFB = isLRFD ? phi_FB * Rn_FB : Rn_FB / omega_FB;

        // J10.2 Web Local Yielding
        const Rn_WY = (5 * k + N) * fy * tw;
        const phi_WY = 1.00;
        const omega_WY = 1.50;
        const capWY = isLRFD ? phi_WY * Rn_WY : Rn_WY / omega_WY;

        // J10.3 Web Local Crippling
        // Rn = 0.8 * tw^2 [1 + 3(N/d)(tw/tf)^1.5] sqrt(E*Fy*tf/tw)
        const Rn_WC = 0.8 * tw * tw * (1 + 3 * (N / column.depth) * Math.pow(tw / tf, 1.5)) * Math.sqrt(E * fy * tf / tw);
        const phi_WC = 0.75;
        const omega_WC = 2.00;
        const capWC = isLRFD ? phi_WC * Rn_WC : Rn_WC / omega_WC;

        // J10.6 Web Panel Shear
        const Rn_WS = 0.6 * fy * column.depth * tw;
        const phi_WS = 0.90;
        const omega_WS = 1.67;
        const capWS = isLRFD ? phi_WS * Rn_WS : Rn_WS / omega_WS;

        // Bearing on column
        const Rn_B = 2.4 * config.bolts.diameter * tf * fu;
        const phi_B = 0.75;
        const omega_B = 2.0;
        const capB = isLRFD ? phi_B * Rn_B : Rn_B / omega_B;

        resFB = { utilization: maxBoltTension / capFB, capacity: capFB, demand: maxBoltTension };
        resWT = { utilization: maxBoltTension / capWY, capacity: capWY, demand: maxBoltTension };
        resWC = { utilization: Math.abs(beamFlangeForce) / capWC, capacity: capWC, demand: Math.abs(beamFlangeForce) };
        resWS = { utilization: Math.abs(beamFlangeForce) / capWS, capacity: capWS, demand: Math.abs(beamFlangeForce) };
        resB = { utilization: maxBoltShear / capB, capacity: capB, demand: maxBoltShear };
    } else {
        // --- EUROCODE 3 (EN 1993-1-8) ---
        const t_f = isWeakAxis ? column.webThickness : column.flangeThickness;
        const t_w = isWeakAxis ? column.flangeThickness : column.webThickness;
        const gammaM0 = calculation.gammaM0;
        const gammaM2 = calculation.gammaM2;

        // 1. Column Flange/Web Bending (CFB/CWB)
        const beff = 200;
        const M_pl_Rd = (0.25 * beff * t_f * t_f * fy) / gammaM0;
        const m = 30;
        const capFB = (4 * M_pl_Rd) / m;

        // 2. Column Web Tension (CWT)
        const capWT = (beff * t_w * fy) / gammaM0;

        // 3. Column Web Compression (CWC)
        const capWC = (beff * t_w * fy) / gammaM0;

        // 4. Column Web Panel Shear (CWS)
        const Av_c = column.depth * t_w;
        const capWS = (Av_c * fy) / (Math.sqrt(3) * gammaM0);

        // 5. Column Bearing
        const d0 = config.bolts.diameter + 2;
        const capB = (2.5 * 1.0 * fu * d0 * t_f) / gammaM2;

        resFB = { utilization: maxBoltTension / capFB, capacity: capFB, demand: maxBoltTension };
        resWT = { utilization: maxBoltTension / capWT, capacity: capWT, demand: maxBoltTension };
        resWC = { utilization: Math.abs(beamFlangeForce) / capWC, capacity: capWC, demand: Math.abs(beamFlangeForce) };
        resWS = { utilization: Math.abs(beamFlangeForce) / capWS, capacity: capWS, demand: Math.abs(beamFlangeForce) };
        resB = { utilization: maxBoltShear / capB, capacity: capB, demand: maxBoltShear };
    }

    return {
        flangeBending: resFB,
        webTension: resWT,
        webCompression: resWC,
        webShear: resWS,
        bearing: resB
    };
}
