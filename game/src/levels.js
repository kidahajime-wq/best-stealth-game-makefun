// Level layouts for Verdant — A Glasshouse Heist.
//
// Each level is a grid of characters:
//   '#' wall            '.' floor           ' ' floor
//   'P' planter (cover: blocks sight + movement)
//   'H' hedge   (cover: blocks sight + movement)
//   'F' fountain (blocks movement, not sight)
//   'L' lamp    (light pool: being lit makes you easier to spot)
//   'S' player start   'E' exit (the Moon Orchid case)
//   'o' cutting (optional collectible)
//   'G' guard spawn    'C' camera mount
//
// Guards and cameras are defined per level below the maps, because a
// patrol needs waypoints and a camera needs a sweep arc. Every
// waypoint and patrol leg was checked against the map: legs never
// cross a solid tile, and the exit and every cutting are reachable
// from the start.

export const TILE = 32;

export const LEVELS = [
  {
    name: 'Level 1 — The Palm House',
    subtitle: 'Learn the shadows. Reach the orchid case.',
    par: 75,
    map: [
      '############################',
      '#..........................#',
      '#.........#..L.....#.....o.#',
      '#.LP......#........#.......#',
      '#..P......#.......C........#',
      '#.........#..P.....#....P..#',
      '#.....H...#..P.....#....P..#',
      '#S....H.......F.o..#....L.E#',
      '#.........#........#.......#',
      '#.........#.....P..#.......#',
      '#..P......#.....P..#.......#',
      '#..P.G....#................#',
      '#.o.......#....L...#..G....#',
      '#..........................#',
      '############################',
    ],
    guards: [
      { x: 5, y: 11, waypoints: [[5, 11], [5, 3], [8, 3], [8, 11]], speed: 1.6 },
      { x: 22, y: 12, waypoints: [[22, 12], [22, 3], [25, 3], [25, 12]], speed: 1.5 },
    ],
    cameras: [
      { x: 18, y: 4, baseAngle: Math.PI / 2, sweep: 1.1, period: 4.2 },
    ],
  },
  {
    name: 'Level 2 — The Fern Grotto',
    subtitle: 'Two pairs of eyes, one stone path. Toss pebbles to pull guards away.',
    par: 95,
    map: [
      '############################',
      '#..........................#',
      '#......o.#.....P.C#........#',
      '#.P......#.................#',
      '#.P......#........#....G...#',
      '#.................#........#',
      '#........#o..P....#.P......#',
      '#S....H..#...P....#.P.L...E#',
      '#.....H..#..F.....#........#',
      '#.L......#........#.....H..#',
      '#........#..............H..#',
      '#........#...G....#........#',
      '#...G....#....L...#......o.#',
      '#.........................C#',
      '############################',
    ],
    guards: [
      { x: 4, y: 12, waypoints: [[4, 12], [4, 3], [7, 3], [7, 12]], speed: 1.7 },
      { x: 13, y: 11, waypoints: [[11, 10], [11, 4], [16, 4], [16, 10]], speed: 1.8 },
      { x: 23, y: 4, waypoints: [[23, 4], [23, 11], [25, 11], [25, 4]], speed: 1.9 },
    ],
    cameras: [
      { x: 17, y: 2, baseAngle: Math.PI / 2, sweep: 1.3, period: 3.6 },
      { x: 26, y: 13, baseAngle: -Math.PI / 2, sweep: 1.2, period: 4.6 },
    ],
  },
  {
    name: 'Level 3 — The Orchid Vault',
    subtitle: 'The Moon Orchid is behind the glass. Every cone is watching.',
    par: 120,
    map: [
      '############################',
      '#............C.............#',
      '#......o.#.......C#.......o#',
      '#........#..........H..L...#',
      '#.P......#........#........#',
      '#.P......#...PP...#.P......#',
      '#................o#.P......#',
      '#S...H...#.....F..#...G...E#',
      '#....H...#..G.....#........#',
      '#........#.................#',
      '#...G....#........#.......C#',
      '#.L......#...P....#..G.....#',
      '#...........L.....#......o.#',
      '#..........................#',
      '############################',
    ],
    guards: [
      { x: 4, y: 10, waypoints: [[4, 10], [4, 3], [7, 3], [7, 10]], speed: 2.0 },
      { x: 12, y: 8, waypoints: [[11, 9], [11, 3], [16, 3], [16, 9]], speed: 2.1 },
      { x: 22, y: 7, waypoints: [[22, 7], [22, 2], [25, 2], [25, 7]], speed: 1.9 },
      { x: 21, y: 11, waypoints: [[21, 12], [21, 10], [24, 10], [24, 12]], speed: 2.0 },
    ],
    cameras: [
      { x: 17, y: 2, baseAngle: Math.PI / 2, sweep: 1.4, period: 3.2 },
      { x: 26, y: 10, baseAngle: -Math.PI / 2, sweep: 1.4, period: 3.8 },
      { x: 13, y: 1, baseAngle: Math.PI, sweep: 1.0, period: 5.0 },
    ],
  },
];

// Parse a level map into the structures the game loop uses.
export function parseLevel(def) {
  const rows = def.map.length;
  const cols = def.map[0].length;
  const grid = [];
  let start = { x: 1, y: 1 };
  let exit = { x: cols - 2, y: rows - 2 };
  const cuttings = [];
  const lamps = [];
  for (let y = 0; y < rows; y++) {
    grid.push([]);
    for (let x = 0; x < cols; x++) {
      const ch = def.map[y][x] || '#';
      grid[y].push(ch);
      if (ch === 'S') start = { x, y };
      if (ch === 'E') exit = { x, y };
      if (ch === 'o') cuttings.push({ x, y, taken: false });
      if (ch === 'L') lamps.push({ x, y });
    }
  }
  return {
    name: def.name,
    subtitle: def.subtitle,
    par: def.par,
    grid,
    cols,
    rows,
    start,
    exit,
    cuttings,
    lamps,
    guards: def.guards.map((g) => ({ ...g })),
    cameras: def.cameras.map((c) => ({ ...c })),
  };
}

// Tiles that stop movement.
export function isSolid(ch) {
  return ch === '#' || ch === 'P' || ch === 'H' || ch === 'F';
}

// Tiles that stop a line of sight (planters and hedges are tall cover).
export function blocksSight(ch) {
  return ch === '#' || ch === 'P' || ch === 'H';
}
