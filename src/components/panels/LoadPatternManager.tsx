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
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700">Load Patterns</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Pattern
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="text-left px-3 py-2 font-semibold">Name</th>
                            <th className="text-left px-3 py-2 font-semibold">Type</th>
                            <th className="text-center px-3 py-2 font-semibold w-20">Actions</th>
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
    getTypeColor,
}: PatternRowProps) {
    if (!isEditing) {
        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{pattern.name}</td>
                <td className="px-3 py-2">
                    <span className={`px-2 py-1 ${getTypeColor(pattern.type)} text-white rounded text-xs font-medium`}>
                        {pattern.type}
                    </span>
                </td>
                <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={onEdit}
                            className="p-1 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                        >
                            <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-1 hover:bg-red-100 rounded text-red-600"
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
        <tr className="border-b bg-yellow-50">
            <td className="px-3 py-2" colSpan={3}>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-600">Pattern Name</label>
                            <input
                                type="text"
                                value={pattern.name}
                                onChange={(e) => onChange?.({ ...pattern, name: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-600">Type</label>
                            <select
                                value={pattern.type}
                                onChange={(e) => onChange?.({ ...pattern, type: e.target.value as LoadPatternType })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            >
                                <option value="Dead">Dead Load</option>
                                <option value="Live">Live Load</option>
                                <option value="Rain">Rain Load</option>
                                <option value="Wind">Wind Load</option>
                                <option value="Earthquake">Earthquake</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onSave}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                        >
                            Save
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}
