
import React, { useMemo } from 'react';
import type { ConnectionConfig, Dimensions } from '../../types';
import type { HaunchConfig } from '../../types';
import * as THREE from 'three';

interface WeldProps {
    config: ConnectionConfig;
    dimensions: Dimensions;
    haunched?: boolean;
    haunchedConfig?: HaunchConfig;
    color?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    transparent?: boolean;
    opacity?: number;
}

// Helper to create I-section shape

// Top Weld outer
const createweld1 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const h = d.depth;
    const a = config.welds.size;

    shape.moveTo(h / 2, 0);
    shape.lineTo(h / 2, -a);
    shape.lineTo(h / 2 + a, 0);
    return shape;
};

// Top Weld inner
const createweld2 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const tf = d.flangeThickness;
    const h = d.depth - 2 * tf;
    const a = config.welds.size;

    shape.moveTo(h / 2, 0);
    shape.lineTo(h / 2, -a);
    shape.lineTo(h / 2 - a, 0);
    return shape;
};

// Bottom Weld outer
const createweld3 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const h = d.depth;
    const a = config.welds.size;

    shape.moveTo(-h / 2, 0);
    shape.lineTo(-h / 2, -a);
    shape.lineTo(-h / 2 - a, 0);
    return shape;
};

// Bottom Weld inner
const createweld4 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const tf = d.flangeThickness;
    const h = d.depth - 2 * tf;
    const a = config.welds.size;

    shape.moveTo(-h / 2, 0);
    shape.lineTo(-h / 2, -a);
    shape.lineTo(-h / 2 + a, 0);
    return shape;
};

// Left Weld
const createweld5 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const wt2 = d.webThickness / 2;
    const a = config.welds.size;

    shape.moveTo(0, wt2);
    shape.lineTo(0, (wt2 + a));
    shape.lineTo(a, wt2);
    return shape;
};

// Right Weld
const createweld6 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const wt2 = d.webThickness / 2;
    const a = config.welds.size;

    shape.moveTo(0, -wt2);
    shape.lineTo(0, (-wt2 - a));
    shape.lineTo(a, -wt2);
    return shape;
};

// Left Haunched Weld
const createweld7 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const wt2 = d.webThickness / 2;
    const a = config.welds.size;

    shape.moveTo(0, wt2);
    shape.lineTo(0, (wt2 + a));
    shape.lineTo(a, wt2);
    return shape;
};

// Right Haunched Weld
const createweld8 = (d: Dimensions, config: ConnectionConfig) => {
    const shape = new THREE.Shape();
    const wt2 = d.webThickness / 2;
    const a = config.welds.size;

    shape.moveTo(0, -wt2);
    shape.lineTo(0, (-wt2 - a));
    shape.lineTo(a, -wt2);
    return shape;
};

// Bottom Haunched Weld
const createweld9 = (config: ConnectionConfig, haunchedConfig?: HaunchConfig) => {
    const shape = new THREE.Shape();
    const hw = haunchedConfig?.depth;
    const a = config.welds.size;

    if (!hw) return;
    shape.moveTo(-hw, 0);
    shape.lineTo(-hw, -a);
    shape.lineTo(-hw + a, 0);
    return shape;
};

export const FlangeWeld: React.FC<WeldProps> = ({
    config, dimensions, color = "#1c44b1ff", position = [0, 0, 0], rotation = [0, 0, 0],
    transparent = false, opacity = 1.0
}) => {
    const shape1 = useMemo(() =>
        createweld1(dimensions, config),
        [dimensions, config.welds.size]);

    const shape2 = useMemo(() =>
        createweld2(dimensions, config),
        [dimensions, config.welds.size]);

    const shape3 = useMemo(() =>
        createweld3(dimensions, config),
        [dimensions, config.welds.size]);

    const shape4 = useMemo(() =>
        createweld4(dimensions, config),
        [dimensions, config.welds.size]);

    const extrudeSettings = useMemo(() => ({
        depth: dimensions.width,
        bevelEnabled: false,
    }), [dimensions.width]);

    return (
        <group position={position} rotation={rotation}>
            {config.welds.outerFlangeWeld &&
                <>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape1, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape1, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape3, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape3, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                </>
            }
            {config.welds.innerFlangeWeld &&
                <>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape2, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape2, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape4, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape4, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                </>
            }
        </group>
    );
};

export const WebWeld: React.FC<WeldProps> = ({
    config, dimensions, color = "#1c44b1ff", position = [0, 0, 0], rotation = [0, 0, 0],
    transparent = false, opacity = 1.0
}) => {
    const shape5 = useMemo(() =>
        createweld5(dimensions, config),
        [dimensions, config.welds.size]);

    const shape6 = useMemo(() =>
        createweld6(dimensions, config),
        [dimensions, config.welds.size]);

    const extrudeSettings = useMemo(() => ({
        depth: dimensions.depth - 2 * dimensions.flangeThickness,
        bevelEnabled: false,
    }), [dimensions.depth, dimensions.flangeThickness]);

    return (
        <group position={position} rotation={rotation}>
            {config.welds.webWeld &&
                <>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape5, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape5, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape6, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape6, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                </>
            }
        </group>
    );
};

export const WebHaunchedWeld: React.FC<WeldProps> = ({
    config, dimensions, haunchedConfig, color = "#1c44b1ff", position = [0, 0, 0], rotation = [0, 0, 0],
    transparent = false, opacity = 1.0
}) => {
    const shape7 = useMemo(() =>
        createweld7(dimensions, config),
        [dimensions, config.welds.size]);

    const shape8 = useMemo(() =>
        createweld8(dimensions, config),
        [dimensions, config.welds.size]);

    const extrudeSettings = useMemo(() => ({
        depth: haunchedConfig?.depth,
        bevelEnabled: false,
    }), [haunchedConfig?.depth]);

    return (
        <group position={position} rotation={rotation}>
            {config.welds.haunchWebWeld &&
                <>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape7, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape7, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape8, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape8, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                </>
            }
        </group>
    );
};

export const FlangeHaunchedWeld: React.FC<WeldProps> = ({
    config, haunchedConfig, color = "#1c44b1ff", position = [0, 0, 0], rotation = [0, 0, 0],
    transparent = false, opacity = 1.0
}) => {
    const shape9 = useMemo(() =>
        createweld9(config, haunchedConfig),
        [config.welds.size, haunchedConfig]);

    const extrudeSettings = useMemo(() => ({
        depth: haunchedConfig?.flangeWidth,
        bevelEnabled: false,
    }), [haunchedConfig?.flangeWidth]);

    return (
        <group position={position} rotation={rotation}>
            {config.welds.haunchFlangeWeld &&
                <>
                    <mesh castShadow receiveShadow>
                        <extrudeGeometry args={[shape9, extrudeSettings]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.6}
                            roughness={0.4}
                            transparent={transparent}
                            opacity={opacity}
                        />
                    </mesh>
                    <lineSegments>
                        <edgesGeometry args={[new THREE.ExtrudeGeometry(shape9, extrudeSettings)]} />
                        <lineBasicMaterial color="black" transparent opacity={0.3} />
                    </lineSegments>
                </>
            }
        </group>
    );
};

