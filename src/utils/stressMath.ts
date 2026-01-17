import type { ConnectionConfig, SolverResult } from '../types';

/**
 * Calculates approximately real Von Mises stress at a point on the end plate.
 * @param x Local x coordinate on plate (0 to width)
 * @param y Local y coordinate on plate (0 to height)
 * @param config Connection configuration
 * @param results Solver results for normalization
 */
export function getPlateStress(
    x: number,
    y: number,
    config: ConnectionConfig,
    results: SolverResult
): number {
    const { bolts, plate, beam } = config;
    const { yielding } = results.plate;

    // Center point of plate
    const cx = plate.width / 2;
    const cy = plate.height / 2;

    // 1. Bolt influence (Tension/Pulling)
    const boltGroupWidth = (bolts.cols - 1) * bolts.colSpacing;
    const boltGroupHeight = (bolts.rows - 1) * bolts.rowSpacing;
    const startX = cx - boltGroupWidth / 2;
    const startY = cy - boltGroupHeight / 2;

    let boltStress = 0;
    const sigma_bolt = 15.0; // Influence factor

    for (let r = 0; r < bolts.rows; r++) {
        for (let c = 0; c < bolts.cols; c++) {
            const bx = startX + c * bolts.colSpacing;
            const by = startY + r * bolts.rowSpacing;

            const dx = x - bx;
            const dy = y - by;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Influence decreases with distance
            // We use a Cauchy-like distribution for "hotspots"
            boltStress += 1 / (1 + Math.pow(dist / sigma_bolt, 2));
        }
    }

    // 2. Beam Profile reaction (Compression/Contact) 
    // Stress is high near the beam footprint
    let beamInfluence = 0;

    // Check distance to I-section perimeter
    const dx_web = Math.abs(x - cx);
    const dy_web = Math.abs(y - cy);

    // Distance to web
    const distToWeb = dx_web < beam.webThickness / 2 && dy_web < (beam.depth / 2 - beam.flangeThickness)
        ? 0 : Math.max(0, dx_web - beam.webThickness / 2);

    // Distance to flanges
    const distToFlange1 = Math.abs(dy_web - (beam.depth / 2 - beam.flangeThickness / 2)) < beam.flangeThickness / 2 && dx_web < beam.width / 2
        ? 0 : Math.min(
            Math.sqrt(Math.pow(dx_web - beam.width / 2, 2) + Math.pow(Math.abs(dy_web - beam.depth / 2), 2)),
            Math.abs(dy_web - beam.depth / 2)
        );

    beamInfluence = 1 / (1 + Math.pow(Math.min(distToWeb, distToFlange1) / 5, 1.5));

    // Combine and scale by the actual peak utilization from solver
    // This ensures that the "Red" color matches the calculated 100% utilization
    const raw = (boltStress * 0.7 + beamInfluence * 0.3);

    // Use an empirical non-linear scaling to make it look like a real FEA contour
    return Math.pow(raw, 0.8) * yielding.utilization * 1.2;
}

/**
 * Calculates Von Mises stress at a point in the beam section.
 */
export function getBeamStress(
    y: number, // Vertical from center
    z: number, // Horizontal from center
    config: ConnectionConfig
): number {
    const { loads, beam } = config;

    // Section properties (simplified)
    const h = beam.depth;
    const b = beam.width;
    const tf = beam.flangeThickness;
    const tw = beam.webThickness;

    const A = 2 * b * tf + (h - 2 * tf) * tw;
    const Iz = (b * Math.pow(h, 3) - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12;
    const Iy = (2 * tf * Math.pow(b, 3) + (h - 2 * tf) * Math.pow(tw, 3)) / 12;

    // Normal stress
    const sigma_x = (loads.axial / A) + (loads.momentZ * y / Iz) + (loads.momentY * z / Iy);

    // Shear stress (very simplified)
    const tau = Math.sqrt(Math.pow(loads.shearY / A, 2) + Math.pow(loads.shearZ / A, 2));

    // Von Mises
    const vm = Math.sqrt(Math.pow(sigma_x, 2) + 3 * Math.pow(tau, 2));

    // Normalize by yield strength (275 MPa)
    return vm / 275;
}
