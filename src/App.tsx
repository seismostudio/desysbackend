import { useState, useCallback, useEffect } from 'react';
import { StructuralViewer } from './components/viewer3d/StructuralViewer';
import { MaterialManager } from './components/panels/MaterialManager';
import { FrameSectionManager } from './components/panels/FrameSectionManager';
import { ShellSectionManager } from './components/panels/ShellSectionManager';
import { LoadPatternManager } from './components/panels/LoadPatternManager';
import { LoadCaseManager } from './components/panels/LoadCaseManager';
import { LoadCombinationManager } from './components/panels/LoadCombinationManager';
import { LoadApplicationPanel } from './components/panels/LoadApplicationPanel';
import { JointTable } from './components/panels/JointTable';
import { FrameTable } from './components/panels/FrameTable';
import { ShellTable } from './components/panels/ShellTable';
import { JointModal } from './components/modals/JointModal';
import { FrameModal } from './components/modals/FrameModal';
import { ShellModal } from './components/modals/ShellModal';
import { INITIAL_TEMPLATE_MODEL } from './utils/sampleData';
import {
  DEFAULT_STRUCTURAL_MODEL,
  DEFAULT_UI_STATE,
  type StructuralModel,
  type UIState,
  type Material,
  type FrameSection,
  type ShellSection,
  type LoadPattern,
  type LoadCase,
  type LoadCombination,
  type Joint,
  type Frame,
  type Shell,
  type PointLoad,
  type DistributedFrameLoad,
  type AreaLoad,
} from './types/structuralTypes';
import { Book, Play } from 'lucide-react';
import { analyzeStructure } from './utils/feaSolver';
import { ResultsPanel } from './components/panels/ResultsPanel';
import { DisplacementLegendPanel } from './components/panels/DisplacementLegendPanel';
import type { AnalysisResults } from './types/structuralTypes';

