
import React, { useMemo } from 'react';
import type { Dimensions } from '../../types';
import * as THREE from 'three';

interface SteelMemberProps {
    dimensions: Dimensions;
    length: number;
    color?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    transparent?: boolean;
    opacity?: number;
}

// Helper to create I-section shape
const createIShape = (d: Dimensions) => {
    const shape = new THREE.Shape();
    const w = d.width;
    const h = d.depth;
    const tf = d.flangeThickness;
    const tw = d.webThickness;

    shape.moveTo(-w / 2, h / 2);
    shape.lineTo(w / 2, h / 2);
    shape.lineTo(w / 2, h / 2 - tf);
    shape.lineTo(tw / 2, h / 2 - tf);
    shape.lineTo(tw / 2, -h / 2 + tf);
    shape.lineTo(w / 2, -h / 2 + tf);
    shape.lineTo(w / 2, -h / 2);
    shape.lineTo(-w / 2, -h / 2);
    shape.lineTo(-w / 2, -h / 2 + tf);
    shape.lineTo(-tw / 2, -h / 2 + tf);
    shape.lineTo(-tw / 2, h / 2 - tf);
    shape.lineTo(-w / 2, h / 2 - tf);
    shape.lineTo(-w / 2, h / 2);

    return shape;
};

export const SteelMember: React.FC<SteelMemberProps> = ({
    dimensions, length, color = "#a0aEC0", position = [0, 0, 0], rotation = [0, 0, 0],
    transparent = false, opacity = 1.0
}) => {
    const shape = useMemo(() => createIShape(dimensions), [dimensions]);

    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false,
    }), [length]);

    return (
        <group position={position} rotation={rotation}>
            <mesh castShadow receiveShadow>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.6}
                    roughness={0.4}
                    transparent={transparent}
                    opacity={opacity}
                />
            </mesh>
            <lineSegments>
                <edgesGeometry args={[new THREE.ExtrudeGeometry(shape, extrudeSettings)]} />
                <lineBasicMaterial color="black" transparent opacity={0.3} />
            </lineSegments>
        </group>
    );
};
