// ── Tariff definitions ────────────────────────────────────
const TARIFFS = {
  'pge-b19': {
    onPeakHrs: 5,
    schedule: [
      { months: [6, 7, 8, 9], weekdays: [1, 2, 3, 4, 5], hours: [16, 17, 18, 19, 20], period: 'on-peak' },
      { months: [1, 2, 3, 4, 5, 10, 11, 12], weekdays: [1, 2, 3, 4, 5], hours: [16, 17, 18, 19, 20], period: 'on-peak' },
      { months: [11, 12, 1, 2, 3], weekdays: [1, 2, 3, 4, 5], hours: [0, 1, 2, 3, 4, 5, 6, 7, 8], period: 'super-off-peak' },
      { months: [11, 12, 1, 2, 3], weekdays: [0, 6], hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], period: 'super-off-peak' },
    ],
    rates: { nonTouDemand: 0, onPeakDemand: 16.0, onPeakEnergy: 0.38, offPeakEnergy: 0.16, superOffPeakEnergy: 0.08 },
  },
  'sdge-al': {
    onPeakHrs: 5,
    schedule: [
      { months: [5, 6, 7, 8, 9, 10], weekdays: [1, 2, 3, 4, 5], hours: [16, 17, 18, 19, 20], period: 'on-peak' },
      { months: [11, 12, 1, 2, 3, 4], weekdays: [1, 2, 3, 4, 5], hours: [16, 17, 18, 19, 20], period: 'on-peak' },
      { months: [11, 12, 1, 2, 3, 4], weekdays: [1, 2, 3, 4, 5], hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], period: 'super-off-peak' },
      { months: [11, 12, 1, 2, 3, 4], weekdays: [0, 6], hours: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23], period: 'super-off-peak' },
    ],
    rates: { nonTouDemand: 8.0, onPeakDemand: 22.5, onPeakEnergy: 0.54, offPeakEnergy: 0.22, superOffPeakEnergy: 0.1 },
  },
  'sce-gs2e': {
    onPeakHrs: 5,
    schedule: [
      { months: [6, 7, 8, 9], weekdays: [1, 2, 3, 4, 5], hours: [16, 17, 18, 19, 20], period: 'on-peak' },
      { months: [1, 2, 3, 4, 5, 10, 11, 12], weekdays: [1, 2, 3, 4, 5], hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], period: 'on-peak' },
    ],
    rates: { nonTouDemand: 6.0, onPeakDemand: 18.0, onPeakEnergy: 0.44, offPeakEnergy: 0.19, superOffPeakEnergy: 0.0 },
  },
};

const H = { DCM_THRESHOLD: 8.0, ARB_THRESHOLD: 0.08, SIZING_BAND: 0.2, PV_NAMEPLATE: 1000 };

const S = {
  loadRows: [],
  pvRows: [],
  pvKwdc: 500,
  solarOn: false,
  tariffKey: 'pge-b19',
  rates: { ...TARIFFS['pge-b19'].rates },
  covPctile: 80,
  monthlyChart: null,
  dailyStats: null,
  heatmapGrid: null,
  heatmapMaxKw: 0,
  hmCase: 'baseline', // 'baseline' | 'post-solar'
  hmPvKwdc: 500, // heatmap-specific solar size
  hmScheme: 'plasma', // color scheme key
  hmShowOnPeak: false, // on-peak overlay toggle
};

// ── Color schemes ─────────────────────────────────────────
const SCHEMES = {
  plasma: [
    [13, 8, 135],
    [75, 3, 161],
    [126, 21, 168],
    [168, 34, 150],
    [203, 71, 120],
    [229, 107, 93],
    [248, 148, 65],
    [253, 195, 40],
    [240, 249, 33],
  ],
  viridis: [
    [68, 1, 84],
    [72, 40, 120],
    [62, 83, 160],
    [49, 120, 157],
    [38, 154, 142],
    [53, 183, 121],
    [109, 205, 89],
    [180, 222, 44],
    [253, 231, 37],
  ],
  hot: [
    [0, 0, 0],
    [51, 0, 0],
    [102, 0, 0],
    [153, 0, 0],
    [204, 0, 0],
    [255, 51, 0],
    [255, 153, 0],
    [255, 230, 0],
    [255, 255, 255],
  ],
  reds: [
    [255, 245, 240],
    [254, 224, 210],
    [252, 187, 161],
    [252, 146, 114],
    [251, 106, 74],
    [239, 59, 44],
    [203, 24, 29],
    [165, 15, 21],
    [103, 0, 13],
  ],
  blues: [
    [247, 251, 255],
    [222, 235, 247],
    [198, 219, 239],
    [158, 202, 225],
    [107, 174, 214],
    [66, 146, 198],
    [33, 113, 181],
    [8, 81, 156],
    [8, 48, 107],
  ],
  greens: [
    [247, 252, 245],
    [229, 245, 224],
    [199, 233, 192],
    [161, 217, 155],
    [116, 196, 118],
    [65, 171, 93],
    [35, 139, 69],
    [0, 109, 44],
    [0, 68, 27],
  ],
};

