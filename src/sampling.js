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
  return systematicDraw(rows, size, randomStream(seed));
}

function systematicDraw(rows, size, random) {
  const interval = rows.length / size;
  const value = random();
  const integer = Number.isInteger(interval);
  const start = integer ? 1 + Math.floor(value * interval) : (1 - value) * interval;
  const sample = Array.from({ length: size }, (_, j) =>
    rows[Math.min(rows.length, Math.ceil(start + j * interval)) - 1]);
  return { sample, interval, start, estimate: mean(sample) };
}

export function stratifiedSample(rows, size, seed) {
  return stratifiedDraw(rows, size, randomStream(seed));
}

function stratifiedDraw(rows, size, random) {
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

export function summarize(estimates, truth) {
  const center = estimates.reduce((sum, x) => sum + x, 0) / estimates.length;
  const rms = reference => Math.sqrt(estimates.reduce((sum, x) =>
    sum + (x - reference) ** 2, 0) / estimates.length);
  return { bias: center - truth, sd: rms(center), rmse: rms(truth) };
}

export function repeatedSampling(rows, method, size, seed, repetitions) {
  const interval = rows.length / size;
  const exact = method === 'systematic' && Number.isInteger(interval);
  const random = randomStream(seed);
  const estimates = Array.from({ length: exact ? interval : repetitions }, (_, i) => {
    if (exact) return mean(Array.from({ length: size }, (_, j) => rows[i + j * interval]));
    if (method === 'random') return mean(draw(rows, size, random));
    return (method === 'systematic' ? systematicDraw : stratifiedDraw)(rows, size, random).estimate;
  });
  return { method, size, seed: exact ? null : seed, exact, estimates, ...summarize(estimates, mean(rows)) };
}

export function runExperiments(rows, seed, repetitions) {
  const run = (method, size) => repeatedSampling(rows, method, size, seed, repetitions);
  const random100 = run('random', 100);
  return [
    [random100, run('systematic', 100), run('stratified', 100)],
    [run('random', 1), run('random', 10), random100],
  ];
}

export function alignedBins(results, truth) {
  const values = results.flatMap(result => result.estimates);
  const minimum = Math.min(truth, ...values);
  const maximum = Math.max(truth, ...values);
  const low = minimum === maximum ? minimum - 1 : minimum;
  const high = minimum === maximum ? maximum + 1 : maximum;
  const width = (high - low) / 20;
  const percentages = results.map(({ estimates }) => {
    const counts = Array(20).fill(0);
    for (const value of estimates) counts[Math.min(19, Math.floor((value - low) / width))]++;
    return counts.map(count => 100 * count / estimates.length);
  });
  return { low, high, width, percentages, scale: Math.ceil(Math.max(...percentages.flat()) / 10) * 10 };
}
