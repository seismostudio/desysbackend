import type { StructuralModel, Material, FrameSection, ShellSection, LoadPattern, LoadCase, LoadCombination, Joint, Frame, Shell, DistributedFrameLoad } from '../types/structuralTypes';
import { calculateISection, calculateHollow, calculateRectangular } from './sectionCalculator';
import { FIXED_RESTRAINT } from '../types/structuralTypes';

export const SAMPLE_MATERIALS: Material[] = [
    {
        id: 'mat-steel-1',
        name: 'BJ37',
        type: 'Steel',
        E: 210000,
        G: 77000,
        poisson: 0.3,
        density: 7850,
        fy: 370,
        fu: 550,
    },
    {
        id: 'mat-concrete-1',
        name: 'K-350',
        type: 'Concrete',
        E: 23000,
        G: 11666,
        poisson: 0.2,
        density: 2400,
        fc: 29.05,
        ft: 2.5,
    },
];

export const SAMPLE_FRAME_SECTIONS: FrameSection[] = [
    {
        id: 'sec-beam-1',
        name: 'IWF 300X150X6.5X9',
        materialId: 'mat-steel-1',
        color: '#3b82f6', // blue
        dimensions: {
            shape: 'ISection',
            depth: 0.300,
            flangeWidth: 0.150,
            webThickness: 0.0065,
            flangeThickness: 0.009,
        },
        properties: calculateISection(0.300, 0.150, 0.0065, 0.009),
    },
    {
        id: 'sec-column-1',
        name: 'SHS 50X50X2.3',
        materialId: 'mat-steel-1',
        color: '#eab308', // yellow
        dimensions: {
            shape: 'Hollow',
            width: 0.50,
            height: 0.50,
            wallThickness: 0.0023,
        },
        properties: calculateHollow(0.50, 0.50, 0.0023),
    },
    {
        id: 'sec-column-2',
        name: '150x150',
        materialId: 'mat-concrete-1',
        color: '#eab308', // yellow
        dimensions: {
            shape: 'Rectangular',
            width: 0.150,
            height: 0.150,
        },
        properties: calculateRectangular(0.150, 0.150),
    },
];

export const SAMPLE_SHELL_SECTIONS: ShellSection[] = [
    {
        id: 'sec-slab-1',
        name: 'Slab 120mm',
        materialId: 'mat-concrete-1',
        thickness: 0.120,
        color: '#9ca3af', // gray
    },
];

export const SAMPLE_LOAD_PATTERNS: LoadPattern[] = [
    { id: 'pat-dead1', name: 'SIDL', type: 'Dead' },
    { id: 'pat-dead2', name: 'DL', type: 'Dead', selfWeight: true },
    { id: 'pat-live', name: 'LL', type: 'Live' },
];

export const SAMPLE_LOAD_CASES: LoadCase[] = [
    {
        id: 'case-dead',
        name: 'DL',
        patterns: [{
            patternId: 'pat-dead1',
            scale: 1.0,
        }, {
            patternId: 'pat-dead2',
            scale: 1.0,
        }],
    },
    {
        id: 'case-live',
        name: 'LL',
        patterns: [{ patternId: 'pat-live', scale: 1.0 }],
    },
];

export const SAMPLE_LOAD_COMBINATIONS: LoadCombination[] = [
    {
        id: 'comb-ultimate',
        name: 'Comb 1',
        cases: [
            { caseId: 'case-dead', scale: 1.2 },
            { caseId: 'case-live', scale: 1.6 },
        ],
    },
];

export const SAMPLE_JOINTS: Joint[] = [
    { id: 1, x: 0, y: 0, z: 0, restraint: FIXED_RESTRAINT },
    { id: 2, x: 5, y: 0, z: 0, restraint: FIXED_RESTRAINT },
    { id: 3, x: 0, y: 0, z: 5, restraint: FIXED_RESTRAINT },
    { id: 4, x: 5, y: 0, z: 5, restraint: FIXED_RESTRAINT },
    { id: 5, x: 0, y: 4, z: 0 },
    { id: 6, x: 5, y: 4, z: 0 },
    { id: 7, x: 0, y: 4, z: 5 },
    { id: 8, x: 5, y: 4, z: 5 },
    { id: 9, x: 5, y: 4, z: 7 },
    { id: 10, x: 0, y: 4, z: 7 },
    { id: 11, x: 0, y: 7.5, z: 0 },
    { id: 12, x: 5, y: 7.5, z: 0 },
    { id: 13, x: 0, y: 7.5, z: 5 },
    { id: 14, x: 5, y: 7.5, z: 5 },
];

