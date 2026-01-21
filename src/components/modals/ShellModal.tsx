import type { Shell, Joint, ShellSection } from '../../types/structuralTypes';
import { calculateShellArea } from '../../utils/shellGeometry';
import { Trash, X } from 'lucide-react';

interface ShellModalProps {
    shell: Shell;
    joints: Joint[];
    sections: ShellSection[];
    onUpdate: (id: number, shell: Shell) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}

export function ShellModal({ shell, joints, sections, onUpdate, onDelete, onClose }: ShellModalProps) {
    const shellJoints = shell.jointIds.map((jid) => joints.find((j) => j.id === jid)).filter(Boolean) as Joint[];
    const area = calculateShellArea(shellJoints);

    const handleUpdate = (field: keyof Shell, value: any) => {
        onUpdate(shell.id, { ...shell, [field]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-white">Shell Details - ID: {shell.id}</h3>
                        <span className="text-[10px] text-gray-400 font-mono">
                            Joints: {shell.jointIds.join(', ')}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-5">
                    <section className="grid grid-cols-2 h-7">
                        <div className="flex flex-row items-start justify-between rounded-lg">
                            <span className="text-xs text-white font-bold block mb-1">Area = {area.toFixed(3)} m²</span>
                        </div>
                        <div className="flex flex-row items-start justify-between rounded-lg">
                            <span className="text-xs text-white font-bold block mb-1">ID = {shell.id}</span>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-2">Section Assignment</h4>
                        <div>
                            <label className="text-[10px] text-white block mb-1">Shell Section</label>
                            <select
                                value={shell.sectionId || ''}
                                onChange={(e) => handleUpdate('sectionId', e.target.value)}
                                className="input"
                            >
                                <option value="">Select Shell Section...</option>
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-2">Transformation</h4>
                        <div>
                            <label className="text-[10px] text-white block mb-1">Offset Z (m) - Normal to surface</label>
                            <input
                                type="number"
                                step="0.01"
                                value={shell.offsetZ}
                                onChange={(e) => handleUpdate('offsetZ', Number(e.target.value))}
                                className="input"
                            />
                            <p className="mt-1 text-[9px] text-gray-400 italic">
                                * Positive offset follows the shell normal direction.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-600 mt-4">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this shell?')) {
                                onDelete(shell.id);
                                onClose();
                            }
                        }}
                        title="Delete Shell"
                        className="cursor-pointer px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
