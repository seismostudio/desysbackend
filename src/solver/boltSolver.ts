import type { ConnectionConfig } from '../types';

/**
 * BOLT GROUP SOLVER
 * Calculates shear and tension forces in bolts based on simplified elastic distribution.
 */

export function solveBolts(config: ConnectionConfig) {
    const { bolts, loads, settings } = config;
    const { materials, calculation } = settings;
    const isAISC = calculation.code === 'AISC360';
    const isLRFD = calculation.philosophy === 'LRFD';

    // 1. Bolt Properties
    const Ab = (Math.PI * Math.pow(bolts.diameter, 2)) / 4;
    const As = 0.78 * Ab; // Stress area for EC3

    let Fv_Rd, Ft_Rd;

    if (isAISC) {
        // AISC 360 Table J3.2 (Approx for typical structural bolts like A325/A490 or Grade 8.8/10.9 equivalent)
        // Using Grade 8.8 as A325 equivalent: Fnv = 372 MPa, Fnt = 620 MPa
        const Fnv = 0.45 * materials.bolt.fub; // Simplified for "threads not excluded"
        const Fnt = 0.75 * materials.bolt.fub;

        const phi = calculation.phiOverride || 0.75;
        const omega = calculation.omegaOverride || 2.0;

        if (isLRFD) {
            Fv_Rd = phi * Fnv * Ab;
            Ft_Rd = phi * Fnt * Ab;
        } else {
            Fv_Rd = (Fnv * Ab) / omega;
            Ft_Rd = (Fnt * Ab) / omega;
        }
    } else {
        // Eurocode 3 Table 3.4
        const gammaM2 = calculation.gammaM2;
        Fv_Rd = (0.6 * materials.bolt.fub * As) / gammaM2;
        Ft_Rd = (0.9 * materials.bolt.fub * As) / gammaM2;
    }

    // 2. Geometry & Positions
    let boltPositions: { x: number; y: number }[] = [];
    const groupWidth = (bolts.cols - 1) * bolts.colSpacing;
    const groupHeight = (bolts.rows - 1) * bolts.rowSpacing;
    const startX = -groupWidth / 2;
    const startY = -groupHeight / 2;

    for (let r = 0; r < bolts.rows; r++) {
        for (let c = 0; c < bolts.cols; c++) {
            boltPositions.push({
                x: startX + c * bolts.colSpacing,
                y: startY + r * bolts.rowSpacing
            });
        }
    }

    if (config.haunch.enabled && config.haunch.bolts.enabled) {
        const hb = config.haunch.bolts;
        const startYHaunch = -(config.beam.depth / 2 + hb.rowSpacing);
        for (let r = 0; r < hb.rows; r++) {
            for (let c = 0; c < bolts.cols; c++) {
                boltPositions.push({
                    x: startX + c * bolts.colSpacing,
                    y: startYHaunch - r * hb.rowSpacing
                });
            }
        }
    }

    const numBolts = boltPositions.length;
    let sumR2 = 0, sumY2 = 0, sumX2 = 0;
    for (const b of boltPositions) {
        sumR2 += b.x * b.x + b.y * b.y;
        sumY2 += b.y * b.y;
        sumX2 += b.x * b.x;
    }

    // 3. Force Distribution per Bolt
    const individualResults = boltPositions.map((bolt, idx) => {
        // Shear
        const torsionShearY = sumR2 > 1e-6 ? -(loads.momentX * bolt.x) / sumR2 : 0;
        const torsionShearZ = sumR2 > 1e-6 ? (loads.momentX * bolt.y) / sumR2 : 0;
        const shearY = (loads.shearY / numBolts) + torsionShearY;
        const shearZ = (loads.shearZ / numBolts) + torsionShearZ;
        const boltShear = Math.sqrt(shearY * shearY + shearZ * shearZ);

        // Tension
        let boltTension = Math.max(0, loads.axial || 0) / numBolts;
        if (calculation.stressDistribution === 'linear') {
            if (sumY2 > 1e-6) boltTension += (loads.momentZ * bolt.y) / sumY2;
            if (sumX2 > 1e-6) boltTension += (loads.momentY * bolt.x) / sumX2;
        } else if (calculation.stressDistribution === 'plastic') {
            const compressionY = -config.beam.depth / 2;
            const tensionBolts = boltPositions.filter(b => b.y > compressionY);
            const leverArmY = tensionBolts.reduce((sum, b) => sum + (b.y - compressionY), 0) / tensionBolts.length;
            if (bolt.y > compressionY && Math.abs(leverArmY) > 0.1) {
                boltTension += (loads.momentZ) / (leverArmY * tensionBolts.length);
            }
        } else {
            const leverArmY = config.beam.depth * 0.8;
            boltTension += Math.abs(loads.momentZ) / (leverArmY * numBolts);
        }
        boltTension = Math.max(0, boltTension);

        // Utilization
        let utilization;
        if (isAISC) {
            // AISC J3.7 Combined Tension and Shear
            const fv = boltShear / Ab;
            const Fnt = 0.75 * materials.bolt.fub;
            const Fnv = 0.45 * materials.bolt.fub;
            const phi = calculation.phiOverride || 0.75;
            const omega = calculation.omegaOverride || 2.0;

            let Fnt_prime;
            if (isLRFD) {
                Fnt_prime = Math.min(Fnt, 1.3 * Fnt - (Fnt / (phi * Fnv)) * fv);
                utilization = boltTension / (phi * Fnt_prime * Ab);
            } else {
                Fnt_prime = Math.min(Fnt, 1.3 * Fnt - (1.3 * Fnt / Fnv) * fv * omega); // Approx ASD
                utilization = boltTension / (Fnt_prime * Ab / omega);
            }
            // Ensure shear util is also considered
            utilization = Math.max(utilization, boltShear / Fv_Rd);
        } else {
            // EC3 Combined
            const sUtil = boltShear / Fv_Rd;
            utilization = sUtil + (boltTension / (1.4 * Ft_Rd));
        }

        return {
            id: `bolt-${idx}`,
            position: [0, bolt.y, bolt.x] as [number, number, number],
            shear: boltShear,
            tension: boltTension,
            utilization: utilization
        };
    });

    const maxResults = individualResults.reduce((acc, curr) => ({
        shear: Math.max(acc.shear, curr.shear),
        tension: Math.max(acc.tension, curr.tension),
        utilization: Math.max(acc.utilization, curr.utilization)
    }), { shear: 0, tension: 0, utilization: 0 });

    return {
        shear: { utilization: maxResults.shear / Fv_Rd, capacity: Fv_Rd, demand: maxResults.shear },
        tension: { utilization: maxResults.tension / Ft_Rd, capacity: Ft_Rd, demand: maxResults.tension },
        combined: { utilization: maxResults.utilization, capacity: 1.0, demand: maxResults.utilization },
        maxForce: Math.max(maxResults.shear, maxResults.tension),
        individualBolts: individualResults
    };
}
