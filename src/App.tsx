import { useState, useMemo } from 'react';
import { DEFAULT_CONFIG, type ConnectionConfig, type AnalysisResult } from './types';
import { solveConnection } from './solver/connectionSolver';
import { runAnalysis } from './solver/fea/feaEngine';
import { ConnectionViewer } from './components/viewer3d/ConnectionViewer';
import { InputPanel } from './components/panels/InputPanel';
import { ResultPanel } from './components/panels/ResultPanel';
import { Setting } from './components/panels/Setting';
import { Book } from 'lucide-react';

function App() {
  const [config, setConfig] = useState<ConnectionConfig>(DEFAULT_CONFIG);
  const [stressView, setStressView] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Real-time calculation (standard checks)
  const results = useMemo(() => solveConnection(config), [config]);

  // Handler for deep updates - also invalidates analysis
  const updateConfig = (section: keyof ConnectionConfig, key: string, value: any) => {
    setAnalysisResult(null); // Invalidate FEA on any change
    setConfig(prev => {
      const currentSection = prev[section];
      if (typeof currentSection === 'object' && currentSection !== null && key !== '') {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [key]: value
          }
        };
      }
      return {
        ...prev,
        [section]: value
      };
    });
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await runAnalysis(config);
      setAnalysisResult(res);
      setStressView(true); // Automatically switch to stress view
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-eng-bg text-eng-dark overflow-hidden font-sans">
      {/* Header */}
      <header className="h-[60px] bg-dark-theme flex items-center px-6 shadow-md z-20 shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="bg-gray-800 rounded-md flex items-center justify-center text-white text-4xl font-bold">
            <img src="/Logo.png" alt="Logo" className="w-10 h-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">DEConnect</h1>
            <span className="text-xs text-gray-400">v 0.3.0 | by <a href="https://daharengineer.com" target="_blank" rel="noopener noreferrer">Dahar Engineer</a></span>
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
      <div className="fixed top-[60px] left-0 right-0 flex-1 flex overflow-hidden">

        {/* Left Panel: Inputs */}
        <InputPanel
          config={config}
          updateConfig={updateConfig}
          onRunAnalysis={handleRunAnalysis}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Center Panel: 3D */}
        <div className="fixed top-[60px] left-0 right-0 h-[calc(100vh-60px)] bg-gradient-to-br from-gray-100 to-gray-200">
          <ConnectionViewer
            config={config}
            results={results}
            stressView={stressView}
            analysisResult={analysisResult}
          />

          {/* Overlay Controls */}
          <div className="fixed top-[70px] right-4 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur p-4 rounded-xl text-xs shadow-xl border border-white/50 text-gray-600 min-w-[200px]">
              <div className="font-black mb-3 font-mono uppercase tracking-widest border-b pb-2 flex justify-between items-center">
                <span>Viewport</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col text-gray-500">
                    <span className="font-semibold text-gray-700 uppercase tracking-tighter">Stress View</span>
                    {isAnalyzing ? 'Solving Stiffness Matrix...' : 'Run Analysis First'}
                  </div>
                  <button
                    disabled={!analysisResult}
                    onClick={() => setStressView(!stressView)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-inner ${stressView ? 'bg-blue-600' : 'bg-gray-300'} ${!analysisResult ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${stressView ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="font-bold mb-2 text-gray-400 uppercase tracking-widest text-[10px]">Navigation</div>
                <div className="grid grid-cols-2 gap-2 text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px]">Left: Rotate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px]">Right: Pan</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="text-[10px]">Scroll: Zoom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Results */}
        <ResultPanel results={results} stressView={stressView} />

        {/* Settings Modal */}
        {showSettings && (
          <Setting
            config={config}
            updateConfig={updateConfig}
            onClose={() => setShowSettings(false)}
          />
        )}

      </div>
    </div>
  )
}

export default App