function schemeRGB(t, scheme) {
  const s = SCHEMES[scheme] || SCHEMES.plasma;
  const sv = t * (s.length - 1);
  const i = Math.min(Math.floor(sv), s.length - 2);
  const f = sv - i;
  return s[i].map((a, j) => Math.round(a + (s[i + 1][j] - a) * f));
}

function schemeGradientCSS(scheme) {
  const s = SCHEMES[scheme] || SCHEMES.plasma;
  const stops = s.map((c, i) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round((i / (s.length - 1)) * 100)}%`);
  return `linear-gradient(to top, ${stops.join(', ')})`;
}

// ── CSV utils ─────────────────────────────────────────────
function parseDate(s) {
  s = s.trim();
  if (/^\d{4}-/.test(s)) return new Date(s.replace(' ', 'T'));
  const m = s.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (m) {
    let y = +m[3];
    if (y < 100) y += y < 50 ? 2000 : 1900;
    return new Date(y, +m[1] - 1, +m[2], +m[4], +m[5]);
  }
  return new Date(s);
}

async function fetchCSV(p) {
  const res = await fetch(p);
  if (!res.ok) throw new Error('Cannot load ' + p);
  const t = await res.text();
  return new Promise((ok, er) => Papa.parse(t, { header: false, skipEmptyLines: true, complete: (r) => ok(r.data), error: er }));
}

function parseRows(rows) {
  const s = Number.isNaN(Number.parseFloat(rows[0][1])) ? 1 : 0;
  return rows
    .slice(s)
    .map((r) => ({ ts: parseDate(r[0]), kw: Number.parseFloat(r[1]) || 0 }))
    .filter((r) => !Number.isNaN(r.ts.getTime()));
}

// ── PV ────────────────────────────────────────────────────
// Key by month-day-hour (year-agnostic) so PV profiles from any calendar year
// can be applied to load data from a different year.
function pvKey(ts) {
  return `${ts.getMonth()}-${ts.getDate()}-${ts.getHours()}`;
}

function buildPVMap(rows, scale) {
  const m = new Map();
  for (const r of rows) m.set(pvKey(r.ts), r.kw * scale);
  return m;
}

function pvAt(m, ts) {
  return m.get(pvKey(ts)) || 0;
}

// ── TOU classify ─────────────────────────────────────────
function classify(ts, sch) {
  const mo = ts.getMonth() + 1,
    wd = ts.getDay(),
    hr = ts.getHours();
  for (const r of sch) if (r.months.includes(mo) && r.weekdays.includes(wd) && r.hours.includes(hr)) return r.period;
  return 'off-peak';
}

// ── Per-day aggregation ───────────────────────────────────
function computeDailyStats(loadRows, pvMap, solarOn, schedule) {
  const days = {};
  for (const r of loadRows) {
    const dk = r.ts.toDateString();
    if (!days[dk]) days[dk] = { peakKw: 0, onPeakKwh: 0, onPeakPts: 0 };
    const kw = solarOn ? Math.max(0, r.kw - pvAt(pvMap, r.ts)) : r.kw;
    const period = classify(r.ts, schedule);
    if (kw > days[dk].peakKw) days[dk].peakKw = kw;
    if (period === 'on-peak') {
      days[dk].onPeakKwh += kw * 0.25;
      days[dk].onPeakPts++;
    }
  }
  return Object.values(days);
}

// ── Monthly aggregation ───────────────────────────────────
function computeMonthly(loadRows, pvMap, solarOn, schedule) {
  const bkt = {};
  for (const r of loadRows) {
    const k = `${r.ts.getFullYear()}-${String(r.ts.getMonth() + 1).padStart(2, '0')}`;
    if (!bkt[k]) bkt[k] = [];
    bkt[k].push(solarOn ? Math.max(0, r.kw - pvAt(pvMap, r.ts)) : r.kw);
  }
  return Object.entries(bkt)
    .sort()
    .map(([key, vals]) => {
      const mo = parseInt(key.split('-')[1]);
      return { mo, maxKw: Math.max(...vals), avgKw: vals.reduce((a, b) => a + b, 0) / vals.length };
    });
}

// ── Percentile helper ─────────────────────────────────────
function pctile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
  return sorted[idx];
}

// ── Heuristics ────────────────────────────────────────────
function computeSizing(dailyStats, rates, covPctile, tariff) {
  const peaks = dailyStats.map((d) => d.peakKw);
  const onPeakKwhs = dailyStats.filter((d) => d.onPeakPts > 0).map((d) => d.onPeakKwh);
  const opHrs = tariff.onPeakHrs;

  // DCM
  const dcmPeakKw = pctile(peaks, covPctile);
  const dcmEnergyKwh = dcmPeakKw * opHrs;

  // TOU Arb
  const arbEnergyKwh = onPeakKwhs.length ? pctile(onPeakKwhs, covPctile) : 0;
  const arbPowerKw = opHrs > 0 ? arbEnergyKwh / opHrs : 0;

  const spread = rates.onPeakEnergy - Math.min(rates.offPeakEnergy, rates.superOffPeakEnergy || rates.offPeakEnergy);

  const top3 = [...dailyStats].sort((a, b) => b.peakKw - a.peakKw).slice(0, 3);

  return {
    dcm: {
      powerKw: Math.round(dcmPeakKw),
      energyKwh: Math.round(dcmEnergyKwh),
      minPower: Math.round(dcmPeakKw * (1 - H.SIZING_BAND)),
      maxPower: Math.round(dcmPeakKw * (1 + H.SIZING_BAND)),
      minEnergy: Math.round(dcmEnergyKwh * (1 - H.SIZING_BAND)),
      maxEnergy: Math.round(dcmEnergyKwh * (1 + H.SIZING_BAND)),
      viable: rates.onPeakDemand >= H.DCM_THRESHOLD,
      top3Peaks: top3.map((d) => Math.round(d.peakKw)),
    },
    arb: {
      energyKwh: Math.round(arbEnergyKwh),
      powerKw: Math.round(arbPowerKw),
      minEnergy: Math.round(arbEnergyKwh * (1 - H.SIZING_BAND)),
      maxEnergy: Math.round(arbEnergyKwh * (1 + H.SIZING_BAND)),
      minPower: Math.round(arbPowerKw * (1 - H.SIZING_BAND)),
      maxPower: Math.round(arbPowerKw * (1 + H.SIZING_BAND)),
      viable: spread >= H.ARB_THRESHOLD,
      spread: +spread.toFixed(3),
    },
    maxKw: pctile(peaks, 99),
    avgKw: peaks.reduce((a, b) => a + b, 0) / peaks.length,
  };
}

// ── Plasma color scale ────────────────────────────────────
function plasmaRGB(t) {
  const s = [
    [13, 8, 135],
    [75, 3, 161],
    [126, 21, 168],
    [168, 34, 150],
    [203, 71, 120],
    [229, 107, 93],
    [248, 148, 65],
    [253, 195, 40],
    [240, 249, 33],
  ];
  const sv = t * (s.length - 1),
    i = Math.min(Math.floor(sv), s.length - 2),
    f = sv - i;
  return s[i].map((a, j) => Math.round(a + (s[i + 1][j] - a) * f));
}

// ── Render: tariff tiles ──────────────────────────────────
function renderTariffTiles() {
  const r = S.rates;
  const spread = r.onPeakEnergy - Math.min(r.offPeakEnergy, r.superOffPeakEnergy || r.offPeakEnergy);
  const items = [
    { label: 'Non-TOU Demand', val: `$${r.nonTouDemand.toFixed(2)}/kW` },
    { label: 'On-Peak Demand', val: `$${r.onPeakDemand.toFixed(2)}/kW`, cls: r.onPeakDemand >= H.DCM_THRESHOLD ? 'good' : '' },
    { label: 'On-Peak Energy', val: `$${r.onPeakEnergy.toFixed(3)}/kWh` },
    { label: 'Off-Peak Energy', val: `$${r.offPeakEnergy.toFixed(3)}/kWh` },
    { label: 'Super Off-Peak', val: r.superOffPeakEnergy > 0 ? `$${r.superOffPeakEnergy.toFixed(3)}/kWh` : '—' },
    { label: 'Arbitrage Spread', val: `$${spread.toFixed(3)}/kWh`, sub: spread >= H.ARB_THRESHOLD ? '✓ viable' : '✗ below threshold', cls: spread >= H.ARB_THRESHOLD ? 'good' : 'weak' },
  ];
  document.getElementById('tariff-tiles').innerHTML = items
    .map(
      (it) => `
    <div class="tstat">
      <div class="tstat-label">${it.label}</div>
      <div class="tstat-value ${it.cls || ''}">${it.val}</div>
      ${it.sub ? `<div class="tstat-sub ${it.cls || ''}">${it.sub}</div>` : ''}
    </div>`,
    )
    .join('');
}

// ── Toggle Edit Rates panel ──────────────────────────────
function toggleRatesEdit() {
  const panel = document.getElementById('rates-edit-panel');
  const btn = document.getElementById('edit-rates-btn');
  const open = panel.style.display === 'none';
  panel.style.display = open ? '' : 'none';
  btn.textContent = open ? 'Done' : 'Edit Rates';
  btn.classList.toggle('active', open);
}

// ── Render: load overview stats ───────────────────────────
function renderLoadStats(sizing, solarOn) {
  const lbl = solarOn ? 'Net ' : '';
  document.getElementById('load-stats').innerHTML = [
    { label: `Max ${lbl}Load`, val: `${Math.round(sizing.maxKw).toLocaleString()} kW` },
    { label: `Avg Peak ${lbl}Load`, val: `${Math.round(sizing.avgKw).toLocaleString()} kW` },
    { label: 'DCM Target Power', val: `${sizing.dcm.powerKw.toLocaleString()} kW`, sub: 'demand shaving' },
    { label: 'Arb Target Energy', val: `${sizing.arb.energyKwh.toLocaleString()} kWh`, sub: 'on-peak offset' },
  ]
    .map(
      (s) => `
    <div class="stat">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value">${s.val}</div>
      ${s.sub ? `<div class="stat-sub">${s.sub}</div>` : ''}
    </div>`,
    )
    .join('');
}

// ── Render: DCM card ──────────────────────────────────────
function renderDCM(dcm, rates) {
  const el = document.getElementById('dcm-content');
  if (!dcm.viable) {
    el.innerHTML = `<div class="sz-na">On-peak demand charge ($${rates.onPeakDemand}/kW) is below the $${H.DCM_THRESHOLD}/kW viability threshold. DCM is unlikely to justify storage costs at this site.</div>`;
    document.getElementById('card-dcm').style.opacity = '0.55';
    return;
  }
  document.getElementById('card-dcm').style.opacity = '1';
  el.innerHTML = `
    <div class="sz-main">
      <div class="sz-stat">
        <div class="sz-label">Target Power</div>
        <div class="sz-value">${dcm.powerKw.toLocaleString()} kW</div>
        <div class="sz-range">Range: ${dcm.minPower}–${dcm.maxPower} kW</div>
      </div>
      <div class="sz-stat">
        <div class="sz-label">Target Energy</div>
        <div class="sz-value">${dcm.energyKwh.toLocaleString()} kWh</div>
        <div class="sz-range">Range: ${dcm.minEnergy}–${dcm.maxEnergy} kWh</div>
      </div>
    </div>
    <div class="sz-context">
      <strong>3 highest daily peaks:</strong>
      ${dcm.top3Peaks.map((p, i) => ` #${i + 1}: ${p.toLocaleString()} kW`).join('·')}
      &nbsp;—&nbsp;sizing to cover the <strong>${document.getElementById('cov-display').textContent}</strong> of days.
    </div>`;
}

// ── Render: Arb card ──────────────────────────────────────
function renderArb(arb, rates) {
  const el = document.getElementById('arb-content');
  if (!arb.viable) {
    el.innerHTML = `<div class="sz-na">Arbitrage spread ($${arb.spread}/kWh) is below the $${H.ARB_THRESHOLD}/kWh round-trip threshold. TOU arbitrage is unlikely to be profitable at current rates.</div>`;
    document.getElementById('card-arb').style.opacity = '0.55';
    return;
  }
  document.getElementById('card-arb').style.opacity = '1';
  el.innerHTML = `
    <div class="sz-main">
      <div class="sz-stat">
        <div class="sz-label">Target Power</div>
        <div class="sz-value">${arb.powerKw.toLocaleString()} kW</div>
        <div class="sz-range">Range: ${arb.minPower}–${arb.maxPower} kW</div>
      </div>
      <div class="sz-stat">
        <div class="sz-label">Target Energy</div>
        <div class="sz-value">${arb.energyKwh.toLocaleString()} kWh</div>
        <div class="sz-range">Range: ${arb.minEnergy}–${arb.maxEnergy} kWh</div>
      </div>
    </div>
    <div class="sz-context">
      Spread of <strong>$${arb.spread}/kWh</strong> over round-trip losses.
      Sized to offset on-peak consumption on <strong>${document.getElementById('cov-display').textContent}</strong> of days.
    </div>`;
}

// ── Render: heatmap ───────────────────────────────────────
function renderHeatmap(loadRows) {
  const HOURS = 24;

  // Determine solar for heatmap view independently of global solarOn
  const hmSolar = S.hmCase === 'post-solar' && S.pvRows.length > 0;
  const hmPvMap = hmSolar ? buildPVMap(S.pvRows, S.hmPvKwdc / H.PV_NAMEPLATE) : new Map();

  // Compute actual date range using local midnight (avoids UTC-vs-local day boundary bugs)
  const firstDay = new Date(loadRows[0].ts);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(loadRows[loadRows.length - 1].ts);
  lastDay.setHours(0, 0, 0, 0);
  const minDayMs = firstDay.getTime();
  const maxDayMs = lastDay.getTime();
  const DAYS = Math.round((maxDayMs - minDayMs) / 86400000) + 1;
  const minDay = firstDay;

  const grid = {};
  for (const r of loadRows) {
    const localDay = new Date(r.ts);
    localDay.setHours(0, 0, 0, 0);
    const doy = Math.round((localDay.getTime() - minDayMs) / 86400000);
    if (doy < 0 || doy >= DAYS) continue;
    const hr = r.ts.getHours();
    const kw = hmSolar ? r.kw - pvAt(hmPvMap, r.ts) : r.kw;
    const k = doy * HOURS + hr;
    if (!grid[k]) grid[k] = { sum: 0, n: 0 };
    grid[k].sum += kw;
    grid[k].n++;
  }
  // Compute range from cell averages (allows negatives)
  let minKw = Infinity,
    maxKw = -Infinity;
  for (const cell of Object.values(grid)) {
    const v = cell.sum / cell.n;
    if (v < minKw) minKw = v;
    if (v > maxKw) maxKw = v;
  }
  if (minKw === Infinity) {
    minKw = 0;
    maxKw = 0;
  }
  S.heatmapGrid = { grid, minKw, maxKw, minDayMs };
  S.heatmapMaxKw = maxKw;
  S.heatmapMinKw = minKw;

  const canvas = document.getElementById('heatmap-canvas');
  const containerW = canvas.parentElement.offsetWidth || 730;
  const CW = Math.max(1, Math.floor(containerW / DAYS));
  const CH = 10;
  const canvasW = DAYS * CW;
  const canvasH = HOURS * CH;
  canvas.width = canvasW;
  canvas.height = canvasH;
  // Lock CSS height so width:100% doesn't distort the aspect ratio
  canvas.style.height = `${canvasH}px`;
  canvas._CW = CW;
  canvas._CH = CH;
  canvas._DAYS = DAYS;
  canvas._HOURS = HOURS;
  canvas._minDayMs = minDayMs;

  const schedule = TARIFFS[S.tariffKey].schedule;
  const ctx = canvas.getContext('2d');

  // Draw load pixels — normalize across full range (supports negatives)
  const kwRange = maxKw - minKw || 1;
  for (let d = 0; d < DAYS; d++) {
    for (let h = 0; h < HOURS; h++) {
      const cell = grid[d * HOURS + h];
      const kw = cell ? cell.sum / cell.n : minKw;
      const t = (kw - minKw) / kwRange;
      const [r, g, b] = schemeRGB(t, S.hmScheme);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(d * CW, h * CH, CW, CH);
    }
  }

  // Draw TOU on-peak overlay (optional)
  if (S.hmShowOnPeak) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.69)';
    for (let d = 0; d < DAYS; d++) {
      const dayDate = new Date(minDayMs + d * 86400000);
      for (let h = 0; h < HOURS; h++) {
        const ts = new Date(dayDate);
        ts.setHours(h, 0, 0, 0);
        if (classify(ts, schedule) === 'on-peak') {
          ctx.fillRect(d * CW, h * CH, CW, CH);
        }
      }
    }
  }

  // Y-axis — with rotated "Time of Day" label
  const yEl = document.getElementById('hm-yaxis');
  yEl.style.cssText = `position:relative;width:52px;flex-shrink:0;height:${HOURS * CH}px`;
  yEl.innerHTML = '';
  // Rotated axis label
  const yLbl = document.createElement('span');
  yLbl.textContent = 'Time of Day';
  yLbl.style.cssText = `position:absolute;left:10px;top:50%;transform:translateX(-50%) translateY(-50%) rotate(-90deg);transform-origin:center center;font-size:9px;font-weight:600;color:var(--gray-400);letter-spacing:0.05em;white-space:nowrap`;
  yEl.appendChild(yLbl);
  [0, 3, 6, 9, 12, 15, 18, 21].forEach((h) => {
    const sp = document.createElement('span');
    sp.textContent = `${String(h).padStart(2, '0')}:00`;
    sp.style.cssText = `position:absolute;top:${h * CH - 4}px;right:2px;font-size:9px;color:var(--gray-400)`;
    yEl.appendChild(sp);
  });

  // X-axis — pixel positions, clamp first/last labels to stay in bounds
  const xEl = document.getElementById('hm-xaxis');
  xEl.style.cssText = 'position:relative;height:16px;margin-top:4px;width:100%';
  xEl.innerHTML = '';
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let cur = new Date(minDay.getFullYear(), minDay.getMonth(), 1);
  const endMs = maxDayMs;
  while (cur.getTime() <= endMs) {
    const dayOffset = Math.round((cur.getTime() - minDayMs) / 86400000);
    if (dayOffset >= 0 && dayOffset < DAYS) {
      const sp = document.createElement('span');
      const yearSuffix = cur.getFullYear() !== minDay.getFullYear() ? ` '${String(cur.getFullYear()).slice(2)}` : '';
      sp.textContent = MO[cur.getMonth()] + yearSuffix;
      const pct = dayOffset / DAYS;
      // Clamp: first label anchors left, last anchors right, others center
      const anchor = pct < 0.04 ? 'translateX(0)' : pct > 0.94 ? 'translateX(-100%)' : 'translateX(-50%)';
      sp.style.cssText = `position:absolute;left:${pct * 100}%;font-size:9px;color:var(--gray-400);transform:${anchor};white-space:nowrap`;
      xEl.appendChild(sp);
    }
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  // Legend — update gradient and labels
  const gradEl = document.getElementById('hm-gradient-v');
  gradEl.style.background = schemeGradientCSS(S.hmScheme);
  gradEl.style.minHeight = `${HOURS * CH}px`;
  document.getElementById('hm-max-lbl').textContent = `${Math.round(maxKw).toLocaleString()} kW`;
  document.getElementById('hm-min-lbl').textContent = `${Math.round(minKw).toLocaleString()} kW`;

  // On-peak toggle button state — only toggle this button, not the case buttons
  const opBtn = document.getElementById('hm-onpeak-btn');
  if (opBtn) opBtn.classList.toggle('active', S.hmShowOnPeak);

  // Case buttons — only update buttons with data-case
  document.querySelectorAll('.hm-case-btn[data-case]').forEach((b) => b.classList.toggle('active', b.dataset.case === S.hmCase));

  const caseLabel = hmSolar ? 'Post-Solar Net Load' : 'Baseline Load';
  document.getElementById('heatmap-title').textContent = `${caseLabel} Heatmap — Date × Hour of Day`;

  // Sync hm-pv controls visibility
  document.getElementById('hm-solar-controls').style.display = S.hmCase === 'post-solar' ? 'flex' : 'none';
}

