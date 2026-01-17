import type { Dimensions } from '../types';

export interface ProfileData extends Dimensions {
    name: string;
}

export const IWF_PROFILES: ProfileData[] = [
    { name: "IWF 100.50.5.7", depth: 100, width: 50, webThickness: 5, flangeThickness: 7, rootRadius: 8 },
    { name: "IWF 100.100.6.8", depth: 100, width: 100, webThickness: 6, flangeThickness: 8, rootRadius: 10 },
    { name: "IWF 125.60.6.8", depth: 125, width: 60, webThickness: 6, flangeThickness: 8, rootRadius: 9 },
    { name: "IWF 125.125.6,5.9", depth: 125, width: 125, webThickness: 6.5, flangeThickness: 9, rootRadius: 10 },
    { name: "IWF 150.75.5.7", depth: 150, width: 75, webThickness: 5, flangeThickness: 7, rootRadius: 8 },
    { name: "IWF 148.100.6.9", depth: 148, width: 100, webThickness: 6, flangeThickness: 9, rootRadius: 11 },
    { name: "IWF 150.150.7.10", depth: 150, width: 150, webThickness: 7, flangeThickness: 10, rootRadius: 11 },
    { name: "IWF 175.90.5.8", depth: 175, width: 90, webThickness: 5, flangeThickness: 8, rootRadius: 9 },
    { name: "IWF 175.175.7,5.11", depth: 175, width: 175, webThickness: 7.5, flangeThickness: 11, rootRadius: 12 },
    { name: "IWF 198.99.4,5.7", depth: 198, width: 99, webThickness: 4.5, flangeThickness: 7, rootRadius: 11 },
    { name: "IWF 200.100.5,5.8", depth: 200, width: 100, webThickness: 5.5, flangeThickness: 8, rootRadius: 11 },
    { name: "IWF 194.150.4,5.7", depth: 194, width: 150, webThickness: 4.5, flangeThickness: 7, rootRadius: 13 },
    { name: "IWF 200.200.8.12", depth: 200, width: 200, webThickness: 8, flangeThickness: 12, rootRadius: 11 },
    { name: "IWF 248.124.5.8", depth: 248, width: 124, webThickness: 5, flangeThickness: 8, rootRadius: 12 },
    { name: "IWF 250.125.6.9", depth: 250, width: 125, webThickness: 6, flangeThickness: 9, rootRadius: 12 },
    { name: "IWF 244.175.7.11", depth: 244, width: 175, webThickness: 7, flangeThickness: 11, rootRadius: 16 },
    { name: "IWF 250.250.9.14", depth: 250, width: 250, webThickness: 9, flangeThickness: 14, rootRadius: 16 },
    { name: "IWF 298.149.5,5.8", depth: 298, width: 149, webThickness: 5.5, flangeThickness: 8, rootRadius: 16 },
    { name: "IWF 300.150.6,5.9", depth: 300, width: 150, webThickness: 6.5, flangeThickness: 9, rootRadius: 13 },
    { name: "IWF 300.305.15.15", depth: 300, width: 305, webThickness: 15, flangeThickness: 15, rootRadius: 18 },
    { name: "IWF 346.174.6.9", depth: 346, width: 174, webThickness: 6, flangeThickness: 9, rootRadius: 14 },
    { name: "IWF 350.175.7.11", depth: 350, width: 175, webThickness: 7, flangeThickness: 11, rootRadius: 14 },
    { name: "IWF 340.250.9.14", depth: 340, width: 250, webThickness: 9, flangeThickness: 14, rootRadius: 20 },
    { name: "IWF 350.350.12.19", depth: 350, width: 350, webThickness: 12, flangeThickness: 19, rootRadius: 20 },
    { name: "IWF 396.199.7.11", depth: 396, width: 199, webThickness: 7, flangeThickness: 11, rootRadius: 16 },
    { name: "IWF 400.200.8.13", depth: 400, width: 200, webThickness: 8, flangeThickness: 13, rootRadius: 16 },
    { name: "IWF 390.300.10.16", depth: 390, width: 300, webThickness: 10, flangeThickness: 16, rootRadius: 22 },
    { name: "IWF 400.400.13.21", depth: 400, width: 400, webThickness: 13, flangeThickness: 21, rootRadius: 22 },
    { name: "IWF 450.225.9.14", depth: 450, width: 225, webThickness: 9, flangeThickness: 14, rootRadius: 18 },
    { name: "IWF 440.300.11.18", depth: 440, width: 300, webThickness: 11, flangeThickness: 18, rootRadius: 24 },
    { name: "IWF 496.199.9.14", depth: 496, width: 199, webThickness: 9, flangeThickness: 14, rootRadius: 20 },
    { name: "IWF 500.200.10.16", depth: 500, width: 200, webThickness: 10, flangeThickness: 16, rootRadius: 20 },
    { name: "IWF 482.300.11.15", depth: 482, width: 300, webThickness: 11, flangeThickness: 15, rootRadius: 26 },
    { name: "IWF 488.300.11.18", depth: 488, width: 300, webThickness: 11, flangeThickness: 18, rootRadius: 26 },
    { name: "IWF 596.199.10.15", depth: 596, width: 199, webThickness: 10, flangeThickness: 15, rootRadius: 22 },
    { name: "IWF 600.200.11.17", depth: 600, width: 200, webThickness: 11, flangeThickness: 17, rootRadius: 22 },
    { name: "IWF 582.300.12.17", depth: 582, width: 300, webThickness: 12, flangeThickness: 17, rootRadius: 28 },
    { name: "IWF 588.300.12.20", depth: 588, width: 300, webThickness: 12, flangeThickness: 20, rootRadius: 28 },
    { name: "IWF 700.300.13.24", depth: 700, width: 300, webThickness: 13, flangeThickness: 24, rootRadius: 28 },
    { name: "IWF 800.300.14.26", depth: 800, width: 300, webThickness: 14, flangeThickness: 26, rootRadius: 28 },
    { name: "IWF 900.300.16.28", depth: 900, width: 300, webThickness: 16, flangeThickness: 28, rootRadius: 28 },
];

