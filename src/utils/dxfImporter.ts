import DxfParser from 'dxf-parser';
import type { Joint, Frame } from '../types/structuralTypes';

export interface DxfImportResult {
    joints: Joint[];
    frames: Frame[];
}

export function importFromDxf(dxfContent: string, existingJointsCount: number = 0, existingFramesCount: number = 0): DxfImportResult {
    const parser = new DxfParser();
    let dxf: any;
    try {
        dxf = parser.parseSync(dxfContent);
    } catch (err) {
        console.error('Failed to parse DXF:', err);
        throw new Error('Invalid DXF file');
    }

    const joints: Joint[] = [];
    const frames: Frame[] = [];
    const pointMap = new Map<string, number>();
    const TOLERANCE = 0.001;

    let nextJointId = existingJointsCount + 1;
    let nextFrameId = existingFramesCount + 1;

    function getJointId(x: number, y: number, z: number = 0): number {
        // Round to tolerance to match points
        const rx = Math.round(x / TOLERANCE) * TOLERANCE;
        const ry = Math.round(y / TOLERANCE) * TOLERANCE;
        const rz = Math.round(z / TOLERANCE) * TOLERANCE;

        const key = `${rx.toFixed(4)},${ry.toFixed(4)},${rz.toFixed(4)}`;

        if (pointMap.has(key)) {
            return pointMap.get(key)!;
        }

        const id = nextJointId++;
        joints.push({ id, x: -rx, y: ry, z: rz });
        pointMap.set(key, id);
        return id;
    }

    if (dxf && dxf.entities) {
        dxf.entities.forEach((entity: any) => {
            if (entity.type === 'LINE') {
                const jointI = getJointId(entity.vertices[0].x, entity.vertices[0].z || 0, entity.vertices[0].y);
                const jointJ = getJointId(entity.vertices[1].x, entity.vertices[1].z || 0, entity.vertices[1].y);

                if (jointI !== jointJ) {
                    frames.push({
                        id: nextFrameId++,
                        jointI,
                        jointJ,
                        orientation: 0,
                        offsetY: 0,
                        offsetZ: 0,
                    });
                }
            } else if (entity.type === 'LWPOLYLINE') {
                const vertices = entity.vertices;
                for (let i = 0; i < vertices.length - 1; i++) {
                    const jointI = getJointId(vertices[i].x, entity.elevation || 0, vertices[i].y);
                    const jointJ = getJointId(vertices[i + 1].x, entity.elevation || 0, vertices[i + 1].y);

                    if (jointI !== jointJ) {
                        frames.push({
                            id: nextFrameId++,
                            jointI,
                            jointJ,
                            orientation: 0,
                            offsetY: 0,
                            offsetZ: 0,
                        });
                    }
                }
                if (entity.shape && vertices.length > 2) {
                    // Closed polyline
                    const jointI = getJointId(vertices[vertices.length - 1].x, entity.elevation || 0, vertices[vertices.length - 1].y);
                    const jointJ = getJointId(vertices[0].x, entity.elevation || 0, vertices[0].y);
                    if (jointI !== jointJ) {
                        frames.push({
                            id: nextFrameId++,
                            jointI,
                            jointJ,
                            orientation: 0,
                            offsetY: 0,
                            offsetZ: 0,
                        });
                    }
                }
            } else if (entity.type === 'POLYLINE') {
                const vertices = entity.vertices;
                for (let i = 0; i < vertices.length - 1; i++) {
                    const jointI = getJointId(vertices[i].x, vertices[i].z || 0, vertices[i].y);
                    const jointJ = getJointId(vertices[i + 1].x, vertices[i + 1].z || 0, vertices[i + 1].y);

                    if (jointI !== jointJ) {
                        frames.push({
                            id: nextFrameId++,
                            jointI,
                            jointJ,
                            orientation: 0,
                            offsetY: 0,
                            offsetZ: 0,
                        });
                    }
                }
            }
        });
    }

    return { joints, frames };
}
