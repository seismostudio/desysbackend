/**
 * FEA MATH UTILITIES
 * Provides basic linear algebra and matrix solving capabilities.
 */

/**
 * Solves Ax = B using LU Decomposition with partial pivoting.
 * Optimized for dense matrices of moderate size (~1000 nodes).
 */
export function solveLU(A: number[][], B: number[]): number[] {
    const n = B.length;
    const lu = A.map(row => [...row]);
    const p = Array.from({ length: n }, (_, i) => i);

    // LU Factorization with pivoting
    for (let i = 0; i < n; i++) {
        let max = 0;
        let pivotIdx = i;
        for (let j = i; j < n; j++) {
            const val = Math.abs(lu[j][i]);
            if (val > max) {
                max = val;
                pivotIdx = j;
            }
        }

        // Swap rows
        [p[i], p[pivotIdx]] = [p[pivotIdx], p[i]];
        [lu[i], lu[pivotIdx]] = [lu[pivotIdx], lu[i]];

        for (let j = i + 1; j < n; j++) {
            lu[j][i] /= lu[i][i];
            for (let k = i + 1; k < n; k++) {
                lu[j][k] -= lu[j][i] * lu[i][k];
            }
        }
    }

    // Forward substitution (Ly = Pb)
    const y = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
        y[i] = B[p[i]];
        for (let j = 0; j < i; j++) {
            y[i] -= lu[i][j] * y[j];
        }
    }

    // Backward substitution (Ux = y)
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = y[i];
        for (let j = i + 1; j < n; j++) {
            x[i] -= lu[i][j] * x[j];
        }
        x[i] /= lu[i][i];
    }

    return x;
}

/**
 * Multiplies two matrices or matrix and vector.
 */
export function multiplyMV(M: number[][], V: number[]): number[] {
    return M.map(row => row.reduce((sum, val, i) => sum + val * V[i], 0));
}

/**
 * Matrix transpose.
 */
export function transpose(M: number[][]): number[][] {
    return M[0].map((_, colIdx) => M.map(row => row[colIdx]));
}
