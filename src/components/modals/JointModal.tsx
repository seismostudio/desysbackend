import type { Joint, Restraint } from '../../types/structuralTypes';
import { Trash, X } from 'lucide-react';

interface JointModalProps {
    joint: Joint;
    onUpdate: (id: number, joint: Joint) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}

export function JointModal({ joint, onUpdate, onDelete, onClose }: JointModalProps) {
    const handleCoordChange = (axis: 'x' | 'y' | 'z', value: number) => {
        onUpdate(joint.id, { ...joint, [axis]: value });
    };

    const handleRestraintChange = (field: keyof Restraint, value: boolean) => {
        const currentRestraint = joint.restraint || { ux: false, uy: false, uz: false, rx: false, ry: false, rz: false };
        onUpdate(joint.id, {
            ...joint,
            restraint: { ...currentRestraint, [field]: value },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
                    <h3 className="font-bold text-white">Joint Details - ID: {joint.id}</h3>
                    <button onClick={onClose} className="cursor-pointer p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <section>
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-2">Coordinates (m)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-white block mb-1">X</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={joint.x}
                                    onChange={(e) => handleCoordChange('x', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Y</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={joint.y}
                                    onChange={(e) => handleCoordChange('y', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Z</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={joint.z}
                                    onChange={(e) => handleCoordChange('z', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-2">Restraints</h4>
                        <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                            {(['ux', 'uy', 'uz', 'rx', 'ry', 'rz'] as const).map((r) => (
                                <label key={r} className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={joint.restraint?.[r] || false}
                                            onChange={(e) => handleRestraintChange(r, e.target.checked)}
                                            className="w-4 h-4 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                    </div>
                                    <span className="text-sm text-white group-hover:text-blue-600 transition-colors uppercase">
                                        {r}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-600 mt-4">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this joint?')) {
                                onDelete(joint.id);
                                onClose();
                            }
                        }}
                        title="Delete Joint"
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
