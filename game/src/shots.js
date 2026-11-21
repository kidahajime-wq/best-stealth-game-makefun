// Screenshot staging: ?shot=title|play|tense|win puts the game into
// a fixed, representative state so the screenshots are real renders
// of the game itself, taken the same way every time.
//
//   title — the title screen over the glasshouse
//   play  — mid-level on night 1, guards patrolling, cones visible
//   tense — a near-detection moment on night 2: alarm high, a guard
//           closing in, the player one tile from the lamplight
//   win   — the final screen after the orchid is lifted

export function applyShot(game, name) {
  const s = game.state;
  if (name === 'title') {
    game.loadLevel(0);
    s.screen = 'title';
    s.clock = 2.5;
    return true;
  }
  if (name === 'play') {
    game.loadLevel(0);
    s.screen = 'play';
    s.player.x = 8.5;
    s.player.y = 6.5;
    s.player.dirX = 1;
    s.player.dirY = 0;
    s.player.sneaking = true;
    s.clock = 6.0;
    // Let the guards walk a little so their cones read mid-patrol.
    const g = s.guards[0];
    g.x = 8.5;
    g.y = 7.5;
    g.angle = Math.PI / 2;
    g.state = 'patrol';
    const g2 = s.guards[1];
    g2.x = 20.5;
    g2.y = 7.5;
    g2.angle = -Math.PI / 2;
    g2.state = 'patrol';
    s.level.cuttings[0].taken = true;
    s.cuttingsTaken = 1;
    s.score = 100;
    s.time = 34;
    s.levelTime = 34;
    return true;
  }
  if (name === 'tense') {
    game.loadLevel(1);
    s.screen = 'play';
    s.player.x = 13.5;
    s.player.y = 8.5;
    s.player.dirX = -1;
    s.player.dirY = 0;
    s.player.sneaking = true;
    s.alarm = 78;
    s.alarmStingPlayed = true;
    s.clock = 9.0;
    s.time = 61;
    s.levelTime = 61;
    s.score = 200;
    s.cuttingsTaken = 2;
    s.level.cuttings[0].taken = true;
    s.level.cuttings[1].taken = true;
    // The guard that spotted you, closing in with its cone on you.
    const g = s.guards[0];
    g.x = 10.5;
    g.y = 8.5;
    g.angle = 0;
    g.state = 'chase';
    g.alertness = 0.9;
    g.lastSeen = { x: 13.5, y: 8.5 };
    // A second guard turning toward the noise.
    const g2 = s.guards[1];
    g2.x = 6.5;
    g2.y = 6.5;
    g2.angle = Math.PI / 4;
    g2.state = 'investigate';
    g2.suspect = { x: 12.5, y: 8.5 };
    g2.suspectTimer = 2.5;
    s.message = 'Spotted! Break line of sight!';
    s.messageTimer = 99;
    return true;
  }
  if (name === 'win') {
    game.loadLevel(2);
    s.screen = 'win';
    s.score = 2450;
    s.time = 298;
    s.clock = 3.0;
    return true;
  }
  return false;
}
