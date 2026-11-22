// All drawing for The Gilded Vault: a night museum in deep teal and gold, with
// vision cones, shadow pools and the glowing sapphire as the visual language.
// Safe cover is dark wood and shadow, danger is amber and red, loot is blue.
import { CAMERA, GUARD, PLAYER, TOOLS, VIEW } from './config.js';
import { SCREEN_LOSE, SCREEN_PAUSED, SCREEN_TITLE, SCREEN_WIN } from './config.js';
import { EXIT_VENT, LOOT_POS, WALL } from './level.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  const grad = ctx.createRadialGradient(x, y, 10, x, y, range);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx, time) {
  // Marble checker, dark teal, with a gold art-deco border inset.
  const tile = 80;
  for (let y = 0; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      const even = ((x + y) / tile) % 2 === 0;
      ctx.fillStyle = even ? '#16242e' : '#132029';
      ctx.fillRect(x, y, tile, tile);
      ctx.strokeStyle = 'rgba(212,175,105,0.07)';
      ctx.strokeRect(x + 0.5, y + 0.5, tile, tile);
    }
  }
  // Red carpet runner down the middle of the hall.
  ctx.fillStyle = '#5d1a24';
  ctx.fillRect(0, 318, VIEW.width, 84);
  ctx.fillStyle = '#7a2230';
  ctx.fillRect(0, 326, VIEW.width, 68);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 326);
  ctx.lineTo(VIEW.width, 326);
  ctx.moveTo(0, 394);
  ctx.lineTo(VIEW.width, 394);
  ctx.stroke();
  // Gold border inset around the hall.
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.strokeRect(WALL + 8, WALL + 8, VIEW.width - 2 * WALL - 16, VIEW.height - 2 * WALL - 16);
  ctx.strokeStyle = 'rgba(201,162,39,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(WALL + 16, WALL + 16, VIEW.width - 2 * WALL - 32, VIEW.height - 2 * WALL - 32);
  void time;
}

