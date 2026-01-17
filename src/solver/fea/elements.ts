/**
 * FEA ELEMENTS
 * Defines the stiffness and stress recovery for basic FEA elements.
 */

/**
 * Constant Strain Triangle (CST) for Plane Stress.
 * Node coordinates (x1,y1), (x2,y2), (x3,y3) in CCW order.
 */
export function getCSTStiffness(coords: [number, number][], E: number, nu: number, t: number): number[][] {
    const [[x1, y1], [x2, y2], [x3, y3]] = coords;

    // Area of triangle
    const A = 0.5 * Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));

    // Elasticity Matrix D (Plane Stress)
    const factor = (E * t) / (1 - nu * nu);
    const D = [
        [1, nu, 0],
        [nu, 1, 0],
        [0, 0, (1 - nu) / 2]
    ].map(row => row.map(val => val * factor / t)); // Multiply by thickness elsewhere or here? Standard is D*t*Area

    // Strain-Displacement Matrix B
    const y23 = y2 - y3, y31 = y3 - y1, y12 = y1 - y2;
    const x32 = x3 - x2, x13 = x1 - x3, x21 = x2 - x1;

    const B = [
        [y23, 0, y31, 0, y12, 0],
        [0, x32, 0, x13, 0, x21],
        [x32, y23, x13, y31, x21, y12]
    ].map(row => row.map(val => val / (2 * A)));

    // Element Stiffness Matrix k = B^T * D * B * A * t
    // 1. Calculate B^T * D
    const BT = B[0].map((_, colIdx) => B.map(row => row[colIdx]));
    const BTD = BT.map(row =>
        D[0].map((_, colIdx) => row.reduce((sum, val, i) => sum + val * D[i][colIdx], 0))
    );

    // 2. Calculate BTD * B
    const k = BTD.map(row =>
        B[0].map((_, colIdx) => row.reduce((sum, val, i) => sum + val * B[i][colIdx], 0) * A * t)
    );

    return k;
}

/**
 * Recover Von Mises Stress at the centroid of a CST element.
 */
export function getCSTStress(coords: [number, number][], u: number[], E: number, nu: number): number {
    const [[x1, y1], [x2, y2], [x3, y3]] = coords;
    const A = 0.5 * Math.abs(x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));

    const y23 = y2 - y3, y31 = y3 - y1, y12 = y1 - y2;
    const x32 = x3 - x2, x13 = x1 - x3, x21 = x2 - x1;

    const B = [
        [y23, 0, y31, 0, y12, 0],
        [0, x32, 0, x13, 0, x21],
        [x32, y23, x13, y31, x21, y12]
    ].map(row => row.map(val => val / (2 * A)));

    // Strain = B * u
    const strain = B.map(row => row.reduce((sum, val, i) => sum + val * u[i], 0));

    // Stress = D * strain
    const factor = E / (1 - nu * nu);
    const sx = factor * (strain[0] + nu * strain[1]);
    const sy = factor * (strain[1] + nu * strain[0]);
    const txy = factor * ((1 - nu) / 2) * strain[2];

    // Von Mises = sqrt(sx^2 - sx*sy + sy^2 + 3*txy^2)
    return Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * txy * txy);
}