// ── Render: monthly chart ─────────────────────────────────
function renderMonthlyChart(monthly, dcmTarget) {
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = monthly.map((m) => MO[m.mo - 1]);
  const cfg = {
    data: {
      labels,
      datasets: [
        { type: 'bar', label: 'Max Load (kW)', data: monthly.map((m) => Math.round(m.maxKw)), backgroundColor: '#9CA3AF', borderColor: '#6B7280', borderWidth: 1, borderRadius: 3, yAxisID: 'y' },
        { type: 'bar', label: 'Avg Load (kW)', data: monthly.map((m) => Math.round(m.avgKw)), backgroundColor: '#D1D5DB', borderColor: '#9CA3AF', borderWidth: 1, borderRadius: 3, yAxisID: 'y' },
        {
          type: 'line',
          label: `DCM Peak Target: ${dcmTarget} kW`,
          data: Array(labels.length).fill(dcmTarget),
          borderColor: '#166534',
          borderWidth: 2,
          borderDash: [5, 4],
          pointRadius: 0,
          yAxisID: 'y',
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 12 } }, tooltip: { mode: 'index' } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#E5E7EB' }, title: { display: true, text: 'kW', font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } }, grid: { color: '#E5E7EB' } },
      },
    },
  };
  if (S.monthlyChart) {
    S.monthlyChart.destroy();
    S.monthlyChart = null;
  }
  S.monthlyChart = new Chart(document.getElementById('monthly-chart').getContext('2d'), cfg);
}

