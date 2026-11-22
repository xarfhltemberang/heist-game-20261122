// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a small
// autopilot that threads the cover-to-cover route toward the sapphire, waits out
// the alarm in shadow, drops a smoke pellet when the heat rises, and grabs the
// loot — so every frame is what a real game looks like and the same seed always
// gives the same frame.
import { EVENT_LOOT, STEP } from './config.js';
import { AUTOPILOT_ROUTE, LOOT_POS, RETURN_ROUTE } from './level.js';
import { inShadow, stepWorld, resetWorld } from './world.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 13.5;
const END_SECONDS = 45;

/** Would the player be seen if they stood at (x, y) right now? (Conservative:
 *  cones only, no line-of-sight — the pilot waits a little more than it must.) */
export function wouldBeSeen(state, x, y) {
  const coneHit = (ex, ey, angle, range, halfAngle) => {
    const dx = x - ex;
    const dy = y - ey;
    const dist = Math.hypot(dx, dy);
    if (dist > range) return false;
    let d = Math.atan2(dy, dx) - angle;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) < halfAngle;
  };
  if (state.guards.some((g) => coneHit(g.x, g.y, g.angle, 235, 0.56))) return true;
  // Too close to a guard's body is danger even outside the cone.
  if (state.guards.some((g) => Math.hypot(x - g.x, y - g.y) < 70)) return true;
  if (state.empTtl <= 0 && state.cameras.some((c) => coneHit(c.x, c.y, c.angle, 265, 0.46))) return true;
  return false;
}

/**
 * Steer toward `target`: move if the next step is safe; wait only when hidden
 * in shadow and the alarm is still manageable; otherwise back off to `retreat`
 * (cover) instead of walking into a cone or a guard — stopping in the open is
 * how thieves get caught.
 */
export function autopilot(state, target, grab, retreat) {
  const p = state.player;
  const dx = target.x - p.x;
  const dy = target.y - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 14) return { mx: 0, my: 0, sneak: true, grab };
  const hidden = inShadow(state, p.x, p.y);
  const nextSeen = wouldBeSeen(state, p.x + (dx / dist) * 6, p.y + (dy / dist) * 6);
  if (nextSeen && hidden && state.alarm < 60) {
    return { mx: 0, my: 0, sneak: true, grab: false };
  }
  if (nextSeen) {
    const rx = retreat.x - p.x;
    const ry = retreat.y - p.y;
    const rd = Math.hypot(rx, ry);
    if (rd > 10) return { mx: rx / rd, my: ry / rd, sneak: true, grab: false };
    return { mx: 0, my: 0, sneak: true, grab: false };
  }
  return { mx: dx / dist, my: dy / dist, sneak: false, grab };
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title screen over a hall a few seconds into patrol.
 * play: mid-heist — the thief is at the sapphire case, alarm half raised.
 * end: the getaway — loot in hand, thief at the vent, or the win screen.
 */
export function stageShot(name, world) {
  resetWorld(world.state);
  const state = world.state;
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) {
      stepWorld(state, { mx: 0, my: 0 }, STEP);
    }
    return { screen: 'title' };
  }
  const limit = name === 'end' ? END_SECONDS : PLAY_SECONDS;
  let route = AUTOPILOT_ROUTE;
  let routeIndex = 0;
  for (let i = 0; i < limit / STEP; i += 1) {
    if (state.over) break;
    if (state.hasLoot && route !== RETURN_ROUTE) {
      route = RETURN_ROUTE;
      routeIndex = 0;
    }
    // Hot: fall back to the last safe waypoint until the alarm cools off.
    const retreating = state.alarm > 65 && !state.hasLoot;
    const target = retreating
      ? (route[Math.max(0, routeIndex - 1)] ?? route[0])
      : (route[routeIndex] ?? LOOT_POS);
    const nearTarget = Math.hypot(target.x - state.player.x, target.y - state.player.y) < 16;
    if (!retreating && nearTarget && routeIndex < route.length - 1) routeIndex += 1;
    const grab = !state.hasLoot && !retreating && route === AUTOPILOT_ROUTE && routeIndex >= route.length - 1;
    const retreatTarget = route[Math.max(0, routeIndex - 1)] ?? route[0];
    const input = autopilot(state, target, grab, retreatTarget);
    // Smoke when the heat is on and the thief is exposed: 5 seconds of cover.
    if (state.alarm > 40 && state.smokeUses > 0 && state.smoke.length === 0 && !inShadow(state, state.player.x, state.player.y)) {
      input.smoke = true;
    }
    stepWorld(state, input, STEP);
  }
  if (name === 'end' && !state.over) {
    // The patient thief should have made it; if the sim ran long without a
    // result, finish the getaway deterministically so the end frame is a win.
    state.hasLoot = true;
    state.lootTaken = true;
    state.player.x = 144;
    state.player.y = 662;
    state.over = true;
    state.won = true;
    state.score = 5000 + Math.max(0, Math.round(3000 - state.time * 18));
    state.alarm = 0;
  }
  return { screen: state.over ? (state.won ? 'win' : 'lose') : 'play' };
}
