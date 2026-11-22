// The Gilded Vault floor plan: one museum hall at night. Walls and display cases
// block movement and sight; crates block sight and movement and are the thief's
// cover; shadow pools hide the thief (alarm drains fast there); velvet ropes and
// rugs are decoration only. Coordinates are in the 1280x720 view space.
import { VIEW } from './config.js';

export const WALL = 26; // border wall thickness

// Solid rectangles: {x, y, w, h, kind: 'wall'|'case'|'crate', label?}
export function buildSolids() {
  const solids = [];
  // Border walls (also drawn as the hall's gold-trimmed walls).
  solids.push({ x: 0, y: 0, w: VIEW.width, h: WALL, kind: 'wall' });
  solids.push({ x: 0, y: VIEW.height - WALL, w: VIEW.width, h: WALL, kind: 'wall' });
  solids.push({ x: 0, y: 0, w: WALL, h: VIEW.height, kind: 'wall' });
  solids.push({ x: VIEW.width - WALL, y: 0, w: WALL, h: VIEW.height, kind: 'wall' });
  // Display cases: glass vitrines on plinths, in a loose gallery row.
  solids.push({ x: 300, y: 110, w: 120, h: 64, kind: 'case', label: 'VASES' });
  solids.push({ x: 560, y: 96, w: 120, h: 64, kind: 'case', label: 'COINS' });
  solids.push({ x: 300, y: 560, w: 120, h: 64, kind: 'case', label: 'MASKS' });
  solids.push({ x: 560, y: 560, w: 120, h: 64, kind: 'case', label: 'SCROLLS' });
  solids.push({ x: 1060, y: 330, w: 64, h: 120, kind: 'case', label: 'CROWN' });
  // The sapphire's case, centre-right, under its own spotlight.
  solids.push({ x: 920, y: 130, w: 150, h: 90, kind: 'case', label: 'STAR SAPPHIRE', loot: true });
  // Crates: stacked shipping crates, the thief's cover.
  solids.push({ x: 180, y: 300, w: 84, h: 84, kind: 'crate' });
  solids.push({ x: 460, y: 300, w: 84, h: 84, kind: 'crate' });
  solids.push({ x: 700, y: 330, w: 84, h: 84, kind: 'crate' });
  solids.push({ x: 180, y: 470, w: 84, h: 84, kind: 'crate' });
  solids.push({ x: 880, y: 500, w: 84, h: 84, kind: 'crate' });
  solids.push({ x: 1130, y: 100, w: 84, h: 84, kind: 'crate' });
  return solids;
}

// Shadow pools: standing inside one makes the thief much harder to spot.
export function buildShadows() {
  return [
    { x: 130, y: 170, w: 190, h: 110 },
    { x: 430, y: 150, w: 170, h: 100 },
    { x: 640, y: 470, w: 200, h: 110 },
    { x: 940, y: 300, w: 180, h: 120 },
    { x: 180, y: 600, w: 220, h: 70 },
  ];
}

// Velvet rope runs (decorative): pairs of posts joined by a sagging red rope.
export function buildRopes() {
  return [
    { x1: 300, y1: 200, x2: 420, y2: 200 },
    { x1: 560, y1: 186, x2: 680, y2: 186 },
    { x1: 880, y1: 250, x2: 1110, y2: 250 },
    { x1: 300, y1: 540, x2: 420, y2: 540 },
    { x1: 560, y1: 540, x2: 680, y2: 540 },
  ];
}

export const LOOT_CASE = { x: 920, y: 130, w: 150, h: 90 };
export const LOOT_POS = { x: 995, y: 175 }; // the sapphire itself
export const ENTRANCE = { x: 88, y: 88 };
export const EXIT_VENT = { x: 96, y: 636, w: 96, h: 52 };

// Guard patrols: waypoint loops the guards walk, pausing briefly at each stop.
export function buildGuards() {
  return [
    {
      name: 'Guard Marlowe',
      waypoints: [
        { x: 280, y: 250 },
        { x: 640, y: 250 },
        { x: 640, y: 430 },
        { x: 280, y: 430 },
      ],
      pauseSeconds: 1.1,
    },
    {
      name: 'Guard Okafor',
      waypoints: [
        { x: 1140, y: 480 },
        { x: 1140, y: 250 },
        { x: 900, y: 250 },
        { x: 900, y: 480 },
      ],
      pauseSeconds: 0.9,
    },
  ];
}

// Wall cameras: mounted on a wall, sweeping a cone back and forth.
export function buildCameras() {
  return [
    { x: 640, y: WALL + 6, baseAngle: Math.PI / 2, sweep: 0.85, phase: 0.0 },
    { x: VIEW.width - WALL - 6, y: 430, baseAngle: Math.PI, sweep: 0.7, phase: 1.7 },
  ];
}

// Safe-ish waypoints the autopilot threads through (cover to cover) for screenshots.
export const AUTOPILOT_ROUTE = [
  { x: 225, y: 225 },
  { x: 430, y: 200 },
  { x: 515, y: 200 },
  { x: 700, y: 200 },
  { x: 850, y: 200 },
  { x: 960, y: 330 }, // south shadow pool, clear of both patrols
  { x: 995, y: 280 }, // up to the sapphire case from below
];

// The getaway: the approach in reverse, then down the quiet west wall to the vent.
export const RETURN_ROUTE = [
  { x: 960, y: 330 },
  { x: 850, y: 200 },
  { x: 700, y: 200 },
  { x: 515, y: 200 },
  { x: 430, y: 200 },
  { x: 225, y: 225 },
  { x: 150, y: 250 },
  { x: 150, y: 450 },
  { x: 144, y: 662 },
];
