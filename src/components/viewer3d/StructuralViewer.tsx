import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { useState, useRef, useMemo, useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { Joint, Frame, Shell, FrameSection, ShellSection, ModelingMode, AnalysisResults, PointLoad, DistributedFrameLoad, AreaLoad, LoadPattern } from '../../types/structuralTypes';
// import { getLocalAxes, getOrientedLocalAxes } from '../../utils/frameGeometry';
import { getDisplacementColor } from '../../utils/colorUtils';
import { LoadVisualizer } from './LoadVisualizer';
import { ForceDiagrams } from './ForceDiagrams';

interface StructuralViewerProps {
    joints: Joint[];
    frames: Frame[];
    shells: Shell[];
    frameSections: FrameSection[];
    shellSections: ShellSection[];
    modelingMode: ModelingMode;
    tempFrameStartJoint: number | null;
    tempShellJoints: number[];
    extrudeMode: boolean;
    onJointClick: (jointId: number, isDoubleClick?: boolean) => void;
    onFrameClick: (frameId: number, isDoubleClick?: boolean) => void;
    onShellClick: (shellId: number, isDoubleClick?: boolean) => void;
    cursorPosition: THREE.Vector3 | null;
    selectedJointId: number | null;
    selectedFrameId: number | null;
    selectedShellId: number | null;
    // Visualization props
    analysisResults: AnalysisResults | null;
    showDeformation: boolean;
    showJoint: boolean;
    deformationScale: number;
    showLoads: boolean;
    loadFilterType: 'all' | 'point' | 'distributed' | 'area';
    loadFilterPattern: string;
    pointLoads: PointLoad[];
    distributedLoads: DistributedFrameLoad[];
    areaLoads: AreaLoad[];
    loadPatterns: LoadPattern[];
    forceType: string;
    showGlobalAxes: boolean;
    showJointLabels: boolean;
    showFrameLabels: boolean;
    showGrid: boolean;
}

export function StructuralViewer({
    joints,
    frames,
    shells,
    frameSections,
    shellSections,
    modelingMode,
    tempFrameStartJoint,
    tempShellJoints,
    extrudeMode,
    onJointClick,
    onFrameClick,
    onShellClick,
    selectedJointId,
    selectedFrameId,
    selectedShellId,
    analysisResults,
    showDeformation,
    showJoint,
    deformationScale,
    showLoads,
    loadFilterType,
    loadFilterPattern,
    pointLoads,
    distributedLoads,
    areaLoads,
    loadPatterns,
    forceType,
    showGlobalAxes,
    showJointLabels,
    showFrameLabels,
    showGrid,
}: StructuralViewerProps) {
    const [hoverJoint, setHoverJoint] = useState<number | null>(null);
    const [cursorPos, setCursorPos] = useState<THREE.Vector3 | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    const interactivityTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleCameraChange = () => {
        setIsInteracting(true);
        if (interactivityTimeout.current) {
            clearTimeout(interactivityTimeout.current);
        }
        interactivityTimeout.current = setTimeout(() => {
            setIsInteracting(false);
        }, 100); // 100ms debounce to stop "interacting" state
    };

    // Calculate max displacement for color mapping
    const maxDisplacement = useMemo(() => {
        if (!analysisResults || !showDeformation) return 0;
        return analysisResults.displacements.reduce((max, d) => {
            const mag = Math.sqrt(d.ux ** 2 + d.uy ** 2 + d.uz ** 2);
            return Math.max(max, mag);
        }, 0);
    }, [analysisResults, showDeformation]);

    return (
        <Canvas
            camera={{ position: [10, 10, 10], fov: 50 }}
            style={{ background: 'linear-gradient(to bottom, #e5e7eb, #f3f4f6)' }}
            raycaster={{ params: { Line: { threshold: 0.1 } } } as any}
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            {showGrid && <Grid args={[100, 100]} cellSize={1} cellColor="#0255e6" sectionColor="#b9b9b9" />}
            <OrbitControls makeDefault onChange={handleCameraChange} />

            {/* Force Diagrams */}
            {analysisResults && forceType !== 'none' && (
                <ForceDiagrams
                    frames={frames}
                    joints={joints}
                    analysisResults={analysisResults}
                    forceType={forceType}
                    scale={deformationScale}
                />
            )}

            {/* Render original geometry if NOT in deformation mode OR results missing */}
            {!(showDeformation && analysisResults) && (
                // {/* {( */}
                <>
                    {/* ... (existing original geometry rendering) ... */}
                    {/* Render Joints (Instanced) */}
                    {showJoint && (
                        <JointsInstanced
                            joints={joints}
                            selectedJointId={selectedJointId}
                            hoverJointId={hoverJoint}
                            tempShellJoints={tempShellJoints}
                            tempFrameStartJoint={tempFrameStartJoint}
                            onJointClick={onJointClick}
                            onHover={setHoverJoint}
                            showLabels={showJointLabels && !isInteracting}
                        />
                    )}

                    {/* Render Frames */}
                    {frames.map((frame) => {
                        const jointI = joints.find((j) => j.id === frame.jointI);
                        const jointJ = joints.find((j) => j.id === frame.jointJ);
                        const section = frame.sectionId ? frameSections.find((s) => s.id === frame.sectionId) : null;

                        if (!jointI || !jointJ) return null;

                        return (
                            <FrameLine
                                key={frame.id}
                                frame={frame}
                                jointI={jointI}
                                jointJ={jointJ}
                                section={section}
                                isSelected={selectedFrameId === frame.id}
                                extrudeMode={extrudeMode}
                                onClick={() => onFrameClick(frame.id)}
                                showLabel={showFrameLabels}
                            />
                        );
                    })}

                    {/* Temporary Frame Preview */}
                    {modelingMode === 'createFrame' && tempFrameStartJoint !== null && cursorPos && (
                        <TempFrameLine
                            startJoint={joints.find((j) => j.id === tempFrameStartJoint)!}
                            endPos={cursorPos}
                        />
                    )}

                    {/* Render Shells */}
                    {shells.map((shell) => {
                        const shellJoints = shell.jointIds
                            .map((jid) => joints.find((j) => j.id === jid))
                            .filter(Boolean) as Joint[];
                        const section = shell.sectionId ? shellSections.find((s) => s.id === shell.sectionId) : null;

                        if (shellJoints.length < 3) return null;

                        return (
                            <ShellPolygon
                                key={shell.id}
                                shell={shell}
                                joints={shellJoints}
                                section={section}
                                isSelected={selectedShellId === shell.id}
                                extrudeMode={extrudeMode}
                                onClick={() => onShellClick(shell.id)}
                            />
                        );
                    })}

                    {/* Temporary Shell Preview */}
                    {modelingMode === 'createShell' && tempShellJoints.length >= 2 && (
                        <TempShellPreview
                            joints={tempShellJoints.map((jid) => joints.find((j) => j.id === jid)!).filter(Boolean)}
                        />
                    )}
                </>
            )}

            <CursorTracker onMove={setCursorPos} />

            {/* Global Axis Helper */}
            {showGlobalAxes && <GlobalAxisHelper />}

            {/* DEFORMED GEOMETRY RENDERING */}
            {showDeformation && analysisResults && (
                <>
                    {/* Deformed Joints (Instanced) */}
                    <DeformedJointsInstanced
                        joints={joints}
                        analysisResults={analysisResults}
                        deformationScale={deformationScale}
                        maxDisplacement={maxDisplacement}
                    />

                    {/* Deformed Frames (Batched) */}
                    <DeformedFramesBatch
                        frames={frames}
                        joints={joints}
                        analysisResults={analysisResults}
                        deformationScale={deformationScale}
                        maxDisplacement={maxDisplacement}
                    />
                </>
            )}

            {/* Load Visualization */}
            <LoadVisualizer
                pointLoads={pointLoads}
                distributedLoads={distributedLoads}
                areaLoads={areaLoads}
                joints={joints}
                frames={frames}
                shells={shells}
                loadPatterns={loadPatterns}
                filterType={loadFilterType}
                filterPattern={loadFilterPattern}
                showLoads={showLoads}
                showLabels={!isInteracting}
            />
        </Canvas>
    );
}


// Deformed Joints Instanced Component
function DeformedJointsInstanced({
    joints,
    analysisResults,
    deformationScale,
    maxDisplacement
}: {
    joints: Joint[];
    analysisResults: AnalysisResults;
    deformationScale: number;
    maxDisplacement: number;
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const updateInstances = () => {
        if (!meshRef.current) return;
        const mesh = meshRef.current;

        joints.forEach((joint, i) => {
            const disp = analysisResults.displacements.find(d => d.jointId === joint.id);
            if (!disp) return;

            dummy.position.set(
                joint.x + disp.ux * deformationScale,
                joint.y + disp.uy * deformationScale,
                joint.z + disp.uz * deformationScale
            );
            dummy.scale.set(0.4, 0.4, 0.4);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);

            const mag = Math.sqrt(disp.ux ** 2 + disp.uy ** 2 + disp.uz ** 2);
            mesh.setColorAt(i, new THREE.Color(getDisplacementColor(mag, maxDisplacement)));
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
    };

    // Use useLayoutEffect to update matrices after ref is available
    useLayoutEffect(() => {
        updateInstances();
    }, [joints, analysisResults, deformationScale, maxDisplacement, dummy]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, joints.length]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial />
        </instancedMesh>
    );
}

// Deformed Frames Batch Component
function DeformedFramesBatch({
    frames,
    joints,
    analysisResults,
    deformationScale,
    maxDisplacement,
}: {
    frames: Frame[];
    joints: Joint[];
    analysisResults: AnalysisResults;
    deformationScale: number;
    maxDisplacement: number;
}) {
    const geometry = useMemo(() => {
        const positions: number[] = [];
        const colors: number[] = [];
        const tempColor = new THREE.Color();

        frames.forEach((frame) => {
            const jointI = joints.find(j => j.id === frame.jointI);
            const jointJ = joints.find(j => j.id === frame.jointJ);
            if (!jointI || !jointJ) return;

            const detailed = analysisResults.frameDetailedResults?.[frame.id];
            if (detailed) {
                for (let i = 0; i < detailed.displacements.length - 1; i++) {
                    const d1 = detailed.displacements[i];
                    const d2 = detailed.displacements[i + 1];
                    const t1 = detailed.stations[i];
                    const t2 = detailed.stations[i + 1];

                    const p1 = [
                        jointI.x + (jointJ.x - jointI.x) * t1 + d1.ux * deformationScale,
                        jointI.y + (jointJ.y - jointI.y) * t1 + d1.uy * deformationScale,
                        jointI.z + (jointJ.z - jointI.z) * t1 + d1.uz * deformationScale
                    ];
                    const p2 = [
                        jointI.x + (jointJ.x - jointI.x) * t2 + d2.ux * deformationScale,
                        jointI.y + (jointJ.y - jointI.y) * t2 + d2.uy * deformationScale,
                        jointI.z + (jointJ.z - jointI.z) * t2 + d2.uz * deformationScale
                    ];

                    positions.push(...p1, ...p2);

                    const mag1 = Math.sqrt(d1.ux ** 2 + d1.uy ** 2 + d1.uz ** 2);
                    const mag2 = Math.sqrt(d2.ux ** 2 + d2.uy ** 2 + d2.uz ** 2);

                    tempColor.set(getDisplacementColor(mag1, maxDisplacement));
                    colors.push(tempColor.r, tempColor.g, tempColor.b);
                    tempColor.set(getDisplacementColor(mag2, maxDisplacement));
                    colors.push(tempColor.r, tempColor.g, tempColor.b);
                }
            } else {
                const dispI = analysisResults.displacements.find(d => d.jointId === jointI.id);
                const dispJ = analysisResults.displacements.find(d => d.jointId === jointJ.id);
                if (!dispI || !dispJ) return;

                const p1 = [
                    jointI.x + dispI.ux * deformationScale,
                    jointI.y + dispI.uy * deformationScale,
                    jointI.z + dispI.uz * deformationScale
                ];
                const p2 = [
                    jointJ.x + dispJ.ux * deformationScale,
                    jointJ.y + dispJ.uy * deformationScale,
                    jointJ.z + dispJ.uz * deformationScale
                ];

                positions.push(...p1, ...p2);

                const magI = Math.sqrt(dispI.ux ** 2 + dispI.uy ** 2 + dispI.uz ** 2);
                const magJ = Math.sqrt(dispJ.ux ** 2 + dispJ.uy ** 2 + dispJ.uz ** 2);

                tempColor.set(getDisplacementColor(magI, maxDisplacement));
                colors.push(tempColor.r, tempColor.g, tempColor.b);
                tempColor.set(getDisplacementColor(magJ, maxDisplacement));
                colors.push(tempColor.r, tempColor.g, tempColor.b);
            }
        });

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        return geo;
    }, [frames, joints, analysisResults, deformationScale, maxDisplacement]);

    return (
        <lineSegments geometry={geometry}>
            <lineBasicMaterial vertexColors linewidth={2} />
        </lineSegments>
    );
}

// Joints Instanced Component (Normal Mode)
function JointsInstanced({
    joints,
    selectedJointId,
    hoverJointId,
    tempShellJoints,
    tempFrameStartJoint,
    onJointClick,
    onHover,
    showLabels,
}: {
    joints: Joint[];
    selectedJointId: number | null;
    hoverJointId: number | null;
    tempShellJoints: number[];
    tempFrameStartJoint: number | null;
    onJointClick: (id: number, isDoubleClick?: boolean) => void;
    onHover: (id: number | null) => void;
    showLabels: boolean;
}) {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const jointCount = joints.length;

    const updateInstances = () => {
        if (!meshRef.current) return;
        const mesh = meshRef.current;

        joints.forEach((joint, i) => {
            dummy.position.set(joint.x, joint.y, joint.z);
            const scale = selectedJointId === joint.id || hoverJointId === joint.id ? 0.6 : 0.4;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);

            const isTempSelected = tempShellJoints.includes(joint.id) || tempFrameStartJoint === joint.id;
            const isRestraint = !!joint.restraint && (joint.restraint.ux || joint.restraint.uy || joint.restraint.uz);
            const fixed = joint.restraint?.ux && joint.restraint?.uy && joint.restraint?.uz && joint.restraint?.rx && joint.restraint?.ry && joint.restraint?.rz;

            let colorStr = '#6b7280';
            if (isTempSelected) colorStr = '#10b981';
            else if (hoverJointId === joint.id) colorStr = '#f59e0b';
            else if (isRestraint) colorStr = fixed ? '#f20b0b' : '#806b6bff';

            mesh.setColorAt(i, new THREE.Color(colorStr));
        });

        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.computeBoundingSphere();
    };

    useLayoutEffect(() => {
        updateInstances();
    }, [joints, selectedJointId, hoverJointId, tempShellJoints, tempFrameStartJoint, dummy]);

    return (
        <group>
            <instancedMesh
                ref={meshRef}
                args={[undefined, undefined, jointCount]}
                onClick={(e) => {
                    e.stopPropagation();
                    const instanceId = e.instanceId;
                    if (instanceId !== undefined) {
                        onJointClick(joints[instanceId].id, false);
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    const instanceId = e.instanceId;
                    if (instanceId !== undefined) {
                        onJointClick(joints[instanceId].id, true);
                    }
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    const instanceId = e.instanceId;
                    if (instanceId !== undefined) {
                        onHover(joints[instanceId].id);
                    }
                }}
                onPointerOut={() => onHover(null)}
            >
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial />
            </instancedMesh>

            {showLabels && joints.map(joint => (
                <Html key={`label-${joint.id}`} position={[joint.x, joint.y, joint.z]} zIndexRange={[80, 0]} pointerEvents="none">
                    <div className="px-1 py-0.5 rounded text-[10px] font-mono pointer-events-none text-gray-600">
                        {joint.id}
                    </div>
                </Html>
            ))}
        </group>
    );
}

// Frame Line Component
function FrameLine({
    frame,
    jointI,
    jointJ,
    section,
    isSelected,
    extrudeMode,
    onClick,
    showLabel,
}: {
    frame: Frame;
    jointI: Joint;
    jointJ: Joint;
    section: FrameSection | null | undefined;
    isSelected: boolean;
    extrudeMode: boolean;
    onClick: (isDoubleClick?: boolean) => void;
    showLabel: boolean;
}) {
    const color = section ? section.color : '#9ca3af';
    const lineWidth = isSelected ? 4 : 2;

    const start = new THREE.Vector3(jointI.x, jointI.y, jointI.z);
    const end = new THREE.Vector3(jointJ.x, jointJ.y, jointJ.z);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const center = start.clone().add(direction.clone().multiplyScalar(0.5));

    // For the visual line
    const lineObj = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, length, 0)]);
        const material = new THREE.LineBasicMaterial({ color, linewidth: lineWidth });
        return new THREE.Line(geometry, material);
    }, [color, lineWidth, length]);

    // Cylinder rotation to align with start-end using a stable basis
    const quaternion = useMemo(() => {
        const up = new THREE.Vector3(0, 1, 0);
        const dir = direction.clone().normalize();

        const localY = dir;
        let localX: THREE.Vector3;
        if (Math.abs(dir.dot(up)) > 0.999) {
            localX = new THREE.Vector3(1, 0, 0); // Vertical member
        } else {
            localX = new THREE.Vector3().crossVectors(up, localY).normalize();
        }
        const localZ = new THREE.Vector3().crossVectors(localX, localY).normalize();

        const matrix = new THREE.Matrix4();
        matrix.makeBasis(localX, localY, localZ);
        return new THREE.Quaternion().setFromRotationMatrix(matrix);
    }, [direction]);

    // Extruded Mesh
    const extrudedMesh = useMemo(() => {
        if (!extrudeMode || !section) return null;

        let geometry: THREE.BufferGeometry | THREE.Group;
        const dims = section.dimensions;
        const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.4, opacity: 0.5 });

        switch (dims.shape) {
            case 'Rectangular':
                geometry = new THREE.BoxGeometry(dims.width, length, dims.height);
                break;
            case 'Circular':
                geometry = new THREE.CylinderGeometry(dims.diameter / 2, dims.diameter / 2, length, 16);
                break;
            case 'Tube':
                // For tube, we can use a ring-like shape or a simple cylinder
                geometry = new THREE.CylinderGeometry(dims.outerDiameter / 2, dims.outerDiameter / 2, length, 16);
                break;
            case 'Hollow': {
                const outerShape = new THREE.Shape();
                outerShape.moveTo(-dims.width / 2, -dims.height / 2);
                outerShape.lineTo(dims.width / 2, -dims.height / 2);
                outerShape.lineTo(dims.width / 2, dims.height / 2);
                outerShape.lineTo(-dims.width / 2, dims.height / 2);
                outerShape.closePath();

                const innerShape = new THREE.Path();
                const iw = dims.width - 2 * dims.wallThickness;
                const ih = dims.height - 2 * dims.wallThickness;
                // Hole MUST be opposite direction of outer shape to be a hole
                innerShape.moveTo(-iw / 2, ih / 2);
                innerShape.lineTo(iw / 2, ih / 2);
                innerShape.lineTo(iw / 2, -ih / 2);
                innerShape.lineTo(-iw / 2, -ih / 2);
                innerShape.closePath();

                outerShape.holes.push(innerShape);

                const geo = new THREE.ExtrudeGeometry(outerShape, { depth: length, bevelEnabled: false });
                geo.rotateX(Math.PI / 2);
                geo.translate(0, length / 2, 0); // Correctly center the extrusion
                geometry = geo;
                break;
            }
            case 'ISection': {
                const wh = dims.depth - 2 * dims.flangeThickness;
                const group = new THREE.Group();
                const web = new THREE.Mesh(new THREE.BoxGeometry(dims.webThickness, length, wh), mat);
                const tf = new THREE.Mesh(new THREE.BoxGeometry(dims.flangeWidth, length, dims.flangeThickness), mat);
                const bf = new THREE.Mesh(new THREE.BoxGeometry(dims.flangeWidth, length, dims.flangeThickness), mat);

                tf.position.z = dims.depth / 2 - dims.flangeThickness / 2;
                bf.position.z = -dims.depth / 2 + dims.flangeThickness / 2;
                group.add(web, tf, bf);
                return group;
            }
            default:
                geometry = new THREE.BoxGeometry(0.1, length, 0.1);
        }

        return new THREE.Mesh(geometry as THREE.BufferGeometry, mat);
    }, [extrudeMode, section, length, color]);

    return (
        <group position={[center.x, center.y, center.z]} quaternion={quaternion}>
            {/* Visual Line (Wireframe) */}
            {!extrudeMode && <primitive object={lineObj} position={[0, -length / 2, 0]} />}

            {/* Extruded Mesh */}
            {extrudeMode && extrudedMesh && (
                <primitive object={extrudedMesh} rotation={[0, (frame.orientation * Math.PI) / 180, 0]} />
            )}

            {/* Hit Cylinder (Transparent) */}
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(false);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onClick(true);
                }}
            >
                <cylinderGeometry args={[0.05, 0.05, length * 0.8, 8]} />
                <meshStandardMaterial transparent opacity={0} />
            </mesh>

            {/* Selection Highlight if selected */}
            {isSelected && (
                <mesh>
                    <cylinderGeometry args={[0.06, 0.06, length, 8]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0} transparent opacity={1} />
                </mesh>
            )}

            {showLabel && (
                <Html position={[0, 0, 0]} zIndexRange={[80, 0]} center pointerEvents="none">
                    <div className="px-1 py-0.5 rounded text-xs font-bold pointer-events-none">
                        F{frame.id}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Temporary Frame Line Preview
function TempFrameLine({ startJoint, endPos }: { startJoint: Joint; endPos: THREE.Vector3 }) {
    const lineObj = useMemo(() => {
        const points = [new THREE.Vector3(startJoint.x, startJoint.y, startJoint.z), endPos];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: '#10b981',
            linewidth: 2,
            linecap: 'round',
            linejoin: 'round'
        });
        return new THREE.Line(geometry, material);
    }, [startJoint, endPos]);

    return <primitive object={lineObj} />;
}

