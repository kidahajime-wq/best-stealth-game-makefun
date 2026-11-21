// Vision and light: line of sight, vision cones, and the lamp pools
// that make the player easier to spot. Everything here works in tile
// coordinates; rendering converts to pixels.

import { blocksSight } from './levels.js';

// Bresenham walk between two tile centres. Returns false the moment a
// sight-blocking tile sits between them (endpoints never block).
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  let guard = 0;
  while (guard++ < 200) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && blocksSight(grid[y]?.[x] ?? '#')) return false;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return true;
}

// Is the target inside the watcher's vision cone? The cone is a wedge
// of `range` tiles and `halfAngle` radians either side of `angle`.
export function inCone(wx, wy, angle, range, halfAngle, tx, ty) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 0.001) return dist < 0.001;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

// How strongly is a watcher spotting the player right now, 0..1?
// Closer is worse, standing in lamplight is worse, sneaking is better.
export function spotStrength(level, wx, wy, angle, range, halfAngle, px, py, sneaking, lit) {
  if (!inCone(wx, wy, angle, range, halfAngle, px, py)) return 0;
  const dx = px - wx;
  const dy = py - wy;
  const dist = Math.hypot(dx, dy);
  if (!hasLineOfSight(level.grid, Math.floor(wx), Math.floor(wy), Math.floor(px), Math.floor(py))) return 0;
  let strength = 1 - dist / range; // 1 up close, 0 at the edge
  strength = 0.25 + 0.75 * strength;
  if (lit) strength *= 1.6; // lamplight betrays you
  if (sneaking) strength *= 0.55; // low profile, slow steps
  return Math.min(1, strength);
}

// Is the player standing inside any lamp's light pool?
export function isLit(level, px, py) {
  for (const lamp of level.lamps) {
    const dx = px - (lamp.x + 0.5);
    const dy = py - (lamp.y + 0.5);
    if (dx * dx + dy * dy < 2.1 * 2.1) return true;
  }
  return false;
}

// The nearest lit lamp, for the renderer's glow. Null in the dark.
export function nearestLamp(level, px, py) {
  let best = null;
  let bestD = Infinity;
  for (const lamp of level.lamps) {
    const dx = px - (lamp.x + 0.5);
    const dy = py - (lamp.y + 0.5);
    const d = dx * dx + dy * dy;
    if (d < bestD) { bestD = d; best = lamp; }
  }
  return bestD < 3.2 * 3.2 ? best : null;
}
