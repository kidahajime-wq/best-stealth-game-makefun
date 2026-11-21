// The player: a thief in soft shoes. Movement is grid-collision
// checked in tile space; sneaking halves speed and halves how fast
// watchers spot you. Pebbles are the only tool: toss one to make a
// noise somewhere else, and every guard in earshot goes to look.

import { isSolid } from './levels.js';

export const WALK_SPEED = 4.6; // tiles per second
export const SNEAK_SPEED = 2.4;
export const PEBBLE_RANGE = 5.5; // tiles a thrown pebble can reach
export const PEBBLE_EARSHOT = 6.5; // tiles a guard hears it from

export function makePlayer(start) {
  return {
    x: start.x + 0.5,
    y: start.y + 0.5,
    dirX: 1,
    dirY: 0,
    sneaking: false,
    moving: false,
    pebbles: 5,
    stepPhase: 0,
    toss: null, // {x, y, t} animating pebble, null when idle
  };
}

// Try to move the player by (dx, dy) tiles, sliding along walls.
export function movePlayer(player, level, dx, dy) {
  const nx = player.x + dx;
  const ny = player.y + dy;
  const solidAt = (x, y) => isSolid(level.grid[Math.floor(y)]?.[Math.floor(x)] ?? '#');
  const r = 0.28; // player radius in tiles
  let movedX = false;
  let movedY = false;
  if (!solidAt(nx + Math.sign(dx) * r, player.y + r * 0.9) &&
      !solidAt(nx + Math.sign(dx) * r, player.y - r * 0.9)) {
    player.x = nx;
    movedX = true;
  }
  if (!solidAt(player.x + r * 0.9, ny + Math.sign(dy) * r) &&
      !solidAt(player.x - r * 0.9, ny + Math.sign(dy) * r)) {
    player.y = ny;
    movedY = true;
  }
  player.moving = movedX || movedY;
  return player.moving;
}

export function updatePlayer(player, dt, input, level) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  player.sneaking = !!input.sneak;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    player.dirX = mx;
    player.dirY = my;
    const speed = player.sneaking ? SNEAK_SPEED : WALK_SPEED;
    movePlayer(player, level, mx * speed * dt, my * speed * dt);
    player.stepPhase += dt * (player.sneaking ? 7 : 11);
  } else {
    player.moving = false;
  }
  if (player.toss) {
    player.toss.t += dt * 2.2;
    if (player.toss.t >= 1) player.toss = null;
  }
}

// Start a pebble toss toward tile (tx, ty). Returns false when the
// target is out of reach or no pebbles remain.
export function tossPebble(player, tx, ty) {
  if (player.pebbles <= 0 || player.toss) return null;
  const dx = tx + 0.5 - player.x;
  const dy = ty + 0.5 - player.y;
  if (Math.hypot(dx, dy) > PEBBLE_RANGE) return null;
  player.pebbles--;
  player.toss = { fromX: player.x, fromY: player.y, x: tx + 0.5, y: ty + 0.5, t: 0 };
  return { x: tx + 0.5, y: ty + 0.5 };
}
