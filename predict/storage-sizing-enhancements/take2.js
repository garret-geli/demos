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
  // mxSizes entries: { id, source: 'custom'|'catalogue', powerKw, energyKwh, batteryKey?, isAnchor? }
  mxSizes: [],
  nextSizeId: 1,
  mxBillStrategies: ['tou'],
  mxGridServices: [],
  mxSolar: [false],
  mxTariffSwitch: false,
  mxAltTariff: 'sdge-al',

  // Results
  batchResults: [],

  // Catalogue modal
  catalogueMode: null, // 'directed-swap' | 'matrix-add'
  catalogueColId: null,
  catalogueTierFilter: 'all',
};

// ── Default size set from heuristic anchor ────────────────────
function buildDefaultSizeSet(anchorKw, anchorKwh) {
  const stepKw  = Math.max(500,  Math.round((anchorKw  * 0.20) / 500)  * 500);
  const stepKwh = Math.max(1000, Math.round((anchorKwh * 0.20) / 1000) * 1000);
  const sizes = [];
  for (let i = -2; i <= 2; i++) {
    sizes.push({
      id: T2.nextSizeId++,
      source: 'custom',
      powerKw:   Math.max(100, anchorKw  + i * stepKw),
      energyKwh: Math.max(200, anchorKwh + i * stepKwh),
      isAnchor:  i === 0,
    });
  }
  return sizes;
}

function getHeuristicAnchor() {
  if (typeof S === 'undefined' || !S.dailyStats) return { powerKw: 2000, energyKwh: 8000 };
  const tariff = TARIFFS[S.tariffKey];
  const sizing = computeSizing(S.dailyStats, S.rates, S.covPctile, tariff);
  if (sizing.dcm.viable) return { powerKw: sizing.dcm.powerKw, energyKwh: sizing.dcm.energyKwh };
  if (sizing.arb.viable) return { powerKw: sizing.arb.powerKw, energyKwh: sizing.arb.energyKwh };
  return { powerKw: sizing.dcm.powerKw || 2000, energyKwh: sizing.dcm.energyKwh || 8000 };
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
    label: `Config ${id}`,
    powerKw: anchor.powerKw,
    energyKwh: anchor.energyKwh,
    durationHrs: +(anchor.energyKwh / anchor.powerKw).toFixed(2),
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
    catalogueBattery: null,
    results: null,
  }, overrides);
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
  const anchor = getHeuristicAnchor();
  const sizes = buildDefaultSizeSet(anchor.powerKw, anchor.energyKwh);
  const strategies = ['tou', 'dcm', 'tou_dcm', 'tou', 'tou'];
  if (!seedIfEmpty && T2.directedCols.length > 0) {
    if (!confirm('Replace the current configs with suggested sizes?')) return;
  }
  T2.directedCols = sizes.map((sz, i) => makeCol({
    powerKw: sz.powerKw,
    energyKwh: sz.energyKwh,
    durationHrs: +(sz.energyKwh / sz.powerKw).toFixed(2),
    billStrategy: strategies[i] || 'tou',
    label: sz.isAnchor ? `→ Starting size — ${(sz.powerKw/1000).toFixed(1)} MW` : `Config — ${(sz.powerKw/1000).toFixed(1)} MW`,
  }));
  // Track whether this seed used real heuristic data (vs. fallback defaults)
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
  empty.style.display = 'none';
  runBtn.disabled = false;
  stack.innerHTML = T2.directedCols.map(c => renderConfigCard(c)).join('');
}

