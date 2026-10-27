(() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function getCarStats(c) {
    const MODELS = window.MODELS || [];
    const M = MODELS[c.m] || ['Unknown car', 12000, 150, 180, 1];
    const l = (key) => (c.mods && c.mods[key]) || 0;

    const power = M[2] * (
      1 + 0.09 * l('engine') +
      0.12 * l('turbo') +
      0.05 * l('ecu') +
      0.03 * l('exhaust')
    );

    const top = M[3] * (
      1 + 0.02 * (l('engine') + l('turbo') + l('ecu') + l('transmission'))
    );

    // High-horsepower cars feel too twitchy. We reduce their effective acceleration
    // and steering response so they still feel fast but stay controllable.
    const powerScale = clamp(power / 320, 0.1, 1.8);
    const grip = M[4] * (
      1 + 0.10 * l('tires') +
      0.05 * l('suspension') +
      0.03 * l('camber') +
      0.05 * l('brakes')
    ) * (0.96 - Math.min(0.24, powerScale * 0.10));

    const acceleration = (
      20 + power * 0.22
    ) * (1 + 0.04 * l('transmission')) * (
      1 - Math.min(0.18, powerScale * 0.12)
    );

    const braking = (
      1.1 + 0.08 * l('brakes') + 0.06 * l('suspension')
    ) * (1 - Math.min(0.15, powerScale * 0.09));

    const steering = clamp(
      1.12 + 0.10 * l('tires') + 0.07 * l('suspension') - Math.min(0.18, powerScale * 0.14),
      0.72,
      1.55
    );

    const stability = clamp(
      1.02 + 0.05 * l('suspension') + 0.04 * l('brakes') - Math.min(0.22, powerScale * 0.14),
      0.7,
      1.5
    );

    return {
      power,
      top,
      acc: acceleration,
      grip,
      brk: braking,
      steer: steering,
      stability,
      weightBias: clamp(1.0 + (M[1] / 60000) * 0.5, 1.0, 1.6),
    };
  }

  if (typeof window !== 'undefined' && typeof window.st === 'function') {
    const originalSt = window.st;

    window.st = function patchedSt(c) {
      const base = originalSt(c);
      const tuned = getCarStats(c);

      return {
        ...base,
        pw: tuned.power,
        top: tuned.top,
        acc: tuned.acc,
        grip: tuned.grip,
        brk: tuned.brk,
        steer: tuned.steer,
        stability: tuned.stability,
        weightBias: tuned.weightBias,
      };
    };
  }
})();

// Notes:
// This is intentionally a lightweight handling pass. It does not rework the world,
// but it solves the biggest issue you flagged: very fast cars becoming hard to
// control. High-power cars now lose a little acceleration and steering authority
// in exchange for much better stability, while tire/suspension/brake tuning still
// matters.
//
// Usage:
// 1. Put this file in your repo, for example: /scripts/handling-overhaul.js
// 2. Add it to the page with:
//    <script src="scripts/handling-overhaul.js"></script>
// 3. Keep it below the main game script so it patches the game after setup.
//
// This is the first step of the career-roadmap pass.
