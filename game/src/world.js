// The heist simulation: one fixed-step world. Pure logic, no drawing, no sound —
// the renderer and the screenshot autopilot both read this state.
import {
  ALARM, CAMERA, EVENT_LOSE, EVENT_LOOT, EVENT_NONE, EVENT_SEEN, EVENT_WIN,
  GUARD, LOOT, PLAYER, STEP, TOOLS,
} from './config.js';
import { buildCameras, buildGuards, buildRopes, buildShadows, buildSolids } from './level.js';
import { ENTRANCE, EXIT_VENT, LOOT_CASE, LOOT_POS } from './level.js';
import { makeRng } from './random.js';

export function createWorld(seed) {
  const rng = makeRng(seed);
  const solids = buildSolids();
  const state = {
    seed,
    time: 0,
    over: false,
    won: false,
    caught: false,
    caughtBy: '',
    grace: 0, // seconds left in the "SPOTTED!" grace flash before the caught screen
    player: { x: ENTRANCE.x, y: ENTRANCE.y, angle: 0, sneaking: false, moving: false },
    hasLoot: false,
    grabProgress: 0, // 0..1 while holding E at the sapphire case
    alarm: 0,
    seen: false, // seen this step, by anyone
    seenBy: '',
    smoke: [], // {x, y, r, ttl}
    empTtl: 0,
    smokeUses: TOOLS.smokeUses,
    empUses: TOOLS.empUses,
    guards: buildGuards().map((g) => ({
      name: g.name,
      waypoints: g.waypoints,
      pauseSeconds: g.pauseSeconds,
      target: 1,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      angle: 0,
      pause: 0.6,
      alerted: false,
    })),
    cameras: buildCameras().map((c) => ({
      x: c.x, y: c.y, baseAngle: c.baseAngle, sweep: c.sweep, phase: c.phase, angle: c.baseAngle,
    })),
    solids,
    shadows: buildShadows(),
    ropes: buildRopes(),
    lootTaken: false,
    score: 0,
    rngPhase: rng(),
  };
  return state;
}

export function resetWorld(state) {
  const fresh = createWorld(state.seed);
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
}

// --- geometry helpers -------------------------------------------------------

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Liang-Barsky clipping: does the segment enter the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rect.x, rect.x + rect.w - x1, y1 - rect.y, rect.y + rect.h - y1];
  let t0 = 0;
  let t1 = 1;
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function lineOfSightBlocked(state, x1, y1, x2, y2) {
  for (const solid of state.solids) {
    if (solid.kind === 'wall') continue; // the hall border never blocks inside sight lines
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return true;
  }
  return false;
}

