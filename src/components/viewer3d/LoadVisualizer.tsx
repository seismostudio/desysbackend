import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
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
    joints,
    loadPatterns,
    filterType,
    filterPattern,
    showLoads,
}: LoadVisualizerProps) {
    const filteredLoads = useMemo(() => {
        if (!showLoads) return [];

        let loads = pointLoads;

        if (filterPattern !== 'all') {
            loads = loads.filter(l => l.patternId === filterPattern);
        }

        if (filterType === 'point' || filterType === 'all') {
            return loads;
        }

        return [];
    }, [pointLoads, filterType, filterPattern, showLoads]);

    if (!showLoads || filteredLoads.length === 0) return null;

    return (
        <group>
            {filteredLoads.map((load) => {
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

                // Arrow length based on magnitude (scaled for visibility)
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
                        <Html position={[position.x, position.y + 0.5, position.z]} center>
                            <div className="bg-white/80 px-2 py-1 rounded text-[10px] font-mono border border-gray-300 pointer-events-none">
                                {forceMag.toFixed(1)} kN
                            </div>
                        </Html>
                    </group>
                );
            })}
        </group>
    );
}
