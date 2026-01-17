
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Color scale for utilization - Smooth Gradient
export function getUtilizationColor(util: number): string {
    const u = Math.min(Math.max(util, 0), 1.05); // Clamp slightly above 1.0

    // Stop colors (RGB)
    const green = [74, 222, 128];  // #4ade80
    const yellow = [250, 204, 21]; // #facc15
    const red = [239, 68, 68];     // #ef4444
    const darkRed = [185, 28, 28]; // #b91c1c

    let r, g, b;

    if (u <= 0.5) {
        const t = u / 0.5;
        r = Math.round(green[0] + (yellow[0] - green[0]) * t);
        g = Math.round(green[1] + (yellow[1] - green[1]) * t);
        b = Math.round(green[2] + (yellow[2] - green[2]) * t);
    } else if (u <= 1.0) {
        const t = (u - 0.5) / 0.5;
        r = Math.round(yellow[0] + (red[0] - yellow[0]) * t);
        g = Math.round(yellow[1] + (red[1] - yellow[1]) * t);
        b = Math.round(yellow[2] + (red[2] - yellow[2]) * t);
    } else {
        const t = Math.min((u - 1.0) / 0.05, 1.0);
        r = Math.round(red[0] + (darkRed[0] - red[0]) * t);
        g = Math.round(red[1] + (darkRed[1] - red[1]) * t);
        b = Math.round(red[2] + (darkRed[2] - red[2]) * t);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

export function getUtilizationColorClass(util: number): string {
    if (util < 0.6) return "text-green-500";
    if (util <= 1.0) return "text-yellow-500";
    return "text-red-500";
}
