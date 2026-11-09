import React, { useState } from 'react';
import { alignedBins, runExperiments } from './sampling.js';

const labels = { random: 'Simple random', systematic: 'Systematic', stratified: 'Stratified by smoking status' };
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const axisUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function Comparison({ title, results, truth }) {
  const { low, high, width, percentages, scale } = alignedBins(results, truth);
  const plot = { x: 35, y: 30, width: 250, height: 85 };
  const baseline = plot.y + plot.height;
  const reference = plot.x + plot.width * (truth - low) / (high - low);
  return <section>
    <h3>{title}</h3>
    <div className="histograms">
      {results.map((result, i) => <figure key={i}>
        <figcaption>{labels[result.method]} · n = {result.size}</figcaption>
        <svg viewBox="0 0 310 148" role="img" aria-label={`Distribution of estimates. True mean ${usd.format(truth)}. Vertical scale zero to ${scale} percent per bin.`}>
          <text x={plot.x} y="14" fontSize="11">True mean {usd.format(truth)}</text>
          <line x1={plot.x} x2={plot.x} y1={plot.y} y2={baseline} stroke="#809395" />
          <line x1={plot.x} x2={plot.x + plot.width} y1={baseline} y2={baseline} stroke="#809395" />
          <text x="30" y={plot.y + 4} textAnchor="end" fontSize="10">{scale}%</text>
          <text x="30" y={baseline} textAnchor="end" fontSize="10">0%</text>
          {percentages[i].map((pct, j) => {
            const h = plot.height * pct / scale;
            return <rect key={j} x={plot.x + j * plot.width / 20} y={baseline - h} width={plot.width / 20 - 1} height={h} fill="#286e93">
              <title>{usd.format(low + j * width)} to {usd.format(j === 19 ? high : low + (j + 1) * width)}: {pct.toFixed(1)}%</title>
            </rect>;
          })}
          <line x1={reference} x2={reference} y1={plot.y - 5} y2={baseline} stroke="#a62a24" strokeWidth="2" />
          <text x={plot.x} y={baseline + 16} fontSize="10">{axisUsd.format(low)}</text>
          <text x={plot.x + plot.width} y={baseline + 16} textAnchor="end" fontSize="10">{axisUsd.format(high)}</text>
        </svg>
      </figure>)}
    </div>
    <div className="results-scroll" tabIndex={0} role="region" aria-label={title + ' results'}>
      <table><thead><tr>{['Method', 'Sample size', 'Run type', 'Seed', 'Repetitions or starts', 'Bias (USD)', 'SD (USD)', 'RMSE (USD)'].map(label =>
        <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{results.map((result, i) => <tr key={i}>
          <th scope="row">{labels[result.method]}</th><td>{result.size}</td>
          <td>{result.exact ? 'Exact' : 'Monte Carlo'}</td><td>{result.seed ?? '—'}</td>
          <td>{result.estimates.length}</td><td>{usd.format(result.bias)}</td>
          <td>{usd.format(result.sd)}</td><td>{usd.format(result.rmse)}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

export default function Experiments({ population, truth }) {
  const [seed, setSeed] = useState('20261108');
  const [repetitions, setRepetitions] = useState('100');
  const [submitted, setSubmitted] = useState(false);
  const [run, setRun] = useState(null);
  const seedValid = /^\d+$/.test(seed) && Number(seed) <= 4294967295;
  const repetitionsValid = /^\d+$/.test(repetitions) && Number(repetitions) >= 100 && Number(repetitions) <= 1000;
  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!seedValid || !repetitionsValid) return;
    setRun({ seed: Number(seed), repetitions: Number(repetitions), results: runExperiments(population, Number(seed), Number(repetitions)) });
  }
  return <section className="panel experiments" aria-labelledby="repeat-heading">
    <h2 id="repeat-heading">Repeated sampling</h2>
    <p>Compare methods at the same sample size, then compare sample sizes using simple random sampling. Each repetition produces one estimate.</p>
    <form onSubmit={submit}>
      <div className="controls">
        <label>Experiment seed<input inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value)} aria-invalid={submitted && !seedValid} aria-describedby={submitted && !seedValid ? 'experiment-seed-error' : undefined} />
          {submitted && !seedValid && <span className="error" id="experiment-seed-error" role="alert">Enter a whole number from 0 to 4,294,967,295.</span>}
        </label>
        <label>Repetitions<input inputMode="numeric" value={repetitions} onChange={e => setRepetitions(e.target.value)} aria-invalid={submitted && !repetitionsValid} aria-describedby={submitted && !repetitionsValid ? 'experiment-count-error' : undefined} />
          {submitted && !repetitionsValid && <span className="error" id="experiment-count-error" role="alert">Enter a whole number from 100 to 1,000.</span>}
        </label>
      </div>
      <button type="submit">Run experiments</button>
    </form>
    {run && <>
      <p role="status">Displayed run: seed {run.seed}, {run.repetitions.toLocaleString()} Monte Carlo repetitions per condition. Exact results use every possible start.</p>
      <p>Each bar shows the percentage of estimates in its dollar band. The red line marks the true population mean.</p>
      <Comparison title="Compare methods at n = 100" results={run.results[0]} truth={truth} />
      <Comparison title="Compare simple random sample sizes" results={run.results[1]} truth={truth} />
    </>}
  </section>;
}
