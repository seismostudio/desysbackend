import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3 } from 'three';
import type { PointLoad, DistributedFrameLoad, AreaLoad, Joint, Frame, Shell, LoadPattern } from '../../types/structuralTypes';
import { getLoadPatternColor } from '../../utils/colorUtils';

interface LoadVisualizerProps {
    pointLoads: PointLoad[];
    distributedLoads: DistributedFrameLoad[];
    areaLoads: AreaLoad[];
    joints: Joint[];
    frames: Frame[];
    shells: Shell[];
    loadPatterns: LoadPattern[];
    filterType: 'all' | 'point' | 'distributed' | 'area';
    filterPattern: string; // pattern ID or 'all'
    showLoads: boolean;
}

export function LoadVisualizer({
    pointLoads,
    distributedLoads,
    joints,
    frames,
    loadPatterns,
    filterType,
    filterPattern,
    showLoads,
}: LoadVisualizerProps) {
    const { filteredPointLoads, filteredDistLoads } = useMemo(() => {
        if (!showLoads) return { filteredPointLoads: [], filteredDistLoads: [] };

        let pLoads = pointLoads;
        let dLoads = distributedLoads;

        if (filterPattern !== 'all') {
            pLoads = pLoads.filter(l => l.patternId === filterPattern);
            dLoads = dLoads.filter(l => l.patternId === filterPattern);
        }

        const res = { filteredPointLoads: [] as PointLoad[], filteredDistLoads: [] as DistributedFrameLoad[] };

        if (filterType === 'point' || filterType === 'all') {
            res.filteredPointLoads = pLoads;
        }
        if (filterType === 'distributed' || filterType === 'all') {
            res.filteredDistLoads = dLoads;
        }

        return res;
    }, [pointLoads, distributedLoads, filterType, filterPattern, showLoads]);

    // Calculate Global Max for Distributed Loads scaling
    const distLoadScale = useMemo(() => {
        if (filteredDistLoads.length === 0) return 1;
        let max = 0;
        filteredDistLoads.forEach(l => {
            max = Math.max(max, Math.abs(l.startMagnitude), Math.abs(l.endMagnitude));
        });
        return max > 0 ? 0.5 / max : 1; // Target height ~0.5m
    }, [filteredDistLoads]);

    // Helper to get Frame Axis (copied from ForceDiagrams logic roughly)
    const getFrameAxes = (frame: Frame, start: Vector3, end: Vector3) => {
        const dir = new Vector3().subVectors(end, start).normalize();
        let localX = dir.clone();
        let localY = new Vector3(0, 1, 0);
        let localZ = new Vector3(0, 0, 1);

        // Vertical members
        if (Math.abs(localX.x) < 0.001 && Math.abs(localX.z) < 0.001) {
            if (localX.y > 0) { // Up
                localY = new Vector3(-1, 0, 0);
                localZ = new Vector3(0, 0, 1);
            } else { // Down
                localY = new Vector3(1, 0, 0);
                localZ = new Vector3(0, 0, 1);
            }
        } else {
            // standard
            const globalUp = new Vector3(0, 1, 0);
            localZ = new Vector3().crossVectors(localX, globalUp).normalize();
            localY = new Vector3().crossVectors(localZ, localX).normalize();
        }

        // Apply Beta Angle
        if (frame.orientation) {
            const beta = frame.orientation * Math.PI / 180;
            localY.applyAxisAngle(localX, beta);
            localZ.applyAxisAngle(localX, beta);
        }

        return { localX, localY, localZ };
    };

    if (!showLoads) return null;

    return (
        <group>
            {/* Point Loads */}
            {filteredPointLoads.map((load) => {
                const joint = joints.find(j => j.id === load.jointId);
                const pattern = loadPatterns.find(p => p.id === load.patternId);

                if (!joint) return null;

                const position = new THREE.Vector3(joint.x, joint.y, joint.z);
                const color = pattern ? getLoadPatternColor(pattern.type) : '#9ca3af';

                // Calculate total force magnitude
                const forceMag = Math.sqrt(load.fx ** 2 + load.fy ** 2 + load.fz ** 2);
                if (forceMag < 0.001) return null;

                // Normalize direction
                const direction = new THREE.Vector3(load.fx, load.fy, load.fz).normalize();

                // Arrow length
                const arrowLength = Math.min(Math.max(forceMag / 10, 0.5), 3);

                return (
                    <group key={load.id}>
                        {/* Arrow shaft */}
                        <arrowHelper
                            args={[
                                direction,
                                position,
                                arrowLength,
                                color,
                                arrowLength * 0.2,
                                arrowLength * 0.15
                            ]}
                        />

                        {/* Label */}
                        <Html position={[position.x + load.fx / 9, position.y + load.fy / 9, position.z + load.fz / 9]} center>
                            <div className="bg-white/80 px-2 py-1 rounded text-[10px] font-mono border border-gray-300 pointer-events-none whitespace-nowrap">
                                {forceMag.toFixed(1)} kN
                            </div>
                        </Html>
                    </group>
                );
            })}

            {/* Distributed Loads */}
            {filteredDistLoads.map(load => {
                const frame = frames.find(f => f.id === load.frameId);
                if (!frame) return null;

                const startJoint = joints.find(j => j.id === frame.jointI);
                const endJoint = joints.find(j => j.id === frame.jointJ);
                if (!startJoint || !endJoint) return null;

                const start = new Vector3(startJoint.x, startJoint.y, startJoint.z);
                const end = new Vector3(endJoint.x, endJoint.y, endJoint.z);
                const L = start.distanceTo(end);

                const { localX, localY, localZ } = getFrameAxes(frame, start, end);

                // Determine Load Direction (Unit Vector)
                let loadDir = new Vector3(0, -1, 0); // Default Gravity
                if (load.direction === 'GlobalX') loadDir.set(1, 0, 0);
                if (load.direction === 'GlobalY') loadDir.set(0, 1, 0);
                if (load.direction === 'GlobalZ') loadDir.set(0, 0, 1);
                if (load.direction === 'Gravity') loadDir.set(0, -1, 0);
                if (load.direction === 'LocalX') loadDir.copy(localX);
                if (load.direction === 'LocalY') loadDir.copy(localY);
                if (load.direction === 'LocalZ') loadDir.copy(localZ);

                const pattern = loadPatterns.find(p => p.id === load.patternId);
                const color = pattern ? getLoadPatternColor(pattern.type) : '#9ca3af';

                // Diagram Logic
                // Plot ordinates OPPOSITE to load direction so "arrows" point FROM curve TO member
                const plotDir = loadDir.clone().negate();

                // Points on Member Axis
                // Handle relative vs absolute distances. 
                // Assumption: input is m. But convert relative distance to 0-1 t for interpolation
                // If startDistance > 1, assume it's meters. If <= 1, it's ambiguous, but let's assume meters as per type definition "m".
                // Safest to treat as meters.
                const tStart = Math.min(Math.max(load.startDistance / L, 0), 1);
                const tEnd = Math.min(Math.max(load.endDistance / L, 0), 1);

                const pStart = new Vector3().lerpVectors(start, end, tStart);
                const pMid = new Vector3().lerpVectors(start, end, (tStart + tEnd) / 2);
                const pEnd = new Vector3().lerpVectors(start, end, tEnd);

                // Offset Points (Top of Diagram)
                const dStart = pStart.clone().add(plotDir.clone().multiplyScalar(load.startMagnitude * distLoadScale));
                const dMid = pMid.clone().add(plotDir.clone().multiplyScalar(load.startMagnitude * distLoadScale));
                const dEnd = pEnd.clone().add(plotDir.clone().multiplyScalar(load.endMagnitude * distLoadScale));

                // Vertices for the main line
                const linePoints = [dStart, dMid, dEnd];

                // Arrows / Connecting Lines
                // We'll draw 5-10 intermediate lines to make it look like a distributed load diagram
                const numArrows = 5;
                const arrowLines: Vector3[][] = [];

                // Start and End always have arrows
                arrowLines.push([dStart, pStart]);
                arrowLines.push([dEnd, pEnd]);

                // Intermediates
                for (let i = 1; i < numArrows; i++) {
                    const t = i / numArrows;
                    const pInter = new Vector3().lerpVectors(pStart, pEnd, t);
                    const magInter = load.startMagnitude + (load.endMagnitude - load.startMagnitude) * t;
                    const dInter = pInter.clone().add(plotDir.clone().multiplyScalar(magInter * distLoadScale));
                    arrowLines.push([dInter, pInter]);
                }

                // Arrow Heads (Simple cone/line logic not easily available in Line component, 
                // so we rely on the line itself pointing down. 
                // Ideally we'd use arrowHelper but many instances is check-intensive. 
                // Just lines is fine for "internal force diagram" look.)

                return (
                    <group key={load.id}>
                        {/* Top Curve Line */}
                        <Line points={linePoints} color={color} lineWidth={2} />

                        {/* Vertical Lines (Arrows) */}
                        {arrowLines.map((pts, i) => (
                            <Line key={i} points={pts} color={color} lineWidth={1} transparent opacity={0.6} />
                        ))}

                        {/* Labels */}
                        {/* <Html position={dMid} center>
                            <div className="bg-white/80 px-1 rounded text-[9px] font-mono border border-gray-300 pointer-events-none whitespace-nowrap">
                                {load.startMagnitude.toFixed(2)}
                            </div>
                        </Html> */}
                        {load.startMagnitude > load.endMagnitude && (
                            <Html position={dStart} center>
                                <div className="bg-white/80 px-1 rounded text-[9px] font-mono border border-gray-300 pointer-events-none whitespace-nowrap">
                                    {load.startMagnitude.toFixed(2)}
                                </div>
                            </Html>)}
                        {load.startMagnitude === load.endMagnitude && (
                            <Html position={dMid} center>
                                <div className="bg-white/80 px-1 rounded text-[9px] font-mono border border-gray-300 pointer-events-none whitespace-nowrap">
                                    {load.startMagnitude.toFixed(2)}
                                </div>
                            </Html>)}
                        {Math.abs(load.startMagnitude - load.endMagnitude) > 0.01 && (
                            <Html position={dEnd} center>
                                <div className="bg-white/80 px-1 rounded text-[9px] font-mono border border-gray-300 pointer-events-none whitespace-nowrap">
                                    {load.endMagnitude.toFixed(2)}
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </group>
    );
}