// Shell Polygon Component
function ShellPolygon({
    // shell,
    joints,
    section,
    isSelected,
    extrudeMode,
    onClick,
}: {
    shell: Shell;
    joints: Joint[];
    section: ShellSection | null | undefined;
    isSelected: boolean;
    extrudeMode: boolean;
    onClick: (isDoubleClick?: boolean) => void;
}) {
    const color = section ? section.color : '#10b981';
    const opacity = isSelected ? 0.8 : 0.5;

    // Centroid for positioning
    const centroid = useMemo(() => {
        const c = new THREE.Vector3(0, 0, 0);
        joints.forEach(j => {
            c.x += j.x;
            c.y += j.y;
            c.z += j.z;
        });
        return c.divideScalar(joints.length);
    }, [joints]);

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        joints.forEach((joint, i) => {
            const rx = joint.x - centroid.x;
            const rz = joint.z - centroid.z;
            // Negate rz because rotation -PI/2 around X mirrors the Z axis (Local Y -> World Z, but Local Z -> World -Y... wait)
            // Let's re-verify: rotateX(-pi/2) maps Shape Y (Local Y) to World Z. Correct.
            // Shape X maps to World X. Correct.
            // No mirroring if we use -PI/2.
            // Wait, let's just use (rx, rz) and rotation [-pi/2, 0, 0] and see.
            // Actually, rz in world is usually positive away from camera.
            if (i === 0) s.moveTo(rx, -rz);
            else s.lineTo(rx, -rz);
        });
        s.closePath();
        return s;
    }, [joints, centroid]);

    const extrudedGeometry = useMemo(() => {
        if (!extrudeMode || !section) return null;
        return new THREE.ExtrudeGeometry(shape, { depth: section.thickness, bevelEnabled: false });
    }, [shape, extrudeMode, section]);

    return (
        <mesh
            position={[centroid.x, centroid.y, centroid.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={(e) => { e.stopPropagation(); onClick(false); }}
            onDoubleClick={(e) => { e.stopPropagation(); onClick(true); }}
        >
            {extrudeMode && extrudedGeometry ? (
                <primitive object={extrudedGeometry} attach="geometry" />
            ) : (
                <shapeGeometry args={[shape]} />
            )}
            <meshStandardMaterial color={color} opacity={opacity} transparent side={THREE.DoubleSide} />
        </mesh>
    );
}

// Temporary Shell Preview
function TempShellPreview({ joints }: { joints: Joint[] }) {
    if (joints.length < 2) return null;

    return (
        <group>
            {joints.map((joint, i) => {
                if (i === joints.length - 1) return null;
                const nextJoint = joints[i + 1];

                // Create line object locally or use a helper component to memoize
                // For simplicity in a map, we'll inline a sub-component or just use a helper function
                return <TempShellLine key={i} start={joint} end={nextJoint} />;
            })}
        </group>
    );
}

function TempShellLine({ start, end }: { start: Joint; end: Joint }) {
    const lineObj = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(start.x, start.y, start.z),
            new THREE.Vector3(end.x, end.y, end.z)
        ]);
        const material = new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 2 });
        return new THREE.Line(geometry, material);
    }, [start, end]);

    return <primitive object={lineObj} />;
}