export const IPE_PROFILES: ProfileData[] = [
    { name: "IPE 100", depth: 100, width: 55, webThickness: 4.1, flangeThickness: 5.7, rootRadius: 7 },
    { name: "IPE 200", depth: 200, width: 100, webThickness: 5.6, flangeThickness: 8.5, rootRadius: 12 },
    { name: "IPE 300", depth: 300, width: 150, webThickness: 7.1, flangeThickness: 10.7, rootRadius: 15 },
    { name: "IPE 400", depth: 400, width: 180, webThickness: 8.6, flangeThickness: 13.5, rootRadius: 21 },
    { name: "IPE 500", depth: 500, width: 200, webThickness: 10.2, flangeThickness: 16.0, rootRadius: 21 },
    { name: "IPE 600", depth: 600, width: 220, webThickness: 12.0, flangeThickness: 19.0, rootRadius: 24 },
];

export const HEB_PROFILES: ProfileData[] = [
    { name: "HEB 100", depth: 100, width: 100, webThickness: 6.0, flangeThickness: 10.0, rootRadius: 12 },
    { name: "HEB 200", depth: 200, width: 200, webThickness: 9.0, flangeThickness: 15.0, rootRadius: 18 },
    { name: "HEB 300", depth: 300, width: 300, webThickness: 10.0, flangeThickness: 19.0, rootRadius: 27 },
    { name: "HEB 400", depth: 400, width: 300, webThickness: 13.5, flangeThickness: 24.0, rootRadius: 27 },
    { name: "HEB 500", depth: 500, width: 300, webThickness: 14.5, flangeThickness: 28.0, rootRadius: 27 },
];

export const ALL_PROFILES = [...IWF_PROFILES, ...IPE_PROFILES, ...HEB_PROFILES];
