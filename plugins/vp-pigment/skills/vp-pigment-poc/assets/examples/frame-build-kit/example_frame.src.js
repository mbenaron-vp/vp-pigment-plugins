(function () {
  'use strict';
  // Example frame for the build kit: one source, one lever, KPI tiles, a clickable SVG chart,
  // click-to-explain, queued writes and Reset. Copy the structure, not the content.
  // build_frame.py inlines story.json at STORY_JSON and writes example_frame.js (the deployed body).
  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#f6f8fb;';
  var SDK = window.PigmentSDK;
  var disposed = false, timers = [], listeners = [], subs = [];
  var GBP = '£', DASH = '–', ELL = '…', TIMES = '×';
  var STORY = /*STORY_JSON*/{};
  var EXPLAIN = STORY.explain || {};
  var C = { navy: '#1B478B', blue: '#2079EE', jade: '#14B8A6', coral: '#F43F5E', amber: '#F59E0B', ink: '#181818', mut: '#64748b', line: '#e2e8f0' };
  var V = 'Forecast';
  var S = { rows: [], src: [], loaded: false, errors: {}, ORIG: {}, busy: '', toast: null, explain: null, ptr: false, pending: false };

  // ---------- helpers ----------
  function timer(fn, ms) { var t = setTimeout(function () { if (!disposed) fn(); }, ms); timers.push(t); return t; }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function money(v) { return isNum(v) ? GBP + Math.round(v).toLocaleString('en-GB') : DASH; }
  function pct(v) { return isNum(v) ? (v * 100).toFixed(1) + '%' : DASH; }
  function lab(x) { return typeof x === 'string' ? x : (x && typeof x.name === 'string' ? x.name : ''); }
  function loading(a) { return (a || []).some(function (x) { return x && typeof x === 'object' && x.kind === 'loading'; }); }
  function ready(d) { return d && d.rows && !d.rows.some(function (r) { return loading(r.labels) || loading(r.values); }); }
  function total(k) { return S.rows.reduce(function (t, r) { return t + (isNum(r[k]) ? r[k] : 0); }, 0); }
  function copyRows(a) { return a.map(function (r) { var o = {}; for (var k in r) o[k] = r[k]; return o; }); }
  function row(region) { return S.rows.filter(function (r) { return r.region === region; })[0]; }

  // ---------- styles (defined before anything can render; all CSS lives here) ----------
  var CSS = '.wrap{font-family:Inter,"Segoe UI",system-ui,sans-serif;color:' + C.ink + ';padding:20px;max-width:1200px;margin:0 auto}' +
    'header{display:flex;justify-content:space-between;align-items:center}h1{font-size:22px;color:' + C.navy + '}h2{font-size:16px;margin:0 0 12px}' +
    '.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}.tile,.card{background:#fff;border:1px solid ' + C.line + ';border-radius:16px;padding:16px}' +
    '.tile{cursor:pointer}.tile:hover{outline:2px solid ' + C.blue + '}.tl{color:' + C.mut + ';font-size:13px}.tv{font-size:24px;font-weight:600;font-variant-numeric:tabular-nums}.cue{color:' + C.blue + ';font-size:12px;margin-top:4px}' +
    '.grid{display:grid;grid-template-columns:3fr 2fr;gap:12px}.lv{width:100%;border-collapse:collapse}.lv td,.lv th{padding:6px;border-bottom:1px solid ' + C.line + ';text-align:left}.num{font-variant-numeric:tabular-nums}' +
    '.btn{border:1px solid ' + C.line + ';background:#fff;border-radius:8px;padding:4px 10px;cursor:pointer}.err{background:#fde8ec;color:' + C.coral + ';padding:8px 12px;border-radius:8px}' +
    '.busy{color:' + C.mut + ';margin:8px 0}.toast{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);padding:10px 16px;border-radius:10px;color:#fff;background:' + C.jade + '}.toast.err{background:' + C.coral + '}' +
    '.dim{position:fixed;inset:0;background:rgba(24,24,24,.25)}.drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,100%);background:#fff;padding:20px;overflow:auto;box-shadow:-8px 0 24px rgba(0,0,0,.12)}' +
    '.drawer .x{float:right;border:0;background:none;font-size:22px;cursor:pointer}.big{font-size:28px;font-weight:600;color:' + C.navy + '}.mut{color:' + C.mut + '}h4{margin:16px 0 4px}' +
    '@media (max-width:760px){.kpis,.grid{grid-template-columns:1fr}}';

  // ---------- data ----------
  subs.push(SDK.subscribeToDataSource('dsRegion', {
    dynamicFilters: [{ binding: 'versionList', selection: [V] }],
    onData: function (d) {
      if (disposed || !ready(d)) return;
      if (d.totalRowCount > 1000) S.errors.size = 'dsRegion returns ' + d.totalRowCount + ' rows; only the first 1,000 are used.';
      S.src = d.rows.map(function (r) { return { region: lab(r.labels[0]), rev: r.values[0], gp: r.values[1], growth: r.values[2] }; })
        .filter(function (r) { return r.region; });
      S.rows = copyRows(S.src); S.loaded = true; delete S.errors.dsRegion; render();
    },
    onError: function (e) { if (disposed) return; S.errors.dsRegion = 'dsRegion: ' + ((e && e.message) || 'could not load'); render(); }
  }));

  // ---------- writes: one in flight per cell, latest value pending ----------
  var Q = {};
  function write(sink, coords, val, label, origVal) {
    var k = sink + '|' + JSON.stringify(coords);
    if (!(k in S.ORIG)) S.ORIG[k] = { sink: sink, coords: coords, v: origVal, label: label };
    var q = Q[k] || (Q[k] = { inflight: false, pending: undefined });
    q.pending = val; flush(k);
  }
  function flush(k) {
    var q = Q[k]; if (!q || q.inflight || q.pending === undefined) return;
    var o = S.ORIG[k], val = q.pending; q.pending = undefined; q.inflight = true;
    S.busy = 'Writing ' + o.label + ' to Pigment' + ELL; render();
    Promise.resolve().then(function () { return SDK.editValue(o.sink, o.coords, val); }).then(function () {
      if (disposed) return; q.inflight = false; S.busy = '';
      toast('ok', o.label + ' set to ' + pct(val) + '. Pigment is recalculating.'); flush(k);
    }, function (e) {
      if (disposed) return; q.inflight = false; S.busy = ''; S.rows = copyRows(S.src); // undo the optimistic move
      toast('err', 'Pigment did not save the change: ' + ((e && e.message) || e));
    });
  }
  function resetAll() {
    var ks = Object.keys(S.ORIG);
    if (!ks.length) { toast('ok', 'Nothing to reset: the model is at the starting forecast.'); return; }
    S.busy = 'Putting back ' + ks.length + ' value' + (ks.length > 1 ? 's' : '') + ELL; render();
    Promise.all(ks.map(function (k) { var o = S.ORIG[k]; return Promise.resolve().then(function () { return SDK.editValue(o.sink, o.coords, o.v); }); }))
      .then(function () { if (disposed) return; S.ORIG = {}; S.busy = ''; toast('ok', 'Back to the starting forecast.'); },
        function (e) { if (disposed) return; S.busy = ''; toast('err', 'Pigment did not save the reset: ' + ((e && e.message) || e)); });
  }
  function nudge(region, step) {
    var r = row(region); if (!r || !isNum(r.growth)) return;
    var was = r.growth, v = Math.round((was + step) * 1000) / 1000;
    r.growth = v; r.rev = r.rev / (1 + was) * (1 + v); // show the move now; the source confirms it after recalculation
    write('growthSink', { regionList: region, versionList: V }, v, 'Growth for ' + region, was); // was is kept only on the first write
  }
  function toast(kind, text) { var t = S.toast = { kind: kind, text: text }; render(); timer(function () { if (S.toast === t) { S.toast = null; render(); } }, kind === 'err' ? 7000 : 3500); }

  // ---------- click-to-explain ----------
  function live(key, region) {
    var rev = total('rev'), gp = total('gp'), r = row(region) || {};
    if (key === 'revenue') return { v: money(rev), n: S.rows.map(function (x) { return x.region + ' ' + money(x.rev); }).join(' + ') + ' = ' + money(rev) };
    if (key === 'gp') return { v: money(gp), n: S.rows.map(function (x) { return x.region + ' ' + money(x.gp); }).join(' + ') + ' = ' + money(gp) };
    if (key === 'margin') return { v: pct(rev ? gp / rev : null), n: money(gp) + ' ÷ ' + money(rev) + ' = ' + pct(rev ? gp / rev : null) };
    if (key === 'region') return { v: money(r.rev), n: 'Last year ' + TIMES + ' (1 + ' + pct(r.growth) + ') = ' + money(r.rev) };
    return { v: DASH, n: '' };
  }
  function drawer() {
    var x = S.explain, e = x && EXPLAIN[x.key]; if (!e) return '';
    var l = live(x.key, x.region), title = e.title + (x.region ? ': ' + x.region : '');
    return '<div class="dim" data-act="close"></div><aside class="drawer" role="dialog" aria-label="' + esc(title) + '">' +
      '<button class="x" data-act="close" aria-label="Close">' + TIMES + '</button><h3>' + esc(title) + '</h3><div class="big">' + esc(l.v) + '</div>' +
      '<p>' + esc(e.what) + '</p><h4>How it\'s worked out</h4><p>' + esc(e.formula) + '</p><p class="mut">' + esc(l.n) + '</p>' +
      '<h4>Where to change it</h4><p>' + esc(e.where) + '</p></aside>';
  }

  // ---------- render ----------
  function tile(key, label, value) {
    return '<div class="tile" role="button" tabindex="0" data-dx="' + key + '"><div class="tl">' + esc(label) + '</div><div class="tv">' + esc(value) + '</div><div class="cue">How it\'s worked out ›</div></div>';
  }
  function chart() {
    var max = Math.max.apply(null, S.rows.map(function (r) { return r.rev || 0; }).concat([1])), h = 34, w = 520, lw = 90;
    var bars = S.rows.map(function (r, i) {
      var bw = Math.max(2, (w - lw - 120) * (r.rev || 0) / max), y = i * h + 6;
      return '<text x="0" y="' + (y + 18) + '" font-size="13" fill="' + C.ink + '">' + esc(r.region) + '</text>' +
        '<rect data-dx="region" data-region="' + esc(r.region) + '" x="' + lw + '" y="' + y + '" width="' + bw.toFixed(1) + '" height="24" rx="4" fill="' + C.blue + '" style="cursor:pointer"></rect>' +
        '<text x="' + (lw + bw + 8).toFixed(1) + '" y="' + (y + 18) + '" font-size="12" fill="' + C.mut + '">' + esc(money(r.rev)) + '</text>';
    }).join('');
    return '<svg viewBox="0 0 ' + w + ' ' + (S.rows.length * h + 8) + '" width="100%" role="img" aria-label="Revenue by region">' + bars + '</svg>';
  }
  function levers() {
    return '<table class="lv"><tr><th>Region</th><th>Growth</th><th></th></tr>' + S.rows.map(function (r) {
      return '<tr><td>' + esc(r.region) + '</td><td class="num">' + pct(r.growth) + '</td><td><button class="btn" data-act="down" data-region="' + esc(r.region) + '">' + DASH + '</button> <button class="btn" data-act="up" data-region="' + esc(r.region) + '">+</button></td></tr>';
    }).join('') + '</table>';
  }
  function render() {
    if (disposed) return;
    if (S.ptr) { S.pending = true; return; } // a re-render mid-click would replace the button under the cursor
    var rev = total('rev'), gp = total('gp'), errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; });
    root.innerHTML = '<style>' + CSS + '</style><div class="wrap">' +
      '<header><h1>Example cockpit</h1><div><button class="btn" id="resetBtn">Reset</button></div></header>' +
      (errs.length ? '<div class="err">' + errs.map(esc).join('<br>') + '</div>' : '') +
      (S.busy ? '<div class="busy">' + esc(S.busy) + '</div>' : '') +
      (!S.loaded ? '<div class="card">Loading' + ELL + '</div>' :
        '<div class="kpis">' + tile('revenue', 'Revenue', money(rev)) + tile('gp', 'Gross profit', money(gp)) + tile('margin', 'Margin', pct(rev ? gp / rev : null)) + '</div>' +
        '<div class="grid"><section class="card"><h2>Revenue by region</h2>' + chart() + '</section><section class="card"><h2>Growth by region</h2>' + levers() + '</section></div>') +
      (S.toast ? '<div class="toast ' + S.toast.kind + '">' + esc(S.toast.text) + '</div>' : '') + drawer() + '</div>';
  }
  // ---------- events (delegated on #app) ----------
  function act(t) {
    var a = t.closest && t.closest('[data-act],[data-dx],#resetBtn'); if (!a) return;
    if (a.id === 'resetBtn') { resetAll(); return; }
    var x = a.getAttribute('data-act'), dx = a.getAttribute('data-dx'), region = a.getAttribute('data-region');
    if (x === 'close') { S.explain = null; render(); }
    else if (x === 'up') nudge(region, 0.005);
    else if (x === 'down') nudge(region, -0.005);
    else if (dx && EXPLAIN[dx]) { S.explain = { key: dx, region: region }; render(); }
  }
  on(root, 'pointerdown', function () { S.ptr = true; });
  function release() { S.ptr = false; if (S.pending) { S.pending = false; timer(render, 0); } }
  on(document, 'pointerup', release);
  on(document, 'pointercancel', release);
  on(root, 'click', function (e) { act(e.target); });
  on(root, 'keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('data-dx')) { e.preventDefault(); act(e.target); } });
  on(document, 'keydown', function (e) { if (e.key === 'Escape' && S.explain) { S.explain = null; render(); } });

  root.__cleanup = function () {
    disposed = true;
    subs.forEach(function (s) { try { s.unsubscribe(); } catch (e) { } });
    timers.forEach(clearTimeout);
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2]); });
  };
  render();
})();
