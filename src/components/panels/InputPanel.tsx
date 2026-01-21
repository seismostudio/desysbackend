import React, { useState } from 'react';
import { MaterialManager } from './MaterialManager';
import { FrameSectionManager } from './FrameSectionManager';
import { ShellSectionManager } from './ShellSectionManager';
import { LoadPatternManager } from './LoadPatternManager';
import { LoadCaseManager } from './LoadCaseManager';
import { LoadCombinationManager } from './LoadCombinationManager';
import { LoadApplicationPanel } from './LoadApplicationPanel';
import { JointTable } from './JointTable';
import { FrameTable } from './FrameTable';
import { ShellTable } from './ShellTable';
import { ResultsPanel } from './ResultsPanel';
import {
    type StructuralModel,
    type UIState,
    type Material,
    type FrameSection,
    type ShellSection,
    type LoadPattern,
    type LoadCase,
    type LoadCombination,
    type Joint,
    type PointLoad,
    type DistributedFrameLoad,
    type AreaLoad,
    type AnalysisResults,
} from '../../types/structuralTypes';
import { PanelLeftOpen, Settings } from 'lucide-react';

interface InputPanelProps {
    activeTab: 'materials' | 'sections' | 'loads' | 'loadApp' | 'model' | 'results';
    setActiveTab: (tab: 'materials' | 'sections' | 'loads' | 'loadApp' | 'model' | 'results') => void;
    model: StructuralModel;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    modelTab: 'joints' | 'frames' | 'shells';
    setModelTab: (tab: 'joints' | 'frames' | 'shells') => void;
    analysisResults: AnalysisResults | null;
    analysisResultMap?: Record<string, AnalysisResults> | null;
    activeResultId?: string | null;
    onSelectResult?: (id: string) => void;
    isAnalyzing: boolean;

    // Handlers
    onAddMaterial: (material: Material) => void;
    onUpdateMaterial: (id: string, material: Material) => void;
    onDeleteMaterial: (id: string) => void;

    onAddFrameSection: (section: FrameSection) => void;
    onUpdateFrameSection: (id: string, section: FrameSection) => void;
    onDeleteFrameSection: (id: string) => void;

    onAddShellSection: (section: ShellSection) => void;
    onUpdateShellSection: (id: string, section: ShellSection) => void;
    onDeleteShellSection: (id: string) => void;

    onAddLoadPattern: (pattern: LoadPattern) => void;
    onUpdateLoadPattern: (id: string, pattern: LoadPattern) => void;
    onDeleteLoadPattern: (id: string) => void;

    onAddLoadCase: (loadCase: LoadCase) => void;
    onUpdateLoadCase: (id: string, loadCase: LoadCase) => void;
    onDeleteLoadCase: (id: string) => void;

    onAddLoadCombination: (combination: LoadCombination) => void;
    onUpdateLoadCombination: (id: string, combination: LoadCombination) => void;
    onDeleteLoadCombination: (id: string) => void;

    onAddPointLoad: (load: PointLoad) => void;
    onDeletePointLoad: (id: string) => void;
    onAddDistributedLoad: (load: DistributedFrameLoad) => void;
    onDeleteDistributedLoad: (id: string) => void;
    onAddAreaLoad: (load: AreaLoad) => void;
    onDeleteAreaLoad: (id: string) => void;

    onAddJoint: (joint: Joint) => void;
    onUpdateJoint: (id: number, joint: Joint) => void;
    onDeleteJoint: (id: number) => void;

    onDeleteFrame: (id: number) => void;
    onToggleFrameCreateMode: () => void;

