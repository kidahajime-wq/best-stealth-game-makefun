// Game state: screens, the alarm meter, scoring, and the per-frame
// update that ties guards, cameras, the player and the pebbles
// together. The alarm is the heart of the game: it climbs while any
// watcher has eyes on you, and it falls while you stay unseen —
// being spotted is a scare, not an instant fail, until it hits 100.

import { LEVELS, parseLevel } from './levels.js';
import { makeGuard, updateGuard, distractGuards } from './guard.js';
import { makeCamera, updateCamera, cameraSpot } from './camera.js';
import { makePlayer, updatePlayer, tossPebble, PEBBLE_EARSHOT } from './player.js';
import { spotStrength, isLit } from './vision.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guard.js';
import { render, pxToTile } from './render.js';
import { ensureAudio, sfx, toggleMute } from './audio.js';

const ALARM_RISE = 55; // alarm points per second at full spot strength
const ALARM_FALL = 14; // points per second while unseen

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const state = {
    screen: 'title', // title | intro | play | caught | levelclear | win
    levelIndex: 0,
    level: null,
    guards: [],
    cameras: [],
    player: null,
    alarm: 0,
    score: 0,
    time: 0, // total run time
    levelTime: 0,
    levelBonus: 0,
    cuttingsTaken: 0,
    totalCuttings: 0,
    pebbles: 5,
    clock: 0, // render clock for animations
    message: '',
    messageTimer: 0,
  };

  function loadLevel(index) {
    const def = LEVELS[index];
    const level = parseLevel(def);
    state.levelIndex = index;
    state.level = level;
    state.guards = level.guards.map(makeGuard);
    state.cameras = level.cameras.map(makeCamera);
    state.player = makePlayer(level.start);
    state.alarm = 0;
    state.levelTime = 0;
    state.cuttingsTaken = 0;
    state.totalCuttings = level.cuttings.length;
    state.pebbles = 5;
    state.screen = 'intro';
  }

  function startRun() {
    state.score = 0;
    state.time = 0;
    loadLevel(0);
  }

  function nextLevel() {
    if (state.levelIndex + 1 >= LEVELS.length) {
      state.screen = 'win';
      sfx.win();
    } else {
      loadLevel(state.levelIndex + 1);
    }
  }

  function update(dt, input) {
    state.clock += dt;

    // Mute / restart are available on every screen.
    if (input.consume('mutePressed')) {
      const muted = toggleMute();
      state.message = muted ? 'Sound off' : 'Sound on';
      state.messageTimer = 1.5;
    }
    if (input.consume('restartPressed') && (state.screen === 'play' || state.screen === 'caught')) {
      loadLevel(state.levelIndex);
      return;
    }

    if (state.screen === 'title') {
      if (input.consume('confirmPressed') || input.anyKey) {
        input.anyKey = false;
        ensureAudio();
        startRun();
      }
      return;
    }
    if (state.screen === 'intro') {
      if (input.consume('confirmPressed') || input.anyKey) {
        input.anyKey = false;
        state.screen = 'play';
      }
      return;
    }
    if (state.screen === 'caught') {
      if (input.consume('confirmPressed') || input.anyKey) {
        input.anyKey = false;
        loadLevel(state.levelIndex);
      }
      return;
    }
    if (state.screen === 'levelclear') {
      if (input.consume('confirmPressed') || input.anyKey) {
        input.anyKey = false;
        nextLevel();
      }
      return;
    }
    if (state.screen === 'win') {
      if (input.consume('confirmPressed') || input.anyKey) {
        input.anyKey = false;
        startRun();
      }
      return;
    }

    // --- play ---
    state.time += dt;
    state.levelTime += dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;

    const player = state.player;
    const hadToss = !!player.toss;
    updatePlayer(player, dt, input, state.level);

    // Pebble landing: the clink pulls guards in earshot over to look.
    if (hadToss && !player.toss) {
      // The landing tile is where the toss was aimed.
      const land = player.lastTossTarget;
      if (land) {
        sfx.clink();
        const heard = distractGuards(state.guards, land.x, land.y, PEBBLE_EARSHOT);
        state.message = heard > 0 ? `${heard} guard${heard > 1 ? 's' : ''} heard the pebble` : 'The pebble clinks into the dark';
        state.messageTimer = 2;
      }
    }

    // Pebble toss: Q throws ahead, a click throws at the clicked tile.
    if (input.consume('tossPressed')) {
      const tx = Math.floor(player.x + player.dirX * 3);
      const ty = Math.floor(player.y + player.dirY * 3);
      const target = tossPebble(player, tx, ty);
      if (target) {
        player.lastTossTarget = target;
        sfx.pebble();
      }
    }
    if (input.clickTile) {
      const tile = pxToTile(input.clickTile.px, input.clickTile.py);
      input.clickTile = null;
      const target = tossPebble(player, tile.x, tile.y);
      if (target) {
        player.lastTossTarget = target;
        sfx.pebble();
      }
    }

    // Footsteps: soft when sneaking, audible when striding.
    if (player.moving) {
      state.stepTimer = (state.stepTimer ?? 0) - dt;
      if (state.stepTimer <= 0) {
        sfx.step(player.sneaking);
        state.stepTimer = player.sneaking ? 0.55 : 0.34;
      }
    }

    // --- watchers ---
    const lit = isLit(state.level, player.x, player.y);
    state.lit = lit;
    let spotting = 0;
    const events = [];
    for (const g of state.guards) {
      updateGuard(g, dt, state.level, player, events);
      spotting = Math.max(
        spotting,
        spotStrength(state.level, g.x, g.y, g.angle, GUARD_RANGE, GUARD_HALF_ANGLE, player.x, player.y, player.sneaking, lit),
      );
    }
    for (const cam of state.cameras) {
      updateCamera(cam, dt, state.clock);
      const s = cameraSpot(cam, state.level, player.x, player.y, player.sneaking, lit);
      cam.seesPlayer = s > 0.45;
      spotting = Math.max(spotting, s);
    }

    // --- alarm ---
    if (spotting > 0) {
      state.alarm = Math.min(100, state.alarm + spotting * ALARM_RISE * dt);
      if (state.alarm > 55 && !state.alarmStingPlayed) {
        state.alarmStingPlayed = true;
        sfx.spotted();
      }
    } else {
      state.alarm = Math.max(0, state.alarm - ALARM_FALL * dt);
      if (state.alarm < 20) state.alarmStingPlayed = false;
    }
    if (state.alarm >= 100) {
      state.screen = 'caught';
      sfx.caught();
      return;
    }

    for (const e of events) {
      if (e.type === 'caught') {
        state.screen = 'caught';
        sfx.caught();
        return;
      }
      if (e.type === 'spotted') {
        state.message = 'Spotted! Break line of sight!';
        state.messageTimer = 2;
      }
    }

    // --- cuttings ---
    for (const c of state.level.cuttings) {
      if (!c.taken && Math.floor(player.x) === c.x && Math.floor(player.y) === c.y) {
        c.taken = true;
        state.cuttingsTaken++;
        state.score += 100;
        sfx.pickup();
        state.message = 'Cutting pocketed · +100';
        state.messageTimer = 1.5;
      }
    }

    // --- exit ---
    if (Math.floor(player.x) === state.level.exit.x && Math.floor(player.y) === state.level.exit.y) {
      const timeBonus = Math.max(0, Math.round((state.level.par - state.levelTime) * 5));
      const ghostBonus = state.alarm < 30 ? 150 : 0;
      state.levelBonus = timeBonus + ghostBonus + state.cuttingsTaken * 100;
      state.score += timeBonus + ghostBonus;
      sfx.levelClear();
      state.screen = 'levelclear';
    }
  }

  function draw() {
    // HUD reads these straight off the state.
    state.pebbles = state.player ? state.player.pebbles : 5;
    render(ctx, state);
    if (state.messageTimer > 0 && state.screen === 'play') {
      ctx.fillStyle = 'rgba(8, 18, 12, 0.85)';
      ctx.fillRect(312, 88, 400, 26);
      ctx.strokeStyle = '#4a6a54';
      ctx.strokeRect(312.5, 88.5, 399, 25);
      ctx.fillStyle = '#e8f2e4';
      ctx.font = '13px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.message, 512, 106);
      ctx.textAlign = 'left';
    }
  }

  return { state, update, draw, loadLevel, startRun };
}
