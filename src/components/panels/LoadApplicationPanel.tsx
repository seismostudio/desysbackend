import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PointLoad, DistributedFrameLoad, AreaLoad, LoadPattern, Joint, Frame, Shell } from '../../types/structuralTypes';

interface LoadApplicationPanelProps {
    loadPatterns: LoadPattern[];
    pointLoads: PointLoad[];
    distributedFrameLoads: DistributedFrameLoad[];
    areaLoads: AreaLoad[];
    joints: Joint[];
    frames: Frame[];
    shells: Shell[];
    onAddPointLoad: (load: PointLoad) => void;
    onAddDistributedLoad: (load: DistributedFrameLoad) => void;
    onAddAreaLoad: (load: AreaLoad) => void;
    onDeletePointLoad: (id: string) => void;
    onDeleteDistributedLoad: (id: string) => void;
    onDeleteAreaLoad: (id: string) => void;
}

export function LoadApplicationPanel({
    loadPatterns,
    pointLoads,
    distributedFrameLoads,
    areaLoads,
    joints,
    frames,
    shells,
    onAddPointLoad,
    onAddDistributedLoad,
    onAddAreaLoad,
    onDeletePointLoad,
    onDeleteDistributedLoad,
    onDeleteAreaLoad,
}: LoadApplicationPanelProps) {
    const [activeTab, setActiveTab] = useState<'point' | 'distributed' | 'area'>('point');

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-3 py-2 border-b bg-gray-50">
                <h3 className="font-bold text-sm text-gray-700">Load Application</h3>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b bg-gray-50">
                <button
                    onClick={() => setActiveTab('point')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'point'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Point Loads ({pointLoads.length})
                </button>
                <button
                    onClick={() => setActiveTab('distributed')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'distributed'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Distributed ({distributedFrameLoads.length})
                </button>
                <button
                    onClick={() => setActiveTab('area')}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'area'
                            ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    Area Loads ({areaLoads.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-3">
                {activeTab === 'point' && (
                    <PointLoadTab
                        loadPatterns={loadPatterns}
                        pointLoads={pointLoads}
                        joints={joints}
                        onAdd={onAddPointLoad}
                        onDelete={onDeletePointLoad}
                    />
                )}
                {activeTab === 'distributed' && (
                    <DistributedLoadTab
                        loadPatterns={loadPatterns}
                        distributedLoads={distributedFrameLoads}
                        frames={frames}
                        onAdd={onAddDistributedLoad}
                        onDelete={onDeleteDistributedLoad}
                    />
                )}
                {activeTab === 'area' && (
                    <AreaLoadTab
                        loadPatterns={loadPatterns}
                        areaLoads={areaLoads}
                        shells={shells}
                        onAdd={onAddAreaLoad}
                        onDelete={onDeleteAreaLoad}
                    />
                )}
            </div>
        </div>
    );
}

// Point Load Tab
function PointLoadTab({
    loadPatterns,
    pointLoads,
    joints,
    onAdd,
    onDelete,
}: {
    loadPatterns: LoadPattern[];
    pointLoads: PointLoad[];
    joints: Joint[];
    onAdd: (load: PointLoad) => void;
    onDelete: (id: string) => void;
}) {
    const [jointId, setJointId] = useState<number>(joints[0]?.id || 1);
    const [patternId, setPatternId] = useState<string>(loadPatterns[0]?.id || '');
    const [fx, setFx] = useState(0);
    const [fy, setFy] = useState(0);
    const [fz, setFz] = useState(0);
    const [mx, setMx] = useState(0);
    const [my, setMy] = useState(0);
    const [mz, setMz] = useState(0);

    const handleAdd = () => {
        if (!patternId) return;
        const newLoad: PointLoad = {
            id: `pl-${Date.now()}`,
            jointId,
            patternId,
            fx,
            fy,
            fz,
            mx,
            my,
            mz,
        };
        onAdd(newLoad);
        // Reset forces
        setFx(0);
        setFy(0);
        setFz(0);
        setMx(0);
        setMy(0);
        setMz(0);
    };

    return (
        <div className="space-y-4">
            {/* Input Form */}
            <div className="bg-gray-50 p-3 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Joint</label>
                        <select
                            value={jointId}
                            onChange={(e) => setJointId(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {joints.map((j) => (
                                <option key={j.id} value={j.id}>
                                    Joint {j.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Load Pattern</label>
                        <select
                            value={patternId}
                            onChange={(e) => setPatternId(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {loadPatterns.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fx (kN)</label>
                        <input
                            type="number"
                            value={fx}
                            onChange={(e) => setFx(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fy (kN)</label>
                        <input
                            type="number"
                            value={fy}
                            onChange={(e) => setFy(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Fz (kN)</label>
                        <input
                            type="number"
                            value={fz}
                            onChange={(e) => setFz(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Mx (kN·m)</label>
                        <input
                            type="number"
                            value={mx}
                            onChange={(e) => setMx(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">My (kN·m)</label>
                        <input
                            type="number"
                            value={my}
                            onChange={(e) => setMy(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Mz (kN·m)</label>
                        <input
                            type="number"
                            value={mz}
                            onChange={(e) => setMz(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                </div>

                <button
                    onClick={handleAdd}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Point Load
                </button>
            </div>

            {/* Load List */}
            <div className="space-y-2">
                {pointLoads.map((load) => {
                    const joint = joints.find((j) => j.id === load.jointId);
                    const pattern = loadPatterns.find((p) => p.id === load.patternId);
                    return (
                        <div key={load.id} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-xs font-bold text-gray-700">
                                        Joint {load.jointId} - {pattern?.name}
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                        {joint ? `(${joint.x.toFixed(2)}, ${joint.y.toFixed(2)}, ${joint.z.toFixed(2)})` : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onDelete(load.id)}
                                    className="p-1 hover:bg-red-50 rounded text-red-600"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px]">
                                <div>
                                    <span className="text-gray-500">Fx:</span> <span className="font-mono">{load.fx}</span> kN
                                </div>
                                <div>
                                    <span className="text-gray-500">Fy:</span> <span className="font-mono">{load.fy}</span> kN
                                </div>
                                <div>
                                    <span className="text-gray-500">Fz:</span> <span className="font-mono">{load.fz}</span> kN
                                </div>
                                <div>
                                    <span className="text-gray-500">Mx:</span> <span className="font-mono">{load.mx}</span> kN·m
                                </div>
                                <div>
                                    <span className="text-gray-500">My:</span> <span className="font-mono">{load.my}</span> kN·m
                                </div>
                                <div>
                                    <span className="text-gray-500">Mz:</span> <span className="font-mono">{load.mz}</span> kN·m
                                </div>
                            </div>
                        </div>
                    );
                })}
                {pointLoads.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-8">No point loads applied</div>
                )}
            </div>
        </div>
    );
}

// Distributed Load Tab (Simplified)
function DistributedLoadTab({
    loadPatterns,
    distributedLoads,
    frames,
    onAdd,
    onDelete,
}: {
    loadPatterns: LoadPattern[];
    distributedLoads: DistributedFrameLoad[];
    frames: Frame[];
    onAdd: (load: DistributedFrameLoad) => void;
    onDelete: (id: string) => void;
}) {
    const [frameId, setFrameId] = useState<number>(frames[0]?.id || 1);
    const [patternId, setPatternId] = useState<string>(loadPatterns[0]?.id || '');
    const [direction, setDirection] = useState<'X' | 'Y' | 'Z' | 'Gravity'>('Gravity');
    const [magnitude, setMagnitude] = useState(0);

    const handleAdd = () => {
        if (!patternId) return;
        const newLoad: DistributedFrameLoad = {
            id: `dl-${Date.now()}`,
            frameId,
            patternId,
            direction,
            loadType: 'Uniform',
            startMagnitude: magnitude,
            endMagnitude: magnitude,
            startDistance: 0,
            endDistance: 1, // Full length
        };
        onAdd(newLoad);
        setMagnitude(0);
    };

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Frame</label>
                        <select
                            value={frameId}
                            onChange={(e) => setFrameId(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {frames.map((f) => (
                                <option key={f.id} value={f.id}>
                                    Frame {f.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Load Pattern</label>
                        <select
                            value={patternId}
                            onChange={(e) => setPatternId(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {loadPatterns.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Direction</label>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value as any)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            <option value="X">X</option>
                            <option value="Y">Y</option>
                            <option value="Z">Z</option>
                            <option value="Gravity">Gravity</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Magnitude (kN/m)</label>
                        <input
                            type="number"
                            value={magnitude}
                            onChange={(e) => setMagnitude(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Distributed Load
                </button>
            </div>

            <div className="space-y-2">
                {distributedLoads.map((load) => {
                    const pattern = loadPatterns.find((p) => p.id === load.patternId);
                    return (
                        <div key={load.id} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-gray-700">
                                        Frame {load.frameId} - {pattern?.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        {load.direction}: {load.startMagnitude} kN/m ({load.loadType})
                                    </div>
                                </div>
                                <button onClick={() => onDelete(load.id)} className="p-1 hover:bg-red-50 rounded text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {distributedLoads.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-8">No distributed loads applied</div>
                )}
            </div>
        </div>
    );
}

// Area Load Tab (Simplified)
function AreaLoadTab({
    loadPatterns,
    areaLoads,
    shells,
    onAdd,
    onDelete,
}: {
    loadPatterns: LoadPattern[];
    areaLoads: AreaLoad[];
    shells: Shell[];
    onAdd: (load: AreaLoad) => void;
    onDelete: (id: string) => void;
}) {
    const [shellId, setShellId] = useState<number>(shells[0]?.id || 1);
    const [patternId, setPatternId] = useState<string>(loadPatterns[0]?.id || '');
    const [direction, setDirection] = useState<'X' | 'Y' | 'Z' | 'LocalZ' | 'Gravity'>('Gravity');
    const [magnitude, setMagnitude] = useState(0);

    const handleAdd = () => {
        if (!patternId) return;
        const newLoad: AreaLoad = {
            id: `al-${Date.now()}`,
            shellId,
            patternId,
            direction,
            magnitude,
        };
        onAdd(newLoad);
        setMagnitude(0);
    };

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg border space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Shell</label>
                        <select
                            value={shellId}
                            onChange={(e) => setShellId(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {shells.map((s) => (
                                <option key={s.id} value={s.id}>
                                    Shell {s.id}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Load Pattern</label>
                        <select
                            value={patternId}
                            onChange={(e) => setPatternId(e.target.value)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            {loadPatterns.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Direction</label>
                        <select
                            value={direction}
                            onChange={(e) => setDirection(e.target.value as any)}
                            className="w-full px-2 py-1.5 border rounded text-sm bg-white"
                        >
                            <option value="X">X</option>
                            <option value="Y">Y</option>
                            <option value="Z">Z</option>
                            <option value="LocalZ">Local Z</option>
                            <option value="Gravity">Gravity</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Magnitude (kN/m²)</label>
                        <input
                            type="number"
                            value={magnitude}
                            onChange={(e) => setMagnitude(Number(e.target.value))}
                            className="w-full px-2 py-1.5 border rounded text-sm"
                        />
                    </div>
                </div>
                <button
                    onClick={handleAdd}
                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Area Load
                </button>
            </div>

            <div className="space-y-2">
                {areaLoads.map((load) => {
                    const pattern = loadPatterns.find((p) => p.id === load.patternId);
                    return (
                        <div key={load.id} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-gray-700">
                                        Shell {load.shellId} - {pattern?.name}
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1">
                                        {load.direction}: {load.magnitude} kN/m²
                                    </div>
                                </div>
                                <button onClick={() => onDelete(load.id)} className="p-1 hover:bg-red-50 rounded text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {areaLoads.length === 0 && (
                    <div className="text-center text-gray-400 text-xs py-8">No area loads applied</div>
                )}
            </div>
        </div>
    );
}
