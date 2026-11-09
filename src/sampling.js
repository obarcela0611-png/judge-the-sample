export const BAND = 5000;
export const mean = rows => rows.reduce((sum, row) => sum + row.charges, 0) / rows.length;

function randomStream(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function draw(rows, size, random) {
  const shuffled = [...rows];
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(random() * (rows.length - i));
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

export function randomSample(rows, size, seed) {
  return draw(rows, size, randomStream(seed));
}

export function systematicSample(rows, size, seed) {
  const interval = rows.length / size;
  const random = randomStream(seed)();
  const integer = Number.isInteger(interval);
  const start = integer ? 1 + Math.floor(random * interval) : (1 - random) * interval;
  const sample = Array.from({ length: size }, (_, j) =>
    rows[Math.min(rows.length, Math.ceil(start + j * interval)) - 1]);
  return { sample, interval, start, estimate: mean(sample) };
}

export function stratifiedSample(rows, size, seed) {
  const random = randomStream(seed);
  const groups = ['no', 'yes'].map(smoker => {
    const members = rows.filter(row => row.smoker === smoker);
    const weight = members.length / rows.length;
    const quota = size * weight;
    return { smoker, members, weight, quota, count: Math.max(1, Math.floor(quota)) };
  });
  let remaining = size - groups.reduce((sum, group) => sum + group.count, 0);
  const priority = [...groups].sort((a, b) => (b.quota - b.count) - (a.quota - a.count));
  for (const group of priority) {
    if (remaining > 0 && group.count < group.members.length) {
      group.count++;
      remaining--;
    }
  }
  const allocation = groups.map(({ members, ...group }) =>
    ({ ...group, population: members.length, sample: draw(members, group.count, random) }));
  return {
    allocation,
    sample: allocation.flatMap(group => group.sample),
    estimate: allocation.reduce((sum, group) => sum + group.weight * mean(group.sample), 0),
  };
}
