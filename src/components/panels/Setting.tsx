// import React from 'react';
// import { X, RotateCcw } from 'lucide-react';
// import type { ConnectionConfig } from '../../types';

// interface SettingProps {
//     config: ConnectionConfig;
//     updateConfig: (section: keyof ConnectionConfig, key: string, value: any) => void;
//     onClose: () => void;
// }

// const SectionTitle = ({ children }: { children: React.ReactNode }) => (
//     <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-6 mb-3 flex items-center gap-2">
//         <div className="w-1 h-4 bg-blue-500 rounded-full" />
//         {children}
//     </h3>
// );

// const SettingInput = ({ label, value, onChange, unit }: { label: string, value: any, onChange: (v: any) => void, unit?: string }) => (
//     <div className="flex flex-col gap-1">
//         <label className="label-dark-theme">{label}</label>
//         <div className="relative">
//             <input
//                 type={typeof value === 'number' ? 'number' : 'text'}
//                 value={value}
//                 onChange={(e) => onChange(typeof value === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
//                 className="input-dark-theme text-xs"
//             />
//             {unit && <span className="absolute right-2 top-1.5 text-[10px] text-gray-500">{unit}</span>}
//         </div>
//     </div>
// );

// const SettingToggle = ({ label, enabled, onToggle }: { label: string, enabled: boolean, onToggle: () => void }) => (
//     <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/30 transition-colors">
//         <span className="label-dark-theme">{label}</span>
//         <button
//             onClick={onToggle}
//             className={`w-10 h-5 rounded-full relative transition-all duration-200 ${enabled ? 'bg-blue-600' : 'bg-gray-600'}`}
//         >
//             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${enabled ? 'left-6' : 'left-1'}`} />
//         </button>
//     </div>
// );

// export const Setting: React.FC<SettingProps> = ({ config, updateConfig, onClose }) => {
//     const s = config.settings;

//     const updateMaterial = (part: keyof typeof s.materials, key: string, value: any) => {
//         const newMaterials = { ...s.materials, [part]: { ...s.materials[part], [key]: value } };
//         updateConfig('settings', 'materials', newMaterials);
//     };

//     const updateCalc = (key: string, value: any) => {
//         updateConfig('settings', 'calculation', { ...s.calculation, [key]: value });
//     };

//     const updateVis = (key: string, value: any) => {
//         updateConfig('settings', 'visualization', { ...s.visualization, [key]: value });
//     };

//     return (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//             {/* Backdrop */}
//             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

//             {/* Modal Content */}
//             <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
//                 {/* Header */}
//                 <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900/50">
//                     <div className="flex items-center gap-3">
//                         <h2 className="text-xl font-bold text-white">Settings</h2>
//                     </div>
//                     <button onClick={onClose} className="iconbutton-dark-theme hover:bg-gray-700 rounded-full transition-colors">
//                         <X className="w-6 h-6" />
//                     </button>
//                 </div>

//                 {/* Body */}
//                 <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//                         {/* Material Section */}
//                         <div className="space-y-6">
//                             <div>
//                                 <SectionTitle>Member Materials (S275/S355)</SectionTitle>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <SettingInput label="E (Elasticity)" value={s.materials.member.E} onChange={(v) => updateMaterial('member', 'E', v)} unit="MPa" />
//                                     <SettingInput label="fy (Yield)" value={s.materials.member.fy} onChange={(v) => updateMaterial('member', 'fy', v)} unit="MPa" />
//                                     <SettingInput label="fu (Ultimate)" value={s.materials.member.fu} onChange={(v) => updateMaterial('member', 'fu', v)} unit="MPa" />
//                                 </div>
//                             </div>

//                             <div>
//                                 <SectionTitle>Plate Materials</SectionTitle>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <SettingInput label="fy (Yield)" value={s.materials.plate.fy} onChange={(v) => updateMaterial('plate', 'fy', v)} unit="MPa" />
//                                     <SettingInput label="fu (Ultimate)" value={s.materials.plate.fu} onChange={(v) => updateMaterial('plate', 'fu', v)} unit="MPa" />
//                                 </div>
//                             </div>

