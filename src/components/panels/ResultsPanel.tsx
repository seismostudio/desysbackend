import { useMemo, useState, useRef, useEffect } from 'react';
import type { AnalysisResults, AnalysisResultMap, Joint, Frame, FrameSection } from '../../types/structuralTypes';
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, ChevronDown, Check } from 'lucide-react';

interface ResultsPanelProps {
    results: AnalysisResults | null;
    analysisResultMap?: AnalysisResultMap | null;
    activeResultId?: string | null;
    onSelectResult?: (id: string) => void;
    joints: Joint[];
    frames: Frame[];
    frameSections: FrameSection[];
    isAnalyzing: boolean;
}

type SortConfig = {
    key: string;
    direction: 'asc' | 'desc';
} | null;

// Helper Component for Multi-Select Dropdown
function MultiSelectFilter({
    label,
    options,
    selectedValues,
    onChange
}: {
    label: string;
    options: string[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newSelected = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedValues.length === options.length) {
            onChange([]);
        } else {
            onChange(options);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-700 text-white text-[10px] py-1 px-2 rounded border border-gray-600 hover:bg-gray-600 focus:outline-none"
            >
                <div className="flex items-center gap-1 overflow-hidden">
                    <Filter className="w-3 h-3 text-gray-400" />
                    <span className="truncate">
                        {selectedValues.length === 0
                            ? `All ${label}s`
                            : selectedValues.length === options.length
                                ? `All ${label}s`
                                : `${selectedValues.length} selected`}
                    </span>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400 ml-1" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto bg-gray-800 border border-gray-600 rounded shadow-lg z-50">
                    <div className="p-2 border-b border-gray-700 sticky top-0 bg-gray-800">
                        <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded"
                            onClick={handleSelectAll}
                        >
                            <div className={`w-3 h-3 border rounded border-gray-500 flex items-center justify-center ${selectedValues.length === options.length ? 'bg-blue-500 border-blue-500' : ''}`}>
                                {selectedValues.length === options.length && <Check className="w-2 h-2 text-white" />}
                            </div>
                            <span className="text-[10px] text-white">Select All</span>
                        </div>
                    </div>
                    <div className="p-1">
                        {options.map(option => (
                            <div
                                key={option}
                                className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 p-1 rounded"
                                onClick={() => toggleOption(option)}
                            >
                                <div className={`w-3 h-3 border rounded border-gray-500 flex items-center justify-center ${selectedValues.includes(option) ? 'bg-blue-500 border-blue-500' : ''}`}>
                                    {selectedValues.includes(option) && <Check className="w-2 h-2 text-white" />}
                                </div>
                                <span className="text-[10px] text-white truncate">{option}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ResultsPanel({ results, analysisResultMap, activeResultId, onSelectResult, frames, frameSections, isAnalyzing }: ResultsPanelProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [filters, setFilters] = useState<{
        frameId: string[];
        sectionName: string[];
        nodeId: string[];
    }>({
        frameId: [],
        sectionName: [],
        nodeId: []
    });

    // Memoize frame and section lookups
    const frameMap = useMemo(() => new Map(frames.map(f => [f.id, f])), [frames]);
    const sectionMap = useMemo(() => new Map(frameSections.map(s => [s.id, s])), [frameSections]);

    // 1. Flatten Data (Raw)
    const rawFlatData = useMemo(() => {
        if (!results?.frameDetailedResults) return [];

        return Object.entries(results.frameDetailedResults).flatMap(([frameIdStr, detail]) => {
            const frameId = Number(frameIdStr);
            const frame = frameMap.get(frameId);
            const section = frame && frame.sectionId ? sectionMap.get(frame.sectionId) : null;
            const sectionName = section ? section.name : 'Unknown';

            return detail.forces.map((force, index) => ({
                id: `${frameId}-${index}`,
                frameId,
                sectionName,
                nodeId: index + 1,
                P: force.P,
                V2: force.V2,
                V3: force.V3,
                M2: force.M2,
                M3: force.M3,
                T: force.T,
            }));
        });
    }, [results, frameMap, sectionMap]);

    // 2. Extract Unique Options for Filters
    const filterOptions = useMemo(() => {
        const frames = new Set<string>();
        const sections = new Set<string>();
        const nodes = new Set<string>();

        rawFlatData.forEach(item => {
            frames.add(item.frameId.toString());
            sections.add(item.sectionName);
            nodes.add(item.nodeId.toString());
        });

        return {
            frames: Array.from(frames).sort((a, b) => Number(a) - Number(b)),
            sections: Array.from(sections).sort(),
            nodes: Array.from(nodes).sort((a, b) => Number(a) - Number(b))
        };
    }, [rawFlatData]);

    // 3. Process Data (Filter & Sort)
    const processedResults = useMemo(() => {
        let data = [...rawFlatData];

        // Filter checks (if array is empty, it means "All" / no filter)
        if (filters.frameId.length > 0) {
            data = data.filter(item => filters.frameId.includes(item.frameId.toString()));
        }
        if (filters.sectionName.length > 0) {
            data = data.filter(item => filters.sectionName.includes(item.sectionName));
        }
        if (filters.nodeId.length > 0) {
            data = data.filter(item => filters.nodeId.includes(item.nodeId.toString()));
        }

        // Sort
        if (sortConfig) {
            data.sort((a, b) => {
                //@ts-ignore - dynamic sorting
                const aVal = a[sortConfig.key];
                //@ts-ignore
                const bVal = b[sortConfig.key];

                if (aVal < bVal) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aVal > bVal) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return data;
    }, [rawFlatData, filters, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleFilterChange = (key: keyof typeof filters, values: string[]) => {
        setFilters(prev => ({ ...prev, [key]: values }));
    };

    if (isAnalyzing) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-sm text-white">Running analysis...</p>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                <div className="text-white text-sm">
                    <p className="font-bold mb-2">No analysis results yet</p>
                    <p>Configure your model and loads, then click "Run Analysis"</p>
                </div>
            </div>
        );
    }

    if (!results.isValid) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center">
                <div className="text-white text-sm">
                    <p className="font-bold mb-2">Analysis Failed</p>
                    <p>Check console for error details</p>
                </div>
            </div>
        );
    }

    // Find max displacements
    const maxDisp = results.displacements.reduce(
        (max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return mag > max.mag ? { mag, joint: d.jointId } : max;
        },
        { mag: 0, joint: 0 }
    );

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-gray-500 opacity-50" />;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />;
    };

    const SortableHeader = ({ label, columnKey, align = 'right' }: { label: string, columnKey: string, align?: 'left' | 'right' }) => (
        <th
            className={`px-2 py-1 text-${align} font-semibold text-white cursor-pointer hover:bg-gray-700 select-none`}
            onClick={() => handleSort(columnKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label}
                <SortIcon columnKey={columnKey} />
            </div>
        </th>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-2 border-b">
                <h3 className="font-bold text-sm text-white mb-2">Analysis Results</h3>

                {/* Result Selector */}
                {analysisResultMap && activeResultId && onSelectResult && (
                    <div className="mb-2">
                        <select
                            value={activeResultId}
                            onChange={(e) => onSelectResult(e.target.value)}
                            className="input"
                        >
                            {Object.values(analysisResultMap).map(res => (
                                <option key={res.loadCaseId} value={res.loadCaseId}>
                                    {res.loadCaseId.startsWith('case-') ? 'Case: ' : 'Combo: '}
                                    {res.log[1].includes('Combining')
                                        ? res.loadCaseId // If it's a combination (simplified detection, usually better to store name in results)
                                        : res.loadCaseId}
                                    {/* Ideally we should pass names into results or use lookup */}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <p className="text-[10px] text-gray-400">Current View: {results.caseName || results.loadCaseId}</p>
            </div>

            <div className="flex-1 overflow-auto no-scrollbar p-3 space-y-4">
                {/* Summary Card */}
                <div className="">
                    <div className="text-xs font-bold text-white mb-2">Analysis Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                            <span className="text-white">Max Disp. :</span>{' '}
                            <span className="font-mono text-white">{(maxDisp.mag * 1000).toFixed(2)} mm</span>
                        </div>
                        <div>
                            <span className="text-white">At Joint :</span>{' '}
                            <span className="text-white">{maxDisp.joint}</span>
                        </div>
                    </div>
                </div>

                {/* Joint Displacements Table */}
                <div>
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">
                        Joint Displacements
                    </h4>
                    <div className="border rounded-lg overflow-y-auto no-scrollbar h-60">
                        <table className="w-full text-[10px]">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="px-2 py-1 text-left font-semibold text-white">Joint</th>
                                    <th className="px-2 py-1 text-right font-semibold text-white">Ux (mm)</th>
                                    <th className="px-2 py-1 text-right font-semibold text-white">Uy (mm)</th>
                                    <th className="px-2 py-1 text-right font-semibold text-white">Uz (mm)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y bg-gray-700">
                                {results.displacements.map((disp, i) => ( // Added index as fallback key
                                    <tr key={disp.jointId || i} className="hover:bg-gray-50">
                                        <td className="px-2 py-1 font-medium text-white">{disp.jointId}</td>
                                        <td className="px-2 py-1 text-right font-mono text-white">
                                            {(disp.ux * 1000).toFixed(3)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono text-white">
                                            {(disp.uy * 1000).toFixed(3)}
                                        </td>
                                        <td className="px-2 py-1 text-right font-mono text-white">
                                            {(disp.uz * 1000).toFixed(3)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Internal Forces Table */}
                <div className="w-full">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                        Internal Forces
                        <span className="text-[10px] font-normal text-gray-400">{processedResults.length} records</span>
                    </h4>

                    {/* Filters */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {/* Frame Filter */}
                        <MultiSelectFilter
                            label="Frame"
                            options={filterOptions.frames}
                            selectedValues={filters.frameId}
                            onChange={(vals) => handleFilterChange('frameId', vals)}
                        />
                        {/* Section Filter */}
                        <MultiSelectFilter
                            label="Section"
                            options={filterOptions.sections}
                            selectedValues={filters.sectionName}
                            onChange={(vals) => handleFilterChange('sectionName', vals)}
                        />
                        {/* Node Filter */}
                        <MultiSelectFilter
                            label="Station"
                            options={filterOptions.nodes}
                            selectedValues={filters.nodeId}
                            onChange={(vals) => handleFilterChange('nodeId', vals)}
                        />
                    </div>

                    <div className="border rounded-lg overflow-x-auto custom-scrollbar h-80">
                        <table className="w-full text-[10px]">
                            <thead className="bg-gray-800 sticky top-0 z-10">
                                <tr>
                                    <SortableHeader label="Frame" columnKey="frameId" align="left" />
                                    <SortableHeader label="Section" columnKey="sectionName" align="left" />
                                    <SortableHeader label="Sta." columnKey="nodeId" />
                                    <SortableHeader label="P (kN)" columnKey="P" />
                                    <SortableHeader label="V2 (kN)" columnKey="V2" />
                                    <SortableHeader label="V3 (kN)" columnKey="V3" />
                                    <SortableHeader label="M2 (kNm)" columnKey="M2" />
                                    <SortableHeader label="M3 (kNm)" columnKey="M3" />
                                    <SortableHeader label="T (kNm)" columnKey="T" />
                                </tr>
                            </thead>
                            <tbody className="divide-y bg-gray-700">
                                {processedResults.length > 0 ? (
                                    processedResults.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-2 py-1 font-medium text-white">{row.frameId}</td>
                                            <td className="px-2 py-1 text-gray-300">{row.sectionName}</td>
                                            <td className="px-2 py-1 text-center text-gray-300">{row.nodeId}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.P.toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.V2.toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.V3.toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.M2.toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.M3.toFixed(2)}</td>
                                            <td className="px-2 py-1 text-right font-mono text-white">{row.T.toFixed(2)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-2 py-4 text-center text-gray-400 italic">
                                            No results found matching filters
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="px-3 py-2 border-t text-[10px] text-gray-500 flex justify-between">
                <span>DE-Sys | by Dahar Engineer</span>
                <span>v0.2.0</span>
            </div>
        </div>
    );
}
