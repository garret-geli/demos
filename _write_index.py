html = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Storage Sizing — Stage 1 Heuristics</title>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
<style>
:root{
  --blue:#2764DE;--blue-lt:#EBF0FD;--blue-bd:#c7d9f7;
  --gray-50:#F9FAFB;--gray-100:#F3F4F6;--gray-200:#E5E7EB;
  --gray-400:#9CA3AF;--gray-600:#4B5563;--gray-700:#374151;--gray-900:#111827;
  --green:#166534;--green-lt:#DCFCE7;--green-bd:#bbf7d0;
  --radius:8px;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);font-size:14px;color:var(--gray-900);background:var(--gray-100)}

header{background:#fff;border-bottom:1px solid var(--gray-200);padding:10px 20px;display:flex;align-items:center;gap:10px}
.logo{width:10px;height:10px;border-radius:50%;background:var(--blue)}
header h1{font-size:14px;font-weight:600}
header small{font-size:11px;color:var(--gray-400);margin-left:auto}

.page{max-width:1100px;margin:0 auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}

.card{background:#fff;border:1px solid var(--gray-200);border-radius:var(--radius);padding:16px}
.card-head{display:flex;align-items:center;gap:6px;margin-bottom:12px}
.card-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--gray-400)}

.info-wrap{position:relative;display:inline-flex;align-items:center}
.info-icon{width:16px;height:16px;border-radius:50%;background:var(--gray-200);color:var(--gray-600);font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;cursor:default;user-select:none;flex-shrink:0}
.info-tip{display:none;position:absolute;left:22px;bottom:0;width:310px;background:var(--gray-900);color:#fff;font-size:12px;line-height:1.55;padding:10px 12px;border-radius:6px;z-index:100;pointer-events:none}
.info-tip ul{padding-left:14px}
.info-tip li{margin-bottom:4px}
.info-wrap:hover .info-tip{display:block}

.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{padding:5px 14px;border-radius:20px;border:1px solid var(--gray-200);background:#fff;cursor:pointer;font-size:13px;color:var(--gray-600)}
.chip.active{background:var(--blue);border-color:var(--blue);color:#fff;font-weight:600}

.field{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.field:last-child{margin-bottom:0}
.field label{font-size:12px;color:var(--gray-600);font-weight:500}
.field select,.field input[type=number]{padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;color:var(--gray-900);background:#fff;width:100%}
.toggle-row{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--gray-700);margin-bottom:10px}
.toggle-row input[type=checkbox]{accent-color:var(--blue);width:15px;height:15px}

.tariff-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px}
.tstat{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;padding:8px 10px}
.tstat-label{font-size:10px;color:var(--gray-400);font-weight:500;line-height:1.2}
.tstat-value{font-size:15px;font-weight:700;margin-top:2px}
.tstat-sub{font-size:10px;margin-top:1px}
.good{color:var(--green)}
.weak{color:var(--gray-400)}

.expand-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--blue-lt);border:1px solid var(--blue-bd);border-radius:var(--radius);cursor:pointer;font-size:13px;font-weight:600;color:var(--blue);width:100%;text-align:left}
.expand-btn:hover{background:#dce8fc}
.expand-chevron{margin-left:auto;font-size:11px;transition:transform .2s}
.expand-chevron.open{transform:rotate(180deg)}
.accordion-body{display:none;flex-direction:column;gap:12px}
.accordion-body.open{display:flex}

.coverage-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:var(--radius)}
.coverage-bar label{font-size:12px;font-weight:600;color:var(--gray-700);white-space:nowrap}
.coverage-bar input[type=range]{accent-color:var(--blue);flex:1;max-width:300px}
.cov-val{font-size:13px;font-weight:700;color:var(--blue);min-width:36px}
.coverage-bar .hint{font-size:11px;color:var(--gray-400)}

.sizing-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.sz-accent-dcm{border-top:3px solid var(--green)}
.sz-accent-arb{border-top:3px solid var(--blue)}
.sz-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:3px 10px;border-radius:12px;margin-bottom:10px}
.sz-badge-dcm{background:var(--green-lt);color:var(--green);border:1px solid var(--green-bd)}
.sz-badge-arb{background:var(--blue-lt);color:var(--blue);border:1px solid var(--blue-bd)}
.sz-main{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.sz-stat{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;padding:10px 12px}
.sz-label{font-size:11px;color:var(--gray-400);font-weight:500}
.sz-value{font-size:18px;font-weight:700;margin-top:2px}
.sz-range{font-size:11px;color:var(--gray-400);margin-top:2px}
.sz-context{font-size:11px;color:var(--gray-600);line-height:1.5;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;padding:8px 10px}
.sz-context strong{color:var(--gray-900)}
.sz-na{font-size:13px;color:var(--gray-400);padding:12px 0}

/* heatmap controls bar */
.hm-controls{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:8px 12px;background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;margin-bottom:10px}
.hm-controls label{font-size:12px;font-weight:500;color:var(--gray-700);white-space:nowrap}
.hm-ctrl-sep{width:1px;height:20px;background:var(--gray-200);flex-shrink:0}
.hm-kw-lbl{font-size:12px;font-weight:700;color:var(--blue);min-width:60px}

/* case toggle pills */
.case-toggle{display:flex;gap:0;border:1px solid var(--gray-200);border-radius:20px;overflow:hidden;flex-shrink:0}
.case-btn{padding:4px 12px;font-size:11px;font-weight:600;cursor:pointer;color:var(--gray-600);background:#fff;border:none;transition:background .15s,color .15s}
.case-btn.active{background:var(--blue);color:#fff}

/* heatmap layout */
.heatmap-outer{display:flex;flex-direction:row;align-items:flex-start}
.heatmap-yaxis{position:relative;width:38px;flex-shrink:0}
.heatmap-main{flex:1;min-width:0}
#heatmap-canvas{width:100%;display:block;border-radius:2px;image-rendering:pixelated;cursor:crosshair}
.heatmap-xaxis{position:relative;height:14px;margin-top:2px}
.heatmap-xaxis span{position:absolute;font-size:9px;color:var(--gray-400);transform:translateX(-50%)}
.hm-legend-right{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;width:30px;margin-left:14px}
.hm-legend-right span{font-size:10px;color:var(--gray-400);white-space:nowrap}
.hm-gradient-v{flex:1;width:14px;min-height:60px;border-radius:4px}

.hm-tou-legend{display:flex;align-items:center;gap:14px;margin-top:8px;font-size:11px;color:var(--gray-600)}
.hm-tou-swatch{display:inline-block;width:16px;height:10px;border-radius:2px;vertical-align:middle;margin-right:3px;border:1px solid rgba(0,0,0,.15)}

.chart-wrap{position:relative;height:200px}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.stat{background:var(--gray-50);border:1px solid var(--gray-200);border-radius:6px;padding:10px 12px}
.stat-label{font-size:11px;color:var(--gray-400);font-weight:500}
.stat-value{font-size:18px;font-weight:700;margin-top:2px}
.stat-sub{font-size:11px;color:var(--gray-400);margin-top:1px}

#hm-tooltip{display:none;position:fixed;background:var(--gray-900);color:#fff;font-size:11px;line-height:1.5;padding:6px 10px;border-radius:6px;pointer-events:none;z-index:200;white-space:nowrap}
.loading{font-size:13px;color:var(--gray-400);text-align:center;padding:20px}

@media(max-width:680px){
  .row-2,.sizing-row{grid-template-columns:1fr}
  .tariff-grid,.stats-row{grid-template-columns:1fr 1fr}
}
</style>
</head>
<body>

<header>
  <div class="logo"></div>
  <h1>Storage Sizing — Stage 1 Heuristics</h1>
  <small>Demo · May 2026</small>
</header>

<div class="page">

<!-- ── Tariff ──────────────────────────────────────────────────── -->
<div class="card">
  <div class="card-head"><div class="card-title">Tariff</div></div>
  <div class="row-2">
    <div>
      <div class="field">
        <label for="tariff-select">Tariff Schedule</label>
        <select id="tariff-select">
          <option value="pge-b19">PG&amp;E B-19-TOU (NEM3)</option>
          <option value="sdge-al">SDG&amp;E AL-TOU-2 (NEM3)</option>
          <option value="sce-gs2e">SCE TOU-GS-2-E (NEM2)</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="field"><label for="r-nontou">Non-TOU Demand ($/kW)</label><input type="number" id="r-nontou" value="0" min="0" step="0.5"/></div>
        <div class="field"><label for="r-onpkd">On-Peak Demand ($/kW)</label><input type="number" id="r-onpkd" value="16.00" min="0" step="0.5"/></div>
        <div class="field"><label for="r-onpke">On-Peak Energy ($/kWh)</label><input type="number" id="r-onpke" value="0.380" min="0" step="0.01"/></div>
        <div class="field"><label for="r-offpke">Off-Peak Energy ($/kWh)</label><input type="number" id="r-offpke" value="0.160" min="0" step="0.01"/></div>
        <div class="field" style="grid-column:1/-1"><label for="r-soffpke">Super Off-Peak Energy ($/kWh) <span style="color:var(--gray-400)">(optional)</span></label><input type="number" id="r-soffpke" value="0.080" min="0" step="0.01"/></div>
      </div>
    </div>
    <div>
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--gray-400);margin-bottom:8px">Summary</div>
      <div class="tariff-grid" id="tariff-tiles"></div>
    </div>
  </div>
</div>

<!-- ── Load Profile + Solar ──────────────────────────────────────── -->
<div class="row-2">
  <div class="card">
    <div class="card-head"><div class="card-title">Load Profile</div></div>
    <div class="chips" id="scenario-chips">
      <div class="chip active" data-file="load_mall_15min_kW_2col_1300kW.csv">Mall</div>
      <div class="chip" data-file="load_office_15min_kWh_2col_1100kW_2025.csv">Office</div>
      <div class="chip" data-file="load_rock_crusher_15min_kW_2col_1900kW.csv">Rock Crusher</div>
      <div class="chip" data-file="load_school_15min_kW_2col_1100kW.csv">School</div>
    </div>
  </div>
  <div class="card">
    <div class="card-head"><div class="card-title">Solar (PV) — Sizing &amp; Charts</div></div>
    <div class="toggle-row">
      <input type="checkbox" id="solar-toggle"/>
      <label for="solar-toggle">Include solar in sizing outputs &amp; monthly chart</label>
    </div>
    <div id="solar-size-field" style="display:none">
      <div class="field"><label for="solar-kw">System size (kWdc) — scales 1,000 kW reference profile linearly</label><input type="number" id="solar-kw" value="500" min="1" max="10000"/></div>
    </div>
    <div style="font-size:12px;color:var(--gray-400);margin-top:4px">Heatmap has its own independent solar controls for side-by-side comparison.</div>
  </div>
</div>

<!-- ── Accordion ─────────────────────────────────────────────────── -->
<button class="expand-btn" id="accordion-btn" onclick="toggleAccordion()">
  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01"/>
  </svg>
  Storage Sizing Analysis
  <span style="font-size:12px;font-weight:400;opacity:.75">— battery sizing heuristics based on load &amp; tariff</span>
  <span class="expand-chevron" id="accordion-chevron">&#9660;</span>
</button>

<div class="accordion-body" id="accordion-body">
  <div id="accordion-loading" class="loading">Loading data&#8230;</div>

  <!-- Coverage Ambition slider -->
  <div class="coverage-bar" id="section-coverage" style="display:none">
    <label for="cov-range">Coverage Ambition</label>
    <input type="range" id="cov-range" min="50" max="95" step="5" value="80"/>
    <span class="cov-val" id="cov-display">80%</span>
    <span class="hint">50% = economical &middot; 95% = size for worst days</span>
  </div>

  <!-- Load stats -->
  <div id="section-stats" style="display:none">
    <div class="card">
      <div class="card-head"><div class="card-title">Site Load Overview</div></div>
      <div class="stats-row" id="load-stats"></div>
    </div>
  </div>

  <!-- Heatmap card -->
  <div class="card" id="section-load" style="display:none">
    <div class="card-head">
      <div class="card-title" id="heatmap-title">Baseline Load Heatmap &mdash; Date &times; Hour of Day</div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
        <label style="font-size:11px;color:var(--gray-600);font-weight:500">Color</label>
        <select id="hm-colorscheme" style="font-size:11px;padding:3px 6px;border:1px solid var(--gray-200);border-radius:5px;color:var(--gray-900);background:#fff">
          <option value="plasma">Plasma</option>
          <option value="viridis">Viridis</option>
          <option value="hot">Hot</option>
          <option value="reds">Reds</option>
          <option value="blues">Blues</option>
          <option value="greens">Greens</option>
        </select>
      </div>
    </div>

    <!-- Heatmap solar controls -->
    <div class="hm-controls">
      <div class="case-toggle">
        <button class="case-btn active" id="hm-case-base" onclick="setHmCase('base')">Baseline Load</button>
        <button class="case-btn" id="hm-case-solar" onclick="setHmCase('solar')">Post-Solar Load</button>
      </div>
      <div class="hm-ctrl-sep"></div>
      <label for="hm-solar-range">Solar size</label>
      <input type="range" id="hm-solar-range" min="0" max="5000" step="50" value="500" style="width:140px;accent-color:var(--blue)"/>
      <span class="hm-kw-lbl" id="hm-solar-lbl">500 kWdc</span>
      <span style="font-size:11px;color:var(--gray-400)">(heatmap only &mdash; toggle to Post-Solar to apply)</span>
    </div>

    <div class="heatmap-outer">
      <div class="heatmap-yaxis" id="hm-yaxis"></div>
      <div class="heatmap-main">
        <canvas id="heatmap-canvas"></canvas>
        <div class="heatmap-xaxis" id="hm-xaxis"></div>
      </div>
      <div class="hm-legend-right">
        <span id="hm-max-lbl">&mdash;</span>
        <div class="hm-gradient-v" id="hm-gradient-v"></div>
        <span id="hm-min-lbl">0 kW</span>
      </div>
    </div>
    <div class="hm-tou-legend">
      <span><span class="hm-tou-swatch" style="background:rgba(255,255,255,0.55)"></span>On-Peak hours</span>
      <span style="color:var(--gray-400);font-size:10px">White overlay &middot; TOU schedule from selected tariff</span>
    </div>
  </div>

  <!-- Two sizing cards -->
  <div class="sizing-row" id="section-sizing" style="display:none">
    <!-- DCM card -->
    <div class="card sz-accent-dcm" id="card-dcm">
      <div class="card-head">
        <span class="sz-badge sz-badge-dcm">Demand Charge Management</span>
        <div class="info-wrap" style="margin-left:auto">
          <span class="info-icon">i</span>
          <div class="info-tip">
            <strong>DCM sizing logic</strong>
            <ul style="margin-top:6px">
              <li><strong>Target Power:</strong> Nth-percentile of daily peak load values &mdash; the level you shave demand to on your worst covered days.</li>
              <li><strong>Target Energy:</strong> Target power &times; on-peak window length. Enough energy to sustain discharge for the full on-peak period.</li>
              <li><strong>Viable when</strong> on-peak demand charge &ge; $8/kW.</li>
              <li>N = Coverage Ambition slider.</li>
            </ul>
          </div>
        </div>
      </div>
      <div id="dcm-content"></div>
    </div>

    <!-- TOU Arbitrage card -->
    <div class="card sz-accent-arb" id="card-arb">
      <div class="card-head">
        <span class="sz-badge sz-badge-arb">TOU Arbitrage</span>
        <div class="info-wrap" style="margin-left:auto">
          <span class="info-icon">i</span>
          <div class="info-tip">
            <strong>TOU Arbitrage sizing logic</strong>
            <ul style="margin-top:6px">
              <li><strong>Target Power:</strong> Target energy &divide; on-peak window length &mdash; inverter rating to deliver energy within the window.</li>
              <li><strong>Target Energy:</strong> Nth-percentile of daily on-peak consumption (kWh) to fully offset on-peak load on covered days.</li>
              <li><strong>Viable when</strong> on-peak minus off-peak spread &ge; $0.08/kWh (~85% RTE).</li>
              <li>N = Coverage Ambition slider.</li>
            </ul>
          </div>
        </div>
      </div>
      <div id="arb-content"></div>
    </div>
  </div><!-- /sizing-row -->

  <!-- Monthly chart -->
  <div class="card" id="section-monthly" style="display:none">
    <div class="card-head"><div class="card-title">Monthly Load &mdash; Max vs. Average</div></div>
    <div class="chart-wrap"><canvas id="monthly-chart"></canvas></div>
  </div>
</div><!-- /accordion-body -->
</div><!-- /page -->

<div id="hm-tooltip"></div>

<script>
// ── Color schemes ─────────────────────────────────────────────────
const SCHEMES = {
  plasma:[
    [13,8,135],[75,3,161],[126,21,168],[168,34,150],
    [203,71,120],[229,107,93],[248,148,65],[253,195,40],[240,249,33]],
  viridis:[
    [68,1,84],[72,35,116],[64,67,135],[52,94,141],
    [41,120,142],[32,144,141],[34,167,132],[66,190,113],
    [121,209,81],[186,222,40],[253,231,37]],
  hot:[
    [0,0,0],[64,0,0],[128,0,0],[192,0,0],
    [255,0,0],[255,85,0],[255,170,0],[255,255,0],[255,255,128],[255,255,255]],
  reds:[
    [255,245,240],[254,224,210],[252,187,161],[252,146,114],
    [251,106,74],[239,59,44],[203,24,29],[165,15,21],[103,0,13]],
  blues:[
    [247,251,255],[222,235,247],[198,219,239],[158,202,225],
    [107,174,214],[66,146,198],[33,113,181],[8,81,156],[8,48,107]],
  greens:[
    [247,252,245],[229,245,224],[199,233,192],[161,217,155],
    [116,196,118],[65,171,93],[35,139,69],[0,109,44],[0,68,27]],
};

function schemeRGB(t, name) {
  const s = SCHEMES[name] || SCHEMES.plasma;
  const sv = t*(s.length-1), i = Math.min(Math.floor(sv), s.length-2), f = sv-i;
  return s[i].map((a,j) => Math.round(a + (s[i+1][j]-a)*f));
}
function schemeGradientCSS(name) {
  const s = SCHEMES[name] || SCHEMES.plasma;
  const stops = s.map((c,i) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round(i/(s.length-1)*100)}%`).join(',');
  return `linear-gradient(to top,${stops})`;
}

// ── Tariff definitions ────────────────────────────────────────────
const TARIFFS = {
  'pge-b19':{
    onPeakHrs:5,
    schedule:[
      {months:[6,7,8,9],           weekdays:[1,2,3,4,5],hours:[16,17,18,19,20],period:'on-peak'},
      {months:[1,2,3,4,5,10,11,12],weekdays:[1,2,3,4,5],hours:[16,17,18,19,20],period:'on-peak'},
      {months:[11,12,1,2,3],       weekdays:[1,2,3,4,5],hours:[0,1,2,3,4,5,6,7,8],period:'super-off-peak'},
      {months:[11,12,1,2,3],       weekdays:[0,6],hours:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],period:'super-off-peak'},
    ],
    rates:{nonTouDemand:0,onPeakDemand:16.00,onPeakEnergy:0.380,offPeakEnergy:0.160,superOffPeakEnergy:0.080}
  },
  'sdge-al':{
    onPeakHrs:5,
    schedule:[
      {months:[5,6,7,8,9,10], weekdays:[1,2,3,4,5],hours:[16,17,18,19,20],period:'on-peak'},
      {months:[11,12,1,2,3,4],weekdays:[1,2,3,4,5],hours:[16,17,18,19,20],period:'on-peak'},
      {months:[11,12,1,2,3,4],weekdays:[1,2,3,4,5],hours:[0,1,2,3,4,5,6,7,8,9],period:'super-off-peak'},
      {months:[11,12,1,2,3,4],weekdays:[0,6],hours:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23],period:'super-off-peak'},
    ],
    rates:{nonTouDemand:8.00,onPeakDemand:22.50,onPeakEnergy:0.540,offPeakEnergy:0.220,superOffPeakEnergy:0.100}
  },
  'sce-gs2e':{
    onPeakHrs:5,
    schedule:[
      {months:[6,7,8,9],           weekdays:[1,2,3,4,5],hours:[16,17,18,19,20],period:'on-peak'},
      {months:[1,2,3,4,5,10,11,12],weekdays:[1,2,3,4,5],hours:[8,9,10,11,12,13,14,15,16,17,18,19,20],period:'on-peak'},
    ],
    rates:{nonTouDemand:6.00,onPeakDemand:18.00,onPeakEnergy:0.440,offPeakEnergy:0.190,superOffPeakEnergy:0.000}
  }
};

const H={DCM_THRESHOLD:8.0,ARB_THRESHOLD:0.08,SIZING_BAND:0.20,PV_NAMEPLATE:1000};

const S={
  loadRows:[],pvRows:[],pvKwdc:500,solarOn:false,
  tariffKey:'pge-b19',rates:{...TARIFFS['pge-b19'].rates},
  covPctile:80,monthlyChart:null,dailyStats:null,
  heatmapGrid:null,heatmapMaxKw:0,
  hmCase:'base',hmSolarKwdc:500,colorScheme:'plasma',
};

// ── CSV utils ─────────────────────────────────────────────────────
function parseDate(s){
  s=s.trim();
  if(/^\d{4}-/.test(s)) return new Date(s.replace(' ','T'));
  const m=s.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if(m){let y=+m[3];if(y<100)y+=y<50?2000:1900;return new Date(y,+m[1]-1,+m[2],+m[4],+m[5]);}
  return new Date(s);
}
async function fetchCSV(p){
  const res=await fetch(p);
  if(!res.ok) throw new Error('Cannot load '+p);
  const t=await res.text();
  return new Promise((ok,er)=>Papa.parse(t,{header:false,skipEmptyLines:true,complete:r=>ok(r.data),error:er}));
}
function parseRows(rows){
  const s=Number.isNaN(Number.parseFloat(rows[0][1]))?1:0;
  return rows.slice(s).map(r=>({ts:parseDate(r[0]),kw:Number.parseFloat(r[1])||0})).filter(r=>!Number.isNaN(r.ts.getTime()));
}

// ── PV ────────────────────────────────────────────────────────────
function buildPVMap(rows,scale){
  const m=new Map();
  for(const r of rows) m.set(Math.floor(r.ts.getTime()/3600000),r.kw*scale);
  return m;
}
function pvAt(m,ts){return m.get(Math.floor(ts.getTime()/3600000))||0;}

// ── TOU classify ──────────────────────────────────────────────────
function classify(ts,sch){
  const mo=ts.getMonth()+1, wd=ts.getDay(), hr=ts.getHours();
  for(const r of sch) if(r.months.includes(mo)&&r.weekdays.includes(wd)&&r.hours.includes(hr)) return r.period;
  return 'off-peak';
}

// ── Per-day aggregation ───────────────────────────────────────────
function computeDailyStats(loadRows,pvMap,solarOn,schedule){
  const days={};
  for(const r of loadRows){
    const dk=r.ts.toDateString();
    if(!days[dk]) days[dk]={peakKw:0,onPeakKwh:0,onPeakPts:0};
    const kw=solarOn?Math.max(0,r.kw-pvAt(pvMap,r.ts)):r.kw;
    const period=classify(r.ts,schedule);
    if(kw>days[dk].peakKw) days[dk].peakKw=kw;
    if(period==='on-peak'){days[dk].onPeakKwh+=kw*0.25;days[dk].onPeakPts++;}
  }
  return Object.values(days);
}

// ── Monthly aggregation ───────────────────────────────────────────
function computeMonthly(loadRows,pvMap,solarOn,schedule){
  const bkt={};
  for(const r of loadRows){
    const k=`${r.ts.getFullYear()}-${String(r.ts.getMonth()+1).padStart(2,'0')}`;
    if(!bkt[k]) bkt[k]=[];
    bkt[k].push(solarOn?Math.max(0,r.kw-pvAt(pvMap,r.ts)):r.kw);
  }
  return Object.entries(bkt).sort().map(([key,vals])=>{
    const mo=parseInt(key.split('-')[1]);
    return{mo,maxKw:Math.max(...vals),avgKw:vals.reduce((a,b)=>a+b,0)/vals.length};
  });
}

// ── Percentile helper ─────────────────────────────────────────────
function pctile(arr,p){
  const sorted=[...arr].sort((a,b)=>a-b);
  const idx=Math.min(Math.floor(p/100*sorted.length),sorted.length-1);
  return sorted[idx];
}

// ── Sizing heuristics ─────────────────────────────────────────────
function computeSizing(dailyStats,rates,covPctile,tariff){
  const peaks=dailyStats.map(d=>d.peakKw);
  const onPeakKwhs=dailyStats.filter(d=>d.onPeakPts>0).map(d=>d.onPeakKwh);
  const opHrs=tariff.onPeakHrs;
  const dcmPeakKw=pctile(peaks,covPctile);
  const dcmEnergyKwh=dcmPeakKw*opHrs;
  const arbEnergyKwh=onPeakKwhs.length?pctile(onPeakKwhs,covPctile):0;
  const arbPowerKw=opHrs>0?arbEnergyKwh/opHrs:0;
  const spread=rates.onPeakEnergy-Math.min(rates.offPeakEnergy,rates.superOffPeakEnergy||rates.offPeakEnergy);
  const top3=[...dailyStats].sort((a,b)=>b.peakKw-a.peakKw).slice(0,3);
  return{
    dcm:{
      powerKw:Math.round(dcmPeakKw),energyKwh:Math.round(dcmEnergyKwh),
      minPower:Math.round(dcmPeakKw*(1-H.SIZING_BAND)),maxPower:Math.round(dcmPeakKw*(1+H.SIZING_BAND)),
      minEnergy:Math.round(dcmEnergyKwh*(1-H.SIZING_BAND)),maxEnergy:Math.round(dcmEnergyKwh*(1+H.SIZING_BAND)),
      viable:rates.onPeakDemand>=H.DCM_THRESHOLD,top3Peaks:top3.map(d=>Math.round(d.peakKw)),
    },
    arb:{
      powerKw:Math.round(arbPowerKw),energyKwh:Math.round(arbEnergyKwh),
      minPower:Math.round(arbPowerKw*(1-H.SIZING_BAND)),maxPower:Math.round(arbPowerKw*(1+H.SIZING_BAND)),
      minEnergy:Math.round(arbEnergyKwh*(1-H.SIZING_BAND)),maxEnergy:Math.round(arbEnergyKwh*(1+H.SIZING_BAND)),
      viable:spread>=H.ARB_THRESHOLD,spread:+spread.toFixed(3),
    },
    maxKw:pctile(peaks,99),avgKw:peaks.reduce((a,b)=>a+b,0)/peaks.length,
  };
}

// ── Render: tariff tiles ──────────────────────────────────────────
function renderTariffTiles(){
  const r=S.rates;
  const spread=r.onPeakEnergy-Math.min(r.offPeakEnergy,r.superOffPeakEnergy||r.offPeakEnergy);
  const items=[
    {label:'Non-TOU Demand',val:`$${r.nonTouDemand.toFixed(2)}/kW`},
    {label:'On-Peak Demand',val:`$${r.onPeakDemand.toFixed(2)}/kW`,cls:r.onPeakDemand>=H.DCM_THRESHOLD?'good':''},
    {label:'On-Peak Energy',val:`$${r.onPeakEnergy.toFixed(3)}/kWh`},
    {label:'Off-Peak Energy',val:`$${r.offPeakEnergy.toFixed(3)}/kWh`},
    {label:'Super Off-Peak',val:r.superOffPeakEnergy>0?`$${r.superOffPeakEnergy.toFixed(3)}/kWh`:'&#8212;'},
    {label:'Arbitrage Spread',val:`$${spread.toFixed(3)}/kWh`,
     sub:spread>=H.ARB_THRESHOLD?'&#10003; viable':'&#10007; below threshold',
     cls:spread>=H.ARB_THRESHOLD?'good':'weak'},
  ];
  document.getElementById('tariff-tiles').innerHTML=items.map(it=>`
<div class="tstat"><div class="tstat-label">${it.label}</div>
<div class="tstat-value ${it.cls||''}">${it.val}</div>
${it.sub?`<div class="tstat-sub ${it.cls||''}">${it.sub}</div>`:''}</div>`).join('');
}

// ── Render: load stats ────────────────────────────────────────────
function renderLoadStats(sizing,solarOn){
  const lbl=solarOn?'Net ':'';
  document.getElementById('load-stats').innerHTML=[
    {label:`Max ${lbl}Load`,val:`${Math.round(sizing.maxKw).toLocaleString()} kW`},
    {label:`Avg Peak ${lbl}Load`,val:`${Math.round(sizing.avgKw).toLocaleString()} kW`},
    {label:'DCM Target Power',val:`${sizing.dcm.powerKw.toLocaleString()} kW`,sub:'demand shaving'},
    {label:'Arb Target Energy',val:`${sizing.arb.energyKwh.toLocaleString()} kWh`,sub:'on-peak offset'},
  ].map(s=>`<div class="stat"><div class="stat-label">${s.label}</div>
<div class="stat-value">${s.val}</div>
${s.sub?`<div class="stat-sub">${s.sub}</div>`:''}</div>`).join('');
}

// ── Render: DCM card (Power | Energy) ────────────────────────────
function renderDCM(dcm,rates){
  const el=document.getElementById('dcm-content');
  if(!dcm.viable){
    el.innerHTML=`<div class="sz-na">On-peak demand charge ($${rates.onPeakDemand}/kW) is below the $${H.DCM_THRESHOLD}/kW threshold. DCM unlikely to justify storage costs here.</div>`;
    document.getElementById('card-dcm').style.opacity='0.55';return;
  }
  document.getElementById('card-dcm').style.opacity='1';
  el.innerHTML=`<div class="sz-main">
<div class="sz-stat"><div class="sz-label">Target Power</div><div class="sz-value">${dcm.powerKw.toLocaleString()} kW</div><div class="sz-range">Range: ${dcm.minPower}&#8211;${dcm.maxPower} kW</div></div>
<div class="sz-stat"><div class="sz-label">Target Energy</div><div class="sz-value">${dcm.energyKwh.toLocaleString()} kWh</div><div class="sz-range">Range: ${dcm.minEnergy}&#8211;${dcm.maxEnergy} kWh</div></div>
</div><div class="sz-context"><strong>3 highest peaks:</strong>${dcm.top3Peaks.map((p,i)=>` #${i+1}: ${p.toLocaleString()} kW`).join(' &middot;')} &#8212; sizing for <strong>${document.getElementById('cov-display').textContent}</strong> coverage.</div>`;
}

// ── Render: Arb card (Power | Energy) ────────────────────────────
function renderArb(arb,rates){
  const el=document.getElementById('arb-content');
  if(!arb.viable){
    el.innerHTML=`<div class="sz-na">Arbitrage spread ($${arb.spread}/kWh) is below the $${H.ARB_THRESHOLD}/kWh threshold. TOU arbitrage unlikely to be profitable at current rates.</div>`;
    document.getElementById('card-arb').style.opacity='0.55';return;
  }
  document.getElementById('card-arb').style.opacity='1';
  el.innerHTML=`<div class="sz-main">
<div class="sz-stat"><div class="sz-label">Target Power</div><div class="sz-value">${arb.powerKw.toLocaleString()} kW</div><div class="sz-range">Range: ${arb.minPower}&#8211;${arb.maxPower} kW</div></div>
<div class="sz-stat"><div class="sz-label">Target Energy</div><div class="sz-value">${arb.energyKwh.toLocaleString()} kWh</div><div class="sz-range">Range: ${arb.minEnergy}&#8211;${arb.maxEnergy} kWh</div></div>
</div><div class="sz-context">Spread <strong>$${arb.spread}/kWh</strong> over round-trip losses. <strong>${document.getElementById('cov-display').textContent}</strong> day coverage.</div>`;
}

// ── Render: heatmap ───────────────────────────────────────────────
function renderHeatmap(){
  if(!S.loadRows.length) return;
  const HOURS=24;
  const useSolar=(S.hmCase==='solar')&&S.pvRows.length>0;
  const pvMap=useSolar?buildPVMap(S.pvRows,S.hmSolarKwdc/H.PV_NAMEPLATE):new Map();
  const schedule=TARIFFS[S.tariffKey].schedule;

  // True date range from data
  const allTs=S.loadRows.map(r=>r.ts.getTime());
  const minTs=Math.min(...allTs), maxTs=Math.max(...allTs);
  const minDate=new Date(minTs);
  const minDayMs=new Date(minDate.getFullYear(),minDate.getMonth(),minDate.getDate()).getTime();
  const maxDate=new Date(maxTs);
  const maxDayMs=new Date(maxDate.getFullYear(),maxDate.getMonth(),maxDate.getDate()).getTime();
  const DAYS=Math.round((maxDayMs-minDayMs)/86400000)+1;

  const grid={};let maxKw=0;
  for(const r of S.loadRows){
    const doy=Math.round((r.ts.getTime()-minDayMs)/86400000);
    if(doy<0||doy>=DAYS) continue;
    const hr=r.ts.getHours();
    const kw=useSolar?Math.max(0,r.kw-pvAt(pvMap,r.ts)):r.kw;
    const k=doy*HOURS+hr;
    if(!grid[k]) grid[k]={sum:0,n:0};
    grid[k].sum+=kw;grid[k].n++;
    if(kw>maxKw) maxKw=kw;
  }
  S.heatmapGrid={grid,maxKw,minDayMs};
  S.heatmapMaxKw=maxKw;

  const canvas=document.getElementById('heatmap-canvas');
  const CW=Math.max(2,Math.floor((canvas.parentElement.offsetWidth-4)/DAYS));
  const CH=10;
  canvas.width=DAYS*CW; canvas.height=HOURS*CH;
  canvas.style.height=`${HOURS*CH}px`;
  canvas._CW=CW; canvas._CH=CH; canvas._DAYS=DAYS; canvas._HOURS=HOURS;
  canvas._minDayMs=minDayMs;

  const scheme=S.colorScheme||'plasma';
  const ctx=canvas.getContext('2d');

  // Draw load pixels
  for(let d=0;d<DAYS;d++) for(let h=0;h<HOURS;h++){
    const cell=grid[d*HOURS+h];
    const kw=cell?cell.sum/cell.n:0;
    const [r,g,b]=schemeRGB(maxKw>0?kw/maxKw:0,scheme);
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(d*CW,h*CH,CW,CH);
  }
  // Draw TOU overlay — white stripe, visible on any palette
  for(let d=0;d<DAYS;d++){
    const dayMs=minDayMs+d*86400000;
    const dt=new Date(dayMs);
    for(let h=0;h<HOURS;h++){
      const ts=new Date(dt); ts.setHours(h);
      if(classify(ts,schedule)==='on-peak'){
        ctx.fillStyle='rgba(255,255,255,0.42)';
        ctx.fillRect(d*CW,h*CH,CW,CH);
      }
    }
  }

  // Y-axis
  const yEl=document.getElementById('hm-yaxis');
  yEl.style.cssText=`position:relative;width:38px;flex-shrink:0;height:${HOURS*CH}px`;
  yEl.innerHTML='';
  [0,3,6,9,12,15,18,21].forEach(h=>{
    const sp=document.createElement('span');
    sp.textContent=`${String(h).padStart(2,'0')}:00`;
    sp.style.cssText=`position:absolute;top:${h*CH-4}px;right:2px;font-size:9px;color:var(--gray-400)`;
    yEl.appendChild(sp);
  });

  // X-axis: month boundaries from actual date range
  const xEl=document.getElementById('hm-xaxis');
  xEl.style.cssText='position:relative;height:14px;margin-top:2px';
  xEl.innerHTML='';
  const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const startDate=new Date(minDayMs);
  let cur=new Date(startDate.getFullYear(),startDate.getMonth(),1);
  const endDayMs=minDayMs+(DAYS-1)*86400000;
  while(cur.getTime()<=endDayMs){
    const dayOffset=Math.round((cur.getTime()-minDayMs)/86400000);
    const pct=dayOffset/DAYS*100;
    const sp=document.createElement('span');
    const yearSuffix=cur.getFullYear()!==startDate.getFullYear()?` '${String(cur.getFullYear()).slice(2)}`:'';
    sp.textContent=MO[cur.getMonth()]+yearSuffix;
    sp.style.cssText=`position:absolute;left:${pct}%;font-size:9px;color:var(--gray-400);transform:translateX(-50%)`;
    xEl.appendChild(sp);
    cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);
  }

  // Legend gradient (palette-aware)
  const gradEl=document.getElementById('hm-gradient-v');
  gradEl.style.cssText=`flex:1;width:14px;min-height:${HOURS*CH}px;border-radius:4px;background:${schemeGradientCSS(scheme)}`;
  document.getElementById('hm-max-lbl').textContent=`${Math.round(maxKw).toLocaleString()} kW`;
  document.getElementById('hm-min-lbl').textContent='0 kW';
  document.getElementById('heatmap-title').textContent=
    (useSolar?'Post-Solar (Net) Load':'Baseline Load')+' Heatmap \u2014 Date \u00d7 Hour of Day';
}

// ── Render: monthly chart ─────────────────────────────────────────
function renderMonthlyChart(monthly,dcmTarget){
  const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels=monthly.map(m=>MO[m.mo-1]);
  const cfg={
    data:{labels,datasets:[
      {type:'bar',label:'Max Load (kW)',data:monthly.map(m=>Math.round(m.maxKw)),
       backgroundColor:'#9CA3AF',borderColor:'#6B7280',borderWidth:1,borderRadius:3,yAxisID:'y'},
      {type:'bar',label:'Avg Load (kW)',data:monthly.map(m=>Math.round(m.avgKw)),
       backgroundColor:'#D1D5DB',borderColor:'#9CA3AF',borderWidth:1,borderRadius:3,yAxisID:'y'},
      {type:'line',label:`DCM Peak Target: ${dcmTarget} kW`,
       data:Array(labels.length).fill(dcmTarget),
       borderColor:'#166534',borderWidth:2,borderDash:[5,4],pointRadius:0,yAxisID:'y',fill:false},
    ]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{font:{size:11},boxWidth:12}},tooltip:{mode:'index'}},
      scales:{
        y:{beginAtZero:true,ticks:{font:{size:11}},grid:{color:'#E5E7EB'},title:{display:true,text:'kW',font:{size:11}}},
        x:{ticks:{font:{size:11}},grid:{color:'#E5E7EB'}},
      },
    },
  };
  if(S.monthlyChart){S.monthlyChart.destroy();S.monthlyChart=null;}
  S.monthlyChart=new Chart(document.getElementById('monthly-chart').getContext('2d'),cfg);
}

