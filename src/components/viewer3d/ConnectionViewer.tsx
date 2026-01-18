import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid } from '@react-three/drei';
import { SteelMember } from './SteelMember';
import { SteelPlate } from './SteelPlate';
import { BoltGroup } from './BoltGroup';
import { FlangeHaunchedWeld, FlangeWeld, WebHaunchedWeld, WebWeld } from './Weld';
import { FEAMesh } from './FEAMesh';
import { SteelHaunch } from './SteelHaunch';
import { LoadVisualization } from './LoadVisualization';
import type { ConnectionViewerProps, FEAMeshData } from '../../types';

const SceneContent: React.FC<ConnectionViewerProps> = ({ config, results, stressView, analysisResult }) => {
    const showFEA = stressView && analysisResult && analysisResult.isValid;
    const isWeakAxis = config.columnRotation === 90;
    const colOffsetToFace = isWeakAxis ? config.column.webThickness / 2 : config.column.depth / 2;
    const tp = config.plate.thickness;

    // Plate height logic: extend if haunch exists
    const plateH = config.haunch.enabled ? config.plate.height + config.haunch.depth : config.plate.height;
    // Plate Y offset: if extended, it still starts from top, so we shift center down
    const plateYOffset = config.haunch.enabled ? -config.haunch.depth / 2 : 0;

    let OffsetBolts = 0;
    if (config.column.flangeThickness > tp) {
        OffsetBolts = -((config.column.flangeThickness - tp) / 2);
    } else {
        OffsetBolts = ((tp - config.column.flangeThickness) / 2);
    }
    const offsetBolts = OffsetBolts;

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[1000, 1000, 1000]} intensity={1} castShadow />
            <spotLight position={[-1000, 1000, 1000]} angle={0.15} penumbra={1} intensity={1} castShadow />

            <Environment preset="city" />

            {showFEA ? (
                <group>
                    {analysisResult?.meshes.map((mesh: FEAMeshData, i: number) => {
                        let pos: [number, number, number] = [0, 0, 0];
                        let rot: [number, number, number] = [0, 0, 0];

                        if (mesh.componentId === 'plate') {
                            pos = [tp / 2, plateYOffset, 0];
                        } else if (mesh.componentId === 'beam') {
                            pos = [tp, 0, 0];
                            rot = [0, Math.PI / 2, 0];
                        } else if (mesh.componentId === 'column') {
                            pos = [-colOffsetToFace, -1000, 0];
                            rot = [-Math.PI / 2, 0, isWeakAxis ? 0 : Math.PI / 2]; // Grow UP
                        } else if (mesh.componentId === 'haunch') {
                            pos = [tp, -config.beam.depth / 2, 0];
                            rot = [0, Math.PI / 2, 0];
                        }

                        return <FEAMesh key={i} data={mesh} stressView={stressView} position={pos} rotation={rot} />;
                    })}
                </group>
            ) : (
                <group>
                    {/* Beam (along +X axis) */}
                    <SteelMember
                        dimensions={config.beam}
                        length={1000}
                        position={[tp, 0, 0]}
                        rotation={[0, Math.PI / 2, 0]}
                    />

                    {/* Column (vertical Y, starts at -1000, grows UP to +1000) */}
                    <SteelMember
                        dimensions={config.column}
                        length={2000}
                        position={[-colOffsetToFace, -1000, 0]}
                        rotation={[-Math.PI / 2, 0, isWeakAxis ? 0 : Math.PI / 2]}
                        color="#718096"
                    />

                    {/* Flange Weld (along +X axis) */}
                    <FlangeWeld
                        config={config}
                        dimensions={config.beam}
                        position={[tp, 0, -config.beam.width / 2]}
                        rotation={[0, 0, Math.PI / 2]}
                        color="#537be8"
                    />
                    {/* Web Weld (along +X axis) */}
                    <WebWeld
                        config={config}
                        dimensions={config.beam}
                        position={[tp, config.beam.depth / 2 - config.beam.flangeThickness, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                        color="#537be8"
                    />

                    {config.haunch.enabled && (
                        <>
                            {/* Web Haunched Weld (along +X axis) */}
                            <WebHaunchedWeld
                                config={config}
                                dimensions={config.beam}
                                haunchedConfig={config.haunch}
                                position={[tp, -config.beam.depth / 2, 0]}
                                rotation={[Math.PI / 2, 0, 0]}
                                color="#537be8"
                            />

                            {/* Flange Haunched Weld (along +X axis) */}
                            <FlangeHaunchedWeld
                                config={config}
                                dimensions={config.beam}
                                haunchedConfig={config.haunch}
                                position={[tp, -config.beam.depth / 2, -config.haunch.flangeWidth / 2]}
                                rotation={[0, 0, Math.PI / 2]}
                                color="#537be8"
                            />
                        </>
                    )}


                    {/* End Plate (Adjusted height and Y position) */}
                    <SteelPlate
                        dimensions={{ ...config.plate, height: plateH }}
                        position={[tp / 2, plateYOffset, 0]}
                    />

                    {/* Haunch */}
                    {config.haunch.enabled && (
                        <SteelHaunch
                            config={config.haunch}
                            position={[tp, -config.beam.depth / 2, 0]} // Underside of beam
                        />
                    )}

                    {/* All Bolts (Main + Haunch are handled by the solver results) */}
                    <BoltGroup
                        config={config.bolts}
                        plateThickness={tp}
                        flangeThickness={isWeakAxis ? config.column.webThickness : config.column.flangeThickness}
                        results={results.bolts}
                        position={[offsetBolts, 0, 0]}
                    />

                    {/* Load Visualization */}
                    <LoadVisualization
                        loads={config.loads}
                        origin={[1200, 0, 0]}
                        visible={config.settings.visualization.showLoads}
                    />
                </group>
            )}

            <ContactShadows position={[0, -1000, 0]} opacity={0.4} scale={10} blur={2.5} far={4000} />
            {config.settings.visualization.showGrid && (
                <Grid
                    position={[0, -1001, 0]}
                    infiniteGrid
                    fadeDistance={10000}
                    fadeStrength={5}
                    cellSize={100}
                    sectionSize={500}
                    sectionColor="#4a5568"
                    cellColor="#cbd5e0"
                />
            )}
            <OrbitControls makeDefault target={[tp / 2, 0, 0]} />
        </>
    );
};

export const ConnectionViewer: React.FC<ConnectionViewerProps> = (props) => {
    return (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200">
            <Canvas shadows camera={{ position: [800, 500, 800], fov: 45, near: 1, far: 20000 }}>
                <Suspense fallback={null}>
                    <SceneContent {...props} />
                </Suspense>
            </Canvas>
        </div>
    );
};
