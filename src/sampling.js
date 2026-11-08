export const BAND = 5000;
export const mean = rows => rows.reduce((sum, row) => sum + row.charges, 0) / rows.length;

export function randomSample(rows, size, seed) {
  const shuffled = [...rows];
  let state = seed >>> 0;
  for (let i = 0; i < size; i++) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const j = i + Math.floor(state / 4294967296 * (rows.length - i));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, size);
}

export function costBands(population, sample) {
  const count = Math.floor(Math.max(...population.map(row => row.charges)) / BAND) + 1;
  return ['no', 'yes'].map(smoker => {
    const tally = rows => {
      const bins = Array(count).fill(0);
      const group = rows.filter(row => row.smoker === smoker);
      for (const row of group) bins[Math.floor(row.charges / BAND)]++;
      return { size: group.length, bins };
    };
    const all = tally(population);
    const drawn = tally(sample);
    return { smoker, all, drawn };
  });
}
