import { useState } from 'react';
import type { LoadCase, LoadPattern, LoadCasePattern } from '../../types/structuralTypes';
import { Trash2, Plus, Edit2, X } from 'lucide-react';

interface LoadCaseManagerProps {
    cases: LoadCase[];
    patterns: LoadPattern[];
    onAdd: (loadCase: LoadCase) => void;
    onUpdate: (id: string, loadCase: LoadCase) => void;
    onDelete: (id: string) => void;
}

export function LoadCaseManager({ cases, patterns, onAdd, onUpdate, onDelete }: LoadCaseManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<LoadCase>>({});

    const startCreate = () => {
        setCreating(true);
        setEditData({
            id: `lc_${Date.now()}`,
            name: 'Load Case 1',
            patterns: [],
        });
    };

    const startEdit = (loadCase: LoadCase) => {
        setEditing(loadCase.id);
        setEditData({ ...loadCase, patterns: [...loadCase.patterns] });
    };

    const handleSave = () => {
        if (editData.id && editData.name) {
            const loadCase = editData as LoadCase;
            if (creating) {
                onAdd(loadCase);
                setCreating(false);
            } else if (editing) {
                onUpdate(editing, loadCase);
                setEditing(null);
            }
            setEditData({});
        }
    };

    const handleCancel = () => {
        setCreating(false);
        setEditing(null);
        setEditData({});
    };

    const addPattern = () => {
        if (patterns.length > 0) {
            const newPatterns = [...(editData.patterns || [])];
            newPatterns.push({ patternId: patterns[0].id, scale: 1.0 });
            setEditData({ ...editData, patterns: newPatterns });
        }
    };

    const removePattern = (index: number) => {
        const newPatterns = [...(editData.patterns || [])];
        newPatterns.splice(index, 1);
        setEditData({ ...editData, patterns: newPatterns });
    };

    const updatePattern = (index: number, field: keyof LoadCasePattern, value: string | number) => {
        const newPatterns = [...(editData.patterns || [])];
        newPatterns[index] = { ...newPatterns[index], [field]: value };
        setEditData({ ...editData, patterns: newPatterns });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Load Cases</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null || patterns.length === 0}
                    className="cursor-pointer flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Load Case
                </button>
            </div>

            {patterns.length === 0 && (
                <div className="rounded p-3 text-xs text-white">
                    Please create at least one load pattern before adding load cases.
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-gray-800">
                <table className="w-full text-xs">
                    <thead className="bg-gray-700 border-b">
                        <tr>
                            <th className="text-left px-3 py-2 font-semibold text-white">Name</th>
                            <th className="text-left px-3 py-2 font-semibold text-white">Patterns</th>
                            <th className="text-center px-3 py-2 font-semibold w-20 text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creating && (
                            <LoadCaseRow
                                loadCase={editData as LoadCase}
                                patterns={patterns}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onAddPattern={addPattern}
                                onRemovePattern={removePattern}
                                onUpdatePattern={updatePattern}
                            />
                        )}
                        {cases.map((loadCase) => (
                            <LoadCaseRow
                                key={loadCase.id}
                                loadCase={editing === loadCase.id ? (editData as LoadCase) : loadCase}
                                patterns={patterns}
                                isEditing={editing === loadCase.id}
                                onEdit={() => startEdit(loadCase)}
                                onDelete={() => onDelete(loadCase.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onAddPattern={addPattern}
                                onRemovePattern={removePattern}
                                onUpdatePattern={updatePattern}
                            />
                        ))}
                    </tbody>
                </table>
                {cases.length === 0 && !creating && patterns.length > 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No load cases defined. Click "Add Load Case" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface LoadCaseRowProps {
    loadCase: LoadCase;
    patterns: LoadPattern[];
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<LoadCase>) => void;
    onAddPattern?: () => void;
    onRemovePattern?: (index: number) => void;
    onUpdatePattern?: (index: number, field: keyof LoadCasePattern, value: string | number) => void;
}

function LoadCaseRow({
    loadCase,
    patterns,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
    onAddPattern,
    onRemovePattern,
    onUpdatePattern,
}: LoadCaseRowProps) {
    if (!isEditing) {
        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-white">{loadCase.name}</td>
                <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                        {loadCase.patterns.map((cp, idx) => {
                            const pattern = patterns.find(p => p.id === cp.patternId);
                            return pattern ? (
                                <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                    {pattern.name} × {cp.scale}
                                </span>
                            ) : null;
                        })}
                    </div>
                </td>
                <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1 text-white">
                        <button onClick={onEdit} className="cursor-pointer p-1 hover:bg-blue-100 rounded" title="Edit">
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={onDelete} className="cursor-pointer p-1 hover:bg-red-100 rounded" title="Delete">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b">
            <td className="px-3 py-2" colSpan={3}>
                <div className="space-y-2 text-white">
                    <div>
                        <label className="text-[10px]">Load Case Name</label>
                        <input
                            type="text"
                            value={loadCase.name}
                            onChange={(e) => onChange?.({ ...loadCase, name: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold">Patterns</label>
                            <button
                                onClick={onAddPattern}
                                title="Add Pattern"
                                className="cursor-pointer flex items-center gap-1 px-1 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px]"
                            >
                                <Plus className="w-3 h-3" />

                            </button>
                        </div>

                        <div className="space-y-1">
                            {loadCase.patterns?.map((cp, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        value={cp.patternId}
                                        onChange={(e) => onUpdatePattern?.(idx, 'patternId', e.target.value)}
                                        className="input"
                                    >
                                        {patterns.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-white">×</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={cp.scale}
                                            onChange={(e) => onUpdatePattern?.(idx, 'scale', Number(e.target.value))}
                                            className="input"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onRemovePattern?.(idx)}
                                        title="Remove Pattern"
                                        className="p-1 hover:bg-red-100 rounded cursor-pointer text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={onSave} className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium">
                            Save
                        </button>
                        <button onClick={onCancel} className="cursor-pointer px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
