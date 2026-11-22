// The Gilded Vault — bootstrap, game loop and screens.
// ?shot=start|play|end&seed=N stages a deterministic screenshot scene instead
// of the title screen and sets window.__shotReady once it is painted.
import { STEP, VIEW, EVENT_LOOT, EVENT_WIN, EVENT_LOSE } from './config.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_WIN, SCREEN_LOSE } from './config.js';
import { createWorld, resetWorld, stepWorld } from './world.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { sfx, setAlarmHum, unlockAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

const world = { state: createWorld(seed) };
let screen = SCREEN_TITLE;
let shotScreen = null;

const input = createInput(canvas);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function startGame() {
  resetWorld(world.state);
  screen = SCREEN_PLAY;
  input.clear();
  prevAlarm = 0;
  prevGrace = 0;
  unlockAudio();
  sfx.click();
}

function backToTitle() {
  resetWorld(world.state);
  screen = SCREEN_TITLE;
  input.clear();
}

if (shotName) {
  shotScreen = stageShot(shotName, world).screen;
  screen = shotScreen;
  render(ctx, world.state, screen, world.state.time);
  window.__shotReady = true;
} else {
  window.__shotReady = false;
}

// Test hook: the playtest driver reads live state through this.
window.__vault = {
  get state() { return world.state; },
  get screen() { return screen; },
  start: startGame,
};

let lastTime = performance.now();
let accumulator = 0;
let lastGrabTick = 0;
let prevAlarm = 0;
let prevGrace = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (shotName) return; // staged scene: already painted once, stay frozen

  const presses = input.consumePresses();
  if (presses.confirm) unlockAudio();

  if (screen === SCREEN_TITLE) {
    if (presses.confirm) startGame();
  } else if (screen === SCREEN_PLAY) {
    if (presses.pause) {
      screen = SCREEN_PAUSED;
      setAlarmHum(false);
      sfx.click();
    }
  } else if (screen === SCREEN_PAUSED) {
    if (presses.pause || presses.confirm) {
      screen = SCREEN_PLAY;
      input.clear();
    } else if (presses.restart) {
      startGame();
    }
  } else if (screen === SCREEN_WIN || screen === SCREEN_LOSE) {
    if (presses.restart || presses.confirm) startGame();
    if (presses.pause) backToTitle();
  }

  if (screen === SCREEN_PLAY) {
    const move = input.move();
    const stepInput = {
      mx: move.mx,
      my: move.my,
      sneak: move.sneak,
      grab: move.grab,
      smoke: presses.smoke,
      emp: presses.emp,
    };
    if (presses.click) {
      // Click throws a smoke pellet at the clicked spot (if any are left).
      stepInput.smoke = true;
      stepInput.smokeAt = presses.click;
    }
    accumulator += elapsed;
    let events = 0;
    while (accumulator >= STEP) {
      events |= stepWorld(world.state, stepInput, STEP);
      stepInput.smoke = false;
      stepInput.emp = false;
      stepInput.smokeAt = undefined;
      accumulator -= STEP;
    }
    if (events & EVENT_LOOT) {
      sfx.loot();
      setAlarmHum(false);
    }
    if (prevAlarm < 50 && world.state.alarm >= 50) sfx.spotted();
    if (prevGrace <= 0 && world.state.grace > 0) sfx.spotted();
    prevAlarm = world.state.alarm;
    prevGrace = world.state.grace;
    if (events & EVENT_WIN) {
      screen = SCREEN_WIN;
      sfx.win();
      setAlarmHum(false);
    }
    if (world.state.grace > 0 && !world.state.over) {
      // Grace flash is playing; the sting already fired when it started.
    }
    if (events & EVENT_LOSE) {
      screen = SCREEN_LOSE;
      sfx.caught();
      setAlarmHum(false);
    }
    setAlarmHum(world.state.alarm > 45 && !world.state.over);
    if (world.state.grabProgress > 0 && world.state.grabProgress < 1 && world.state.time - lastGrabTick > 0.3) {
      lastGrabTick = world.state.time;
      sfx.grabTick();
    }
    if (presses.smoke && world.state.smokeUses < 3) sfx.smoke();
    if (presses.emp && world.state.empUses < 2) sfx.emp();
  }

  render(ctx, world.state, screen, world.state.time);
}

requestAnimationFrame(frame);
