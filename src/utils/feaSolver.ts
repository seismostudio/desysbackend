import type {
    StructuralModel,
    AnalysisResults,
    LoadCombination,
} from '../types/structuralTypes';

const API_URL = 'http://127.0.0.1:8000';

/**
 * Perform structural analysis for a given load case
 */
export async function analyzeStructure(
    model: StructuralModel,
    loadCaseId: string
): Promise<AnalysisResults> {
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
