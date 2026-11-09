import React, { useState } from 'react';
import { mean, repeatedSampling } from './sampling.js';

const size = 100;
const bands = ['18-29', '30-39', '40-49', '50-64'];
const label = band => band.replace('-', '–');
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const methods = [['random', 'Simple random'], ['stratified', 'Stratified by smoking status']];

export function challengeResults(population, band, seed, repetitions) {
  const datasets = [
    { name: 'Full dataset', rows: population },
    { name: 'Age ' + label(band), rows: population.filter(row => row.ageBand === band) },
  ];
  return methods.map(([id, method]) => ({
    method,
    results: datasets.map(({ name, rows }) => ({
      name, count: rows.length, truth: mean(rows),
      ...repeatedSampling(rows, id, size, seed, repetitions),
    })),
  }));
}

export default function Challenge({ population }) {
  const [band, setBand] = useState('40-49');
  const [seed, setSeed] = useState('20261108');
  const [repetitions, setRepetitions] = useState('100');
  const [submitted, setSubmitted] = useState(false);
  const [run, setRun] = useState(null);
  const seedValid = /^\d+$/.test(seed) && Number(seed) <= 4294967295;
  const countValid = /^\d+$/.test(repetitions) && Number(repetitions) >= 100 && Number(repetitions) <= 1000;

  function submit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!seedValid || !countValid) return;
    setRun({ band, pairs: challengeResults(population, band, Number(seed), Number(repetitions)) });
  }

  const scale = run && (Math.max(...run.pairs.flatMap(pair => pair.results.map(result => result.rmse))) || 1);

  return <section className="panel experiments challenge" aria-labelledby="challenge-heading">
    <h2 id="challenge-heading">Challenge a method</h2>
    <p>Compare the full dataset with one age band using simple random and smoking-status stratified sampling. Each sample has {size} records.</p>
    <form onSubmit={submit}>
      <div className="controls">
        <label>Age band<select value={band} onChange={e => setBand(e.target.value)}>
          {bands.map(value => <option key={value} value={value}>{label(value)}</option>)}
        </select></label>
        <label>Challenge seed<input inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value)}
          aria-invalid={submitted && !seedValid} aria-describedby={submitted && !seedValid ? 'challenge-seed-error' : undefined} />
          {submitted && !seedValid && <span id="challenge-seed-error" className="error" role="alert">Enter a whole number from 0 to 4,294,967,295.</span>}
        </label>
        <label>Challenge repetitions<input inputMode="numeric" value={repetitions} onChange={e => setRepetitions(e.target.value)}
          aria-invalid={submitted && !countValid} aria-describedby={submitted && !countValid ? 'challenge-count-error' : undefined} />
          {submitted && !countValid && <span id="challenge-count-error" className="error" role="alert">Enter a whole number from 100 to 1,000.</span>}
        </label>
      </div>
      <button type="submit">Run challenge</button>
    </form>
    {run && <>
      <p role="status">Displayed run: age {label(run.band)}, n = {size}, seed {run.pairs[0].results[0].seed}, {run.pairs[0].results[0].estimates.length} Monte Carlo repetitions per condition.</p>
      <ul>{run.pairs[0].results.map(result => <li key={result.name}>{result.name}: {result.count.toLocaleString()} records · True mean {usd.format(result.truth)}</li>)}</ul>
      <p>All RMSE bars use the same scale, from $0 to {usd.format(scale)}.</p>
      {run.pairs.map(pair => <section key={pair.method}>
        <h3>{pair.method}</h3>
        {pair.results.map((result, i) => <div className="challenge-bar" key={result.name}>
          <span>{result.name}</span><span>{usd.format(result.rmse)}</span>
          <span className={'track ' + (i ? 'drawn' : 'all')} aria-hidden="true"><span style={{ width: result.rmse / scale * 100 + '%' }} /></span>
        </div>)}
      </section>)}
      <div className="results-scroll" role="region" aria-label="Challenge results" tabIndex={0}>
        <table><thead><tr>{['Dataset', 'Method', 'Sample size', 'Seed', 'Repetitions', 'Run type', 'True mean (USD)', 'Bias (USD)', 'SD (USD)', 'RMSE (USD)'].map(title =>
          <th key={title} scope="col">{title}</th>)}</tr></thead>
          <tbody>{run.pairs.flatMap(pair => pair.results.map(result => <tr key={pair.method + result.name}>
            <th scope="row">{result.name}</th><td>{pair.method}</td><td>{result.size}</td><td>{result.seed}</td>
            <td>{result.estimates.length}</td><td>Monte Carlo</td><td>{usd.format(result.truth)}</td>
            <td>{usd.format(result.bias)}</td><td>{usd.format(result.sd)}</td><td>{usd.format(result.rmse)}</td>
          </tr>))}</tbody>
        </table>
      </div>
    </>}
  </section>;
}