function drawWalls(ctx) {
  ctx.fillStyle = '#0b141b';
  ctx.fillRect(0, 0, VIEW.width, WALL);
  ctx.fillRect(0, VIEW.height - WALL, VIEW.width, WALL);
  ctx.fillRect(0, 0, WALL, VIEW.height);
  ctx.fillRect(VIEW.width - WALL, 0, WALL, VIEW.height);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, WALL - 3, VIEW.width, 3);
  ctx.fillRect(0, VIEW.height - WALL, VIEW.width, 3);
  ctx.fillRect(WALL - 3, 0, 3, VIEW.height);
  ctx.fillRect(VIEW.width - WALL, 0, 3, VIEW.height);
  // Wall sconces: small gold lamps along the top wall.
  for (const x of [220, 640, 1060]) {
    ctx.fillStyle = '#e8c766';
    ctx.beginPath();
    ctx.arc(x, WALL - 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(232,199,102,0.18)';
    ctx.beginPath();
    ctx.arc(x, WALL - 8, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShadows(ctx, state) {
  for (const s of state.shadows) {
    ctx.fillStyle = 'rgba(4,10,18,0.55)';
    roundRect(ctx, s.x, s.y, s.w, s.h, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,160,200,0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawRopes(ctx, state) {
  // Velvet ropes are drawn from the level data stored on the world via a helper
  // in main.js; here we draw the ropes list passed through state.ropes.
  for (const rope of state.ropes) {
    const mx = (rope.x1 + rope.x2) / 2;
    const my = Math.max(rope.y1, rope.y2) + 10;
    ctx.strokeStyle = '#8e1f2f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rope.x1, rope.y1);
    ctx.quadraticCurveTo(mx, my, rope.x2, rope.y2);
    ctx.stroke();
    ctx.fillStyle = '#c9a227';
    for (const [px, py] of [[rope.x1, rope.y1], [rope.x2, rope.y2]]) {
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSolid(ctx, solid, time) {
  if (solid.kind === 'crate') {
    ctx.fillStyle = '#4a3421';
    ctx.fillRect(solid.x, solid.y, solid.w, solid.h);
    ctx.fillStyle = '#5d4228';
    ctx.fillRect(solid.x + 4, solid.y + 4, solid.w - 8, solid.h - 8);
    ctx.strokeStyle = '#2e2013';
    ctx.lineWidth = 2;
    ctx.strokeRect(solid.x + 4.5, solid.y + 4.5, solid.w - 9, solid.h - 9);
    ctx.beginPath();
    ctx.moveTo(solid.x + 4, solid.y + 4);
    ctx.lineTo(solid.x + solid.w - 4, solid.y + solid.h - 4);
    ctx.moveTo(solid.x + solid.w - 4, solid.y + 4);
    ctx.lineTo(solid.x + 4, solid.y + solid.h - 4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,199,102,0.75)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRAGILE', solid.x + solid.w / 2, solid.y + solid.h / 2 + 4);
    return;
  }
  // Display case: dark plinth, glass top, gold label.
  ctx.fillStyle = '#1c2b38';
  ctx.fillRect(solid.x, solid.y + solid.h - 16, solid.w, 16);
  ctx.fillStyle = 'rgba(150,200,235,0.16)';
  ctx.fillRect(solid.x + 3, solid.y + 3, solid.w - 6, solid.h - 16);
  ctx.strokeStyle = 'rgba(200,230,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(solid.x + 3.5, solid.y + 3.5, solid.w - 7, solid.h - 16);
  // Glass glint sweeping slowly.
  const glint = ((time * 0.25 + solid.x * 0.001) % 1) * (solid.w - 20);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.moveTo(solid.x + 8 + glint, solid.y + 4);
  ctx.lineTo(solid.x + 20 + glint, solid.y + 4);
  ctx.lineTo(solid.x + 8 + glint, solid.y + solid.h - 18);
  ctx.lineTo(solid.x - 4 + glint, solid.y + solid.h - 18);
  ctx.closePath();
  ctx.fill();
  if (solid.label) {
    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(solid.label, solid.x + solid.w / 2, solid.y + solid.h - 5);
  }
}

function drawLoot(ctx, state, time) {
  if (state.lootTaken) return;
  const pulse = 0.6 + 0.4 * Math.sin(time * 3);
  ctx.save();
  ctx.translate(LOOT_POS.x, LOOT_POS.y);
  ctx.fillStyle = `rgba(80,160,255,${0.25 + 0.2 * pulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, 34 + 6 * pulse, 0, Math.PI * 2);
  ctx.fill();
  // The Star Sapphire: a faceted blue gem.
  ctx.fillStyle = '#2f7fe0';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(13, -4);
  ctx.lineTo(9, 13);
  ctx.lineTo(-9, 13);
  ctx.lineTo(-13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#7db8ff';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(13, -4);
  ctx.lineTo(0, -2);
  ctx.lineTo(-13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#d6e9ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 13);
  ctx.moveTo(-13, -4);
  ctx.lineTo(13, -4);
  ctx.stroke();
  // Sparkles.
  ctx.fillStyle = `rgba(255,255,255,${pulse})`;
  for (const [sx, sy, r] of [[-22, -14, 2], [20, -18, 1.6], [24, 10, 2.2]]) {
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawExitVent(ctx, state, time) {
  const active = state.hasLoot;
  ctx.fillStyle = active ? '#274d2f' : '#1a2a20';
  roundRect(ctx, EXIT_VENT.x, EXIT_VENT.y, EXIT_VENT.w, EXIT_VENT.h, 6);
  ctx.fill();
  ctx.strokeStyle = active ? '#7be495' : '#4a6b52';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = active ? '#7be495' : '#3c5a44';
  ctx.lineWidth = 2;
  for (let i = 1; i < 5; i += 1) {
    const y = EXIT_VENT.y + (EXIT_VENT.h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(EXIT_VENT.x + 8, y);
    ctx.lineTo(EXIT_VENT.x + EXIT_VENT.w - 8, y);
    ctx.stroke();
  }
  if (active) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(123,228,149,${0.5 + 0.4 * pulse})`;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT — GO!', EXIT_VENT.x + EXIT_VENT.w / 2, EXIT_VENT.y - 8);
  } else {
    ctx.fillStyle = '#8aa890';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VENT (locked until loot)', EXIT_VENT.x + EXIT_VENT.w / 2, EXIT_VENT.y - 8);
  }
}

function drawGuard(ctx, g, time) {
  void time;
  // Vision cone first (under the guard), amber when calm, red when alerted.
  drawCone(ctx, g.x, g.y, g.angle, GUARD.coneRange, GUARD.coneHalfAngle,
    g.alerted ? 'rgba(255,64,48,0.30)' : 'rgba(255,190,80,0.20)');
  // Body: navy uniform, cap, flashlight dot.
  ctx.fillStyle = '#22384f';
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8fa8c0';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.fillStyle = '#101c28';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * 8, g.y + Math.sin(g.angle) * 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath();
  ctx.arc(g.x + Math.cos(g.angle) * (GUARD.radius + 4), g.y + Math.sin(g.angle) * (GUARD.radius + 4), 2.5, 0, Math.PI * 2);
  ctx.fill();
  if (g.alerted) {
    ctx.fillStyle = '#ff4030';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - GUARD.radius - 6);
  }
}

function drawCamera(ctx, cam, empFrozen) {
  const color = empFrozen ? 'rgba(120,140,160,0.12)' : 'rgba(255,80,60,0.28)';
  drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA.coneRange, CAMERA.coneHalfAngle, color);
  // Wall mount + lens.
  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(cam.x - 9, cam.y - 7, 18, 14);
  ctx.fillStyle = empFrozen ? '#5a6a78' : '#ff5040';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 9, cam.y + Math.sin(cam.angle) * 9, 4, 0, Math.PI * 2);
  ctx.fill();
  if (empFrozen) {
    ctx.fillStyle = '#9fb4c4';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', cam.x, cam.y - 14);
  }
}

function drawPlayer(ctx, state, time) {
  const p = state.player;
  const bob = p.moving ? Math.sin(time * 14) * 1.5 : 0;
  // Soft shadow under the thief.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + PLAYER.radius - 2, PLAYER.radius, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, gold trim, pale face sliver.
  ctx.fillStyle = '#1a1d24';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#2e3442';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 5, p.y + Math.sin(p.angle) * 5 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 8, p.y + Math.sin(p.angle) * 8 + bob, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Loot bag glint once the sapphire is taken.
  if (state.hasLoot) {
    ctx.fillStyle = '#2f7fe0';
    ctx.beginPath();
    ctx.arc(p.x - Math.cos(p.angle) * 10, p.y - Math.sin(p.angle) * 10 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Grab progress ring while prying the case open.
  if (state.grabProgress > 0 && !state.hasLoot) {
    ctx.strokeStyle = '#7db8ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, PLAYER.radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.grabProgress);
    ctx.stroke();
  }
}

function drawSmoke(ctx, state) {
  for (const cloud of state.smoke) {
    const alpha = Math.min(0.75, (cloud.ttl / TOOLS.smokeSeconds) * 0.9);
    ctx.fillStyle = `rgba(190,200,215,${alpha})`;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220,228,240,${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(cloud.x - cloud.r * 0.35, cloud.y - cloud.r * 0.2, cloud.r * 0.55, 0, Math.PI * 2);
    ctx.arc(cloud.x + cloud.r * 0.3, cloud.y + cloud.r * 0.25, cloud.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, state) {
  const pad = 14;
  const barW = 260;
  const barH = 16;
  const x = pad;
  const y = pad;
  // Alarm meter.
  ctx.fillStyle = 'rgba(8,12,18,0.72)';
  roundRect(ctx, x - 6, y - 6, barW + 150, 66, 8);
  ctx.fill();
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', x, y + 12);
  const alarmFrac = state.alarm / 100;
  ctx.fillStyle = '#2a1a1a';
  roundRect(ctx, x + 58, y, barW, barH, 4);
  ctx.fill();
  ctx.fillStyle = alarmFrac > 0.66 ? '#ff4030' : alarmFrac > 0.33 ? '#ff9a2a' : '#e8c766';
  if (alarmFrac > 0) {
    roundRect(ctx, x + 58, y, Math.max(8, barW * alarmFrac), barH, 4);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(232,220,192,0.6)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 58, y, barW, barH, 4);
  ctx.stroke();
  if (state.seen) {
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`SPOTTED by ${state.seenBy}`, x + 58 + barW + 10, y + 12);
  }
  // Second HUD row: loot, tools, timer, objective.
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '13px sans-serif';
  const lootText = state.hasLoot ? 'LOOT: Star Sapphire ✓' : 'LOOT: Star Sapphire —';
  ctx.fillText(lootText, x, y + 38);
  ctx.fillText(`SMOKE [Q]: ${state.smokeUses}   EMP [F]: ${state.empUses}${state.empTtl > 0 ? ` (${Math.ceil(state.empTtl)}s)` : ''}`, x, y + 56);
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60).toString().padStart(2, '0');
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${mins}:${secs}`, VIEW.width - pad, y + 12);
  ctx.fillText(state.hasLoot ? 'Reach the green EXIT vent!' : 'Steal the Star Sapphire — hold E at its case', VIEW.width - pad, y + 38);
  if (state.player.sneaking) {
    ctx.fillStyle = '#9fb4c4';
    ctx.fillText('SNEAKING (Shift)', VIEW.width - pad, y + 56);
  }
  ctx.textAlign = 'left';
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6,10,16,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW.width / 2, 250);
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW.width / 2, 300 + i * 30);
  });
  ctx.textAlign = 'left';
}

export function render(ctx, state, screen, time) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx, time);
  drawShadows(ctx, state);
  drawRopes(ctx, state);
  drawExitVent(ctx, state, time);
  for (const solid of state.solids) {
    if (solid.kind === 'wall') continue;
    drawSolid(ctx, solid, time);
  }
  drawLoot(ctx, state, time);
  drawWalls(ctx);
  // Vision cones live under the actors but over the floor.
  for (const cam of state.cameras) drawCamera(ctx, cam, state.empTtl > 0);
  for (const g of state.guards) drawGuard(ctx, g, time);
  drawSmoke(ctx, state);
  drawPlayer(ctx, state, time);
  drawHud(ctx, state);

  if (state.grace > 0 && !state.over) {
    ctx.fillStyle = `rgba(255,40,30,${0.25 + 0.2 * Math.sin(time * 16)})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#ff5040';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', VIEW.width / 2, VIEW.height / 2);
    ctx.textAlign = 'left';
    return;
  }

  if (screen === SCREEN_TITLE) {
    overlay(ctx, 'THE GILDED VAULT', [
      'One museum. One sapphire. Two guards, two cameras, one alarm.',
      'WASD / arrows — move    Shift — sneak    E — steal the sapphire',
      'Q — smoke pellet    F — EMP (freezes cameras)    Click — throw smoke',
      'Cross the hall unseen, grab the Star Sapphire, escape through the vent.',
      '',
      'Press ENTER to begin the heist',
    ], '#e8c766');
  } else if (screen === SCREEN_PAUSED) {
    overlay(ctx, 'PAUSED', ['The guards wait. The sapphire waits.', 'Press P to resume — R to restart'], '#9fb4c4');
  } else if (screen === SCREEN_WIN) {
    overlay(ctx, 'CLEAN GETAWAY', [
      `The Star Sapphire is yours. Score: ${state.score}`,
      `Time: ${Math.floor(state.time / 60)}:${Math.floor(state.time % 60).toString().padStart(2, '0')}   The museum never knew you were there.`,
      '',
      'Press R to run it again',
    ], '#7be495');
  } else if (screen === SCREEN_LOSE) {
    overlay(ctx, 'CAUGHT!', [
      `Caught by ${state.caughtBy || 'the alarm'}. The vault keeps its sapphire — this time.`,
      state.hasLoot ? 'You had the sapphire in hand. So close.' : 'The sapphire is still in its case.',
      '',
      'Press R to try again',
    ], '#ff5040');
  }
}