// ── Main compute ──────────────────────────────────────────────────
function compute(){
  if(!S.loadRows.length) return;
  const solarOn=S.solarOn&&S.pvRows.length>0;
  const pvMap=solarOn?buildPVMap(S.pvRows,S.pvKwdc/H.PV_NAMEPLATE):new Map();
  const tariff=TARIFFS[S.tariffKey];
  renderTariffTiles();
  const daily=computeDailyStats(S.loadRows,pvMap,solarOn,tariff.schedule);
  S.dailyStats=daily;
  const monthly=computeMonthly(S.loadRows,pvMap,solarOn,tariff.schedule);
  const sizing=computeSizing(daily,S.rates,S.covPctile,tariff);
  renderLoadStats(sizing,solarOn);
  renderHeatmap();
  renderDCM(sizing.dcm,S.rates);
  renderArb(sizing.arb,S.rates);
  renderMonthlyChart(monthly,sizing.dcm.powerKw);
}

// ── Partial update ────────────────────────────────────────────────
function recomputeSizing(){
  if(!S.dailyStats) return;
  const tariff=TARIFFS[S.tariffKey];
  const sizing=computeSizing(S.dailyStats,S.rates,S.covPctile,tariff);
  renderLoadStats(sizing,S.solarOn&&S.pvRows.length>0);
  renderDCM(sizing.dcm,S.rates);
  renderArb(sizing.arb,S.rates);
  if(S.monthlyChart){
    S.monthlyChart.data.datasets[2].data=Array(S.monthlyChart.data.labels.length).fill(sizing.dcm.powerKw);
    S.monthlyChart.data.datasets[2].label=`DCM Peak Target: ${sizing.dcm.powerKw} kW`;
    S.monthlyChart.update('none');
  }
}

