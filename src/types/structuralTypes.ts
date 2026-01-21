// ============================================
// MATERIAL TYPES
// ============================================

export type MaterialType = 'Steel' | 'Concrete' | 'LinearElastic';

export interface BaseMaterial {
  id: string;
  name: string;
  type: MaterialType;
  E: number;      // Young's Modulus (MPa)
  G: number;      // Shear Modulus (MPa)
  poisson: number; // Poisson's ratio
  density: number; // kg/m³
}

export interface SteelMaterial extends BaseMaterial {
  type: 'Steel';
  fy: number; // Yield strength (MPa)
  fu: number; // Ultimate strength (MPa)
}

export interface ConcreteMaterial extends BaseMaterial {
  type: 'Concrete';
  fc: number; // Compressive strength (MPa)
  ft: number; // Tensile strength (MPa)
}

export interface LinearElasticMaterial extends BaseMaterial {
  type: 'LinearElastic';
}

export type Material = SteelMaterial | ConcreteMaterial | LinearElasticMaterial;

// ============================================
// FRAME SECTION TYPES
// ============================================

export type SectionShape = 'Rectangular' | 'Circular' | 'Tube' | 'Hollow' | 'ISection';

export interface SectionProperties {
  A: number;   // Cross-sectional area (m²)
  Ix: number;  // Moment of inertia about x-axis (m⁴)
  Iy: number;  // Moment of inertia about y-axis (m⁴)
  Iz: number;  // Moment of inertia about z-axis (m⁴)
  J: number;   // Torsional constant (m⁴)
  Sy: number;  // Section modulus about y-axis (m³)
  Sz: number;  // Section modulus about z-axis (m³)
}

// Dimension interfaces for different shapes
export interface RectangularDimensions {
  shape: 'Rectangular';
  width: number;  // m
  height: number; // m
}

export interface CircularDimensions {
  shape: 'Circular';
  diameter: number; // m
}

export interface TubeDimensions {
  shape: 'Tube';
  outerDiameter: number; // m
  wallThickness: number; // m
}

export interface HollowDimensions {
  shape: 'Hollow';
  width: number;        // m
  height: number;       // m
  wallThickness: number; // m
}

export interface ISectionDimensions {
  shape: 'ISection';
  depth: number;           // m
  flangeWidth: number;     // m
  webThickness: number;    // m
  flangeThickness: number; // m
}

export type SectionDimensions =
  | RectangularDimensions
  | CircularDimensions
  | TubeDimensions
  | HollowDimensions
  | ISectionDimensions;

export interface FrameSection {
  id: string;
  name: string;
  dimensions: SectionDimensions;
  materialId: string;
  color: string; // Hex color for visualization
  properties: SectionProperties;
}

// ============================================
// SHELL/PLATE SECTION TYPES
// ============================================

export interface ShellSection {
  id: string;
  name: string;
  thickness: number; // m
  materialId: string;
  color: string; // Hex color for visualization
}

// ============================================
// LOAD DEFINITION TYPES
// ============================================

export type LoadPatternType = 'Dead' | 'Live' | 'Rain' | 'Wind' | 'Earthquake';

export interface LoadPattern {
  id: string;
  name: string;
  type: LoadPatternType;
  selfWeight?: boolean;
}

export interface LoadCasePattern {
  patternId: string;
  scale: number;
}

export interface LoadCase {
  id: string;
  name: string;
  patterns: LoadCasePattern[];
}

export interface LoadCombinationCase {
  caseId: string;
  scale: number;
}

export interface LoadCombination {
  id: string;
  name: string;
  cases: LoadCombinationCase[];
}

// ============================================
// STRUCTURAL ELEMENT TYPES
// ============================================

export interface Restraint {
  ux: boolean; // Translation in X
  uy: boolean; // Translation in Y
  uz: boolean; // Translation in Z
  rx: boolean; // Rotation about X
  ry: boolean; // Rotation about Y
  rz: boolean; // Rotation about Z
}

export interface Joint {
  id: number;
  x: number; // m
  y: number; // m
  z: number; // m
  restraint?: Restraint;
}

export interface Frame {
  id: number;
  jointI: number; // Start joint ID
  jointJ: number; // End joint ID
  sectionId?: string;
  orientation: number; // Rotation angle around local X-axis (degrees)
  offsetY: number; // Offset in local Y direction (m)
  offsetZ: number; // Offset in local Z direction (m)
}

export interface Shell {
  id: number;
  jointIds: number[]; // Array of joint IDs (minimum 3)
  sectionId?: string;
  offsetZ: number; // Offset in local Z direction (normal to surface) (m)
}

// ============================================
// LOAD APPLICATION TYPES
// ============================================

export interface PointLoad {
  id: string;
  jointId: number;
  patternId: string;
  fx: number; // Force in X (kN)
  fy: number; // Force in Y (kN)
  fz: number; // Force in Z (kN)
  mx: number; // Moment about X (kN.m)
  my: number; // Moment about Y (kN.m)
  mz: number; // Moment about Z (kN.m)
}

