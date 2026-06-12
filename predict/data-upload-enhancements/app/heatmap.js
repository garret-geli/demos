// ── Heatmap component ─────────────────────────────────────
// Baseline load heatmap — date × hour of day.
// No tariff, no TOU overlay, no solar. Standalone.
//
// Requires these IDs in DOM:
//   heatmap-canvas, hm-yaxis, hm-xaxis,
//   hm-gradient-v, hm-max-lbl, hm-min-lbl,
//   hm-scheme, heatmap-title, hm-tooltip
//
// Reads:  window.S.hmScheme
// Writes: window.S.heatmapGrid, window.S.heatmapMaxKw, window.S.heatmapMinKw

(function () {
  // ── Color schemes ──────────────────────────────────────
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
    turbo: [
      [48, 18, 59],
      [70, 96, 209],
      [29, 174, 228],
      [34, 221, 140],
      [105, 247, 71],
      [200, 249, 45],
      [254, 196, 38],
      [239, 101, 27],
      [180, 4, 38],
    ],
  };

  function schemeRGB(t, key) {
    const stops = SCHEMES[key] || SCHEMES.plasma;
    const scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const lo = Math.floor(scaled);
    const hi = Math.min(lo + 1, stops.length - 1);
    const f = scaled - lo;
    return stops[lo].map((c, i) => Math.round(c + f * (stops[hi][i] - c)));
  }

  function schemeGradientCSS(key) {
    const stops = SCHEMES[key] || SCHEMES.plasma;
    const pcts = stops.map((c, i) => `rgb(${c[0]},${c[1]},${c[2]}) ${Math.round((i / (stops.length - 1)) * 100)}%`);
    return `linear-gradient(to top, ${pcts.join(', ')})`;
  }

  // ── Renderer ───────────────────────────────────────────
  window.renderHeatmap = function (loadRows) {
    if (!loadRows || loadRows.length === 0) return;

    const HOURS = 24;

    const firstDay = loadRows.reduce((min, r) => (r.ts < min ? r.ts : min), loadRows[0].ts).startOf('day');
    const lastDay = loadRows.reduce((max, r) => (r.ts > max ? r.ts : max), loadRows[0].ts).startOf('day');
    const minDayMs = firstDay.toMillis();
    const maxDayMs = lastDay.toMillis();
    const DAYS = Math.round(lastDay.diff(firstDay, 'days').days) + 1;
    const minDay = firstDay;

    // Build kW grid indexed by [dayIndex * 24 + hour]
    const grid = {};
    for (const r of loadRows) {
      const localDay = r.ts.startOf('day');
      const doy = Math.round(localDay.diff(firstDay, 'days').days);
      if (doy < 0 || doy >= DAYS) continue;
      const hr = r.ts.hour;
      const k = doy * HOURS + hr;
      if (!grid[k]) grid[k] = { sum: 0, n: 0 };
      grid[k].sum += r.kw;
      grid[k].n++;
    }

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

    window.S = window.S || {};
    S.heatmapGrid = { grid, minKw, maxKw, minDayMs };
    S.heatmapMaxKw = maxKw;
    S.heatmapMinKw = minKw;

    const canvas = document.getElementById('heatmap-canvas');
    if (!canvas) return;

    const containerW = canvas.parentElement.offsetWidth || 900;
    const CW = Math.max(1, Math.floor(containerW / DAYS));
    const CH = 10;
    canvas.width = DAYS * CW;
    canvas.height = HOURS * CH;
    canvas.style.height = `${HOURS * CH}px`;
    canvas._CW = CW;
    canvas._CH = CH;
    canvas._DAYS = DAYS;
    canvas._HOURS = HOURS;
    canvas._minDayMs = minDayMs;

    const scheme = (window.S && S.hmScheme) || 'turbo';
    const ctx = canvas.getContext('2d');
    const kwRange = maxKw - minKw || 1;

    for (let d = 0; d < DAYS; d++) {
      for (let h = 0; h < HOURS; h++) {
        const cell = grid[d * HOURS + h];
        const kw = cell ? cell.sum / cell.n : minKw;
        const t = (kw - minKw) / kwRange;
        const [r, g, b] = schemeRGB(t, scheme);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(d * CW, h * CH, CW, CH);
      }
    }

    // Y-axis
    const yEl = document.getElementById('hm-yaxis');
    if (yEl) {
      yEl.style.cssText = `position:relative;width:52px;flex-shrink:0;height:${HOURS * CH}px`;
      yEl.innerHTML = '';
      const yLbl = document.createElement('span');
      yLbl.textContent = 'Time of Day';
      yLbl.style.cssText =
        'position:absolute;left:10px;top:50%;transform:translateX(-50%) translateY(-50%) rotate(-90deg);transform-origin:center center;font-size:9px;font-weight:600;color:#9ca3af;letter-spacing:0.05em;white-space:nowrap';
      yEl.appendChild(yLbl);
      [0, 3, 6, 9, 12, 15, 18, 21].forEach((h) => {
        const sp = document.createElement('span');
        sp.textContent = `${String(h).padStart(2, '0')}:00`;
        sp.style.cssText = `position:absolute;top:${h * CH - 4}px;right:2px;font-size:9px;color:#9ca3af`;
        yEl.appendChild(sp);
      });
    }

    // X-axis
    const xEl = document.getElementById('hm-xaxis');
    if (xEl) {
      xEl.style.cssText = 'position:relative;height:16px;margin-top:4px;width:100%';
      xEl.innerHTML = '';
      const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let cur = minDay.startOf('month');
      while (cur.toMillis() <= maxDayMs) {
        const dayOffset = Math.round(cur.diff(firstDay, 'days').days);
        if (dayOffset >= 0 && dayOffset < DAYS) {
          const sp = document.createElement('span');
          const yearSuffix = cur.year !== minDay.year ? ` '${String(cur.year).slice(2)}` : '';
          sp.textContent = MO[cur.month - 1] + yearSuffix;
          const pct = dayOffset / DAYS;
          const anchor = pct < 0.04 ? 'translateX(0)' : pct > 0.94 ? 'translateX(-100%)' : 'translateX(-50%)';
          sp.style.cssText = `position:absolute;left:${pct * 100}%;font-size:9px;color:#9ca3af;transform:${anchor};white-space:nowrap`;
          xEl.appendChild(sp);
        }
        cur = cur.plus({ months: 1 });
      }
    }

    // Gradient legend
    const gradEl = document.getElementById('hm-gradient-v');
    if (gradEl) {
      gradEl.style.background = schemeGradientCSS(scheme);
      gradEl.style.minHeight = `${HOURS * CH}px`;
    }
    const maxLbl = document.getElementById('hm-max-lbl');
    const minLbl = document.getElementById('hm-min-lbl');
    if (maxLbl) maxLbl.textContent = `${Math.round(maxKw).toLocaleString()} kW`;
    if (minLbl) minLbl.textContent = `${Math.round(minKw).toLocaleString()} kW`;

    const titleEl = document.getElementById('heatmap-title');
    if (titleEl) titleEl.textContent = 'Baseline Load Heatmap: Date × Hour of Day';
  };

  // ── Tooltip ────────────────────────────────────────────
  (function () {
    const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DA = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    document.addEventListener('mousemove', function (e) {
      const tip = document.getElementById('hm-tooltip');
      if (!tip) return;
      const canvas = document.getElementById('heatmap-canvas');
      if (!canvas || !canvas._CW) {
        tip.style.display = 'none';
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
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

      const minDayMs = canvas._minDayMs || 0;
      const dt = luxon.DateTime.fromMillis(minDayMs).plus({ days: day });
      const lbl = `${DA[dt.weekday % 7]} ${MO[dt.month - 1]} ${dt.day}, ${String(hour).padStart(2, '0')}:00`;

      const S = window.S || {};
      const cell = S.heatmapGrid && S.heatmapGrid.grid[day * 24 + hour];
      const minKwT = S.heatmapMinKw || 0;
      const maxKwT = S.heatmapMaxKw || 1;
      const kw = cell ? cell.sum / cell.n : minKwT;
      const t = maxKwT !== minKwT ? (kw - minKwT) / (maxKwT - minKwT) : 0;
      const scheme = S.hmScheme || 'turbo';
      const [r, g, b] = schemeRGB(t, scheme);

      tip.innerHTML = `<div>${lbl}</div>
        <div style="margin-top:3px;display:flex;align-items:center;gap:6px">
          <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:rgb(${r},${g},${b})"></span>
          <strong>${Math.round(kw).toLocaleString()} kW</strong>
        </div>`;
      tip.style.display = 'block';
      tip.style.left = `${e.clientX + 14}px`;
      tip.style.top = `${e.clientY - tip.offsetHeight - 12}px`;
    });

    document.addEventListener('mouseleave', function () {
      const tip = document.getElementById('hm-tooltip');
      if (tip) tip.style.display = 'none';
    });
  })();
})();
