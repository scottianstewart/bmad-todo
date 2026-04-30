export function markStart(name: string): void {
  performance.mark(`${name}:start`);
}

export function markEnd(name: string): { duration: number } {
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
