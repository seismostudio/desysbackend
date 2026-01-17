
import React, { useState } from 'react';
import type { SolverResult } from '../../types';
import { PanelBottomClose } from 'lucide-react';

interface ResultPanelProps {
    results: SolverResult;
    stressView?: boolean;
}

const ProgressBar = ({ label, value }: { label: string, value: number }) => {
    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs font-semibold mb-1 text-gray-700">
                <span className='label-dark-theme'>{label}</span>
                <span className={value > 1.0 ? "text-red-500" : "text-green-500"}>{(value * 100).toFixed(1)}%</span>
            </div>
            {/* <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 10 }}
                    className={`h-full rounded-full ${colorClass}`}
                />
            </div> */}
        </div>
    );
};

export const ResultPanel: React.FC<ResultPanelProps> = ({ results, stressView }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const StressLegend = () => {
        return (
            <div className="py-6">
                <h3 className="text-md font-semibold text-gray-400 mb-4">
                    Stress Legend (MPa)
                </h3>
                <div className="flex flex-col gap-3">
                    <div className="h-6 w-full rounded-md border border-white"
                        style={{ background: 'linear-gradient(to right, #00ff00, #ffff00, #ff0000)' }} />
                    <div className="flex justify-between text-[10px] font-mono text-gray-400 font-bold px-1">
                        <div className="flex flex-col items-center">
                            <span>0</span>
                            <span className="text-[8px] font-normal">SAFE</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span>137.5</span>
                            <span className="text-[8px] font-normal">0.5 fy</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span>275</span>
                            <span className="text-[8px] font-normal text-red-500">YIELD</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span>400+</span>
                            <span className="text-[8px] font-normal text-red-500">LIMIT</span>
                        </div>
                    </div>
                </div>
                <p className="mt-4 text-[9px] text-gray-400 italic font-medium leading-relaxed">
                    *Analytical based on Von Mises stress distribution.
                </p>
            </div>
        );
    };

    const isSafe = results.global.isSafe;

    return (
        <div className={`fixed right-0 bottom-0 w-[300px] h-[65vh] flex flex-col overflow-hidden z-30 transition-all duration-700 ease-in-out ${isPanelOpen ? "translate-y-[0px]" : "translate-y-[calc(65vh-40px)]"}`}>
            <div className={`h-[40px] scale-y-100 flex justify-between bg-dark-theme rounded-t-lg shadow-lg items-center border-b title-dark-theme transition-all duration-500 ease-in-out overflow-hidden`}>
                Results Summary
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={`iconbutton-dark-theme`}
                    title={isPanelOpen ? "Close Panel" : "Open Panel"}
                >
                    <PanelBottomClose className={`w-5 h-5 transition-transform duration-300 ${isPanelOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            <div className={`flex-1 overflow-y-auto h-full p-4 no-scrollbar bg-dark-theme transition-all duration-500 ease-in-out`}>
                <div className="flex flex-col gap-1 border-b border-gray-500 pb-4">
                    <div className="flex justify-between items-center">
                        <h2 className={`text-md font-semibold ${isSafe ? 'text-green-700' : 'text-red-500'}`}>
                            {isSafe ? 'Passed Checks' : 'Failed Checks'}
                        </h2>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded-md border border-blue-500/30">
                            {results.designCode} {results.designCode === 'AISC360' ? `(${results.philosophy})` : ''}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="label-dark-theme text-[10px]">
                            Max Util: {(results.global.maxUtil * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                            {results.columnAnalysisEnabled ? 'FULL' : 'SIMPLE'}
                        </p>
                    </div>
                </div>

                {/* Component Progress Bars */}
                <div className="space-y-1 py-6 border-b border-gray-500 pb-4">
                    <h3 className="text-md font-semibold text-gray-400 mb-4">Component Utilization</h3>
                    <ProgressBar label="Bolt Shear" value={results.bolts.shear.utilization} />
                    <ProgressBar label="Bolt Tension" value={results.bolts.tension.utilization} />
                    <ProgressBar label="Bolt Combined" value={results.bolts.combined.utilization} />
                    {/* <div className="h-4" /> */}
                    <ProgressBar label="Plate Bearing" value={results.plate.bearing.utilization} />
                    <ProgressBar label="Plate Yielding" value={results.plate.yielding.utilization} />
                    {/* <div className="h-4" /> */}
                    <ProgressBar label="Weld Stress" value={results.welds.stress.utilization} />
                    {results.columnAnalysisEnabled && (
                        <>
                            <div className="h-4" />
                            <h3 className="text-md font-semibold text-gray-400 mb-4 border-t border-gray-700 pt-4">Column Resistance</h3>
                            <ProgressBar label="Col. Flange Bending" value={results.column.flangeBending.utilization} />
                            <ProgressBar label="Col. Web Tension" value={results.column.webTension.utilization} />
                            <ProgressBar label="Col. Web Compression" value={results.column.webCompression.utilization} />
                            <ProgressBar label="Col. Web Shear" value={results.column.webShear.utilization} />
                            <ProgressBar label="Col. Bearing" value={results.column.bearing.utilization} />
                        </>
                    )}
                </div>

                {/* Governing Mode */}
                <div className="flex flex-col gap-2 text-left border-b border-gray-500 py-6">
                    <h2 className="text-md font-semibold text-gray-400">
                        Governing Failure Mode
                    </h2>
                    <p className="label-dark-theme mb-1">
                        {results.global.governingFailure.component} - {results.global.governingFailure.mode}
                    </p>
                    {results.plate.yielding.message && (
                        <p className="text-[10px] text-blue-400 italic">
                            {results.plate.yielding.message}
                        </p>
                    )}
                    {results.column.flangeBending.message && (
                        <p className="text-[10px] text-blue-400 italic">
                            {results.column.flangeBending.message}
                        </p>
                    )}
                </div>

                {/* STRESS LEGEND - VISIBLE ONLY IN STRESS VIEW */}
                {stressView && <StressLegend />}
            </div>
        </div>
    );
};
