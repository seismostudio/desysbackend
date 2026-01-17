
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { HaunchConfig } from '../../types';

interface SteelHaunchProps {
    config: HaunchConfig;
    color?: string;
    position?: [number, number, number];
}

export const SteelHaunch: React.FC<SteelHaunchProps> = ({
    config,
    color = "#a0aEC0",
    position = [0, 0, 0]
}) => {
    const { length, depth, thickness, flangeWidth, flangeThickness } = config;

    // Web shape (Triangle)
    const webShape = useMemo(() => {
        const s = new THREE.Shape();
        // Start at local (0,0) which is underside of beam
        s.moveTo(0, 0);
        s.lineTo(length, 0); // Along beam
        s.lineTo(0, -depth); // Down along plate
        s.lineTo(0, 0);
        return s;
    }, [length, depth]);

    // Flange shape (Long rectangle that follows the hypotenuse)
    // The angle is atan(depth/length)
    const hypotenuse = Math.sqrt(length * length + depth * depth);

    const extrudeWebSettings = useMemo(() => ({
        depth: thickness,
        bevelEnabled: false,
    }), [thickness]);

    return (
        <group position={position}>
            {/* 1. HAUNCH WEB */}
            <mesh castShadow receiveShadow position={[0, 0, -thickness / 2]}>
                <extrudeGeometry args={[webShape, extrudeWebSettings]} />
                <meshStandardMaterial color={color} metalness={0.6} roughness={0.4} />
            </mesh>

            {/* 2. HAUNCH FLANGE */}
            <group
                castShadow
                receiveShadow
                position={[0, -depth, -flangeWidth / 2]}
                rotation={[0, 0, Math.atan2(depth, length)]}
            >
                {/* Box Y center: we want bottom face at 0 (slope line). So position Y = +thick/2 */}
                <mesh position={[hypotenuse / 2, -flangeThickness / 2, flangeWidth / 2]}>
                    <boxGeometry args={[hypotenuse, flangeThickness, flangeWidth]} />
                    <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
                </mesh>
            </group>

            {/* Outlines (simplified) */}
            <lineSegments position={[0, 0, -thickness / 2]}>
                <edgesGeometry args={[new THREE.ExtrudeGeometry(webShape, extrudeWebSettings)]} />
                <lineBasicMaterial color="black" transparent opacity={0.3} />
            </lineSegments>
        </group>
    );
};
