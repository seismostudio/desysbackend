import type { Joint, Restraint, PointLoad, LoadPattern } from '../../types/structuralTypes';
import { Trash, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface JointModalProps {
    joint: Joint;
    onUpdate: (id: number, joint: Joint) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
    loadPatterns: LoadPattern[];
    pointLoads: PointLoad[];
    onAddLoad: (load: PointLoad) => void;
    onDeleteLoad: (id: string) => void;
}

export function JointModal({ joint, onUpdate, onDelete, onClose, loadPatterns, pointLoads, onAddLoad, onDeleteLoad }: JointModalProps) {
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

    // const handleFixedChange = (field: keyof Joint, value: boolean) => {
    //     const currentFixed = joint || fixed: false;
    //     onUpdate(joint.id, {
    //         joint.fixed: value
    //     });
    // };

    // Load State
    const [patternId, setPatternId] = useState<string>(loadPatterns[0]?.id || '');
    // const [fixedJoint, setFixedJoint] = useState(joint.fixed?);
    const [fx, setFx] = useState(0);
    const [fy, setFy] = useState(0);
    const [fz, setFz] = useState(0);
    const [mx, setMx] = useState(0);
    const [my, setMy] = useState(0);
    const [mz, setMz] = useState(0);

    const handleAddLoad = () => {
        if (!patternId) return;
        const newLoad: PointLoad = {
            id: `pl-${Date.now()}`,
            jointId: joint.id,
            patternId,
            fx, fy, fz, mx, my, mz,
        };
        onAddLoad(newLoad);
        setFx(0); setFy(0); setFz(0);
        setMx(0); setMy(0); setMz(0);
    };

    const jointLoads = pointLoads.filter(l => l.jointId === joint.id);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-primary rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] custom-scrollbar">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-600 sticky top-0 bg-primary z-10">
                    <h3 className="font-bold text-white">Joint Details - ID: {joint.id}</h3>
                    <button onClick={onClose} className="cursor-pointer p-1 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    <section>
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-2">Coordinates (m)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-white block mb-1">X</label>
                                <input type="number" step="0.1" value={joint.x} onChange={(e) => handleCoordChange('x', Number(e.target.value))} className="input" />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Y</label>
                                <input type="number" step="0.1" value={joint.y} onChange={(e) => handleCoordChange('y', Number(e.target.value))} className="input" />
                            </div>
                            <div>
                                <label className="text-[10px] text-white block mb-1">Z</label>
                                <input type="number" step="0.1" value={joint.z} onChange={(e) => handleCoordChange('z', Number(e.target.value))} className="input" />
                            </div>
                        </div>
                    </section>

                    <section>
                        
                        {/* <div className="grid grid-cols-3 gap-y-3 gap-x-4">
                            <label className="flex items-center gap-2 cursor-pointer group text-white"> Fixed
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={joint.fixed || false}
                                        onChange={(e) => handleRestraintChange(joint.fixed?, e.target.checked)}
                                        className="w-4 h-4 border-2 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                                    />
                                </div>
                            </label>
                        </div> */}
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

                    <section className="border-t border-gray-600 pt-4">
                        <h4 className="text-xs font-semibold text-white tracking-widest mb-3">Loads</h4>

                        {/* New Load Form */}
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 mb-4">
                            <h5 className="text-[10px] font-bold text-gray-300 mb-2 uppercase">Add Point Load</h5>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-white block mb-1">Pattern</label>
                                    <select value={patternId} onChange={(e) => setPatternId(e.target.value)} className="input">
                                        {loadPatterns.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['fx', 'fy', 'fz'].map((axis) => (
                                        <div key={axis}>
                                            <label className="text-[10px] text-white block mb-1">{axis.toUpperCase()} (kN)</label>
                                            <input
                                                type="number"
                                                value={axis === 'fx' ? fx : axis === 'fy' ? fy : fz}
                                                onChange={(e) => axis === 'fx' ? setFx(Number(e.target.value)) : axis === 'fy' ? setFy(Number(e.target.value)) : setFz(Number(e.target.value))}
                                                className="input"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['mx', 'my', 'mz'].map((axis) => (
                                        <div key={axis}>
                                            <label className="text-[10px] text-white block mb-1">{axis.toUpperCase()} (kNm)</label>
                                            <input
                                                type="number"
                                                value={axis === 'mx' ? mx : axis === 'my' ? my : mz}
                                                onChange={(e) => axis === 'mx' ? setMx(Number(e.target.value)) : axis === 'my' ? setMy(Number(e.target.value)) : setMz(Number(e.target.value))}
                                                className="input"
                                            />
                                        </div>
                                    ))}
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

                        {/* Existing Loads List */}
                        <div className="space-y-2">
                            {jointLoads.length > 0 ? (
                                jointLoads.map(load => {
                                    const pattern = loadPatterns.find(p => p.id === load.patternId);
                                    return (
                                        <div key={load.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex justify-between items-start group">
                                            <div className='flex-1'>
                                                <div className="text-[11px] font-bold text-white mb-1">{pattern?.name}</div>
                                                <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[9px] text-gray-400">
                                                    {load.fx !== 0 && <span>Fx: {load.fx}</span>}
                                                    {load.fy !== 0 && <span>Fy: {load.fy}</span>}
                                                    {load.fz !== 0 && <span>Fz: {load.fz}</span>}
                                                    {load.mx !== 0 && <span>Mx: {load.mx}</span>}
                                                    {load.my !== 0 && <span>My: {load.my}</span>}
                                                    {load.mz !== 0 && <span>Mz: {load.mz}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => onDeleteLoad(load.id)}
                                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                                                title="Delete Load"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-gray-500 text-[10px] italic py-2">No loads assigned to this joint</div>
                            )}
                        </div>
                    </section>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-600 bg-primary sticky bottom-0 z-10">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this joint?')) {
                                onDelete(joint.id);
                                onClose();
                            }
                        }}
                        title="Delete Joint"
                        className="cursor-pointer px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors hover:bg-red-900/30 text-red-400"
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
