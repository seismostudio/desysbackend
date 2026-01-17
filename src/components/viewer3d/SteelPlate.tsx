import React from 'react';
import type { PlateDimensions } from '../../types';
import * as THREE from 'three';

interface SteelPlateProps {
    dimensions: PlateDimensions;
    color?: string;
    position?: [number, number, number];
}

export const SteelPlate: React.FC<SteelPlateProps> = ({
    dimensions,
    color = "#cbd5e0",
    position = [0, 0, 0]
}) => {
    const { width, height, thickness } = dimensions;

    return (
        <group position={position}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[thickness, height, width]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.5}
                    roughness={0.5}
                />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(thickness, height, width)]} />
                <lineBasicMaterial color="black" transparent opacity={0.3} />
            </lineSegments>
        </group>
    );
};
