import { useState } from 'react';
import { X, Download, CheckCircle2, Circle } from 'lucide-react';
import type { AnalysisResultMap } from '../../types/structuralTypes';

interface ExportResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (selectedIds: string[]) => void;
    analysisResultMap: AnalysisResultMap;
    type: 'displacements' | 'forces' | 'reactions';
}

export function ExportResultsModal({ isOpen, onClose, onExport, analysisResultMap, type }: ExportResultsModalProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(Object.keys(analysisResultMap));

    if (!isOpen) return null;

    const toggleId = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => setSelectedIds(Object.keys(analysisResultMap));
    const selectNone = () => setSelectedIds([]);

    const title = {
        displacements: 'Export Joint Displacements',
        forces: 'Export Element Forces',
        reactions: 'Export Joint Reactions'
    }[type];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-xs text-gray-400 mb-4">
                        Select Load Cases and Combinations to include in the CSV export.
                    </p>

                    <div className="flex gap-2 mb-3">
                        <button onClick={selectAll} className="cursor-pointer text-[10px] text-white hover:text-blue-300">Select All</button>
                        <span className="text-gray-600">|</span>
                        <button onClick={selectNone} className="cursor-pointer text-[10px] text-white hover:text-blue-300">Clear</button>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-700 rounded bg-gray-950 divide-y divide-gray-800">
                        {Object.keys(analysisResultMap).map(id => (
                            <div
                                key={id}
                                onClick={() => toggleId(id)}
                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors"
                            >
                                {selectedIds.includes(id) ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                ) : (
                                    <Circle className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="text-xs text-gray-200">
                                    {id.startsWith('case-') ? 'Case: ' : 'Combo: '} {analysisResultMap[id].caseName}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-4 py-3 bg-gray-800 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-4 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onExport(selectedIds)}
                        disabled={selectedIds.length === 0}
                        className="cursor-pointer flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white text-xs font-medium rounded transition-colors shadow-lg"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
}
