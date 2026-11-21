// Rendering: the glasshouse at night. Warm lamp pools on dark green
// stone, tall planters and hedges as cover, amber guard cones and
// pale camera sweeps, and a hooded thief in teal. Light is gameplay:
// lamp pools are drawn bright, the dark between them is drawn dark,
// so the player can read at a glance where it is safe to stand.

import { TILE } from './levels.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guard.js';
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './camera.js';

export const VIEW_W = 1024;
export const VIEW_H = 640;
export const FIELD_X = 64; // playfield offset in the canvas
export const FIELD_Y = 72;
export const HUD_H = 56;

// Deterministic per-tile variation so the floor never looks flat.
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function tileToPx(x) { return FIELD_X + x * TILE; }
function tileToPy(y) { return FIELD_Y + y * TILE; }

export function pxToTile(px, py) {
  return {
    x: Math.floor((px - FIELD_X) / TILE),
    y: Math.floor((py - FIELD_Y) / TILE),
  };
}

function drawCone(ctx, cx, cy, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, range * TILE, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, level) {
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const ch = level.grid[y][x];
      const px = tileToPx(x);
      const py = tileToPy(y);
      const v = hash(x, y);
      if (ch === '#') {
        ctx.fillStyle = '#16241c';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(120,160,110,0.10)';
        ctx.fillRect(px, py + TILE - 5, TILE, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px, py, TILE, 2);
      } else {
        ctx.fillStyle = v > 0.5 ? '#16281f' : '#13241b';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(150,200,140,0.07)';
        ctx.fillRect(px + 3 + v * 18, py + 4 + v * 12, 5, 5);
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      }
    }
  }
}

