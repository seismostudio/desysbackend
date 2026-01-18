import React, { useState } from 'react';
import {
    PanelLeftOpen,
    Settings,
    ChevronDown,
    ChevronRight,
    Play,
    Loader2
} from 'lucide-react';
import type { ConnectionConfig, AnalysisResult } from '../../types';
import { ALL_PROFILES } from '../../data/profiles';

interface InputPanelProps {
    config: ConnectionConfig;
    updateConfig: (section: keyof ConnectionConfig, key: string, value: any) => void;
    onRunAnalysis: () => void;
    isAnalyzing: boolean;
    analysisResult: AnalysisResult | null;
    onOpenSettings: () => void;
}

const NumberInput = ({ label, value, onChange, unit }: { label: string, value: number, onChange: (v: number) => void, unit?: string }) => (
    <div className="flex flex-col gap-1">
        <label className="label-dark-theme">{label}</label>
        <div className="relative">
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                className="input-dark-theme"
            />
            {unit && <span className="absolute right-2 top-1.5 text-xs text-gray-400">{unit}</span>}
        </div>
    </div>
);

const CollapsibleSection = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-dark-theme">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-2 transition-colors cursor-pointer flex items-center justify-between group"
            >
                <span className="title2-dark-theme">{title}</span>
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                )}
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

