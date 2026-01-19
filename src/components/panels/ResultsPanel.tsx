import type { AnalysisResults, Joint } from '../../types/structuralTypes';

interface ResultsPanelProps {
    results: AnalysisResults | null;
    joints: Joint[];
    isAnalyzing: boolean;
}

export function ResultsPanel({ results, joints, isAnalyzing }: ResultsPanelProps) {
    if (isAnalyzing) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Running analysis...</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-gray-50 p-8 text-center">
                <div className="text-gray-400 text-sm">
                    <p className="font-bold mb-2">No analysis results yet</p>
                    <p>Configure your model and loads, then click "Run Analysis"</p>
                </div>
            </div>
        );
    }

    if (!results.isValid) {
        return (
            <div className="flex flex-col h-full items-center justify-center bg-red-50 p-8 text-center">
                <div className="text-red-600 text-sm">
                    <p className="font-bold mb-2">Analysis Failed</p>
                    <p>Check console for error details</p>
                </div>
            </div>
        );
    }

    // Find max displacements
    const maxDisp = results.displacements.reduce(
        (max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return mag > max.mag ? { mag, joint: d.jointId } : max;
        },
        { mag: 0, joint: 0 }
    );

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="font-bold text-sm text-gray-700">Analysis Results</h3>
                <p className="text-[10px] text-gray-500">Load Case: {results.loadCaseId}</p>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-4">
                {/* Summary Card */}
                <div className="">
                    <div className="text-xs font-bold text-blue-800 mb-2">Analysis Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                            <span className="text-gray-600">Total DOFs:</span>{' '}
                            <span className="font-mono font-bold">{joints.length * 6}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Max Displacement:</span>{' '}
                            <span className="font-mono font-bold">{(maxDisp.mag * 1000).toFixed(2)} mm</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-gray-600">At Joint:</span>{' '}
                            <span className="font-bold">{maxDisp.joint}</span>
                        </div>
                    </div>
                </div>

                {/* Joint Displacements Table */}
                <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                        Joint Displacements
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-[10px]">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-1 text-left font-semibold">Joint</th>
                                    <th className="px-2 py-1 text-right font-semibold">Ux (mm)</th>
                                    <th className="px-2 py-1 text-right font-semibold">Uy (mm)</th>
                                    <th className="px-2 py-1 text-right font-semibold">Uz (mm)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {results.displacements.map((disp) => (
                                    <tr key={disp.jointId} className="hover:bg-gray-50">
                                        <td className="px-2 py-1 font-medium">{disp.jointId}</td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {(disp.ux * 1000).toFixed(3)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {(disp.uy * 1000).toFixed(3)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {(disp.uz * 1000).toFixed(3)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Rotations Table */}
                <div>
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                        Joint Rotations
                    </h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-[10px]">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-2 py-1 text-left font-semibold">Joint</th>
                                    <th className="px-2 py-1 text-right font-semibold">Rx (rad)</th>
                                    <th className="px-2 py-1 text-right font-semibold">Ry (rad)</th>
                                    <th className="px-2 py-1 text-right font-semibold">Rz (rad)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {results.displacements.map((disp) => (
                                    <tr key={disp.jointId} className="hover:bg-gray-50">
                                        <td className="px-2 py-1 font-medium">{disp.jointId}</td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {disp.rx.toExponential(2)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {disp.ry.toExponential(2)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono">
                                            {disp.rz.toExponential(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
