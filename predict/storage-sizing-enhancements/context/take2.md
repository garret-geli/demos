## Context for Building the Advanced Storage Sizing POC

### What this document is

The [Take 2 PRD](https://growingenergylabs.atlassian.net/wiki/spaces/predictapp1/pages/11292508197/Take+2+-+Advanced+Storage+Sizing+in+Predict) describes a full-featured Advanced Storage Sizing workflow for Predict. Not everything in that PRD needs to be built for this POC. This document clarifies what to build, what already exists, and what's out of scope so you can focus on the actual gaps.

### What already exists (do not rebuild)

- **Initial size recommendation (Take 2 Section 1):** Roberto's heuristic model is already integrated. It produces a single recommended battery size (power + energy) from load and tariff inputs. Continue using this as the seed/anchor for all downstream sizing work.
- **Comparison chart (Take 2 Section 5):** An interactive chart component already exists (see the GIF in the ERD). Wire it up to batch results rather than rebuilding. Skip the chart type/interactivity requirements in Section 5 of the PRD; just use what we have.
- **Top Performing Configuration badge:** A reusable component from another part of the app. It will be imported to highlight the best financial performer across a batch. This covers the "best performer highlighting" requirement in Section 5.4.

### What to build

**1. Directed Batch (maps to Take 2 Sections 2 and 3, modified)** The user builds a batch one config at a time using a table UI:

- Each column = one storage config (power, energy, duration, dispatch strategy, costs)
- Users can add (blank or duplicate), remove, and inline-edit columns
- A "Suggest Sizes" action auto-populates the table with a default size set (see below)
- Validation, column limits, and append-vs-replace prompting per the PRD

**2. Matrix Batch (net new, not in the Take 2 PRD)** The user defines parameter axes and the system generates the cross product as a batch automatically. Axes:

- **Objective/constraint schemas** (e.g., TOU arbitrage, demand charge management, combined): user selects 1+
- **Battery sizes**: drawn from the default size set (see below) or user-defined
- **Boolean toggles**: `include_solar` (true/false), `tariff_switch` (true/false; if true, user selects a post-storage tariff)

Example: 3 strategies x 5 sizes x 2 solar options = 30 configs generated.

The UI should let the user preview the generated matrix before committing. Show a count ("This will generate 30 configurations") and let them trim before running.

**Naming recommendation:** Call this a **Matrix Batch** or **Sweep**. "Matrix Batch" is the most self-explanatory in the UI (the user is defining a matrix of parameter combinations). "Sweep" is more concise and familiar to energy analysts who run parameter sweeps. Avoid "permutated batch," "grid batch," or "combo builder."

**3. Default Size Set (maps to ERD Stage 3, replaces Take 2's percentage approach)** Instead of the Take 2 PRD's percentage-of-baseline model (50/75/100/125/150%), generate sizes by stepping around the heuristic anchor in absolute increments of power and energy. For example, if Roberto recommends 6 MW / 12 MWh, the default set would be:

| #   | Power (MW) | Energy (MWh) |
| --- | ---------- | ------------ |
| 1   | 4          | 8            |
| 2   | 5          | 10           |
| 3   | **6**      | **12**       |
| 4   | 7          | 14           |
| 5   | 8          | 16           |

This set feeds both batch modes: it pre-populates the Directed Batch table when the user clicks "Suggest Sizes," and it serves as the default "sizes" axis in a Matrix Batch.

**4. Battery Catalogue (maps to Take 2 Section 4)** Build a local catalogue of batteries with mock data. Each entry needs these parameters:

| Parameter                 | Type   | Description                          |
| ------------------------- | ------ | ------------------------------------ |
| `manufacturer`            | string | e.g., Tesla, Sungrow, BYD            |
| `model`                   | string | Product model name                   |
| `power_rating_kw`         | float  | Nameplate power (kW)                 |
| `energy_capacity_kwh`     | float  | Nameplate energy (kWh)               |
| `duration_hrs`            | float  | Derived or explicit (energy / power) |
| `roundtrip_efficiency`    | float  | Fraction, e.g., 0.88                 |
| `degradation_rate_annual` | float  | Fraction per year, e.g., 0.02        |
| `upfront_cost_per_kwh`    | float  | $/kWh installed                      |
| `ongoing_cost_annual`     | float  | $/yr for O&M                         |
| `min_soc`                 | float  | Minimum state of charge, fraction    |
| `max_soc`                 | float  | Maximum state of charge, fraction    |

Matching logic: for a given generic config, find catalogue batteries where power is within +/-10% and energy is within +/-20%, ranked by lowest `upfront_cost_per_kwh`. Support single-row swap and bulk swap across all rows. Show before/after diff on swapped fields.

**5. Comparison Table (Take 2 Section 6)** Side-by-side table where rows = parameters and columns = configs. Needs:

- Grouped sections: Inputs (storage specs, costs) and Outputs (NPV, IRR, payback, savings)
- Add/remove configs from the view
- Diff highlighting on cells that differ across configs
- "Show differences only" toggle
- Sticky column headers for horizontal scrolling

### Out of scope for this POC

- **Post-sim financial editing (Take 2 Section 7):** Will capture as a separate ticket later.
- **ML-based auto-sizing (ERD "Future"):** Not in scope.
- **Automated convergence loop (parent PRD):** Replaced by the two batch modes above.
- **Rebuilding the comparison chart or top performer component:** Already built; just integrate.