// ── Heatmap case toggle ───────────────────────────────────────────
function setHmCase(c){
  S.hmCase=c;
  document.getElementById('hm-case-base').classList.toggle('active',c==='base');
  document.getElementById('hm-case-solar').classList.toggle('active',c==='solar');
  if(c==='solar'&&!S.pvRows.length){
    loadPV().then(()=>renderHeatmap());
  } else {
    renderHeatmap();
  }
}

// ── Heatmap tooltip ───────────────────────────────────────────────
(function(){
  const tip=document.getElementById('hm-tooltip');
  document.addEventListener('mousemove',e=>{
    const canvas=document.getElementById('heatmap-canvas');
    if(!canvas._CW){tip.style.display='none';return;}
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left, y=e.clientY-rect.top;
    if(x<0||y<0||x>rect.width||y>rect.height){tip.style.display='none';return;}
    const day=Math.floor(x/rect.width*canvas._DAYS);
    const hour=Math.floor(y/rect.height*canvas._HOURS);
    if(day<0||day>=canvas._DAYS||hour<0||hour>=canvas._HOURS){tip.style.display='none';return;}
    const dayMs=(canvas._minDayMs||0)+day*86400000;
    const dt=new Date(dayMs); dt.setHours(hour);
    const MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DA=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const lbl=`${DA[dt.getDay()]} ${MO[dt.getMonth()]} ${dt.getDate()} ${dt.getFullYear()}, ${String(hour).padStart(2,'0')}:00`;
    const sched=TARIFFS[S.tariffKey].schedule;
    const period=classify(dt,sched);
    const cell=S.heatmapGrid&&S.heatmapGrid.grid[day*24+hour];
    const kw=cell?cell.sum/cell.n:0;
    const maxKw=S.heatmapMaxKw||1;
    const [r,g,b]=schemeRGB(maxKw>0?kw/maxKw:0,S.colorScheme||'plasma');
    const periodLabel=period==='on-peak'?'<span style="color:#93c5fd;font-weight:600"> &middot; On-Peak</span>':
      period==='super-off-peak'?'<span style="color:#9CA3AF"> &middot; Super Off-Peak</span>':'';
    tip.innerHTML=`<div>${lbl}${periodLabel}</div><div style="margin-top:3px;display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:rgb(${r},${g},${b})"></span><strong>${Math.round(kw).toLocaleString()} kW</strong></div>`;
    tip.style.display='block';
    tip.style.left=`${e.clientX+14}px`;
    tip.style.top=`${e.clientY-tip.offsetHeight-12}px`;
  });
  document.addEventListener('mouseleave',()=>{document.getElementById('hm-tooltip').style.display='none';});
})();

