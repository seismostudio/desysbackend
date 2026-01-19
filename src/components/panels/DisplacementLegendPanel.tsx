import { useMemo } from 'react';
import type { AnalysisResults } from '../../types/structuralTypes';
import { generateLegendGradient } from '../../utils/colorUtils';

interface DisplacementLegendPanelProps {
    results: AnalysisResults | null;
    show: boolean;
}

export function DisplacementLegendPanel({ results, show }: DisplacementLegendPanelProps) {
    const { maxDisp, legendSteps } = useMemo(() => {
        if (!results || !results.isValid) {
            return { maxDisp: 0, legendSteps: [] };
        }

        const max = results.displacements.reduce((m, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return Math.max(m, mag);
        }, 0);

        const steps = generateLegendGradient(5);
        return { maxDisp: max, legendSteps: steps };
    }, [results]);

    if (!show || !results || maxDisp === 0) return null;

    // Create a CSS gradient string from bottom (0, blue) to top (1, red)
    const gradientString = `linear-gradient(to top, ${legendSteps.map(s => s.color).join(', ')})`;

    return (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-gray-200 text-xs w-40 min-w-[140px]">
            <div className="font-bold mb-3 text-gray-800 border-b pb-2 flex justify-between items-center">
                <span>Displacement</span>
                <span className="text-[10px] text-gray-500 font-normal">mm</span>
            </div>

            <div className="flex h-48 gap-3">
                {/* Gradient Bar */}
                <div
                    className="w-4 rounded-full border border-gray-200 shadow-inner"
                    style={{ background: gradientString }}
                />

                {/* Labels */}
                <div className="flex flex-col justify-between flex-1 py-1">
                    {legendSteps.map((step, i) => {
                        const value = step.ratio * maxDisp * 1000; // Convert to mm
                        return (
                            <div key={i} className="flex items-center text-gray-700 font-mono text-[10px] h-0 relative">
                                <div className="absolute left-[-8px] w-1.5 h-[1px] bg-gray-400" />
                                <span>{value.toFixed(2)}</span>
                            </div>
                        );
                    }).reverse()}
                </div>
            </div>
        </div>
    );
}
