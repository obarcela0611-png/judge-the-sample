# My decisions and evidence notes

Written by me, not by my AI agent. Write my challenge hypothesis (section 5) **before** consulting
my agent about it, and do not edit it afterwards; add a dated revision below instead.

| Stage | What I record here |
|---|---|
| 1 | Section 1 |
| 2–5 | Section 2: my design choice, written before I switch my agent to build |
| 4 | Section 3: method and sample-size rows; section 4: findings (a) and (b) |
| 5 | Section 5: hypothesis first; then section 3: challenge rows; section 5: finding (c) |
| All | Section 6: AI use |

## 1. Population and target

- Scenario and file: Healthcare costs, `data/healthcare_costs.csv`.
- One row means: One simulated beneficiary record.
- Number of rows (N): 1,338.
- Row order, and what it means in this file: Original CSV order, with no documented chronological meaning.
- Target column and units: `charges`, in US dollars.
- My finite population is (and what it is not): The 1,338 simulated beneficiaries in the teaching dataset. This dataset does not represent current healthcare claims.
- True mean I calculated (and how): $13,270.42. Codex calculated the arithmetic mean across all 1,338 charges. The spreadsheet formula is `=AVERAGE(I2:I1339)`.

## 2. Design choices

For each stage: the option I chose, why, and what it is meant to help a user learn.

- Stage 2, visualization (include one visual feature meant to reveal a sampling problem): Paired population and sample bars in shared $5,000 charge bands, grouped by smoking status. An empty sample bar beside a population bar shows a missed cost band.
- Stage 3, sampling interactions and stratification column: Method tabs with shared sample size and seed controls. Stratification uses smoking status, which matches the chart groups.
- Stage 4, presentation of the method comparison and sample-size experiments: Aligned histograms with shared bins and scales within each experiment, a true mean reference line, and a results table.
- Stage 5, challenge controls and my alternative method or correction: Paired RMSE bars for the full dataset and selected age band. Simple random is the challenged method and smoking-status stratified sampling is the alternative.

## 3. Results table

One row per result I read from my app. Add rows as needed. Rerun and update a row whenever I
like: my app does not need to keep a history of runs. Seed is "exact" for exact enumeration;
type is Monte Carlo or exact. In Settings I record the settings that matter for the result, such
as the stratification column and allocation, or my challenge-control values. True mean is the
true mean of the population that result was drawn from (the modified copy's own recalculated
value for modified rows). Keep each result in its own row: never pool estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline | Simple random | Without replacement | 20261108 | 100 | 100 | Monte Carlo | $13,270.42 | −$6.91 | $1,198.87 | $1,198.89 |
| Methods at n = 100 | baseline | Systematic | CSV order, fractional interval 13.38 | 20261108 | 100 | 100 | Monte Carlo | $13,270.42 | $61.13 | $926.70 | $928.72 |
| Methods at n = 100 | baseline | Stratified | Smoking status, proportional allocation, population-weighted mean | 20261108 | 100 | 100 | Monte Carlo | $13,270.42 | $94.37 | $639.53 | $646.45 |
| Sample size | baseline | Simple random | Without replacement | 20261108 | 1 | 100 | Monte Carlo | $13,270.42 | −$787.65 | $12,654.01 | $12,678.50 |
| Sample size | baseline | Simple random | Without replacement | 20261108 | 10 | 100 | Monte Carlo | $13,270.42 | −$374.53 | $4,173.16 | $4,189.93 |
| Challenge | baseline (full dataset) | Simple random | Without replacement | 20261108 | 100 | 100 | Monte Carlo | $13,270.42 | −$6.91 | $1,198.87 | $1,198.89 |
| Challenge | modified (ages 40–49) | Simple random | Without replacement | 20261108 | 100 | 100 | Monte Carlo | $14,399.20 | −$165.99 | $975.34 | $989.36 |
| Challenge | baseline (full dataset) | Stratified by smoking status | Proportional allocation, population-weighted mean | 20261108 | 100 | 100 | Monte Carlo | $13,270.42 | $94.37 | $639.53 | $646.45 |
| Challenge | modified (ages 40–49) | Stratified by smoking status | Proportional allocation, population-weighted mean | 20261108 | 100 | 100 | Monte Carlo | $14,399.20 | −$25.01 | $546.60 | $547.17 |

The simple random n = 100 row is also the n = 100 sample-size result when the population and
settings match. If I reran it with different settings, I add a separate row. All four challenge
rows use the same n; a challenge baseline row may repeat a matching stage 4 result.

## 4. Findings (in my own words, using my own numbers)

- (a) Method comparison: the three sampling methods compared at n = 100 (bias versus variability, and for which population): At n = 100, stratified sampling by smoking status is the most trustworthy method in this run. It had the lowest RMSE at $646.45 and the lowest standard deviation at $639.53. The estimates averaged $94.37 above the true mean because the bias was positive.
- (b) Sample-size finding: how sample size affects the spread of estimates and the estimation error, and what a larger sample cannot fix: The histogram narrowed around the true mean as the simple random sample size increased. The SD fell from $12,654.01 at n = 1 to $4,173.16 at n = 10 and $1,198.87 at n = 100.

## 5. Challenge (hypothesis written independently, before consulting my agent)

Hypothesis, written before I consult my agent:

- Date written: November 8, 2026
- Method I chose to challenge: Simple random sampling
- The change to the population or its ordering: Keep only records in the 40–49 age band.
- Why the selection rule would interact with that change:
- Evidence I expect across repeated samples: At n = 100, I expect simple random sampling from the 40–49 age band to have a higher RMSE than simple random sampling from the full dataset.
- Alternative method or correction I will compare, and why: Stratified sampling by smoking status.
- Evidence that would contradict my hypothesis: At n = 100, my hypothesis would be contradicted if simple random sampling from the 40–49 age band had an RMSE equal to or lower than that of simple random sampling from the full dataset.

After I test it:

- Test settings (conditions, methods, alternative method or correction, n, seeds); results are in the table above: Full dataset and ages 40–49, simple random and stratified by smoking status, n = 100, seed 20261108, 100 Monte Carlo repetitions per condition.
- (c) Challenge interpretation: did the evidence support my hypothesis? Bias versus variability, other explanations, what the alternative or correction showed, and any dated revision (keep the original above):

This run did not support my hypothesis. For simple random sampling at n = 100, RMSE fell from $1,198.89 for the full dataset to $989.36 when the dataset was restricted to ages 40–49. The estimates varied less across repetitions even though their absolute bias increased. The alternative method of stratified sampling in the 40-49 subset showed an RMSE of $547.17, compared with $989.36 for simple random sampling.

## 6. AI use

- Tools used: OpenAI Codex and its GitHub connection.
- What I asked my agent to do, and what I checked myself: Codex helped plan and build the app, publish it, calculate the population mean, format the results, and clarify my hypothesis wording. I selected the designs, ran the Stage 4 and 5 comparisons, and shared the observed results and my interpretation.
- Automated checks my agent reported: Codex reported checks for reproducible samples, distinct rows, systematic starts, stratified allocations and weights, exact enumeration, histogram bins, and the bias, SD, and RMSE calculations. It also checked input validation and phone-width layouts.
