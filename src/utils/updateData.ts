export interface SoftwareUpdate {
    version: string;
    date: string;
    changes: string[];
}

export const SOFTWARE_UPDATES: SoftwareUpdate[] = [
    {
        version: '1.0.0',
        date: '2026-02-03',
        changes: [
            'Implemented login.',
            'Added project metadata tracking (Version, Author, Last Edited).',
            'Added Updates Notification.',
            'bug fixes.',
        ]
    },
    {
        version: '0.7.5',
        date: '2026-01-27',
        changes: [
            'Initial 3D Structural Analysis engine deployment.',
            'Support for Frame and Shell elements modeling.',
            'Real-time deformation and internal force visualization.',
            'DXF import support for geometric entities.',
            'Material and Section property management.'
        ]
    }
];
