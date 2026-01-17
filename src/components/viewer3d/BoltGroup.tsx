
import React from 'react';
import type { BoltConfig, SolverResult } from '../../types';
import { getUtilizationColor } from '../../utils';

interface BoltGroupProps {
    config: BoltConfig;
    plateThickness: number;
    flangeThickness: number; // to know grip length
    results: SolverResult['bolts'];
    position?: [number, number, number];
}

const Bolt: React.FC<{
    diameter: number;
    length: number;
    position: [number, number, number];
    color: string
}> = ({ diameter, length, position, color }) => {
    return (
        <group position={position} rotation={[0, 0, Math.PI / 2]}>
            {/* Shank */}
            <mesh castShadow>
                <cylinderGeometry args={[diameter / 2, diameter / 2, length, 16]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Head (Hex approximate) */}
            <mesh position={[0, length / 2 + diameter * 0.35, 0]}>
                <cylinderGeometry args={[diameter * 0.9, diameter * 0.9, diameter * 0.7, 6]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Nut */}
            <mesh position={[0, -length / 2 - diameter * 0.35, 0]}>
                <cylinderGeometry args={[diameter * 0.9, diameter * 0.9, diameter * 0.7, 6]} />
                <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
};

export const BoltGroup: React.FC<BoltGroupProps> = ({
    config, plateThickness, flangeThickness, results, position = [0, 0, 0]
}) => {
    // Bolt length = grip + extras (simplified)
    const gripLength = plateThickness + flangeThickness;
    const boltLength = gripLength;

    return (
        <group position={position}>
            {results.individualBolts.map((bolt) => (
                <Bolt
                    key={bolt.id}
                    diameter={config.diameter}
                    length={boltLength}
                    position={bolt.position}
                    color={getUtilizationColor(bolt.utilization)}
                />
            ))}
        </group>
    );
};
