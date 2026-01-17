// Standards Types
export type DesignCode = 'EC3' | 'AISC360';
export type DesignPhilosophy = 'LRFD' | 'ASD';

// Geometry Types
export interface Dimensions {
    name?: string;
    depth: number;
    width: number;
    webThickness: number;
    flangeThickness: number;
    rootRadius?: number;
    isUserDefined?: boolean;
}

export interface PlateDimensions {
    height: number;
    width: number;
    thickness: number;
}

export interface BoltConfig {
    diameter: number; // mm
    grade: string; // "8.8", "10.9"
    rows: number;
    cols: number; // Usually 2 for simple connections
    rowSpacing: number; // mm
    colSpacing: number; // mm
    edgeDistanceX: number; // mm, horizontal edge distance
    edgeDistanceY: number; // mm, vertical edge distance (top)
}

export interface WeldConfig {
    enabled: boolean;
    size: number; // Throat thickness
    weldType: 'fillet' | 'butt';
}

// Global Configuration
export interface HaunchConfig {
    enabled: boolean;
    length: number;
    depth: number;
    thickness: number;
    flangeWidth: number;
    flangeThickness: number;
    bolts: {
        enabled: boolean;
        rows: number;
        rowSpacing: number;
    };
}

export interface ConnectionConfig {
    loads: Loads;
    beam: Dimensions;
    column: Dimensions;
    plate: PlateDimensions;
    bolts: BoltConfig;
    welds: WeldConfig;
    columnRotation: number;
    haunch: HaunchConfig;
}

export interface Loads {
    axial: number; // kN, Tension +ve
    shearY: number; // kN, Vertical shear
    shearZ: number; // kN, Horizontal shear
    momentX: number; // kNm, Torsion
    momentY: number; // kNm, Weak axis
    momentZ: number; // kNm, Strong axis (Primary)
}

// Properties
export interface MaterialProperties {
    E: number; // MPa
    fy: number; // MPa
    fu: number; // MPa
}

export interface AppSettings {
    materials: {
        member: MaterialProperties;
        plate: MaterialProperties;
        bolt: {
            fub: number;
        };
        weld: {
            fu: number;
        };
    };
    visualization: {
        showGrid: boolean;
        showLabels: boolean;
        showLoads: boolean;
        opacity: number;
    };
    calculation: {
        code: DesignCode;
        philosophy: DesignPhilosophy; // Used for AISC360
        stressDistribution: 'uniform' | 'linear' | 'plastic';
        checkColumnResistance: boolean;
        gammaM0: number; // EC3 specific
        gammaM2: number; // EC3 specific
        phiOverride?: number; // AISC specific
        omegaOverride?: number; // AISC specific
    };
}

export interface ConnectionConfig {
    loads: Loads;
    beam: Dimensions;
    column: Dimensions;
    plate: PlateDimensions;
    bolts: BoltConfig;
    welds: WeldConfig;
    columnRotation: number;
    haunch: HaunchConfig;
    settings: AppSettings;
}

// Calculation Results
export interface UtilizationResult {
    utilization: number; // 0.0 to >1.0
    capacity: number;
    demand: number;
    message?: string;
}

export interface FailureMode {
    component: string;
    mode: string;
    utilization: number;
}

export interface FEANode {
    id: number;
    x: number;
    y: number;
    z: number;
    stress?: number; // Von Mises
}

export interface FEAElement {
    id: number;
    nodeIds: number[]; // 3 for tri, 4 for quad
    stress?: number;
}

export interface FEAMeshData {
    nodes: FEANode[];
    elements: FEAElement[];
    componentId: string; // 'plate', 'beam', 'column'
}

export interface AnalysisResult {
    timestamp: number;
    meshes: FEAMeshData[];
    isValid: boolean;
    configSnapshot: ConnectionConfig;
    solverResults: SolverResult;
}

export interface ConnectionViewerProps {
    config: ConnectionConfig;
    results: SolverResult;
    stressView?: boolean;
    analysisResult?: AnalysisResult | null;
}

export interface SolverResult {
    designCode: DesignCode;
    philosophy: DesignPhilosophy;
    columnAnalysisEnabled: boolean;
    bolts: {
        shear: UtilizationResult;
        tension: UtilizationResult;
        combined: UtilizationResult;
        maxForce: number; // For visualization arrows
        individualBolts: {
            id: string;
            position: [number, number, number];
            utilization: number;
            tension: number;
            shear: number;
        }[];
    };
    plate: {
        bearing: UtilizationResult;
        yielding: UtilizationResult;
        stressDistribution: 'uniform' | 'linear' | 'plastic'; // simplified
    };
    welds: {
        stress: UtilizationResult;
    };
    column: {
        flangeBending: UtilizationResult;
        webTension: UtilizationResult;
        webCompression: UtilizationResult;
        webShear: UtilizationResult;
        bearing: UtilizationResult; // Added column bearing
    };
    global: {
        maxUtil: number;
        governingFailure: FailureMode;
        isSafe: boolean;
    };
}

export const DEFAULT_CONFIG: ConnectionConfig = {
    beam: { name: "IWF 300.150.6,5.9", depth: 300, width: 150, webThickness: 6.5, flangeThickness: 9, rootRadius: 13, isUserDefined: false }, // IPE 400
    column: { name: "IWF 200.200.8.12", depth: 200, width: 200, webThickness: 8, flangeThickness: 12, rootRadius: 13, isUserDefined: false }, // HEB 300
    columnRotation: 0,
    plate: { height: 300, width: 160, thickness: 12 },
    bolts: {
        diameter: 16,
        grade: "8.8",
        rows: 3,
        cols: 2,
        rowSpacing: 100,
        colSpacing: 75,
        edgeDistanceX: 20,
        edgeDistanceY: 20
    },
    welds: { enabled: true, size: 8, weldType: 'fillet' },
    loads: { axial: 0, shearY: 100, shearZ: 0, momentX: 0, momentY: 0, momentZ: 100 },
    haunch: {
        enabled: false,
        length: 400,
        depth: 300,
        thickness: 10,
        flangeWidth: 180,
        flangeThickness: 12,
        bolts: {
            enabled: true,
            rows: 2,
            rowSpacing: 100
        }
    },
    settings: {
        materials: {
            member: { E: 210000, fy: 275, fu: 430 }, // S275
            plate: { E: 210000, fy: 275, fu: 430 }, // S275
            bolt: { fub: 800 }, // From Grade 8.8
            weld: { fu: 430 },
        },
        visualization: {
            showGrid: true,
            showLabels: true,
            showLoads: true,
            opacity: 1.0,
        },
        calculation: {
            code: 'AISC360',
            philosophy: 'LRFD',
            stressDistribution: 'linear',
            checkColumnResistance: true,
            gammaM0: 1.0,
            gammaM2: 1.25,
            phiOverride: 0.9,
            omegaOverride: 1.67
        }
    }
};