export const InputPanel: React.FC<InputPanelProps> = ({ config, updateConfig, onRunAnalysis, isAnalyzing, onOpenSettings }) => {
    // export const InputPanel: React.FC<InputPanelProps> = ({ config, updateConfig, onRunAnalysis, isAnalyzing, analysisResult, onOpenSettings }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(true);

    const handleProfileChange = (section: 'beam' | 'column', profileName: string) => {
        const profile = ALL_PROFILES.find(p => p.name === profileName);
        if (profile) {
            updateConfig(section, '', {
                ...config[section],
                name: profile.name,
                depth: profile.depth,
                width: profile.width,
                webThickness: profile.webThickness,
                flangeThickness: profile.flangeThickness,
                isUserDefined: false
            });
        }
    };

    const ProfileInputs = ({ section }: { section: 'beam' | 'column' }) => {
        const dim = config[section];
        return (
            <div className="p-2 flex flex-col gap-2">
                <div className="flex items-center justify-between bg-gray-700/30 p-2 rounded-md border border-gray-600/30">
                    <span className="label-dark-theme">User Defined</span>
                    <button
                        onClick={() => updateConfig(section, 'isUserDefined', !dim.isUserDefined)}
                        className={`w-8 h-4 rounded-full relative transition-all duration-200 ${dim.isUserDefined ? 'bg-blue-600' : 'bg-gray-500'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${dim.isUserDefined ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                </div>

                {!dim.isUserDefined ? (
                    <div className="flex flex-col gap-1">
                        <label className="label-dark-theme">Select Profile</label>
                        <select
                            value={dim.name || ""}
                            onChange={(e) => handleProfileChange(section, e.target.value)}
                            className="input-dark-theme bg-gray-700"
                        >
                            <option value="" disabled>Choose a profile...</option>
                            {ALL_PROFILES.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        <NumberInput label="Depth" value={dim.depth} onChange={(v) => updateConfig(section, 'depth', v)} unit="mm" />
                        <NumberInput label="Width" value={dim.width} onChange={(v) => updateConfig(section, 'width', v)} unit="mm" />
                        <NumberInput label="Web Thick" value={dim.webThickness} onChange={(v) => updateConfig(section, 'webThickness', v)} unit="mm" />
                        <NumberInput label="Flange Thick" value={dim.flangeThickness} onChange={(v) => updateConfig(section, 'flangeThickness', v)} unit="mm" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed top-[60px] left-0 md:w-[400px] w-[calc(100vw-40px)] h-[94vh] flex shrink-0 z-30 pointer-events-none">
            {/* Main Panel Content */}
            <div
                className={`flex-1 flex flex-col h-full bg-dark-theme transition-transform duration-500 ease-in-out pointer-events-auto border-r border-gray-700 shadow-2xl ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="title-dark-theme border-b border-gray-700">
                    <span>Configuration</span>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <CollapsibleSection title="Loads">
                        <div className="p-2 grid grid-cols-2 gap-2">
                            <NumberInput label="Axial (P)" value={config.loads.axial} onChange={(v) => updateConfig('loads', 'axial', v)} unit="kN" />
                            <NumberInput label="Shear Vy" value={config.loads.shearY} onChange={(v) => updateConfig('loads', 'shearY', v)} unit="kN" />
                            <NumberInput label="Shear Vz" value={config.loads.shearZ} onChange={(v) => updateConfig('loads', 'shearZ', v)} unit="kN" />
                            <NumberInput label="Moment Mx" value={config.loads.momentX} onChange={(v) => updateConfig('loads', 'momentX', v)} unit="kNm" />
                            <NumberInput label="Moment My" value={config.loads.momentY} onChange={(v) => updateConfig('loads', 'momentY', v)} unit="kNm" />
                            <NumberInput label="Moment Mz" value={config.loads.momentZ} onChange={(v) => updateConfig('loads', 'momentZ', v)} unit="kNm" />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Beam Profile">
                        <ProfileInputs section="beam" />
                    </CollapsibleSection>

                    <CollapsibleSection title="Column Profile">
                        <div className="flex flex-col">
                            <ProfileInputs section="column" />
                            <div className="p-2 pt-0 flex flex-col gap-1">
                                <label className="label-dark-theme">Orientation</label>
                                <div className="flex bg-gray-700/50 p-1 rounded-md border border-gray-600/30">
                                    <button
                                        onClick={() => updateConfig('columnRotation', '', 0)}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${config.columnRotation === 0 ? 'bg-white text-gray-800' : 'text-gray-400 hover:text-white'}`}
                                    > Strong Axis </button>
                                    <button
                                        onClick={() => updateConfig('columnRotation', '', 90)}
                                        className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${config.columnRotation === 90 ? 'bg-white text-gray-800' : 'text-gray-400 hover:text-white'}`}
                                    > Weak Axis </button>
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="End Plate">
                        <div className="p-2 grid grid-cols-2 gap-2">
                            <NumberInput label="Height" value={config.plate.height} onChange={(v) => updateConfig('plate', 'height', v)} unit="mm" />
                            <NumberInput label="Width" value={config.plate.width} onChange={(v) => updateConfig('plate', 'width', v)} unit="mm" />
                            <NumberInput label="Thickness" value={config.plate.thickness} onChange={(v) => updateConfig('plate', 'thickness', v)} unit="mm" />
                        </div>
                    </CollapsibleSection>

                    <div className="bg-dark-theme border-b border-gray-800/50">
                        <div className="p-2 flex items-center justify-between">
                            <span className="title2-dark-theme">Haunch</span>
                            <button
                                onClick={() => updateConfig('haunch', 'enabled', !config.haunch.enabled)}
                                className={`w-10 h-5 rounded-full relative transition-all duration-200 ${config.haunch.enabled ? 'bg-blue-600' : 'bg-gray-500'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${config.haunch.enabled ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                        {config.haunch.enabled && (
                            <div className="p-2 flex flex-col gap-2 border-t border-gray-700/30">
                                <div className="grid grid-cols-2 gap-2">
                                    <NumberInput label="Length" value={config.haunch.length} onChange={(v) => updateConfig('haunch', 'length', v)} unit="mm" />
                                    <NumberInput label="Depth" value={config.haunch.depth} onChange={(v) => updateConfig('haunch', 'depth', v)} unit="mm" />
                                    <NumberInput label="Web Thick" value={config.haunch.thickness} onChange={(v) => updateConfig('haunch', 'thickness', v)} unit="mm" />
                                    <NumberInput label="Flange Width" value={config.haunch.flangeWidth} onChange={(v) => updateConfig('haunch', 'flangeWidth', v)} unit="mm" />
                                    <NumberInput label="Flange Thick" value={config.haunch.flangeThickness} onChange={(v) => updateConfig('haunch', 'flangeThickness', v)} unit="mm" />
                                </div>
                                <div className="border-t border-gray-700/30 pt-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="label-dark-theme">Haunch Bolts</span>
                                        <button
                                            onClick={() => updateConfig('haunch', 'bolts', { ...config.haunch.bolts, enabled: !config.haunch.bolts.enabled })}
                                            className={`w-8 h-4 rounded-full relative transition-all duration-200 ${config.haunch.bolts.enabled ? 'bg-blue-600' : 'bg-gray-500'}`}
                                        >
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${config.haunch.bolts.enabled ? 'left-4.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    {config.haunch.bolts.enabled && (
                                        <div className="grid grid-cols-2 gap-2 pb-2">
                                            <NumberInput label="Rows" value={config.haunch.bolts.rows} onChange={(v) => updateConfig('haunch', 'bolts', { ...config.haunch.bolts, rows: v })} unit="" />
                                            <NumberInput label="Spacing" value={config.haunch.bolts.rowSpacing} onChange={(v) => updateConfig('haunch', 'bolts', { ...config.haunch.bolts, rowSpacing: v })} unit="mm" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <CollapsibleSection title="Bolts">
                        <div className="p-2 grid grid-cols-2 gap-2">
                            <NumberInput label="Diameter" value={config.bolts.diameter} onChange={(v) => updateConfig('bolts', 'diameter', v)} unit="mm" />
                            <NumberInput label="Rows" value={config.bolts.rows} onChange={(v) => updateConfig('bolts', 'rows', v)} />
                            <NumberInput label="Cols" value={config.bolts.cols} onChange={(v) => updateConfig('bolts', 'cols', v)} />
                            <NumberInput label="Row Spacing" value={config.bolts.rowSpacing} onChange={(v) => updateConfig('bolts', 'rowSpacing', v)} unit="mm" />
                            <NumberInput label="Col Spacing" value={config.bolts.colSpacing} onChange={(v) => updateConfig('bolts', 'colSpacing', v)} unit="mm" />
                        </div>
                    </CollapsibleSection>
                </div>

                {/* <div className="p-4 md:mb-0 mb-12 border-t border-gray-700 bg-dark-theme/50">
                    <button
                        onClick={onRunAnalysis}
                        disabled={isAnalyzing}
                        className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-900/20 ${isAnalyzing ? 'bg-blue-600/50 cursor-not-allowed text-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        {isAnalyzing ? 'Solving Matrix...' : 'Run Analysis'}
                    </button>
                    {analysisResult && (
                        <p className="label-dark-theme text-center mt-2 font-bold text-blue-400 tracking-widest uppercase text-[10px]">
                            Analysis Complete
                        </p>
                    )}
                </div> */}
            </div>

            {/* Toggle Button Bar - Fixed to the panel edge */}
            <div className={`absolute top-0 flex flex-col h-full w-[40px] bg-dark-theme border-r border-gray-700 transition-all duration-500 ease-in-out pointer-events-auto rounded-r-md shadow-lg
                ${!isPanelOpen ? 'translate-x-[0px]' : 'md:translate-x-[400px] translate-x-[calc(100vw-40px)]'}`}>
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className="iconbutton-dark-theme hover:bg-gray-700 transition-colors"
                    title={isPanelOpen ? "Close Panel" : "Open Panel"}
                >
                    <PanelLeftOpen className={`w-5 h-5 transition-transform duration-300 ${isPanelOpen ? "rotate-180" : ""}`} />
                </button>
                <div className="p-1">
                    <button
                        onClick={onRunAnalysis}
                        disabled={isAnalyzing}
                        title={isAnalyzing ? "Analyzing..." : "Run Analysis"}
                        className={`w-full cursor-pointer py-2 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-900/20 ${isAnalyzing ? 'bg-blue-600/50 cursor-not-allowed text-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="iconbutton-dark-theme hover:bg-gray-700 transition-colors"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
