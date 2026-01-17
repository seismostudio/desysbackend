import React from 'react';
import * as THREE from 'three';
import { Cone, Cylinder, Torus, Text } from '@react-three/drei';
import type { Loads } from '../../types';

interface LoadVisualizationProps {
    loads: Loads;
    origin?: [number, number, number];
    visible?: boolean;
}

const FORCE_COLOR = "#f87171"; // Red-400
const MOMENT_COLOR = "#60a5fa"; // Blue-400
const SCALE_FACTOR = 1.5; // mm per unit (kN or kNm)

const StraightArrow: React.FC<{
    value: number;
    direction: [number, number, number];
    label: string;
    position: [number, number, number];
}> = ({ value, direction, label, position }) => {
    if (Math.abs(value) < 0.1) return null;

    const length = Math.abs(value) * SCALE_FACTOR;
    const isNegative = value < 0;

    // Direction vector
    const dir = new THREE.Vector3(...direction).normalize();
    if (isNegative) dir.multiplyScalar(-1);

    // Quaternion to rotate from +Y default to target dir
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir
    );

    const arrowPos = new THREE.Vector3(...position).add(dir.clone().multiplyScalar(length / 2));


    return (
        <group position={[arrowPos.x, arrowPos.y, arrowPos.z]} quaternion={quaternion}>
            <Cylinder args={[2, 2, length, 8]}>
                <meshStandardMaterial color={FORCE_COLOR} emissive={FORCE_COLOR} emissiveIntensity={0.5} />
            </Cylinder>
            <group position={[0, length / 2, 0]}>
                <Cone args={[6, 12, 8]}>
                    <meshStandardMaterial color={FORCE_COLOR} emissive={FORCE_COLOR} emissiveIntensity={0.5} />
                </Cone>
            </group>
            {/* Label */}
            <group position={[0, length / 2 + 15, 0]}>
                <Text
                    fontSize={20}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={2}
                    outlineColor={FORCE_COLOR}
                >
                    {`${label}: ${Math.abs(value).toFixed(1)}`}
                </Text>
            </group>
        </group>
    );
};

const CurvedArrow: React.FC<{
    value: number;
    axisVector: [number, number, number];
    label: string;
    position: [number, number, number];
}> = ({ value, axisVector, label, position }) => {
    if (Math.abs(value) < 0.1) return null;

    const MIN_RADIUS = 30;
    const MOMENT_RADIUS_SCALE = 0.5;
    const radius = MIN_RADIUS + Math.abs(value) * MOMENT_RADIUS_SCALE;

    const isNegative = value < 0;
    const arc = Math.PI * 1.5; // 270 degrees

    // 1. Precise Axis Alignment using Quaternions
    // Default Torus plane is X-Y, rotation axis is local Z
    const dir = new THREE.Vector3(...axisVector).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        dir
    );

    return (
        <group position={position} quaternion={quaternion}>
            {/* Flip around X to reverse the arc direction for negative moments */}
            <group rotation={[isNegative ? Math.PI : 0, 0, 0]}>
                <Torus args={[radius, 1.5, 16, 32, arc]}>
                    <meshStandardMaterial color={MOMENT_COLOR} emissive={MOMENT_COLOR} emissiveIntensity={0.5} />
                </Torus>
                {/* Arrowhead at the end of the arc */}
                <group
                    position={[Math.cos(arc) * radius, Math.sin(arc) * radius, 0]}
                    rotation={[0, 0, arc]}
                >
                    <Cone args={[5, 12, 8]}>
                        <meshStandardMaterial color={MOMENT_COLOR} emissive={MOMENT_COLOR} emissiveIntensity={0.5} />
                    </Cone>
                </group>
            </group>
            {/* Label position */}
            <group position={[0, radius + 25, 0]}>
                <Text
                    fontSize={24}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={2}
                    outlineColor={MOMENT_COLOR}
                >
                    {`${label}: ${Math.abs(value).toFixed(1)}`}
                </Text>
            </group>
        </group>
    );
};

export const LoadVisualization: React.FC<LoadVisualizationProps> = ({ loads, origin = [0, 0, 0], visible = true }) => {
    if (!visible) return null;

    return (
        <group>
            {/* Straight Arrows for Forces */}
            {/* P (Axial) -> Along X */}
            <StraightArrow value={loads.axial} direction={[1, 0, 0]} label="P" position={origin} />

            {/* Vy (Shear Y) -> Along Y */}
            <StraightArrow value={loads.shearY} direction={[0, 1, 0]} label="Vy" position={origin} />

            {/* Vz (Shear Z) -> Along Z */}
            <StraightArrow value={loads.shearZ} direction={[0, 0, 1]} label="Vz" position={origin} />

            {/* Curved Arrows for Moments */}
            {/* Mx (Torsion) -> Around X */}
            <CurvedArrow value={loads.momentX} axisVector={[1, 0, 0]} label="Mx" position={origin} />

            {/* My (Weak Axis) -> Around Y */}
            <CurvedArrow value={loads.momentY} axisVector={[0, 1, 0]} label="My" position={origin} />

            {/* Mz (Strong Axis) -> Around Z */}
            <CurvedArrow value={loads.momentZ} axisVector={[0, 0, 1]} label="Mz" position={origin} />
        </group>
    );
};
