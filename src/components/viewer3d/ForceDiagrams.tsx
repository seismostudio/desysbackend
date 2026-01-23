import React, { useMemo } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';
import type { Frame, AnalysisResults, Joint } from '../../types/structuralTypes';

interface ForceDiagramsProps {
    frames: Frame[];
    joints: Joint[];
    analysisResults: AnalysisResults;
    forceType: string; // 'P', 'V2', 'V3', 'T', 'M2', 'M3'
    scale?: number;
}

export const ForceDiagrams: React.FC<ForceDiagramsProps> = ({ frames, joints, analysisResults, forceType }) => {

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
    const baseHeight = 0.75;
    const normalizationFactor = baseHeight / globalMax;

    // Unified geometry for all diagram curves
    const { diagramGeometry, fillGeometry } = useMemo(() => {
        const diagramPoints: number[] = [];
        const fillPoints: number[] = [];

        frames.forEach(frame => {
            const results = analysisResults.frameDetailedResults![frame.id];
            if (!results || !results.forces) return;

            const startJoint = jointMap.get(frame.jointI);
            const endJoint = jointMap.get(frame.jointJ);
            if (!startJoint || !endJoint) return;

            const start = new Vector3(startJoint.x, startJoint.y, startJoint.z);
            const end = new Vector3(endJoint.x, endJoint.y, endJoint.z);
            const dir = new Vector3().subVectors(end, start).normalize();

            let localX = dir.clone();
            let localY = new Vector3(0, 1, 0);
            let localZ = new Vector3(0, 0, 1);

            if (Math.abs(localX.x) < 0.001 && Math.abs(localX.z) < 0.001) {
                if (localX.y > 0) {
                    localY = new Vector3(-1, 0, 0);
                    localZ = new Vector3(0, 0, 1);
                } else {
                    localY = new Vector3(1, 0, 0);
                    localZ = new Vector3(0, 0, 1);
                }
            } else {
                
                let globalUp = new Vector3(0, 1, 0);
                if (forceType === "M3" || forceType === "M2" ) {
                    globalUp = new Vector3(0, -1, 0)
                }
                localZ = new Vector3().crossVectors(localX, globalUp).normalize();
                localY = new Vector3().crossVectors(localZ, localX).normalize();
            }

            if (frame.orientation) {
                const beta = frame.orientation * Math.PI / 180;
                localY.applyAxisAngle(localX, beta);
                localZ.applyAxisAngle(localX, beta);
            }

            let plotAxis = localY.clone();
            if (forceType === 'V2') plotAxis = localY.clone();
            if (forceType === 'V3') plotAxis = localZ.clone();
            if (forceType === 'M2') plotAxis = localZ.clone();
            if (forceType === 'M3') plotAxis = localY.clone();
            if (forceType === 'T') plotAxis = localY.clone();
            if (forceType === 'P') plotAxis = localY.clone();

            const diagScale = normalizationFactor;

            let lastOffsetPos: Vector3 | null = null;

            results.forces.forEach((f, i) => {
                const t = results.stations[i];
                const pos = new Vector3().lerpVectors(start, end, t);
                const val = f[forceType as keyof typeof f] || 0;
                const offset = plotAxis.clone().multiplyScalar(val * diagScale);
                const offsetPos = pos.clone().add(offset);

                if (i > 0 && lastOffsetPos) {
                    diagramPoints.push(lastOffsetPos.x, lastOffsetPos.y, lastOffsetPos.z);
                    diagramPoints.push(offsetPos.x, offsetPos.y, offsetPos.z);
                }

                // Fill lines (every N stations or start/end to avoid too many lines)
                if (i === 0 || i === results.forces.length - 1 || i % 2 === 0) {
                    fillPoints.push(pos.x, pos.y, pos.z);
                    fillPoints.push(offsetPos.x, offsetPos.y, offsetPos.z);
                }

                lastOffsetPos = offsetPos;
            });
        });

        const dGeo = new THREE.BufferGeometry();
        dGeo.setAttribute('position', new THREE.Float32BufferAttribute(diagramPoints, 3));

        const fGeo = new THREE.BufferGeometry();
        fGeo.setAttribute('position', new THREE.Float32BufferAttribute(fillPoints, 3));

        return { diagramGeometry: dGeo, fillGeometry: fGeo };
    }, [frames, jointMap, analysisResults, forceType, normalizationFactor]);

    const color = getForceColor(forceType);

    return (
        <group>
            {/* Diagram Curves */}
            <lineSegments geometry={diagramGeometry}>
                <lineBasicMaterial color={color} linewidth={2} />
            </lineSegments>

            {/* Fill Lines */}
            <lineSegments geometry={fillGeometry}>
                <lineBasicMaterial color={color} transparent opacity={0.4} />
            </lineSegments>
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