// Cursor Tracker Component (to get mouse position in 3D space)
function CursorTracker({ onMove }: { onMove: (pos: THREE.Vector3) => void }) {
    const meshRef = useRef<THREE.Mesh>(null);

    return (
        <mesh
            ref={meshRef}
            rotation-x={-Math.PI / 2}
            position={[0, 0, 0]}
            visible={false}
            onPointerMove={(e) => {
                // e.point is the 3D point of intersection
                onMove(e.point);
            }}
        >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}

// Global Axis Helper
function GlobalAxisHelper() {
    const locLabelX = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(2, 0, 0)
        ]);
        const material = new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 2 });
        return new THREE.Line(geometry, material);
    }, []);
    const locLabelY = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 2, 0)
        ]);
        const material = new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 2 });
        return new THREE.Line(geometry, material);
    }, []);
    const locLabelZ = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 2)
        ]);
        const material = new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 2 });
        return new THREE.Line(geometry, material);
    }, []);
    return (
        <group>
            <primitive object={locLabelX} />
            <primitive object={locLabelY} />
            <primitive object={locLabelZ} />
            <Html position={[2.5, 0, 0]} center zIndexRange={[100, 0]}>
                <div className="px-2 py-1 rounded text-md font-mono pointer-events-none whitespace-nowrap">
                    X
                </div>
            </Html>
            <Html position={[0, 2.5, 0]} center zIndexRange={[100, 0]}>
                <div className="px-2 py-1 rounded text-md font-mono pointer-events-none whitespace-nowrap">
                    Y
                </div>
            </Html>
            <Html position={[0, 0, 2.5]} center zIndexRange={[100, 0]}>
                <div className="px-2 py-1 rounded text-md font-mono pointer-events-none whitespace-nowrap">
                    Z
                </div>
            </Html>
        </group>
    );
}
