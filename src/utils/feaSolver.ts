import type {
    StructuralModel,
    AnalysisResults,
    LoadCombination,
} from '../types/structuralTypes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const MAX_JOINTS = 2000;
const MAX_FRAMES = 2000;

function validateModel(model: StructuralModel): string | null {
    if (model.joints.length > MAX_JOINTS) {
        return `Model too large: ${model.joints.length} joints (max ${MAX_JOINTS})`;
    }
    if (model.frames.length > MAX_FRAMES) {
        return `Model too large: ${model.frames.length} frames (max ${MAX_FRAMES})`;
    }
    return null;
}

/**
 * Perform structural analysis for a given load case
 */
export async function analyzeStructure(
    model: StructuralModel,
    loadCaseId: string
): Promise<AnalysisResults> {
    const validationError = validateModel(model);
    if (validationError) {
        return {
            loadCaseId,
            displacements: [],
            reactions: [],
            frameForces: [],
            shellStresses: [],
            isValid: false,
            maxDisplacement: 0,
            timestamp: Date.now(),
            log: [`Validation Error: ${validationError}`],
        };
    }

    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                loadCaseId,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Analysis failed: ${errorText}`);
        }

        const results: AnalysisResults = await response.json();
        return results;

    } catch (error) {
        console.error('Analysis API error:', error);
        return {
            loadCaseId,
            displacements: [],
            reactions: [],
            frameForces: [],
            shellStresses: [],
            isValid: false,
            maxDisplacement: 0,
            timestamp: Date.now(),
            log: [`Error: ${error instanceof Error ? error.message : String(error)}`],
        };
    }
}

/**
 * Combine analysis results based on a Load Combination
 */
export async function combineResults(
    combination: LoadCombination,
    resultsMap: Record<string, AnalysisResults>,
    // model: StructuralModel
): Promise<AnalysisResults> {
    try {
        const response = await fetch(`${API_URL}/combine`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                combination,
                resultsMap,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Combination failed: ${errorText}`);
        }

        const results: AnalysisResults = await response.json();
        return results;

    } catch (error) {
        console.error('Combination API error:', error);
        return {
            loadCaseId: combination.id,
            displacements: [],
            reactions: [],
            frameForces: [],
            shellStresses: [],
            isValid: false,
            maxDisplacement: 0,
            timestamp: Date.now(),
            log: [`Error: ${error instanceof Error ? error.message : String(error)}`],
        };
    }
}
