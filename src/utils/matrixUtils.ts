// Basic Matrix Operations for FEA

export type Matrix = number[][];
export type Vector = number[];

/**
 * Create a zero matrix
 */
export function zeros(rows: number, cols: number): Matrix {
    return Array(rows).fill(0).map(() => Array(cols).fill(0));
}

/**
 * Create a zero vector
 */
export function zerosVector(size: number): Vector {
    return Array(size).fill(0);
}

/**
 * Matrix multiplication: C = A * B
 */
export function matrixMultiply(A: Matrix, B: Matrix): Matrix {
    const rowsA = A.length;
    const colsA = A[0].length;
    const rowsB = B.length;
    const colsB = B[0].length;

    if (colsA !== rowsB) {
        throw new Error(`Matrix dimensions incompatible: ${rowsA}x${colsA} * ${rowsB}x${colsB}`);
    }

    const C = zeros(rowsA, colsB);
    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            let sum = 0;
            for (let k = 0; k < colsA; k++) {
                sum += A[i][k] * B[k][j];
            }
            C[i][j] = sum;
        }
    }
    return C;
}

/**
 * Matrix transpose
 */
export function transpose(A: Matrix): Matrix {
    const rows = A.length;
    const cols = A[0].length;
    const AT = zeros(cols, rows);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            AT[j][i] = A[i][j];
        }
    }
    return AT;
}

/**
 * Add two matrices: C = A + B
 */
export function matrixAdd(A: Matrix, B: Matrix): Matrix {
    const rows = A.length;
    const cols = A[0].length;
    if (B.length !== rows || B[0].length !== cols) {
        throw new Error('Matrix dimensions must match for addition');
    }
    const C = zeros(rows, cols);
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            C[i][j] = A[i][j] + B[i][j];
        }
    }
    return C;
}

/**
 * Solve Ax = b using Gaussian elimination with partial pivoting
 * NOTE: This is simplified for educational purposes. Production should use sparse solvers.
 */
export function solveLinearSystem(A: Matrix, b: Vector): Vector {
    const n = A.length;
    // Create augmented matrix [A | b]
    const aug: Matrix = A.map((row, i) => [...row, b[i]]);

    // Forward elimination with partial pivoting
    for (let k = 0; k < n; k++) {
        // Find pivot
        let maxRow = k;
        for (let i = k + 1; i < n; i++) {
            if (Math.abs(aug[i][k]) > Math.abs(aug[maxRow][k])) {
                maxRow = i;
            }
        }

        // Swap rows
        [aug[k], aug[maxRow]] = [aug[maxRow], aug[k]];

        // Check for singular matrix
        if (Math.abs(aug[k][k]) < 1e-10) {
            throw new Error(`Singular matrix detected at diagonal element ${k}`);
        }

        // Eliminate below diagonal
        for (let i = k + 1; i < n; i++) {
            const factor = aug[i][k] / aug[k][k];
            for (let j = k; j <= n; j++) {
                aug[i][j] -= factor * aug[k][j];
            }
        }
    }

    // Back substitution
    const x = zerosVector(n);
    for (let i = n - 1; i >= 0; i--) {
        x[i] = aug[i][n];
        for (let j = i + 1; j < n; j++) {
            x[i] -= aug[i][j] * x[j];
        }
        x[i] /= aug[i][i];
    }

    return x;
}

/**
 * Assemble element stiffness matrix into global stiffness matrix
 */
export function assembleGlobal(
    globalK: Matrix,
    localK: Matrix,
    dofs: number[]
): void {
    const n = localK.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            globalK[dofs[i]][dofs[j]] += localK[i][j];
        }
    }
}
