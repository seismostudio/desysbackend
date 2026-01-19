import { useState } from 'react';
import type { FrameSection, Material, SectionShape, SectionDimensions } from '../../types/structuralTypes';
import {
    calculateRectangular,
    calculateCircular,
    calculateTube,
    calculateHollow,
    calculateISection,
    formatSectionProperties,
} from '../../utils/sectionCalculator';
import { Trash2, Plus, Edit2 } from 'lucide-react';

interface FrameSectionManagerProps {
    sections: FrameSection[];
    materials: Material[];
    onAdd: (section: FrameSection) => void;
    onUpdate: (id: string, section: FrameSection) => void;
    onDelete: (id: string) => void;
}

export function FrameSectionManager({ sections, materials, onAdd, onUpdate, onDelete }: FrameSectionManagerProps) {
    const [editing, setEditing] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [editData, setEditData] = useState<Partial<FrameSection>>({});

    const startCreate = () => {
        setCreating(true);
        const defaultDimensions: SectionDimensions = {
            shape: 'Rectangular',
            width: 0.2,
            height: 0.3,
        };
        const properties = calculateRectangular(0.2, 0.3);
        setEditData({
            id: `sec_${Date.now()}`,
            name: 'New Section',
            dimensions: defaultDimensions,
            materialId: materials[0]?.id || '',
            color: '#3b82f6',
            properties,
        });
    };

    const startEdit = (section: FrameSection) => {
        setEditing(section.id);
        setEditData({ ...section });
    };

    const handleSave = () => {
        if (editData.id && editData.name && editData.dimensions && editData.materialId) {
            const section = editData as FrameSection;
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

    const handleShapeChange = (shape: SectionShape) => {
        let newDimensions: SectionDimensions;
        let properties;

        switch (shape) {
            case 'Rectangular':
                newDimensions = { shape, width: 0.2, height: 0.3 };
                properties = calculateRectangular(0.2, 0.3);
                break;
            case 'Circular':
                newDimensions = { shape, diameter: 0.25 };
                properties = calculateCircular(0.25);
                break;
            case 'Tube':
                newDimensions = { shape, outerDiameter: 0.3, wallThickness: 0.01 };
                properties = calculateTube(0.3, 0.01);
                break;
            case 'Hollow':
                newDimensions = { shape, width: 0.2, height: 0.3, wallThickness: 0.01 };
                properties = calculateHollow(0.2, 0.3, 0.01);
                break;
            case 'ISection':
                newDimensions = { shape, depth: 0.3, flangeWidth: 0.15, webThickness: 0.01, flangeThickness: 0.015 };
                properties = calculateISection(0.3, 0.15, 0.01, 0.015);
                break;
        }

        setEditData({
            ...editData,
            dimensions: newDimensions,
            properties,
        });
    };

    const handleDimensionChange = (key: string, value: number) => {
        if (!editData.dimensions) return;

        const newDimensions = { ...editData.dimensions, [key]: value } as SectionDimensions;
        let properties;

        switch (newDimensions.shape) {
            case 'Rectangular':
                properties = calculateRectangular(newDimensions.width, newDimensions.height);
                break;
            case 'Circular':
                properties = calculateCircular(newDimensions.diameter);
                break;
            case 'Tube':
                properties = calculateTube(newDimensions.outerDiameter, newDimensions.wallThickness);
                break;
            case 'Hollow':
                properties = calculateHollow(newDimensions.width, newDimensions.height, newDimensions.wallThickness);
                break;
            case 'ISection':
                properties = calculateISection(
                    newDimensions.depth,
                    newDimensions.flangeWidth,
                    newDimensions.webThickness,
                    newDimensions.flangeThickness
                );
                break;
        }

        setEditData({
            ...editData,
            dimensions: newDimensions,
            properties,
        });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-gray-700">Frame Sections</h3>
                <button
                    onClick={startCreate}
                    disabled={creating || editing !== null || materials.length === 0}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Section
                </button>
            </div>

            {materials.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                    Please create at least one material before adding frame sections.
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
                            <SectionRow
                                section={editData as FrameSection}
                                materials={materials}
                                isEditing={true}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onShapeChange={handleShapeChange}
                                onDimensionChange={handleDimensionChange}
                            />
                        )}
                        {sections.map((section) => (
                            <SectionRow
                                key={section.id}
                                section={editing === section.id ? (editData as FrameSection) : section}
                                materials={materials}
                                isEditing={editing === section.id}
                                onEdit={() => startEdit(section)}
                                onDelete={() => onDelete(section.id)}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onChange={setEditData}
                                onShapeChange={handleShapeChange}
                                onDimensionChange={handleDimensionChange}
                            />
                        ))}
                    </tbody>
                </table>
                {sections.length === 0 && !creating && materials.length > 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                        No sections defined. Click "Add Section" to create one.
                    </div>
                )}
            </div>
        </div>
    );
}

