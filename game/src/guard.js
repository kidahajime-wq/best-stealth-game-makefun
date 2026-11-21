// Guards: patrol waypoints, suspicion, investigation, and the chase
// that follows a confirmed sighting. A guard is a small state machine
// with a personality: patrol speed, pause at each waypoint, and how
// long it stares at a pebble's landing spot.

import { hasLineOfSight } from './vision.js';

export const GUARD_RANGE = 6.2; // tiles
export const GUARD_HALF_ANGLE = 0.62; // radians either side of facing

export function makeGuard(def) {
  return {
    x: def.x + 0.5,
    y: def.y + 0.5,
    waypoints: def.waypoints.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })),
    wpIndex: 0,
    speed: def.speed,
    angle: 0,
    state: 'patrol', // patrol | suspicious | investigate | chase | return
    pause: 0,
    suspect: null, // {x, y} being investigated
    suspectTimer: 0,
    alertness: 0, // 0..1, grows while the player is in view
    lastSeen: null,
    bob: Math.random() * Math.PI * 2,
  };
}

// Move toward a point at `speed` tiles/sec; returns true when arrived.
function stepToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.05) return true;
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
  g.angle = Math.atan2(dy, dx);
  return dist - step < 0.05;
}

export function updateGuard(g, dt, level, player, events) {
  g.bob += dt * 6;
  const px = player.x;
  const py = player.y;

  // --- perception: can this guard see the player right now? ---
  const dx = px - g.x;
  const dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  let sees = false;
  if (dist < GUARD_RANGE) {
    let diff = Math.atan2(dy, dx) - g.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) <= GUARD_HALF_ANGLE) {
      sees = hasLineOfSight(level.grid, Math.floor(g.x), Math.floor(g.y), Math.floor(px), Math.floor(py));
    }
  }
  if (sees) {
    g.lastSeen = { x: px, y: py };
    g.alertness = Math.min(1, g.alertness + dt * (1.6 - dist / GUARD_RANGE));
    if (g.alertness > 0.55 && g.state !== 'chase') {
      g.state = 'chase';
      events.push({ type: 'spotted', x: g.x, y: g.y });
    }
  } else {
    g.alertness = Math.max(0, g.alertness - dt * 0.35);
    if (g.state === 'chase' && g.alertness <= 0.05) {
      g.state = 'investigate';
      g.suspect = g.lastSeen ? { ...g.lastSeen } : { x: g.x, y: g.y };
      g.suspectTimer = 3;
    }
  }

  // --- behaviour by state ---
  if (g.state === 'patrol') {
    if (g.pause > 0) {
      g.pause -= dt;
    } else {
      const wp = g.waypoints[g.wpIndex];
      if (stepToward(g, wp.x, wp.y, g.speed, dt)) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.pause = 0.9 + Math.random() * 0.8; // look around at the corner
      }
    }
  } else if (g.state === 'investigate') {
    if (g.suspect) {
      if (stepToward(g, g.suspect.x, g.suspect.y, g.speed * 1.25, dt)) {
        g.suspectTimer -= dt;
        if (g.suspectTimer <= 0) {
          g.state = 'return';
          g.suspect = null;
        }
      }
    } else {
      g.state = 'return';
    }
  } else if (g.state === 'chase') {
    // Run at the last seen position; re-acquire while the player is visible.
    const target = sees ? { x: px, y: py } : g.lastSeen;
    if (target) stepToward(g, target.x, target.y, g.speed * 1.7, dt);
    // Caught: the guard touches the player.
    if (dist < 0.55) events.push({ type: 'caught', x: g.x, y: g.y });
  } else if (g.state === 'return') {
    // Walk back to the nearest waypoint, then resume the patrol.
    let best = 0;
    let bestD = Infinity;
    g.waypoints.forEach((wp, i) => {
      const d = (wp.x - g.x) ** 2 + (wp.y - g.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    const wp = g.waypoints[best];
    if (stepToward(g, wp.x, wp.y, g.speed * 1.2, dt)) {
      g.wpIndex = best;
      g.state = 'patrol';
      g.pause = 0.4;
    }
  }

  // A guard that just noticed a pebble drops everything to look.
  return g;
}

// Send every guard within earshot to investigate a thrown pebble.
export function distractGuards(guards, tx, ty, radius) {
  let heard = 0;
  for (const g of guards) {
    const d = Math.hypot(g.x - tx, g.y - ty);
    if (d <= radius) {
      heard++;
      if (g.state !== 'chase') {
        g.state = 'investigate';
        g.suspect = { x: tx, y: ty };
        g.suspectTimer = 2.5;
      }
    }
  }
  return heard;
}