export function inShadow(state, x, y) {
  return state.shadows.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

function inSmoke(state, x, y) {
  return state.smoke.some((s) => {
    const dx = x - s.x;
    const dy = y - s.y;
    return dx * dx + dy * dy < s.r * s.r;
  });
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can `eye` (at ex,ey, facing `angle`, cone range/half-angle) see the player?
function canSee(state, ex, ey, angle, range, halfAngle) {
  const p = state.player;
  const dx = p.x - ex;
  const dy = p.y - ey;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (Math.abs(angleDiff(angleTo(ex, ey, p.x, p.y), angle)) > halfAngle) return false;
  if (inSmoke(state, p.x, p.y)) return false;
  if (lineOfSightBlocked(state, ex, ey, p.x, p.y)) return false;
  // Shadows shrink the effective range: a thief in the dark is only spotted close up.
  if (inShadow(state, p.x, p.y) && dist > range * 0.45) return false;
  return true;
}

function moveCircle(state, entity, dx, dy, radius) {
  // Axis-separated movement so the thief slides along crates and cases.
  const nx = entity.x + dx;
  if (!state.solids.some((s) => circleHitsRect(nx, entity.y, radius, s))) entity.x = nx;
  const ny = entity.y + dy;
  if (!state.solids.some((s) => circleHitsRect(entity.x, ny, radius, s))) entity.y = ny;
}

function nearLootCase(state) {
  const p = state.player;
  const nx = Math.max(LOOT_CASE.x, Math.min(p.x, LOOT_CASE.x + LOOT_CASE.w));
  const ny = Math.max(LOOT_CASE.y, Math.min(p.y, LOOT_CASE.y + LOOT_CASE.h));
  return Math.hypot(p.x - nx, p.y - ny) < 70;
}

function inExitVent(state) {
  const p = state.player;
  return p.x > EXIT_VENT.x && p.x < EXIT_VENT.x + EXIT_VENT.w
    && p.y > EXIT_VENT.y && p.y < EXIT_VENT.y + EXIT_VENT.h;
}

// --- one fixed step ---------------------------------------------------------
// `input` is {mx, my, sneak, grab, smoke, smokeAt, emp} — all optional.
// Returns an event bitmask (EVENT_WIN / EVENT_LOSE / EVENT_LOOT / EVENT_SEEN).
export function stepWorld(state, input, dt = STEP) {
  if (state.over) return EVENT_NONE;
  state.time += dt;
  const p = state.player;
  let events = EVENT_NONE;

  // Grace countdown: the alarm already hit 100%, the "SPOTTED!" flash plays out.
  if (state.grace > 0) {
    state.grace -= dt;
    if (state.grace <= 0) {
      state.over = true;
      state.caught = true;
      return EVENT_LOSE;
    }
    return EVENT_NONE;
  }

  // --- tools ---------------------------------------------------------------
  if (input.smoke && state.smokeUses > 0) {
    const tx = input.smokeAt ? input.smokeAt.x : p.x;
    const ty = input.smokeAt ? input.smokeAt.y : p.y;
    state.smoke.push({ x: tx, y: ty, r: TOOLS.smokeRadius, ttl: TOOLS.smokeSeconds });
    state.smokeUses -= 1;
  }
  if (input.emp && state.empUses > 0) {
    state.empTtl = TOOLS.empSeconds;
    state.empUses -= 1;
  }
  for (const cloud of state.smoke) cloud.ttl -= dt;
  state.smoke = state.smoke.filter((c) => c.ttl > 0);
  if (state.empTtl > 0) state.empTtl -= dt;

  // --- player movement ------------------------------------------------------
  const speed = input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const mx = input.mx ?? 0;
  const my = input.my ?? 0;
  const len = Math.hypot(mx, my);
  p.moving = len > 0.01;
  p.sneaking = !!input.sneak;
  if (p.moving) {
    p.angle = Math.atan2(my, mx);
    moveCircle(state, p, (mx / len) * speed * dt, (my / len) * speed * dt, PLAYER.radius);
  }

  // --- loot grab ------------------------------------------------------------
  if (!state.hasLoot && nearLootCase(state) && input.grab) {
    state.grabProgress += dt / PLAYER.grabSeconds;
    if (state.grabProgress >= 1) {
      state.hasLoot = true;
      state.lootTaken = true;
      state.grabProgress = 1;
      events |= EVENT_LOOT;
    }
  } else if (!state.hasLoot) {
    state.grabProgress = Math.max(0, state.grabProgress - dt * 2);
  }

  // --- guards patrol ---------------------------------------------------------
  for (const g of state.guards) {
    if (g.pause > 0) {
      g.pause -= dt;
      if (g.pause <= 0) {
        // Face the next waypoint before walking.
        const wp = g.waypoints[g.target];
        g.angle = angleTo(g.x, g.y, wp.x, wp.y);
      }
      continue;
    }
    const wp = g.waypoints[g.target];
    const dx = wp.x - g.x;
    const dy = wp.y - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      g.target = (g.target + 1) % g.waypoints.length;
      g.pause = g.pauseSeconds;
      continue;
    }
    const stepLen = Math.min(dist, GUARD.speed * dt);
    g.x += (dx / dist) * stepLen;
    g.y += (dy / dist) * stepLen;
    g.angle = angleTo(g.x, g.y, wp.x, wp.y);
  }

  // --- cameras sweep ----------------------------------------------------------
  for (const cam of state.cameras) {
    if (state.empTtl > 0) continue; // EMP frozen: cone holds still, sees nothing
    cam.angle = cam.baseAngle + Math.sin(state.time * CAMERA.sweepSpeed + cam.phase) * cam.sweep;
  }

  // --- detection --------------------------------------------------------------
  let seen = false;
  let seenBy = '';
  let seenRate = 0;
  for (const g of state.guards) {
    g.alerted = false;
    if (canSee(state, g.x, g.y, g.angle, GUARD.coneRange, GUARD.coneHalfAngle)) {
      seen = true;
      seenBy = g.name;
      seenRate = ALARM.guardSeenPerSecond;
      g.alerted = true;
    }
  }
  if (!seen && state.empTtl <= 0) {
    for (const cam of state.cameras) {
      if (canSee(state, cam.x, cam.y, cam.angle, CAMERA.coneRange, CAMERA.coneHalfAngle)) {
        seen = true;
        seenBy = 'Security camera';
        seenRate = ALARM.cameraSeenPerSecond;
        break;
      }
    }
  }
  state.seen = seen;
  state.seenBy = seenBy;
  if (seen) {
    events |= EVENT_SEEN;
    const sneakFactor = p.sneaking ? 0.55 : 1;
    state.alarm = Math.min(100, state.alarm + seenRate * sneakFactor * dt);
  } else {
    const decay = inShadow(state, p.x, p.y) ? ALARM.shadowDecayPerSecond : ALARM.decayPerSecond;
    state.alarm = Math.max(0, state.alarm - decay * dt);
  }

  // --- caught? ------------------------------------------------------------------
  if (state.alarm >= 100) {
    state.caughtBy = seenBy || 'the alarm';
    state.grace = ALARM.graceSeconds;
    return events;
  }
  for (const g of state.guards) {
    if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD.touchRadius) {
      state.caughtBy = g.name;
      state.grace = ALARM.graceSeconds;
      return events;
    }
  }

  // --- win? ---------------------------------------------------------------------
  if (state.hasLoot && inExitVent(state)) {
    state.over = true;
    state.won = true;
    state.score = LOOT.value + Math.max(0, Math.round(LOOT.timeBonusBase - state.time * LOOT.timeBonusPerSecond));
    return events | EVENT_WIN;
  }

  return events;
}

export { LOOT_POS, EXIT_VENT };
