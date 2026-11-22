[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/xarfhltemberang/heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/xarfhltemberang/heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

# The Gilded Vault

A top-down stealth heist in a museum at night. You are the thief: cross the hall
unseen, pry the Star Sapphire out of its display case, and escape through the vent —
while two patrolling guards and two sweeping security cameras watch the room and the
alarm meter climbs every second you are spotted.

- **Read the room before you move.** Guards and cameras project visible vision
  cones; crates block sight, shadow pools hide you, and sneaking (Shift) makes you
  harder to spot.
- **Tools cost you.** Smoke pellets (Q, or click to throw) break line of sight;
  an EMP (F) freezes the cameras — both in short supply.
- **The grab is the gamble.** Stealing the sapphire takes 1.2 seconds holding E
  at its case, standing in the open. Then the vent unlocks and the getaway begins.
- **Fair failure.** The alarm gives you a "SPOTTED!" grace moment before the
  guards close in; getting touched ends the run, and R restarts instantly.

## How to run it

Serve `game/` on localhost and open it in a desktop browser — no build step, no
network requests, everything is static and offline:

```sh
node serve.ts
# then open http://localhost:8080
```

Controls: WASD / arrow keys to move, Shift to sneak, E to steal the sapphire,
Q for a smoke pellet, F for EMP, P to pause, R to restart, Enter to start.

## Screenshots

The three screenshots in `screenshots/` are real renders of this game's own code,
staged deterministically with `?shot=start|play|end&seed=1` — the play scene is a
mid-heist frame with the thief at the sapphire case under the guards' cones.
