
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { FEAMeshData } from '../../types';

interface FEAMeshProps {
    data: FEAMeshData;
    stressView?: boolean;
    showMesh?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

const getStressColor = (util: number) => {
    const color = new THREE.Color();
    const clamped = Math.max(0, Math.min(1.5, util));
    if (clamped < 0.5) {
        color.setHSL(0.33 * (1 - clamped * 2), 1, 0.5);
    } else {
        const factor = Math.min(1, (clamped - 0.5));
        color.setHSL(0.12 * (1 - factor), 1, 0.5);
    }
    return color;
};

export const FEAMesh: React.FC<FEAMeshProps> = ({ data, stressView, showMesh = true, position = [0, 0, 0], rotation = [0, 0, 0] }) => {

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const vertices: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        // Map nodes to vertices
        data.nodes.forEach(node => {
            vertices.push(node.x, node.y, node.z);
            const c = getStressColor(node.stress || 0);
            colors.push(c.r, c.g, c.b);
        });

        // Map elements to indices (assuming quad elements for simplicity, convert to 2 tris)
        data.elements.forEach(el => {
            if (el.nodeIds.length === 4) {
                // Quad: 0-1-3, 0-3-2 (standard triangulation)
                indices.push(el.nodeIds[0], el.nodeIds[1], el.nodeIds[2]);
                indices.push(el.nodeIds[0], el.nodeIds[2], el.nodeIds[3]);
            } else if (el.nodeIds.length === 3) {
                indices.push(el.nodeIds[0], el.nodeIds[1], el.nodeIds[2]);
            }
        });

        geo.setIndex(indices);
        geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, [data]);

    return (
        <group position={position} rotation={rotation}>
            <mesh geometry={geometry} castShadow receiveShadow>
                <meshStandardMaterial
                    vertexColors={stressView}
                    color={stressView ? "white" : "#cbd5e0"}
                    metalness={0.5}
                    roughness={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {showMesh && (
                <lineSegments>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color="black" transparent opacity={0.2} />
                </lineSegments>
            )}
        </group>
    );
};
