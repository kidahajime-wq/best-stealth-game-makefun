// Keyboard and mouse input. Keys are tracked as a held set so the
// game loop can read them each frame; clicks are converted to tile
// coordinates by the caller.

export function makeInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    clickTile: null, // {x, y} set once per click, consumed by the loop
    anyKey: false,
  };

  const keyMap = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };

  window.addEventListener('keydown', (e) => {
    if (keyMap[e.code] !== undefined) {
      input[keyMap[e.code]] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyM') input.mutePressed = true;
    if (e.code === 'KeyR') input.restartPressed = true;
    if (e.code === 'KeyQ') input.tossPressed = true;
    if (e.code === 'Enter' || e.code === 'Space') input.confirmPressed = true;
    input.anyKey = true;
  });
  window.addEventListener('keyup', (e) => {
    if (keyMap[e.code] !== undefined) input[keyMap[e.code]] = false;
  });
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    input.clickTile = {
      px: ((e.clientX - rect.left) / rect.width) * canvas.width,
      py: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
    input.anyKey = true;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = input.sneak = false;
  });

  // One-shot flags are consumed by the game loop each frame.
  input.consume = (name) => {
    const v = !!input[name];
    input[name] = false;
    return v;
  };
  return input;
}
