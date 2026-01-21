import type { Frame, Joint, FrameSection } from '../../types/structuralTypes';
import { calculateFrameLength } from '../../utils/frameGeometry';
import { Trash, X } from 'lucide-react';

interface FrameModalProps {
    frame: Frame;
    joints: Joint[];
    sections: FrameSection[];
    onUpdate: (id: number, frame: Frame) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}

export function FrameModal({ frame, joints, sections, onUpdate, onDelete, onClose }: FrameModalProps) {
    const jointI = joints.find((j) => j.id === frame.jointI);
    const jointJ = joints.find((j) => j.id === frame.jointJ);
    const length = jointI && jointJ ? calculateFrameLength(jointI, jointJ) : 0;

    const handleUpdate = (field: keyof Frame, value: any) => {
        onUpdate(frame.id, { ...frame, [field]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-white">Frame Details - ID: {frame.id}</h3>
                        <span className="text-[10px] text-gray-400 font-mono">
                            Joint {frame.jointI} → Joint {frame.jointJ}
                        </span>
                    </div>
                    <button onClick={onClose} className="cursor-pointer p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-5">
                    <section className="grid grid-cols-2 h-7 bo">
                        <div className="flex flex-row items-start justify-between rounded-lg">
                            <span className="text-xs text-white font-bold block mb-1">Length = {length.toFixed(3)} m</span>
                        </div>
                        <div className="flex flex-row items-start justify-between rounded-lg">
                            <span className="text-xs text-white font-bold block mb-1">ID = {frame.id}</span>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Section & Appearance</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] text-white block mb-1">Section Shape</label>
                                <select
                                    value={frame.sectionId || ''}
                                    onChange={(e) => handleUpdate('sectionId', e.target.value)}
                                    className="input"
                                >
                                    <option value="">Select Section...</option>
                                    {sections.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Transformation</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] text-white">Orientation Angle (°)</label>
                                    <span className="text-[10px] font-mono font-bold text-white">{frame.orientation}°</span>
                                </div>
                                <input
                                    type="number"
                                    value={frame.orientation}
                                    onChange={(e) => handleUpdate('orientation', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Offset Y (m)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={frame.offsetY}
                                    onChange={(e) => handleUpdate('offsetY', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Offset Z (m)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={frame.offsetZ}
                                    onChange={(e) => handleUpdate('offsetZ', Number(e.target.value))}
                                    className="input"
                                />
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-600 mt-4">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this frame?')) {
                                onDelete(frame.id);
                                onClose();
                            }
                        }}
                        title="Delete Frame"
                        className="cursor-pointer px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash className="w-5 h-5" />
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
