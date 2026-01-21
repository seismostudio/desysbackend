import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { AnalysisResults } from '../../types/structuralTypes';
import { generateLegendGradient } from '../../utils/colorUtils';

interface DisplacementLegendProps {
    results: AnalysisResults | null;
}

export function DisplacementLegend({ results }: DisplacementLegendProps) {
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

    if (!results || maxDisp === 0) return null;

    return (
        <Html position={[-8, 6, 0]} center>
            <div className="bg-white/90 backdrop-blur p-3 rounded-lg shadow-xl border text-xs">
                <div className="font-bold mb-2 text-gray-700">Displacement (mm)</div>
                <div className="flex flex-col gap-1">
                    {legendSteps.map((step, i) => {
                        const value = step.ratio * maxDisp * 1000; // Convert to mm
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div
                                    className="w-6 h-4 rounded border border-gray-300"
                                    style={{ backgroundColor: step.color }}
                                />
                                <span className="font-mono text-[10px]">
                                    {value.toFixed(2)}
                                </span>
                            </div>
                        );
                    }).reverse()}
                </div>
            </div>
        </Html>
    );
}
