import { useState } from 'react';
import type { LoadPattern, LoadPatternType } from '../../types/structuralTypes';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface LoadPatternManagerProps {
    patterns: LoadPattern[];
    onAdd: (pattern: LoadPattern) => void;
    onUpdate: (id: string, pattern: LoadPattern) => void;
    onDelete: (id: string) => void;
}

export function LoadPatternManager({ patterns, onAdd, onUpdate, onDelete }: LoadPatternManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<LoadPattern>>({});

    const startCreate = () => {
        setCreating(true);
        setEditData({
            id: `lp_${Date.now()}`,
            name: 'Dead Load',
            type: 'Dead',
        });
    };

    const startEdit = (pattern: LoadPattern) => {
        setEditing(pattern.id);
        setEditData({ ...pattern });
    };

    const handleSave = () => {
        if (editData.id && editData.name && editData.type) {
            const pattern = editData as LoadPattern;
            if (creating) {
                onAdd(pattern);
                setCreating(false);
            } else if (editing) {
                onUpdate(editing, pattern);
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

    const getTypeColor = (type: LoadPatternType) => {
        switch (type) {
            case 'Dead': return 'bg-gray-600';
            case 'Live': return 'bg-blue-600';
            case 'Rain': return 'bg-cyan-600';
            case 'Wind': return 'bg-green-600';
            case 'Earthquake': return 'bg-red-600';
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Load Patterns</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null}
                    className="cursor-pointer flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Pattern
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-800">
                <table className="w-full text-xs">
                    <thead className="bg-gray-700 border-b">
                        <tr>
                            <th className="text-left px-3 py-2 font-semibold text-white">Name</th>
                            <th className="text-left px-3 py-2 font-semibold text-white">Type</th>
                            <th className="text-center px-3 py-2 font-semibold text-white">Self Weight</th>
                            <th className="text-center px-3 py-2 font-semibold text-white w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creating && (
                            <PatternRow
                                pattern={editData as LoadPattern}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                getTypeColor={getTypeColor}
                            />
                        )}
                        {patterns.map((pattern) => (
                            <PatternRow
                                key={pattern.id}
                                pattern={editing === pattern.id ? (editData as LoadPattern) : pattern}
                                isEditing={editing === pattern.id}
                                onEdit={() => startEdit(pattern)}
                                onDelete={() => onDelete(pattern.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                getTypeColor={getTypeColor}
                            />
                        ))}
                    </tbody>
                </table>
                {patterns.length === 0 && !creating && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No load patterns defined. Click "Add Pattern" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface PatternRowProps {
    pattern: LoadPattern;
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<LoadPattern>) => void;
    getTypeColor: (type: LoadPatternType) => string;
}

function PatternRow({
    pattern,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
    // getTypeColor,
}: PatternRowProps) {
    if (!isEditing) {
        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-white">{pattern.name}</td>
                <td className="px-3 py-2 text-white">
                    <span className={`px-2 py-1 text-white rounded text-xs`}>
                        {pattern.type}
                    </span>
                </td>
                <td className="px-3 py-2 text-center">
                    {pattern.selfWeight ? (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-medium border border-gray-300">
                            Included
                        </span>
                    ) : (
                        <span className="text-gray-400 text-[10px]">-</span>
                    )}
                </td>
                <td className="px-3 py-2 text-white">
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={onEdit}
                            className="cursor-pointer p-1 hover:bg-blue-100 rounded"
                            title="Edit"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="cursor-pointer p-1 hover:bg-red-100 rounded"
                            title="Delete"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b">
            <td className="px-3 py-2" colSpan={4}>
                <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-6 text-white">
                            <label className="text-[10px] block mb-1">Pattern Name</label>
                            <input
                                type="text"
                                value={pattern.name}
                                onChange={(e) => onChange?.({ ...pattern, name: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div className="col-span-6 text-white">
                            <label className="text-[10px] block mb-1">Type</label>
                            <select
                                value={pattern.type}
                                onChange={(e) => onChange?.({ ...pattern, type: e.target.value as LoadPatternType })}
                                className="input"
                            >
                                <option className="text-gray-600" value="Dead">Dead Load</option>
                                <option className="text-gray-600" value="Live">Live Load</option>
                                <option className="text-gray-600" value="Rain">Rain Load</option>
                                <option className="text-gray-600" value="Wind">Wind Load</option>
                                <option className="text-gray-600" value="Earthquake">Earthquake</option>
                            </select>
                        </div>
                        <div className="col-span-12 pb-1">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={pattern.selfWeight || false}
                                    onChange={(e) => onChange?.({ ...pattern, selfWeight: e.target.checked })}
                                    className="w-3.5 h-3.5 accent-blue-600 rounded"
                                />
                                <span className="text-xs text-white font-medium">Include Self Weight</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            className="cursor-pointer px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancel}
                            className="cursor-pointer px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
