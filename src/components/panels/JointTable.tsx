import { useState } from 'react';
import type { Joint } from '../../types/structuralTypes';
import { Trash2, Plus, Pencil } from 'lucide-react';

interface JointTableProps {
    joints: Joint[];
    onAdd: (joint: Joint) => void;
    onUpdate: (id: number, joint: Joint) => void;
    onDelete: (id: number) => void;
    selectedJointId: number | null;
    onSelectJoint: (id: number | null) => void;
}

export function JointTable({ joints, onAdd, onUpdate, onDelete, selectedJointId, onSelectJoint }: JointTableProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<Joint>>({});

    const handleAddJoint = () => {
        const nextId = joints.length > 0 ? Math.max(...joints.map(j => j.id)) + 1 : 1;
        onAdd({
            id: nextId,
            x: 0,
            y: 0,
            z: 0,
        });
    };

    const startEdit = (joint: Joint) => {
        setEditingId(joint.id);
        setEditData({ ...joint });
    };

    const saveEdit = () => {
        if (editingId !== null && editData.x !== undefined && editData.y !== undefined && editData.z !== undefined) {
            onUpdate(editingId, editData as Joint);
            setEditingId(null);
            setEditData({});
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-white">Joints</h4>
                <button
                    onClick={handleAddJoint}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Joint
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-800  h-[calc(100vh-250px)] overflow-y-auto no-scrollbar">
                <table className="w-full text-[10px]">
                    <thead className="bg-gray-700 border-b sticky top-0">
                        <tr>
                            <th className="text-left px-2 py-1 font-semibold text-white">ID</th>
                            <th className="text-right px-2 py-1 font-semibold text-white">X (m)</th>
                            <th className="text-right px-2 py-1 font-semibold text-white">Y (m)</th>
                            <th className="text-right px-2 py-1 font-semibold text-white">Z (m)</th>
                            <th className="text-center px-2 py-1 font-semibold w-12 text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {joints.map((joint) => {
                            const isEditing = editingId === joint.id;
                            const displayJoint = isEditing ? (editData as Joint) : joint;
                            const isSelected = selectedJointId === joint.id;

                            return (
                                <tr
                                    key={joint.id}
                                    className={`border-b hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-gray-700' : ''} ${isEditing ? 'bg-gray-700' : ''}`}
                                    onClick={() => !isEditing && onSelectJoint(joint.id)}
                                >
                                    <td className="px-2 py-1 font-medium text-white">{joint.id}</td>
                                    <td className="px-2 py-1 text-right text-white">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={displayJoint.x}
                                                onChange={(e) => setEditData({ ...editData, x: Number(e.target.value) })}
                                                className="w-full px-1 py-0.5 border rounded text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            displayJoint.x.toFixed(2)
                                        )}
                                    </td>
                                    <td className="px-2 py-1 text-right text-white">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={displayJoint.y}
                                                onChange={(e) => setEditData({ ...editData, y: Number(e.target.value) })}
                                                className="w-full px-1 py-0.5 border rounded text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            displayJoint.y.toFixed(2)
                                        )}
                                    </td>
                                    <td className="px-2 py-1 text-right text-white">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={displayJoint.z}
                                                onChange={(e) => setEditData({ ...editData, z: Number(e.target.value) })}
                                                className="w-full px-1 py-0.5 border rounded text-right"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            displayJoint.z.toFixed(2)
                                        )}
                                    </td>
                                    <td className="px-2 py-1 text-white" onClick={(e) => e.stopPropagation()}>
                                        {isEditing ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={saveEdit}
                                                    className="cursor-pointer px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px]"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="cursor-pointer px-1.5 py-0.5 bg-gray-400 hover:bg-gray-500 text-white rounded text-[9px]"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEdit(joint);
                                                    }}
                                                    title="Edit"
                                                    className="p-0.5 cursor-pointer hover:bg-blue-700 rounded text-white"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(joint.id);
                                                    }}
                                                    title="Delete"
                                                    className="p-0.5 cursor-pointer hover:bg-red-100 rounded text-white"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {joints.length === 0 && (
                    <div className="text-center py-6 text-gray-400 text-[10px]">
                        No joints defined. Click "Add Joint" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