//                             <div>
//                                 <SectionTitle>Fasteners & Welds</SectionTitle>
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <SettingInput label="Bolt fub" value={s.materials.bolt.fub} onChange={(v) => updateConfig('settings', 'materials', { ...s.materials, bolt: { fub: v } })} unit="MPa" />
//                                     <SettingInput label="Weld fu" value={s.materials.weld.fu} onChange={(v) => updateConfig('settings', 'materials', { ...s.materials, weld: { fu: v } })} unit="MPa" />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Config & Analysis Section */}
//                         <div className="space-y-6">
//                             <div>
//                                 <SectionTitle>Calculation Methods</SectionTitle>
//                                 <div className="space-y-4">
//                                     <div className="grid grid-cols-2 gap-4">
//                                         <div className="flex flex-col gap-1">
//                                             <label className="label-dark-theme">Design Code</label>
//                                             <select
//                                                 value={s.calculation.code}
//                                                 onChange={(e) => updateCalc('code', e.target.value)}
//                                                 className="input-dark-theme text-xs py-2"
//                                             >
//                                                 <option value="EC3">Eurocode 3 (EC3)</option>
//                                                 <option value="AISC360">AISC 360</option>
//                                             </select>
//                                         </div>
//                                         {s.calculation.code === 'AISC360' && (
//                                             <div className="flex flex-col gap-1">
//                                                 <label className="label-dark-theme">Philosophy</label>
//                                                 <select
//                                                     value={s.calculation.philosophy}
//                                                     onChange={(e) => updateCalc('philosophy', e.target.value)}
//                                                     className="input-dark-theme text-xs py-2 font-bold text-blue-400"
//                                                 >
//                                                     <option value="LRFD">LRFD (Phi)</option>
//                                                     <option value="ASD">ASD (Omega)</option>
//                                                 </select>
//                                             </div>
//                                         )}
//                                     </div>

//                                     <div className="flex flex-col gap-1">
//                                         <label className="label-dark-theme">Stress Distribution</label>
//                                         <select
//                                             value={s.calculation.stressDistribution}
//                                             onChange={(e) => updateCalc('stressDistribution', e.target.value)}
//                                             className="input-dark-theme text-xs py-2"
//                                         >
//                                             <option value="linear">Elastic (Linear)</option>
//                                             <option value="plastic">Plastic (Rigid-Plastic)</option>
//                                             <option value="uniform">Uniform (Smeared)</option>
//                                         </select>
//                                     </div>

//                                     {s.calculation.code === 'EC3' ? (
//                                         <div className="grid grid-cols-2 gap-4">
//                                             <SettingInput label="Gamma M0" value={s.calculation.gammaM0} onChange={(v) => updateCalc('gammaM0', v)} />
//                                             <SettingInput label="Gamma M2" value={s.calculation.gammaM2} onChange={(v) => updateCalc('gammaM2', v)} />
//                                         </div>
//                                     ) : (
//                                         <div className="grid grid-cols-2 gap-4 p-2 bg-blue-900/10 rounded-lg border border-blue-900/20">
//                                             {s.calculation.philosophy === 'LRFD' ? (
//                                                 <SettingInput label="Default Phi (φ)" value={s.calculation.phiOverride || 0.9} onChange={(v) => updateCalc('phiOverride', v)} />
//                                             ) : (
//                                                 <SettingInput label="Default Omega (Ω)" value={s.calculation.omegaOverride || 1.67} onChange={(v) => updateCalc('omegaOverride', v)} />
//                                             )}
//                                         </div>
//                                     )}

//                                     <div className="pt-2 border-t border-gray-700/50">
//                                         <SettingToggle
//                                             label="Check Column Resistance"
//                                             enabled={s.calculation.checkColumnResistance}
//                                             onToggle={() => updateCalc('checkColumnResistance', !s.calculation.checkColumnResistance)}
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Visualization Section */}
//                         <div className="space-y-6">
//                             <div>
//                                 <SectionTitle>Visualization</SectionTitle>
//                                 <div className="space-y-2 bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
//                                     <SettingToggle label="Show Reference Grid" enabled={s.visualization.showGrid} onToggle={() => updateVis('showGrid', !s.visualization.showGrid)} />
//                                     <SettingToggle label="Show Dimension Labels" enabled={s.visualization.showLabels} onToggle={() => updateVis('showLabels', !s.visualization.showLabels)} />
//                                     <SettingToggle label="Show Load Arrows" enabled={s.visualization.showLoads} onToggle={() => updateVis('showLoads', !s.visualization.showLoads)} />
//                                     <div className="px-2 pt-2">
//                                         <label className="label-dark-theme mb-2 block">Opacity: {Math.round(s.visualization.opacity * 100)}%</label>
//                                         <input
//                                             type="range" min="0" max="1" step="0.1"
//                                             value={s.visualization.opacity}
//                                             onChange={(e) => updateVis('opacity', parseFloat(e.target.value))}
//                                             className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="p-4 border-t border-gray-700 flex items-center justify-between bg-gray-900/50">
//                     <p className="text-[10px] text-gray-500 italic">
//                         Changes are applied in real-time to all calculations and viewers.
//                     </p>
//                     <button
//                         onClick={onClose}
//                         className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center gap-2"
//                     >
//                         <RotateCcw className="w-4 h-4" />
//                         Done & Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };
