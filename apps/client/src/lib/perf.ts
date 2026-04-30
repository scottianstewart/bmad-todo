export function markStart(name: string): void {
  performance.mark(`${name}:start`);
}

export function markEnd(name: string): { duration: number } {
  // If markStart was never called for this name, performance.measure throws
  // a SyntaxError. Bail out cleanly so callers don't have to wrap each markEnd
  // in a try/catch (mutation hooks fire markEnd in onSettled, which runs even
  // when onMutate's markStart didn't get called — e.g., when StrictMode
  // double-mounts a component in dev).
  if (performance.getEntriesByName(`${name}:start`, 'mark').length === 0) {
    return { duration: 0 };
  }

  performance.mark(`${name}:end`);
  performance.measure(name, `${name}:start`, `${name}:end`);

  const entries = performance.getEntriesByName(name, 'measure');
  const measure = entries.at(-1);
  const duration = measure?.duration ?? 0;

  performance.clearMarks(`${name}:start`);
  performance.clearMarks(`${name}:end`);
  performance.clearMeasures(name);

  return { duration };
}
