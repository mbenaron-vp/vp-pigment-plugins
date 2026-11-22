(function () {
  'use strict';
  // CFO story: a Prezi-style story that zooms into itself. Read only.
  // The overview is one picture (the loop); each topic lives inside a circle on it, and deeper detail lives inside elements of each slide.
  // Source of truth: specs/reconomy/frames/cfo/cfo_story.src.js; build_cfo.py writes cfo_story.js.

  // ======================================================================
  // BRAND: the look of one customer. Another customer = this block + CFG + bindings.
  // ======================================================================
  var BRAND = {
    name: 'Reconomy',
    title: 'November forecast',
    kicker: 'CFO story',
    font: "'Montserrat', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    C: { navy: '#014664', navy2: '#00344B', navy3: '#00263A', blue: '#215DDB', blueSoft: '#E9F0FD', green: '#00CF42', greenInk: '#08843A', greenSoft: '#E2F8E9', amber: '#E8A200', amberSoft: '#FFF7E0', red: '#E5484D', redSoft: '#FDECEC', ink: '#10283A', mut: '#5B6B7A', line: '#E2E8EE', lineSoft: '#EEF2F6', bg: '#F4F7FA', cloud: '#BFD1E3', slate: '#3A5266', teal: '#0BA5A5', jade: '#00B39B', violet: '#7B61FF', gold: '#F2C94C' },
    logo: function (s, ring) {
      return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="' + (ring || '#ffffff') + '"/><path d="M14 5a9 9 0 0 1 8.5 6" fill="none" stroke="#00CF42" stroke-width="3.2" stroke-linecap="round"/><path d="M22.6 16.5A9 9 0 0 1 9 21.8" fill="none" stroke="#215DDB" stroke-width="3.2" stroke-linecap="round"/><path d="M6.2 18.4A9 9 0 0 1 10 6" fill="none" stroke="#014664" stroke-width="3.2" stroke-linecap="round"/></svg>';
    }
  };
  // ======================================================================
  // CFG: what the story reads from this model (version names, the actuals switchover, labels).
  // ======================================================================
  var CFG = {
    forecast: 'Forecast Nov 26', budget: 'Budget FY26', actualsTo: 'Oct 26', fyYear: 26, fyLabel: 'FY26', horizon: 12,
    homeCurrency: 'GBP', groupLabel: 'Loop', engines: ['Compliance schemes', 'UK managed services']
  };

  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var C = BRAND.C, FONT = BRAND.font;
  var GBP = '£', DASH = '–', ELL = '…', MID = '·';
  var DW = 1280, DH = 720, HUD = 64;
  var disposed = false, timers = [], subs = {}, listeners = [], anim = null;
  var ST_COL = { 'Not started': '#cbd5e1', 'In progress': C.gold, 'Submitted': C.violet, 'Returned': C.red, 'Approved': C.green };
  var ST_PROG = { 'Not started': 0, 'In progress': 0.35, 'Submitted': 0.75, 'Returned': 0.35, 'Approved': 1 };
  var STATUSES = ['Approved', 'Submitted', 'In progress', 'Returned', 'Not started'];

  var S = { ent: {}, lines: [], plm: {}, cs: {}, basis: {}, basisDone: false, ms: {}, fx: {}, wfs: {}, wfc: {}, stages: [], loop: {}, ccy: {}, loaded: {}, errors: {}, cur: 'root', si: 0, notes: false, intro: false };

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function nz(v) { return isNum(v) ? v : null; }
  function lab(x) { return typeof x === 'string' ? x : (x && typeof x === 'object' && typeof x.name === 'string' ? x.name : ''); }
  function sv(v) { return typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.name === 'string' ? v.name : ''); }
  function timer(fn, ms) { var t = setTimeout(function () { if (!disposed) fn(); }, ms); timers.push(t); return t; }
  function on(el, ev, fn, cap) { el.addEventListener(ev, fn, cap); listeners.push([el, ev, fn, cap]); }
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function sum(a) { var t = 0, any = false; a.forEach(function (v) { if (isNum(v)) { t += v; any = true; } }); return any ? t : null; }
  function div(a, b) { return isNum(a) && isNum(b) && b ? a / b : null; }
  function mf(v) { if (!isNum(v)) return DASH; var s = GBP + commas(Math.abs(v).toFixed(0)); return v < 0 ? '-' + s : s; }
  function bn(v, dp) {
    if (!isNum(v)) return DASH; var a = Math.abs(v), s;
    if (a >= 1e9) s = (a / 1e9).toFixed(2) + 'bn'; else if (a >= 1e6) s = (a / 1e6).toFixed(dp == null ? 1 : dp) + 'm'; else if (a >= 1e3) s = (a / 1e3).toFixed(0) + 'k'; else s = a.toFixed(0);
    return (v < 0 ? '-' : '') + GBP + s;
  }
  function sgn(v) { return isNum(v) ? (v >= 0 ? '+' : '-') + bn(Math.abs(v)) : DASH; }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 1 : dp) + '%' : DASH; }
  function names(a) { return a.length <= 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  var MN = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function MKEY(s) { var m = /^([A-Za-z]{3})\w*\s+(\d{2,4})$/.exec(s || ''); if (!m) return 0; var y = +m[2]; if (y < 100) y += 2000; return y * 12 + MN.indexOf(m[1]); }
  function mname(k) { return MN[k % 12] + ' ' + String(Math.floor(k / 12) % 100); }
  function range(a, b) { var o = []; for (var k = a; k <= b; k++) o.push(mname(k)); return o; }
  var KA = MKEY(CFG.actualsTo), KFY0 = (2000 + CFG.fyYear) * 12;
  var HORIZON = range(KA + 1, KA + CFG.horizon), FYM = range(KFY0, KFY0 + 11), PLM = range(KFY0, KA + CFG.horizon);
  var PERIOD = HORIZON[0] + ' to ' + HORIZON[HORIZON.length - 1];
  function isAct(m) { return MKEY(m) <= KA; }
  function reduced() { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }

  // ---------- data ----------
  function hasLoad(a) { for (var i = 0; i < (a || []).length; i++) { var x = a[i]; if (x && typeof x === 'object' && x.kind === 'loading') return true; } return false; }
  function ready(d) { if (!d || !d.rows) return false; for (var r = 0; r < d.rows.length; r++) { if (hasLoad(d.rows[r].labels) || hasLoad(d.rows[r].values)) return false; } return true; }
  var renderQueued = false;
  function scheduleRender() { if (renderQueued || disposed) return; renderQueued = true; timer(function () { renderQueued = false; renderWorld(); renderHud(); maybeIntro(); }, 40); }
  function sub(name, cb, filters) {
    return SDK.subscribeToDataSource(name, {
      dynamicFilters: filters || [],
      onData: function (d) {
        if (disposed || !ready(d)) return;
        delete S.errors[name];
        if (d.totalRowCount > 1000) S.errors[name + '_size'] = name + ' returns ' + d.totalRowCount + ' rows; only the first 1,000 are used.';
        try { cb(d); } catch (e) { S.errors[name] = name + ': ' + String((e && e.message) || e); }
        S.loaded[name] = true; scheduleRender();
      },
      onError: function (e) { if (disposed) return; S.errors[name] = name + ': ' + ((e && e.message) || 'could not load'); scheduleRender(); }
    });
  }
  var FV = [{ binding: 'versionList', selection: [CFG.forecast] }];
  function onEnt(d) {
    var o = {}, ls = [];
    d.rows.forEach(function (r) { var e = lab(r.labels[0]), l = lab(r.labels[1]); if (!e || !l) return; (o[e] = o[e] || {})[l] = nz(r.values[0]); if (ls.indexOf(l) < 0) ls.push(l); });
    S.ent = o; S.lines = ls;
  }
  function onPLM(d) { var o = {}; d.rows.forEach(function (r) { var m = lab(r.labels[0]), l = lab(r.labels[1]), v = lab(r.labels[2]); if (!m || !l || !v) return; ((o[v] = o[v] || {})[m] = o[v][m] || {})[l] = nz(r.values[0]); }); S.plm = o; }
  function onCS(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]), l = lab(r.labels[1]); if (!s || !l) return; if (!isNum(r.values[0]) && !isNum(r.values[1])) return; (o[s] = o[s] || {})[l] = { rev: nz(r.values[0]), gp: nz(r.values[1]) }; }); S.cs = o; }
  function onBasis(d) { d.rows.forEach(function (r) { var s = lab(r.labels[0]), l = lab(r.labels[1]); if (s && l) S.basis[s + '|' + l] = sv(r.values[0]); }); S.basisDone = true; timer(function () { if (subs.dsCSB) { try { subs.dsCSB.unsubscribe(); } catch (e) { } delete subs.dsCSB; } }, 0); }
  function onMS(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (!s) return; var v = r.values; if (!isNum(v[0])) return; o[s] = { rev: nz(v[0]), gp: nz(v[1]), inc: nz(v[2]), rec: nz(v[3]), pass: nz(v[4]) }; }); S.ms = o; }
  function onFX(d) { var o = {}; d.rows.forEach(function (r) { var c = lab(r.labels[0]); if (c) o[c] = nz(r.values[0]); }); S.fx = o; }
  function onWFS(d) { var o = {}, st = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; var w = sv(r.values[0]); if (!w) return; (o[e] = o[e] || {})[s] = w; st[s] = 1; }); S.wfs = o; S.stages = Object.keys(st).sort(); }
  function onWFC(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = { c: sv(r.values[0]), o: sv(r.values[1]), r: sv(r.values[2]) }; }); S.wfc = o; }
  function onEntP(d) { var lp = {}, cu = {}; d.rows.forEach(function (r) { var e = lab(r.labels[r.labels.length - 1]); if (!e) return; lp[e] = sv(r.values[0]); cu[e] = sv(r.values[1]); }); S.loop = lp; S.ccy = cu; }
  function startData() {
    subs.dsEnt = sub('dsEnt', onEnt, FV);
    subs.dsPLM = sub('dsPLM', onPLM, [{ binding: 'versionList', selection: [CFG.forecast, CFG.budget] }, { binding: 'monthList', selection: PLM }]);
    subs.dsCS = sub('dsCS', onCS, FV);
    subs.dsCSB = sub('dsCSB', onBasis);
    subs.dsMS = sub('dsMS', onMS, FV);
    subs.dsFX = sub('dsFX', onFX, FV);
    subs.dsWFS = sub('dsWFS', onWFS);
    subs.dsWFC = sub('dsWFC', onWFC);
    subs.dsEntP = sub('dsEntP', onEntP);
  }
  function coreLoaded() { return S.loaded.dsEnt && S.loaded.dsPLM; }

  // ---------- derived numbers ----------
  function ents() { return Object.keys(S.ent).sort(function (a, b) { return (eV(b, top()) || 0) - (eV(a, top()) || 0); }); }
  function eV(e, l) { return (S.ent[e] || {})[l]; }
  function grp(l) { return sum(ents().map(function (e) { return eV(e, l); })); }
  // A line is a subtotal when it equals the running total of the plain lines above it.
  function subMap() { var m = {}, run = 0, n = 0; S.lines.forEach(function (l, i) { var v = grp(l); if (n >= 2 && isNum(v) && Math.abs(v - run) <= Math.max(1, Math.abs(v) * 1e-6)) m[l] = 1; else { run += v || 0; n++; } }); return m; }
  function top() { return S.lines[0]; }
  function bottom() { return S.lines[S.lines.length - 1]; }
  function gpLine() { var m = subMap(); for (var i = 0; i < S.lines.length - 1; i++) if (m[S.lines[i]]) return S.lines[i]; return null; }
  function plv(v, m, l) { return ((S.plm[v] || {})[m] || {})[l]; }
  function fy(v, l) { return sum(FYM.map(function (m) { return plv(v, m, l); })); }
  function variances() { var m = subMap(); return S.lines.filter(function (l) { return !m[l]; }).map(function (l) { var f = fy(CFG.forecast, l), b = fy(CFG.budget, l); return { l: l, f: f, b: b, d: isNum(f) && isNum(b) ? f - b : null }; }); }
  function loops() {
    var o = {}, L = bottom(), G = gpLine();
    ents().forEach(function (e) { var k = S.loop[e] || 'Other'; var x = o[k] = o[k] || { name: k, ents: [], rev: 0, gp: 0, eb: 0 }; x.ents.push(e); x.rev += eV(e, top()) || 0; x.gp += (G ? eV(e, G) : 0) || 0; x.eb += eV(e, L) || 0; });
    return Object.keys(o).map(function (k) { return o[k]; }).sort(function (a, b) { return b.eb - a.eb; });
  }
  function isCostPlus(s, l) { return /cost plus|pass/i.test(S.basis[s + '|' + l] || ''); }
  function compliance() {
    var rows = [], rev = 0, gp = 0, pt = 0;
    Object.keys(S.cs).forEach(function (s) { var r = 0, g = 0; Object.keys(S.cs[s]).forEach(function (l) { var x = S.cs[s][l]; r += x.rev || 0; g += x.gp || 0; if (isCostPlus(s, l)) pt += (x.rev || 0) - (x.gp || 0); }); rows.push({ label: s, a: r, b: g }); rev += r; gp += g; });
    rows.sort(function (a, b) { return b.a - a.a; });
    return { rows: rows, rev: rev, gp: gp, pt: pt };
  }
  function services() {
    var rows = Object.keys(S.ms).map(function (k) { var x = S.ms[k]; return { label: k, inc: x.inc || 0, rec: x.rec || 0, abs: (x.inc || 0) - (x.rec || 0), pass: x.pass, rev: x.rev, gp: x.gp }; });
    rows.sort(function (a, b) { return b.inc - a.inc; });
    var t = { inc: sum(rows.map(function (r) { return r.inc; })), rec: sum(rows.map(function (r) { return r.rec; })), rev: sum(rows.map(function (r) { return r.rev; })), gp: sum(rows.map(function (r) { return r.gp; })) };
    t.abs = isNum(t.inc) && isNum(t.rec) ? t.inc - t.rec : null;
    var worst = rows.filter(function (r) { return isNum(r.pass); }).sort(function (a, b) { return a.pass - b.pass; })[0];
    return { rows: rows, t: t, worst: worst };
  }
  function fxView() {
    var o = {}, L = bottom(), T = top();
    ents().forEach(function (e) { var c = S.ccy[e] || CFG.homeCurrency; var x = o[c] = o[c] || { c: c, rev: 0, eb: 0, ents: [] }; x.rev += eV(e, T) || 0; x.eb += eV(e, L) || 0; x.ents.push(e); });
    var rows = Object.keys(o).map(function (k) { var x = o[k], r = S.fx[k]; x.rate = r; x.sens = k !== CFG.homeCurrency && isNum(r) && r ? (x.eb / r) * 0.01 : null; return x; }).sort(function (a, b) { return b.rev - a.rev; });
    var tot = sum(rows.map(function (r) { return r.rev; }));
    return { rows: rows, tot: tot };
  }
  function signoff() {
    var all = [], prog = 0;
    Object.keys(S.wfs).forEach(function (e) { S.stages.forEach(function (st) { var w = (S.wfs[e] || {})[st]; if (!w) return; var c = (S.wfc[e] || {})[st] || {}; all.push({ e: e, st: st, w: w, r: c.r, c: c.c }); prog += ST_PROG[w] || 0; }); });
    var by = {}; STATUSES.forEach(function (w) { by[w] = []; }); all.forEach(function (x) { (by[x.w] = by[x.w] || []).push(x); });
    return { all: all, by: by, pct: all.length ? prog / all.length : null };
  }
  function stShort(st) { return String(st || '').replace(/^\d+\s*/, ''); }

  // ---------- SVG charts at design size ----------
  // A portal is a circle inside a slide that holds the next, deeper slide. data-portal names the node it holds.
  function portal(id, cx, cy, r, label, side) {
    var lb = label ? '<span class="plab ' + (side || 'below') + '" data-go="' + id + '" style="left:' + (cx - 160) + 'px;top:' + (side === 'above' ? cy - r - 40 : cy + r + 10) + 'px">' + label + ' ›</span>' : '';
    return '<div class="portal" data-portal="' + id + '" data-go="' + id + '" style="left:' + (cx - r) + 'px;top:' + (cy - r) + 'px;width:' + (2 * r) + 'px;height:' + (2 * r) + 'px"></div>' + lb;
  }
  function wrap(t, n) { var w = String(t).split(' '), out = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out.slice(0, 3); }
  function waterfall(items, W, H, pt0) {
    var run = 0, bars = [], lo = 0, hi = 0;
    items.forEach(function (it) { var a, b; if (it.total) { a = 0; b = it.v || 0; } else { a = run; b = run + (it.d || 0); } run = b; bars.push({ it: it, a: a, b: b }); lo = Math.min(lo, a, b); hi = Math.max(hi, a, b); });
    var pt = 44, pb = 74, n = bars.length, slot = (W - 20) / n, bw = Math.min(110, slot * 0.6), span = (hi - lo) || 1;
    var Y = function (v) { return pt + (H - pt - pb) * (hi - v) / span; };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">', px = '';
    s += '<line x1="0" x2="' + W + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="' + C.line + '" stroke-width="2"/>';
    bars.forEach(function (b, i) {
      var x = 10 + slot * i + (slot - bw) / 2, y1 = Y(Math.max(b.a, b.b)), y2 = Y(Math.min(b.a, b.b)), h = Math.max(3, y2 - y1);
      var col = b.it.total ? (i === 0 ? C.slate : C.blue) : (b.it.d >= 0 ? C.green : C.red);
      s += '<rect x="' + x + '" y="' + y1 + '" width="' + bw + '" height="' + h + '" rx="8" fill="' + col + '"/>';
      if (i < n - 1) { var nx = 10 + slot * (i + 1) + (slot - bw) / 2; s += '<line x1="' + (x + bw) + '" x2="' + nx + '" y1="' + Y(b.b) + '" y2="' + Y(b.b) + '" stroke="' + C.cloud + '" stroke-width="2" stroke-dasharray="5 5"/>'; }
      s += '<text x="' + (x + bw / 2) + '" y="' + (y1 - 12) + '" text-anchor="middle" class="wv" fill="' + (b.it.total ? C.ink : col) + '">' + esc(b.it.total ? bn(b.it.v) : sgn(b.it.d)) + '</text>';
      wrap(b.it.label, Math.max(10, Math.floor(slot / 10.5))).forEach(function (ln, k) { s += '<text x="' + (x + bw / 2) + '" y="' + (H - pb + 28 + k * 21) + '" text-anchor="middle" class="wl">' + esc(ln) + '</text>'; });
      if (pt0 && pt0.i === i) {
        // the portal sits under the bar if there is room, otherwise above it; a dashed stem joins them
        var r = pt0.r, cx = x + bw / 2, below = (H - pb - 16) - (y2 + 26) >= 2 * r, cy = below ? y2 + 26 + r : y1 - 40 - r;
        s += '<line x1="' + cx + '" x2="' + cx + '" y1="' + (below ? y2 + 4 : y1 - 30) + '" y2="' + (below ? cy - r : cy + r) + '" stroke="' + col + '" stroke-width="3" stroke-dasharray="4 5"/>';
        px = portal(pt0.id, cx, cy, r, pt0.label, below ? 'below' : 'above');
      }
    });
    return '<div class="pwrap">' + s + '</svg>' + px + '</div>';
  }
  function lineChart(months, series, W, H) {
    var pl = 92, pr = 24, pt = 34, pb = 40, n = months.length || 1, mx = -Infinity, mn = Infinity;
    series.forEach(function (sr) { sr.v.forEach(function (v) { if (isNum(v)) { mx = Math.max(mx, v); mn = Math.min(mn, v); } }); });
    if (!isFinite(mx)) { mx = 1; mn = 0; } mn = Math.min(0, mn); mx = mx > 0 ? mx * 1.12 : 1;
    var step = (W - pl - pr) / Math.max(1, n - 1), X = function (i) { return pl + i * step; }, Y = function (v) { return pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn)); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">', na = months.filter(isAct).length;
    if (na) { var xa = X(na - 1) + step / 2; s += '<rect x="' + pl + '" y="' + pt + '" width="' + Math.max(0, xa - pl) + '" height="' + (H - pt - pb) + '" fill="' + C.bg + '"/><text x="' + (pl + 12) + '" y="' + (pt + 24) + '" class="zn">ACTUAL</text><text x="' + (xa + 12) + '" y="' + (pt + 24) + '" class="zn">FORECAST</text>'; }
    for (var g = 0; g <= 4; g++) { var gv = mn + (mx - mn) * g / 4, y = Y(gv); s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.lineSoft + '" stroke-width="1.5"/><text x="' + (pl - 12) + '" y="' + (y + 6) + '" text-anchor="end" class="ax">' + bn(gv) + '</text>'; }
    var every = Math.max(1, Math.ceil(n / 11));
    months.forEach(function (m, i) { if (i % every === 0 || (i === n - 1 && (n - 1) % every > every / 2)) s += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" class="ax">' + esc(m) + '</text>'; });
    series.forEach(function (sr) {
      var d = '', on2 = false;
      sr.v.forEach(function (v, i) { if (!isNum(v)) { on2 = false; return; } d += (on2 ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); on2 = true; });
      if (sr.fill) { var idx = sr.v.map(function (v, i) { return isNum(v) ? i : -1; }).filter(function (i) { return i >= 0; }); if (idx.length) s += '<path d="' + d + 'L' + X(idx[idx.length - 1]) + ' ' + Y(mn) + 'L' + X(idx[0]) + ' ' + Y(mn) + 'Z" fill="' + sr.c + '" fill-opacity=".10"/>'; }
      s += '<path d="' + d + '" fill="none" stroke="' + sr.c + '" stroke-width="' + (sr.w || 4) + '" stroke-linejoin="round" stroke-linecap="round"' + (sr.dash ? ' stroke-dasharray="10 8"' : '') + '/>';
      sr.v.forEach(function (v, i) { if (isNum(v) && !sr.dash) s += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="4.5" fill="#ffffff" stroke="' + sr.c + '" stroke-width="2.5"/>'; });
    });
    return s + '</svg>';
  }
  function pairBars(rows, W, rh, ca, cb, pt0) {
    var lw = 330, vc = 130, x0 = lw + 20, x1 = W - vc - 20 - (pt0 ? 2 * pt0.r + 24 : 0), mx = 0, H = rows.length * rh + 8, px = '';
    rows.forEach(function (r) { mx = Math.max(mx, Math.abs(r.a || 0), Math.abs(r.b || 0)); }); mx = mx || 1;
    var X = function (v) { return Math.max(3, (x1 - x0) * Math.max(0, v || 0) / mx); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">';
    rows.forEach(function (r, i) {
      var y = 4 + i * rh;
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label.length > 34 ? r.label.slice(0, 33) + ELL : r.label) + '</text>';
      s += '<rect x="' + x0 + '" y="' + (y + rh / 2 - 13) + '" width="' + X(r.a) + '" height="11" rx="5.5" fill="' + ca + '"/>';
      s += '<rect x="' + x0 + '" y="' + (y + rh / 2 + 2) + '" width="' + X(r.b) + '" height="14" rx="7" fill="' + cb + '"/>';
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 - 4) + '" text-anchor="end" class="bs">' + bn(r.a) + '</text><text x="' + (W - 4) + '" y="' + (y + rh / 2 + 16) + '" text-anchor="end" class="bv">' + bn(r.b) + '</text>';
      if (pt0 && i === 0) { var cx = x0 + X(r.a) + 14 + pt0.r, cy = y + rh / 2; s += '<line x1="' + (x0 + X(r.a) + 2) + '" x2="' + (cx - pt0.r) + '" y1="' + cy + '" y2="' + cy + '" stroke="' + C.navy + '" stroke-width="3" stroke-dasharray="4 4"/>'; px = portal(pt0.id, cx, cy, pt0.r, '', ''); }
    });
    return '<div class="pwrap">' + s + '</svg>' + px + '</div>';
  }
  function stackBars(rows, W, rh, cols) {
    var lw = 330, vc = 150, x0 = lw + 20, x1 = W - vc - 20, mx = 0, H = rows.length * rh + 8;
    cols = cols || [C.jade, C.red];
    rows.forEach(function (r) { mx = Math.max(mx, (r.p || 0) + (r.q || 0)); }); mx = mx || 1;
    var X = function (v) { return (x1 - x0) * Math.max(0, v || 0) / mx; };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">';
    rows.forEach(function (r, i) {
      var y = 4 + i * rh, by = y + rh / 2 - 12, a = X(r.p), b = X(r.q);
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label.length > 34 ? r.label.slice(0, 33) + ELL : r.label) + '</text>';
      if (r.p > 0) s += '<rect x="' + x0 + '" y="' + by + '" width="' + Math.max(2, a) + '" height="24" rx="6" fill="' + (r.cp || cols[0]) + '"/>';
      if (r.q > 0) s += '<rect x="' + (x0 + a + 3) + '" y="' + by + '" width="' + Math.max(2, b) + '" height="24" rx="6" fill="' + (r.cq || cols[1]) + '"/>';
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 - 4) + '" text-anchor="end" class="bv">' + r.v1 + '</text><text x="' + (W - 4) + '" y="' + (y + rh / 2 + 16) + '" text-anchor="end" class="bs">' + r.v2 + '</text>';
    });
    return s + '</svg>';
  }
  function donut(parts, R, r) {
    var tot = sum(parts.map(function (p) { return p.v; })) || 1, a0 = -Math.PI / 2, s = '<svg width="' + (R * 2) + '" height="' + (R * 2) + '" class="svg">';
    parts.forEach(function (p) {
      var f = Math.max(0, p.v) / tot, a1 = a0 + f * Math.PI * 2, big = f > 0.5 ? 1 : 0;
      if (f >= 0.999) { s += '<circle cx="' + R + '" cy="' + R + '" r="' + ((R + r) / 2) + '" fill="none" stroke="' + p.c + '" stroke-width="' + (R - r) + '"/>'; a0 = a1; return; }
      var P = function (a, rr) { return (R + rr * Math.cos(a)).toFixed(2) + ' ' + (R + rr * Math.sin(a)).toFixed(2); };
      s += '<path d="M' + P(a0, R) + 'A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + P(a1, R) + 'L' + P(a1, r) + 'A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + P(a0, r) + 'Z" fill="' + p.c + '" stroke="#ffffff" stroke-width="3"/>';
      a0 = a1;
    });
    return s + '</svg>';
  }
  function ring(f, R, w, col) { var c = 2 * Math.PI * (R - w / 2), v = Math.max(0, Math.min(1, f || 0)); return '<svg width="' + (R * 2) + '" height="' + (R * 2) + '" class="svg"><circle cx="' + R + '" cy="' + R + '" r="' + (R - w / 2) + '" fill="none" stroke="' + C.lineSoft + '" stroke-width="' + w + '"/><circle cx="' + R + '" cy="' + R + '" r="' + (R - w / 2) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + (c * v).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + R + ' ' + R + ')"/></svg>'; }
  var CUR_COL = [C.navy, C.blue, C.green, C.teal, C.violet, C.amber];
  var LOOP_COL = [C.navy, C.blue, C.jade, C.violet, C.amber, C.teal];

  // ---------- slides (each is 1280 x 720; portals hold the next level) ----------
  function head(k, h, l) { return '<div class="k">' + k + '</div><h2 class="h">' + h + '</h2>' + (l ? '<p class="l">' + l + '</p>' : ''); }
  function sTitle() {
    var T = top(), L = bottom(), rev = grp(T), eb = grp(L), f = fy(CFG.forecast, L), b = fy(CFG.budget, L);
    return '<div class="brandrow">' + BRAND.logo(56, C.navy) + '<span>' + esc(BRAND.name) + '</span></div>' +
      '<div class="k">' + esc(BRAND.kicker) + ' ' + MID + ' ' + esc(CFG.forecast) + '</div><h1 class="t1">' + esc(BRAND.title) + '</h1>' +
      '<p class="l">The next ' + CFG.horizon + ' months, ' + esc(PERIOD) + ', read live from Pigment. Click a circle to zoom into it; Esc comes back out.</p>' +
      '<div class="agenda">' + SEQ.slice(1).map(function (id, i) { return '<span data-go="' + id + '"><b>' + (i + 2) + '</b>' + esc(BY[id].t) + '</span>'; }).join('') + '</div>' +
      '<div class="heroes">' +
      hero(esc(T) + ', next 12 months', bn(rev), mf(rev), C.navy) +
      hero(esc(L) + ', next 12 months', bn(eb), CFG.fyLabel + ' ' + sgn(f - b) + ' against budget', C.blue, portal('bridge', 300, 92, 70, '', '')) +
      hero(esc(L) + ' margin', pct(div(eb, rev)), esc(L) + ' as a share of ' + esc(T), C.green) + '</div>';
  }
  function hero(label, v, sub2, col, extra) { return '<div class="hero' + (extra ? ' hp' : '') + '" style="--c:' + col + '"><div class="hl2">' + label + '</div><div class="hv">' + v + '</div><div class="hs">' + sub2 + '</div>' + (extra || '') + '</div>'; }
  function movers() { var L = bottom(); return variances().filter(function (x) { return x.l !== L && isNum(x.d); }).sort(function (a, c) { return Math.abs(c.d) - Math.abs(a.d); }); }
  function sBridge() {
    var L = bottom(), va = variances(), f = fy(CFG.forecast, L), b = fy(CFG.budget, L), d = isNum(f) && isNum(b) ? f - b : null;
    var steps = va.filter(function (x) { return x.l !== L; }), items = [{ label: CFG.budget, v: b, total: true }].concat(steps.map(function (x) { return { label: x.l, d: x.d }; })).concat([{ label: CFG.forecast, v: f, total: true }]);
    var mv = movers(), big = mv[0], bi = big ? 1 + steps.indexOf(steps.filter(function (x) { return x.l === big.l; })[0]) : -1;
    var h = CFG.fyLabel + ' ' + esc(L) + ' lands ' + bn(Math.abs(d || 0)) + (d < 0 ? ' below' : ' ahead of') + ' budget';
    var l = mv.length ? 'Biggest moves: ' + mv.slice(0, 2).map(function (x) { return esc(x.l) + ' ' + sgn(x.d); }).join(', ') + '. Actuals to ' + esc(CFG.actualsTo) + ' plus the forecast to the end of the year.' : '';
    return head(CFG.fyLabel + ': forecast against budget', h, l) + '<div class="chartbox">' + waterfall(items, 1152, 440, bi > 0 ? { i: bi, id: 'monthly', r: 78, label: 'Month by month' } : null) + '</div>';
  }
  function sMonthly() {
    var L = bottom(), M = PLM, fc = M.map(function (m) { return plv(CFG.forecast, m, L); }), bu = M.map(function (m) { return FYM.indexOf(m) >= 0 ? plv(CFG.budget, m, L) : null; });
    var f = fy(CFG.forecast, L), b = fy(CFG.budget, L);
    var below = FYM.filter(function (m) { var a = plv(CFG.forecast, m, L), c = plv(CFG.budget, m, L); return isNum(a) && isNum(c) && a < c; }).length;
    return head('Month by month', esc(L) + ': ' + below + ' of 12 ' + CFG.fyLabel + ' months below budget', 'Actuals to ' + esc(CFG.actualsTo) + ', forecast after. ' + CFG.fyLabel + ' ' + bn(f) + ' against ' + bn(b) + ' budget; the next 12 months add up to ' + bn(grp(L)) + '.') +
      '<div class="chartbox">' + lineChart(M, [{ name: CFG.forecast, v: fc, c: C.blue, fill: true }, { name: CFG.budget, v: bu, c: C.amber, dash: true, w: 3 }], 1152, 400) + '</div>' +
      '<div class="lg"><span><i style="background:' + C.blue + '"></i>' + esc(CFG.forecast) + '</span><span><i class="dsh" style="border-color:' + C.amber + '"></i>' + esc(CFG.budget) + '</span><span><i style="background:' + C.bg + ';border:1px solid ' + C.line + '"></i>Actual months</span></div>';
  }
  function sLoops() {
    var L = bottom(), lp = loops(), tot = grp(L), best = lp[0];
    var cols = lp.map(function (x, i) {
      var mx = Math.max.apply(null, x.ents.map(function (e) { return Math.abs(eV(e, L) || 0); }).concat([1]));
      return '<div class="lp" style="--c:' + LOOP_COL[i % LOOP_COL.length] + '"><div class="lpn">' + esc(x.name) + '</div><div class="lpv">' + bn(x.eb) + '</div><div class="lps">' + (x.rev > 0 ? pct(div(x.eb, x.rev)) + ' margin on ' + bn(x.rev) + ' revenue' : 'Costs only, no revenue') + '</div>' +
        x.ents.map(function (e) { var v = eV(e, L) || 0; return '<div class="er"><span>' + esc(e) + '</span><b class="' + (v < 0 ? 'neg' : '') + '">' + bn(v) + '</b><i style="width:' + Math.round(Math.abs(v) / mx * 100) + '%;background:' + (v < 0 ? C.red : 'var(--c)') + '"></i></div>'; }).join('') + '</div>';
    }).join('');
    var pos = lp.filter(function (x) { return x.eb > 0; }), neg = lp.filter(function (x) { return x.eb <= 0; }), tr = sum(lp.map(function (x) { return x.rev; })) || 1, te = sum(pos.map(function (x) { return x.eb; })) || 1;
    var seg = function (list, key, totl) { return list.map(function (x) { var f = Math.max(0, x[key]) / totl; return f > 0 ? '<i style="flex:' + f.toFixed(4) + ';background:' + LOOP_COL[lp.indexOf(x) % LOOP_COL.length] + '">' + (f > 0.12 ? esc(x.name) + ' ' + pct(f, 0) : f > 0.045 ? pct(f, 0) : '') + '</i>' : ''; }).join(''); };
    var mix = '<div class="mix"><div class="mxr"><span>Share of ' + esc(top()) + '</span><div class="mxb">' + seg(lp, 'rev', tr) + '</div></div><div class="mxr"><span>Share of ' + esc(L) + (neg.length ? ' before ' + esc(names(neg.map(function (x) { return x.name; }))) : '') + '</span><div class="mxb">' + seg(pos, 'eb', te) + '</div></div></div>';
    return head('Where the profit comes from', best ? esc(best.name) + ' earns ' + bn(best.eb) + ', ' + pct(div(best.eb, tot), 0) + ' of ' + esc(L) : '', esc(L) + ' by ' + esc(CFG.groupLabel) + ' and business over the next 12 months, ' + bn(tot) + ' in total.') + mix + '<div class="lps-row">' + cols + '</div>';
  }
  function sEngines() {
    var c = compliance(), m = services();
    var cap = function (x, t, v1, v2) { return '<div class="ecap" style="left:' + (x - 260) + 'px"><b>' + esc(t) + '</b><span>' + v1 + ' ' + MID + ' ' + v2 + '</span></div>'; };
    return head('Two engines', 'Two driver engines feed the forecast', 'Click into either engine to see how a cost change flows through to gross profit.') +
      portal('comply', 375, 445, 205, '', '') + portal('services', 905, 445, 205, '', '') +
      cap(375, CFG.engines[0], bn(c.gp) + ' gross profit', pct(div(c.gp, c.rev)) + ' margin') + cap(905, CFG.engines[1], bn(m.t.gp) + ' gross profit', pct(div(m.t.gp, m.t.rev)) + ' margin');
  }
  function sComply() {
    var c = compliance(), rows = c.rows.slice(0, 7);
    var h = c.pt > 0 ? bn(c.pt) + ' of cost passes straight through' : esc(CFG.engines[0]) + ': ' + bn(c.gp) + ' gross profit';
    var l = c.pt > 0 ? 'That is ' + pct(div(c.pt, c.rev), 0) + ' of ' + bn(c.rev) + ' revenue. When those costs move, revenue moves and gross profit holds; fixed-price lines carry the margin risk.' : '';
    return head('Engine 1 ' + MID + ' ' + esc(CFG.engines[0]), h, l) +
      '<div class="two"><div class="chartbox">' + pairBars(rows, 820, 60, C.cloud, C.navy, rows.length ? { id: 'passthru', r: 40 } : null) + '<div class="lg"><span><i style="background:' + C.cloud + '"></i>Revenue</span><span><i style="background:' + C.navy + '"></i>Gross profit</span>' + (rows.length ? '<span class="lgz">Zoom into ' + esc(rows[0].label) + ' for line-by-line detail</span>' : '') + '</div></div>' +
      '<div class="stats">' + stat('Revenue', bn(c.rev)) + stat('Gross profit', bn(c.gp)) + stat('Margin', pct(div(c.gp, c.rev))) + stat('Passed-through cost', bn(c.pt), C.green) + '</div></div>';
  }
  function sPass() {
    var c = compliance(), s = c.rows[0] ? c.rows[0].label : '', o = S.cs[s] || {}, rev = 0, gp = 0, pt = 0, risk = 0;
    var rows = Object.keys(o).map(function (l) { var x = o[l], cp = isCostPlus(s, l), cost = (x.rev || 0) - (x.gp || 0); rev += x.rev || 0; gp += x.gp || 0; if (cp) pt += cost; else risk += cost; return { label: l, p: x.gp || 0, q: cost, cq: cp ? C.green : C.cloud, cp: C.navy, v1: bn(x.rev), v2: (S.basis[s + '|' + l] ? esc(S.basis[s + '|' + l]) + ' ' + MID + ' ' : '') + pct(div(x.gp, x.rev), 0) + ' margin' }; }).sort(function (a, b) { return (b.p + b.q) - (a.p + a.q); });
    return head('Inside ' + esc(s), pt > 0 ? bn(pt) + ' of its cost is passed straight through' : 'Every line is fixed price', 'Line by line: gross profit, plus the cost behind each line. Passed-through cost moves revenue, not gross profit; fixed-price cost comes off the margin.') +
      '<div class="two"><div class="chartbox">' + stackBars(rows, 820, 74) + '<div class="lg"><span><i style="background:' + C.navy + '"></i>Gross profit</span><span><i style="background:' + C.green + '"></i>Cost passed through</span><span><i style="background:' + C.cloud + '"></i>Fixed-price cost</span></div></div>' +
      '<div class="stats">' + stat('Revenue', bn(rev)) + stat('Gross profit', bn(gp)) + stat('Passed through', bn(pt), C.green) + stat('Cost at risk', bn(risk), C.red) + '</div></div>';
  }
  function sServices() {
    var m = services(), t = m.t;
    var h = bn(t.abs) + ' of cost rises absorbed';
    var l = 'Cost increases of ' + bn(t.inc) + ' over the next 12 months; contracts pass on ' + bn(t.rec) + ' (' + pct(div(t.rec, t.inc), 0) + ').' + (m.worst ? ' ' + esc(m.worst.label) + ' passes on only ' + pct(m.worst.pass, 0) + '.' : '');
    var rows = m.rows.map(function (r) { return { label: r.label, p: r.rec, q: r.abs, v1: bn(r.inc), v2: pct(r.pass, 0) + ' passed on' }; });
    return head('Engine 2 ' + MID + ' ' + esc(CFG.engines[1]), h, l) +
      '<div class="two"><div class="chartbox">' + stackBars(rows, 820, 80) + '<div class="lg"><span><i style="background:' + C.jade + '"></i>Passed on</span><span><i style="background:' + C.red + '"></i>Absorbed</span></div></div>' +
      '<div class="stats">' + stat('Revenue', bn(t.rev)) + stat('Gross profit', bn(t.gp)) + stat('Cost increase', bn(t.inc)) + stat('Absorbed', bn(t.abs), C.red) + '</div></div>';
  }
  function tile(k, v, sub2, col) { return '<div class="tl" style="--c:' + col + '"><span>' + k + '</span><b>' + v + '</b><small>' + sub2 + '</small></div>'; }
  function stat(k, v, col) { return '<div class="st"' + (col ? ' style="--c:' + col + '"' : '') + '><span>' + k + '</span><b>' + v + '</b></div>'; }
  function sFX() {
    var x = fxView(), L = bottom(), foreign = x.rows.filter(function (r) { return r.c !== CFG.homeCurrency; }), topF = foreign.slice().sort(function (a, b) { return Math.abs(b.sens || 0) - Math.abs(a.sens || 0); })[0];
    var share = foreign.reduce(function (a, r) { return a + r.rev; }, 0), parts = x.rows.map(function (r, i) { return { v: r.rev, c: CUR_COL[i % CUR_COL.length], r: r }; });
    var h = topF ? 'A 1c move in ' + esc(topF.c) + ' moves ' + esc(L) + ' by ' + bn(Math.abs(topF.sens), 2) : 'Currency exposure';
    var l = pct(div(share, x.tot), 0) + ' of revenue is earned outside ' + esc(CFG.homeCurrency) + ' and converted at the plan rate.';
    var leg = parts.map(function (p) { return '<div class="cl"><i style="background:' + p.c + '"></i><b>' + esc(p.r.c) + '</b><span>' + pct(div(p.r.rev, x.tot), 0) + ' ' + MID + ' ' + bn(p.r.rev) + '</span></div>'; }).join('');
    var sens = foreign.map(function (r) { return '<div class="sr2"><div><b>' + esc(r.c) + '</b><span>plan rate ' + (isNum(r.rate) ? r.rate.toFixed(4) : DASH) + ' ' + GBP + ' ' + MID + ' ' + esc(names(r.ents)) + '</span></div><div class="sv">' + (isNum(r.sens) ? sgn(r.sens).replace(/^\+/, '±') : DASH) + '<small>' + esc(L) + ' per 1c</small></div></div>'; }).join('');
    var strip = '<div class="fxs">' + x.rows.map(function (r, i) { return '<div class="fxt" style="--c:' + CUR_COL[i % CUR_COL.length] + '"><span>' + esc(L) + ' earned in ' + esc(r.c) + '</span><b>' + bn(r.eb) + '</b><small>' + (r.c !== CFG.homeCurrency && isNum(r.rate) && r.rate ? esc(r.c) + ' ' + bn(r.eb / r.rate).replace(GBP, '') + ' at a plan rate of ' + r.rate.toFixed(4) : 'no conversion') + '</small></div>'; }).join('') + '</div>';
    return head('Currency', h, l) + '<div class="fxrow"><div class="dn">' + donut(parts, 150, 92) + '<div class="dnc"><b>' + bn(x.tot) + '</b><span>revenue</span></div></div><div class="cls">' + leg + '</div><div class="sens">' + sens + '</div></div>' + strip;
  }
  function sReady() {
    var so = signoff(), ret = so.by.Returned || [], wait = so.by.Submitted || [];
    var cnt = STATUSES.map(function (w) { return '<div class="sc"><i style="background:' + ST_COL[w] + '"></i><b>' + (so.by[w] || []).length + '</b><span>' + w + '</span></div>'; }).join('');
    return head('Readiness', 'Sign-off is ' + pct(so.pct, 0) + ' complete', so.all.length + ' sign-offs: ' + (so.by.Approved || []).length + ' approved, ' + wait.length + ' waiting for review, ' + ret.length + ' returned. The returns, and why, sit inside the ring.') +
      '<div class="rdy"><div class="rng">' + ring(so.pct, 150, 24, C.green) + portal('returned', 150, 150, 118, '', '') + '<div class="rngc"><b>' + pct(so.pct, 0) + '</b> round progress ' + MID + ' <span class="rr2">' + ret.length + ' returned ›</span></div></div><div class="cnts">' + cnt + '</div>' +
      '<div class="lists v">' + plist('Waiting for review', wait, ST_COL.Submitted) + plist('Still to submit', (so.by['In progress'] || []).concat(so.by['Not started'] || []), ST_COL['In progress']) + '</div></div>';
  }
  function sReturned() {
    var so = signoff(), ret = so.by.Returned || [];
    var cards = ret.map(function (x) { var c = (S.wfc[x.e] || {})[x.st] || {}; return '<div class="rc"><div class="rch"><b>' + esc(x.e) + '</b><span>' + esc(stShort(x.st)) + '</span></div><div class="rcr"><small>Why it came back</small><p>' + esc(x.r || 'No reason recorded yet.') + '</p></div>' + (c.c ? '<div class="rcn"><small>' + esc(x.e) + '’s note when it submitted</small><p>' + esc(c.c) + '</p></div>' : '') + (c.o ? '<div class="rco">Owner: ' + esc(c.o) + '</div>' : '') + '</div>'; }).join('');
    return head('Readiness ' + MID + ' returned', ret.length ? ret.length + ' stage' + (ret.length > 1 ? 's' : '') + ' sent back, and why' : 'Nothing has been sent back', 'Each return carries the reviewer’s reason and the business’s own note, read live from the workflow tracker.') + '<div class="rcs">' + (cards || '<div class="none">Every submission so far has been accepted or is waiting for review.</div>') + '</div>';
  }
  function plist(t, list, col) { return '<div class="pl"><div class="plh"><i style="background:' + col + '"></i>' + t + ' <b>' + list.length + '</b></div><div class="plc">' + (list.map(function (x) { return '<span>' + esc(x.e) + ' <small>' + esc(stShort(x.st)) + '</small></span>'; }).join('') || '<span class="nn">None</span>') + '</div></div>'; }
  function decisions() {
    var out = [], L = bottom(), va = variances().filter(function (x) { return x.l !== L && isNum(x.d); }).sort(function (a, b) { return a.d - b.d; });
    if (va[0] && va[0].d < 0) out.push({ h: esc(va[0].l) + ': ' + bn(-va[0].d) + ' worse than budget', p: 'The biggest drag on ' + CFG.fyLabel + ' ' + esc(L) + '. Agree whether it is timing or a run-rate change before the forecast is approved.' });
    var m = services(); if (isNum(m.t.abs) && m.t.abs > 0) out.push({ h: bn(m.t.abs) + ' of cost rises absorbed', p: (m.worst ? esc(m.worst.label) + ' passes on only ' + pct(m.worst.pass, 0) + '. ' : '') + 'Decide whether to reopen pass-through terms with those customers.' });
    var so = signoff(), ret = so.by.Returned || []; if (ret.length) out.push({ h: ret.length + ' stage' + (ret.length > 1 ? 's' : '') + ' sent back', p: ret.map(function (x) { return esc(x.e) + ' (' + esc(stShort(x.st)).toLowerCase() + ')'; }).join(', ') + '. Hold sign-off until the resubmissions answer the return reasons.' });
    var x = fxView(), f = x.rows.filter(function (r) { return isNum(r.sens); }).sort(function (a, b) { return Math.abs(b.sens) - Math.abs(a.sens); })[0];
    if (f) out.push({ h: esc(f.c) + ' exposure: ' + bn(Math.abs(f.sens), 2) + ' per 1c', p: pct(div(f.rev, x.tot), 0) + ' of revenue is in ' + esc(f.c) + '. Confirm the plan rate and whether to hedge the next 12 months.' });
    return out.slice(0, 4);
  }
  function sDecide() {
    var ds = decisions();
    return head('For decision', ds.length + ' decisions for the CFO', 'Each one comes straight from the numbers in this story.') + '<div class="dcs">' + ds.map(function (d, i) { return '<div class="dc"><span class="dn2">' + (i + 1) + '</span><div><b>' + d.h + '</b><p>' + d.p + '</p></div></div>'; }).join('') + '</div>';
  }
  function sClose() {
    var T = top(), L = bottom(), f = fy(CFG.forecast, L), b = fy(CFG.budget, L), so = signoff();
    return '<div class="k">' + esc(BRAND.title) + '</div><h2 class="h big">The forecast in one line</h2><p class="one">' + esc(T) + ' ' + bn(grp(T)) + ' and ' + esc(L) + ' ' + bn(grp(L)) + ' over the next 12 months. ' + CFG.fyLabel + ' ' + bn(Math.abs(f - b)) + (f < b ? ' below' : ' ahead of') + ' budget. Sign-off ' + pct(so.pct, 0) + ' complete.</p>' +
      '<div class="tiles">' + tile(esc(T), bn(grp(T)), 'next 12 months', C.navy) + tile(esc(L), bn(grp(L)), pct(div(grp(L), grp(T))) + ' margin', C.blue) + tile(CFG.fyLabel + ' against budget', sgn(f - b), esc(L), f < b ? C.red : C.green) + tile('Sign-off', pct(so.pct, 0), (so.by.Returned || []).length + ' returned', C.green) + '</div>' +
      '<div class="acts"><button class="pbtn" data-act="overview">See the whole picture</button><button class="pbtn ghost" data-act="home">Start again</button></div>';
  }
  // Talk track for the presenter, written from the same numbers.
  function notes(id) {
    var T = top(), L = bottom();
    try {
      switch (id) {
        case 'root': return 'The whole story on one picture: the headline in the middle, six topics on the loop. Click the centre to begin, or any circle to jump in.';
        case 'title': return 'Open on the three numbers: ' + bn(grp(T)) + ' of ' + T + ' and ' + bn(grp(L)) + ' of ' + L + ' over ' + PERIOD + ', a ' + pct(div(grp(L), grp(T))) + ' margin. Then zoom into the ' + L + ' tile to see how it compares with budget.';
        case 'bridge': var v = movers(); return 'Walk the bridge from budget ' + bn(fy(CFG.budget, L)) + ' to forecast ' + bn(fy(CFG.forecast, L)) + '. ' + v.slice(0, 3).map(function (x) { return x.l + ' ' + sgn(x.d); }).join(', ') + '. Zoom into the biggest bar for month by month.';
        case 'monthly': return 'Point at where actuals stop (' + CFG.actualsTo + ') and the forecast takes over. The dashed line is budget.';
        case 'loops': var lp = loops(); return lp.map(function (x) { return x.name + ' ' + bn(x.eb); }).join(', ') + '.';
        case 'engines': return 'Two driver engines sit behind the numbers. Zoom into each to show how a cost change flows through.';
        case 'comply': var c = compliance(); return bn(c.pt) + ' of ' + bn(c.rev) + ' is cost passed through at cost plus a fee, so a spike there moves revenue, not gross profit. Gross profit ' + bn(c.gp) + ' at ' + pct(div(c.gp, c.rev)) + '. Zoom into the biggest scheme for its lines.';
        case 'passthru': var c2 = compliance(); return 'Inside ' + (c2.rows[0] ? c2.rows[0].label : 'the biggest scheme') + ': green is cost passed through to members, grey is fixed-price cost that comes off margin.';
        case 'services': var m = services(); return 'Cost increases ' + bn(m.t.inc) + '; contracts recover ' + bn(m.t.rec) + ' and ' + bn(m.t.abs) + ' comes off gross profit.' + (m.worst ? ' Weakest clause: ' + m.worst.label + ' at ' + pct(m.worst.pass, 0) + '.' : '');
        case 'fx': var x = fxView(); return x.rows.map(function (r) { return r.c + ' ' + pct(div(r.rev, x.tot), 0) + ' of revenue' + (isNum(r.sens) ? ', ' + bn(Math.abs(r.sens), 2) + ' of ' + L + ' per 1c' : ''); }).join('; ') + '.';
        case 'ready': var so = signoff(); return 'Sign-off ' + pct(so.pct, 0) + ' complete. Zoom into the ring for the ' + (so.by.Returned || []).length + ' returns and why they came back.';
        case 'returned': var so2 = signoff(); return (so2.by.Returned || []).map(function (y) { return y.e + ': ' + (y.r || 'no reason yet'); }).join(' ');
        case 'decide': return decisions().map(function (d, k) { return (k + 1) + '. ' + d.h.replace(/&amp;/g, '&'); }).join('  ');
        case 'close': return 'Close on the one line, then press O to show the whole picture again.';
      }
    } catch (e) { return ''; }
    return '';
  }

  // ---------- the story tree ----------
  // root is the overview picture. Its children sit on it directly; every other node lives inside a portal of its parent.
  var NODES = [
    { id: 'root', t: 'Overview' },
    { id: 'title', parent: 'root', t: 'Headline', f: sTitle },
    { id: 'bridge', parent: 'title', t: 'Against budget', f: sBridge },
    { id: 'monthly', parent: 'bridge', t: 'Month by month', f: sMonthly },
    { id: 'loops', parent: 'root', t: 'Where profit comes from', f: sLoops, ring: 0 },
    { id: 'engines', parent: 'root', t: 'Two engines', f: sEngines, ring: 1 },
    { id: 'comply', parent: 'engines', t: 'Engine 1', f: sComply },
    { id: 'passthru', parent: 'comply', t: 'Biggest scheme', f: sPass },
    { id: 'services', parent: 'engines', t: 'Engine 2', f: sServices },
    { id: 'fx', parent: 'root', t: 'Currency', f: sFX, ring: 2 },
    { id: 'ready', parent: 'root', t: 'Readiness', f: sReady, ring: 3 },
    { id: 'returned', parent: 'ready', t: 'Returned, and why', f: sReturned },
    { id: 'decide', parent: 'root', t: 'Decisions', f: sDecide, ring: 4 },
    { id: 'close', parent: 'root', t: 'In one line', f: sClose, ring: 5 }
  ];
  var SEQ = ['title', 'bridge', 'monthly', 'loops', 'engines', 'comply', 'passthru', 'services', 'fx', 'ready', 'returned', 'decide', 'close'];
  var BY = {}; NODES.forEach(function (n) { BY[n.id] = n; });
  var RING = { rx: 1600, ry: 760, r: 285 }, HEAD_K = 0.78, OV = { x0: -1760, y0: -1190, x1: 1760, y1: 1190 };
  function ringPos(i) { var a = (-90 + 60 * i) * Math.PI / 180; return { x: RING.rx * Math.cos(a), y: RING.ry * Math.sin(a) }; }
  function pathTo(id) { var p = []; while (id) { p.unshift(id); id = BY[id] && BY[id].parent; } return p; }
  function lca(a, b) { var pa = pathTo(a), pb = pathTo(b), l = 'root'; for (var i = 0; i < Math.min(pa.length, pb.length); i++) { if (pa[i] === pb[i]) l = pa[i]; else break; } return l; }
  function isAnc(a, b) { return pathTo(b).indexOf(a) >= 0 && a !== b; }

  // Place every card: children of root by the ring geometry, the rest inside the portal measured in the parent card.
  function localOf(el, card) { var x = 0, y = 0, e = el; while (e && e !== card) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; if (e && e !== card) { x += e.clientLeft; y += e.clientTop; } } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; }
  function layout() {
    NODES.forEach(function (n) {
      if (n.id === 'root') return;
      if (n.parent === 'root') { if (n.ring == null) { n.x = 0; n.y = 0; n.k = HEAD_K; } else { var p = ringPos(n.ring); n.x = p.x; n.y = p.y; n.k = 1.62 * RING.r / DW; } }
      else {
        var P = BY[n.parent], card = root.querySelector('.card[data-id="' + P.id + '"]'), el = card && card.querySelector('[data-portal="' + n.id + '"]');
        if (el) { var q = localOf(el, card), rr = q.w / 2; n.x = P.x + (q.x + rr - DW / 2) * P.k; n.y = P.y + (q.y + rr - DH / 2) * P.k; n.k = P.k * 1.62 * rr / DW; }
        else { n.x = P.x + (DW / 2 - 90) * P.k; n.y = P.y + (DH / 2 - 60) * P.k; n.k = P.k * 0.08; }
      }
      var c = root.querySelector('.card[data-id="' + n.id + '"]');
      if (c) { c.style.left = (n.x - DW / 2).toFixed(2) + 'px'; c.style.top = (n.y - DH / 2).toFixed(2) + 'px'; c.style.transform = 'scale(' + n.k.toFixed(6) + ')'; }
    });
  }

  // ---------- camera ----------
  var cam = { x: 0, y: 0, z: 0.1, r: 0 }, navTok = 0;
  function vp() { return { w: Math.max(240, window.innerWidth), h: Math.max(200, window.innerHeight - HUD) }; }
  function camOf(id) {
    var v = vp();
    if (id === 'root') return { x: (OV.x0 + OV.x1) / 2, y: (OV.y0 + OV.y1) / 2, z: Math.min(v.w / (OV.x1 - OV.x0), v.h / (OV.y1 - OV.y0)) * 0.97, r: 0 };
    var n = BY[id]; return { x: n.x, y: n.y, z: Math.min(v.w / (DW * n.k), v.h / (DH * n.k)) * 0.92, r: 0 };
  }
  function apply(c) { var w = $('world'), v = vp(); if (!w) return; w.style.transform = 'translate(' + (v.w / 2).toFixed(1) + 'px,' + (v.h / 2).toFixed(1) + 'px) scale(' + c.z.toFixed(6) + ') translate(' + (-c.x).toFixed(3) + 'px,' + (-c.y).toFixed(3) + 'px)'; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // One leg of a flight. Zooming in keeps the destination steady on screen; zooming out keeps the place you left steady.
  function leg(a, b, u) {
    var z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * u), x, y;
    if (Math.abs(Math.log(b.z / a.z)) < 0.02) { x = a.x + (b.x - a.x) * u; y = a.y + (b.y - a.y) * u; }
    else if (b.z > a.z) { var f = a.z * (1 - u) / z; x = b.x - (b.x - a.x) * f; y = b.y - (b.y - a.y) * f; }
    else { var g = b.z * u / z; x = a.x - (a.x - b.x) * g; y = a.y - (a.y - b.y) * g; }
    return { x: x, y: y, z: z, r: 0 };
  }
  function fly(keys, done) {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    var w = $('world'); if (!w) return;
    if (reduced() || keys.length < 2) { cam = keys[keys.length - 1]; apply(cam); if (done) done(); return; }
    var v = vp(), ws = [], tot = 0;
    for (var i = 1; i < keys.length; i++) { var a = keys[i - 1], b = keys[i], d = Math.abs(Math.log(b.z / a.z)) + Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)) * Math.min(a.z, b.z) / v.w + 0.15; ws.push(d); tot += d; }
    var dur = Math.max(800, Math.min(2800, 520 + 360 * tot)), t0 = null;
    root.classList.add('flying');
    function step(ts) {
      if (disposed) return; if (t0 == null) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur), s = ease(t) * tot, k = 0;
      while (k < ws.length - 1 && s > ws[k]) { s -= ws[k]; k++; }
      cam = leg(keys[k], keys[k + 1], Math.max(0, Math.min(1, s / ws[k]))); apply(cam);
      if (t < 1) anim = requestAnimationFrame(step); else { anim = null; cam = keys[keys.length - 1]; apply(cam); root.classList.remove('flying'); if (done) done(); }
    }
    anim = requestAnimationFrame(step);
  }
  // Prezi path: out only as far as the common parent, then into the target. The element you dive into pulses first.
  function goId(id, instant) {
    if (!BY[id]) return;
    var from = S.cur, l = lca(from, id), keys = [{ x: cam.x, y: cam.y, z: cam.z, r: 0 }];
    if (l !== from && l !== id) keys.push(camOf(l));
    keys.push(camOf(id));
    S.cur = id; if (SEQ.indexOf(id) >= 0) S.si = SEQ.indexOf(id);
    markState(); renderHud();
    var pulseEl = null;
    if (!instant && (from === l) && id !== from) { var step1 = pathTo(id)[pathTo(from).length]; pulseEl = pulseTarget(from, step1); }
    var tok = ++navTok;
    var launch = function () { if (tok !== navTok) return; if (instant) { cam = keys[keys.length - 1]; apply(cam); veil(); return; } fly(keys, veil); };
    hideVeil(); if (anim) { cancelAnimationFrame(anim); anim = null; root.classList.remove('flying'); }
    if (pulseEl && !reduced()) { pulseEl.classList.add('pulse'); timer(function () { pulseEl.classList.remove('pulse'); launch(); }, 420); } else launch();
  }
  function pulseTarget(from, child) { if (!child) return null; if (from === 'root') return root.querySelector('.tc[data-go="' + child + '"]') || root.querySelector('.card[data-id="' + child + '"]'); var card = root.querySelector('.card[data-id="' + from + '"]'); return card ? card.querySelector('[data-portal="' + child + '"]') : null; }
  function next() { if (S.cur === 'root') goId(SEQ[S.si || 0]); else if (S.si < SEQ.length - 1) goId(SEQ[S.si + 1]); else goId('root'); }
  function prev() { if (S.cur === 'root') goId(SEQ[S.si || 0]); else if (S.si > 0) goId(SEQ[S.si - 1]); }
  function up() { var p = BY[S.cur] && BY[S.cur].parent; if (p) goId(p); }
  function markState() {
    root.classList.toggle('ov', S.cur === 'root');
    var cs = root.querySelectorAll('.card');
    for (var k = 0; k < cs.length; k++) { var id = cs[k].getAttribute('data-id'); cs[k].classList.toggle('cur', id === S.cur); cs[k].classList.toggle('anc', isAnc(id, S.cur)); }
  }
  // The parent context around the current slide is dimmed and blurred by four bands that leave the slide clear.
  function hideVeil() { var vl = $('veil'); if (vl) vl.classList.remove('on'); }
  function veil() {
    var vl = $('veil'); if (!vl) return;
    if (S.cur === 'root') { vl.classList.remove('on'); return; }
    var v = vp(), n = BY[S.cur], w = DW * n.k * cam.z, h = DH * n.k * cam.z, l = (v.w - w) / 2, t = (v.h - h) / 2;
    var bs = vl.children;
    bs[0].style.cssText = 'left:0;top:0;width:100%;height:' + Math.max(0, t) + 'px';
    bs[1].style.cssText = 'left:0;top:' + (t + h) + 'px;width:100%;height:' + Math.max(0, v.h - t - h) + 'px';
    bs[2].style.cssText = 'left:0;top:' + t + 'px;width:' + Math.max(0, l) + 'px;height:' + h + 'px';
    bs[3].style.cssText = 'left:' + (l + w) + 'px;top:' + t + 'px;width:' + Math.max(0, v.w - l - w) + 'px;height:' + h + 'px';
    vl.classList.add('on');
  }
  function maybeIntro() { if (S.intro || !coreLoaded()) return; S.intro = true; timer(function () { goId('title'); }, 900); }

  // ---------- render ----------
  function shell() {
    root.innerHTML = '<div class="app"><div class="stage" id="stage"><div class="world" id="world"></div><div class="veil" id="veil"><i></i><i></i><i></i><i></i></div><div class="load" id="load"><span class="spin"></span>Loading the story from Pigment' + ELL + '</div></div>' +
      '<div class="notes" id="notes"></div><div class="errs" id="errs"></div><footer class="hud" id="hud"></footer></div>';
    apply(cam);
  }
  function overviewLayer() {
    var W = OV.x1 - OV.x0, H = OV.y1 - OV.y0, ox = -OV.x0, oy = -OV.y0, rx = RING.rx, ry = RING.ry;
    var arc = function (a0, a1, col) { var P = function (a) { var t = a * Math.PI / 180; return (ox + rx * Math.cos(t)).toFixed(1) + ' ' + (oy + ry * Math.sin(t)).toFixed(1); }; return '<path d="M' + P(a0) + 'A' + rx + ' ' + ry + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + P(a1) + '" fill="none" stroke="' + col + '" stroke-width="40" stroke-linecap="round"/>'; };
    var chev = [0, 1, 2, 3, 4, 5].map(function (i) { var a = (-60 + 60 * i) * Math.PI / 180, x = ox + rx * Math.cos(a), y = oy + ry * Math.sin(a), ang = Math.atan2(ry * Math.cos(a), -rx * Math.sin(a)) * 180 / Math.PI; return '<path d="M-14 -16L10 0L-14 16" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>'; }).join('');
    var svg = '<svg class="ringsvg" style="left:' + OV.x0 + 'px;top:' + OV.y0 + 'px" width="' + W + '" height="' + H + '">' +
      '<ellipse cx="' + ox + '" cy="' + oy + '" rx="' + (rx + 120) + '" ry="' + (ry + 120) + '" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="2"/>' +
      arc(-88, 28, C.green) + arc(32, 148, C.blue) + arc(152, 268, '#5DA9D6') + chev + '</svg>';
    var circles = NODES.filter(function (n) { return n.ring != null; }).map(function (n) {
      var p = ringPos(n.ring), r = RING.r;
      return '<div class="tc" data-go="' + n.id + '" style="left:' + (p.x - r) + 'px;top:' + (p.y - r) + 'px;width:' + (2 * r) + 'px;height:' + (2 * r) + 'px"><span class="tct">' + esc(n.t) + '</span><span class="tcn">' + (SEQ.indexOf(n.id) + 1) + '</span></div>';
    }).join('');
    var brand = '<div class="ovb" style="left:' + (OV.x0 + 40) + 'px;top:' + (OV.y0 + 36) + 'px">' + BRAND.logo(120) + '<div><b>' + esc(BRAND.name) + '</b><span>' + esc(BRAND.title) + ' ' + MID + ' ' + esc(BRAND.kicker) + '</span></div></div>';
    var hint = '<div class="ovh" style="left:' + (OV.x0 + 40) + 'px;top:' + (OV.y1 - 120) + 'px">Click the centre to begin, or any circle to zoom straight in</div>';
    var glow = '<div class="hg" style="left:' + (-DW * HEAD_K / 2 - 60) + 'px;top:' + (-DH * HEAD_K / 2 - 60) + 'px;width:' + (DW * HEAD_K + 120) + 'px;height:' + (DH * HEAD_K + 120) + 'px"><span class="tcn">1</span></div>';
    return '<div class="ovl" id="ovl">' + svg + glow + circles + brand + hint + '</div>';
  }
  function renderWorld() {
    var w = $('world'); if (!w) return;
    var errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; }), eb = $('errs');
    if (eb) { eb.innerHTML = errs.map(esc).join('<br>'); eb.style.display = errs.length ? 'block' : 'none'; }
    var ld = $('load'); if (ld) ld.style.display = coreLoaded() ? 'none' : 'flex';
    if (!coreLoaded()) return;
    w.innerHTML = overviewLayer() + NODES.filter(function (n) { return n.f; }).map(function (n) {
      var inner = ''; try { inner = n.f(); } catch (e) { inner = '<p class="l">' + esc(String(e && e.message || e)) + '</p>'; }
      return '<section class="card" data-id="' + n.id + '" style="left:0;top:0"><div class="sl">' + inner + '</div></section>';
    }).join('');
    layout(); markState();
    if (S.intro && !anim) { cam = camOf(S.cur); apply(cam); veil(); }
    renderNotes();
  }
  function renderHud() {
    var h = $('hud'); if (!h) return;
    var n = SEQ.length, pth = pathTo(S.cur);
    var crumbs = pth.map(function (id, i) { return (i ? '<i>›</i>' : '') + '<button class="crumb' + (id === S.cur ? ' on' : '') + '" data-go="' + id + '">' + esc(BY[id].t) + '</button>'; }).join('');
    h.innerHTML = '<div class="hb">' + BRAND.logo(28) + '<b>' + esc(BRAND.name) + '</b></div>' +
      '<div class="hc"><button class="hbtn" data-act="prev" aria-label="Previous">‹</button><div class="cnt"><b>' + (S.cur === 'root' ? 'Overview' : (S.si + 1) + ' / ' + n) + '</b><div class="crumbs">' + crumbs + '</div></div><button class="hbtn" data-act="next" aria-label="Next">›</button></div>' +
      '<div class="hr"><button class="hbtn txt" data-act="up" title="Up one level (Esc)">Up <kbd>Esc</kbd></button><button class="hbtn txt' + (S.cur === 'root' ? ' on' : '') + '" data-act="overview">Overview <kbd>O</kbd></button><button class="hbtn txt' + (S.notes ? ' on' : '') + '" data-act="notes">Notes <kbd>N</kbd></button></div>' +
      '<div class="prog"><i style="width:' + (S.cur === 'root' ? 0 : ((S.si + 1) / n * 100)).toFixed(1) + '%"></i></div>';
    renderNotes();
  }
  function renderNotes() { var nb = $('notes'); if (!nb) return; nb.style.display = S.notes && coreLoaded() ? 'block' : 'none'; if (S.notes) nb.innerHTML = '<div class="nk">Talk track ' + MID + ' ' + esc(BY[S.cur].t) + '</div><p>' + esc(notes(S.cur)) + '</p>'; }

  // ---------- events ----------
  function onClick(e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (b) { var a = b.getAttribute('data-act'); if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'up') up(); else if (a === 'home') goId(SEQ[0]); else if (a === 'overview') { if (S.cur === 'root') goId(SEQ[S.si || 0]); else goId('root'); } else if (a === 'notes') { S.notes = !S.notes; renderHud(); } return; }
    var g = e.target.closest ? e.target.closest('[data-go]') : null;
    if (g) { var id = g.getAttribute('data-go'); if (id !== S.cur) goId(id); return; }
    if (!coreLoaded() || !e.target.closest || !e.target.closest('#stage')) return;
    var c = e.target.closest('.card');
    if (c) { var cid = c.getAttribute('data-id'); if (cid !== S.cur) { goId(cid); return; } }
    if (S.cur !== 'root') next();
  }
  function onKey(e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Escape' || k === 'Backspace') { e.preventDefault(); if (S.notes && k === 'Escape') { S.notes = false; renderHud(); } else up(); }
    else if (k === 'Home') { e.preventDefault(); goId(SEQ[0]); }
    else if (k === 'End') { e.preventDefault(); goId(SEQ[SEQ.length - 1]); }
    else if (k === 'o' || k === 'O') { if (S.cur === 'root') goId(SEQ[S.si || 0]); else goId('root'); }
    else if (k === 'n' || k === 'N') { S.notes = !S.notes; renderHud(); }
  }
  var rzT = null;
  function onResize() { if (rzT) clearTimeout(rzT); rzT = timer(function () { cam = camOf(S.cur); apply(cam); veil(); }, 80); }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.app{position:absolute;inset:0;font-family:' + FONT + ';color:' + C.ink + ';-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums;background:' + C.navy2 + '}',
    '.app *{box-sizing:border-box}.app h1,.app h2,.app p{margin:0;font-family:inherit}',
    '.stage{position:absolute;left:0;top:0;right:0;bottom:' + HUD + 'px;overflow:hidden;background:radial-gradient(1400px 900px at 30% 25%,#0A5A80 0%,' + C.navy + ' 42%,' + C.navy3 + ' 100%);cursor:pointer;user-select:none}',
    '.stage::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:56px 56px}',
    '.world{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0}',
    '.ovl{position:absolute;left:0;top:0;transition:opacity .6s}.app:not(.ov) .ovl{opacity:.45}',
    '.ringsvg{position:absolute;pointer-events:none}',
    '.tc{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 40%,#ffffff 0%,' + C.bg + ' 100%);box-shadow:0 30px 90px rgba(0,10,20,.5),0 0 0 14px rgba(255,255,255,.12);cursor:pointer;transition:box-shadow .3s}',
    '.tc:hover{box-shadow:0 30px 90px rgba(0,10,20,.5),0 0 0 18px ' + C.green + '}',
    '.tct{position:absolute;left:105px;right:105px;top:48px;height:96px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:31px;font-weight:800;line-height:1.12;color:' + C.navy + '}',
    '.tcn{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);width:62px;height:62px;border-radius:50%;background:' + C.green + ';color:' + C.navy2 + ';font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.hg{position:absolute;border-radius:70px;background:rgba(255,255,255,.06);border:3px solid rgba(255,255,255,.14)}.hg .tcn{bottom:auto;top:-31px}',
    '.ovb{position:absolute;display:flex;align-items:center;gap:30px;color:#ffffff}.ovb b{display:block;font-size:92px;font-weight:800;line-height:1}.ovb span{display:block;font-size:44px;opacity:.75;margin-top:10px}',
    '.ovh{position:absolute;font-size:38px;color:rgba(255,255,255,.6);white-space:nowrap}',
    '.card{position:absolute;width:' + DW + 'px;height:' + DH + 'px;transform-origin:50% 50%;background:#ffffff;border-radius:30px;box-shadow:0 30px 90px rgba(0,10,20,.4);transition:opacity .6s}',
    '.card::before{content:"";position:absolute;left:64px;top:26px;width:96px;height:6px;border-radius:3px;background:linear-gradient(90deg,' + C.green + ',' + C.blue + ')}',
    '.sl{position:absolute;inset:0;padding:54px 64px 40px;border-radius:30px;overflow:hidden}',
    '.portal{position:absolute;border-radius:50%;background:' + C.bg + ';border:5px solid ' + C.blue + ';box-shadow:0 10px 30px rgba(0,30,60,.25);cursor:zoom-in;z-index:1}',
    '.portal::after{content:"";position:absolute;inset:-14px;border-radius:50%;border:3px solid ' + C.green + ';opacity:0}',
    '.pulse::after,.tc.pulse{animation:pz .42s ease-out}@keyframes pz{0%{opacity:.9;transform:scale(.92)}100%{opacity:0;transform:scale(1.25)}}',
    '.tc.pulse{box-shadow:0 0 0 26px ' + C.green + '}',
    '.plab{position:absolute;width:320px;text-align:center;font-size:17px;font-weight:800;color:' + C.blue + ';cursor:zoom-in;z-index:1}',
    '.pwrap{position:relative}',
    '.veil{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .45s}.veil.on{opacity:1}.veil i{position:absolute;display:block;background:rgba(0,22,36,.38);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}',
    '.flying .card{transition:none}',
    '.k{font-size:16px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:' + C.blue + '}',
    '.h{font-size:44px;font-weight:800;color:' + C.navy + ';line-height:1.12;margin:12px 0 10px;letter-spacing:-.01em}.h.big{font-size:60px;margin-top:20px}',
    '.l{font-size:21px;color:' + C.mut + ';line-height:1.5;max-width:1080px}',
    '.brandrow{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:800;color:' + C.navy + ';margin-bottom:30px}',
    '.t1{font-size:84px;font-weight:800;color:' + C.navy + ';letter-spacing:-.02em;line-height:1.02;margin:14px 0 16px}',
    '.agenda{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;max-width:1150px}.agenda span{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:' + C.navy + ';background:' + C.blueSoft + ';border-radius:999px;padding:7px 14px 7px 7px;cursor:pointer}.agenda span:hover{background:' + C.cloud + '}.agenda b{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:' + C.navy + ';color:#ffffff;font-size:12px}',
    '.heroes{position:absolute;left:64px;right:64px;bottom:48px;display:grid;grid-template-columns:1fr 1.25fr 1fr;gap:22px}',
    '.hero{position:relative;border-radius:22px;background:' + C.bg + ';padding:22px 26px;border-left:8px solid var(--c);height:184px}.hero.hp{padding-right:170px}.hl2{font-size:17px;font-weight:700;color:' + C.mut + '}.hv{font-size:56px;font-weight:800;color:' + C.navy + ';letter-spacing:-.02em;line-height:1.1;margin-top:6px}.hs{font-size:16px;color:' + C.mut + ';margin-top:4px}',
    '.chartbox{margin-top:22px}.svg{display:block;overflow:visible}.svg text{font-family:' + FONT + '}',
    '.wv{font-size:19px;font-weight:800}.wl{font-size:16px;fill:' + C.mut + ';font-weight:600}.ax{font-size:15px;fill:' + C.mut + '}.zn{font-size:13px;font-weight:800;letter-spacing:.12em;fill:' + C.mut + '}',
    '.bl{font-size:18px;fill:' + C.ink + ';font-weight:600}.bv{font-size:18px;font-weight:800;fill:' + C.ink + '}.bs{font-size:15px;fill:' + C.mut + '}',
    '.lg{display:flex;gap:26px;font-size:16px;color:' + C.mut + ';margin-top:14px;align-items:center;flex-wrap:wrap}.lg i{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:8px;vertical-align:-1px}.lg i.dsh{border-top:3px dashed;height:0;width:26px;border-radius:0}.lgz{color:' + C.blue + ';font-weight:700}',
    '.lps-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:18px;margin-top:26px}',
    '.lp{background:' + C.bg + ';border-radius:20px;padding:20px 22px;border-top:8px solid var(--c);min-width:0}.lpn{font-size:16px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--c)}.lpv{font-size:40px;font-weight:800;color:' + C.navy + ';margin:4px 0 2px}.lps{font-size:14px;color:' + C.mut + ';margin-bottom:16px;line-height:1.4}',
    '.er{position:relative;display:flex;justify-content:space-between;gap:10px;font-size:16px;padding:8px 0 14px;border-top:1px solid ' + C.line + '}.er span{font-weight:600;min-width:0;line-height:1.3}.er b{font-weight:800;color:' + C.ink + '}.er b.neg{color:' + C.red + '}.er i{position:absolute;left:0;bottom:4px;height:5px;border-radius:3px}',
    '.ecap{position:absolute;top:662px;width:520px;text-align:center}.ecap b{display:block;font-size:24px;color:' + C.navy + '}.ecap span{font-size:16px;color:' + C.mut + '}',
    '.two{display:grid;grid-template-columns:820px 1fr;gap:28px;align-items:start}',
    '.stats{display:grid;gap:14px;margin-top:26px}.st{background:' + C.bg + ';border-radius:18px;padding:16px 20px;border-left:6px solid var(--c,' + C.navy + ')}.st span{display:block;font-size:15px;color:' + C.mut + ';font-weight:700}.st b{display:block;font-size:34px;font-weight:800;color:' + C.navy + ';margin-top:2px}',
    '.fxrow{display:grid;grid-template-columns:300px 250px 1fr;gap:34px;align-items:center;margin-top:34px}.dn{position:relative;width:300px;height:300px}.dnc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}.dnc b{font-size:34px;font-weight:800;color:' + C.navy + '}.dnc span{font-size:15px;color:' + C.mut + '}',
    '.cls{display:grid;gap:16px}.cl{display:grid;grid-template-columns:18px 64px 1fr;gap:10px;align-items:center;font-size:17px}.cl i{width:18px;height:18px;border-radius:50%}.cl b{font-size:22px;color:' + C.navy + '}.cl span{color:' + C.mut + '}',
    '.sens{display:grid;gap:16px}.sr2{display:flex;justify-content:space-between;gap:18px;align-items:center;background:' + C.bg + ';border-radius:18px;padding:18px 22px}.sr2 b{font-size:26px;color:' + C.navy + ';display:block}.sr2 span{font-size:15px;color:' + C.mut + '}.sv{font-size:36px;font-weight:800;color:' + C.blue + ';text-align:right;white-space:nowrap}.sv small{display:block;font-size:14px;color:' + C.mut + ';font-weight:600}',
    '.fxs{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:16px;margin-top:26px}.fxt{background:' + C.bg + ';border-radius:18px;padding:16px 20px;border-left:6px solid var(--c)}.fxt span{display:block;font-size:15px;font-weight:700;color:' + C.mut + '}.fxt b{display:block;font-size:32px;font-weight:800;color:' + C.navy + ';margin-top:2px}.fxt small{font-size:14px;color:' + C.mut + '}',
    '.rdy{display:grid;grid-template-columns:300px 220px 1fr;gap:34px;align-items:start;margin-top:26px}.rng{position:relative;width:300px;height:300px}.rngc{position:absolute;left:-40px;right:-40px;top:312px;text-align:center;font-size:17px;color:' + C.mut + '}.rngc b{font-size:26px;color:' + C.navy + '}.rr2{color:' + C.red + ';font-weight:800}',
    '.cnts{display:grid;gap:14px;margin-top:20px}.sc{display:grid;grid-template-columns:16px 44px 1fr;gap:10px;align-items:center;font-size:17px}.sc i{width:16px;height:16px;border-radius:50%}.sc b{font-size:28px;color:' + C.navy + '}.sc span{color:' + C.mut + '}',
    '.lists{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px}.lists.v{grid-template-columns:1fr;margin-top:0}.pl{background:' + C.bg + ';border-radius:18px;padding:16px 20px}.plh{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:' + C.mut + '}.plh i{width:14px;height:14px;border-radius:50%}.plh b{color:' + C.navy + ';font-size:18px}.plc{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.plc span{background:#ffffff;border:1px solid ' + C.line + ';border-radius:999px;padding:6px 14px;font-size:16px;font-weight:700;color:' + C.ink + '}.plc small{font-weight:500;color:' + C.mut + ';font-size:13px;margin-left:4px}.plc .nn{color:' + C.mut + ';font-weight:500}',
    '.rcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:22px;margin-top:28px}.rc{background:' + C.redSoft + ';border-radius:22px;padding:24px 26px;border-left:8px solid ' + C.red + '}.rch{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.rch b{font-size:30px;color:' + C.navy + '}.rch span{font-size:15px;color:' + C.mut + '}',
    '.rc small{display:block;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + C.red + ';margin-bottom:6px}.rcr{margin-top:16px}.rcr p{font-size:23px;line-height:1.45;color:' + C.ink + ';font-weight:600}.rcn{margin-top:18px;background:#ffffff;border-radius:14px;padding:14px 16px}.rcn small{color:' + C.mut + '}.rcn p{font-size:17px;line-height:1.45;color:' + C.ink + '}.rco{margin-top:12px;font-size:15px;color:' + C.mut + '}.none{font-size:19px;color:' + C.mut + '}',
    '.chip{display:inline-block;border-radius:999px;padding:3px 12px;font-weight:700;font-size:14px}',
    '.dcs{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:20px;margin-top:28px;height:440px}.dc{display:flex;gap:20px;background:' + C.bg + ';border-radius:22px;padding:28px 28px;border-left:8px solid ' + C.blue + '}.dn2{flex:none;width:54px;height:54px;border-radius:50%;background:' + C.navy + ';color:#ffffff;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center}.dc b{display:block;font-size:27px;color:' + C.navy + ';line-height:1.25}.dc p{font-size:19px;color:' + C.mut + ';line-height:1.5;margin-top:10px}',
    '.one{font-size:32px;line-height:1.4;color:' + C.ink + ';font-weight:600;margin-top:18px;max-width:1120px}',
    '.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:40px}.tl{background:' + C.bg + ';border-radius:20px;padding:20px 22px;border-left:8px solid var(--c)}.tl span{display:block;font-size:15px;font-weight:700;color:' + C.mut + '}.tl b{display:block;font-size:40px;font-weight:800;color:' + C.navy + ';margin:4px 0 2px}.tl small{font-size:14px;color:' + C.mut + '}',
    '.mix{display:grid;gap:10px;margin-top:22px}.mxr{display:grid;grid-template-columns:330px 1fr;gap:18px;align-items:center}.mxr span{font-size:16px;font-weight:700;color:' + C.mut + ';text-align:right}.mxb{display:flex;gap:3px;height:38px;border-radius:12px;overflow:hidden;background:' + C.bg + '}.mxb i{display:flex;align-items:center;padding-left:12px;color:#ffffff;font-style:normal;font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden}',
    '.acts{position:absolute;left:64px;bottom:52px;display:flex;gap:16px}.pbtn{font:inherit;font-size:20px;font-weight:700;border-radius:14px;padding:14px 26px;border:2px solid ' + C.blue + ';background:' + C.blue + ';color:#ffffff;cursor:pointer}.pbtn.ghost{background:#ffffff;color:' + C.blue + '}',
    '.neg{color:' + C.red + '}',
    '.hud{position:absolute;left:0;right:0;bottom:0;height:' + HUD + 'px;background:' + C.navy3 + ';color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;border-top:1px solid rgba(255,255,255,.08)}',
    '.hb{display:flex;align-items:center;gap:10px;min-width:0}.hb b{font-size:15px}',
    '.hc{display:flex;align-items:center;gap:14px;min-width:0}.cnt{display:flex;flex-direction:column;align-items:center;min-width:0;line-height:1.2}.cnt>b{font-size:13px;opacity:.75}',
    '.crumbs{display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;max-width:56vw}.crumbs i{font-style:normal;opacity:.45;font-size:13px}.crumb{font:inherit;font-size:14px;color:rgba(255,255,255,.72);background:none;border:0;padding:2px 4px;border-radius:6px;cursor:pointer}.crumb:hover{background:rgba(255,255,255,.1);color:#ffffff}.crumb.on{color:#ffffff;font-weight:800}',
    '.hr{display:flex;gap:8px}.hbtn{font:inherit;font-size:22px;font-weight:700;width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#ffffff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}.hbtn:hover{background:rgba(255,255,255,.14)}',
    '.hbtn.txt{width:auto;padding:0 14px;font-size:13px}.hbtn.on{background:' + C.green + ';color:' + C.navy2 + ';border-color:' + C.green + '}.hbtn kbd{font-family:inherit;font-size:11px;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,.16)}.hbtn.on kbd{background:rgba(0,0,0,.12)}',
    '.prog{position:absolute;left:0;right:0;top:-3px;height:3px;background:rgba(255,255,255,.08)}.prog i{display:block;height:100%;background:linear-gradient(90deg,' + C.green + ',' + C.blue + ');transition:width .6s}',
    '.notes{position:absolute;left:50%;bottom:' + (HUD + 16) + 'px;transform:translateX(-50%);width:min(860px,calc(100% - 32px));background:rgba(0,26,40,.92);color:#ffffff;border-radius:16px;padding:16px 20px;display:none;box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:5}.nk{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + C.green + ';margin-bottom:6px}.notes p{font-size:15px;line-height:1.55;margin:0}',
    '.errs{position:absolute;left:16px;top:16px;max-width:560px;background:' + C.redSoft + ';color:' + C.red + ';border-radius:12px;padding:10px 14px;font-size:12px;display:none;z-index:6}',
    '.load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;color:#ffffff;font-size:15px}.spin{width:18px;height:18px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#ffffff;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}',
    '@media (prefers-reduced-motion:reduce){.spin,.pulse::after,.tc.pulse{animation:none}.prog i,.veil,.ovl,.card{transition:none}}',
    '@media (max-width:900px){.hb b{display:none}.hbtn.txt kbd{display:none}.hbtn.txt{padding:0 10px}.hud{padding:0 10px;gap:8px}.crumbs{max-width:42vw}}',
    '@media (max-width:560px){.hr .hbtn.txt:first-child{display:none}.hb{display:none}.crumbs{max-width:50vw}}'
  ].join('\n');
  document.head.appendChild(css);

  shell();
  renderHud();
  on(root, 'click', onClick);
  on(document, 'keydown', onKey);
  on(window, 'resize', onResize);
  cam = camOf('root'); apply(cam);

  root.__cleanup = function () {
    disposed = true;
    if (anim) cancelAnimationFrame(anim);
    timers.forEach(clearTimeout);
    Object.keys(subs).forEach(function (k) { try { subs[k] && subs[k].unsubscribe && subs[k].unsubscribe(); } catch (e) { } });
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    if (css.parentNode) css.parentNode.removeChild(css);
  };

  if (!SDK) { S.errors.sdk = 'The Pigment SDK is not available.'; renderWorld(); return; }
  startData();
})();
