import { useState } from 'react';
import type { Frame, Joint, FrameSection } from '../../types/structuralTypes';
import { calculateFrameLength } from '../../utils/frameGeometry';
import { Trash2, MousePointer2 } from 'lucide-react';

interface FrameTableProps {
    frames: Frame[];
    joints: Joint[];
    sections: FrameSection[];
    onDelete: (id: number) => void;
    selectedFrameId: number | null;
    onSelectFrame: (id: number | null) => void;
    onToggleCreateMode: () => void;
    isCreating: boolean;
}

export function FrameTable({
    frames,
    joints,
    sections,
    onDelete,
    selectedFrameId,
    onSelectFrame,
    onToggleCreateMode,
    isCreating,
}: FrameTableProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-700">Frames</h4>
                <button
                    onClick={onToggleCreateMode}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${isCreating
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    <MousePointer2 className="w-3 h-3" />
                    {isCreating ? 'Cancel Create' : 'Create Frame'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] text-blue-800">
                    <strong>Create Mode:</strong> Click two joints in the 3D viewer to create a frame.
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-white max-h-60 overflow-y-auto">
                <table className="w-full text-[10px]">
                    <thead className="bg-gray-100 border-b sticky top-0">
                        <tr>
                            <th className="text-left px-2 py-1 font-semibold">ID</th>
                            <th className="text-left px-2 py-1 font-semibold">Joint I</th>
                            <th className="text-left px-2 py-1 font-semibold">Joint J</th>
                            <th className="text-left px-2 py-1 font-semibold">Section</th>
                            <th className="text-right px-2 py-1 font-semibold">Length (m)</th>
                            <th className="text-center px-2 py-1 font-semibold w-12">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {frames.map((frame) => {
                            const jointI = joints.find((j) => j.id === frame.jointI);
                            const jointJ = joints.find((j) => j.id === frame.jointJ);
                            const section = frame.sectionId ? sections.find((s) => s.id === frame.sectionId) : null;
                            const length = jointI && jointJ ? calculateFrameLength(jointI, jointJ) : 0;
                            const isSelected = selectedFrameId === frame.id;

                            return (
                                <tr
                                    key={frame.id}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-purple-100' : ''}`}
                                    onClick={() => onSelectFrame(frame.id)}
                                >
                                    <td className="px-2 py-1 font-medium">{frame.id}</td>
                                    <td className="px-2 py-1">{frame.jointI}</td>
                                    <td className="px-2 py-1">{frame.jointJ}</td>
                                    <td className="px-2 py-1">
                                        {section ? (
                                            <div className="flex items-center gap-1">
                                                <div
                                                    className="w-3 h-3 rounded border"
                                                    style={{ backgroundColor: section.color }}
                                                />
                                                <span>{section.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Not assigned</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-1 text-right">{length.toFixed(3)}</td>
                                    <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(frame.id);
                                                }}
                                                className="p-0.5 hover:bg-red-100 rounded text-red-600"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {frames.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-[10px]">
                        No frames defined. Click "Create Frame" and select two joints in the 3D viewer.
                    </div>
                )}
            </div>
        </div>
    );
}
