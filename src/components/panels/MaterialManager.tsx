import { useState } from 'react';
import type { Material, MaterialType, SteelMaterial, ConcreteMaterial, LinearElasticMaterial } from '../../types/structuralTypes';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface MaterialManagerProps {
    materials: Material[];
    onAdd: (material: Material) => void;
    onUpdate: (id: string, material: Material) => void;
    onDelete: (id: string) => void;
}

export function MaterialManager({ materials, onAdd, onUpdate, onDelete }: MaterialManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<Material>>({});

    const startCreate = () => {
        setCreating(true);
        setEditData({
            id: `mat_${Date.now()}`,
            name: 'New Material',
            type: 'Steel',
            E: 200000,
            G: 77000,
            poisson: 0.3,
            density: 7850,
            fy: 250,
            fu: 400,
        } as SteelMaterial);
    };

    const startEdit = (material: Material) => {
        setEditing(material.id);
        setEditData({ ...material });
    };

    const handleSave = () => {
        if (editData.id && editData.name && editData.type) {
            const material = editData as Material;
            if (creating) {
                onAdd(material);
                setCreating(false);
            } else if (editing) {
                onUpdate(editing, material);
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

    const handleTypeChange = (type: MaterialType) => {
        const baseProps = {
            id: editData.id || `mat_${Date.now()}`,
            name: editData.name || 'New Material',
            type,
            E: editData.E || 200000,
            G: editData.G || 77000,
            poisson: editData.poisson || 0.3,
            density: editData.density || 7850,
        };

        if (type === 'Steel') {
            setEditData({
                ...baseProps,
                fy: 250,
                fu: 400,
            } as SteelMaterial);
        } else if (type === 'Concrete') {
            setEditData({
                ...baseProps,
                fc: 30,
                ft: 2.5,
            } as ConcreteMaterial);
        } else {
            setEditData(baseProps as LinearElasticMaterial);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700">Materials</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Material
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
                            <MaterialRow
                                material={editData as Material}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onTypeChange={handleTypeChange}
                            />
                        )}
                        {materials.map((material) => (
                            <MaterialRow
                                key={material.id}
                                material={editing === material.id ? (editData as Material) : material}
                                isEditing={editing === material.id}
                                onEdit={() => startEdit(material)}
                                onDelete={() => onDelete(material.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onTypeChange={handleTypeChange}
                            />
                        ))}
                    </tbody>
                </table>
                {materials.length === 0 && !creating && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No materials defined. Click "Add Material" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface MaterialRowProps {
    material: Material;
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<Material>) => void;
    onTypeChange?: (type: MaterialType) => void;
}

function MaterialRow({
    material,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
    onTypeChange,
}: MaterialRowProps) {
    if (!isEditing) {
        return (
            <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2">{material.name}</td>
                <td className="px-3 py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {material.type}
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
        <tr className="border-b bg-blue-50">
            <td className="px-3 py-2">
                <input
                    type="text"
                    value={material.name}
                    onChange={(e) => onChange?.({ ...material, name: e.target.value })}
                    className="w-full px-2 py-1 border rounded text-xs"
                    placeholder="Material name"
                />
            </td>
            <td className="px-3 py-2">
                <select
                    value={material.type}
                    onChange={(e) => onTypeChange?.(e.target.value as MaterialType)}
                    className="w-full px-2 py-1 border rounded text-xs"
                >
                    <option value="Steel">Steel</option>
                    <option value="Concrete">Concrete</option>
                    <option value="LinearElastic">Linear Elastic</option>
                </select>
            </td>
            <td className="px-3 py-2" colSpan={2}>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-[10px] text-gray-600">E (MPa)</label>
                        <input
                            type="number"
                            value={material.E}
                            onChange={(e) => onChange?.({ ...material, E: Number(e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">G (MPa)</label>
                        <input
                            type="number"
                            value={material.G}
                            onChange={(e) => onChange?.({ ...material, G: Number(e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Poisson</label>
                        <input
                            type="number"
                            step="0.01"
                            value={material.poisson}
                            onChange={(e) => onChange?.({ ...material, poisson: Number(e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Density (kg/m³)</label>
                        <input
                            type="number"
                            value={material.density}
                            onChange={(e) => onChange?.({ ...material, density: Number(e.target.value) })}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    {material.type === 'Steel' && (
                        <>
                            <div>
                                <label className="text-[10px] text-gray-600">fy (MPa)</label>
                                <input
                                    type="number"
                                    value={(material as SteelMaterial).fy}
                                    onChange={(e) => onChange?.({ ...material, fy: Number(e.target.value) })}
                                    className="w-full px-2 py-1 border rounded text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-600">fu (MPa)</label>
                                <input
                                    type="number"
                                    value={(material as SteelMaterial).fu}
                                    onChange={(e) => onChange?.({ ...material, fu: Number(e.target.value) })}
                                    className="w-full px-2 py-1 border rounded text-xs"
                                />
                            </div>
                        </>
                    )}
                    {material.type === 'Concrete' && (
                        <>
                            <div>
                                <label className="text-[10px] text-gray-600">fc (MPa)</label>
                                <input
                                    type="number"
                                    value={(material as ConcreteMaterial).fc}
                                    onChange={(e) => onChange?.({ ...material, fc: Number(e.target.value) })}
                                    className="w-full px-2 py-1 border rounded text-xs"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-600">ft (MPa)</label>
                                <input
                                    type="number"
                                    value={(material as ConcreteMaterial).ft}
                                    onChange={(e) => onChange?.({ ...material, ft: Number(e.target.value) })}
                                    className="w-full px-2 py-1 border rounded text-xs"
                                />
                            </div>
                        </>
                    )}
                </div>
            </td>
            <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={onSave}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                    >
                        Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-xs font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    );
}
