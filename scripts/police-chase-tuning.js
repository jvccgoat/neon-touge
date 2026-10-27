(() => {
  const originalStartChase = window.startChase;

  if (typeof originalStartChase !== 'function') return;

  window.startChase = function patchedStartChase(why) {
    if (why === 'Red light runner!') return;

    if (why === 'Hit and run!') {
      if (Math.random() >= 0.15) return;
    }

    return originalStartChase.call(this, why);
  };
})();