// ── Main compute ──────────────────────────────────────────
function compute() {
  if (!S.loadRows.length) return;
  const solarOn = S.solarOn && S.pvRows.length > 0;
  const pvMap = solarOn ? buildPVMap(S.pvRows, S.pvKwdc / H.PV_NAMEPLATE) : new Map();
  const tariff = TARIFFS[S.tariffKey];

  renderTariffTiles();
  const daily = computeDailyStats(S.loadRows, pvMap, solarOn, tariff.schedule);
  S.dailyStats = daily;
  const monthly = computeMonthly(S.loadRows, pvMap, solarOn, tariff.schedule);
  const sizing = computeSizing(daily, S.rates, S.covPctile, tariff);

  renderLoadStats(sizing, solarOn);
  renderHeatmap(S.loadRows);
  renderDCM(sizing.dcm, S.rates);
  renderArb(sizing.arb, S.rates);
  renderMonthlyChart(monthly, sizing.dcm.powerKw);
}

// ── Partial update (coverage slider / rate edits) ─────────
function recomputeSizing() {
  if (!S.dailyStats) return;
  const tariff = TARIFFS[S.tariffKey];
  const sizing = computeSizing(S.dailyStats, S.rates, S.covPctile, tariff);
  renderLoadStats(sizing, S.solarOn && S.pvRows.length > 0);
  renderDCM(sizing.dcm, S.rates);
  renderArb(sizing.arb, S.rates);
  if (S.monthlyChart) {
    S.monthlyChart.data.datasets[2].data = Array(S.monthlyChart.data.labels.length).fill(sizing.dcm.powerKw);
    S.monthlyChart.data.datasets[2].label = `DCM Peak Target: ${sizing.dcm.powerKw} kW`;
    S.monthlyChart.update('none');
  }
}

