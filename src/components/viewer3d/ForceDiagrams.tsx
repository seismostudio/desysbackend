import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei'; // Use Drei Line
import type { Frame, AnalysisResults, Joint } from '../../types/structuralTypes';

interface ForceDiagramsProps {
    frames: Frame[];
    joints: Joint[];
    analysisResults: AnalysisResults;
    forceType: string; // 'P', 'V2', 'V3', 'T', 'M2', 'M3'
    scale?: number;
}

export const ForceDiagrams: React.FC<ForceDiagramsProps> = ({ frames, joints, analysisResults, forceType, scale = 1 }) => {

    // Only render if a valid force type is selected
    if (forceType === 'none' || !analysisResults.frameDetailedResults) return null;

    // Helper map for joints
    const jointMap = useMemo(() => {
        const map = new Map<number, Joint>();
        joints.forEach(j => map.set(j.id, j));
        return map;
    }, [joints]);

    // Calculate Global Max for the selected force type to normalize scaling
    const globalMax = useMemo(() => {
        if (!analysisResults.frameDetailedResults) return 1;
        let max = 0;
        Object.values(analysisResults.frameDetailedResults).forEach(res => {
            res.forces.forEach(f => {
                const val = Math.abs(f[forceType as keyof typeof f] || 0);
                if (val > max) max = val;
            });
        });
        return max > 0 ? max : 1; // Avoid division by zero
    }, [analysisResults, forceType]);

    // Target visual height for the maximum force (in meters)
    // This makes the largest diagram appear roughly 'targetHeight' * 'userScale' tall.
    const baseHeight = 0.5;
    const normalizationFactor = baseHeight / globalMax;

    return (
        <group>
            {frames.map(frame => {
                const results = analysisResults.frameDetailedResults![frame.id];
                if (!results || !results.forces) return null;

                const startJoint = jointMap.get(frame.jointI);
                const endJoint = jointMap.get(frame.jointJ);

                if (!startJoint || !endJoint) return null;

                const start = new Vector3(startJoint.x, startJoint.y, startJoint.z);
                const end = new Vector3(endJoint.x, endJoint.y, endJoint.z);

                // Direction vector
                const dir = new Vector3().subVectors(end, start).normalize();

                // Local axes construction
                // Standard: Y is Up (Global Y) for horizontal members.
                // If member is vertical (parallel to Y), specialized logic.

                let localX = dir.clone();
                let localY = new Vector3(0, 1, 0);
                let localZ = new Vector3(0, 0, 1);

                // Handle vertical members
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

                // Determine which axis to offset for the diagram
                let plotAxis = localY.clone();
                if (forceType === 'V2') plotAxis = localY.clone(); // Shear Y -> Plot in Y
                if (forceType === 'V3') plotAxis = localZ.clone(); // Shear Z -> Plot in Z
                if (forceType === 'M2') plotAxis = localZ.clone(); // Moment about Y -> Bending in X-Z -> Plot in Z (or -Z)
                if (forceType === 'M3') plotAxis = localY.clone(); // Moment about Z -> Bending in X-Y -> Plot in Y
                if (forceType === 'T') plotAxis = localY.clone(); // Torsion
                if (forceType === 'P') plotAxis = localY.clone(); // Axial

                // Final Scaling Factor
                // We use the global normalization factor so all diagrams are relative to each other logic-wise,
                // and then apply the user's `scale` prop (which comes from deformation scale slider).
                // We might want a separate scale slider for forces later, but for now this is fine.
                // Reducing the user scale sensitivity a bit because 10x is common for deformation but huge for diagrams if base is 0.5m.
                const diagScale = normalizationFactor * (scale * 0.2);


                // Build points
                const points: Vector3[] = [];
                const values: number[] = [];

                // Base line points
                const basePoints: Vector3[] = [];

                results.forces.forEach((f, i) => {
                    const t = results.stations[i];
                    const pos = new Vector3().lerpVectors(start, end, t);
                    basePoints.push(pos.clone());

                    let val = 0;
                    const key = forceType as keyof typeof f;
                    val = f[key] || 0;

                    if (forceType === 'M3') val = val; // Convention check

                    values.push(val);

                    const offset = plotAxis.clone().multiplyScalar(val * diagScale);
                    points.push(pos.clone().add(offset));
                });

                // Render
                return (
                    <group key={frame.id}>
                        {/* Diagram Curve */}
                        <Line points={points} color={getForceColor(forceType)} lineWidth={2} />

                        {/* Connecting Lines (Fills) */}
                        {points.map((p, i) => {
                            if (i % 2 !== 0 && i !== points.length - 1) return null; // Optimize: skip some lines
                            return (
                                <Line
                                    key={i}
                                    points={[basePoints[i], p]}
                                    color={values[i] >= 0 ? getForceColor(forceType) : getForceColor(forceType)}
                                    lineWidth={1}
                                    transparent
                                    opacity={0.5}
                                />
                            );
                        })}
                    </group>
                );
            })}
        </group>
    );
};

function getForceColor(type: string): string {
    switch (type) {
        case 'P': return '#ef4444'; // Red
        case 'V2': return '#22c55e'; // Green
        case 'V3': return '#10b981'; // Emerald
        case 'M3': return '#3b82f6'; // Blue
        case 'M2': return '#6366f1'; // Indigo
        case 'T': return '#a855f7'; // Purple
        default: return '#eab308'; // Yellow
    }
}
