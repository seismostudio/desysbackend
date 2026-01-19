import { useMemo } from 'react';
import * as THREE from 'three';

export function DeformedFrame({ points, colors }: { points: THREE.Vector3[]; colors: string[] }) {
    const lineObj = useMemo(() => {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Create color attribute
        const count = points.length;
        const colorArray = new Float32Array(count * 3);
        const tempColor = new THREE.Color();

        for (let i = 0; i < count; i++) {
            // Use the provided color or fallback to white
            tempColor.set(colors[i] || '#ffffff');
            colorArray[i * 3] = tempColor.r;
            colorArray[i * 3 + 1] = tempColor.g;
            colorArray[i * 3 + 2] = tempColor.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true, // Enable vertex coloring
            linewidth: 10
        });

        return new THREE.Line(geometry, material);
    }, [points, colors]);

    return <primitive object={lineObj} />;
}
