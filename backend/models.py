from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Union

# ============================================
# MATERIAL TYPES
# ============================================

class BaseMaterial(BaseModel):
    id: str
    name: str
    type: str # 'Steel' | 'Concrete' | 'LinearElastic'
    E: float      # Young's Modulus (MPa)
    G: float      # Shear Modulus (MPa)
    poisson: float # Poisson's ratio
    density: float # kg/m³

class Material(BaseMaterial):
    fy: Optional[float] = None
    fu: Optional[float] = None
    fc: Optional[float] = None
    ft: Optional[float] = None

# ============================================
# FRAME SECTION TYPES
# ============================================

class SectionProperties(BaseModel):
    A: float   # Cross-sectional area (m²)
    Ix: float  # Moment of inertia about x-axis (m⁴)
    Iy: float  # Moment of inertia about y-axis (m⁴)
    Iz: float  # Moment of inertia about z-axis (m⁴)
    J: float   # Torsional constant (m⁴)
    Sy: float  # Section modulus about y-axis (m³)
    Sz: float  # Section modulus about z-axis (m³)

class SectionDimensions(BaseModel):
    shape: str
    width: Optional[float] = None
    height: Optional[float] = None
    diameter: Optional[float] = None
    outerDiameter: Optional[float] = None
    wallThickness: Optional[float] = None
    depth: Optional[float] = None
    flangeWidth: Optional[float] = None
    webThickness: Optional[float] = None
    flangeThickness: Optional[float] = None

class FrameSection(BaseModel):
    id: str
    name: str
    dimensions: SectionDimensions
    materialId: str
    color: str
    properties: SectionProperties

class ShellSection(BaseModel):
    id: str
    name: str
    thickness: float
    materialId: str
    color: str

# ============================================
# LOAD DEFINITION TYPES
# ============================================

class LoadPattern(BaseModel):
    id: str
    name: str
    type: str
    selfWeight: Optional[bool] = False

class LoadCasePattern(BaseModel):
    patternId: str
    scale: float

class LoadCase(BaseModel):
    id: str
    name: str
    patterns: List[LoadCasePattern]

class LoadCombinationCase(BaseModel):
    caseId: str
    scale: float

class LoadCombination(BaseModel):
    id: str
    name: str
    cases: List[LoadCombinationCase]

# ============================================
# STRUCTURAL ELEMENT TYPES
# ============================================

class Restraint(BaseModel):
    ux: bool
    uy: bool
    uz: bool
    rx: bool
    ry: bool
    rz: bool

class Joint(BaseModel):
    id: int
    x: float
    y: float
    z: float
    restraint: Optional[Restraint] = None

class Frame(BaseModel):
    id: int
    jointI: int
    jointJ: int
    sectionId: Optional[str] = None
    orientation: float
    offsetY: float
    offsetZ: float

class Shell(BaseModel):
    id: int
    jointIds: List[int]
    sectionId: Optional[str] = None
    offsetZ: float

# ============================================
# LOAD APPLICATION TYPES
# ============================================

class PointLoad(BaseModel):
    id: str
    jointId: int
    patternId: str
    fx: float
    fy: float
    fz: float
    mx: float
    my: float
    mz: float

class DistributedFrameLoad(BaseModel):
    id: str
    frameId: int
    patternId: str
    direction: str # 'GlobalX' | 'GlobalY' | ...
    loadType: str # 'Uniform' | 'Trapezoidal'
    startMagnitude: float
    endMagnitude: float
    startDistance: float
    endDistance: float

class AreaLoad(BaseModel):
    id: str
    shellId: int
    patternId: str
    direction: str
    magnitude: float

# ============================================
# MAIN MODEL STATE
# ============================================

class StructuralModel(BaseModel):
    materials: List[Material]
    frameSections: List[FrameSection]
    shellSections: List[ShellSection]
    loadPatterns: List[LoadPattern]
    loadCases: List[LoadCase]
    loadCombinations: List[LoadCombination]
    joints: List[Joint]
    frames: List[Frame]
    shells: List[Shell]
    pointLoads: List[PointLoad]
    distributedFrameLoads: List[DistributedFrameLoad]
    areaLoads: List[AreaLoad]

# ============================================
# SOLVER CONFIGURATION
# ============================================

class SolverConfig(BaseModel):
    meshing_segments: int = 6  # Number of segments to subdivide each frame (default 4, max 20)
    enable_intersection_check: bool = True  # Enable automatic intersection detection
    use_sparse_solver: bool = True  # Use sparse matrix solver for better performance

# ============================================
# ANALYSIS RESULTS
# ============================================

class JointDisplacement(BaseModel):
    jointId: int
    ux: float
    uy: float
    uz: float
    rx: float
    ry: float
    rz: float

class JointReaction(BaseModel):
    jointId: int
    fx: float
    fy: float
    fz: float
    mx: float
    my: float
    mz: float

class FrameForces(BaseModel):
    P: float
    V2: float
    V3: float
    T: float
    M2: float
    M3: float

class DetailedFrameResult(BaseModel):
    stations: List[float]
    displacements: List[JointDisplacement]
    forces: List[FrameForces]

class AnalysisResults(BaseModel):
    loadCaseId: str
    caseName: Optional[str] = None
    displacements: List[JointDisplacement]
    # keys are strings because Pydantic JSON keys must be strings
    frameDetailedResults: Optional[Dict[str, DetailedFrameResult]] = None
    reactions: List[JointReaction]
    isValid: bool
    maxDisplacement: float
    timestamp: float
    log: List[str]