function drawPlanter(ctx, x, y) {
  const px = tileToPx(x);
  const py = tileToPy(y);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(px + 2, py + 20, TILE - 4, 10);
  ctx.fillStyle = '#2c6b3a';
  for (let i = 0; i < 5; i++) {
    const lx = px + 5 + i * 5 + hash(x + i, y) * 3;
    const ly = py + 6 + hash(x, y + i) * 12;
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fillStyle = i % 2 ? '#3f8a48' : '#2c6b3a';
    ctx.fill();
  }
  ctx.fillStyle = '#7ec850';
  ctx.beginPath();
  ctx.arc(px + 9, py + 9, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 22, py + 13, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHedge(ctx, x, y) {
  const px = tileToPx(x);
  const py = tileToPy(y);
  ctx.fillStyle = '#1d4a26';
  ctx.fillRect(px + 1, py + 4, TILE - 2, TILE - 8);
  ctx.fillStyle = '#2c6b3a';
  ctx.fillRect(px + 1, py + 4, TILE - 2, 6);
  ctx.fillStyle = 'rgba(140,220,120,0.16)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px + 4 + i * 7, py + 10 + hash(x + i, y) * 8, 4, 3);
  }
}

function drawFountain(ctx, x, y, time) {
  const px = tileToPx(x);
  const py = tileToPy(y);
  ctx.fillStyle = '#274b5c';
  ctx.beginPath();
  ctx.arc(px + TILE / 2, py + TILE / 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d7ea6';
  ctx.beginPath();
  ctx.arc(px + TILE / 2, py + TILE / 2, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200,235,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(px + TILE / 2, py + TILE / 2, 5 + Math.sin(time * 2 + x) * 2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLamp(ctx, x, y, time) {
  const px = tileToPx(x) + TILE / 2;
  const py = tileToPy(y) + TILE / 2;
  const flicker = 0.92 + Math.sin(time * 3 + x * 1.7) * 0.05;
  const glow = ctx.createRadialGradient(px, py, 4, px, py, 2.2 * TILE * flicker);
  glow.addColorStop(0, 'rgba(255, 205, 110, 0.34)');
  glow.addColorStop(0.55, 'rgba(255, 190, 90, 0.13)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, 2.2 * TILE, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4d1f';
  ctx.fillRect(px - 2, py - 2, 4, 14);
  ctx.fillStyle = '#ffd977';
  ctx.beginPath();
  ctx.arc(px, py - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(px, py - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawExit(ctx, x, y, time) {
  const px = tileToPx(x) + TILE / 2;
  const py = tileToPy(y) + TILE / 2;
  const pulse = 0.75 + Math.sin(time * 2.4) * 0.25;
  const glow = ctx.createRadialGradient(px, py, 2, px, py, 44);
  glow.addColorStop(0, `rgba(255, 215, 120, ${0.5 * pulse})`);
  glow.addColorStop(1, 'rgba(255, 215, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(px, py, 44, 0, Math.PI * 2);
  ctx.fill();
  // The glass case.
  ctx.fillStyle = 'rgba(180,220,235,0.20)';
  ctx.fillRect(px - 12, py - 12, 24, 24);
  ctx.strokeStyle = '#cfe8f2';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px - 12, py - 12, 24, 24);
  // The Moon Orchid: white petals, gold heart.
  ctx.fillStyle = '#f4f0ff';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.ellipse(px + Math.cos(a) * 5, py + Math.sin(a) * 5, 4, 2.5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8b64c';
  ctx.beginPath();
  ctx.arc(px, py, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCutting(ctx, x, y, time) {
  const px = tileToPx(x) + TILE / 2;
  const py = tileToPy(y) + TILE / 2 + Math.sin(time * 3 + x) * 2;
  ctx.fillStyle = 'rgba(140,255,160,0.25)';
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8aff9e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, py + 6);
  ctx.quadraticCurveTo(px - 6, py - 2, px, py - 7);
  ctx.quadraticCurveTo(px + 6, py - 2, px, py + 6);
  ctx.stroke();
}

function drawGuard(ctx, g, time) {
  const cx = tileToPx(g.x);
  const cy = tileToPy(g.y);
  const chasing = g.state === 'chase';
  const alerted = g.state === 'investigate' || chasing;
  const coneFill = chasing
    ? 'rgba(255, 70, 60, 0.30)'
    : alerted
      ? 'rgba(255, 170, 60, 0.26)'
      : 'rgba(255, 210, 90, 0.20)';
  const coneEdge = chasing
    ? 'rgba(255, 90, 70, 0.55)'
    : 'rgba(255, 210, 90, 0.40)';
  drawCone(ctx, cx, cy, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE, coneFill, coneEdge);

  // Shadow and body: a night watchman in a dark coat and cap.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 9, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = Math.sin(g.bob) * 1.2;
  ctx.fillStyle = '#2a2f45';
  ctx.beginPath();
  ctx.arc(cx, cy + bob, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a415c';
  ctx.beginPath();
  ctx.arc(cx, cy - 3 + bob, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - 10, cy - 3 + bob, 20, 3);
  // Lantern dot on the chest, and eyes in the facing direction.
  ctx.fillStyle = chasing ? '#ff5040' : '#ffd25e';
  ctx.beginPath();
  ctx.arc(cx + Math.cos(g.angle) * 5, cy + Math.sin(g.angle) * 5 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  // "?" while suspicious, "!" while chasing.
  if (g.state === 'investigate') {
    ctx.fillStyle = '#ffcf5e';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', cx, cy - 16 + bob);
  } else if (chasing) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', cx, cy - 16 + bob);
  }
  // Alertness arc above the head.
  if (g.alertness > 0.05) {
    ctx.strokeStyle = 'rgba(255,80,60,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 7, -Math.PI / 2, -Math.PI / 2 + g.alertness * Math.PI * 2);
    ctx.stroke();
  }
}

function drawCamera(ctx, cam) {
  const cx = tileToPx(cam.x);
  const cy = tileToPy(cam.y);
  drawCone(
    ctx, cx, cy, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
    cam.seesPlayer ? 'rgba(255, 80, 70, 0.28)' : 'rgba(150, 210, 255, 0.18)',
    cam.seesPlayer ? 'rgba(255, 90, 70, 0.55)' : 'rgba(150, 210, 255, 0.40)',
  );
  ctx.fillStyle = '#20242e';
  ctx.fillRect(cx - 5, cy - 5, 10, 10);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(cam.angle);
  ctx.fillStyle = '#39415a';
  ctx.fillRect(0, -3, 12, 6);
  ctx.fillStyle = cam.seesPlayer ? '#ff5040' : '#7ee0ff';
  ctx.beginPath();
  ctx.arc(12, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, player, time) {
  const cx = tileToPx(player.x);
  const cy = tileToPy(player.y);
  const crouch = player.sneaking ? 0.72 : 1;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : Math.sin(time * 2) * 0.8;
  // Hooded cloak in deep teal.
  ctx.fillStyle = '#0f766e';
  ctx.beginPath();
  ctx.arc(cx, cy + bob, 10 * crouch + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14a08f';
  ctx.beginPath();
  ctx.arc(cx, cy - 3 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  // Face in shadow, eyes toward the facing direction.
  ctx.fillStyle = '#0a1a12';
  ctx.beginPath();
  ctx.arc(cx + player.dirX * 2, cy - 3 + player.dirY * 2 + bob, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8fff2';
  ctx.beginPath();
  ctx.arc(cx + player.dirX * 3.5 - player.dirY * 1.5, cy - 3 + player.dirY * 3.5 + player.dirX * 1.5 + bob, 1, 0, Math.PI * 2);
  ctx.arc(cx + player.dirX * 3.5 + player.dirY * 1.5, cy - 3 + player.dirY * 3.5 - player.dirX * 1.5 + bob, 1, 0, Math.PI * 2);
  ctx.fill();
  // Tossed pebble in flight.
  if (player.toss) {
    const t = player.toss.t;
    const px = tileToPx(player.toss.fromX + (player.toss.x - player.toss.fromX) * t);
    const py = tileToPy(player.toss.fromY + (player.toss.y - player.toss.fromY) * t) - Math.sin(t * Math.PI) * 18;
    ctx.fillStyle = '#cfd6da';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDarkness(ctx, level, player) {
  const dark = document.createElement('canvas');
  dark.width = VIEW_W;
  dark.height = VIEW_H;
  const d = dark.getContext('2d');
  d.fillStyle = 'rgba(3, 8, 6, 0.40)';
  d.fillRect(0, 0, VIEW_W, VIEW_H);
  d.globalCompositeOperation = 'destination-out';
  for (const lamp of level.lamps) {
    const px = tileToPx(lamp.x + 0.5);
    const py = tileToPy(lamp.y + 0.5);
    const g = d.createRadialGradient(px, py, 4, px, py, 2.3 * TILE);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.beginPath();
    d.arc(px, py, 2.3 * TILE, 0, Math.PI * 2);
    d.fill();
  }
  // A small pool of visibility around the thief.
  const px = tileToPx(player.x);
  const py = tileToPy(player.y);
  const g = d.createRadialGradient(px, py, 6, px, py, 2.6 * TILE);
  g.addColorStop(0, 'rgba(0,0,0,0.9)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  d.fillStyle = g;
  d.beginPath();
  d.arc(px, py, 2.6 * TILE, 0, Math.PI * 2);
  d.fill();
  ctx.drawImage(dark, 0, 0);
}

function drawHud(ctx, state) {
  const { level, alarm, time, score, totalCuttings } = state;
  ctx.fillStyle = '#0a140e';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2c4a34';
  ctx.fillRect(0, HUD_H - 1, VIEW_W, 1);
  ctx.fillStyle = '#e8f2e4';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 16, 24);
  ctx.fillStyle = '#8fb89a';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(level.subtitle, 16, 44);

  // Alarm meter.
  const bx = 560;
  const by = 16;
  const bw = 220;
  const bh = 14;
  ctx.fillStyle = '#1a2a20';
  ctx.fillRect(bx, by, bw, bh);
  const frac = Math.max(0, Math.min(1, alarm / 100));
  const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  grad.addColorStop(0, '#e8b64c');
  grad.addColorStop(1, '#ff5040');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, bw * frac, bh);
  ctx.strokeStyle = frac > 0.66 ? '#ff5040' : '#4a6a54';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.fillStyle = frac > 0.66 ? '#ff8a7a' : '#cfe0d2';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'left';
  const label = alarm <= 0 ? 'UNSEEN' : alarm < 40 ? 'SUSPICIOUS' : alarm < 75 ? 'HUNTED' : 'ALMOST CAUGHT';
  ctx.fillText(`ALARM ${label}`, bx, by + 30);

  // Pebbles, cuttings, score, time.
  ctx.fillStyle = '#e8f2e4';
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'right';
  const mm = Math.floor(time / 60);
  const ss = Math.floor(time % 60).toString().padStart(2, '0');
  ctx.fillText(`◉ ${state.pebbles} pebbles`, 1010, 18);
  ctx.fillText(`❧ ${state.cuttingsTaken}/${totalCuttings} cuttings`, 1010, 34);
  ctx.fillText(`Score ${score}   ${mm}:${ss}`, 1010, 50);
  ctx.textAlign = 'left';
}

// A full-screen overlay panel with a title and lines of text.
function drawPanel(ctx, title, lines, accent, footer) {
  ctx.fillStyle = 'rgba(4, 10, 7, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(212, 118, 600, 400);
  ctx.fillStyle = 'rgba(8, 18, 12, 0.92)';
  ctx.fillRect(212, 118, 600, 400);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 178);
  ctx.fillStyle = '#d8e8d8';
  ctx.font = '16px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 224 + i * 28));
  if (footer) {
    ctx.fillStyle = '#8fb89a';
    ctx.font = '14px Georgia, serif';
    ctx.fillText(footer, VIEW_W / 2, 482);
  }
}

export function render(ctx, state) {
  const { level, player, guards, cameras, time } = state;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#060d0a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  drawFloor(ctx, level);
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const ch = level.grid[y][x];
      if (ch === 'P') drawPlanter(ctx, x, y);
      else if (ch === 'H') drawHedge(ctx, x, y);
      else if (ch === 'F') drawFountain(ctx, x, y, time);
    }
  }
  for (const lamp of level.lamps) drawLamp(ctx, lamp.x, lamp.y, time);
  for (const c of level.cuttings) if (!c.taken) drawCutting(ctx, c.x, c.y, time);
  drawExit(ctx, level.exit.x, level.exit.y, time);
  for (const cam of cameras) drawCamera(ctx, cam);
  for (const g of guards) drawGuard(ctx, g, time);
  drawPlayer(ctx, player, time);
  drawDarkness(ctx, level, player);

  // Near-miss pulse: the screen edges throb red as the alarm climbs.
  if (state.alarm > 35) {
    const pulse = 0.10 + 0.08 * Math.sin(time * 6) + (state.alarm / 100) * 0.12;
    const vg = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.32, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
    );
    vg.addColorStop(0, 'rgba(255,40,30,0)');
    vg.addColorStop(1, `rgba(255,40,30,${Math.min(0.5, pulse)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawHud(ctx, state);

  // Bottom hint line inside the canvas.
  ctx.fillStyle = '#6f8f7a';
  ctx.font = '12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Stay out of the amber cones and the lamplight · SHIFT to sneak · Q or click to toss a pebble · M to mute',
    VIEW_W / 2, VIEW_H - 12,
  );

  // --- screens ---
  if (state.screen === 'title') {
    drawPanel(ctx, 'VERDANT', [
      'A Glasshouse Heist',
      '',
      'Tonight the glasshouse sleeps — except for its watchmen.',
      'Slip past the patrols, dodge the sweeping cameras,',
      'and lift the Moon Orchid from its glass case.',
      '',
      'WASD / arrows to move · SHIFT to sneak · Q or click to toss a pebble',
      'Planters and hedges block sight · Lamplight betrays you',
    ], '#e8b64c', 'Press ENTER to begin · 3 nights, one orchid');
  } else if (state.screen === 'intro') {
    drawPanel(ctx, state.level.name, [
      state.level.subtitle,
      '',
      `Par time ${state.level.par}s · ${state.totalCuttings} cuttings hidden in the beds`,
      `Guards: ${state.guards.length} · Cameras: ${state.cameras.length}`,
    ], '#8aff9e', 'Press ENTER to slip in');
  } else if (state.screen === 'caught') {
    drawPanel(ctx, 'CAUGHT', [
      'A watchman laid a hand on your shoulder.',
      'The glasshouse keeps its orchid — this time.',
      '',
      `Level ${state.levelIndex + 1} · Alarm hit 100%`,
    ], '#ff5040', 'Press ENTER to try the night again');
  } else if (state.screen === 'levelclear') {
    drawPanel(ctx, 'THE ORCHID IS YOURS', [
      `Night ${state.levelIndex + 1} complete in ${Math.floor(state.levelTime)}s`,
      `Cuttings gathered: ${state.cuttingsTaken}/${state.totalCuttings}`,
      `Night bonus: +${state.levelBonus}`,
    ], '#e8b64c', 'Press ENTER for the next night');
  } else if (state.screen === 'win') {
    drawPanel(ctx, 'THE MOON ORCHID BLOOMS', [
      'Three nights, three cases, one perfect theft.',
      'The glasshouse never knew you were there.',
      '',
      `Final score: ${state.score}`,
      `Total time: ${Math.floor(state.time / 60)}:${Math.floor(state.time % 60).toString().padStart(2, '0')}`,
    ], '#e8b64c', 'Press ENTER to steal it all over again');
  }
}