// ── Heatmap tooltip ───────────────────────────────────────
(function () {
  const tip = document.getElementById('hm-tooltip');
  document.addEventListener('mousemove', (e) => {
    const canvas = document.getElementById('heatmap-canvas');
    if (!canvas._CW) {
      tip.style.display = 'none';
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left,
      y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      tip.style.display = 'none';
      return;
    }
    const day = Math.floor((x / rect.width) * canvas._DAYS);
    const hour = Math.floor((y / rect.height) * canvas._HOURS);
    if (day < 0 || day >= canvas._DAYS || hour < 0 || hour >= canvas._HOURS) {
      tip.style.display = 'none';
      return;
    }
    const minDayMs = canvas._minDayMs || new Date(new Date().getFullYear(), 0, 1).getTime();
    const dt = new Date(minDayMs + day * 86400000);
    dt.setHours(hour, 0, 0, 0);
    const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DA = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const lbl = `${DA[dt.getDay()]} ${MO[dt.getMonth()]} ${dt.getDate()}, ${String(hour).padStart(2, '0')}:00`;
    const sched = TARIFFS[S.tariffKey].schedule;
    const period = classify(dt, sched);
    const cell = S.heatmapGrid && S.heatmapGrid.grid[day * 24 + hour];
    const minKwT = S.heatmapMinKw || 0;
    const maxKwT = S.heatmapMaxKw || 1;
    const kw = cell ? cell.sum / cell.n : minKwT;
    const t = maxKwT !== minKwT ? (kw - minKwT) / (maxKwT - minKwT) : 0;
    const [r, g, b] = schemeRGB(t, S.hmScheme);
    let periodLabel = '';
    if (period === 'on-peak') periodLabel = '<span style="color:#fff;font-weight:600"> · On-Peak</span>';
    else if (period === 'super-off-peak') periodLabel = '<span style="color:#9CA3AF"> · Super Off-Peak</span>';
    tip.innerHTML = `<div>${lbl}${periodLabel}</div><div style="margin-top:3px;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:rgb(${r},${g},${b})"></span><strong>${Math.round(kw).toLocaleString()} kW</strong></div>`;
    tip.style.display = 'block';
    tip.style.left = `${e.clientX + 14}px`;
    tip.style.top = `${e.clientY - tip.offsetHeight - 12}px`;
  });
  document.addEventListener('mouseleave', () => {
    document.getElementById('hm-tooltip').style.display = 'none';
  });
})();