export interface DistributedFrameLoad {
  id: string;
  frameId: number;
  patternId: string;
  direction: 'GlobalX' | 'GlobalY' | 'GlobalZ' | 'LocalX' | 'LocalY' | 'LocalZ' | 'Gravity';
  loadType: 'Uniform' | 'Trapezoidal';
  startMagnitude: number; // kN/m
  endMagnitude: number;   // kN/m
  startDistance: number;  // m from start of frame (relative)
  endDistance: number;    // m from start of frame (relative)
}

export interface AreaLoad {
  id: string;
  shellId: number;
  patternId: string;
  direction: 'X' | 'Y' | 'Z' | 'LocalZ' | 'Gravity';
  magnitude: number; // kN/m²
}

// ============================================
// MAIN MODEL STATE
// ============================================

export interface StructuralModel {
  materials: Material[];
  frameSections: FrameSection[];
  shellSections: ShellSection[];
  loadPatterns: LoadPattern[];
  loadCases: LoadCase[];
  loadCombinations: LoadCombination[];
  joints: Joint[];
  frames: Frame[];
  shells: Shell[];
  pointLoads: PointLoad[];
  distributedFrameLoads: DistributedFrameLoad[];
  areaLoads: AreaLoad[];
}

// ============================================
// UI STATE TYPES
// ============================================

export type ModelingMode = 'normal' | 'createFrame' | 'createShell';

export interface UIState {
  modelingMode: ModelingMode;
  extrudeMode: boolean;
  selectedJointId: number | null;
  selectedFrameId: number | null;
  selectedShellId: number | null;
  showJointModal: boolean;
  showFrameModal: boolean;
  showShellModal: boolean;
  tempFrameStartJoint: number | null; // For frame creation
  tempShellJoints: number[];          // For shell creation
}

// ============================================
// ANALYSIS RESULTS (for future FEA)
// ============================================

export interface JointDisplacement {
  jointId: number;
  ux: number; // m
  uy: number; // m
  uz: number; // m
  rx: number; // rad
  ry: number; // rad
  rz: number; // rad
}

export interface FrameForces {
  frameId: number;
  axial: number[];    // N (along length)
  shearY: number[];   // N
  shearZ: number[];   // N
  torsion: number[];  // N.m
  momentY: number[];  // N.m
  momentZ: number[];  // N.m
  positions: number[]; // Positions along frame (0 to 1)
}

export interface ShellStresses {
  shellId: number;
  elementStresses: {
    elementId: number;
    sigmaX: number;  // MPa
    sigmaY: number;  // MPa
    tauXY: number;   // MPa
    vonMises: number; // MPa
  }[];
}

export interface AnalysisResults {
  loadCaseId: string;
  caseName?: string;
  displacements: JointDisplacement[];
  // Detailed results for frames (for curved visualization)
  frameDetailedResults?: Record<number, {
    stations: number[]; // Relative distance from start (0 to 1) or actual length
    displacements: JointDisplacement[]; // Displacements at each station
    forces: {
      P: number;  // Axial Force (Local X)
      V2: number; // Shear Force (Local Y)
      V3: number; // Shear Force (Local Z)
      T: number;  // Torsion (Local X)
      M2: number; // Moment about Local Y (Minor Axis)
      M3: number; // Moment about Local Z (Major Axis)
    }[];
  }>;
  maxDisplacement: number;
  frameForces: FrameForces[];
  shellStresses: ShellStresses[];
  isValid: boolean;
  timestamp: number;
  log: string[];
}

export type AnalysisResultMap = Record<string, AnalysisResults>;

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_RESTRAINT: Restraint = {
  ux: false,
  uy: false,
  uz: false,
  rx: false,
  ry: false,
  rz: false,
};

export const FIXED_RESTRAINT: Restraint = {
  ux: true,
  uy: true,
  uz: true,
  rx: true,
  ry: true,
  rz: true,
};

export const PINNED_RESTRAINT: Restraint = {
  ux: true,
  uy: true,
  uz: true,
  rx: false,
  ry: false,
  rz: false,
};

export const DEFAULT_STRUCTURAL_MODEL: StructuralModel = {
  materials: [],
  frameSections: [],
  shellSections: [],
  loadPatterns: [],
  loadCases: [],
  loadCombinations: [],
  joints: [],
  frames: [],
  shells: [],
  pointLoads: [],
  distributedFrameLoads: [],
  areaLoads: [],
};

export const DEFAULT_UI_STATE: UIState = {
  modelingMode: 'normal',
  extrudeMode: false,
  selectedJointId: null,
  selectedFrameId: null,
  selectedShellId: null,
  showJointModal: false,
  showFrameModal: false,
  showShellModal: false,
  tempFrameStartJoint: null,
  tempShellJoints: [],
};
