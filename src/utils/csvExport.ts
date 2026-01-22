import type { AnalysisResults } from '../types/structuralTypes';

export function downloadCSV(filename: string, text: string) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

export function generateDisplacementsCSV(resultsMap: Record<string, AnalysisResults>, selectedIds: string[]): string {
    const header = ['Case', 'Joint', 'Ux (mm)', 'Uy (mm)', 'Uz (mm)'].join(',');
    const rows = selectedIds.flatMap(id => {
        const res = resultsMap[id];
        if (!res) return [];
        return res.displacements.map(d => [
            res.caseName,
            d.jointId,
            (d.ux * 1000).toFixed(4),
            (d.uy * 1000).toFixed(4),
            (d.uz * 1000).toFixed(4)
        ].join(','));
    });
    return [header, ...rows].join('\n');
}

export function generateFrameForcesCSV(
    resultsMap: Record<string, AnalysisResults>,
    selectedIds: string[],
    frames: any[],
    sections: any[]
): string {
    const frameMap = new Map(frames.map(f => [f.id, f]));
    const sectionMap = new Map(sections.map(s => [s.id, s]));

    const header = ['Case', 'Frame', 'Section', 'Station', 'P (kN)', 'V2 (kN)', 'V3 (kN)', 'M2 (kNm)', 'M3 (kNm)', 'T (kNm)'].join(',');
    const rows = selectedIds.flatMap(id => {
        const res = resultsMap[id];
        if (!res || !res.frameDetailedResults) return [];

        return Object.entries(res.frameDetailedResults).flatMap(([frameIdStr, detail]) => {

            const frameId = Number(frameIdStr);
            const frame = frameMap.get(frameId);
            const section = frame && frame.sectionId ? sectionMap.get(frame.sectionId) : null;
            const sectionName = section ? section.name : 'Unknown';

            return detail.forces.map((force, index) => [
                res.caseName,
                frameId,
                sectionName,
                index + 1,
                force.P.toFixed(4),
                force.V2.toFixed(4),
                force.V3.toFixed(4),
                force.M2.toFixed(4),
                force.M3.toFixed(4),
                force.T.toFixed(4)
            ].join(','));
        });
    });
    return [header, ...rows].join('\n');
}

export function generateReactionsCSV(
    resultsMap: Record<string, AnalysisResults>,
    selectedIds: string[],
    joints: any[]
): string {
    const header = ['Case', 'Joint', 'Fx (kN)', 'Fy (kN)', 'Fz (kN)', 'Mx (kNm)', 'My (kNm)', 'Mz (kNm)'].join(',');
    const rows = selectedIds.flatMap(id => {
        const res = resultsMap[id];
        if (!res || !res.reactions) return [];

        return res.reactions
            .filter(r => {
                const joint = joints.find(j => j.id === r.jointId);
                if (!joint || !joint.restraint) return false;
                const { ux, uy, uz, rx, ry, rz } = joint.restraint;
                return ux || uy || uz || rx || ry || rz;
            })
            .map(r => [
                res.caseName,
                r.jointId,
                r.fx.toFixed(4),
                r.fy.toFixed(4),
                r.fz.toFixed(4),
                r.mx.toFixed(4),
                r.my.toFixed(4),
                r.mz.toFixed(4)
            ].join(','));
    });
    return [header, ...rows].join('\n');
}