// ── Accordion ─────────────────────────────────────────────────────
let accordionOpen=false,firstOpen=true;
async function toggleAccordion(){
  accordionOpen=!accordionOpen;
  document.getElementById('accordion-body').classList.toggle('open',accordionOpen);
  document.getElementById('accordion-chevron').classList.toggle('open',accordionOpen);
  if(accordionOpen&&firstOpen){firstOpen=false;await loadScenario('load_mall_15min_kW_2col_1300kW.csv');}
}

// ── Data loading ──────────────────────────────────────────────────
async function loadScenario(file){
  document.getElementById('accordion-loading').style.display='';
  ['section-coverage','section-stats','section-load','section-sizing','section-monthly']
    .forEach(id=>document.getElementById(id).style.display='none');
  if(S.monthlyChart){S.monthlyChart.destroy();S.monthlyChart=null;}
  try{
    S.loadRows=parseRows(await fetchCSV('./data/'+file));
    ['section-coverage','section-stats','section-load','section-sizing','section-monthly']
      .forEach(id=>document.getElementById(id).style.display='');
    document.getElementById('accordion-loading').style.display='none';
    compute();
  }catch(e){document.getElementById('accordion-loading').textContent='Error: '+e.message;}
}
async function loadPV(){
  if(S.pvRows.length) return;
  try{S.pvRows=parseRows(await fetchCSV('./data/pv_2col_60min_1000kW.csv'));}
  catch(e){console.warn('PV load failed:',e.message);}
}