function App() {
  const [model, setModel] = useState<StructuralModel>(INITIAL_TEMPLATE_MODEL);
  const [uiState, setUIState] = useState<UIState>(DEFAULT_UI_STATE);
  const [activeTab, setActiveTab] = useState<'materials' | 'sections' | 'loads' | 'loadApp' | 'model' | 'results'>('materials');
  const [modelTab, setModelTab] = useState<'joints' | 'frames' | 'shells'>('joints');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLoadCase, setSelectedLoadCase] = useState<string>('');

  // Visualization state
  const [showDeformation, setShowDeformation] = useState(false);
  const [deformationScale, setDeformationScale] = useState(10);
  const [showLoads, setShowLoads] = useState(false);
  const [loadFilterType, setLoadFilterType] = useState<'all' | 'point' | 'distributed' | 'area'>('all');
  const [loadFilterPattern, setLoadFilterPattern] = useState<string>('all');

  // Material handlers
  const addMaterial = (material: Material) => {
    setModel((prev) => ({ ...prev, materials: [...prev.materials, material] }));
  };

  const updateMaterial = (id: string, material: Material) => {
    setModel((prev) => ({
      ...prev,
      materials: prev.materials.map((m) => (m.id === id ? material : m)),
    }));
  };

  const deleteMaterial = (id: string) => {
    setModel((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
    }));
  };

  // Frame Section Handlers
  const addFrameSection = (section: FrameSection) => {
    setModel((prev) => ({ ...prev, frameSections: [...prev.frameSections, section] }));
  };

  const updateFrameSection = (id: string, section: FrameSection) => {
    setModel((prev) => ({
      ...prev,
      frameSections: prev.frameSections.map((s) => (s.id === id ? section : s)),
    }));
  };

  const deleteFrameSection = (id: string) => {
    setModel((prev) => ({
      ...prev,
      frameSections: prev.frameSections.filter((s) => s.id !== id),
    }));
  };

  // Shell Section Handlers
  const addShellSection = (section: ShellSection) => {
    setModel((prev) => ({ ...prev, shellSections: [...prev.shellSections, section] }));
  };

  const updateShellSection = (id: string, section: ShellSection) => {
    setModel((prev) => ({
      ...prev,
      shellSections: prev.shellSections.map((s) => (s.id === id ? section : s)),
    }));
  };

  const deleteShellSection = (id: string) => {
    setModel((prev) => ({
      ...prev,
      shellSections: prev.shellSections.filter((s) => s.id !== id),
    }));
  };

  // Load Pattern Handlers
  const addLoadPattern = (pattern: LoadPattern) => {
    setModel((prev) => ({ ...prev, loadPatterns: [...prev.loadPatterns, pattern] }));
  };

  const updateLoadPattern = (id: string, pattern: LoadPattern) => {
    setModel((prev) => ({
      ...prev,
      loadPatterns: prev.loadPatterns.map((p) => (p.id === id ? pattern : p)),
    }));
  };

  const deleteLoadPattern = (id: string) => {
    setModel((prev) => ({
      ...prev,
      loadPatterns: prev.loadPatterns.filter((p) => p.id !== id),
    }));
  };

  // Load Case Handlers
  const addLoadCase = (loadCase: LoadCase) => {
    setModel((prev) => ({ ...prev, loadCases: [...prev.loadCases, loadCase] }));
  };

  const updateLoadCase = (id: string, loadCase: LoadCase) => {
    setModel((prev) => ({
      ...prev,
      loadCases: prev.loadCases.map((lc) => (lc.id === id ? loadCase : lc)),
    }));
  };

  const deleteLoadCase = (id: string) => {
    setModel((prev) => ({
      ...prev,
      loadCases: prev.loadCases.filter((lc) => lc.id !== id),
    }));
  };

  // Load Combination Handlers
  const addLoadCombination = (combination: LoadCombination) => {
    setModel((prev) => ({ ...prev, loadCombinations: [...prev.loadCombinations, combination] }));
  };

  const updateLoadCombination = (id: string, combination: LoadCombination) => {
    setModel((prev) => ({
      ...prev,
      loadCombinations: prev.loadCombinations.map((lc) => (lc.id === id ? combination : lc)),
    }));
  };

  const deleteLoadCombination = (id: string) => {
    setModel((prev) => ({
      ...prev,
      loadCombinations: prev.loadCombinations.filter((c) => c.id !== id),
    }));
  };

  // Load application handlers
  const addPointLoad = (load: PointLoad) => {
    setModel((prev) => ({ ...prev, pointLoads: [...prev.pointLoads, load] }));
  };

  const deletePointLoad = (id: string) => {
    setModel((prev) => ({ ...prev, pointLoads: prev.pointLoads.filter((l) => l.id !== id) }));
  };

  const addDistributedLoad = (load: DistributedFrameLoad) => {
    setModel((prev) => ({ ...prev, distributedFrameLoads: [...prev.distributedFrameLoads, load] }));
  };

  const deleteDistributedLoad = (id: string) => {
    setModel((prev) => ({ ...prev, distributedFrameLoads: prev.distributedFrameLoads.filter((l) => l.id !== id) }));
  };

  const addAreaLoad = (load: AreaLoad) => {
    setModel((prev) => ({ ...prev, areaLoads: [...prev.areaLoads, load] }));
  };

  const deleteAreaLoad = (id: string) => {
    setModel((prev) => ({ ...prev, areaLoads: prev.areaLoads.filter((l) => l.id !== id) }));
  };

  // Analysis handler
  const runAnalysis = async () => {
    if (!selectedLoadCase) {
      alert('Please select a load case first');
      return;
    }

    setIsAnalyzing(true);
    setActiveTab('results');

    // Run analysis in a timeout to allow UI to update
    setTimeout(() => {
      try {
        const results = analyzeStructure(model, selectedLoadCase);
        setAnalysisResults(results);
      } catch (error) {
        console.error('Analysis error:', error);
        setAnalysisResults(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 100);
  };

  // Joint Handlers
  const addJoint = (joint: Joint) => {
    setModel((prev) => ({ ...prev, joints: [...prev.joints, joint] }));
  };

  const updateJoint = (id: number, joint: Joint) => {
    setModel((prev) => ({
      ...prev,
      joints: prev.joints.map((j) => (j.id === id ? joint : j)),
    }));
  };

  const deleteJoint = (id: number) => {
    setModel((prev) => ({
      ...prev,
      joints: prev.joints.filter((j) => j.id !== id),
      frames: prev.frames.filter((f) => f.jointI !== id && f.jointJ !== id),
      shells: prev.shells.filter((s) => !s.jointIds.includes(id)),
    }));
  };

  // Frame Handlers
  const updateFrame = (id: number, frame: Frame) => {
    setModel((prev) => ({
      ...prev,
      frames: prev.frames.map((f) => (f.id === id ? frame : f)),
    }));
  };

  const deleteFrame = (id: number) => {
    setModel((prev) => ({
      ...prev,
      frames: prev.frames.filter((f) => f.id !== id),
    }));
  };

  const toggleFrameCreateMode = () => {
    setUIState((prev) => ({
      ...prev,
      modelingMode: prev.modelingMode === 'createFrame' ? 'normal' : 'createFrame',
      tempFrameStartJoint: null,
    }));
  };

  // Shell Handlers
  const updateShell = (id: number, shell: Shell) => {
    setModel((prev) => ({
      ...prev,
      shells: prev.shells.map((s) => (s.id === id ? shell : s)),
    }));
  };

  const deleteShell = (id: number) => {
    setModel((prev) => ({
      ...prev,
      shells: prev.shells.filter((s) => s.id !== id),
    }));
  };

  const toggleShellCreateMode = () => {
    setUIState((prev) => ({
      ...prev,
      modelingMode: prev.modelingMode === 'createShell' ? 'normal' : 'createShell',
      tempShellJoints: [],
    }));
  };

  // Joint click handler for creating frames/shells
  const handleJointClick = useCallback(
    (jointId: number, isDoubleClick?: boolean) => {
      if (uiState.modelingMode === 'createFrame') {
        if (uiState.tempFrameStartJoint === null) {
          // First joint selected
          setUIState((prev) => ({ ...prev, tempFrameStartJoint: jointId }));
        } else {
          // Second joint selected - create frame
          const nextId = model.frames.length > 0 ? Math.max(...model.frames.map((f) => f.id)) + 1 : 1;
          const newFrame: Frame = {
            id: nextId,
            jointI: uiState.tempFrameStartJoint,
            jointJ: jointId,
            orientation: 0,
            offsetY: 0,
            offsetZ: 0,
          };
          setModel((prev) => ({ ...prev, frames: [...prev.frames, newFrame] }));
          setUIState((prev) => ({
            ...prev,
            tempFrameStartJoint: null,
            modelingMode: 'normal',
            selectedFrameId: nextId,
            showFrameModal: true
          }));
        }
      } else if (uiState.modelingMode === 'createShell') {
        // Add joint to temp shell
        setUIState((prev) => ({
          ...prev,
          tempShellJoints: [...prev.tempShellJoints, jointId],
        }));
      } else {
        // Normal mode - just select
        setUIState((prev) => ({
          ...prev,
          selectedJointId: jointId,
          showJointModal: isDoubleClick || (prev.selectedJointId === jointId && !prev.showJointModal)
        }));
      }
    },
    [uiState.modelingMode, uiState.tempFrameStartJoint, model.frames, uiState.selectedJointId, uiState.showJointModal]
  );

  const handleFrameClick = (frameId: number, isDoubleClick?: boolean) => {
    setUIState((prev) => ({
      ...prev,
      selectedFrameId: frameId,
      showFrameModal: isDoubleClick || (prev.selectedFrameId === frameId ? true : prev.showFrameModal)
    }));
  };

  const handleShellClick = (shellId: number, isDoubleClick?: boolean) => {
    setUIState((prev) => ({
      ...prev,
      selectedShellId: shellId,
      showShellModal: isDoubleClick || (prev.selectedShellId === shellId ? true : prev.showShellModal)
    }));
  };

  // Handle Enter key for shell creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && uiState.modelingMode === 'createShell' && uiState.tempShellJoints.length >= 3) {
        const nextId = model.shells.length > 0 ? Math.max(...model.shells.map((s) => s.id)) + 1 : 1;
        const newShell: Shell = {
          id: nextId,
          jointIds: uiState.tempShellJoints,
          offsetZ: 0,
        };
        setModel((prev) => ({ ...prev, shells: [...prev.shells, newShell] }));
        setUIState((prev) => ({ ...prev, tempShellJoints: [], modelingMode: 'normal' }));

        // Show shell modal for new shell
        setUIState(prev => ({ ...prev, selectedShellId: nextId, showShellModal: true }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiState.modelingMode, uiState.tempShellJoints, model.shells]);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-100 text-gray-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-[60px] bg-gray-900 flex items-center px-6 shadow-md z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 rounded-md flex items-center justify-center text-white text-4xl font-bold">
            <img src="/Logo.png" alt="Logo" className="w-10 h-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">DESD</h1>
            <span className="text-xs text-gray-400">
              3D Structural Analysis | by{' '}
              <a href="https://daharengineer.com" target="_blank" rel="noopener noreferrer">
                Dahar Engineer
              </a>
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <a
            href="https://docs.daharengineer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-all text-xs font-medium"
          >
            <Book className="text-white w-4 h-4" />
            Docs
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[400px] bg-white border-r overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex gap-1 border-b pb-2">
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'materials' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={` px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'sections' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('loads')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'loads' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Load Def.
            </button>
            <button
              onClick={() => setActiveTab('loadApp')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'loadApp' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Load App.
            </button>
            <button
              onClick={() => setActiveTab('model')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'model' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Model
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeTab === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Results
            </button>
          </div>

          {activeTab === 'materials' && (
            <MaterialManager
              materials={model.materials}
              onAdd={addMaterial}
              onUpdate={updateMaterial}
              onDelete={deleteMaterial}
            />
          )}

          {activeTab === 'sections' && (
            <div className="flex flex-col gap-4">
              <FrameSectionManager
                sections={model.frameSections}
                materials={model.materials}
                onAdd={addFrameSection}
                onUpdate={updateFrameSection}
                onDelete={deleteFrameSection}
              />
              <ShellSectionManager
                sections={model.shellSections}
                materials={model.materials}
                onAdd={addShellSection}
                onUpdate={updateShellSection}
                onDelete={deleteShellSection}
              />
            </div>
          )}

          {activeTab === 'loads' && (
            <div className="flex flex-col gap-4">
              <LoadPatternManager
                patterns={model.loadPatterns}
                onAdd={addLoadPattern}
                onUpdate={updateLoadPattern}
                onDelete={deleteLoadPattern}
              />
              <LoadCaseManager
                cases={model.loadCases}
                patterns={model.loadPatterns}
                onAdd={addLoadCase}
                onUpdate={updateLoadCase}
                onDelete={deleteLoadCase}
              />
              <LoadCombinationManager
                combinations={model.loadCombinations}
                cases={model.loadCases}
                onAdd={addLoadCombination}
                onUpdate={updateLoadCombination}
                onDelete={deleteLoadCombination}
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
              onAddPointLoad={addPointLoad}
              onAddDistributedLoad={addDistributedLoad}
              onAddAreaLoad={addAreaLoad}
              onDeletePointLoad={deletePointLoad}
              onDeleteDistributedLoad={deleteDistributedLoad}
              onDeleteAreaLoad={deleteAreaLoad}
            />
          )}

          {activeTab === 'model' && (
            <div className="flex flex-col gap-4">
              <div className="flex gap-1 border-b pb-2">
                <button
                  onClick={() => setModelTab('joints')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${modelTab === 'joints' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Joints
                </button>
                <button
                  onClick={() => setModelTab('frames')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${modelTab === 'frames' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Frames
                </button>
                <button
                  onClick={() => setModelTab('shells')}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${modelTab === 'shells' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Shells
                </button>
              </div>

              {modelTab === 'joints' && (
                <JointTable
                  joints={model.joints}
                  onAdd={addJoint}
                  onUpdate={updateJoint}
                  onDelete={deleteJoint}
                  selectedJointId={uiState.selectedJointId}
                  onSelectJoint={(id) => setUIState((prev) => ({ ...prev, selectedJointId: id }))}
                />
              )}

              {modelTab === 'frames' && (
                <FrameTable
                  frames={model.frames}
                  joints={model.joints}
                  sections={model.frameSections}
                  onDelete={deleteFrame}
                  selectedFrameId={uiState.selectedFrameId}
                  onSelectFrame={(id) => setUIState((prev) => ({ ...prev, selectedFrameId: id }))}
                  onToggleCreateMode={toggleFrameCreateMode}
                  isCreating={uiState.modelingMode === 'createFrame'}
                />
              )}

              {modelTab === 'shells' && (
                <ShellTable
                  shells={model.shells}
                  joints={model.joints}
                  sections={model.shellSections}
                  onDelete={deleteShell}
                  selectedShellId={uiState.selectedShellId}
                  onSelectShell={(id) => setUIState((prev) => ({ ...prev, selectedShellId: id }))}
                  onToggleCreateMode={toggleShellCreateMode}
                  isCreating={uiState.modelingMode === 'createShell'}
                />
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <ResultsPanel
              results={analysisResults}
              joints={model.joints}
              isAnalyzing={isAnalyzing}
            />
          )}
        </div>

        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <StructuralViewer
            joints={model.joints}
            frames={model.frames}
            shells={model.shells}
            frameSections={model.frameSections}
            shellSections={model.shellSections}
            modelingMode={uiState.modelingMode}
            tempFrameStartJoint={uiState.tempFrameStartJoint}
            tempShellJoints={uiState.tempShellJoints}
            extrudeMode={uiState.extrudeMode}
            onJointClick={handleJointClick}
            onFrameClick={handleFrameClick}
            onShellClick={handleShellClick}
            cursorPosition={null}
            selectedJointId={uiState.selectedJointId}
            selectedFrameId={uiState.selectedFrameId}
            selectedShellId={uiState.selectedShellId}
            analysisResults={analysisResults}
            showDeformation={showDeformation}
            deformationScale={deformationScale}
            showLoads={showLoads}
            loadFilterType={loadFilterType}
            loadFilterPattern={loadFilterPattern}
            pointLoads={model.pointLoads}
            distributedLoads={model.distributedFrameLoads}
            areaLoads={model.areaLoads}
            loadPatterns={model.loadPatterns}
          />

          {/* Viewport Controls */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-xl border text-xs">
            <div className="font-bold mb-2 uppercase tracking-wider">Analysis</div>

            {/* Load Case Selector */}
            <div className="mb-3">
              <label className="text-[10px] text-gray-600 block mb-1">Load Case</label>
              <select
                value={selectedLoadCase}
                onChange={(e) => setSelectedLoadCase(e.target.value)}
                className="w-full px-2 py-1 border rounded text-[10px] bg-white"
              >
                <option value="">Select...</option>
                {model.loadCases.map((lc) => (
                  <option key={lc.id} value={lc.id}>
                    {lc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Run Analysis Button */}
            <button
              onClick={runAnalysis}
              disabled={!selectedLoadCase || isAnalyzing}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors mb-3"
            >
              <Play className="w-3 h-3" />
              {isAnalyzing ? 'Running...' : 'Run Analysis'}
            </button>

            <div className="font-bold mb-2 uppercase tracking-wider border-t pt-2">Visualization</div>

            {/* Deformation Visualization */}
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-gray-600">Deformation</span>
                <button
                  onClick={() => setShowDeformation(!showDeformation)}
                  disabled={!analysisResults}
                  className={`w-12 h-6 rounded-full relative transition-all ${showDeformation ? 'bg-blue-600' : 'bg-gray-300'} disabled:opacity-50`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${showDeformation ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {showDeformation && (
                <div>
                  <label className="text-[10px] text-gray-600 block mb-1">Scale: {deformationScale}x</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={deformationScale}
                    onChange={(e) => setDeformationScale(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Load Visualization */}
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-gray-600">Show Loads</span>
                <button
                  onClick={() => setShowLoads(!showLoads)}
                  className={`w-12 h-6 rounded-full relative transition-all ${showLoads ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${showLoads ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {showLoads && (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Type</label>
                    <select
                      value={loadFilterType}
                      onChange={(e) => setLoadFilterType(e.target.value as any)}
                      className="w-full px-2 py-1 border rounded text-[10px] bg-white"
                    >
                      <option value="all">All</option>
                      <option value="point">Point</option>
                      <option value="distributed">Distributed</option>
                      <option value="area">Area</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-600 block mb-1">Pattern</label>
                    <select
                      value={loadFilterPattern}
                      onChange={(e) => setLoadFilterPattern(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-[10px] bg-white"
                    >
                      <option value="all">All</option>
                      {model.loadPatterns.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="font-bold mb-2 uppercase tracking-wider border-t pt-2">Viewport</div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-gray-600">Extrude Mode</span>
              <button
                onClick={() => setUIState((prev) => ({ ...prev, extrudeMode: !prev.extrudeMode }))}
                className={`w-12 h-6 rounded-full relative transition-all ${uiState.extrudeMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all ${uiState.extrudeMode ? 'left-7' : 'left-1'
                    }`}
                />
              </button>
            </div>
            <div className="text-[10px] text-gray-500 space-y-1">
              <div>• Joints: {model.joints.length}</div>
              <div>• Frames: {model.frames.length}</div>
              <div>• Shells: {model.shells.length}</div>
            </div>
          </div>

          {/* Displacement Legend Panel */}
          <DisplacementLegendPanel
            results={analysisResults}
            show={showDeformation}
          />
        </div>
      </div>

      {/* Modals */}
      {uiState.showJointModal && uiState.selectedJointId && (
        <JointModal
          joint={model.joints.find(j => j.id === uiState.selectedJointId)!}
          onUpdate={updateJoint}
          onDelete={deleteJoint}
          onClose={() => setUIState(prev => ({ ...prev, showJointModal: false }))}
        />
      )}

      {uiState.showFrameModal && uiState.selectedFrameId && (
        <FrameModal
          frame={model.frames.find(f => f.id === uiState.selectedFrameId)!}
          joints={model.joints}
          sections={model.frameSections}
          onUpdate={updateFrame}
          onDelete={deleteFrame}
          onClose={() => setUIState(prev => ({ ...prev, showFrameModal: false }))}
        />
      )}

      {uiState.showShellModal && uiState.selectedShellId && (
        <ShellModal
          shell={model.shells.find(s => s.id === uiState.selectedShellId)!}
          joints={model.joints}
          sections={model.shellSections}
          onUpdate={updateShell}
          onDelete={deleteShell}
          onClose={() => setUIState(prev => ({ ...prev, showShellModal: false }))}
        />
      )}
    </div>
  );
}

export default App;
