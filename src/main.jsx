import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import csv from '../data/healthcare_costs.csv?raw';
import { BAND, costBands, mean, randomSample, systematicSample, stratifiedSample } from './sampling.js';
import './style.css';
import Experiments from './Experiments.jsx';
import Challenge from './Challenge.jsx';

const seed = 20261108;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const population = csv.trim().split(/\r?\n/).slice(1).map(line => {
  const cells = line.split(',');
  return { id: Number(cells[0]), ageBand: cells[2], smoker: cells[6], charges: Number(cells[8]) };
});
const populationMean = mean(population);
const percent = (count, size) => size ? count / size * 100 : null;
const label = value => '$' + value / 1000 + 'k';

function Bar({ value, kind }) {
  return <div className="measure">
    <span className={'track ' + kind} aria-hidden="true"><span style={{ width: (value ?? 0) + '%' }} /></span>
    <span>{value === null ? '—' : value.toFixed(1) + '%'}</span>
  </div>;
}

function Panel({ group }) {
  const { smoker, all, drawn } = group;
  return <section className="panel">
    <h2>{smoker === 'yes' ? 'Smokers' : 'Non-smokers'}</h2>
    <p>{all.size.toLocaleString()} population records · {drawn.size} sampled</p>
    {!drawn.size && <p>No records from this group were sampled.</p>}
    <table className="chart">
      <thead><tr><th scope="col">Charge band</th><th scope="col">Population</th><th scope="col">Sample</th></tr></thead>
      <tbody>{all.bins.map((count, i) => <tr key={i}>
        <th scope="row">{label(i * BAND)}–&lt;{label((i + 1) * BAND)}</th>
        <td><Bar value={percent(count, all.size)} kind="all" /></td>
        <td><Bar value={percent(drawn.bins[i], drawn.size)} kind="drawn" /></td>
      </tr>)}</tbody>
    </table>
  </section>;
}

const methods = [
  ['random', 'Simple random', 'Draw distinct records from the full dataset without replacement.'],
  ['systematic', 'Systematic', 'Start at a seeded position and select records at regular intervals in CSV order. The file order has no documented time sequence.'],
  ['stratified', 'Stratified', 'Allocate the sample proportionally by smoking status, then draw without replacement within each group. The estimate weights each group mean by its share of the population.'],
];

function App() {
  const [method, setMethod] = useState('random');
  const [sizeText, setSize] = useState('100');
  const [seedText, setSeed] = useState(String(seed));
  const size = Number(sizeText);
  const currentSeed = Number(seedText);
  const sizeError = !/^\d+$/.test(sizeText) || size < 1 || size > population.length
    ? 'Enter a whole number from 1 to 1,338.'
    : method === 'stratified' && size < 2 ? 'Increase the sample size to at least 2 to include both groups.' : '';
  const seedError = !/^\d+$/.test(seedText) || currentSeed > 4294967295
    ? 'Enter a whole number from 0 to 4,294,967,295.' : '';
  let result;
  if (!sizeError && !seedError) {
    if (method === 'systematic') result = systematicSample(population, size, currentSeed);
    else if (method === 'stratified') result = stratifiedSample(population, size, currentSeed);
    else {
      const sample = randomSample(population, size, currentSeed);
      result = { sample, estimate: mean(sample) };
    }
  }
  const sample = result?.sample ?? [];
  const groups = costBands(population, sample);
  const current = methods.findIndex(([id]) => id === method);

  function handleTabKey(event) {
    const index = { ArrowRight: (current + 1) % 3, ArrowLeft: (current + 2) % 3, Home: 0, End: 2 }[event.key];
    if (index === undefined) return;
    event.preventDefault();
    const id = methods[index][0];
    setMethod(id);
    document.getElementById('tab-' + id).focus();
  }

  return <main>
    <header><p className="eyebrow">Healthcare costs · Sampling activity</p>
      <h1>Judge the Sample</h1>
      <p>Explore three ways to sample 1,338 simulated beneficiary records.</p>
    </header>
    <div className="tabs" role="tablist" aria-label="Sampling method">
      {methods.map(([id, label]) => <button key={id} type="button" role="tab" id={'tab-' + id}
        aria-selected={id === method} aria-controls={'panel-' + id} tabIndex={id === method ? 0 : -1}
        onClick={() => setMethod(id)} onKeyDown={handleTabKey}>{label}</button>)}
    </div>
    <div className="panel" role="tabpanel" id={'panel-' + method} aria-labelledby={'tab-' + method}>
      <p>{methods[current][2]}</p>
      <div className="controls">
        <label>Sample size<input inputMode="numeric" value={sizeText} onChange={e => setSize(e.target.value)}
          aria-invalid={!!sizeError} aria-describedby={sizeError ? 'size-error' : undefined} />
          {sizeError && <span id="size-error" className="error" role="alert">{sizeError}</span>}</label>
        <label>Sample seed<input inputMode="numeric" value={seedText} onChange={e => setSeed(e.target.value)}
          aria-invalid={!!seedError} aria-describedby={seedError ? 'seed-error' : undefined} />
          {seedError && <span id="seed-error" className="error" role="alert">{seedError}</span>}</label>
      </div>
      {result?.interval !== undefined && <p>
        {Number.isInteger(result.interval) ? 'Whole-number' : 'Fractional'} interval: {Number(result.interval.toPrecision(8))}.
        {' '}Random start: {Number(result.start.toPrecision(8))}.
        {' '}{Number.isInteger(result.interval)
          ? 'Select every kth record beginning at the start.'
          : 'Add the interval for each step and round each position up to its row number.'}
      </p>}
      {result?.allocation && <table>
        <caption>Proportional allocation by smoking status</caption>
        <thead><tr><th scope="col">Group</th><th scope="col">Population</th><th scope="col">Sample</th><th scope="col">Weight</th></tr></thead>
        <tbody>{result.allocation.map(group => <tr key={group.smoker}>
          <th scope="row">{group.smoker === 'yes' ? 'Smokers' : 'Non-smokers'}</th>
          <td>{group.population.toLocaleString()}</td><td>{group.count}</td><td>{(group.weight * 100).toFixed(1)}%</td>
        </tr>)}</tbody>
      </table>}
    </div>
    <dl className="summary">
      <div><dt>True population mean</dt><dd>{money.format(populationMean)}</dd></div>
      <div><dt>{method === 'stratified' ? 'Weighted sample mean' : 'Sample mean'}</dt><dd>{result ? money.format(result.estimate) : '—'}</dd></div>
    </dl>
    {result && <>
    <h2>Charges by smoking status</h2>
    <p>Each percentage is a share of its smoking group within the population or sample. Bars use a shared 0–100% scale.</p>
    <div className="panels">{groups.map(group => <Panel key={group.smoker} group={group} />)}</div>
    <details className="panel">
      <summary>View all {sample.length} sampled records</summary>
      <table><thead><tr><th scope="col">Row ID</th><th scope="col">Smoker</th><th scope="col">Charge (USD)</th></tr></thead>
        <tbody>{[...sample].sort((a, b) => a.id - b.id).map(row => <tr key={row.id}><td>{row.id}</td><td>{row.smoker}</td><td>{money.format(row.charges)}</td></tr>)}</tbody>
      </table>
    </details>
    </>}
    <Experiments population={population} truth={populationMean} />
    <Challenge population={population} />
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
