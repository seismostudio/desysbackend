/**
 * Color utilities for visualization
 */

/**
 * Linear interpolation between two values
 */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Convert HSL to RGB hex color
 */
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Get color from displacement magnitude using gradient
 * Blue (low) → Cyan → Green → Yellow → Orange → Red (high)
 */
export function getDisplacementColor(magnitude: number, maxMagnitude: number): string {
    if (maxMagnitude === 0) return '#0000ff'; // Blue if no displacement

    const ratio = Math.min(magnitude / maxMagnitude, 1.0);

    // HSL gradient: Hue from 240° (blue) to 0° (red)
    const hue = lerp(240, 0, ratio);
    const saturation = 100;
    const lightness = 50;

    return hslToHex(hue, saturation, lightness);
}

/**
 * Get color for load pattern
 */
export function getLoadPatternColor(patternType: string): string {
    const colors: Record<string, string> = {
        'Dead': '#6b7280',      // Gray
        'Live': '#3b82f6',      // Blue
        'Wind': '#10b981',      // Green
        'Earthquake': '#ef4444', // Red
        'Snow': '#06b6d4',      // Cyan
        'Rain': '#8b5cf6',      // Purple
    };
    return colors[patternType] || '#9ca3af';
}

/**
 * Generate gradient legend colors
 */
export function generateLegendGradient(steps: number = 5): { color: string; ratio: number }[] {
    const result: { color: string; ratio: number }[] = [];
    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        const hue = lerp(240, 0, ratio);
        result.push({
            color: hslToHex(hue, 100, 50),
            ratio
        });
    }
    return result;
}