interface SectionRowProps {
    section: FrameSection;
    materials: Material[];
    isEditing: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onSave?: () => void;
    onCancel?: () => void;
    onChange?: (data: Partial<FrameSection>) => void;
    onShapeChange?: (shape: SectionShape) => void;
    onDimensionChange?: (key: string, value: number) => void;
}

function SectionRow({
    section,
    materials,
    isEditing,
    onEdit,
    onDelete,
    onSave,
    onCancel,
    onChange,
    onShapeChange,
    onDimensionChange,
}: SectionRowProps) {
    if (!isEditing) {
        const material = materials.find((m) => m.id === section.materialId);
        const formatted = formatSectionProperties(section.properties);

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
        <tr className="border-b bg-purple-50">
            <td className="px-3 py-2" colSpan={5}>
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
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
                            <label className="text-[10px] text-gray-600">Shape</label>
                            <select
                                value={section.dimensions?.shape || 'Rectangular'}
                                onChange={(e) => onShapeChange?.(e.target.value as SectionShape)}
                                className="w-full px-2 py-1 border rounded text-xs"
                            >
                                <option value="Rectangular">Rectangular</option>
                                <option value="Circular">Circular</option>
                                <option value="Tube">Tube</option>
                                <option value="Hollow">Hollow</option>
                                <option value="ISection">I-Section</option>
                            </select>
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
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        <DimensionInputs
                            dimensions={section.dimensions}
                            onDimensionChange={onDimensionChange}
                        />
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

                    {section.properties && (
                        <div className="bg-gray-100 rounded p-2">
                            <div className="text-[10px] font-semibold text-gray-600 mb-1">Calculated Properties</div>
                            <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-700">
                                {Object.entries(formatSectionProperties(section.properties)).map(([key, value]) => (
                                    <div key={key}>
                                        <span className="font-medium">{key}:</span> {value}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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

function DimensionInputs({
    dimensions,
    onDimensionChange,
}: {
    dimensions?: SectionDimensions;
    onDimensionChange?: (key: string, value: number) => void;
}) {
    if (!dimensions) return null;

    switch (dimensions.shape) {
        case 'Rectangular':
            return (
                <>
                    <div>
                        <label className="text-[10px] text-gray-600">Width (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.width}
                            onChange={(e) => onDimensionChange?.('width', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Height (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.height}
                            onChange={(e) => onDimensionChange?.('height', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                </>
            );

        case 'Circular':
            return (
                <div>
                    <label className="text-[10px] text-gray-600">Diameter (m)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={dimensions.diameter}
                        onChange={(e) => onDimensionChange?.('diameter', Number(e.target.value))}
                        className="w-full px-2 py-1 border rounded text-xs"
                    />
                </div>
            );

        case 'Tube':
            return (
                <>
                    <div>
                        <label className="text-[10px] text-gray-600">Outer Dia. (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.outerDiameter}
                            onChange={(e) => onDimensionChange?.('outerDiameter', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Thickness (m)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={dimensions.wallThickness}
                            onChange={(e) => onDimensionChange?.('wallThickness', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                </>
            );

        case 'Hollow':
            return (
                <>
                    <div>
                        <label className="text-[10px] text-gray-600">Width (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.width}
                            onChange={(e) => onDimensionChange?.('width', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Height (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.height}
                            onChange={(e) => onDimensionChange?.('height', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Thickness (m)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={dimensions.wallThickness}
                            onChange={(e) => onDimensionChange?.('wallThickness', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                </>
            );

        case 'ISection':
            return (
                <>
                    <div>
                        <label className="text-[10px] text-gray-600">Depth (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.depth}
                            onChange={(e) => onDimensionChange?.('depth', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Flange W. (m)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={dimensions.flangeWidth}
                            onChange={(e) => onDimensionChange?.('flangeWidth', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Web T. (m)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={dimensions.webThickness}
                            onChange={(e) => onDimensionChange?.('webThickness', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-600">Flange T. (m)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={dimensions.flangeThickness}
                            onChange={(e) => onDimensionChange?.('flangeThickness', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded text-xs"
                        />
                    </div>
                </>
            );
    }
}
