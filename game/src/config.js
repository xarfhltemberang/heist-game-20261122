// Shared constants for The Gilded Vault: one museum floor, one night, one sapphire.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 205,
  sneakSpeed: 110,
  grabSeconds: 1.2,
};

export const GUARD = {
  radius: 14,
  speed: 78,
  coneRange: 235,
  coneHalfAngle: 0.56, // ~32 degrees each side
  touchRadius: 27,
};

export const CAMERA = {
  coneRange: 265,
  coneHalfAngle: 0.46, // ~26 degrees each side
  sweepSpeed: 0.55, // radians per second
};

export const ALARM = {
  guardSeenPerSecond: 52,
  cameraSeenPerSecond: 34,
  decayPerSecond: 13,
  shadowDecayPerSecond: 30,
  graceSeconds: 0.9, // "SPOTTED!" flash before the caught screen
};

export const TOOLS = {
  smokeUses: 3,
  smokeRadius: 95,
  smokeSeconds: 5,
  empUses: 2,
  empSeconds: 6,
};

export const LOOT = { value: 5000, timeBonusBase: 3000, timeBonusPerSecond: 18 };

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

export const EVENT_NONE = 0;
export const EVENT_WIN = 1 << 0;
export const EVENT_LOSE = 1 << 1;
export const EVENT_LOOT = 1 << 2;
export const EVENT_SEEN = 1 << 3;
