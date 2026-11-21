// Security cameras: wall-mounted, sweeping a cone back and forth.
// A camera never moves, but its cone is wide and it raises the alarm
// fast — break its line of sight, or pass while it looks away.

import { hasLineOfSight } from './vision.js';

export const CAMERA_RANGE = 6.8;
export const CAMERA_HALF_ANGLE = 0.5;

export function makeCamera(def) {
  return {
    x: def.x + 0.5,
    y: def.y + 0.5,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    period: def.period,
    phase: Math.random() * Math.PI * 2,
    angle: def.baseAngle,
    seesPlayer: false,
  };
}

export function updateCamera(cam, dt, time) {
  const t = (time + cam.phase) / cam.period;
  cam.angle = cam.baseAngle + Math.sin(t * Math.PI * 2) * cam.sweep;
}

// 0..1 strength of this camera's view of the player, like spotStrength.
export function cameraSpot(cam, level, px, py, sneaking, lit) {
  const dx = px - cam.x;
  const dy = py - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_RANGE) return 0;
  let diff = Math.atan2(dy, dx) - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return 0;
  if (!hasLineOfSight(level.grid, Math.floor(cam.x), Math.floor(cam.y), Math.floor(px), Math.floor(py))) return 0;
  let strength = 0.35 + 0.65 * (1 - dist / CAMERA_RANGE);
  if (lit) strength *= 1.5;
  if (sneaking) strength *= 0.6;
  return Math.min(1, strength);
}
