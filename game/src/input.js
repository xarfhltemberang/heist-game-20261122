// Keyboard + mouse input for the heist. Keys are edge-triggered for tools
// (smoke / EMP fire once per press); movement keys are held state.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // keys pressed since the last consume
  let mouseClick = null; // {x, y} in view coordinates, consumed once
  let mousePos = { x: 0, y: 0 };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'grab', Space: 'grab',
    KeyQ: 'smoke',
    KeyF: 'emp',
    KeyP: 'pause', Escape: 'pause',
    Enter: 'confirm',
    KeyR: 'restart',
  };

  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'grab'].includes(action)) event.preventDefault();
    if (!event.repeat) {
      keys.add(action);
      pressed.add(action);
    }
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  }

  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseClick = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function onMove(event) {
    const rect = canvas.getBoundingClientRect();
    mousePos = {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onClick);
  canvas.addEventListener('mousemove', onMove);

  return {
    // Movement vector for this frame, from held keys.
    move() {
      let mx = 0;
      let my = 0;
      if (keys.has('left')) mx -= 1;
      if (keys.has('right')) mx += 1;
      if (keys.has('up')) my -= 1;
      if (keys.has('down')) my += 1;
      return { mx, my, sneak: keys.has('sneak'), grab: keys.has('grab') };
    },
    // One-shot actions pressed since the last call; each fires at most once.
    consumePresses() {
      const out = {
        smoke: pressed.has('smoke'),
        emp: pressed.has('emp'),
        pause: pressed.has('pause'),
        confirm: pressed.has('confirm'),
        restart: pressed.has('restart'),
        click: mouseClick,
        mousePos,
      };
      pressed.clear();
      mouseClick = null;
      return out;
    },
    clear() {
      keys.clear();
      pressed.clear();
      mouseClick = null;
    },
  };
}