// ── Accordion ─────────────────────────────────────────────
let accordionOpen = false,
  firstOpen = true;

async function toggleAccordion() {
  accordionOpen = !accordionOpen;
  document.getElementById('accordion-body').classList.toggle('open', accordionOpen);
  document.getElementById('accordion-chevron').classList.toggle('open', accordionOpen);
  if (accordionOpen && firstOpen) {
    firstOpen = false;
    await loadScenario('load_mall_15min_kW_2col_1300kW.csv');
  }
}

// Auto-open accordion on load
toggleAccordion();

// ── Data loading ──────────────────────────────────────────
async function loadScenario(file) {
  document.getElementById('accordion-loading').style.display = '';
  ['section-coverage', 'section-load', 'section-sizing', 'section-monthly'].forEach((id) => (document.getElementById(id).style.display = 'none'));
  if (S.monthlyChart) {
    S.monthlyChart.destroy();
    S.monthlyChart = null;
  }
  try {
    S.loadRows = parseRows(await fetchCSV('./data/' + file));
    ['section-coverage', 'section-load', 'section-sizing', 'section-monthly'].forEach((id) => (document.getElementById(id).style.display = ''));
    document.getElementById('accordion-loading').style.display = 'none';
    compute();
  } catch (e) {
    document.getElementById('accordion-loading').textContent = 'Error: ' + e.message;
  }
}