// ── Events ────────────────────────────────────────────────────────
document.querySelectorAll('#scenario-chips .chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    document.querySelectorAll('#scenario-chips .chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    if(accordionOpen) loadScenario(chip.dataset.file);
    else{S.loadRows=[];S.dailyStats=null;}
  });
});

document.getElementById('solar-toggle').addEventListener('change',async function(){
  S.solarOn=this.checked;
  document.getElementById('solar-size-field').style.display=this.checked?'':'none';
  if(this.checked) await loadPV();
  if(S.loadRows.length) compute();
});
document.getElementById('solar-kw').addEventListener('input',function(){
  S.pvKwdc=Number.parseFloat(this.value)||500;
  if(S.loadRows.length) compute();
});

document.getElementById('tariff-select').addEventListener('change',function(){
  S.tariffKey=this.value;
  S.rates={...TARIFFS[this.value].rates};
  const r=S.rates;
  document.getElementById('r-nontou').value=r.nonTouDemand;
  document.getElementById('r-onpkd').value=r.onPeakDemand;
  document.getElementById('r-onpke').value=r.onPeakEnergy;
  document.getElementById('r-offpke').value=r.offPeakEnergy;
  document.getElementById('r-soffpke').value=r.superOffPeakEnergy;
  renderTariffTiles();
  if(S.loadRows.length) compute();
});

