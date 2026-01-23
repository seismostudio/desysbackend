import numpy as np
try:
    from scipy.sparse import lil_matrix, csr_matrix
    from scipy.sparse.linalg import spsolve
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    print("Warning: scipy not available, using dense matrices (slower for large models)")

def zeros(rows: int, cols: int) -> np.ndarray:
    return np.zeros((rows, cols))

def zeros_vector(size: int) -> np.ndarray:
    return np.zeros(size)

def solve_linear_system(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    try:
        # Use numpy's efficient solver
        return np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        print("Warning: Singular matrix detected, using Least Squares solution.")
        # rcond=None to allow machine precision tolerance
        x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
        return x

def assemble_global(global_k: np.ndarray, local_k: np.ndarray, dofs: list[int]):
    """
    Assemble element stiffness matrix into global stiffness matrix using direct indexing.
    This is equivalent to the TS loop but vectorized where possible or just looped efficiently in Python.
    """
    # Create a grid of indices
    # We want global_k[r, c] += local_k[i, j]
    # where r = dofs[i], c = dofs[j]
    
    # Using np.ix_ to generate the meshgrid of indices for broadcasting
    idx_grid = np.ix_(dofs, dofs)
    global_k[idx_grid] += local_k

def create_sparse_matrix(size: int):
    """Create sparse matrix for global stiffness (if scipy available)"""
    if SCIPY_AVAILABLE:
        return lil_matrix((size, size))
    else:
        return np.zeros((size, size))

def assemble_sparse(global_k, local_k: np.ndarray, dofs: list[int]):
    """Assemble into sparse matrix (lil_matrix)"""
    for i, row_dof in enumerate(dofs):
        for j, col_dof in enumerate(dofs):
            global_k[row_dof, col_dof] += local_k[i, j]

def solve_sparse(K, F):
    """Solve using sparse solver if available"""
    if SCIPY_AVAILABLE and hasattr(K, 'tocsr'):
        # Convert to CSR for efficient solving
        K_csr = K.tocsr()
        try:
            return spsolve(K_csr, F)
        except:
            # Fallback to lstsq if singular
            print("Warning: Sparse solve failed, using dense fallback")
            return solve_linear_system(K.toarray(), F)
    else:
        return solve_linear_system(K, F)