async function loadPV() {
  if (S.pvRows.length) return;
  try {
    S.pvRows = parseRows(await fetchCSV('./data/pv_2col_60min_1000kW.csv'));
  } catch (e) {
    console.warn('PV load failed:', e.message);
  }
}

// ── Events ────────────────────────────────────────────────
document.querySelectorAll('#scenario-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#scenario-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    if (accordionOpen) loadScenario(chip.dataset.file);
    else {
      S.loadRows = [];
      S.dailyStats = null;
    }
  });
});

document.getElementById('solar-toggle').addEventListener('change', async function () {
  S.solarOn = this.checked;
  document.getElementById('solar-size-field').style.display = this.checked ? '' : 'none';
  if (this.checked) await loadPV();
  syncHmCaseToggle();
  if (S.loadRows.length) compute();
});

document.getElementById('solar-kw').addEventListener('input', function () {
  S.pvKwdc = Number.parseFloat(this.value) || 500;
  if (S.loadRows.length) compute();
});

document.getElementById('tariff-select').addEventListener('change', function () {
  S.tariffKey = this.value;
  S.rates = { ...TARIFFS[this.value].rates };
  const r = S.rates;
  document.getElementById('r-nontou').value = r.nonTouDemand;
  document.getElementById('r-onpkd').value = r.onPeakDemand;
  document.getElementById('r-onpke').value = r.onPeakEnergy;
  document.getElementById('r-offpke').value = r.offPeakEnergy;
  document.getElementById('r-soffpke').value = r.superOffPeakEnergy;
  renderTariffTiles();
  if (S.loadRows.length) compute();
  else renderTariffTiles();
});

