// Bootstrap: wires the canvas, input and the game loop together.
// ?shot=<name> stages a fixed scene for screenshots (see shots.js);
// without it the game opens on the title screen, as a player sees it.

import { createGame } from './game.js';
import { makeInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const input = makeInput(canvas);
const game = createGame(canvas);

// Expose the game for debugging and for the screenshot driver.
window.__verdant = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(game, shot);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // A staged shot holds still: the scene is posed, the clock frozen.
  if (!shot) game.update(dt, input);
  else game.state.clock += dt;
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
