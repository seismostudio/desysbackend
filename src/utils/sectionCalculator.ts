import type { SectionProperties } from '../types/structuralTypes';

/**
 * Calculate section properties for a rectangular section
 * @param width - Width in meters
 * @param height - Height in meters
 * @returns Section properties
 */
export function calculateRectangular(width: number, height: number): SectionProperties {
    const A = width * height;
    const Ix = 0; // Not typically used for beam analysis
    const Iy = (width * Math.pow(height, 3)) / 12;
    const Iz = (height * Math.pow(width, 3)) / 12;
    const J = (width * height * Math.pow(Math.min(width, height), 2)) / 12; // Approximate torsion constant
    const Sy = Iy / (height / 2);
    const Sz = Iz / (width / 2);

    return { A, Ix, Iy, Iz, J, Sy, Sz };
}

/**
 * Calculate section properties for a circular section
 * @param diameter - Diameter in meters
 * @returns Section properties
 */
export function calculateCircular(diameter: number): SectionProperties {
    const r = diameter / 2;
    const A = Math.PI * r * r;
    const Ix = 0;
    const Iy = (Math.PI * Math.pow(r, 4)) / 4;
    const Iz = Iy;
    const J = (Math.PI * Math.pow(r, 4)) / 2;
    const Sy = Iy / r;
    const Sz = Iz / r;

    return { A, Ix, Iy, Iz, J, Sy, Sz };
}

/**
 * Calculate section properties for a circular tube (pipe)
 * @param outerDiameter - Outer diameter in meters
 * @param wallThickness - Wall thickness in meters
 * @returns Section properties
 */
export function calculateTube(outerDiameter: number, wallThickness: number): SectionProperties {
    const ro = outerDiameter / 2;
    const ri = ro - wallThickness;
    const A = Math.PI * (ro * ro - ri * ri);
    const Ix = 0;
    const Iy = (Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4))) / 4;
    const Iz = Iy;
    const J = (Math.PI * (Math.pow(ro, 4) - Math.pow(ri, 4))) / 2;
    const Sy = Iy / ro;
    const Sz = Iz / ro;

    return { A, Ix, Iy, Iz, J, Sy, Sz };
}

/**
 * Calculate section properties for a hollow rectangular section (box)
 * @param width - Outer width in meters
 * @param height - Outer height in meters
 * @param wallThickness - Wall thickness in meters
 * @returns Section properties
 */
export function calculateHollow(width: number, height: number, wallThickness: number): SectionProperties {
    const wi = width - 2 * wallThickness;
    const hi = height - 2 * wallThickness;

    const A = width * height - wi * hi;
    const Ix = 0;
    const Iy = (width * Math.pow(height, 3) - wi * Math.pow(hi, 3)) / 12;
    const Iz = (height * Math.pow(width, 3) - hi * Math.pow(wi, 3)) / 12;

    // Torsion constant for thin-walled closed section
    const t = wallThickness;
    const Am = wi * hi; // Enclosed area
    const perimeter = 2 * (wi + hi);
    const J = (4 * Am * Am * t) / perimeter;

    const Sy = Iy / (height / 2);
    const Sz = Iz / (width / 2);

    return { A, Ix, Iy, Iz, J, Sy, Sz };
}

/**
 * Calculate section properties for an I-section (wide flange)
 * @param depth - Total depth in meters
 * @param flangeWidth - Flange width in meters
 * @param webThickness - Web thickness in meters
 * @param flangeThickness - Flange thickness in meters
 * @returns Section properties
 */
export function calculateISection(
    depth: number,
    flangeWidth: number,
    webThickness: number,
    flangeThickness: number
): SectionProperties {
    // Area
    const A = 2 * flangeWidth * flangeThickness + (depth - 2 * flangeThickness) * webThickness;

    const Ix = 0;

    // Moment of inertia about strong axis (y-axis, parallel to flanges)
    const Iy = (flangeWidth * Math.pow(depth, 3)) / 12 -
        ((flangeWidth - webThickness) * Math.pow(depth - 2 * flangeThickness, 3)) / 12;

    // Moment of inertia about weak axis (z-axis, perpendicular to web)
    const Iz = (2 * flangeThickness * Math.pow(flangeWidth, 3)) / 12 +
        ((depth - 2 * flangeThickness) * Math.pow(webThickness, 3)) / 12;

    // Torsion constant (approximate for I-sections)
    const J = (1 / 3) * (2 * flangeWidth * Math.pow(flangeThickness, 3) +
        (depth - 2 * flangeThickness) * Math.pow(webThickness, 3));

    const Sy = Iy / (depth / 2);
    const Sz = Iz / (flangeWidth / 2);

    return { A, Ix, Iy, Iz, J, Sy, Sz };
}

/**
 * Format section properties for display
 * @param props - Section properties
 * @returns Formatted string object
 */
export function formatSectionProperties(props: SectionProperties): {
    A: string;
    Iy: string;
    Iz: string;
    J: string;
    Sy: string;
    Sz: string;
} {
    return {
        A: (props.A * 1e4).toFixed(2) + ' cm²',
        Iy: (props.Iy * 1e8).toFixed(2) + ' cm⁴',
        Iz: (props.Iz * 1e8).toFixed(2) + ' cm⁴',
        J: (props.J * 1e8).toFixed(2) + ' cm⁴',
        Sy: (props.Sy * 1e6).toFixed(2) + ' cm³',
        Sz: (props.Sz * 1e6).toFixed(2) + ' cm³',
    };
}