[
  ['r-nontou', 'nonTouDemand'],
  ['r-onpkd', 'onPeakDemand'],
  ['r-onpke', 'onPeakEnergy'],
  ['r-offpke', 'offPeakEnergy'],
  ['r-soffpke', 'superOffPeakEnergy'],
].forEach(([id, key]) => {
  document.getElementById(id).addEventListener('input', function () {
    S.rates[key] = Number.parseFloat(this.value) || 0;
    renderTariffTiles();
    if (S.dailyStats) recomputeSizing();
  });
});

document.getElementById('cov-range').addEventListener('input', function () {
  S.covPctile = +this.value;
  document.getElementById('cov-display').textContent = this.value + '%';
  recomputeSizing();
});

// ── Heatmap controls ──────────────────────────────────────
function syncHmCaseToggle() {
  const postSolarBtn = document.querySelector('.hm-case-btn[data-case="post-solar"]');
  if (!postSolarBtn) return;
  const canShowSolar = S.solarOn && S.pvRows.length > 0;
  postSolarBtn.style.display = canShowSolar ? '' : 'none';
  // If solar was just disabled and we're in post-solar view, revert to baseline
  if (!canShowSolar && S.hmCase === 'post-solar') {
    S.hmCase = 'baseline';
    document.querySelectorAll('.hm-case-btn').forEach((b) => b.classList.toggle('active', b.dataset.case === S.hmCase));
    document.getElementById('hm-solar-controls').style.display = 'none';
    if (S.loadRows.length) renderHeatmap(S.loadRows);
  }
}

document.querySelectorAll('.hm-case-btn[data-case]').forEach((btn) => {
  btn.addEventListener('click', () => {
    S.hmCase = btn.dataset.case;
    // Sync heatmap solar slider to match global solar size when switching to post-solar
    if (S.hmCase === 'post-solar') {
      S.hmPvKwdc = S.pvKwdc;
      const slider = document.getElementById('hm-pv-kwdc');
      slider.value = S.hmPvKwdc;
      document.getElementById('hm-pv-kwdc-val').textContent = Math.round(S.hmPvKwdc).toLocaleString() + ' kWdc';
    }
    document.querySelectorAll('.hm-case-btn[data-case]').forEach((b) => b.classList.toggle('active', b.dataset.case === S.hmCase));
    if (S.loadRows.length) renderHeatmap(S.loadRows);
  });
});

document.getElementById('hm-pv-kwdc').addEventListener('input', function () {
  S.hmPvKwdc = Number.parseFloat(this.value) || 500;
  document.getElementById('hm-pv-kwdc-val').textContent = Math.round(S.hmPvKwdc).toLocaleString() + ' kWdc';
  if (S.loadRows.length) renderHeatmap(S.loadRows);
});

document.getElementById('hm-scheme').addEventListener('change', function () {
  S.hmScheme = this.value;
  if (S.loadRows.length) renderHeatmap(S.loadRows);
});

document.getElementById('hm-onpeak-btn').addEventListener('click', function () {
  S.hmShowOnPeak = !S.hmShowOnPeak;
  this.classList.toggle('active', S.hmShowOnPeak);
  // Only re-draw the overlay — don't call full renderHeatmap to avoid flickering controls
  // Re-render is needed to repaint canvas; use stored grid
  if (S.loadRows.length) renderHeatmap(S.loadRows);
});

// ── Init ──────────────────────────────────────────────────
renderTariffTiles();
syncHmCaseToggle();
loadPV();
