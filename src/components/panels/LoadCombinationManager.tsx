import { useState } from 'react';
import type { LoadCombination, LoadCase, LoadCombinationCase } from '../../types/structuralTypes';
import { Trash2, Plus, Edit2, X } from 'lucide-react';

interface LoadCombinationManagerProps {
    combinations: LoadCombination[];
    cases: LoadCase[];
    onAdd: (combination: LoadCombination) => void;
    onUpdate: (id: string, combination: LoadCombination) => void;
    onDelete: (id: string) => void;
}

export function LoadCombinationManager({
    combinations,
    cases,
    onAdd,
    onUpdate,
    onDelete,
}: LoadCombinationManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<LoadCombination>>({});

    const startCreate = () => {
        setCreating(true);
        setEditData({
            id: `lcomb_${Date.now()}`,
            name: 'Combination 1',
            cases: [],
        });
    };

    const startEdit = (combination: LoadCombination) => {
        setEditing(combination.id);
        setEditData({ ...combination, cases: [...combination.cases] });
    };

    const handleSave = () => {
        if (editData.id && editData.name) {
            const combination = editData as LoadCombination;
            if (creating) {
                onAdd(combination);
                setCreating(false);
            } else if (editing) {
                onUpdate(editing, combination);
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

    const addCase = () => {
        if (cases.length > 0) {
            const newCases = [...(editData.cases || [])];
            newCases.push({ caseId: cases[0].id, scale: 1.0 });
            setEditData({ ...editData, cases: newCases });
        }
    };

    const removeCase = (index: number) => {
        const newCases = [...(editData.cases || [])];
        newCases.splice(index, 1);
        setEditData({ ...editData, cases: newCases });
    };

    const updateCase = (index: number, field: keyof LoadCombinationCase, value: string | number) => {
        const newCases = [...(editData.cases || [])];
        newCases[index] = { ...newCases[index], [field]: value };
        setEditData({ ...editData, cases: newCases });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-white">Load Combinations</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null || cases.length === 0}
                    className="cursor-pointer flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Combination
                </button>
            </div>

            {cases.length === 0 && (
                <div className="rounded p-3 text-xs text-white">
                    Please create at least one load case before adding load combinations.
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-gray-800">
                <table className="w-full text-xs">
                    <thead className="bg-gray-700 border-b">
                        <tr>
                            <th className="text-left px-3 py-2 font-semibold text-white">Name</th>
                            <th className="text-left px-3 py-2 font-semibold text-white">Load Cases</th>
                            <th className="text-center px-3 py-2 font-semibold w-20 text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creating && (
                            <CombinationRow
                                combination={editData as LoadCombination}
                                cases={cases}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onAddCase={addCase}
                                onRemoveCase={removeCase}
                                onUpdateCase={updateCase}
                            />
                        )}
                        {combinations.map((combination) => (
                            <CombinationRow
                                key={combination.id}
                                combination={editing === combination.id ? (editData as LoadCombination) : combination}
                                cases={cases}
                                isEditing={editing === combination.id}
                                onEdit={() => startEdit(combination)}
                                onDelete={() => onDelete(combination.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onAddCase={addCase}
                                onRemoveCase={removeCase}
                                onUpdateCase={updateCase}
                            />
                        ))}
                    </tbody>
                </table>
                {combinations.length === 0 && !creating && cases.length > 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No load combinations defined. Click "Add Combination" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface CombinationRowProps {
    combination: LoadCombination;
    cases: LoadCase[];
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<LoadCombination>) => void;
    onAddCase?: () => void;
    onRemoveCase?: (index: number) => void;
    onUpdateCase?: (index: number, field: keyof LoadCombinationCase, value: string | number) => void;
}

function CombinationRow({
    combination,
    cases,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
    onAddCase,
    onRemoveCase,
    onUpdateCase,
}: CombinationRowProps) {
    if (!isEditing) {
        return (
            <tr className="border-b hover:bg-gray-500">
                <td className="px-3 py-2 text-white">{combination.name}</td>
                <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                        {combination.cases.map((cc, idx) => {
                            const loadCase = cases.find((c) => c.id === cc.caseId);
                            return loadCase ? (
                                <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                                    {loadCase.name} × {cc.scale}
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
                        <label className="text-[10px]">Combination Name</label>
                        <input
                            type="text"
                            value={combination.name}
                            onChange={(e) => onChange?.({ ...combination, name: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-semibold">Load Cases</label>
                            <button
                                onClick={onAddCase}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px]"
                            >
                                <Plus className="w-3 h-3" />
                                Add Case
                            </button>
                        </div>

                        <div className="space-y-1">
                            {combination.cases?.map((cc, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        value={cc.caseId}
                                        onChange={(e) => onUpdateCase?.(idx, 'caseId', e.target.value)}
                                        className="input"
                                    >
                                        {cases.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px]">×</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={cc.scale}
                                            onChange={(e) => onUpdateCase?.(idx, 'scale', Number(e.target.value))}
                                            className="input"
                                        />
                                    </div>
                                    <button
                                        onClick={() => onRemoveCase?.(idx)}
                                        className="p-1 hover:bg-red-100 rounded text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
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
