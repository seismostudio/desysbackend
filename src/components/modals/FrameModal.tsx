import type { Frame, Joint, FrameSection, DistributedFrameLoad, LoadPattern } from '../../types/structuralTypes';
import { calculateFrameLength } from '../../utils/frameGeometry';
import { Trash, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FrameModalProps {
    frame: Frame;
    joints: Joint[];
    sections: FrameSection[];
    onUpdate: (id: number, frame: Frame) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
    loadPatterns: LoadPattern[];
    distributedLoads: DistributedFrameLoad[];
    onAddLoad: (load: DistributedFrameLoad) => void;
    onDeleteLoad: (id: string) => void;
    onDivide: (segments: number) => void;
}

export function FrameModal({ frame, joints, sections, onUpdate, onDelete, onClose, loadPatterns, distributedLoads, onAddLoad, onDeleteLoad, onDivide }: FrameModalProps) {
    const jointI = joints.find((j) => j.id === frame.jointI);
    const jointJ = joints.find((j) => j.id === frame.jointJ);
    const length = jointI && jointJ ? calculateFrameLength(jointI, jointJ) : 0;

    const handleUpdate = (field: keyof Frame, value: any) => {
        onUpdate(frame.id, { ...frame, [field]: value });
    };

    // Load State
    const [patternId, setPatternId] = useState<string>(loadPatterns[0]?.id || '');
    const [direction, setDirection] = useState<'GlobalX' | 'GlobalY' | 'GlobalZ' | 'LocalX' | 'LocalY' | 'LocalZ' | 'Gravity'>('Gravity');
    const [magnitude, setMagnitude] = useState(0);
    
    // Divide State
    const [divideSegments, setDivideSegments] = useState(2);

    const handleAddLoad = () => {
        if (!patternId) return;
        const newLoad: DistributedFrameLoad = {
            id: `dl-${Date.now()}`,
            frameId: frame.id,
            patternId,
            direction,
            loadType: 'Uniform',
            startMagnitude: magnitude,
            endMagnitude: magnitude,
            startDistance: 0,
            endDistance: length,
        };
        onAddLoad(newLoad);
        setMagnitude(0);
    };
    
    const handleDivide = () => {
        if (divideSegments < 2) return;
        if (confirm(`Are you sure you want to divide this frame into ${divideSegments} segments? This action cannot be undone.`)) {
            onDivide(divideSegments);
            onClose();
        }
    };

    const frameLoads = distributedLoads.filter(l => l.frameId === frame.id);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600 sticky top-0 bg-primary z-10">
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
                    
                    {/* Divide Frame Section */}
                    <section className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-2">Modify Geometry</h4>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] text-white block mb-1">Divide into Segments</label>
                                <input 
                                    type="number" 
                                    min="2" 
                                    max="100" 
                                    value={divideSegments} 
                                    onChange={(e) => setDivideSegments(parseInt(e.target.value))}
                                    className="input"
                                />
                            </div>
                            <button 
                                onClick={handleDivide}
                                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium h-[26px] self-end mb-[1px] transition-colors"
                            >
                                Divide
                            </button>
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

                    <section className="border-t border-gray-600 pt-4">
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-3">Loads</h4>

                        {/* New Load Form */}
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 mb-4">
                            <h5 className="text-[10px] font-bold text-gray-300 mb-2 uppercase">Add Distributed Load</h5>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-white block mb-1">Pattern</label>
                                        <select value={patternId} onChange={(e) => setPatternId(e.target.value)} className="input">
                                            {loadPatterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white block mb-1">Direction</label>
                                        <select value={direction} onChange={(e) => setDirection(e.target.value as any)} className="input">
                                            <option value="GlobalX">Global X</option>
                                            <option value="GlobalY">Global Y</option>
                                            <option value="GlobalZ">Global Z</option>
                                            <option value="LocalX">Local X</option>
                                            <option value="LocalY">Local Y</option>
                                            <option value="LocalZ">Local Z</option>
                                            <option value="Gravity">Gravity</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-white block mb-1">Magnitude (kN/m)</label>
                                    <input type="number" value={magnitude} onChange={(e) => setMagnitude(Number(e.target.value))} className="input" />
                                </div>

                                <button
                                    onClick={handleAddLoad}
                                    disabled={!patternId}
                                    className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                >
                                    <Plus className="w-3 h-3" /> Add Load
                                </button>
                            </div>
                        </div>

                        {/* Load List */}
                        <div className="space-y-2">
                            {frameLoads.length > 0 ? (
                                frameLoads.map(load => {
                                    const pattern = loadPatterns.find(p => p.id === load.patternId);
                                    return (
                                        <div key={load.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-start group">
                                            <div className='flex-1'>
                                                <div className="text-[11px] font-bold text-white mb-1">{pattern?.name}</div>
                                                <div className="text-[10px] text-gray-400">
                                                    {load.direction}: {load.startMagnitude} kN/m
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onDeleteLoad(load.id)}
                                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 text-[10px] italic py-2">No loads assigned to this frame</div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-600 bg-primary sticky bottom-0 z-10">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this frame?')) {
                                onDelete(frame.id);
                                onClose();
                            }
                        }}
                        title="Delete Frame"
                        className="cursor-pointer px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors hover:bg-red-900/30 text-red-400"
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
