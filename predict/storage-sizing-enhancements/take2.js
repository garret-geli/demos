// ═══════════════════════════════════════════════════════════════
// Take 2 (v2.1) — Step 3 of the Storage Sizing flow
//   · Directed Batch  — stack of compact config cards w/ pill chips
//   · Matrix Batch    — chip-card axes; sizes axis now catalogue-aware
// ═══════════════════════════════════════════════════════════════

// ── Battery Catalogue (inlined; mirrors batteries.json) ───────
const BATTERY_TIERS = [
  { id: 'residential',      label: 'Residential',          range: '5 – 30 kWh' },
  { id: 'light_commercial', label: 'Light Commercial',     range: '30 – 500 kWh' },
  { id: 'commercial',       label: 'Commercial & Industrial', range: '500 kWh – 5 MWh' },
  { id: 'utility',          label: 'Utility-Scale',        range: '5 MWh and up' },
];

const BATTERY_CATALOGUE = [
  { manufacturer: 'Qcells',    model: 'Q.HOME Core H8',        tier: 'residential',      power_rating_kw: 6,     energy_capacity_kwh: 13.7,  duration_hrs: 2.3, roundtrip_efficiency: 0.93, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 920, ongoing_cost_annual: 200,   min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Tesla',     model: 'Powerwall 3',           tier: 'residential',      power_rating_kw: 11.5,  energy_capacity_kwh: 13.5,  duration_hrs: 1.2, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 850, ongoing_cost_annual: 150,   min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'LG Energy', model: 'RESU Prime 16H',        tier: 'residential',      power_rating_kw: 7,     energy_capacity_kwh: 16,    duration_hrs: 2.3, roundtrip_efficiency: 0.90, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 880, ongoing_cost_annual: 180,   min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Enphase',   model: 'IQ Battery 10',         tier: 'residential',      power_rating_kw: 3.84,  energy_capacity_kwh: 10.08, duration_hrs: 2.6, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 940, ongoing_cost_annual: 160,   min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Generac',   model: 'PWRcell M6',            tier: 'residential',      power_rating_kw: 9,     energy_capacity_kwh: 18,    duration_hrs: 2.0, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 760, ongoing_cost_annual: 220,   min_soc: 0.10, max_soc: 0.95 },
  { manufacturer: 'Sonnen',    model: 'ecoLinx 30',            tier: 'residential',      power_rating_kw: 8,     energy_capacity_kwh: 30,    duration_hrs: 3.75,roundtrip_efficiency: 0.91, degradation_rate_annual: 0.018, upfront_cost_per_kwh: 1100,ongoing_cost_annual: 300,   min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Franklin',  model: 'aPower 2',              tier: 'residential',      power_rating_kw: 10,    energy_capacity_kwh: 15,    duration_hrs: 1.5, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 820, ongoing_cost_annual: 180,   min_soc: 0.05, max_soc: 0.95 },

  { manufacturer: 'Tesla',     model: 'Powerpack 2 (legacy)',  tier: 'light_commercial', power_rating_kw: 50,    energy_capacity_kwh: 200,   duration_hrs: 4.0, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 540, ongoing_cost_annual: 4000,  min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'BYD',       model: 'Battery-Box Commercial',tier: 'light_commercial', power_rating_kw: 100,   energy_capacity_kwh: 256,   duration_hrs: 2.6, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 460, ongoing_cost_annual: 4800,  min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'SimpliPhi', model: 'PHI ESS',               tier: 'light_commercial', power_rating_kw: 60,    energy_capacity_kwh: 230,   duration_hrs: 3.8, roundtrip_efficiency: 0.90, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 580, ongoing_cost_annual: 4500,  min_soc: 0.10, max_soc: 0.95 },
  { manufacturer: 'Generac',   model: 'PWRcommercial',         tier: 'light_commercial', power_rating_kw: 100,   energy_capacity_kwh: 400,   duration_hrs: 4.0, roundtrip_efficiency: 0.87, degradation_rate_annual: 0.028, upfront_cost_per_kwh: 420, ongoing_cost_annual: 7000,  min_soc: 0.05, max_soc: 0.95 },

  { manufacturer: 'Sungrow',   model: 'ST500CP-50HV',          tier: 'commercial',       power_rating_kw: 500,   energy_capacity_kwh: 1000,  duration_hrs: 2.0, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.028, upfront_cost_per_kwh: 320, ongoing_cost_annual: 12000, min_soc: 0.10, max_soc: 0.90 },
  { manufacturer: 'Tesla',     model: 'Megapack',              tier: 'commercial',       power_rating_kw: 1000,  energy_capacity_kwh: 4000,  duration_hrs: 4.0, roundtrip_efficiency: 0.90, degradation_rate_annual: 0.022, upfront_cost_per_kwh: 295, ongoing_cost_annual: 22000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Fluence',   model: 'Gridstack 4h',          tier: 'commercial',       power_rating_kw: 1000,  energy_capacity_kwh: 4000,  duration_hrs: 4.0, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.022, upfront_cost_per_kwh: 272, ongoing_cost_annual: 21000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'CATL',      model: 'EnerC 4h',              tier: 'commercial',       power_rating_kw: 1250,  energy_capacity_kwh: 5000,  duration_hrs: 4.0, roundtrip_efficiency: 0.91, degradation_rate_annual: 0.018, upfront_cost_per_kwh: 246, ongoing_cost_annual: 18000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'BYD',       model: 'MC Cube 1500',          tier: 'commercial',       power_rating_kw: 1500,  energy_capacity_kwh: 5500,  duration_hrs: 3.7, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 252, ongoing_cost_annual: 20000, min_soc: 0.05, max_soc: 0.95 },

  { manufacturer: 'Tesla',     model: 'Megapack 2',            tier: 'utility',          power_rating_kw: 1500,  energy_capacity_kwh: 7500,  duration_hrs: 5.0, roundtrip_efficiency: 0.91, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 285, ongoing_cost_annual: 32000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Tesla',     model: 'Megapack 2XL',          tier: 'utility',          power_rating_kw: 2000,  energy_capacity_kwh: 10000, duration_hrs: 5.0, roundtrip_efficiency: 0.92, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 280, ongoing_cost_annual: 40000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Fluence',   model: 'Gridstack Pro 5h',      tier: 'utility',          power_rating_kw: 2000,  energy_capacity_kwh: 10000, duration_hrs: 5.0, roundtrip_efficiency: 0.89, degradation_rate_annual: 0.020, upfront_cost_per_kwh: 265, ongoing_cost_annual: 36000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'CATL',      model: 'EnerC 5h',              tier: 'utility',          power_rating_kw: 2500,  energy_capacity_kwh: 12500, duration_hrs: 5.0, roundtrip_efficiency: 0.91, degradation_rate_annual: 0.018, upfront_cost_per_kwh: 242, ongoing_cost_annual: 30000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'BYD',       model: 'MC Cube T28',           tier: 'utility',          power_rating_kw: 3000,  energy_capacity_kwh: 11200, duration_hrs: 3.7, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 248, ongoing_cost_annual: 35000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Sungrow',   model: 'ST2752UX-US',           tier: 'utility',          power_rating_kw: 3440,  energy_capacity_kwh: 11000, duration_hrs: 3.2, roundtrip_efficiency: 0.90, degradation_rate_annual: 0.025, upfront_cost_per_kwh: 255, ongoing_cost_annual: 38000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Wartsila',  model: 'GridSolv Quantum 4h',   tier: 'utility',          power_rating_kw: 5000,  energy_capacity_kwh: 20000, duration_hrs: 4.0, roundtrip_efficiency: 0.88, degradation_rate_annual: 0.022, upfront_cost_per_kwh: 252, ongoing_cost_annual: 55000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Powin',     model: 'Stack100-4h',           tier: 'utility',          power_rating_kw: 7500,  energy_capacity_kwh: 30000, duration_hrs: 4.0, roundtrip_efficiency: 0.87, degradation_rate_annual: 0.028, upfront_cost_per_kwh: 241, ongoing_cost_annual: 65000, min_soc: 0.05, max_soc: 0.95 },
  { manufacturer: 'Powin',     model: 'Stack100-5h',           tier: 'utility',          power_rating_kw: 10000, energy_capacity_kwh: 50000, duration_hrs: 5.0, roundtrip_efficiency: 0.87, degradation_rate_annual: 0.028, upfront_cost_per_kwh: 238, ongoing_cost_annual: 85000, min_soc: 0.05, max_soc: 0.95 },
];

const batKey = b => `${b.manufacturer} ${b.model}`;
const findBattery = key => BATTERY_CATALOGUE.find(b => batKey(b) === key);

// ── Strategy / service / tariff enums ─────────────────────────
const BILL_STRATEGIES = [
  { id: 'tou',     label: 'TOU Arbitrage', desc: 'Buy off-peak / sell on-peak' },
  { id: 'dcm',     label: 'DCM',           desc: 'Demand charge management' },
  { id: 'tou_dcm', label: 'TOU + DCM',     desc: 'Combined energy + demand' },
];
const GRID_SERVICES = [
  { id: 'ra_pdr', label: 'RA / PDR', desc: 'Resource Adequacy / Proxy Demand' },
  { id: 'dsgs',   label: 'DSGS',     desc: 'Demand Side Grid Support' },
  { id: 'sgip',   label: 'SGIP',     desc: 'Self-Generation Incentive Prog.' },
];
// ── Grid service parameter schemas ────────────────────────────
// Each service can be toggled per-config; when on, exposes its own
// economic inputs inline on the card.
const GRID_SERVICE_PARAMS = {
  ra_pdr: [
    { key: 'raCapacityRate', label: 'Capacity',   unit: '$/kW-mo', step: 0.5, default: 5.0,
      tooltip: 'Capacity payment rate ($/kW-month) for committing storage to Resource Adequacy / Proxy Demand Resource programs.' },
    { key: 'raEventHrs',     label: 'Event hrs',  unit: 'hrs/yr',  step: 10,  default: 60,
      tooltip: 'Total dispatch hours per year the battery is committed to RA / PDR events.' },
  ],
  dsgs: [
    { key: 'dsgsRate',  label: 'Incentive', unit: '$/kWh',   step: 0.05, default: 2.00,
      tooltip: 'Per-kWh incentive paid by the utility for dispatching during Demand Side Grid Support events.' },
    { key: 'dsgsHrs',   label: 'Event hrs', unit: 'hrs/yr',  step: 5,    default: 25,
      tooltip: 'Expected DSGS event hours per year — typically 20–60 hrs/yr in CA.' },
  ],
  sgip: [
    { key: 'sgipRate',  label: 'Upfront',   unit: '$/kWh',   step: 10,   default: 250,
      tooltip: 'Self-Generation Incentive Program upfront rebate, paid per kWh of installed storage capacity.' },
  ],
};
function gridServiceDefaults() {
  const out = {};
  for (const params of Object.values(GRID_SERVICE_PARAMS)) {
    for (const p of params) out[p.key] = p.default;
  }
  return out;
}

const TARIFF_LIST = [
  { id: 'pge-b19',  label: 'PG&E B-19-TOU' },
  { id: 'sdge-al',  label: 'SDG&E AL-TOU-2' },
  { id: 'sce-gs2e', label: 'SCE TOU-GS-2-E' },
  { id: 'sce-gs3e', label: 'SCE TOU-GS-3 Opt E' },
];

// ── State ─────────────────────────────────────────────────────
const T2 = {
  // Directed
  directedCols: [],
  nextColId: 1,
  expandedColId: null,

  // Matrix axes
  // mxSizes entries: { id, source: 'custom'|'catalogue', powerKw, energyKwh, batteryKey?, qty?, isAnchor? }
  mxSizes: [],
  nextSizeId: 1,
  mxBillStrategies: ['tou', 'dcm', 'tou_dcm'],
  mxGridServices: ['dsgs', 'sgip'],
  mxServiceParams: gridServiceDefaults(),
  mxSolar: [false, true],
  mxTariffSwitch: false,
  mxAltTariff: 'sdge-al',

  // Matrix-wide advanced overrides (applied to every config in the sweep)
  // null = use catalogue/heuristic default (per-battery for CapEx/O&M)
  mxAdvanced: {
    capitalCostPerKwh: null,
    omCostAnnual: null,
    totalProjectLife: 10,
    minSoc: null,
    maxSoc: null,
  },
  mxAdvancedOpen: false,

  // Results
  batchResults: [],

  // Catalogue modal
  catalogueMode: null, // 'directed-swap' | 'matrix-add'
  catalogueColId: null,
  catalogueTierFilter: 'all',
};

// ── Default size set from heuristic anchor ────────────────────
// Prefer real catalogue batteries that fit the site target — falls back to
// a single custom config only if the catalogue helper isn't available.
function buildDefaultSizeSet(anchorKw, anchorKwh) {
  const haveMatcher = typeof catalogueMatchesForSize === 'function';
  if (haveMatcher) {
    const matches = catalogueMatchesForSize(anchorKw, anchorKwh, 4);
    if (matches.length) {
      return matches.map((b, i) => ({
        id: T2.nextSizeId++,
        source: 'catalogue',
        batteryKey: batKey(b),
        powerKw: b.power_rating_kw,
        energyKwh: b.energy_capacity_kwh,
        qty: 1,
        isAnchor: i === 0,
      }));
    }
  }
  // Fallback — single custom entry at the anchor size
  return [{
    id: T2.nextSizeId++,
    source: 'custom',
    powerKw: anchorKw,
    energyKwh: anchorKwh,
    qty: 1,
    isAnchor: true,
  }];
}

function getHeuristicAnchor() {
  if (typeof S === 'undefined' || !S.dailyStats) return { powerKw: 2000, energyKwh: 8000 };
  const tariff = TARIFFS[S.tariffKey];
  const sizing = computeSizing(S.dailyStats, S.rates, S.covPctile, tariff);
  if (sizing.dcm.viable) return { powerKw: sizing.dcm.powerKw, energyKwh: sizing.dcm.energyKwh };
  if (sizing.arb.viable) return { powerKw: sizing.arb.powerKw, energyKwh: sizing.arb.energyKwh };
  return { powerKw: sizing.dcm.powerKw || 2000, energyKwh: sizing.dcm.energyKwh || 8000 };
}

// Returns BOTH the primary (chosen) and alternative (if viable) targets,
// each tagged with the strategy that produced it. Used by "Seed from Step 2"
// to lay out a sweep that covers either value driver.
function getStrategyTargets() {
  if (typeof S === 'undefined' || !S.dailyStats) {
    return { primary: { strategy: 'dcm', powerKw: 2000, energyKwh: 8000 }, alt: null };
  }
  const tariff = TARIFFS[S.tariffKey];
  const sizing = computeSizing(S.dailyStats, S.rates, S.covPctile, tariff);
  const dcmOK = sizing.dcm.viable;
  const arbOK = sizing.arb.viable && sizing.arb.powerKw && sizing.arb.energyKwh;
  if (dcmOK) {
    return {
      primary: { strategy: 'dcm', powerKw: sizing.dcm.powerKw, energyKwh: sizing.dcm.energyKwh },
      alt: arbOK ? { strategy: 'tou', powerKw: sizing.arb.powerKw, energyKwh: sizing.arb.energyKwh } : null,
    };
  }
  if (arbOK) {
    return { primary: { strategy: 'tou', powerKw: sizing.arb.powerKw, energyKwh: sizing.arb.energyKwh }, alt: null };
  }
  return {
    primary: { strategy: 'dcm', powerKw: sizing.dcm.powerKw || 2000, energyKwh: sizing.dcm.energyKwh || 8000 },
    alt: null,
  };
}

// ── Mock financial sim ────────────────────────────────────────
function mockSimulate(col) {
  const { powerKw, energyKwh, billStrategy, capitalCostPerKwh, omCostAnnual, includeSolar, totalProjectLife, gridServices } = col;
  const life = totalProjectLife || 10;
  const capex = energyKwh * (capitalCostPerKwh || 280);
  const spreads = { tou: 0.12, dcm: 0.15, tou_dcm: 0.18 };
  const spread = spreads[billStrategy] || 0.12;
  const rte = 0.90, cycles = 300;
  const annualSavings = energyKwh * cycles * spread * rte;
  const gsRevenue = (gridServices || []).length * energyKwh * 8;
  const annualOM = omCostAnnual != null ? omCostAnnual : energyKwh * 8;
  const solarAdder = includeSolar ? annualSavings * 0.15 : 0;
  const annualNet = annualSavings + gsRevenue + solarAdder - annualOM;
  const r = 0.08;
  let npv = -capex;
  for (let t = 1; t <= life; t++) npv += annualNet / Math.pow(1 + r, t);
  const payback = annualNet > 0 ? capex / annualNet : Infinity;
  let irr = null;
  if (annualNet > 0) {
    let lo = -0.5, hi = 5.0;
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2;
      let pv = -capex;
      for (let t = 1; t <= life; t++) pv += annualNet / Math.pow(1 + mid, t);
      if (pv > 0) lo = mid; else hi = mid;
    }
    irr = (lo + hi) / 2;
  }
  return {
    capex: Math.round(capex),
    annualSavings: Math.round(annualSavings + solarAdder + gsRevenue),
    annualOM: Math.round(annualOM),
    npv: Math.round(npv),
    irr: irr != null ? +irr.toFixed(4) : null,
    payback: isFinite(payback) ? +payback.toFixed(1) : null,
  };
}

// ── Config factory ────────────────────────────────────────────
function makeCol(overrides) {
  const id = T2.nextColId++;
  const anchor = getHeuristicAnchor();
  return Object.assign({
    id,
    label: ``, // auto-generated on each render
    // Custom-mode totals (also the source of truth used by sim/sort)
    powerKw: anchor.powerKw,
    energyKwh: anchor.energyKwh,
    durationHrs: +(anchor.energyKwh / anchor.powerKw).toFixed(2),
    // Catalogue mode: per-unit specs × quantity
    catalogueBattery: null,
    unitPowerKw: anchor.powerKw,
    unitEnergyKwh: anchor.energyKwh,
    qty: 1,
    billStrategy: 'tou',
    gridServices: [],
    includeSolar: false,
    tariffSwitch: false,
    altTariff: 'sdge-al',
    capitalCostPerKwh: 280,
    omCostAnnual: null,
    totalProjectLife: 10,
    minSoc: 0.05,
    maxSoc: 0.95,
    results: null,
    ...gridServiceDefaults(),
  }, overrides);
}

// Auto-generated header label — always reflects current state.
// Persisted to col.label so the results table picks it up.
function formatConfigHeader(c) {
  const stratLbl = (BILL_STRATEGIES.find(b => b.id === c.billStrategy)?.label) || c.billStrategy;
  const lead = c.catalogueBattery
    ? (c.qty > 1 ? `${c.catalogueBattery} ×${c.qty}` : c.catalogueBattery)
    : stratLbl;
  return `${lead} · ${fmtKw(c.powerKw)} · ${fmtKwh(c.energyKwh)} · ${c.durationHrs}h`;
}

// Pick / clear catalogue battery on a directed config.
function t2_pickBattery(colId, key) {
  const col = T2.directedCols.find(c => c.id === colId);
  if (!col) return;
  if (!key) {
    // Switch back to Custom — keep the current totals as the starting point.
    col.catalogueBattery = null;
    col.qty = 1;
    col.unitPowerKw = col.powerKw;
    col.unitEnergyKwh = col.energyKwh;
  } else {
    const b = findBattery(key);
    if (!b) return;
    col.catalogueBattery = key;
    col.unitPowerKw = b.power_rating_kw;
    col.unitEnergyKwh = b.energy_capacity_kwh;
    // Pick a quantity that keeps the total power near the prior target.
    col.qty = Math.max(1, Math.round(col.powerKw / b.power_rating_kw));
    col.powerKw = col.unitPowerKw * col.qty;
    col.energyKwh = col.unitEnergyKwh * col.qty;
    col.durationHrs = +(col.energyKwh / col.powerKw).toFixed(2);
    col.capitalCostPerKwh = b.upfront_cost_per_kwh;
    col.omCostAnnual = b.ongoing_cost_annual;
    col.minSoc = b.min_soc;
    col.maxSoc = b.max_soc;
  }
  col.results = null;
  renderDirectedStack();
}

function t2_setQty(colId, qty) {
  const col = T2.directedCols.find(c => c.id === colId);
  if (!col) return;
  col.qty = Math.max(1, parseInt(qty, 10) || 1);
  col.powerKw = col.unitPowerKw * col.qty;
  col.energyKwh = col.unitEnergyKwh * col.qty;
  col.durationHrs = col.powerKw > 0 ? +(col.energyKwh / col.powerKw).toFixed(2) : 0;
  col.results = null;
  renderDirectedStack();
}

// ── Mode switching ────────────────────────────────────────────
function t2_openDirected() {
  if (T2.directedCols.length === 0) t2_suggestSizes(true);
  renderDirectedStack();
  document.getElementById('t2-directed-panel').style.display = '';
  document.getElementById('t2-matrix-panel').style.display = 'none';
  setActiveMode('directed');
}

function t2_openMatrix() {
  const anchor = getHeuristicAnchor();
  if (T2.mxSizes.length === 0) T2.mxSizes = buildDefaultSizeSet(anchor.powerKw, anchor.energyKwh);
  renderMatrixPanel();
  document.getElementById('t2-directed-panel').style.display = 'none';
  document.getElementById('t2-matrix-panel').style.display = '';
  setActiveMode('matrix');
}

function setActiveMode(mode) {
  document.querySelectorAll('.t2-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
}

// ═══════════════════════════════════════════════════════════════
// DIRECTED BATCH
// ═══════════════════════════════════════════════════════════════
function t2_suggestSizes(seedIfEmpty = false) {
  const { primary, alt } = getStrategyTargets();
  if (!seedIfEmpty && T2.directedCols.length > 0) {
    if (!confirm('Replace the current configs with suggested sizes?')) return;
  }

  // Find the closest catalogue batteries to the recommendation. Prefer
  // commercial/utility tiers — residential won't show up for a 1MW target
  // anyway, but the matcher's score function already handles that.
  const haveMatcher = typeof catalogueMatchesForSize === 'function';
  const primMatches = haveMatcher
    ? catalogueMatchesForSize(primary.powerKw, primary.energyKwh, 4)
    : [];
  const altMatches = (alt && haveMatcher)
    ? catalogueMatchesForSize(alt.powerKw, alt.energyKwh, 3)
    : [];

  const dedup = new Set();
  function bat(b) {
    if (!b) return null;
    const k = batKey(b);
    if (dedup.has(k)) return null;
    dedup.add(k);
    return b;
  }

  const seeds = []; // [{ battery, strategy }]
  const bestFit = bat(primMatches[0]);

  if (bestFit) {
    // 3 strategy variations on the closest-fit battery
    seeds.push({ battery: bestFit, strategy: 'dcm' });
    seeds.push({ battery: bestFit, strategy: 'tou' });
    seeds.push({ battery: bestFit, strategy: 'tou_dcm' });
    dedup.delete(batKey(bestFit)); // allow neighbors of same family later
  }

  // Plus 1-2 size variations at combined strategy from the next-closest fits
  const sizeNeighbors = primMatches.slice(1, 3);
  for (const b of sizeNeighbors) {
    if (bat(b)) seeds.push({ battery: b, strategy: 'tou_dcm' });
  }

  // If both strategies are viable and the alt target lands on a different
  // battery, throw in one row at the alt target on its native strategy.
  if (alt && altMatches.length) {
    const altBest = bat(altMatches[0]);
    if (altBest) seeds.push({ battery: altBest, strategy: alt.strategy });
  }

  if (seeds.length === 0) {
    // No catalogue available — fall back to a single custom config so the
    // user still has something on screen.
    T2.directedCols = [ makeCol({
      powerKw: primary.powerKw,
      energyKwh: primary.energyKwh,
      durationHrs: +(primary.energyKwh / primary.powerKw).toFixed(2),
      unitPowerKw: primary.powerKw,
      unitEnergyKwh: primary.energyKwh,
      billStrategy: primary.strategy,
      gridServices: ['dsgs', 'sgip'],
    }) ];
  } else {
    T2.directedCols = seeds.map(({ battery, strategy }) => makeCol({
      catalogueBattery: batKey(battery),
      unitPowerKw: battery.power_rating_kw,
      unitEnergyKwh: battery.energy_capacity_kwh,
      qty: 1,
      powerKw: battery.power_rating_kw,
      energyKwh: battery.energy_capacity_kwh,
      durationHrs: battery.duration_hrs,
      capitalCostPerKwh: battery.upfront_cost_per_kwh,
      omCostAnnual: battery.ongoing_cost_annual,
      minSoc: battery.min_soc,
      maxSoc: battery.max_soc,
      billStrategy: strategy,
      gridServices: ['dsgs', 'sgip'],
      tariffSwitch: false,
    }));
  }

  T2.directedSeededFromDefaults = (typeof S === 'undefined' || !S.dailyStats);
  renderDirectedStack();
}

function t2_addCol(dupId) {
  if (T2.directedCols.length >= 12) { alert('Max 12 configs per directed batch.'); return; }
  const src = dupId != null ? T2.directedCols.find(c => c.id === dupId) : null;
  const col = src
    ? makeCol({ ...src, id: T2.nextColId++, label: `${src.label} (copy)`, results: null })
    : makeCol();
  T2.directedCols.push(col);
  T2.expandedColId = col.id;
  renderDirectedStack();
}

function t2_removeCol(id) {
  T2.directedCols = T2.directedCols.filter(c => c.id !== id);
  renderDirectedStack();
}

function t2_toggleExpand(id) {
  T2.expandedColId = T2.expandedColId === id ? null : id;
  renderDirectedStack();
}

function t2_setField(id, field, value) {
  const col = T2.directedCols.find(c => c.id === id);
  if (!col) return;
  if (typeof col[field] === 'number' && typeof value !== 'boolean') {
    const n = parseFloat(value);
    col[field] = isNaN(n) ? col[field] : n;
  } else {
    col[field] = value;
  }
  if (field === 'powerKw' || field === 'energyKwh') {
    col.durationHrs = col.powerKw > 0 ? +(col.energyKwh / col.powerKw).toFixed(2) : 0;
    // Manual size edit drops out of catalogue mode (totals become the new custom value)
    if (col.catalogueBattery) {
      col.catalogueBattery = null;
      col.qty = 1;
      col.unitPowerKw = col.powerKw;
      col.unitEnergyKwh = col.energyKwh;
    }
  }
  col.results = null;
  renderDirectedStack();
}

function t2_toggleGridService(id, svcId) {
  const col = T2.directedCols.find(c => c.id === id);
  if (!col) return;
  const i = col.gridServices.indexOf(svcId);
  if (i >= 0) col.gridServices.splice(i, 1); else col.gridServices.push(svcId);
  col.results = null;
  renderDirectedStack();
}

function t2_runDirected() {
  if (T2.directedCols.length === 0) return;
  T2.directedCols.forEach(col => { col.results = mockSimulate(col); });
  T2.batchResults = T2.directedCols.map(c => ({ ...c }));
  renderResults(T2.batchResults);
  document.getElementById('t2-results-panel').style.display = '';
  document.getElementById('t2-results-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderDirectedStack() {
  const stack = document.getElementById('t2-dir-stack');
  const empty = document.getElementById('t2-dir-empty');
  const runBtn = document.getElementById('t2-dir-run-btn');
  if (!stack) return;
  if (T2.directedCols.length === 0) {
    stack.innerHTML = '';
    empty.style.display = '';
    runBtn.disabled = true;
    return;
  }
  // Stable sort by power ascending (then energy as secondary)
  T2.directedCols.sort((a, b) => (a.powerKw - b.powerKw) || (a.energyKwh - b.energyKwh));
  // Refresh auto-generated header label so results table stays in sync
  T2.directedCols.forEach(c => { c.label = formatConfigHeader(c); });
  empty.style.display = 'none';
  runBtn.disabled = false;
  stack.innerHTML = T2.directedCols.map(c => renderConfigCard(c)).join('');
}

function renderConfigCard(c) {
  const isOpen = T2.expandedColId === c.id;
  const batAttr = c.catalogueBattery ? ` data-battery="${escHtml(c.catalogueBattery)}"` : '';
  return `
    <div class="t2-cfg-card ${isOpen ? 'is-open' : ''}" data-id="${c.id}"${batAttr}>
      <!-- Header: auto-generated spec line + right-side actions -->
      <div class="t2-cfg-header">
        <div class="t2-cfg-title">${escHtml(c.label)}</div>
        <div class="t2-cfg-actions">
          <button class="t2-more-btn ${isOpen?'is-open':''}" onclick="t2_toggleExpand(${c.id})">
            More <span class="t2-more-caret">▾</span>
          </button>
          <button class="t2-icon-btn" title="Duplicate" onclick="t2_addCol(${c.id})" aria-label="Duplicate">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="5" y="5" width="8.5" height="8.5" rx="1.4"></rect>
              <path d="M11 5V3.5A1 1 0 0 0 10 2.5H3.5A1 1 0 0 0 2.5 3.5V10A1 1 0 0 0 3.5 11H5"></path>
            </svg>
          </button>
          <button class="t2-icon-btn t2-icon-danger" title="Remove" onclick="t2_removeCol(${c.id})">✕</button>
        </div>
      </div>

      <!-- Row 1 — Battery picker · Size (or Specs+Qty) · Strategy ......... + Solar -->
      <div class="t2-cfg-line t2-cfg-line-prim">
        <div class="t2-cfg-prim-left">
          ${renderBatteryPicker(c)}
          ${c.catalogueBattery ? renderCatalogueSpecs(c) : renderCustomSize(c)}
          <div class="t2-cfg-field">
            <span class="t2-cfg-field-key">Strategy</span>
            <div class="t2-pill t2-pill-select">
              <select onchange="t2_setField(${c.id},'billStrategy',this.value)">
                ${BILL_STRATEGIES.map(s => `<option value="${s.id}" ${c.billStrategy===s.id?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        <button class="t2-pill t2-pill-toggle t2-solar-btn ${c.includeSolar?'on':''}"
                onclick="t2_setField(${c.id},'includeSolar',${!c.includeSolar})"
                title="Include Solar generation in this run">
          <span class="t2-pill-dot"></span>+ Solar
        </button>
      </div>

      <!-- Lightweight grid-service + tariff-switch rows -->
      <div class="t2-svc-stack">
        ${GRID_SERVICES.map(g => renderServiceRow(c, g)).join('')}
        ${renderTariffSwitchRow(c)}
      </div>

      ${isOpen ? renderConfigDetail(c) : ''}
    </div>
  `;
}

function renderBatteryPicker(c) {
  const isCustom = !c.catalogueBattery;
  const label = isCustom
    ? `<span class="t2-batt-name t2-batt-custom">Custom battery</span><span class="t2-batt-sub">Pick from catalogue →</span>`
    : `<span class="t2-batt-name">${escHtml(c.catalogueBattery)}</span><span class="t2-batt-sub">${fmtKw(c.unitPowerKw)} / ${fmtKwh(c.unitEnergyKwh)} · ${c.durationHrs}h</span>`;
  return `
    <div class="t2-cfg-field">
      <span class="t2-cfg-field-key">Battery</span>
      <button class="t2-batt-pick ${isCustom?'is-custom':''}"
              onclick="openCatalogue('directed-swap',${c.id})"
              title="Browse battery catalogue">
        <span class="t2-batt-pick-body">${label}</span>
        <span class="t2-batt-pick-chev">▾</span>
      </button>
    </div>
  `;
}

function renderCustomSize(c) {
  return `
    <div class="t2-cfg-field">
      <span class="t2-cfg-field-key">Size</span>
      <div class="t2-pill t2-pill-edit">
        <input type="number" step="50" value="${c.powerKw}" class="t2-pill-num"
               onchange="t2_setField(${c.id},'powerKw',this.value)" />
        <span class="t2-pill-unit">kW</span>
        <span class="t2-pill-sep">/</span>
        <input type="number" step="100" value="${c.energyKwh}" class="t2-pill-num"
               onchange="t2_setField(${c.id},'energyKwh',this.value)" />
        <span class="t2-pill-unit">kWh</span>
        <span class="t2-pill-aside">${c.durationHrs}h</span>
      </div>
    </div>
  `;
}

function renderCatalogueSpecs(c) {
  const dur = c.unitPowerKw > 0 ? (c.unitEnergyKwh / c.unitPowerKw).toFixed(1) : '—';
  return `
    <div class="t2-cfg-field">
      <span class="t2-cfg-field-key">Specs (per unit)</span>
      <div class="t2-pill t2-pill-static">
        <span>${fmtKw(c.unitPowerKw)}</span>
        <span class="t2-pill-sep">·</span>
        <span>${fmtKwh(c.unitEnergyKwh)}</span>
        <span class="t2-pill-aside">${dur}h</span>
      </div>
    </div>
    <div class="t2-cfg-field">
      <span class="t2-cfg-field-key">Qty</span>
      <div class="t2-pill t2-pill-edit t2-pill-qty">
        <span class="t2-pill-aside">×</span>
        <input type="number" min="1" max="999" step="1" value="${c.qty}" class="t2-pill-num"
               onchange="t2_setQty(${c.id},this.value)" />
        <span class="t2-pill-aside">= ${fmtKw(c.powerKw)} / ${fmtKwh(c.energyKwh)}</span>
      </div>
    </div>
  `;
}

function renderServiceRow(c, g) {
  const on = c.gridServices.includes(g.id);
  const params = GRID_SERVICE_PARAMS[g.id] || [];
  const fieldsHtml = on ? params.map(p => `
    <span class="t2-svc-chip-field" title="${escHtml(p.tooltip || '')}" onclick="event.stopPropagation()">
      <input type="number" step="${p.step}" value="${c[p.key] ?? p.default}"
             title="${escHtml(p.tooltip || '')}"
             onclick="event.stopPropagation()"
             onchange="t2_setField(${c.id},'${p.key}',this.value)" />
      <span class="t2-svc-chip-unit">${p.unit}</span>
    </span>
  `).join('') : '';
  return `
    <button class="t2-svc-chip ${on?'on':''}"
            onclick="t2_toggleGridService(${c.id},'${g.id}')">
      <span class="t2-svc-chip-check">${on?'✓':''}</span>
      <span class="t2-svc-chip-name">${g.label}</span>
      ${fieldsHtml}
    </button>
  `;
}

function renderTariffSwitchRow(c) {
  const on = !!c.tariffSwitch;
  const fieldHtml = on ? `
    <span class="t2-svc-chip-field" onclick="event.stopPropagation()">
      <select onclick="event.stopPropagation()"
              onchange="t2_setField(${c.id},'altTariff',this.value)">
        ${TARIFF_LIST.map(t => `<option value="${t.id}" ${c.altTariff===t.id?'selected':''}>${t.label}</option>`).join('')}
      </select>
    </span>
  ` : '';
  return `
    <button class="t2-svc-chip ${on?'on':''}"
            onclick="t2_setField(${c.id},'tariffSwitch',${!on})">
      <span class="t2-svc-chip-check">${on?'✓':''}</span>
      <span class="t2-svc-chip-name">Tariff Switch</span>
      ${fieldHtml}
    </button>
  `;
}

function renderConfigDetail(c) {
  return `
    <div class="t2-cfg-detail">
      <div class="t2-detail-grid">
        <div class="t2-detail-field"><label>CapEx ($/kWh)</label>
          <input type="number" step="5" value="${c.capitalCostPerKwh}"
                 onchange="t2_setField(${c.id},'capitalCostPerKwh',this.value)" /></div>
        <div class="t2-detail-field"><label>O&amp;M ($/yr)</label>
          <input type="number" step="1000" placeholder="auto" value="${c.omCostAnnual ?? ''}"
                 onchange="t2_setField(${c.id},'omCostAnnual',this.value||null)" /></div>
        <div class="t2-detail-field"><label>Project life (yrs)</label>
          <input type="number" min="1" max="30" step="1" value="${c.totalProjectLife}"
                 onchange="t2_setField(${c.id},'totalProjectLife',this.value)" /></div>
        <div class="t2-detail-field"><label>Min SOC</label>
          <input type="number" min="0" max="1" step="0.05" value="${c.minSoc}"
                 onchange="t2_setField(${c.id},'minSoc',this.value)" /></div>
        <div class="t2-detail-field"><label>Max SOC</label>
          <input type="number" min="0" max="1" step="0.05" value="${c.maxSoc}"
                 onchange="t2_setField(${c.id},'maxSoc',this.value)" /></div>
      </div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// MATRIX BATCH
// ═══════════════════════════════════════════════════════════════
function renderMatrixPanel() {
  const grid = document.getElementById('t2-axis-grid');
  if (!grid) return;
  grid.innerHTML = `
    ${axisCardBillStrategy()}
    ${axisCardGridServices()}
    ${axisCardSizes()}
    ${axisCardSolar()}
    ${axisCardTariffSwitch()}
    ${axisCardAdvanced()}
  `;
  updateMatrixCount();
}

function axisCardBillStrategy() {
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Bill Reduction Strategies</div>
        <div class="t2-axis-sub">Pick one or more — each becomes a row in the sweep</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-svc-stack">
          ${BILL_STRATEGIES.map(s => {
            const on = T2.mxBillStrategies.includes(s.id);
            return `<button class="t2-svc-chip ${on?'on':''}" onclick="t2_mxToggle('mxBillStrategies','${s.id}')">
              <span class="t2-svc-chip-check">${on?'✓':''}</span>
              <span class="t2-svc-chip-name">${s.label}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function axisCardGridServices() {
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Grid Services</div>
        <div class="t2-axis-sub">Layered on every config — params shared across the whole batch</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-svc-stack">
          ${GRID_SERVICES.map(g => {
            const on = T2.mxGridServices.includes(g.id);
            const params = GRID_SERVICE_PARAMS[g.id] || [];
            const fieldsHtml = on ? params.map(p => `
              <span class="t2-svc-chip-field" title="${escHtml(p.tooltip || '')}" onclick="event.stopPropagation()">
                <input type="number" step="${p.step}" value="${T2.mxServiceParams[p.key] ?? p.default}"
                       title="${escHtml(p.tooltip || '')}"
                       onclick="event.stopPropagation()"
                       onchange="t2_mxSetServiceParam('${p.key}',this.value)" />
                <span class="t2-svc-chip-unit">${p.unit}</span>
              </span>
            `).join('') : '';
            return `<button class="t2-svc-chip ${on?'on':''}" onclick="t2_mxToggle('mxGridServices','${g.id}')">
              <span class="t2-svc-chip-check">${on?'✓':''}</span>
              <span class="t2-svc-chip-name">${g.label}</span>
              ${fieldsHtml}
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── Sizes axis — catalogue-driven ─────────────────────────────
function axisCardSizes() {
  return `
    <div class="t2-axis-card t2-axis-card-wide">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Battery Sizes</div>
        <div class="t2-axis-sub">Sweep one row per battery. Pick from the catalogue; bump quantity to scale.</div>
        <div class="t2-axis-head-actions">
          <button class="t2-ghost-btn" onclick="t2_mxResetSizes()">↻ Reset to best fits</button>
          <button class="t2-ghost-btn" onclick="openCatalogue('matrix-add')">Browse catalogue</button>
        </div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-size-grid">
          ${T2.mxSizes.length === 0
            ? '<div class="t2-size-empty">No batteries selected. Click <strong>Browse catalogue</strong> to add some.</div>'
            : T2.mxSizes.map((sz, i) => renderSizeTile(sz, i)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSizeTile(sz, i) {
  const qty = sz.qty || 1;
  if (sz.source === 'catalogue') {
    const bat = findBattery(sz.batteryKey);
    if (!bat) return '';
    const tierLbl = BATTERY_TIERS.find(t => t.id === bat.tier)?.label || '';
    const totalKw = bat.power_rating_kw * qty;
    const totalKwh = bat.energy_capacity_kwh * qty;
    const dur = bat.duration_hrs;
    return `
      <div class="t2-size-tile is-catalogue ${sz.isAnchor?'is-anchor':''}" data-battery="${escHtml(sz.batteryKey)}">
        <button class="t2-size-tile-remove" onclick="t2_mxRemoveSize(${sz.id})">✕</button>
        <div class="t2-size-tile-body">
          <div class="t2-size-tile-tier">${tierLbl}${sz.isAnchor ? ' · best fit' : ''}</div>
          <div class="t2-size-tile-name">${escHtml(sz.batteryKey)}</div>
          <div class="t2-size-tile-units">${qty} ${qty > 1 ? 'units' : 'unit'}</div>
          <div class="t2-size-tile-specs">
            <strong>${fmtKw(totalKw)}</strong> · <strong>${fmtKwh(totalKwh)}</strong>
            <span class="t2-size-tile-aside">${dur}h</span>
          </div>
        </div>
        <div class="t2-qty-stepper">
          <button class="t2-qty-bump t2-qty-up" onclick="t2_mxBumpQty(${sz.id},1)" title="Add one unit">▲</button>
          <div class="t2-qty-num">${qty}</div>
          <button class="t2-qty-bump t2-qty-down" onclick="t2_mxBumpQty(${sz.id},-1)" title="Remove one unit" ${qty<=1?'disabled':''}>▼</button>
        </div>
      </div>
    `;
  }
  // Legacy custom tile — kept for backwards compat, no new ones are created.
  const dur = sz.powerKw > 0 ? (sz.energyKwh / sz.powerKw).toFixed(1) : '—';
  return `
    <div class="t2-size-tile is-custom ${sz.isAnchor?'is-anchor':''}">
      <button class="t2-size-tile-remove" onclick="t2_mxRemoveSize(${sz.id})">✕</button>
      <div class="t2-size-tile-tier">${sz.isAnchor ? '→ Starting size' : 'Custom'}</div>
      <div class="t2-size-tile-inputs">
        <input type="number" class="t2-size-input" value="${sz.powerKw}" step="100"
               onchange="t2_mxEditSize(${sz.id},'powerKw',this.value)" />
        <span class="t2-size-unit">kW</span>
        <span class="t2-size-sep">×</span>
        <input type="number" class="t2-size-input" value="${sz.energyKwh}" step="500"
               onchange="t2_mxEditSize(${sz.id},'energyKwh',this.value)" />
        <span class="t2-size-unit">kWh</span>
      </div>
      <div class="t2-size-tile-specs">
        <span class="t2-size-tile-aside">${dur}h duration</span>
      </div>
    </div>
  `;
}

function fmtKw(kw)  { return kw >= 1000 ? `${(kw/1000).toFixed(kw%1000?1:0)} MW`   : `${kw} kW`;  }
function fmtKwh(kwh){ return kwh >= 1000 ? `${(kwh/1000).toFixed(kwh%1000?1:0)} MWh` : `${kwh} kWh`; }

function axisCardSolar() {
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Solar</div>
        <div class="t2-axis-sub">Sweep with, without, or both</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-svc-stack">
          ${[{v:false,l:'No Solar'},{v:true,l:'With Solar'}].map(o => {
            const on = T2.mxSolar.includes(o.v);
            return `<button class="t2-svc-chip ${on?'on':''}" onclick="t2_mxToggleSolar(${o.v})">
              <span class="t2-svc-chip-check">${on?'✓':''}</span>
              <span class="t2-svc-chip-name">${o.l}</span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

function axisCardTariffSwitch() {
  const on = T2.mxTariffSwitch;
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Tariff Switch</div>
        <div class="t2-axis-sub">Optional — simulate moving the meter to a different rate post-install</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-svc-stack">
          <button class="t2-svc-chip ${on?'on':''}"
                  onclick="T2.mxTariffSwitch=${!on};renderMatrixPanel()">
            <span class="t2-svc-chip-check">${on?'✓':''}</span>
            <span class="t2-svc-chip-name">Switch tariff after install</span>
            ${on ? `
              <span class="t2-svc-chip-field" onclick="event.stopPropagation()">
                <select onclick="event.stopPropagation()"
                        onchange="T2.mxAltTariff=this.value;updateMatrixCount()">
                  ${TARIFF_LIST.map(t => `<option value="${t.id}" ${T2.mxAltTariff===t.id?'selected':''}>${t.label}</option>`).join('')}
                </select>
              </span>
            ` : ''}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Advanced parameters axis — batch-wide overrides ───────────
// Mirrors the "More" disclosure on Directed config cards. Values left
// blank fall back to the catalogue battery's spec (CapEx, O&M, SOC) or
// the heuristic default (project life). totalProjectLife always applies.
function axisCardAdvanced() {
  const a = T2.mxAdvanced;
  const open = !!T2.mxAdvancedOpen;
  const overrideCount =
    (a.capitalCostPerKwh != null ? 1 : 0) +
    (a.omCostAnnual != null ? 1 : 0) +
    (a.minSoc != null ? 1 : 0) +
    (a.maxSoc != null ? 1 : 0) +
    (a.totalProjectLife !== 10 ? 1 : 0);
  const summary = overrideCount > 0
    ? `${overrideCount} override${overrideCount > 1 ? 's' : ''} active`
    : 'Using catalogue / heuristic defaults';
  return `
    <div class="t2-axis-card t2-axis-card-wide t2-axis-card-advanced ${open ? 'is-open' : ''}">
      <button class="t2-axis-disclosure" onclick="t2_mxToggleAdvanced()" aria-expanded="${open}">
        <div class="t2-axis-disclosure-meta">
          <div class="t2-axis-title">More — Advanced parameters</div>
          <div class="t2-axis-sub">Batch-wide overrides for CapEx, O&amp;M, project life and SOC limits. Leave blank to use each battery's catalogue value.</div>
        </div>
        <div class="t2-axis-disclosure-right">
          <span class="t2-axis-disclosure-pill">${summary}</span>
          <span class="t2-more-caret ${open ? 'is-open' : ''}">▾</span>
        </div>
      </button>
      ${open ? `
        <div class="t2-axis-body">
          <div class="t2-detail-grid">
            <div class="t2-detail-field">
              <label>CapEx ($/kWh)</label>
              <input type="number" step="5" placeholder="per battery"
                     value="${a.capitalCostPerKwh ?? ''}"
                     onchange="t2_mxSetAdvanced('capitalCostPerKwh', this.value)" />
            </div>
            <div class="t2-detail-field">
              <label>O&amp;M ($/yr)</label>
              <input type="number" step="1000" placeholder="per battery"
                     value="${a.omCostAnnual ?? ''}"
                     onchange="t2_mxSetAdvanced('omCostAnnual', this.value)" />
            </div>
            <div class="t2-detail-field">
              <label>Project life (yrs)</label>
              <input type="number" min="1" max="30" step="1"
                     value="${a.totalProjectLife}"
                     onchange="t2_mxSetAdvanced('totalProjectLife', this.value)" />
            </div>
            <div class="t2-detail-field">
              <label>Min SOC</label>
              <input type="number" min="0" max="1" step="0.05" placeholder="catalogue"
                     value="${a.minSoc ?? ''}"
                     onchange="t2_mxSetAdvanced('minSoc', this.value)" />
            </div>
            <div class="t2-detail-field">
              <label>Max SOC</label>
              <input type="number" min="0" max="1" step="0.05" placeholder="catalogue"
                     value="${a.maxSoc ?? ''}"
                     onchange="t2_mxSetAdvanced('maxSoc', this.value)" />
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function t2_mxToggleAdvanced() {
  T2.mxAdvancedOpen = !T2.mxAdvancedOpen;
  renderMatrixPanel();
}
function t2_mxSetAdvanced(field, value) {
  // Empty string clears the override (except for totalProjectLife, which
  // always has a numeric value — falls back to 10).
  if (value === '' || value == null) {
    T2.mxAdvanced[field] = field === 'totalProjectLife' ? 10 : null;
  } else {
    const n = parseFloat(value);
    T2.mxAdvanced[field] = isNaN(n) ? null : n;
  }
  renderMatrixPanel();
}
function t2_mxToggle(arrayName, id) {
  const arr = T2[arrayName];
  const i = arr.indexOf(id);
  if (i >= 0) arr.splice(i, 1); else arr.push(id);
  renderMatrixPanel();
}
function t2_mxToggleSolar(v) {
  const i = T2.mxSolar.indexOf(v);
  if (i >= 0) T2.mxSolar.splice(i, 1); else T2.mxSolar.push(v);
  renderMatrixPanel();
}
function t2_mxAddCustom() {
  T2.mxSizes.push({ id: T2.nextSizeId++, source: 'custom', powerKw: 1000, energyKwh: 4000, qty: 1 });
  renderMatrixPanel();
}
function t2_mxAddFromCatalogue(b) {
  // Don't double-add the same battery
  const existing = T2.mxSizes.find(s => s.source === 'catalogue' && s.batteryKey === batKey(b));
  if (existing) return;
  T2.mxSizes.push({
    id: T2.nextSizeId++,
    source: 'catalogue',
    batteryKey: batKey(b),
    powerKw: b.power_rating_kw,
    energyKwh: b.energy_capacity_kwh,
    qty: 1,
  });
  renderMatrixPanel();
}
function t2_mxRemoveSize(id) {
  T2.mxSizes = T2.mxSizes.filter(s => s.id !== id);
  renderMatrixPanel();
}
function t2_mxEditSize(id, field, value) {
  const sz = T2.mxSizes.find(s => s.id === id);
  if (!sz) return;
  const n = parseFloat(value);
  if (!isNaN(n)) sz[field] = n;
  renderMatrixPanel();
}
function t2_mxSetQty(id, value) {
  const sz = T2.mxSizes.find(s => s.id === id);
  if (!sz) return;
  sz.qty = Math.max(1, parseInt(value, 10) || 1);
  renderMatrixPanel();
}
function t2_mxBumpQty(id, delta) {
  const sz = T2.mxSizes.find(s => s.id === id);
  if (!sz) return;
  sz.qty = Math.max(1, (sz.qty || 1) + delta);
  renderMatrixPanel();
}
function t2_mxSetServiceParam(key, value) {
  const n = parseFloat(value);
  if (!isNaN(n)) T2.mxServiceParams[key] = n;
  // No re-render — the input keeps its new value and run-time picks it up.
}
function t2_mxResetSizes() {
  const anchor = getHeuristicAnchor();
  T2.mxSizes = buildDefaultSizeSet(anchor.powerKw, anchor.energyKwh);
  renderMatrixPanel();
}

function updateMatrixCount() {
  const strat  = Math.max(1, T2.mxBillStrategies.length);
  const sizes  = Math.max(1, T2.mxSizes.length);
  const solar  = Math.max(1, T2.mxSolar.length);
  const n = strat * sizes * solar;
  const numEl = document.getElementById('t2-matrix-count-num');
  const fmlEl = document.getElementById('t2-matrix-formula');
  if (numEl) numEl.textContent = n;
  if (fmlEl) {
    fmlEl.innerHTML = `
      <div>${strat} strateg${strat>1?'ies':'y'} × ${sizes} size${sizes>1?'s':''} × ${solar} solar = <strong>${n}</strong></div>
      ${T2.mxGridServices.length ? `<div class="t2-formula-sub">+ ${T2.mxGridServices.length} grid service${T2.mxGridServices.length>1?'s':''} stacked on each</div>` : ''}
      ${T2.mxTariffSwitch ? `<div class="t2-formula-sub">+ tariff switch to <strong>${TARIFF_LIST.find(t=>t.id===T2.mxAltTariff)?.label}</strong></div>` : ''}
      <div class="t2-formula-sub">Est. runtime: ~${Math.max(1, Math.ceil(n * 0.3))} min</div>
    `;
  }
  const runBtn = document.getElementById('t2-matrix-run-btn');
  if (runBtn) runBtn.disabled = n === 0 || n > 200 || T2.mxBillStrategies.length === 0 || T2.mxSizes.length === 0;
}

function t2_runMatrix() {
  const cols = [];
  for (const stratId of T2.mxBillStrategies) {
    for (const sz of T2.mxSizes) {
      for (const solar of T2.mxSolar) {
        const stratLbl = BILL_STRATEGIES.find(s => s.id === stratId)?.label;
        const bat = sz.source === 'catalogue' ? findBattery(sz.batteryKey) : null;
        const qty = sz.qty || 1;
        const totalKw  = sz.source === 'catalogue' ? bat.power_rating_kw * qty : sz.powerKw;
        const totalKwh = sz.source === 'catalogue' ? bat.energy_capacity_kwh * qty : sz.energyKwh;
        const sizeLbl = sz.source === 'catalogue'
          ? (qty > 1 ? `${sz.batteryKey} ×${qty}` : sz.batteryKey)
          : `${(sz.powerKw/1000).toFixed(1)}MW`;
        const col = makeCol({
          powerKw: totalKw,
          energyKwh: totalKwh,
          durationHrs: +(totalKwh / totalKw).toFixed(2),
          billStrategy: stratId,
          gridServices: [...T2.mxGridServices],
          ...T2.mxServiceParams, // shared service params across the whole batch
          includeSolar: solar,
          tariffSwitch: T2.mxTariffSwitch,
          altTariff: T2.mxAltTariff,
          catalogueBattery: bat ? batKey(bat) : null,
          unitPowerKw: bat ? bat.power_rating_kw : totalKw,
          unitEnergyKwh: bat ? bat.energy_capacity_kwh : totalKwh,
          qty,
          capitalCostPerKwh: T2.mxAdvanced.capitalCostPerKwh ?? bat?.upfront_cost_per_kwh ?? 280,
          omCostAnnual:      T2.mxAdvanced.omCostAnnual      ?? bat?.ongoing_cost_annual ?? null,
          totalProjectLife:  T2.mxAdvanced.totalProjectLife  ?? 10,
          minSoc:            T2.mxAdvanced.minSoc            ?? bat?.min_soc ?? 0.05,
          maxSoc:            T2.mxAdvanced.maxSoc            ?? bat?.max_soc ?? 0.95,
          label: `${stratLbl} · ${sizeLbl}${solar?' +S':''}`,
        });
        col.results = mockSimulate(col);
        cols.push(col);
      }
    }
  }
  T2.batchResults = cols;
  renderResults(T2.batchResults);
  document.getElementById('t2-results-panel').style.display = '';
  document.getElementById('t2-results-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ═══════════════════════════════════════════════════════════════
// JSON PREVIEW
// ═══════════════════════════════════════════════════════════════
function openJsonPreview() {
  const active = document.querySelector('.t2-mode-btn.active')?.dataset.mode || 'directed';
  let payload;
  if (active === 'directed') {
    payload = { mode: 'directed', configs: T2.directedCols.map(c => ({
      label: c.label, powerKw: c.powerKw, energyKwh: c.energyKwh,
      billStrategy: c.billStrategy, gridServices: c.gridServices,
      includeSolar: c.includeSolar,
      ...(c.tariffSwitch ? { tariffSwitch: { to: c.altTariff } } : {}),
      capitalCostPerKwh: c.capitalCostPerKwh, omCostAnnual: c.omCostAnnual,
      totalProjectLife: c.totalProjectLife, minSoc: c.minSoc, maxSoc: c.maxSoc,
      ...(c.catalogueBattery ? { battery: c.catalogueBattery } : {}),
    })) };
  } else {
    payload = { mode: 'matrix', axes: {
      billStrategy: T2.mxBillStrategies,
      sizes: T2.mxSizes.map(s => s.source === 'catalogue'
        ? { battery: s.batteryKey, powerKw: s.powerKw, energyKwh: s.energyKwh }
        : { powerKw: s.powerKw, energyKwh: s.energyKwh }),
      solar: T2.mxSolar,
    }, applyToAll: {
      gridServices: T2.mxGridServices,
      ...(T2.mxTariffSwitch ? { tariffSwitch: { to: T2.mxAltTariff } } : {}),
    } };
  }
  document.getElementById('t2-json-body').textContent = JSON.stringify(payload, null, 2);
  document.getElementById('t2-json-modal').style.display = 'flex';
}
function closeJsonPreview() {
  document.getElementById('t2-json-modal').style.display = 'none';
}

// ═══════════════════════════════════════════════════════════════
// COMPARISON TABLE
// ═══════════════════════════════════════════════════════════════
function renderResults(results) {
  if (!results.length) return;
  const bestNpv = Math.max(...results.filter(r => r.results).map(r => r.results.npv));
  const compEl = document.getElementById('t2-comp-table-wrap');

  let html = `<table class="t2-comp-table"><thead><tr>
    <th class="t2-comp-row-hdr"></th>
    ${results.map(r => {
      const isBest = r.results && r.results.npv === bestNpv && bestNpv > 0;
      return `<th class="t2-comp-col-hdr ${isBest?'t2-best-col':''}">
        ${isBest ? '<span class="t2-top-badge">★ Top Performer</span>' : ''}
        <div class="t2-comp-col-label">${escHtml(r.label)}</div>
      </th>`;
    }).join('')}
  </tr></thead><tbody>`;

  html += `<tr class="t2-section-hdr"><td colspan="${results.length+1}">Inputs — Storage</td></tr>`;
  html += compRow('Power (kW)',   results, r => r.powerKw.toLocaleString());
  html += compRow('Energy (kWh)', results, r => r.energyKwh.toLocaleString());
  html += compRow('Duration (h)', results, r => r.durationHrs);
  html += compRow('Strategy',     results, r => BILL_STRATEGIES.find(s=>s.id===r.billStrategy)?.label || r.billStrategy);
  html += compRow('Grid services',results, r => r.gridServices.length ? r.gridServices.map(g=>GRID_SERVICES.find(x=>x.id===g)?.label).join(', ') : '—');
  html += compRow('Solar',        results, r => r.includeSolar ? '✓' : '—');
  html += compRow('Tariff switch',results, r => r.tariffSwitch ? `→ ${TARIFF_LIST.find(t=>t.id===r.altTariff)?.label}` : '—');

  html += `<tr class="t2-section-hdr"><td colspan="${results.length+1}">Inputs — Costs</td></tr>`;
  html += compRow('CapEx ($/kWh)', results, r => `$${r.capitalCostPerKwh}`);
  html += compRow('Total CapEx',   results, r => r.results ? `$${r.results.capex.toLocaleString()}` : '—');
  html += compRow('O&M ($/yr)',    results, r => r.results ? `$${r.results.annualOM.toLocaleString()}` : '—');
  html += compRow('Project life',  results, r => `${r.totalProjectLife} yr`);

  html += `<tr class="t2-section-hdr"><td colspan="${results.length+1}">Outputs — Financial</td></tr>`;
  html += compRow('Annual Savings', results, r => r.results ? `$${r.results.annualSavings.toLocaleString()}` : '—', 'annualSavings');
  html += compRow('NPV',            results, r => r.results ? `$${r.results.npv.toLocaleString()}` : '—', 'npv');
  html += compRow('IRR',            results, r => r.results?.irr != null ? `${(r.results.irr*100).toFixed(1)}%` : '—', 'irr');
  html += compRow('Simple payback', results, r => r.results?.payback != null ? `${r.results.payback} yr` : '—');
  html += compRow('Battery',        results, r => r.catalogueBattery || '—');

  html += '</tbody></table>';
  compEl.innerHTML = `
    <div class="t2-comp-toolbar">
      <label class="t2-matrix-check"><input type="checkbox" id="t2-diff-only" onchange="toggleDiffOnly(this.checked)"> Show differences only</label>
      <button class="t2-ghost-btn" onclick="openCatalogue('bulk-swap')">Bulk Catalogue Swap</button>
    </div>
    ${html}`;
}

function compRow(label, results, valFn, metricKey) {
  const values = results.map(r => valFn(r));
  const allSame = values.every(v => v === values[0]);
  let row = `<tr class="t2-comp-data-row ${allSame?'t2-all-same':''}" data-diff="${!allSame}">`;
  row += `<td class="t2-row-lbl">${label}</td>`;
  results.forEach((r, i) => {
    let cls = 't2-cell';
    if (metricKey && r.results) {
      const mv = r.results[metricKey];
      if (['npv','irr','annualSavings'].includes(metricKey)) {
        const bestVal = Math.max(...results.filter(x => x.results && x.results[metricKey] != null).map(x => x.results[metricKey]));
        if (mv === bestVal && bestVal > 0) cls += ' t2-best-cell';
      }
    }
    row += `<td class="${cls}">${values[i]}</td>`;
  });
  row += '</tr>';
  return row;
}
function toggleDiffOnly(on) {
  document.querySelectorAll('.t2-all-same').forEach(r => { r.style.display = on ? 'none' : ''; });
}

// ═══════════════════════════════════════════════════════════════
// BATTERY CATALOGUE MODAL — handles all 3 modes
// ═══════════════════════════════════════════════════════════════
function openCatalogue(mode, colId) {
  T2.catalogueMode = mode;          // 'directed-swap' | 'matrix-add' | 'bulk-swap'
  T2.catalogueColId = colId ?? null;
  T2.catalogueTierFilter = 'all';
  document.getElementById('t2-cat-search').value = '';
  renderCatalogueModal('');
  document.getElementById('t2-catalogue-modal').style.display = 'flex';
}
function closeCatalogue() {
  document.getElementById('t2-catalogue-modal').style.display = 'none';
}

function renderCatalogueModal(filterTerm) {
  const mode = T2.catalogueMode;
  const isMatrix = mode === 'matrix-add';

  // Target spec for "good fit" highlighting
  let targetKw, targetKwh;
  if (mode === 'directed-swap' && T2.catalogueColId) {
    const col = T2.directedCols.find(c => c.id === T2.catalogueColId);
    if (col) { targetKw = col.powerKw; targetKwh = col.energyKwh; }
  } else {
    const anchor = getHeuristicAnchor();
    targetKw = anchor.powerKw; targetKwh = anchor.energyKwh;
  }

  const term = (filterTerm || '').toLowerCase();
  const tierFilter = T2.catalogueTierFilter;
  const matches = BATTERY_CATALOGUE
    .filter(b => (!term || `${b.manufacturer} ${b.model}`.toLowerCase().includes(term))
              && (tierFilter === 'all' || b.tier === tierFilter))
    .map(b => ({ ...b,
      _pwMatch: Math.abs(b.power_rating_kw  - targetKw)  / targetKw  <= 0.10,
      _enMatch: Math.abs(b.energy_capacity_kwh - targetKwh) / targetKwh <= 0.20,
      _alreadyAdded: isMatrix && T2.mxSizes.some(s => s.source === 'catalogue' && s.batteryKey === batKey(b)),
    }))
    .sort((a, b) => {
      // Default sort: tier (residential → utility) → power asc → energy asc.
      // Target highlighting (✓ checkmarks) calls out best fits visually so
      // we don't need to sort by fit score.
      const tierOrder = { residential: 0, light_commercial: 1, commercial: 2, utility: 3 };
      const tierDiff = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
      if (tierDiff !== 0) return tierDiff;
      if (a.power_rating_kw !== b.power_rating_kw) return a.power_rating_kw - b.power_rating_kw;
      return a.energy_capacity_kwh - b.energy_capacity_kwh;
    });

  // Hint / context line
  const modeNote = isMatrix
    ? `<strong>${T2.mxSizes.filter(s => s.source === 'catalogue').length}</strong> batteries already added to the Matrix sizes axis.`
    : `Target ${targetKw.toLocaleString()} kW / ${targetKwh.toLocaleString()} kWh — ✓ within ±10% power & ±20% energy`;
  document.getElementById('t2-cat-hint').innerHTML = modeNote;

  // Tier filter chips
  const tierBar = document.getElementById('t2-cat-tier-bar');
  if (tierBar) {
    tierBar.innerHTML = `
      <button class="t2-tier-chip ${tierFilter==='all'?'on':''}" onclick="t2_setTierFilter('all')">All tiers</button>
      ${BATTERY_TIERS.map(t => `
        <button class="t2-tier-chip ${tierFilter===t.id?'on':''}" onclick="t2_setTierFilter('${t.id}')">
          ${t.label} <span class="t2-tier-range">${t.range}</span>
        </button>
      `).join('')}
    `;
  }

  // Title + close text reflects mode
  const titleEl = document.querySelector('.t2-modal-title');
  if (titleEl) titleEl.textContent = isMatrix ? 'Add Batteries to Matrix' : 'Battery Catalogue';
  const closeBtn = document.querySelector('.t2-close-btn');
  if (closeBtn) closeBtn.textContent = isMatrix ? 'Done ✓' : '✕';

  const tbody = document.getElementById('t2-cat-tbody');
  tbody.innerHTML = matches.map(b => {
    const match = b._pwMatch && b._enMatch ? 'good' : (b._pwMatch || b._enMatch ? 'partial' : '');
    const tierLbl = BATTERY_TIERS.find(t => t.id === b.tier)?.label || '';
    const actionHtml = isMatrix
      ? (b._alreadyAdded
          ? '<span class="t2-cat-added">✓ Added</span>'
          : `<button class="t2-ghost-btn" onclick='applyBatteryCatalogue(${JSON.stringify(b).replace(/'/g, "&#39;")})'>+ Add</button>`)
      : `<button class="t2-ghost-btn" onclick='applyBatteryCatalogue(${JSON.stringify(b).replace(/'/g, "&#39;")})'>Select</button>`;

    return `<tr class="t2-cat-row ${match}">
      <td>${match==='good'?'✓':match==='partial'?'~':''}</td>
      <td><span class="t2-cat-tier-badge t2-tier-${b.tier}">${tierLbl}</span></td>
      <td>${b.manufacturer}</td><td>${b.model}</td>
      <td>${b.power_rating_kw.toLocaleString()}</td>
      <td>${b.energy_capacity_kwh.toLocaleString()}</td>
      <td>${b.duration_hrs}</td>
      <td>${(b.roundtrip_efficiency*100).toFixed(0)}%</td>
      <td>$${b.upfront_cost_per_kwh}</td>
      <td>${actionHtml}</td>
    </tr>`;
  }).join('');
}

function t2_setTierFilter(tier) {
  T2.catalogueTierFilter = tier;
  renderCatalogueModal(document.getElementById('t2-cat-search').value);
}

function applyBatteryCatalogue(b) {
  const mode = T2.catalogueMode;
  if (mode === 'matrix-add') {
    t2_mxAddFromCatalogue(b);
    renderCatalogueModal(document.getElementById('t2-cat-search').value);
    return;
  }
  const newLabel = batKey(b);
  function applyToCol(col) {
    col.powerKw = b.power_rating_kw;
    col.energyKwh = b.energy_capacity_kwh;
    col.durationHrs = b.duration_hrs;
    col.unitPowerKw = b.power_rating_kw;
    col.unitEnergyKwh = b.energy_capacity_kwh;
    col.qty = 1;
    col.capitalCostPerKwh = b.upfront_cost_per_kwh;
    col.omCostAnnual = b.ongoing_cost_annual;
    col.minSoc = b.min_soc;
    col.maxSoc = b.max_soc;
    col.catalogueBattery = newLabel;
    col.results = mockSimulate(col);
  }
  if (mode === 'bulk-swap') {
    T2.directedCols.forEach(applyToCol);
    T2.batchResults.forEach(applyToCol);
  } else if (T2.catalogueColId != null) {
    const col = T2.directedCols.find(c => c.id === T2.catalogueColId)
             || T2.batchResults.find(c => c.id === T2.catalogueColId);
    if (col) applyToCol(col);
  }
  closeCatalogue();
  renderDirectedStack();
  if (T2.batchResults.length) renderResults(T2.batchResults);
}

// ── Utils ─────────────────────────────────────────────────────
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Step 2 → Step 3 hover bridge ──────────────────────────────
// Step 2's "Nearest catalogue fits" table calls these on row hover so the
// user can see which Step-3 sim configurations actually represent that
// battery. We mark matching directed cards and matrix size tiles with
// .is-highlight; CSS handles the visual treatment.
function t2_highlightBattery(key) {
  if (!key) return;
  document.querySelectorAll('.t2-cfg-card[data-battery]').forEach(el => {
    el.classList.toggle('is-highlight', el.dataset.battery === key);
  });
  document.querySelectorAll('.t2-size-tile[data-battery]').forEach(el => {
    el.classList.toggle('is-highlight', el.dataset.battery === key);
  });
}
function t2_clearHighlight() {
  document.querySelectorAll('.is-highlight').forEach(el => el.classList.remove('is-highlight'));
}

// Hook: when heuristic refreshes, reset matrix sizes so they re-derive,
// and re-seed directed if its first seed used fallback defaults.
const _origCompute = window.compute;
window.compute = function () {
  _origCompute && _origCompute();
  T2.mxSizes = [];
  if (T2.directedSeededFromDefaults && T2.directedCols.length > 0) {
    T2.directedCols = [];
    T2.directedSeededFromDefaults = false;
    t2_suggestSizes(true);
  }
};