[['r-nontou','nonTouDemand'],['r-onpkd','onPeakDemand'],['r-onpke','onPeakEnergy'],
 ['r-offpke','offPeakEnergy'],['r-soffpke','superOffPeakEnergy']].forEach(([id,key])=>{
  document.getElementById(id).addEventListener('input',function(){
    S.rates[key]=Number.parseFloat(this.value)||0;
    renderTariffTiles();
    if(S.dailyStats) recomputeSizing();
  });
});

document.getElementById('cov-range').addEventListener('input',function(){
  S.covPctile=+this.value;
  document.getElementById('cov-display').textContent=this.value+'%';
  recomputeSizing();
});

// Heatmap: solar size slider
document.getElementById('hm-solar-range').addEventListener('input',function(){
  S.hmSolarKwdc=+this.value;
  document.getElementById('hm-solar-lbl').textContent=this.value+' kWdc';
  if(S.hmCase==='solar'&&S.loadRows.length) renderHeatmap();
});

// Heatmap: color scheme
document.getElementById('hm-colorscheme').addEventListener('change',function(){
  S.colorScheme=this.value;
  if(S.loadRows.length) renderHeatmap();
});

// ── Init ──────────────────────────────────────────────────────────
renderTariffTiles();
loadPV();
</script>
</body>
</html>"""

with open('predict/storage-sizing-enhancements/index.html','w') as f:
    f.write(html)
print("written", len(html), "bytes")
