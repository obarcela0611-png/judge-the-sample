import React from 'react';
import { createRoot } from 'react-dom/client';
import csv from '../data/healthcare_costs.csv?raw';
import { BAND, costBands, mean, randomSample } from './sampling.js';
import './style.css';

const seed = 20261108;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const population = csv.trim().split(/\r?\n/).slice(1).map(line => {
  const cells = line.split(',');
  return { id: Number(cells[0]), smoker: cells[6], charges: Number(cells[8]) };
});
const sample = randomSample(population, 100, seed);
const groups = costBands(population, sample);
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

function App() {
  return <main>
    <header><p className="eyebrow">Healthcare costs · Sampling activity</p>
      <h1>Judge the Sample</h1>
      <p>Compare 1,338 simulated beneficiary records with a temporary simple random sample of 100 distinct records.</p>
      <p className="seed">Sample seed: {seed}</p>
    </header>
    <dl className="summary">
      <div><dt>True population mean</dt><dd>{money.format(mean(population))}</dd></div>
      <div><dt>Sample mean</dt><dd>{money.format(mean(sample))}</dd></div>
    </dl>
    <h2>Charges by smoking status</h2>
    <p>Each percentage is a share of its smoking group within the population or sample. Bars use a shared 0–100% scale.</p>
    <div className="panels">{groups.map(group => <Panel key={group.smoker} group={group} />)}</div>
    <details className="panel">
      <summary>View all {sample.length} sampled records</summary>
      <table><thead><tr><th scope="col">Row ID</th><th scope="col">Smoker</th><th scope="col">Charge (USD)</th></tr></thead>
        <tbody>{[...sample].sort((a, b) => a.id - b.id).map(row => <tr key={row.id}><td>{row.id}</td><td>{row.smoker}</td><td>{money.format(row.charges)}</td></tr>)}</tbody>
      </table>
    </details>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
