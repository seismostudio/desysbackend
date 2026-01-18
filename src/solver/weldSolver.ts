import type { ConnectionConfig, UtilizationResult } from '../types';

/**
 * WELD SOLVER
 * Calculates stresses in the weld group using formal elastic section properties.
 * Based on EN 1993-1-8 (Directional method / Simplified method).
 * Based on EN 1993-1-8 (Directional method / Simplified method) or AISC 360.
 */

export function solveWelds(config: ConnectionConfig): {
    stress: UtilizationResult;
    dim: {
        width: number;
        height: number;
        thickness: number;
    };
} {
    if (!config.welds.enabled) {
        return {
            stress: { utilization: 0, capacity: 0, demand: 0 },
            dim: {
                width: 0,
                height: 0,
                thickness: 0
            }
        };
    }

    const { beam, welds, settings, loads } = config;
    const { materials, calculation } = settings;
    const a = welds.size; // Throat thickness
    const isAISC = calculation.code === 'AISC360';
    const isLRFD = calculation.philosophy === 'LRFD';

    // 1. Weld Group Geometry (Simplified for I-section)
    // We treat the weld as a line property tracing the beam profile.
    const h = beam.depth;
    const b = beam.width;
    const tf = beam.flangeThickness;
    const tw = beam.webThickness;

    // Components of the weld group:
    // - 4 Flange welds (top/bottom, outer only for simplification) -> width b
    // - 2 Web welds (both sides) -> height (h - 2*tf)

    let hw = 0

    if (!config.haunch.enabled) {
        hw = (h - 2 * tf); // weld height in beam
    } else {
        hw = (h - 2 * tf) + (config.haunch.depth - config.haunch.flangeThickness); // weld height in haunched beam
    }

    // const hw = h - 2 * tf;

    // Area of weld (Aw = Length * throat a)

    let flangeWeldLength = 0;

    if (!config.haunch.enabled) {
        flangeWeldLength = (2 * b) + (2 * (b - tw)); // Top outer & inner + Bottom outer & inner
    } else {
        flangeWeldLength = (2 * b) + (2 * (b - tw)) + ((config.haunch.flangeWidth - tw)); // Top outer & inner + Bottom outer & inner + Haunch flange
    }



    // const flangeWeldLength = (2 * b) + (2 * (b - tw)); // Top outer & inner + Bottom outer & inner
    const webWeldLength = 2 * hw;
    const Aw = (flangeWeldLength + webWeldLength) * a;

    // Second Moment of Inertia (Iw)
    // I_wz (Strong axis - resisting Mz)
    // Flanges: 2 * (b * a) * (h/2)^2
    // Web: 2 * (1/12 * a * hw^3)
    const Iwz = (2 * (b * a) * Math.pow(h / 2, 2)) + (2 * (1 / 12 * a * Math.pow(hw, 3)));

    // I_wy (Weak axis - resisting My)
    // Flanges: 2 * (1/12 * a * b^3)
    // Web: 2 * (hw * a) * (tw/2)^2
    const Iwy = (2 * (1 / 12 * a * Math.pow(b, 3))) + (2 * (hw * a) * Math.pow(tw / 2, 2));

    // Polar Moment (Ip) for Torsion (Simplified)
    const Ip = Iwz + Iwy;

    // 2. Material Strength
    let f_vw_d;
    if (isAISC) {
        // AISC 360 Chapter J2.4: Rn = 0.6 * Fexx
        // Fexx usually 480 MPa (E70) or 415 MPa (E60). We use fu as proxy.
        const Fexx = materials.weld.fu;
        const Rn = 0.6 * Fexx;
        const phi = calculation.phiOverride || 0.75;
        const omega = calculation.omegaOverride || 2.0;

        if (isLRFD) {
            f_vw_d = phi * Rn;
        } else {
            f_vw_d = Rn / omega;
        }
    } else {
        // EC3 Table 4.1
        const fu = materials.weld.fu;
        const beta_w = 0.85; // Standard for S275/S355
        const gammaM2 = calculation.gammaM2;
        f_vw_d = fu / (Math.sqrt(3) * beta_w * gammaM2);
    }

    // 3. Stress Calculations (Elastic Distribution)
    // Loads are already in N and Nmm (converted by connectionSolver)
    const N = loads.axial;
    const Vy = loads.shearY;
    const Vz = loads.shearZ;
    const Mx = loads.momentX;
    const My = loads.momentY;
    const Mz = loads.momentZ;

    // Stress from Axial (sigma_axial)
    const s_axial = N / Aw;

    // Stress from Bending (sigma_bending)
    const s_mz = (Mz * (h / 2)) / Iwz;
    const s_my = (My * (b / 2)) / Iwy;

    const s_normal_total = Math.abs(s_axial) + Math.abs(s_mz) + Math.abs(s_my);

    // Stress from Shear (tau_shear)
    // For AISC, shear is often considered separately for web and flange welds.
    // For EC3, a resultant shear is often used.
    const t_shear_v = Vy / (2 * hw * a); // Shear in web welds due to Vy
    const t_shear_h = Vz / (2 * b * a); // Shear in flange welds due to Vz (simplified)

    // Torsional Shear (tau_torsion) at furthest point
    const r_max = Math.sqrt(Math.pow(h / 2, 2) + Math.pow(b / 2, 2));
    const t_torsion = (Mx * r_max) / Ip;

    // Equivalent Stress (Resultant tau)
    let stress_eq;
    if (isAISC) {
        // In AISC, we often check the vector resultant against Fn
        // This is a simplified approach, often a vector sum of shear components
        // and normal stress is checked separately or combined in a specific way.
        // For a general check, we combine normal and shear stresses.
        // This specific combination is a common simplification for AISC weld checks.
        stress_eq = Math.sqrt(Math.pow(s_normal_total, 2) + Math.pow(t_shear_v + t_torsion, 2) + Math.pow(t_shear_h, 2));
    } else {
        // Eurocode directional stress check
        // The original code used a resultant shear for Vy and Vz.
        // We'll adapt to the new t_shear_v and t_shear_h.
        // For EC3, the resultant shear is typically calculated as sqrt(tau_perp^2 + tau_par^2)
        // Here, t_shear_v and t_shear_h are perpendicular and parallel components.
        const resultant_shear_from_V = Math.sqrt(Math.pow(t_shear_v, 2) + Math.pow(t_shear_h, 2));
        stress_eq = Math.sqrt(Math.pow(s_normal_total, 2) + 3 * Math.pow(resultant_shear_from_V + t_torsion, 2));
    }

    const utilization = stress_eq / f_vw_d;

    return {
        stress: {
            utilization,
            capacity: f_vw_d,
            demand: stress_eq
        },
        dim: {
            width: b,
            height: h,
            thickness: a
        }
    };
}