    onDeleteShell: (id: number) => void;
    onToggleShellCreateMode: () => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({
    activeTab,
    setActiveTab,
    model,
    uiState,
    setUIState,
    modelTab,
    setModelTab,
    analysisResults,
    analysisResultMap,
    activeResultId,
    onSelectResult,
    isAnalyzing,
    onAddMaterial,
    onUpdateMaterial,
    onDeleteMaterial,
    onAddFrameSection,
    onUpdateFrameSection,
    onDeleteFrameSection,
    onAddShellSection,
    onUpdateShellSection,
    onDeleteShellSection,
    onAddLoadPattern,
    onUpdateLoadPattern,
    onDeleteLoadPattern,
    onAddLoadCase,
    onUpdateLoadCase,
    onDeleteLoadCase,
    onAddLoadCombination,
    onUpdateLoadCombination,
    onDeleteLoadCombination,
    onAddPointLoad,
    onDeletePointLoad,
    onAddDistributedLoad,
    onDeleteDistributedLoad,
    onAddAreaLoad,
    onDeleteAreaLoad,
    onAddJoint,
    onUpdateJoint,
    onDeleteJoint,
    onDeleteFrame,
    onToggleFrameCreateMode,
    onDeleteShell,
    onToggleShellCreateMode,
}) => {
    const [isPanelOpen, setIsPanelOpen] = useState(true);
    return (
        <div className="absolute top-0 h-full overflow-y-auto w-full no-scrollbar flex">
            <div className={`absolute top-16 left-0 bottom-0 h-[calc(100%-4rem)] w-fit bg-primary shadow-lg rounded-r-lg z-100 flex gap-1 border-b pb-2 transition ${isPanelOpen ? "translate-x-100" : "translate-x-0"}`}>
                <div className="p-2 py-4 gap-2 flex flex-col items-center">
                    <PanelLeftOpen
                        className={`w-6 h-6 text-white cursor-pointer transition ${isPanelOpen ? "" : "rotate-180"}`}
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                    />
                    <div className='flex flex-col justify-between h-full'>
                        <div className='flex flex-col gap-2'>
                            <button
                                onClick={() => setActiveTab('materials')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'materials' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Materials"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">M</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('sections')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'sections' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Sections"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">S</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('loads')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'loads' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Loads"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">L</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('model')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'model' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Draw"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">D</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('loadApp')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'loadApp' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Load Application"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">LA</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'results' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Results"
                            >
                                <span className="text-sm border-2 border-white text-white rounded-md w-6 h-6 flex items-center justify-center">R</span>
                            </button>
                        </div>
                        <div>
                            <button
                                // onClick={() => setActiveTab('results')}
                                className={`cursor-pointer transition p-2 rounded text-xs font-medium 
                                    ${activeTab === 'results' ? 'bg-blue-600' : ''}
                                    ${isPanelOpen ? "translate-y-0 opacity-100" : "-translate-y-100 opacity-0"}
                                    `}
                                title="Settings"
                            >
                                <Settings className='text-white' />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-0 left-0 h-16 w-full bg-primary z-100"></div>
            <div className={`absolute top-16 left-0 bottom-0 h-[calc(100%-4rem)] flex flex-col gap-4 w-100 z-100 p-4 bg-primary border-r border-gray-700 transition ${isPanelOpen ? "translate-x-0" : "-translate-x-100"}`}>

                {activeTab === 'materials' && (
                    <MaterialManager
                        materials={model.materials}
                        onAdd={onAddMaterial}
                        onUpdate={onUpdateMaterial}
                        onDelete={onDeleteMaterial}
                    />
                )}

                {activeTab === 'sections' && (
                    <div className="flex flex-col gap-4">
                        <FrameSectionManager
                            sections={model.frameSections}
                            materials={model.materials}
                            onAdd={onAddFrameSection}
                            onUpdate={onUpdateFrameSection}
                            onDelete={onDeleteFrameSection}
                        />
                        <ShellSectionManager
                            sections={model.shellSections}
                            materials={model.materials}
                            onAdd={onAddShellSection}
                            onUpdate={onUpdateShellSection}
                            onDelete={onDeleteShellSection}
                        />
                    </div>
                )}

                {activeTab === 'loads' && (
                    <div className="flex flex-col gap-4">
                        <LoadPatternManager
                            patterns={model.loadPatterns}
                            onAdd={onAddLoadPattern}
                            onUpdate={onUpdateLoadPattern}
                            onDelete={onDeleteLoadPattern}
                        />
                        <LoadCaseManager
                            cases={model.loadCases}
                            patterns={model.loadPatterns}
                            onAdd={onAddLoadCase}
                            onUpdate={onUpdateLoadCase}
                            onDelete={onDeleteLoadCase}
                        />
                        <LoadCombinationManager
                            combinations={model.loadCombinations}
                            cases={model.loadCases}
                            onAdd={onAddLoadCombination}
                            onUpdate={onUpdateLoadCombination}
                            onDelete={onDeleteLoadCombination}
                        />
                    </div>
                )}

                {activeTab === 'loadApp' && (
                    <LoadApplicationPanel
                        loadPatterns={model.loadPatterns}
                        pointLoads={model.pointLoads}
                        distributedFrameLoads={model.distributedFrameLoads}
                        areaLoads={model.areaLoads}
                        joints={model.joints}
                        frames={model.frames}
                        shells={model.shells}
                        onAddPointLoad={onAddPointLoad}
                        onAddDistributedLoad={onAddDistributedLoad}
                        onAddAreaLoad={onAddAreaLoad}
                        onDeletePointLoad={onDeletePointLoad}
                        onDeleteDistributedLoad={onDeleteDistributedLoad}
                        onDeleteAreaLoad={onDeleteAreaLoad}
                    />
                )}

                {activeTab === 'model' && (
                    <div className="flex flex-col gap-4">
                        {/* Tab Selector */}
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setModelTab('joints')}
                                className={`cursor-pointer flex-1 px-3 py-2 text-xs font-medium transition-colors ${modelTab === 'joints'
                                    ? 'bg-white text-gray-600 rounded-t-lg'
                                    : 'text-white hover:bg-gray-100'
                                    }`}
                            >
                                Joints
                            </button>
                            <button
                                onClick={() => setModelTab('frames')}
                                className={`cursor-pointer flex-1 px-3 py-2 text-xs font-medium transition-colors ${modelTab === 'frames'
                                    ? 'bg-white text-gray-600 rounded-t-lg'
                                    : 'text-white hover:bg-gray-100'
                                    }`}
                            >
                                Frames
                            </button>
                            <button
                                onClick={() => setModelTab('shells')}
                                className={`cursor-pointer flex-1 px-3 py-2 text-xs font-medium transition-colors ${modelTab === 'shells'
                                    ? 'bg-white text-gray-600 rounded-t-lg'
                                    : 'text-white hover:bg-gray-100'
                                    }`}
                            >
                                Shells
                            </button>
                        </div>

                        {modelTab === 'joints' && (
                            <JointTable
                                joints={model.joints}
                                onAdd={onAddJoint}
                                onUpdate={onUpdateJoint}
                                onDelete={onDeleteJoint}
                                selectedJointId={uiState.selectedJointId}
                                onSelectJoint={(id) => setUIState((prev) => ({ ...prev, selectedJointId: id }))}
                            />
                        )}

                        {modelTab === 'frames' && (
                            <FrameTable
                                frames={model.frames}
                                joints={model.joints}
                                sections={model.frameSections}
                                onDelete={onDeleteFrame}
                                selectedFrameId={uiState.selectedFrameId}
                                onSelectFrame={(id) => setUIState((prev) => ({ ...prev, selectedFrameId: id }))}
                                onToggleCreateMode={onToggleFrameCreateMode}
                                isCreating={uiState.modelingMode === 'createFrame'}
                            />
                        )}

                        {modelTab === 'shells' && (
                            <ShellTable
                                shells={model.shells}
                                joints={model.joints}
                                sections={model.shellSections}
                                onDelete={onDeleteShell}
                                selectedShellId={uiState.selectedShellId}
                                onSelectShell={(id) => setUIState((prev) => ({ ...prev, selectedShellId: id }))}
                                onToggleCreateMode={onToggleShellCreateMode}
                                isCreating={uiState.modelingMode === 'createShell'}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'results' && (
                    <ResultsPanel
                        results={analysisResults}
                        analysisResultMap={analysisResultMap}
                        activeResultId={activeResultId}
                        onSelectResult={onSelectResult}
                        joints={model.joints}
                        frames={model.frames}
                        frameSections={model.frameSections}
                        isAnalyzing={isAnalyzing}
                    />
                )}
            </div>
        </div>
    );
};
