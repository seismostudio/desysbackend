import type { Shell, Joint, ShellSection } from '../../types/structuralTypes';
import { calculateShellArea } from '../../utils/shellGeometry';
import { Trash2, MousePointer2 } from 'lucide-react';

interface ShellTableProps {
    shells: Shell[];
    joints: Joint[];
    sections: ShellSection[];
    onDelete: (id: number) => void;
    selectedShellId: number | null;
    onSelectShell: (id: number | null) => void;
    onToggleCreateMode: () => void;
    isCreating: boolean;
}

export function ShellTable({
    shells,
    joints,
    sections,
    onDelete,
    selectedShellId,
    onSelectShell,
    onToggleCreateMode,
    isCreating,
}: ShellTableProps) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-white">Shells/Plates</h4>
                <button
                    onClick={onToggleCreateMode}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${isCreating
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    <MousePointer2 className="w-3 h-3" />
                    {isCreating ? 'Cancel Create' : 'Create Shell'}
                </button>
            </div>

            {isCreating && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] text-blue-800">
                    <strong>Create Mode:</strong> Click 3+ joints in the 3D viewer, then press <kbd className="bg-white px-1 border rounded">Enter</kbd> to create shell.
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-gray-800 h-fit overflow-y-auto no-scrollbar">
                <table className="w-full text-[10px]">
                    <thead className="bg-gray-700 border-b sticky top-0">
                        <tr>
                            <th className="text-left px-2 py-1 font-semibold text-white">ID</th>
                            <th className="text-left px-2 py-1 font-semibold text-white">Joints</th>
                            <th className="text-left px-2 py-1 font-semibold text-white">Section</th>
                            <th className="text-right px-2 py-1 font-semibold text-white">Area (m²)</th>
                            <th className="text-center px-2 py-1 font-semibold w-12 text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shells.map((shell) => {
                            const shellJoints = shell.jointIds.map((jid) => joints.find((j) => j.id === jid)).filter(Boolean) as Joint[];
                            const section = shell.sectionId ? sections.find((s) => s.id === shell.sectionId) : null;
                            const area = shellJoints.length >= 3 ? calculateShellArea(shellJoints) : 0;
                            const isSelected = selectedShellId === shell.id;

                            return (
                                <tr
                                    key={shell.id}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-gray-700' : ''}`}
                                    onClick={() => onSelectShell(shell.id)}
                                >
                                    <td className="px-2 py-1 font-medium text-white">{shell.id}</td>
                                    <td className="px-2 py-1 text-white">{shell.jointIds.join(', ')}</td>
                                    <td className="px-2 py-1 text-white">
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
                                    <td className="px-2 py-1 text-right text-white">{area.toFixed(3)}</td>
                                    <td className="px-2 py-1" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(shell.id);
                                                }}
                                                title="Delete Shell"
                                                className="cursor-pointer p-0.5 hover:bg-red-100 rounded text-white"
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
                {shells.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-[10px]">
                        No shells defined. Click "Create Shell" and select 3+ joints in the 3D viewer.
                    </div>
                )}
            </div>
        </div>
    );
}