export const SAMPLE_FRAMES: Frame[] = [
    // Columns
    { id: 1, jointI: 1, jointJ: 5, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 2, jointI: 2, jointJ: 6, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 3, jointI: 3, jointJ: 7, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 4, jointI: 4, jointJ: 8, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Beams strong direction
    { id: 5, jointI: 5, jointJ: 6, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 6, jointI: 7, jointJ: 8, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Beams weak direction
    { id: 7, jointI: 5, jointJ: 7, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 8, jointI: 6, jointJ: 8, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Beams strong direction
    { id: 9, jointI: 7, jointJ: 10, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 10, jointI: 8, jointJ: 9, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 11, jointI: 10, jointJ: 9, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Beams strong direction
    { id: 12, jointI: 11, jointJ: 12, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 13, jointI: 13, jointJ: 14, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Beams weak direction
    { id: 14, jointI: 11, jointJ: 13, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 15, jointI: 12, jointJ: 14, sectionId: 'sec-beam-1', orientation: 0, offsetY: 0, offsetZ: 0 },
    // Columns
    { id: 16, jointI: 5, jointJ: 11, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 17, jointI: 6, jointJ: 12, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 18, jointI: 7, jointJ: 13, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
    { id: 19, jointI: 8, jointJ: 14, sectionId: 'sec-column-2', orientation: 0, offsetY: 0, offsetZ: 0 },
];

export const SAMPLE_SHELLS: Shell[] = [
    { id: 1, jointIds: [5, 6, 8, 7], sectionId: 'sec-slab-1', offsetZ: 0 },
];

// Sample Loads
export const SAMPLE_POINT_LOADS = [
    // Gravity loads on roof level
    { id: 'pl-1', jointId: 5, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-2', jointId: 6, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-3', jointId: 7, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-4', jointId: 8, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-5', jointId: 6, patternId: 'pat-dead1', fx: 0, fy: 0, fz: 20, mx: 0, my: 0, mz: 0 },
    { id: 'pl-6', jointId: 10, patternId: 'pat-dead1', fx: 0, fy: -20, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-7', jointId: 9, patternId: 'pat-dead1', fx: 0, fy: -20, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-8', jointId: 11, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-9', jointId: 12, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-10', jointId: 13, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
    { id: 'pl-11', jointId: 14, patternId: 'pat-dead1', fx: 0, fy: -10, fz: 0, mx: 0, my: 0, mz: 0 },
];

export const SAMPLE_DISTRIBUTED_FRAME_LOADS: DistributedFrameLoad[] = [
    { id: 'dl-1', frameId: 12, patternId: 'pat-live', direction: 'Gravity', loadType: 'Uniform', startMagnitude: 10, endMagnitude: 10, startDistance: 0, endDistance: 10 },
];

export const INITIAL_TEMPLATE_MODEL: StructuralModel = {
    materials: SAMPLE_MATERIALS,
    frameSections: SAMPLE_FRAME_SECTIONS,
    shellSections: SAMPLE_SHELL_SECTIONS,
    loadPatterns: SAMPLE_LOAD_PATTERNS,
    loadCases: SAMPLE_LOAD_CASES,
    loadCombinations: SAMPLE_LOAD_COMBINATIONS,
    joints: SAMPLE_JOINTS,
    frames: SAMPLE_FRAMES,
    shells: SAMPLE_SHELLS,
    pointLoads: SAMPLE_POINT_LOADS,
    distributedFrameLoads: SAMPLE_DISTRIBUTED_FRAME_LOADS,
    areaLoads: [],
};

// export const INITIAL_TEMPLATE_MODEL: StructuralModel = {
//     materials: [],
//     frameSections: [],
//     shellSections: [],
//     loadPatterns: [],
//     loadCases: [],
//     loadCombinations: [],
//     joints: [],
//     frames: [],
//     shells: [],
//     pointLoads: [],
//     distributedFrameLoads: [],
//     areaLoads: [],
// };

