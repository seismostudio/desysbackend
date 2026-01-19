import { useState } from 'react';
import type { ShellSection, Material } from '../../types/structuralTypes';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface ShellSectionManagerProps {
    sections: ShellSection[];
    materials: Material[];
    onAdd: (section: ShellSection) => void;
    onUpdate: (id: string, section: ShellSection) => void;
    onDelete: (id: string) => void;
}

export function ShellSectionManager({ sections, materials, onAdd, onUpdate, onDelete }: ShellSectionManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<ShellSection>>({});

    const startCreate = () => {
        setCreating(true);
        setEditData({
            id: `shell_${Date.now()}`,
            name: 'New Shell',
            thickness: 0.15,
            materialId: materials[0]?.id || '',
            color: '#10b981',
        });
    };

    const startEdit = (section: ShellSection) => {
        setEditing(section.id);
        setEditData({ ...section });
    };

    const handleSave = () => {
        if (editData.id && editData.name && editData.thickness && editData.materialId) {
            const section = editData as ShellSection;
            if (creating) {
                onAdd(section);
                setCreating(false);
            } else if (editing) {
                onUpdate(editing, section);
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

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700">Shell/Plate Sections</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null || materials.length === 0}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Shell Section
                </button>
            </div>

            {materials.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                    Please create at least one material before adding shell sections.
                </div>
            )}

            <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="text-left px-3 py-2 font-semibold">Name</th>
                            <th className="text-left px-3 py-2 font-semibold">Material</th>
                            <th className="text-center px-3 py-2 font-semibold w-20">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creating && (
                            <ShellRow
                                section={editData as ShellSection}
                                materials={materials}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                            />
                        )}
                        {sections.map((section) => (
                            <ShellRow
                                key={section.id}
                                section={editing === section.id ? (editData as ShellSection) : section}
                                materials={materials}
                                isEditing={editing === section.id}
                                onEdit={() => startEdit(section)}
                                onDelete={() => onDelete(section.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                            />
                        ))}
                    </tbody>
                </table>
                {sections.length === 0 && !creating && materials.length > 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No shell sections defined. Click "Add Shell Section" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface ShellRowProps {
    section: ShellSection;
    materials: Material[];
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<ShellSection>) => void;
}

function ShellRow({
    section,
    materials,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
}: ShellRowProps) {
    if (!isEditing) {
        const material = materials.find((m) => m.id === section.materialId);

        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 flex items-center gap-2">
                    <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: section.color }}
                    />
                    {section.name}
                </td>
                <td className="px-3 py-2">{material?.name || 'Unknown'}</td>
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
        <tr className="border-b bg-green-50">
            <td className="px-3 py-2" colSpan={4}>
                <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-600">Section Name</label>
                            <input
                                type="text"
                                value={section.name}
                                onChange={(e) => onChange?.({ ...section, name: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-600">Thickness (m)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={section.thickness}
                                onChange={(e) => onChange?.({ ...section, thickness: Number(e.target.value) })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-600">Material</label>
                            <select
                                value={section.materialId}
                                onChange={(e) => onChange?.({ ...section, materialId: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-xs"
                            >
                                {materials.map((mat) => (
                                    <option key={mat.id} value={mat.id}>
                                        {mat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-600">Color</label>
                            <input
                                type="color"
                                value={section.color}
                                onChange={(e) => onChange?.({ ...section, color: e.target.value })}
                                className="w-full h-8 border rounded"
                            />
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