function renderConfigCard(c) {
  const isOpen = T2.expandedColId === c.id;
  return `
    <div class="t2-cfg-card ${isOpen ? 'is-open' : ''}" data-id="${c.id}">
      <div class="t2-cfg-row">
        <div class="t2-cfg-label-wrap">
          <input class="t2-cfg-label-input" value="${escHtml(c.label)}"
                 oninput="t2_setField(${c.id},'label',this.value)" />
        </div>

        <div class="t2-pill-row">
          <div class="t2-pill-group">
            <span class="t2-pill-key">Size</span>
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

          <div class="t2-pill-group">
            <span class="t2-pill-key">Strategy</span>
            <div class="t2-pill t2-pill-select">
              <select onchange="t2_setField(${c.id},'billStrategy',this.value)">
                ${BILL_STRATEGIES.map(s => `<option value="${s.id}" ${c.billStrategy===s.id?'selected':''}>${s.label}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="t2-pill-group">
            <span class="t2-pill-key">Grid services</span>
            <div class="t2-pill-multi">
              ${GRID_SERVICES.map(g => `
                <button class="t2-mini-chip ${c.gridServices.includes(g.id)?'on':''}"
                        onclick="t2_toggleGridService(${c.id},'${g.id}')">${g.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="t2-pill-group">
            <button class="t2-pill t2-pill-toggle ${c.includeSolar?'on':''}"
                    onclick="t2_setField(${c.id},'includeSolar',${!c.includeSolar})">
              <span class="t2-pill-dot"></span>+ Solar
            </button>
          </div>

          <div class="t2-pill-group">
            <button class="t2-pill t2-pill-toggle ${c.tariffSwitch?'on':''}"
                    onclick="t2_setField(${c.id},'tariffSwitch',${!c.tariffSwitch})">
              <span class="t2-pill-dot"></span>Tariff switch
            </button>
            ${c.tariffSwitch ? `
              <div class="t2-pill t2-pill-select t2-pill-followup">
                <span class="t2-pill-key-inline">→</span>
                <select onchange="t2_setField(${c.id},'altTariff',this.value)">
                  ${TARIFF_LIST.map(t => `<option value="${t.id}" ${c.altTariff===t.id?'selected':''}>${t.label}</option>`).join('')}
                </select>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="t2-cfg-actions">
          <button class="t2-more-btn ${isOpen?'is-open':''}" onclick="t2_toggleExpand(${c.id})">
            More <span class="t2-more-caret">▾</span>
          </button>
          <button class="t2-icon-btn" title="Duplicate" onclick="t2_addCol(${c.id})">⊕</button>
          <button class="t2-icon-btn t2-icon-danger" title="Remove" onclick="t2_removeCol(${c.id})">✕</button>
        </div>
      </div>

      ${isOpen ? renderConfigDetail(c) : ''}
    </div>
  `;
}

function renderConfigDetail(c) {
  const catLbl = c.catalogueBattery
    ? `<span class="t2-cat-badge">${escHtml(c.catalogueBattery)}</span>`
    : '<span class="t2-cat-none">No catalogue match — using generic specs</span>';
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
        <div class="t2-detail-field t2-detail-field-wide">
          <label>Battery from catalogue</label>
          <div class="t2-detail-cat">${catLbl}
            <button class="t2-ghost-btn" onclick="openCatalogue('directed-swap',${c.id})">Browse catalogue</button>
          </div>
        </div>
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
  `;
  updateMatrixCount();
}

function axisCardBillStrategy() {
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Bill Reduction Strategy</div>
        <div class="t2-axis-sub">Which energy-bill optimization to dispatch against</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-chip-cloud">
          ${BILL_STRATEGIES.map(s => `
            <button class="t2-axis-chip ${T2.mxBillStrategies.includes(s.id)?'on':''}"
                    onclick="t2_mxToggle('mxBillStrategies','${s.id}')">
              <span class="t2-chip-check">✓</span>
              <span class="t2-chip-label">${s.label}</span>
              <span class="t2-chip-desc">${s.desc}</span>
            </button>
          `).join('')}
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
        <div class="t2-axis-sub">Capacity &amp; ancillary programs to layer on top — optional</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-chip-cloud">
          ${GRID_SERVICES.map(g => `
            <button class="t2-axis-chip ${T2.mxGridServices.includes(g.id)?'on':''}"
                    onclick="t2_mxToggle('mxGridServices','${g.id}')">
              <span class="t2-chip-check">✓</span>
              <span class="t2-chip-label">${g.label}</span>
              <span class="t2-chip-desc">${g.desc}</span>
            </button>
          `).join('')}
        </div>
        <div class="t2-axis-foot">
          ${T2.mxGridServices.length === 0
            ? 'None selected — only bill-reduction simulations will run.'
            : `${T2.mxGridServices.length} service${T2.mxGridServices.length>1?'s':''} stacked on every config.`}
        </div>
      </div>
    </div>
  `;
}

// ── Sizes axis — catalogue-aware ──────────────────────────────
function axisCardSizes() {
  return `
    <div class="t2-axis-card t2-axis-card-wide">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Battery Sizes</div>
        <div class="t2-axis-sub">Pick from the catalogue or define custom sizes. Stepped ±2 around Step 2's starting size.</div>
        <div class="t2-axis-head-actions">
          <button class="t2-ghost-btn" onclick="t2_mxResetSizes()">Reset to Step 2 size</button>
          <button class="t2-ghost-btn" onclick="t2_mxAddCustom()">+ Custom size</button>
          <button class="t2-btn-secondary t2-btn-tiny" onclick="openCatalogue('matrix-add')">📚 Browse catalogue</button>
        </div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-size-grid">
          ${T2.mxSizes.length === 0
            ? '<div class="t2-size-empty">No sizes selected. Add custom values or browse the battery catalogue.</div>'
            : T2.mxSizes.map((sz, i) => renderSizeTile(sz, i)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSizeTile(sz, i) {
  const dur = sz.powerKw > 0 ? (sz.energyKwh / sz.powerKw).toFixed(1) : '—';
  if (sz.source === 'catalogue') {
    const bat = findBattery(sz.batteryKey);
    const tierLbl = bat ? (BATTERY_TIERS.find(t => t.id === bat.tier)?.label || '') : '';
    return `
      <div class="t2-size-tile is-catalogue ${sz.isAnchor?'is-anchor':''}">
        <button class="t2-size-tile-remove" onclick="t2_mxRemoveSize(${sz.id})">✕</button>
        <div class="t2-size-tile-tier">${tierLbl}</div>
        <div class="t2-size-tile-name">${escHtml(sz.batteryKey)}</div>
        <div class="t2-size-tile-specs">
          <strong>${fmtKw(sz.powerKw)}</strong> · <strong>${fmtKwh(sz.energyKwh)}</strong>
          <span class="t2-size-tile-aside">${dur}h</span>
        </div>
      </div>
    `;
  }
  // custom
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
        <div class="t2-axis-sub">Run with, without, or both</div>
      </div>
      <div class="t2-axis-body">
        <div class="t2-chip-cloud">
          ${[{v:false,l:'No Solar'},{v:true,l:'With Solar'}].map(o => `
            <button class="t2-axis-chip ${T2.mxSolar.includes(o.v)?'on':''}"
                    onclick="t2_mxToggleSolar(${o.v})">
              <span class="t2-chip-check">✓</span>
              <span class="t2-chip-label">${o.l}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function axisCardTariffSwitch() {
  return `
    <div class="t2-axis-card">
      <div class="t2-axis-head">
        <div class="t2-axis-title">Tariff Switch</div>
        <div class="t2-axis-sub">Optionally simulate moving the meter to a different rate post-install</div>
      </div>
      <div class="t2-axis-body">
        <label class="t2-axis-toggle">
          <input type="checkbox" ${T2.mxTariffSwitch?'checked':''}
                 onchange="T2.mxTariffSwitch=this.checked;renderMatrixPanel()" />
          <span class="t2-axis-toggle-track"><span class="t2-axis-toggle-knob"></span></span>
          <span class="t2-axis-toggle-label">${T2.mxTariffSwitch?'Enabled':'Disabled'}</span>
        </label>
        ${T2.mxTariffSwitch ? `
          <div class="t2-followup-field">
            <label>Post-install tariff</label>
            <select onchange="T2.mxAltTariff=this.value;updateMatrixCount()">
              ${TARIFF_LIST.map(t => `<option value="${t.id}" ${T2.mxAltTariff===t.id?'selected':''}>${t.label}</option>`).join('')}
            </select>
          </div>
        ` : `<div class="t2-axis-foot">All configs stay on the currently selected tariff.</div>`}
      </div>
    </div>
  `;
}

// ── Matrix handlers ───────────────────────────────────────────
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
  T2.mxSizes.push({ id: T2.nextSizeId++, source: 'custom', powerKw: 1000, energyKwh: 4000 });
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
        const sizeLbl = sz.source === 'catalogue' ? sz.batteryKey : `${(sz.powerKw/1000).toFixed(1)}MW`;
        const bat = sz.source === 'catalogue' ? findBattery(sz.batteryKey) : null;
        const col = makeCol({
          powerKw: sz.powerKw,
          energyKwh: sz.energyKwh,
          durationHrs: +(sz.energyKwh / sz.powerKw).toFixed(2),
          billStrategy: stratId,
          gridServices: [...T2.mxGridServices],
          includeSolar: solar,
          tariffSwitch: T2.mxTariffSwitch,
          altTariff: T2.mxAltTariff,
          catalogueBattery: bat ? batKey(bat) : null,
          capitalCostPerKwh: bat?.upfront_cost_per_kwh ?? 280,
          omCostAnnual: bat?.ongoing_cost_annual ?? null,
          minSoc: bat?.min_soc ?? 0.05,
          maxSoc: bat?.max_soc ?? 0.95,
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
      const aScore = (a._pwMatch?1:0) + (a._enMatch?1:0);
      const bScore = (b._pwMatch?1:0) + (b._enMatch?1:0);
      if (bScore !== aScore) return bScore - aScore;
      return a.upfront_cost_per_kwh - b.upfront_cost_per_kwh;
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
