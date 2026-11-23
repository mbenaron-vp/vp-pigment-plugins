(function () {
  'use strict';
  // OKEA board pack story: a Prezi-style story that zooms into itself. Read only.
  // The overview is one picture: the headline sits on the host in the middle, six topics sit around it like subsea
  // templates tied back by flowlines, and deeper detail lives inside elements of each slide (portals).
  // Source of truth: specs/okea/frames/story/okea_story.src.js; build_story.py writes okea_story.js.

  // ======================================================================
  // BRAND: the look of one customer. Another customer = this block + CFG + bindings.
  // ======================================================================
  // The OKEA logo (okea.no wordmark) as inline SVG; frames can't load image files. h = height in px.
  function okeaLogo(h, fill) {
    var w = Math.round(h * 782 / 216);
    return '<svg class="okea-logo" width="' + w + '" height="' + h + '" viewBox="10 15 782 216" role="img" aria-label="OKEA">' +
      '<circle cx="119.5" cy="127" r="88.3" fill="none" stroke="' + fill + '" stroke-width="40.2"/>' +
      '<g fill="' + fill + '"><path d="M328 26H381.5L298.5 126.5L382 227H327.5L247 126.5Z"/>' +
      '<rect x="409" y="28" width="165" height="41" rx="2"/><rect x="409" y="112" width="117" height="41" rx="2"/><rect x="409" y="189" width="165" height="41" rx="2"/>' +
      '<path d="M691.5 16L791 230H745.5L691 111L636 230H591Z"/></g></svg>';
  }
  var BRAND = {
    name: 'OKEA',
    title: 'Statfjord area',
    kicker: 'Board pack story',
    font: "'Montserrat', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    C: { navy: '#06486D', navy2: '#033955', navy3: '#022B41', blue: '#49AEEF', blueSoft: '#E4F3FC', sky: '#98D9F7', green: '#88C249', greenInk: '#538B3E', greenSoft: '#EEF6E4', amber: '#FFC938', amberSoft: '#FFF6DA', orange: '#EF6C22', orangeSoft: '#FDEBDD', ink: '#161614', mut: '#626260', line: '#DBD7CF', lineSoft: '#EBEAE3', bg: '#F2F1ED', paper: '#FBF9F8', cloud: '#C5BCB9' },
    series: ['#06486D', '#49AEEF', '#88C249', '#FFC938', '#98D9F7', '#538B3E', '#C5BCB9', '#EF6C22'],
    // the OKEA logo: h = height in px
    logo: function (h, fill) { return okeaLogo(h, fill || '#ffffff'); }
  };
  // ======================================================================
  // CFG: what the story reads from this model (round names, forecast year, units).
  // ======================================================================
  var CFG = {
    round: '7+5', prev: '4+8', fyNum: 26, firstYear: 26, lastYear: 40,
    unit: 'mNOK', prodUnit: 'kboe', rateUnit: 'boe/d', boeUnit: 'NOK/boe', co2Unit: 'kt',
    illustrative: 'Earlier rounds’ costs and the CO2 price path are illustrative.'
  };

  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var C = BRAND.C, FONT = BRAND.font, SER = BRAND.series;
  var DASH = '–', ELL = '…', MID = '·';
  var DW = 1280, DH = 720, HUD = 64;
  var disposed = false, timers = [], subs = {}, listeners = [], anim = null;
  var ST_COL = { 'Not started': C.cloud, 'In progress': C.amber, 'Submitted': C.blue, 'Returned': C.orange, 'Approved': C.green };
  var ST_PROG = { 'Not started': 0, 'In progress': 0.35, 'Submitted': 0.75, 'Returned': 0.35, 'Approved': 1 };
  var STATUSES = ['Approved', 'Submitted', 'In progress', 'Returned', 'Not started'];
  var MN = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  var FY = 'FY ' + CFG.fyNum, FYL = 'FY' + CFG.fyNum;
  var YEARS = []; for (var yi = CFG.firstYear; yi <= CFG.lastYear; yi++) YEARS.push('FY ' + yi);
  var FYMONTHS = MN.map(function (m) { return m + ' ' + CFG.fyNum; });
  var DAYS = ((2000 + CFG.fyNum) % 4 === 0) ? 366 : 365;

  var S = { ay: {}, cls: {}, rsn: {}, prd: {}, co2: {}, wi: {}, wfs: {}, wfc: {}, stages: [], loaded: {}, errors: {}, cur: 'root', si: 0, notes: false, intro: false, dstack: [] };

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
  function f0(v) { return isNum(v) ? (v < -0.5 ? '-' : '') + commas(Math.abs(v).toFixed(0)) : DASH; }
  function f1(v) { return isNum(v) ? (v < -0.05 ? '-' : '') + commas(Math.abs(v).toFixed(1)) : DASH; }
  function sg(v) { return isNum(v) ? (v >= 0.05 ? '+' : v <= -0.05 ? '-' : '') + commas(Math.abs(v).toFixed(1)) : DASH; }
  function sg0(v) { return isNum(v) ? (v >= 0.5 ? '+' : v <= -0.5 ? '-' : '') + commas(Math.abs(v).toFixed(0)) : DASH; }
  function mn(v) { return f1(v) + ' ' + CFG.unit; }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 1 : dp) + '%' : DASH; }
  function yl(y) { return String(y).replace(' ', ''); }
  function names(a) { return a.length <= 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function stShort(st) { return String(st || '').replace(/^\d+\s*/, ''); }
  function niceMax(v, n) { if (!(v > 0)) return n; var raw = v / n, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p, s = 10; [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].some(function (c) { if (m <= c + 1e-9) { s = c; return true; } return false; }); return s * p * n; }
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
  var ROUNDS = [CFG.round, CFG.prev];
  function onAY(d) { var o = {}; d.rows.forEach(function (r) { var a = lab(r.labels[0]), y = lab(r.labels[1]), v = lab(r.labels[2]); if (!a || !y || !v) return; ((o[v] = o[v] || {})[a] = o[v][a] || {})[y] = { cost: nz(r.values[0]), prod: nz(r.values[1]), prdx: nz(r.values[2]), opex: nz(r.values[3]) }; }); S.ay = o; }
  function onClass(d) { var o = {}; d.rows.forEach(function (r) { var a = lab(r.labels[0]), c = lab(r.labels[1]), v = lab(r.labels[2]); if (!a || !c || !v) return; ((o[v] = o[v] || {})[a] = o[v][a] || {})[c] = nz(r.values[0]); }); S.cls = o; }
  function onReason(d) { var o = {}, ord = []; d.rows.forEach(function (r) { var a = lab(r.labels[0]), x = lab(r.labels[1]); if (!a || !x) return; (o[x] = o[x] || {})[a] = nz(r.values[0]); if (ord.indexOf(x) < 0) ord.push(x); }); S.rsn = o; S.rsnOrd = ord; }
  function onProduct(d) { var o = {}; d.rows.forEach(function (r) { var a = lab(r.labels[0]), p = lab(r.labels[1]), v = lab(r.labels[2]); if (!a || !p || !v) return; ((o[v] = o[v] || {})[a] = o[v][a] || {})[p] = (o[v][a][p] || 0) + (nz(r.values[0]) || 0); }); S.prd = o; }
  function onCO2(d) { var o = {}; d.rows.forEach(function (r) { var y = lab(r.labels[0]), v = lab(r.labels[1]); if (!y || !v) return; (o[v] = o[v] || {})[y] = { tax: nz(r.values[0]), price: nz(r.values[1]) }; }); S.co2 = o; }
  function onWFS(d) { var o = {}, st = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; var w = sv(r.values[0]); if (!w) return; (o[e] = o[e] || {})[s] = w; st[s] = 1; }); S.wfs = o; S.stages = Object.keys(st).sort(); }
  function onWFC(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = { c: sv(r.values[0]), o: sv(r.values[1]), r: sv(r.values[2]) }; }); S.wfc = o; }
  function onAssetP(d) { var o = {}; d.rows.forEach(function (r) { var a = lab(r.labels[r.labels.length - 1]); if (a) o[a] = nz(r.values[0]); }); S.wi = o; timer(function () { if (subs.dsAssetP) { try { subs.dsAssetP.unsubscribe(); } catch (e) { } delete subs.dsAssetP; } }, 0); }
  function startData() {
    var FV = { binding: 'versionList', selection: ROUNDS };
    subs.dsAY = sub('dsAY', onAY, [FV, { binding: 'yearList', selection: YEARS }]);
    subs.dsClass = sub('dsClass', onClass, [FV]);
    subs.dsReason = sub('dsReason', onReason, [{ binding: 'versionList', selection: [CFG.round] }]);
    subs.dsProduct = sub('dsProduct', onProduct, [FV, { binding: 'monthList', selection: FYMONTHS }]);
    subs.dsCO2 = sub('dsCO2', onCO2, [{ binding: 'versionList', selection: [CFG.round] }, { binding: 'yearList', selection: YEARS }]);
    subs.dsWFS = sub('dsWFS', onWFS);
    subs.dsWFC = sub('dsWFC', onWFC);
    subs.dsAssetP = sub('dsAssetP', onAssetP);
  }
  function coreLoaded() { return S.loaded.dsAY && S.loaded.dsClass; }

  // ---------- derived numbers ----------
  function ay(v, a, y) { return ((S.ay[v] || {})[a] || {})[y] || {}; }
  function prodA(a, v) { return ay(v || CFG.round, a, FY).prod; }
  function assets() {
    var o = {}; Object.keys(S.ay[CFG.round] || {}).forEach(function (a) { o[a] = 1; }); Object.keys(S.cls[CFG.round] || {}).forEach(function (a) { o[a] = 1; });
    return Object.keys(o).sort(function (a, b) { return (prodA(b) || 0) - (prodA(a) || 0) || a.localeCompare(b); });
  }
  function acol(a) { var i = assets().indexOf(a); return SER[(i < 0 ? 0 : i) % SER.length]; }
  function prodT(v) { return sum(assets().map(function (a) { return prodA(a, v); })); }
  function costA(a, v) { var o = ((S.cls[v || CFG.round] || {})[a]) || {}; return sum(Object.keys(o).map(function (c) { return o[c]; })); }
  function costT(v) { return sum(assets().map(function (a) { return costA(a, v); })); }
  function boed(k) { return isNum(k) ? k * 1000 / DAYS : null; }
  function classes() {
    var o = {};
    ROUNDS.forEach(function (v) { Object.keys(S.cls[v] || {}).forEach(function (a) { var x = S.cls[v][a]; Object.keys(x).forEach(function (c) { var z = o[c] = o[c] || { c: c, r: 0, p: 0, by: {} }; if (v === CFG.round) { z.r += x[c] || 0; (z.by[a] = z.by[a] || { r: 0, p: 0 }).r += x[c] || 0; } else { z.p += x[c] || 0; (z.by[a] = z.by[a] || { r: 0, p: 0 }).p += x[c] || 0; } }); }); });
    return Object.keys(o).map(function (k) { var z = o[k]; z.d = z.r - z.p; return z; }).filter(function (z) { return Math.abs(z.r) >= 0.05 || Math.abs(z.p) >= 0.05; }).sort(function (a, b) { return b.r - a.r; });
  }
  function prdxA(a, v) { return ay(v || CFG.round, a, FY).prdx; }
  function opexA(a, v) { return ay(v || CFG.round, a, FY).opex; }
  function wavg(fn, v) { var n = 0, d = 0; assets().forEach(function (a) { var x = fn(a, v), p = prodA(a, v); if (isNum(x) && isNum(p)) { n += x * p; d += p; } }); return d ? n / d : null; }
  function products(v) {
    var o = {}, per = (S.prd[v || CFG.round]) || {};
    Object.keys(per).forEach(function (a) { Object.keys(per[a]).forEach(function (p) { o[p] = (o[p] || 0) + (per[a][p] || 0); }); });
    return Object.keys(o).map(function (p) { return { p: p, v: o[p] }; }).sort(function (a, b) { return b.v - a.v; });
  }
  function reasons() {
    return (S.rsnOrd || []).map(function (x) { var by = S.rsn[x] || {}; return { r: x, d: sum(Object.keys(by).map(function (a) { return by[a]; })) || 0, by: by }; }).filter(function (z) { return Math.abs(z.d) >= 0.05; });
  }
  function bridge() {
    var p = costT(CFG.prev), r = costT(CFG.round), steps = reasons().map(function (z) { return { label: z.r, d: z.d }; });
    var rem = isNum(p) && isNum(r) ? (r - p) - (sum(steps.map(function (s) { return s.d; })) || 0) : 0;
    if (Math.abs(rem) >= 0.05) steps.push({ label: 'No reason given yet', d: rem, none: true });
    return { p: p, r: r, d: isNum(p) && isNum(r) ? r - p : null, steps: steps };
  }
  function topReason() { var rs = reasons().slice().sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); }); return rs[0] || null; }
  function insideTop() {
    var t = topReason(); if (!t) return null;
    var by = Object.keys(t.by).map(function (a) { return { a: a, d: t.by[a] || 0 }; }).filter(function (x) { return Math.abs(x.d) >= 0.05; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    var top = by[0] ? by[0].a : null, share = top ? div(Math.abs(by[0].d), Math.abs(t.d)) : null;
    var cls = top ? classes().map(function (z) { var b = z.by[top] || { r: 0, p: 0 }; return { c: z.c, d: b.r - b.p, r: b.r, p: b.p }; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); })[0] : null;
    var yrs = YEARS.slice(0, 5), moves = top ? yrs.map(function (y) { var a = ay(CFG.round, top, y).cost, b = ay(CFG.prev, top, y).cost; return { y: y, r: a, p: b, d: isNum(a) && isNum(b) ? a - b : null }; }) : [];
    var later = moves.slice(1).filter(function (m) { return isNum(m.d); }).sort(function (a, b) { return (t.d < 0 ? b.d - a.d : a.d - b.d); })[0];
    return { t: t, by: by, top: top, share: share, cls: cls, moves: moves, later: later };
  }
  function profile() {
    var yrs = YEARS.filter(function (y) { return assets().some(function (a) { var x = ay(CFG.round, a, y); return isNum(x.cost) || isNum(x.prod); }); });
    return yrs.map(function (y) { var parts = assets().map(function (a) { return ay(CFG.round, a, y).prod || 0; }); return { y: y, parts: parts, prod: sum(parts) || 0, cost: sum(assets().map(function (a) { return ay(CFG.round, a, y).cost; })) }; });
  }
  function co2() {
    var o = S.co2[CFG.round] || {};
    return YEARS.filter(function (y) { return o[y] && isNum(o[y].tax); }).map(function (y) { var x = o[y]; return { y: y, tax: x.tax, price: x.price, kt: isNum(x.price) && x.price ? x.tax * 1000 / x.price : null }; });
  }
  function co2Jump() { var c = co2(), best = null; for (var i = 1; i < c.length; i++) { var g = div(c[i].kt - c[i - 1].kt, c[i - 1].kt); if (isNum(g) && (!best || g > best.g)) best = { y: c[i].y, g: g, from: c[i - 1].kt, to: c[i].kt }; } return best; }
  function signoff() {
    var all = [], prog = 0;
    Object.keys(S.wfs).forEach(function (e) { S.stages.forEach(function (st) { var w = (S.wfs[e] || {})[st]; if (!w) return; var c = (S.wfc[e] || {})[st] || {}; all.push({ e: e, st: st, w: w, r: c.r, c: c.c, o: c.o }); prog += ST_PROG[w] || 0; }); });
    var by = {}; STATUSES.forEach(function (w) { by[w] = []; }); all.forEach(function (x) { (by[x.w] = by[x.w] || []).push(x); });
    return { all: all, by: by, pct: all.length ? prog / all.length : null };
  }

  // ---------- SVG charts at design size ----------
  // A portal is a circle inside a slide that holds the next, deeper slide. data-portal names the node it holds.
  function portal(id, cx, cy, r, label, side) {
    var lb = label ? '<span class="plab ' + (side || 'below') + '" data-go="' + id + '" style="left:' + (cx - 160) + 'px;top:' + (side === 'above' ? cy - r - 40 : cy + r + 10) + 'px">' + label + ' ›</span>' : '';
    return '<div class="portal" data-portal="' + id + '" data-go="' + id + '" style="left:' + (cx - r) + 'px;top:' + (cy - r) + 'px;width:' + (2 * r) + 'px;height:' + (2 * r) + 'px"></div>' + lb;
  }
  // An invisible area over a whole row or column: hovering shows its data-tip, clicking opens its data-drill.
  function hit(x, y, w, h, r) { if (!r || (!r.tip && !r.drill)) return ''; return '<rect class="hit" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, w).toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '" rx="10"' + (r.tip ? ' data-tip="' + esc(r.tip) + '"' : '') + (r.drill ? ' data-drill="' + esc(r.drill) + '"' : '') + '/>'; }
  function wrap(t, n) { var w = String(t).split(' '), out = [], cur = ''; w.forEach(function (x) { if ((cur + ' ' + x).trim().length > n && cur) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out.slice(0, 3); }
  function waterfall(items, W, H, pt0) {
    var run = 0, bars = [], lo = Infinity, hi = -Infinity;
    items.forEach(function (it) { var a, b; if (it.total) { a = null; b = it.v || 0; } else { a = run; b = run + (it.d || 0); } run = b; bars.push({ it: it, a: a, b: b }); lo = Math.min(lo, b, a == null ? b : a); hi = Math.max(hi, b, a == null ? b : a); });
    // the axis starts above zero so the steps are readable; total bars carry a break mark
    var rng = (hi - lo) || 1, base = Math.max(0, lo - rng * 0.6); hi = hi + rng * 0.08;
    bars.forEach(function (b) { if (b.it.total) b.a = base; });
    var pt = 46, pb = 78, n = bars.length, slot = (W - 20) / n, bw = Math.min(96, slot * 0.58), g = [];
    var Y = function (v) { return pt + (H - pt - pb) * (hi - v) / (hi - base); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">', px = '', hs = '';
    s += '<line x1="0" x2="' + W + '" y1="' + Y(base) + '" y2="' + Y(base) + '" stroke="' + C.line + '" stroke-width="2"/>';
    s += '<text x="2" y="' + (pt - 24) + '" class="ax">' + esc(CFG.unit) + ', axis starts at ' + f0(base) + '</text>';
    bars.forEach(function (b, i) {
      var x = 10 + slot * i + (slot - bw) / 2, y1 = Y(Math.max(b.a, b.b)), y2 = Y(Math.min(b.a, b.b)), h = Math.max(4, y2 - y1);
      var col = b.it.total ? (i === 0 ? C.cloud : C.navy) : b.it.none ? C.cloud : (b.it.d > 0 ? C.orange : C.green);
      g.push({ x: x, y1: y1, y2: y2, col: col });
      s += '<rect x="' + x + '" y="' + y1 + '" width="' + bw + '" height="' + h + '" rx="7" fill="' + col + '"/>';
      if (b.it.total) { var zy = Y(base) - 30; s += '<path d="M' + (x - 4) + ' ' + (zy + 8) + 'L' + (x + bw + 4) + ' ' + (zy - 2) + 'M' + (x - 4) + ' ' + (zy + 18) + 'L' + (x + bw + 4) + ' ' + (zy + 8) + '" stroke="#ffffff" stroke-width="5"/>'; }
      if (i < n - 1) { var nx = 10 + slot * (i + 1) + (slot - bw) / 2; s += '<line x1="' + (x + bw) + '" x2="' + nx + '" y1="' + Y(b.b) + '" y2="' + Y(b.b) + '" stroke="' + C.cloud + '" stroke-width="2" stroke-dasharray="5 5"/>'; }
      s += '<text x="' + (x + bw / 2) + '" y="' + (y1 - 12) + '" text-anchor="middle" class="wv" fill="' + (b.it.total ? C.ink : b.it.none ? C.mut : (b.it.d > 0 ? C.orange : C.greenInk)) + '">' + esc(b.it.total ? f1(b.it.v) : sg(b.it.d)) + '</text>';
      wrap(b.it.label, Math.max(9, Math.floor(slot / 10))).forEach(function (ln, k) { s += '<text x="' + (x + bw / 2) + '" y="' + (H - pb + 30 + k * 20) + '" text-anchor="middle" class="wl">' + esc(ln) + '</text>'; });
      hs += hit(10 + slot * i + 4, pt - 34, slot - 8, H - pt + 34 - 6, b.it);
    });
    s += hs;
    // The portal goes where it is clear of every bar and value: under its bar, else in the open sky beside it, else above.
    if (pt0 && g[pt0.i]) {
      var b0 = g[pt0.i], bx = b0.x + bw / 2, spot = null, r = pt0.r;
      if ((H - pb - 14) - (b0.y2 + 24) >= 2 * r) spot = { cx: bx, cy: b0.y2 + 24 + r, side: 'below' };
      [r, Math.round(r * 0.85)].forEach(function (rr) {
        [1.5, -1.5, 2.5, -2.5, 1, -1].forEach(function (k) {
          if (spot) return;
          var cx = bx + slot * k, cy = pt + rr + 20;
          if (cx - rr < 0 || cx + rr > W) return;
          var ok = g.every(function (q) { return q.x + bw < cx - rr - 8 || q.x > cx + rr + 8 || q.y1 - 34 > cy + rr + 8; });
          if (ok) { spot = { cx: cx, cy: cy, side: 'above' }; r = rr; }
        });
      });
      if (!spot) spot = { cx: bx, cy: b0.y1 - 44 - r, side: 'above' };
      var side = spot.cx === bx ? 0 : (spot.cx > bx ? 1 : -1), sx = bx + side * bw / 2, sy = side ? (b0.y1 + b0.y2) / 2 : (spot.cy > b0.y2 ? b0.y2 + 4 : b0.y1 - 32);
      var dx = spot.cx - sx, dy = spot.cy - sy, dl = Math.sqrt(dx * dx + dy * dy) || 1;
      s += '<line x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) + '" x2="' + (spot.cx - dx / dl * r).toFixed(1) + '" y2="' + (spot.cy - dy / dl * r).toFixed(1) + '" stroke="' + b0.col + '" stroke-width="3" stroke-dasharray="4 5"/>';
      px = portal(pt0.id, spot.cx, spot.cy, r, pt0.label, spot.side);
    }
    return '<div class="pwrap">' + s + '</svg>' + px + '</div>';
  }
  // horizontal stacked bars: rows [{label, parts[], v1, v2, cls}]
  function segBars(rows, segs, W, rh) {
    var lw = 230, vc = 190, x0 = lw + 20, x1 = W - vc - 20, mx = 0, H = rows.length * rh + 8;
    rows.forEach(function (r) { mx = Math.max(mx, sum(r.parts) || 0); }); mx = mx || 1;
    var X = function (v) { return (x1 - x0) * Math.max(0, v || 0) / mx; };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">', hs = '';
    rows.forEach(function (r, i) {
      var y = 4 + i * rh, by = y + rh / 2 - 14, cx = x0;
      hs += hit(0, y + 2, W, rh - 4, r);
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label) + '</text>';
      r.parts.forEach(function (v, k) { if (!isNum(v) || v <= 0) return; var w = X(v); s += '<rect x="' + cx.toFixed(1) + '" y="' + by + '" width="' + Math.max(2, w - 3).toFixed(1) + '" height="28" rx="6" fill="' + segs[k].c + '"/>'; if (w > 64) s += '<text x="' + (cx + 10).toFixed(1) + '" y="' + (by + 19) + '" class="sgl" fill="' + (segs[k].dark ? C.ink : '#ffffff') + '">' + f0(v) + '</text>'; cx += w; });
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 - 2) + '" text-anchor="end" class="bv">' + r.v1 + '</text><text x="' + (W - 4) + '" y="' + (y + rh / 2 + 18) + '" text-anchor="end" class="bs ' + (r.cls || '') + '">' + r.v2 + '</text>';
    });
    return s + hs + '</svg>';
  }
  // net cost by class: this round solid, previous round dashed, values on the right
  function classBars(rows, W, rh) {
    var lw = 290, vc = 190, x0 = lw + 22, x1 = W - vc - 24, lo = 0, hi = 0, H = rows.length * rh + 8;
    rows.forEach(function (r) { lo = Math.min(lo, r.r || 0, r.p || 0); hi = Math.max(hi, r.r || 0, r.p || 0); });
    var span = (hi - lo) || 1, X = function (v) { return x0 + (x1 - x0) * ((v || 0) - lo) / span; }, Z = X(0);
    var s = '<svg width="' + W + '" height="' + H + '" class="svg"><line x1="' + Z + '" x2="' + Z + '" y1="0" y2="' + H + '" stroke="' + C.line + '" stroke-width="2"/>';
    var hs = '';
    rows.forEach(function (r, i) {
      var y = 4 + i * rh, by = y + rh / 2 - 12;
      hs += hit(0, y + 2, W, rh - 4, r);
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label) + '</text>';
      if (isNum(r.p) && Math.abs(r.p) >= 0.05) { var pa = Math.min(Z, X(r.p)), pw = Math.abs(X(r.p) - Z); s += '<rect x="' + pa.toFixed(1) + '" y="' + (by - 5) + '" width="' + Math.max(2, pw).toFixed(1) + '" height="34" rx="8" fill="none" stroke="' + C.cloud + '" stroke-width="2" stroke-dasharray="6 5"/>'; }
      var a = Math.min(Z, X(r.r)), w = Math.abs(X(r.r) - Z);
      s += '<rect x="' + a.toFixed(1) + '" y="' + by + '" width="' + Math.max(2, w).toFixed(1) + '" height="24" rx="6" fill="' + r.c + '"/>';
      var dd = isNum(r.d) && Math.abs(r.d) >= 0.05;
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 - 2) + '" text-anchor="end" class="bv">' + f1(r.r) + '</text><text x="' + (W - 4) + '" y="' + (y + rh / 2 + 18) + '" text-anchor="end" class="bs ' + (dd ? (r.d > 0 ? 'up' : 'dn') : '') + '">' + (dd ? sg(r.d) + ' vs ' + esc(CFG.prev) : 'no change') + '</text>';
    });
    return s + hs + '</svg>';
  }
  // cost per barrel: PRODEX bar, opex-only bar inside it, portfolio line
  function prdxBars(rows, W, rh, port) {
    var lw = 230, vc = 200, x0 = lw + 22, x1 = W - vc - 24, mx = 0, H = rows.length * rh + 40;
    rows.forEach(function (r) { mx = Math.max(mx, r.x || 0); }); mx = (mx || 1) * 1.06;
    var X = function (v) { return x0 + (x1 - x0) * Math.max(0, v || 0) / mx; };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">', hs = '';
    rows.forEach(function (r, i) {
      var y = 34 + i * rh, by = y + rh / 2 - 15;
      hs += hit(0, y + 2, W, rh - 4, r);
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label) + '</text>';
      s += '<rect x="' + x0 + '" y="' + by + '" width="' + Math.max(2, X(r.x) - x0).toFixed(1) + '" height="30" rx="7" fill="' + C.navy + '"/>';
      if (isNum(r.o)) s += '<rect x="' + x0 + '" y="' + (by + 9) + '" width="' + Math.max(2, X(r.o) - x0).toFixed(1) + '" height="12" rx="6" fill="' + C.sky + '"/>';
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 - 2) + '" text-anchor="end" class="bv">' + f0(r.x) + '</text><text x="' + (W - 4) + '" y="' + (y + rh / 2 + 18) + '" text-anchor="end" class="bs">opex only ' + f0(r.o) + (isNum(r.px) ? ' ' + MID + ' ' + sg0(r.x - r.px) + ' vs ' + esc(CFG.prev) : '') + '</text>';
    });
    if (isNum(port)) { var px = X(port); s += '<line x1="' + px + '" x2="' + px + '" y1="22" y2="' + (H - 4) + '" stroke="' + C.orange + '" stroke-width="3" stroke-dasharray="7 6"/><text x="' + (px + 8) + '" y="18" class="pl2">Portfolio ' + f0(port) + '</text>'; }
    return s + hs + '</svg>';
  }
  // stacked columns (production by asset) with a line (net cost) on its own axis
  function colsLine(rows, segs, W, H) {
    var pl = 78, pr = 86, pt = 30, pb = 44, n = rows.length || 1, slot = (W - pl - pr) / n, bw = Math.min(46, slot * 0.64);
    var mxS = 0, mxL = 0; rows.forEach(function (r) { mxS = Math.max(mxS, r.prod || 0); mxL = Math.max(mxL, r.cost || 0); }); mxS = niceMax(mxS * 1.06, 4); mxL = niceMax(mxL * 1.06, 4);
    var YS = function (v) { return pt + (H - pt - pb) * (1 - v / mxS); }, YL = function (v) { return pt + (H - pt - pb) * (1 - v / mxL); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">';
    for (var g = 0; g <= 4; g++) { var y = pt + (H - pt - pb) * g / 4; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.lineSoft + '" stroke-width="1.5"/><text x="' + (pl - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="ax">' + f0(mxS * (1 - g / 4)) + '</text><text x="' + (W - pr + 10) + '" y="' + (y + 5) + '" class="ax ac">' + f0(mxL * (1 - g / 4)) + '</text>'; }
    s += '<text x="' + (pl - 10) + '" y="' + (pt - 12) + '" text-anchor="end" class="zn">' + esc(CFG.prodUnit) + '</text><text x="' + (W - pr + 10) + '" y="' + (pt - 12) + '" class="zn ac">' + esc(CFG.unit) + '</text>';
    var d = '';
    rows.forEach(function (r, i) {
      var x = pl + slot * i + (slot - bw) / 2, cy = YS(0);
      r.parts.forEach(function (v, k) { if (!isNum(v) || v <= 0) return; var h = YS(0) - YS(v); cy -= h; s += '<rect x="' + x.toFixed(1) + '" y="' + cy.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, h - 1.5).toFixed(1) + '" rx="3" fill="' + segs[k].c + '"/>'; });
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 14) + '" text-anchor="middle" class="ax">' + esc(yl(r.y)) + '</text>';
      if (isNum(r.cost)) d += (d ? 'L' : 'M') + (x + bw / 2).toFixed(1) + ' ' + YL(r.cost).toFixed(1);
    });
    s += '<path d="' + d + '" fill="none" stroke="' + C.orange + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
    rows.forEach(function (r, i) { if (!isNum(r.cost)) return; var x = pl + slot * i + slot / 2; s += '<circle cx="' + x.toFixed(1) + '" cy="' + YL(r.cost).toFixed(1) + '" r="5" fill="#ffffff" stroke="' + C.orange + '" stroke-width="3"/>'; });
    rows.forEach(function (r, i) { s += hit(pl + slot * i + 1, pt - 8, slot - 2, H - pt + 8 - 2, r); });
    return s + '</svg>';
  }
  // columns (tax) with a line (chargeable CO2) on its own axis; the step year is highlighted
  function co2Chart(rows, W, H, hiY) {
    var pl = 78, pr = 80, pt = 30, pb = 44, n = rows.length || 1, slot = (W - pl - pr) / n, bw = Math.min(54, slot * 0.6);
    var mxT = 0, mxK = 0; rows.forEach(function (r) { mxT = Math.max(mxT, r.tax || 0); mxK = Math.max(mxK, r.kt || 0); }); mxT = niceMax(mxT * 1.08, 4); mxK = niceMax(mxK * 1.25, 4);
    var YT = function (v) { return pt + (H - pt - pb) * (1 - v / mxT); }, YK = function (v) { return pt + (H - pt - pb) * (1 - v / mxK); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">';
    for (var g = 0; g <= 4; g++) { var y = pt + (H - pt - pb) * g / 4; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.lineSoft + '" stroke-width="1.5"/><text x="' + (pl - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="ax">' + f0(mxT * (1 - g / 4)) + '</text><text x="' + (W - pr + 10) + '" y="' + (y + 5) + '" class="ax ac">' + f0(mxK * (1 - g / 4)) + '</text>'; }
    s += '<text x="' + (pl - 10) + '" y="' + (pt - 12) + '" text-anchor="end" class="zn">' + esc(CFG.unit) + '</text><text x="' + (W - pr + 10) + '" y="' + (pt - 12) + '" class="zn ac">' + esc(CFG.co2Unit) + '</text>';
    var d = '';
    rows.forEach(function (r, i) {
      var x = pl + slot * i + (slot - bw) / 2, on = r.y === hiY;
      s += '<rect x="' + x.toFixed(1) + '" y="' + YT(r.tax).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(2, YT(0) - YT(r.tax)).toFixed(1) + '" rx="6" fill="' + (on ? C.navy : C.blue) + '"/>';
      s += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 14) + '" text-anchor="middle" class="ax' + (on ? ' axb' : '') + '">' + esc(yl(r.y)) + '</text>';
      if (isNum(r.kt)) d += (d ? 'L' : 'M') + (x + bw / 2).toFixed(1) + ' ' + YK(r.kt).toFixed(1);
    });
    s += '<path d="' + d + '" fill="none" stroke="' + C.orange + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>';
    rows.forEach(function (r, i) { if (!isNum(r.kt)) return; var x = pl + slot * i + slot / 2, on = r.y === hiY; s += '<circle cx="' + x.toFixed(1) + '" cy="' + YK(r.kt).toFixed(1) + '" r="' + (on ? 8 : 5) + '" fill="' + (on ? C.orange : '#ffffff') + '" stroke="' + C.orange + '" stroke-width="3"/>'; });
    rows.forEach(function (r, i) { s += hit(pl + slot * i + 1, pt - 8, slot - 2, H - pt + 8 - 2, r); });
    return s + '</svg>';
  }
  // paired columns: this round solid, previous round dashed, change above
  function pairCols(rows, W, H) {
    var pl = 64, pr = 16, pt = 46, pb = 44, n = rows.length || 1, slot = (W - pl - pr) / n, bw = Math.min(38, slot * 0.3);
    var mx = 0; rows.forEach(function (r) { mx = Math.max(mx, r.r || 0, r.p || 0); }); mx = niceMax(mx * 1.1, 4);
    var Y = function (v) { return pt + (H - pt - pb) * (1 - Math.max(0, v || 0) / mx); };
    var s = '<svg width="' + W + '" height="' + H + '" class="svg">';
    for (var g = 0; g <= 4; g++) { var y = pt + (H - pt - pb) * g / 4; s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.lineSoft + '" stroke-width="1.5"/><text x="' + (pl - 10) + '" y="' + (y + 5) + '" text-anchor="end" class="ax">' + f0(mx * (1 - g / 4)) + '</text>'; }
    rows.forEach(function (r, i) {
      var cx = pl + slot * i + slot / 2, xa = cx - bw - 3, xb = cx + 3;
      if (isNum(r.p)) s += '<rect x="' + xb.toFixed(1) + '" y="' + Y(r.p).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(r.p)).toFixed(1) + '" rx="5" fill="' + C.bg + '" stroke="' + C.cloud + '" stroke-width="2" stroke-dasharray="5 4"/>';
      if (isNum(r.r)) s += '<rect x="' + xa.toFixed(1) + '" y="' + Y(r.r).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (Y(0) - Y(r.r)).toFixed(1) + '" rx="5" fill="' + C.navy + '"/>';
      if (isNum(r.d) && Math.abs(r.d) >= 0.05) s += '<text x="' + cx.toFixed(1) + '" y="' + (Math.min(Y(r.r), Y(r.p)) - 12).toFixed(1) + '" text-anchor="middle" class="wv" fill="' + (r.d > 0 ? C.orange : C.greenInk) + '">' + sg(r.d) + '</text>';
      s += '<text x="' + cx.toFixed(1) + '" y="' + (H - 14) + '" text-anchor="middle" class="ax">' + esc(yl(r.y)) + '</text>';
    });
    rows.forEach(function (r, i) { s += hit(pl + slot * i + 1, pt - 40, slot - 2, H - pt + 40 - 2, r); });
    return s + '</svg>';
  }
  // signed horizontal bars from a zero line
  function signBars(rows, W, rh) {
    var lw = 200, vc = 90, x0 = lw + 16, x1 = W - vc - 12, lo = 0, hi = 0, H = rows.length * rh + 8;
    rows.forEach(function (r) { lo = Math.min(lo, r.d); hi = Math.max(hi, r.d); });
    var span = (hi - lo) || 1, X = function (v) { return x0 + (x1 - x0) * (v - lo) / span; }, Z = X(0);
    var s = '<svg width="' + W + '" height="' + H + '" class="svg"><line x1="' + Z + '" x2="' + Z + '" y1="0" y2="' + H + '" stroke="' + C.line + '" stroke-width="2"/>';
    rows.forEach(function (r, i) {
      var y = 4 + i * rh, a = Math.min(Z, X(r.d)), w = Math.abs(X(r.d) - Z);
      s += '<text x="' + lw + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bl">' + esc(r.label) + '</text>';
      s += '<rect x="' + a.toFixed(1) + '" y="' + (y + rh / 2 - 11) + '" width="' + Math.max(2, w).toFixed(1) + '" height="22" rx="6" fill="' + (r.on ? C.navy : C.cloud) + '"/>';
      s += '<text x="' + (W - 4) + '" y="' + (y + rh / 2 + 6) + '" text-anchor="end" class="bv">' + sg(r.d) + '</text>';
      s += hit(0, y + 2, W, rh - 4, r);
    });
    return s + '</svg>';
  }
  function ring(f, R, w, col) { var c = 2 * Math.PI * (R - w / 2), v = Math.max(0, Math.min(1, f || 0)); return '<svg width="' + (R * 2) + '" height="' + (R * 2) + '" class="svg"><circle cx="' + R + '" cy="' + R + '" r="' + (R - w / 2) + '" fill="none" stroke="' + C.lineSoft + '" stroke-width="' + w + '"/><circle cx="' + R + '" cy="' + R + '" r="' + (R - w / 2) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-dasharray="' + (c * v).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + R + ' ' + R + ')"/></svg>'; }
  function legend(items) { return '<div class="lg">' + items.map(function (x) { return '<span><i class="' + (x.dash ? 'dsh' : '') + '" style="' + (x.dash ? 'border-color:' + x.c : 'background:' + x.c) + '"></i>' + esc(x.n) + '</span>'; }).join('') + '</div>'; }
  function tag(t) { return '<span class="itag">' + esc(t) + '</span>'; }

  // ---------- slides (each is 1280 x 720; portals hold the next level) ----------
  function head(k, h, l) { return '<div class="k">' + k + '</div><h2 class="h">' + h + '</h2>' + (l ? '<p class="l">' + l + '</p>' : ''); }
  function stat(k, v, col) { return '<div class="st"' + (col ? ' style="--c:' + col + '"' : '') + '><span>' + k + '</span><b>' + v + '</b></div>'; }
  function tile(k, v, sub2, col) { return '<div class="tl" style="--c:' + col + '"><span>' + k + '</span><b>' + v + '</b><small>' + sub2 + '</small></div>'; }
  function hero(label, v, sub2, col, extra, tip) { return '<div class="hero hp" style="--c:' + col + '"' + (tip ? ' data-tip="' + esc(tip) + '"' : '') + '><div class="hl2">' + label + '</div><div class="hv">' + v + '</div><div class="hs">' + sub2 + '</div>' + (extra || '') + '</div>'; }
  function sTitle() {
    var pR = prodT(CFG.round), pP = prodT(CFG.prev), cR = costT(CFG.round), cP = costT(CFG.prev), px = wavg(prdxA), ox = wavg(opexA);
    return '<div class="brandrow">' + BRAND.logo(40, '#393939') + '</div>' +
      '<div class="k">' + esc(BRAND.kicker) + ' ' + MID + ' ' + esc(CFG.round) + ' forecast round</div><h1 class="t1">' + esc(BRAND.title) + '</h1>' +
      '<p class="l">OKEA net, ' + FYL + ' and the years after, read live from Pigment. Click a circle to zoom into it, hover a bar for its numbers and click it to drill in; Esc comes back out.</p>' +
      '<div class="agenda">' + SEQ.slice(1).map(function (id, i) { return '<span data-go="' + id + '"><b>' + (i + 2) + '</b>' + esc(BY[id].t) + '</span>'; }).join('') + '</div>' +
      '<div class="heroes">' +
      hero('Net production, ' + FYL + ' (' + esc(CFG.prodUnit) + ')', f0(pR), f0(boed(pR)) + ' ' + esc(CFG.rateUnit) + '<br>' + sg0(pR - pP) + ' vs ' + esc(CFG.prev), C.navy, portal('prod', 288, 112, 64, '', ''), 'Net production, ' + FYL + '\nOKEA’s share of each licence’s barrels: gross × working interest\n' + assets().map(function (a) { return a + ' ' + f0(prodA(a)); }).join(', ') + '\nClick the circle to zoom into production') +
      hero('Net cost, ' + FYL + ' (' + esc(CFG.unit) + ')', f1(cR), sg(cR - cP) + ' against ' + esc(CFG.prev) + '<br>by cost class', C.blue, portal('classes', 288, 112, 64, '', ''), 'Net cost, ' + FYL + '\nLicence cost × OKEA’s share, plus OKEA’s own 100% costs\n' + CFG.round + ' ' + f1(cR) + ', ' + CFG.prev + ' ' + f1(cP) + ' ' + CFG.unit + '\nClick the circle for cost by class') +
      hero('Production cost, PRODEX (' + esc(CFG.boeUnit) + ')', f0(px), 'opex only ' + f0(ox) + '<br>by asset', C.green, portal('prodex', 288, 112, 64, '', ''), 'Production cost per barrel (PRODEX)\n(Net opex + operating income + general cost incl. CO2 + OKEA 100% costs) ÷ net barrels\nOpex only ' + f0(ox) + ' ' + CFG.boeUnit + '\nClick the circle for cost per barrel by asset') + '</div>';
  }
  function sProd() {
    var as = assets(), T = prodT(CFG.round), P0 = prodT(CFG.prev), ps = products(CFG.round), segs = ps.map(function (x, i) { return { n: x.p, c: [C.navy, C.blue, C.amber, C.green, C.sky][i % 5], dark: i === 2 }; });
    var per = S.prd[CFG.round] || {}, perP = S.prd[CFG.prev] || {};
    var rows = as.map(function (a) {
      var parts = ps.map(function (x) { return (per[a] || {})[x.p] || 0; }), t = sum(parts) || 0, tp = sum(ps.map(function (x) { return (perP[a] || {})[x.p] || 0; })); var d = isNum(tp) ? t - tp : null;
      var tip = a + '\nNet production ' + FYL + ': ' + f0(t) + ' ' + CFG.prodUnit + ' (' + f0(boed(t)) + ' ' + CFG.rateUnit + ')\n' + ps.map(function (x, k) { return x.p + ' ' + f0(parts[k]); }).join(', ') + '\nAgainst ' + CFG.prev + ': ' + sg0(d) + ' ' + CFG.prodUnit + '\nClick to drill into ' + a;
      return { label: a, parts: parts, v1: f0(t), v2: (isNum(d) && Math.abs(d) >= 0.5 ? sg0(d) + ' vs ' + esc(CFG.prev) : 'no change vs ' + esc(CFG.prev)), cls: isNum(d) && Math.abs(d) >= 0.5 ? (d > 0 ? 'dn' : 'up') : '', tip: tip, drill: 'a|' + a };
    });
    var hub = as[0], sh = div(prodA(hub), T);
    var moved = rows.filter(function (r) { return r.cls; }).map(function (r) { return esc(r.label) + ' ' + r.v2.split(' vs')[0]; });
    return head('Production ' + MID + ' ' + FYL, esc(hub) + ' delivers ' + pct(sh, 0) + ' of OKEA’s ' + f0(T) + ' ' + esc(CFG.prodUnit), ps.map(function (x) { return esc(x.p) + ' ' + f0(x.v); }).join(', ') + ' ' + esc(CFG.prodUnit) + ', ' + f0(boed(T)) + ' ' + esc(CFG.rateUnit) + '. Against ' + esc(CFG.prev) + ': ' + (moved.length ? moved.join(', ') + ' ' + esc(CFG.prodUnit) : 'no change') + '.') +
      '<div class="two"><div class="chartbox">' + segBars(rows, segs, 820, 100) + legend(segs) + '</div>' +
      '<div class="stats">' + ps.slice(0, 3).map(function (x, i) { return stat(esc(x.p), f0(x.v) + ' <small>' + esc(CFG.prodUnit) + '</small>', segs[i].c); }).join('') + stat('Per day', f0(boed(T)) + ' <small>' + esc(CFG.rateUnit) + '</small>', C.green) + stat('Against ' + esc(CFG.prev), sg0(T - P0) + ' <small>' + esc(CFG.prodUnit) + '</small>', C.cloud) + '</div></div>';
  }
  function sClasses() {
    var cl = classes(), T = costT(CFG.round), P0 = costT(CFG.prev), d = isNum(T) && isNum(P0) ? T - P0 : null;
    var mv = cl.filter(function (z) { return Math.abs(z.d) >= 0.05; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); });
    var rows = cl.map(function (z, i) { return { label: z.c, r: z.r, p: z.p, d: z.d, c: z.r < 0 ? C.orange : SER[i % SER.length], drill: 'c|' + z.c, tip: z.c + '\n' + CFG.round + ': ' + f1(z.r) + ' ' + CFG.unit + '\n' + CFG.prev + ' (illustrative): ' + f1(z.p) + ' ' + CFG.unit + '\nChange: ' + sg(z.d) + ' ' + CFG.unit + '\nClick to see it by asset' }; });
    return head('Net cost by class ' + MID + ' ' + FYL, 'Net cost ' + mn(T) + ', ' + sg(d) + ' against ' + esc(CFG.prev), (mv.length ? 'Biggest moves: ' + mv.slice(0, 2).map(function (z) { return esc(z.c) + ' ' + sg(z.d); }).join(', ') + '. ' : '') + 'Negative cost is operating income booked on cost codes.') +
      '<div class="two"><div class="chartbox">' + classBars(rows, 820, 62) + legend([{ n: CFG.round, c: C.navy }, { n: CFG.prev + ' (illustrative)', c: C.cloud, dash: true }]) + '</div>' +
      '<div class="stats">' + stat('Net cost, ' + esc(CFG.round), f1(T) + ' <small>' + esc(CFG.unit) + '</small>') + stat('Net cost, ' + esc(CFG.prev), f1(P0) + ' <small>' + esc(CFG.unit) + '</small>', C.cloud) + stat('Change', sg(d) + ' <small>' + esc(CFG.unit) + '</small>', d > 0 ? C.orange : C.green) + '<div class="note">' + tag('Illustrative') + ' ' + esc(CFG.illustrative) + '</div></div></div>';
  }
  function sPrdx() {
    var as = assets().filter(function (a) { return isNum(prdxA(a)); }).sort(function (a, b) { return prdxA(b) - prdxA(a); }), port = wavg(prdxA), ox = wavg(opexA);
    var hi = as[0], lo2 = as[as.length - 1], ratio = div(prdxA(hi), prdxA(lo2));
    var rows = as.map(function (a) { var x = prdxA(a), o = opexA(a); return { label: a, x: x, o: o, px: prdxA(a, CFG.prev), drill: 'a|' + a, tip: a + '\nPRODEX ' + f0(x) + ' ' + CFG.boeUnit + '\nOpex only ' + f0(o) + ' ' + CFG.boeUnit + '\nThe rest, ' + f0(x - o) + ': operating income, general cost incl. CO2, OKEA 100% costs\nNet production ' + f0(prodA(a)) + ' ' + CFG.prodUnit + '\nClick to drill into ' + a }; });
    return head('Cost per barrel ' + MID + ' ' + FYL, hi ? esc(hi) + ' costs ' + f0(prdxA(hi)) + ' ' + esc(CFG.boeUnit) + (isNum(ratio) && as.length > 1 ? ', ' + ratio.toFixed(1) + ' times ' + esc(lo2) : '') : 'Cost per barrel', 'PRODEX is OKEA’s production cost per barrel. Portfolio ' + f0(port) + ' ' + esc(CFG.boeUnit) + '; opex only ' + f0(ox) + '. The gap between the two bars is the rest of PRODEX on top of operating cost.') +
      '<div class="two"><div class="chartbox">' + prdxBars(rows, 820, 96, port) + legend([{ n: 'PRODEX', c: C.navy }, { n: 'Opex only', c: C.sky }, { n: 'Portfolio PRODEX', c: C.orange, dash: true }]) + '</div>' +
      '<div class="stats">' + stat('Portfolio PRODEX', f0(port) + ' <small>' + esc(CFG.boeUnit) + '</small>', C.navy) + stat('Opex only', f0(ox) + ' <small>' + esc(CFG.boeUnit) + '</small>', C.sky) + stat('Against ' + esc(CFG.prev), sg0(port - wavg(prdxA, CFG.prev)) + ' <small>' + esc(CFG.boeUnit) + '</small>', C.cloud) + '</div></div>';
  }
  function sLong() {
    var as = assets(), segs = as.map(function (a, i) { return { n: a, c: SER[i % SER.length] }; });
    var pr = profile().map(function (r) { r.drill = 'y|' + r.y; r.tip = yl(r.y) + '\nNet production ' + f0(r.prod) + ' ' + CFG.prodUnit + '\n' + as.map(function (a, k) { return a + ' ' + f0(r.parts[k]); }).join(', ') + '\nNet cost ' + f1(r.cost) + ' ' + CFG.unit + '\nClick to see the year by asset'; return r; });
    var withP = pr.filter(function (r) { return r.prod > 0; }), peak = withP.slice().sort(function (a, b) { return b.prod - a.prod; })[0];
    // the trough is the cheapest year while the fields still produce; a later rise is called out only if it is material
    var c0 = pr[0], cmin = withP.filter(function (r) { return isNum(r.cost); }).slice(1).sort(function (a, b) { return a.cost - b.cost; })[0];
    var after = cmin ? pr.slice(pr.indexOf(cmin) + 1).filter(function (r) { return isNum(r.cost); }).sort(function (a, b) { return b.cost - a.cost; })[0] : null;
    var rise = after && after.cost > cmin.cost * 1.2;
    // the forecast year quotes the headline figure (OUT FY Net Cost), so the same number reads the same on every slide
    var l = c0 ? 'Net cost ' + mn(c0.y === FY && isNum(costT(CFG.round)) ? costT(CFG.round) : c0.cost) + ' in ' + yl(c0.y) + (cmin ? ', falling to ' + mn(cmin.cost) + ' by ' + yl(cmin.y) : '') + (rise ? ', then rising to ' + mn(after.cost) + ' in ' + yl(after.y) + (after.prod < cmin.prod ? ' while production keeps falling' : '') : '') + '. ' + esc(CFG.round) + ', OKEA net, every asset.' : '';
    return head('The long view', peak ? 'Production peaks in ' + yl(peak.y) + ' at ' + f0(peak.prod) + ' ' + esc(CFG.prodUnit) : 'The long view', l) +
      '<div class="chartbox">' + colsLine(pr, segs, 1152, 430) + '</div>' + legend(segs.concat([{ n: 'Net cost (' + CFG.unit + ', right axis)', c: C.orange }]));
  }
  function sBridge() {
    var b = bridge(), items = [{ label: CFG.prev, v: b.p, total: true }].concat(b.steps).concat([{ label: CFG.round, v: b.r, total: true }]);
    items.forEach(function (it) {
      if (it.total) it.tip = 'Net cost, ' + it.label + (it.label === CFG.prev ? ' (illustrative)' : '') + '\n' + f1(it.v) + ' ' + CFG.unit + ', ' + FYL + ', OKEA net';
      else { it.tip = it.label + '\n' + sg(it.d) + ' ' + CFG.unit + ' against ' + CFG.prev + (it.none ? '\nLines that moved without a change reason yet' : '\nClick to see it by asset'); if (!it.none) it.drill = 'r|' + it.label; }
    });
    var t = topReason(), bi = -1; if (t) b.steps.forEach(function (s, i) { if (s.label === t.r) bi = i + 1; });
    return head(esc(CFG.prev) + ' to ' + esc(CFG.round) + ' ' + MID + ' ' + FYL, 'Net cost ' + sg(b.d) + ' ' + esc(CFG.unit) + ' since ' + esc(CFG.prev) + (t ? ': ' + esc(t.r) + ' ' + sg(t.d) : ''), 'Every line that moved carries the reason its controller gave, so the bridge builds itself. ' + tag('Illustrative') + ' ' + esc(CFG.prev) + ' costs.') +
      '<div class="chartbox">' + waterfall(items, 1152, 476, bi > 0 ? { i: bi, id: 'timing', r: 72, label: 'Inside ' + esc(t.r).toLowerCase() } : null) + '</div>';
  }
  function sTiming() {
    var x = insideTop(); if (!x) return head('Inside the biggest move', 'No reasons recorded yet', '');
    var rows = x.by.map(function (b) { return { label: b.a, d: b.d, on: b.a === x.top, drill: 'a|' + b.a, tip: b.a + '\n' + x.t.r + ': ' + sg(b.d) + ' ' + CFG.unit + ' against ' + CFG.prev + '\nClick to drill into ' + b.a }; });
    var mvs = x.moves.map(function (m) { return { y: m.y, r: m.r, p: m.p, d: m.d, drill: 'y|' + m.y, tip: yl(m.y) + ' ' + MID + ' ' + x.top + '\n' + CFG.round + ': ' + f1(m.r) + ' ' + CFG.unit + '\n' + CFG.prev + ' (illustrative): ' + f1(m.p) + '\nChange: ' + sg(m.d) + '\nClick to see the year by asset' }; });
    var so = signoff(), ret = so.all.filter(function (z) { return z.e === x.top && z.w === 'Returned'; })[0];
    var l = x.cls ? esc(x.top) + ' ' + esc(x.cls.c) + ' is ' + sg(x.cls.d) + ' ' + esc(CFG.unit) + ' in ' + FYL + ' against ' + esc(CFG.prev) + (x.later && Math.abs(x.later.d) >= 0.05 ? '; its cost reappears in ' + yl(x.later.y) + ' (' + sg(x.later.d) + ').' : '.') : '';
    return head('Inside ' + esc(x.t.r).toLowerCase(), esc(x.top) + ' is ' + pct(x.share, 0) + ' of the ' + sg(x.t.d) + ' ' + esc(CFG.unit) + ' move', l) +
      '<div class="tim"><div><div class="sh">' + esc(x.t.r) + ' by asset, ' + esc(CFG.unit) + '</div>' + signBars(rows, 520, 52) +
      (ret ? '<div class="rq"><small>Returned by the reviewer ' + MID + ' ' + esc(stShort(ret.st)) + '</small><p>' + esc(ret.r || 'No reason recorded yet.') + '</p>' + (ret.o ? '<span>Owner: ' + esc(ret.o) + '</span>' : '') + '</div>' : '') + '</div>' +
      '<div><div class="sh">' + esc(x.top) + ': net cost by year, ' + esc(CFG.round) + ' against ' + esc(CFG.prev) + '</div>' + pairCols(mvs, 560, 400) + legend([{ n: CFG.round, c: C.navy }, { n: CFG.prev + ' (illustrative)', c: C.cloud, dash: true }]) + '</div></div>';
  }
  function sCO2() {
    var c = co2(), j = co2Jump(), mx = c.slice().sort(function (a, b) { return b.tax - a.tax; })[0], c0 = c[0];
    c.forEach(function (r) { r.drill = 'y|' + r.y; r.tip = yl(r.y) + '\nEnvironmental tax, gross (100%): ' + f1(r.tax) + ' ' + CFG.unit + '\nCO2 price: ' + f0(r.price) + ' NOK/t\nChargeable CO2: ' + f0(r.kt) + ' ' + CFG.co2Unit + '\nClick to see the year by asset'; });
    var h = j && j.g > 0.05 ? 'Chargeable CO2 rises ' + pct(j.g, 0) + ' in ' + yl(j.y) : 'CO2 and environmental tax';
    var l = c0 && mx ? 'Environmental tax, gross (100%), ' + esc(CFG.round) + ': ' + mn(c0.tax) + ' in ' + yl(c0.y) + ' to ' + mn(mx.tax) + ' by ' + yl(mx.y) + '. Chargeable CO2 is the tax divided by the price.' : '';
    return head('CO2 and environmental tax', h, l + ' ' + tag('Illustrative') + ' CO2 price path.') +
      '<div class="two w2"><div class="chartbox">' + co2Chart(c, 880, 420, j ? j.y : null) + legend([{ n: 'Environmental tax, gross (' + CFG.unit + ')', c: C.blue }, { n: 'Chargeable CO2 (' + CFG.co2Unit + ', right axis)', c: C.orange }]) + '</div>' +
      '<div class="stats">' + (j ? stat('Chargeable CO2, ' + yl(j.y), f0(j.to) + ' <small>' + esc(CFG.co2Unit) + '</small>', C.orange) + stat('The year before', f0(j.from) + ' <small>' + esc(CFG.co2Unit) + '</small>', C.cloud) : '') + (mx ? stat('Peak tax, ' + yl(mx.y), f1(mx.tax) + ' <small>' + esc(CFG.unit) + '</small>', C.navy) : '') + '</div></div>';
  }
  function sReady() {
    var so = signoff(), ret = so.by.Returned || [], wait = so.by.Submitted || [];
    var cnt = STATUSES.map(function (w) { var l = so.by[w] || []; return '<div class="sc" data-tip="' + esc(w + ': ' + l.length + (l.length ? '\n' + l.map(function (x) { return x.e + ' ' + MID + ' ' + stShort(x.st); }).join('\n') : '')) + '"><i style="background:' + ST_COL[w] + '"></i><b>' + l.length + '</b><span>' + w + '</span></div>'; }).join('');
    return head('Readiness', 'Sign-off is ' + pct(so.pct, 0) + ' complete', so.all.length + ' sign-offs, stage by asset: ' + (so.by.Approved || []).length + ' approved, ' + wait.length + ' waiting for review, ' + ret.length + ' returned. The returns, and why, sit inside the ring.') +
      '<div class="rdy"><div class="rng">' + ring(so.pct, 150, 24, C.green) + portal('returned', 150, 150, 118, '', '') + '<div class="rngc"><b>' + pct(so.pct, 0) + '</b> round progress ' + MID + ' <span class="rr2">' + ret.length + ' returned ›</span></div></div><div class="cnts">' + cnt + '</div>' +
      '<div class="lists v">' + plist('Waiting for review', wait, ST_COL.Submitted) + plist('Still to submit', (so.by['In progress'] || []).concat(so.by['Not started'] || []), ST_COL['In progress']) + '</div></div>';
  }
  function sReturned() {
    var so = signoff(), ret = so.by.Returned || [], rich = ret.length <= 2;
    var cards = ret.map(function (x) {
      var txt = '<div class="rcr"><small>Why it came back</small><p>' + esc(x.r || 'No reason recorded yet.') + '</p></div>' + (x.c ? '<div class="rcn"><small>' + esc(x.e) + '’s note</small><p>' + esc(x.c) + '</p></div>' : '') + (x.o ? '<div class="rco">Owner: ' + esc(x.o) + '</div>' : '');
      if (!rich) return '<div class="rc"><div class="rch"><b data-drill="' + esc('a|' + x.e) + '" data-tip="' + esc('Click to drill into ' + x.e) + '">' + esc(x.e) + ' ›</b><span>' + esc(stShort(x.st)) + '</span></div>' + txt + '</div>';
      // the numbers behind the return and where the asset stands on every stage
      var cR = costA(x.e, CFG.round), cP = costA(x.e, CFG.prev), pR = prodA(x.e), pP = prodA(x.e, CFG.prev);
      var mv = classes().map(function (z) { var b = z.by[x.e] || { r: 0, p: 0 }; return { c: z.c, d: b.r - b.p }; }).sort(function (a, b) { return Math.abs(b.d) - Math.abs(a.d); })[0];
      var nums = '<div class="rcx">' + stat('Net cost, ' + FYL, f1(cR) + ' <small>' + esc(CFG.unit) + ', ' + sg(cR - cP) + ' vs ' + esc(CFG.prev) + '</small>', C.blue) +
        (mv && Math.abs(mv.d) >= 0.05 ? stat('Biggest move by class', esc(mv.c.replace(/\s*\(.*\)$/, '')) + ' <small>' + sg(mv.d) + '</small>', mv.d > 0 ? C.orange : C.green) : '') +
        stat('Net production, ' + FYL, f0(pR) + ' <small>' + esc(CFG.prodUnit) + ', ' + sg0(pR - pP) + ' vs ' + esc(CFG.prev) + '</small>', C.navy) + '</div>';
      var strip = '<div class="rst">' + S.stages.map(function (st) { var w = (S.wfs[x.e] || {})[st]; return w ? '<span class="' + (st === x.st ? 'on' : '') + '" style="--c:' + (ST_COL[w] || C.cloud) + '"><i></i><b>' + esc(stShort(st)) + '</b><small>' + esc(w) + '</small></span>' : ''; }).join('') + '</div>';
      return '<div class="rc rich"><div class="rch"><b data-drill="' + esc('a|' + x.e) + '" data-tip="' + esc('Click to drill into ' + x.e) + '">' + esc(x.e) + ' ›</b><span>' + esc(stShort(x.st)) + '</span></div><div class="rcg"><div>' + txt + '</div>' + nums + '</div>' + strip + '</div>';
    }).join('');
    return head('Readiness ' + MID + ' returned', ret.length ? ret.length + ' stage' + (ret.length > 1 ? 's' : '') + ' sent back, and why' : 'Nothing has been sent back', 'Each return carries the reviewer’s reason and the asset team’s own note, read live from the workflow tracker.') + '<div class="rcs' + (rich ? ' one' : '') + '">' + (cards ||'<div class="none">Every submission so far has been accepted or is waiting for review.</div>') + '</div>';
  }
  function plist(t, list, col) { return '<div class="pl"><div class="plh"><i style="background:' + col + '"></i>' + t + ' <b>' + list.length + '</b></div><div class="plc">' + (list.map(function (x) { return '<span data-drill="' + esc('a|' + x.e) + '" data-tip="' + esc(x.e + ' ' + MID + ' ' + stShort(x.st) + '\nStatus: ' + x.w + (x.o ? '\nOwner: ' + x.o : '') + (x.c ? '\nNote: ' + x.c : '') + '\nClick to drill into ' + x.e) + '">' + esc(x.e) + ' <small>' + esc(stShort(x.st)) + '</small></span>'; }).join('') || '<span class="nn">None</span>') + '</div></div>'; }
  function decisions() {
    var out = [], x = insideTop();
    if (x) out.push({ h: esc(x.t.r) + ': ' + sg(x.t.d) + ' ' + esc(CFG.unit) + ' against ' + esc(CFG.prev), p: esc(x.top) + ' is ' + pct(x.share, 0) + ' of it' + (x.later && Math.abs(x.later.d) >= 0.05 ? ' and its cost reappears in ' + yl(x.later.y) + ' (' + sg(x.later.d) + ')' : '') + '. Confirm it with the asset team before the round is approved.' });
    var up = classes().filter(function (z) { return z.d >= 0.05; }).sort(function (a, b) { return b.d - a.d; })[0];
    if (up) { var ba = Object.keys(up.by).map(function (a) { return { a: a, d: up.by[a].r - up.by[a].p }; }).sort(function (a, b) { return b.d - a.d; })[0]; out.push({ h: esc(up.c) + ' up ' + f1(up.d) + ' ' + esc(CFG.unit), p: (ba ? esc(ba.a) + ' carries ' + sg(ba.d) + '. ' : '') + 'Agree whether it is a run-rate change before the forecast is signed off.' }); }
    var so = signoff(), ret = so.by.Returned || []; if (ret.length) out.push({ h: ret.length + ' stage' + (ret.length > 1 ? 's' : '') + ' sent back', p: ret.map(function (z) { return esc(z.e) + ' (' + esc(stShort(z.st)).toLowerCase() + ')'; }).join(', ') + '. Hold sign-off until the resubmissions answer the return reasons.' });
    var as = assets().filter(function (a) { return isNum(prdxA(a)); }).sort(function (a, b) { return prdxA(b) - prdxA(a); }), port = wavg(prdxA);
    if (as[0] && isNum(port) && prdxA(as[0]) > port * 1.2) out.push({ h: esc(as[0]) + ' at ' + f0(prdxA(as[0])) + ' ' + esc(CFG.boeUnit), p: (prdxA(as[0]) / port).toFixed(1) + ' times the portfolio’s ' + f0(port) + ', with ' + pct(div(prodA(as[0]), prodT(CFG.round)), 0) + ' of the barrels. Decide where cost per barrel can come down.' });
    var j = co2Jump(); if (j && j.g > 0.05) out.push({ h: 'Chargeable CO2 up ' + pct(j.g, 0) + ' in ' + yl(j.y), p: 'The environmental tax steps up with it. The price path here is illustrative; replace it with Finance’s.' });
    return out.slice(0, 4);
  }
  function sDecide() {
    var ds = decisions();
    return head('For decision', ds.length + ' decisions for the CFO', 'Each one comes straight from the numbers in this story.') + '<div class="dcs">' + ds.map(function (d, i) { return '<div class="dc"><span class="dn2">' + (i + 1) + '</span><div><b>' + d.h + '</b><p>' + d.p + '</p></div></div>'; }).join('') + '</div>';
  }
  function sClose() {
    var pR = prodT(CFG.round), cR = costT(CFG.round), cP = costT(CFG.prev), px = wavg(prdxA), so = signoff();
    return '<div class="k">' + esc(BRAND.title) + ' ' + MID + ' ' + esc(CFG.round) + '</div><h2 class="h big">The round in one line</h2><p class="one">' + f0(pR) + ' ' + esc(CFG.prodUnit) + ' and ' + mn(cR) + ' of net cost in ' + FYL + ', ' + sg(cR - cP) + ' against ' + esc(CFG.prev) + '. Production cost ' + f0(px) + ' ' + esc(CFG.boeUnit) + '. Sign-off ' + pct(so.pct, 0) + ' complete.</p>' +
      '<div class="tiles">' + tile('Net production', f0(pR), esc(CFG.prodUnit) + ', ' + FYL, C.navy) + tile('Net cost', f1(cR), esc(CFG.unit) + ', ' + sg(cR - cP) + ' vs ' + esc(CFG.prev), C.blue) + tile('PRODEX', f0(px), esc(CFG.boeUnit), C.green) + tile('Sign-off', pct(so.pct, 0), (so.by.Returned || []).length + ' returned', C.orange) + '</div>' +
      '<div class="jump"><span>Questions? Jump straight back to</span>' + SEQ.filter(function (id) { return id !== 'close' && id !== 'title'; }).map(function (id) { return '<button data-go="' + id + '">' + esc(BY[id].t) + '</button>'; }).join('') + '</div>' +
      '<div class="acts"><button class="pbtn" data-act="overview">See the whole picture</button><button class="pbtn ghost" data-act="home">Start again</button></div>';
  }
  // ---------- drill panel: click a bar, a column or a name to see what is behind it ----------
  // Keys: a|asset, c|cost class, y|year, r|change reason. Each row inside the panel drills again; Back walks the stack.
  function drTiles(list) { return '<div class="drt">' + list.map(function (x) { return '<div style="--c:' + (x.c || C.navy) + '"><span>' + x.k + '</span><b>' + x.v + '</b>' + (x.s ? '<small>' + x.s + '</small>' : '') + '</div>'; }).join('') + '</div>'; }
  // rows [{k, n, r, p, c}]: this round, previous round, change; fmt formats values, cf formats the change, upBad colours a rise
  function drTable(title, rows, fmt, cf, upBad) {
    if (!rows.length) return '';
    var mx = 0; rows.forEach(function (x) { mx = Math.max(mx, Math.abs(x.r || 0)); }); mx = mx || 1;
    var h = '<div class="drs"><div class="drsh">' + title + '</div><div class="drg"><span></span><span>' + esc(CFG.round) + '</span><span>' + esc(CFG.prev) + '</span><span>Change</span></div>';
    rows.forEach(function (x) {
      var d = isNum(x.r) && isNum(x.p) ? x.r - x.p : null, dd = isNum(d) && Math.abs(d) >= 0.05, cl = dd ? ((d > 0) === upBad ? 'dru' : 'drd') : 'drc';
      h += '<div class="drw' + (x.k ? ' go' : '') + '"' + (x.k ? ' data-dk="' + esc(x.k) + '"' : '') + '><span class="drn"><em>' + esc(x.n) + (x.k ? ' ›' : '') + '</em><i style="background:' + (x.c || C.blue) + ';width:' + Math.max(2, Math.abs(x.r || 0) / mx * 100).toFixed(0) + '%"></i></span><span>' + fmt(x.r) + '</span><span class="drp">' + fmt(x.p) + '</span><span class="' + cl + '">' + (dd ? cf(d) : DASH) + '</span></div>';
    });
    var tr = sum(rows.map(function (x) { return x.r; })), tp = sum(rows.map(function (x) { return x.p; }));
    if (rows.length > 1) h += '<div class="drw tot"><span class="drn"><em>Total</em></span><span>' + fmt(tr) + '</span><span class="drp">' + fmt(tp) + '</span><span>' + (isNum(tr) && isNum(tp) ? cf(tr - tp) : DASH) + '</span></div>';
    return h + '</div>';
  }
  function dAsset(a) {
    var cR = costA(a, CFG.round), cP = costA(a, CFG.prev), pR = prodA(a), pP = prodA(a, CFG.prev);
    var cls = classes().map(function (z) { var b = z.by[a] || { r: 0, p: 0 }; return { k: 'c|' + z.c, n: z.c, r: b.r, p: b.p, c: b.r < 0 ? C.orange : C.blue }; }).filter(function (x) { return Math.abs(x.r) >= 0.05 || Math.abs(x.p) >= 0.05; });
    var yrs = YEARS.slice(0, 5).map(function (y) { return { k: 'y|' + y, n: yl(y), r: ay(CFG.round, a, y).cost, p: ay(CFG.prev, a, y).cost, c: C.navy }; }).filter(function (x) { return isNum(x.r) || isNum(x.p); });
    var pr = (S.prd[CFG.round] || {})[a] || {}, pp = (S.prd[CFG.prev] || {})[a] || {};
    var prods = Object.keys(pr).sort(function (x, y) { return (pr[y] || 0) - (pr[x] || 0); }).map(function (p) { return { n: p, r: pr[p], p: pp[p], c: C.sky }; });
    var wf = (S.stages || []).map(function (st) { var w = (S.wfs[a] || {})[st]; if (!w) return ''; var c = (S.wfc[a] || {})[st] || {}; return '<div class="drf"><i style="background:' + (ST_COL[w] || C.cloud) + '"></i><b>' + esc(stShort(st)) + '</b><span>' + esc(w) + (c.o ? ' ' + MID + ' ' + esc(c.o) : '') + '</span>' + (w === 'Returned' && c.r ? '<p>' + esc(c.r) + '</p>' : '') + '</div>'; }).join('');
    return { k: 'Asset' + (isNum(S.wi[a]) ? ' ' + MID + ' OKEA share ' + pct(S.wi[a], 2) : ''), t: a, s: FYL + ', OKEA net. Click a line to go deeper.',
      h: drTiles([{ k: 'Net production', v: f0(pR) + ' <small>' + esc(CFG.prodUnit) + '</small>', s: sg0(pR - pP) + ' vs ' + esc(CFG.prev), c: C.navy }, { k: 'Net cost', v: f1(cR) + ' <small>' + esc(CFG.unit) + '</small>', s: sg(cR - cP) + ' vs ' + esc(CFG.prev), c: C.blue }, { k: 'PRODEX', v: f0(prdxA(a)) + ' <small>' + esc(CFG.boeUnit) + '</small>', s: 'opex only ' + f0(opexA(a)), c: C.green }]) +
        drTable('Net cost by class, ' + esc(CFG.unit) + ', ' + FYL, cls, f1, sg, true) + drTable('Net cost by year, ' + esc(CFG.unit), yrs, f1, sg, true) +
        drTable('Net production by product, ' + esc(CFG.prodUnit) + ', ' + FYL, prods, f0, sg0, false) + (wf ? '<div class="drs"><div class="drsh">Sign-off by stage</div>' + wf + '</div>' : '') };
  }
  function dClass(c) {
    var z = classes().filter(function (q) { return q.c === c; })[0]; if (!z) return null;
    var rows = assets().map(function (a) { var b = z.by[a] || { r: 0, p: 0 }; return { k: 'a|' + a, n: a, r: b.r, p: b.p, c: acol(a) }; }).filter(function (x) { return Math.abs(x.r) >= 0.05 || Math.abs(x.p) >= 0.05; }).sort(function (x, y) { return Math.abs(y.r) - Math.abs(x.r); });
    return { k: 'Cost class', t: c, s: FYL + ', OKEA net: each licence’s 100% figure × OKEA’s share; OKEA’s own costs stay at 100%. ' + esc(CFG.prev) + ' costs are illustrative.',
      h: drTiles([{ k: esc(CFG.round), v: f1(z.r) + ' <small>' + esc(CFG.unit) + '</small>', c: C.navy }, { k: esc(CFG.prev), v: f1(z.p) + ' <small>' + esc(CFG.unit) + '</small>', c: C.cloud }, { k: 'Change', v: sg(z.d), c: z.d > 0 ? C.orange : C.green }]) + drTable('By asset, ' + esc(CFG.unit), rows, f1, sg, true) };
  }
  function dYear(y) {
    var as = assets();
    var rows = as.map(function (a) { return { k: 'a|' + a, n: a, r: ay(CFG.round, a, y).cost, p: ay(CFG.prev, a, y).cost, c: acol(a) }; }).filter(function (x) { return isNum(x.r) || isNum(x.p); });
    var prows = as.map(function (a) { return { k: 'a|' + a, n: a, r: ay(CFG.round, a, y).prod, p: ay(CFG.prev, a, y).prod, c: acol(a) }; }).filter(function (x) { return isNum(x.r) || isNum(x.p); });
    var cR = sum(rows.map(function (x) { return x.r; })), pR = sum(prows.map(function (x) { return x.r; })), co = (S.co2[CFG.round] || {})[y];
    var kt = co && isNum(co.price) && co.price ? co.tax * 1000 / co.price : null;
    return { k: 'Year', t: yl(y), s: 'OKEA net, ' + esc(CFG.round) + ' against ' + esc(CFG.prev) + '. Click an asset to drill into it.',
      h: drTiles([{ k: 'Net production', v: f0(pR) + ' <small>' + esc(CFG.prodUnit) + '</small>', c: C.navy }, { k: 'Net cost', v: f1(cR) + ' <small>' + esc(CFG.unit) + '</small>', c: C.blue }, { k: 'PRODEX', v: f0(isNum(pR) && pR ? sum(as.map(function (a) { var q = ay(CFG.round, a, y); return isNum(q.prdx) && isNum(q.prod) ? q.prdx * q.prod : null; })) / pR : null) + ' <small>' + esc(CFG.boeUnit) + '</small>', c: C.green }]) +
        drTable('Net cost by asset, ' + esc(CFG.unit), rows, f1, sg, true) + drTable('Net production by asset, ' + esc(CFG.prodUnit), prows, f0, sg0, false) +
        (co && isNum(co.tax) ? '<div class="drs"><div class="drsh">CO2 and environmental tax, gross (100%)</div>' + drTiles([{ k: 'Environmental tax', v: f1(co.tax) + ' <small>' + esc(CFG.unit) + '</small>', c: C.blue }, { k: 'CO2 price', v: f0(co.price) + ' <small>NOK/t</small>', c: C.cloud }, { k: 'Chargeable CO2', v: f0(kt) + ' <small>' + esc(CFG.co2Unit) + '</small>', c: C.orange }]) + '</div>' : '') };
  }
  function dReason(r) {
    var by = S.rsn[r] || {}, rows = Object.keys(by).map(function (a) { return { k: 'a|' + a, n: a, d: by[a], c: acol(a) }; }).filter(function (x) { return isNum(x.d) && Math.abs(x.d) >= 0.05; }).sort(function (x, y) { return Math.abs(y.d) - Math.abs(x.d); });
    var tot = sum(rows.map(function (x) { return x.d; })), mx = 0; rows.forEach(function (x) { mx = Math.max(mx, Math.abs(x.d)); }); mx = mx || 1;
    return { k: 'Change reason', t: r, s: FYL + ', OKEA net, against ' + esc(CFG.prev) + '. The reason is the one each controller set on the line (board 2 line review, board 5).',
      h: drTiles([{ k: 'Change against ' + esc(CFG.prev), v: sg(tot) + ' <small>' + esc(CFG.unit) + '</small>', c: tot > 0 ? C.orange : C.green }]) +
        '<div class="drs"><div class="drsh">By asset, ' + esc(CFG.unit) + '</div>' + rows.map(function (x) { return '<div class="drw go dro" data-dk="' + esc(x.k) + '"><span class="drn"><em>' + esc(x.n) + ' ›</em><i style="background:' + x.c + ';width:' + Math.max(2, Math.abs(x.d) / mx * 100).toFixed(0) + '%"></i></span><span class="' + (x.d > 0 ? 'dru' : 'drd') + '">' + sg(x.d) + '</span></div>'; }).join('') + '</div>' };
  }
  function drillView(key) {
    var i = String(key).indexOf('|'), t = key.slice(0, i), v = key.slice(i + 1);
    try { if (t === 'a') return dAsset(v); if (t === 'c') return dClass(v); if (t === 'y') return dYear(v); if (t === 'r') return dReason(v); }
    catch (e) { return { k: '', t: 'Could not open this', s: esc(String(e && e.message || e)), h: '' }; }
    return null;
  }
  function openDrill(key, push) { if (!key || !coreLoaded()) return; hideTip(); if (!push) S.dstack = []; S.dstack.push(key); renderDrill(); }
  function closeDrill() { S.dstack = []; var p = $('drill'); if (p) p.classList.remove('on'); }
  function renderDrill() {
    var p = $('drill'); if (!p) return;
    var st = S.dstack || [], key = st[st.length - 1], v = key ? drillView(key) : null;
    if (!v) { p.classList.remove('on'); return; }
    p.innerHTML = '<div class="drh">' + (st.length > 1 ? '<button class="drbk" data-dact="back">‹ Back</button>' : '') + '<button class="drx" data-dact="close" aria-label="Close">×</button><div class="drk">' + esc(v.k) + '</div><h3>' + esc(v.t) + '</h3>' + (v.s ? '<p>' + v.s + '</p>' : '') + '</div><div class="drb">' + v.h + '</div>';
    p.classList.add('on');
  }
  // Tooltips: one box that follows the pointer, filled from data-tip (first line bold), only on the slide in view.
  var tipEl = null;
  function hideTip() { var tp = $('ttp'); if (tp) tp.classList.remove('on'); tipEl = null; }
  function onMove(e) {
    var tp = $('ttp'); if (!tp) return;
    if (anim) { if (tipEl) hideTip(); return; }
    var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (el && !el.closest('.card.cur')) el = null;
    if (!el) { if (tipEl) hideTip(); return; }
    if (el !== tipEl) {
      tipEl = el; tp.textContent = '';
      String(el.getAttribute('data-tip') || '').split('\n').forEach(function (ln, i) { var d = document.createElement(i ? 'div' : 'b'); d.textContent = ln; if (i && /^Click /.test(ln)) d.className = 'tk'; tp.appendChild(d); });
      tp.classList.add('on');
    }
    var w = tp.offsetWidth, h = tp.offsetHeight, x = e.clientX + 16, y = e.clientY + 18;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y + h > window.innerHeight - HUD - 6) y = e.clientY - h - 12;
    tp.style.transform = 'translate(' + Math.max(6, x) + 'px,' + Math.max(6, y) + 'px)';
  }

  // Talk track for the presenter, written from the same numbers.
  function notes(id) {
    try {
      switch (id) {
        case 'root': return 'The whole round on one picture: the headline sits on the host in the middle and six topics are tied back to it. Click the centre to begin, or any circle to jump in.';
        case 'title': return 'Three numbers for ' + FYL + ': ' + f0(prodT(CFG.round)) + ' ' + CFG.prodUnit + ' of net production, ' + mn(costT(CFG.round)) + ' of net cost, and ' + f0(wavg(prdxA)) + ' ' + CFG.boeUnit + ' production cost. Each tile opens what is behind it.';
        case 'prod': var ps = products(CFG.round); return 'By product: ' + ps.map(function (x) { return x.p + ' ' + f0(x.v); }).join(', ') + '. Then by asset, with the change against ' + CFG.prev + ' on the right.';
        case 'classes': var cl = classes(); return cl.slice(0, 3).map(function (z) { return z.c + ' ' + f1(z.r) + ' (' + sg(z.d) + ')'; }).join('; ') + '. The dashed outline is ' + CFG.prev + '.';
        case 'prodex': return 'PRODEX by asset; the light bar inside is opex only, the dashed line is the portfolio. ' + CFG.prev + ' figures are on the right.';
        case 'longview': var pr = profile(), pk = pr.slice().sort(function (a, b) { return b.prod - a.prod; })[0]; return 'Production by asset per year, net cost as the line. Peak ' + (pk ? yl(pk.y) + ' at ' + f0(pk.prod) + ' ' + CFG.prodUnit : '') + '.';
        case 'bridge': var b = bridge(); return 'From ' + CFG.prev + ' ' + mn(b.p) + ' to ' + CFG.round + ' ' + mn(b.r) + ', reason by reason. Zoom into the biggest bar.';
        case 'timing': var x = insideTop(); return x ? x.top + ' is ' + pct(x.share, 0) + ' of ' + x.t.r.toLowerCase() + '. Point at the year the cost moves to, then read the reviewer’s reason.' : '';
        case 'co2': var j = co2Jump(); return j ? 'Point at ' + yl(j.y) + ': chargeable CO2 goes from ' + f0(j.from) + ' to ' + f0(j.to) + ' ' + CFG.co2Unit + '. The price path is illustrative.' : '';
        case 'ready': var so = signoff(); return 'Sign-off ' + pct(so.pct, 0) + ' complete. Zoom into the ring for the ' + (so.by.Returned || []).length + ' returned and why.';
        case 'returned': var so2 = signoff(); return (so2.by.Returned || []).map(function (z) { return z.e + ': ' + (z.r || 'no reason yet'); }).join(' ');
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
    { id: 'prod', parent: 'title', t: 'Production', f: sProd },
    { id: 'classes', parent: 'title', t: 'Net cost by class', f: sClasses },
    { id: 'prodex', parent: 'title', t: 'Cost per barrel', f: sPrdx },
    { id: 'longview', parent: 'root', t: 'The long view', f: sLong, ring: 0 },
    { id: 'bridge', parent: 'root', t: 'Against ' + CFG.prev, f: sBridge, ring: 1 },
    { id: 'timing', parent: 'bridge', t: 'Biggest move', f: sTiming },
    { id: 'co2', parent: 'root', t: 'CO2 and tax', f: sCO2, ring: 2 },
    { id: 'ready', parent: 'root', t: 'Readiness', f: sReady, ring: 3 },
    { id: 'returned', parent: 'ready', t: 'Returned, and why', f: sReturned },
    { id: 'decide', parent: 'root', t: 'Decisions', f: sDecide, ring: 4 },
    { id: 'close', parent: 'root', t: 'In one line', f: sClose, ring: 5 }
  ];
  var SEQ = ['title', 'prod', 'classes', 'prodex', 'longview', 'bridge', 'timing', 'co2', 'ready', 'returned', 'decide', 'close'];
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
  // Even pace with soft ends: the speed rises smoothly over the first 28% of the move, holds, then settles over the last 28%.
  var EA = 0.28, EV = 1 / (1 - EA);
  function ease(t) {
    if (t <= 0) return 0; if (t >= 1) return 1;
    if (t < EA) return EV * (t / 2 - EA / (2 * Math.PI) * Math.sin(Math.PI * t / EA));
    if (t > 1 - EA) { var q = 1 - t; return 1 - EV * (q / 2 - EA / (2 * Math.PI) * Math.sin(Math.PI * q / EA)); }
    return EV * (EA / 2 + t - EA);
  }
  // One smooth zoom-and-pan curve from a to b (van Wijk and Nuij, the path d3's zoom uses): it pulls back only as far as the
  // move needs and dives in again, at an even perceived speed, with no corner in the middle. w = width of world on screen.
  var RHO = 1.5;
  function zoomPath(a, b) {
    var v = vp(), w0 = v.w / a.z, w1 = v.w / b.z, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, r2 = RHO * RHO, S0, at;
    if (d2 < 1e-6 * w0 * w0) {
      S0 = Math.abs(Math.log(w1 / w0)) / RHO;
      at = function (t) { var w = w0 * Math.pow(w1 / w0, t); return { x: a.x + dx * t, y: a.y + dy * t, z: v.w / w, r: 0 }; };
    } else {
      var d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d2) / (2 * w0 * r2 * d1), b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d2) / (2 * w1 * r2 * d1);
      var q0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), q1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), ch0 = Math.cosh(q0), sh0 = Math.sinh(q0);
      S0 = (q1 - q0) / RHO;
      at = function (t) { var s = t * S0, u = w0 / (r2 * d1) * (ch0 * Math.tanh(RHO * s + q0) - sh0), w = w0 * ch0 / Math.cosh(RHO * s + q0); return { x: a.x + u * dx, y: a.y + u * dy, z: v.w / w, r: 0 }; };
    }
    return { S: S0, at: at };
  }
  function fly(a, b, done) {
    if (anim) { cancelAnimationFrame(anim); anim = null; }
    var w = $('world'); if (!w) return;
    hideTip();
    var p = zoomPath(a, b);
    if (reduced() || !(p.S > 0.001)) { cam = b; apply(cam); if (done) done(); return; }
    // the same perceived speed on every move: duration follows the length of the path
    var dur = Math.max(1000, Math.min(2600, 1000 * p.S)), t0 = null;
    root.classList.add('flying');
    function step(ts) {
      if (disposed) return; if (t0 == null) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur);
      cam = t < 1 ? p.at(ease(t)) : b; apply(cam);
      if (t < 1) anim = requestAnimationFrame(step); else { anim = null; root.classList.remove('flying'); if (done) done(); }
    }
    anim = requestAnimationFrame(step);
  }
  // Prezi path: one continuous curve into the target; diving into a child, the element you dive into pulses as the camera moves.
  function goId(id, instant) {
    if (!BY[id]) return;
    closeDrill();
    var from = S.cur, a = { x: cam.x, y: cam.y, z: cam.z, r: 0 }, b = camOf(id);
    S.cur = id; if (SEQ.indexOf(id) >= 0) S.si = SEQ.indexOf(id);
    markState(); renderHud();
    var pulseEl = (!instant && isAnc(from, id)) ? pulseTarget(from, pathTo(id)[pathTo(from).length]) : null;
    var tok = ++navTok;
    hideVeil(); if (anim) { cancelAnimationFrame(anim); anim = null; root.classList.remove('flying'); }
    if (pulseEl && !reduced()) { pulseEl.classList.add('pulse'); timer(function () { pulseEl.classList.remove('pulse'); }, 460); }
    if (instant) { cam = b; apply(cam); veil(); return; }
    fly(a, b, function () { if (tok === navTok) veil(); });
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
    root.innerHTML = '<div class="app"><div class="stage" id="stage"><div class="world" id="world"></div><div class="veil" id="veil"><i></i><i></i><i></i><i></i></div><div class="load" id="load"><span class="spin"></span>Loading the board pack from Pigment' + ELL + '</div></div>' +
      '<div class="notes" id="notes"></div><div class="errs" id="errs"></div><aside class="dr" id="drill" aria-live="polite"></aside><div class="ttp" id="ttp" role="tooltip"></div><footer class="hud" id="hud"></footer></div>';
    apply(cam);
  }
  // The overview: the headline on the host in the middle, six topics tied back to it by flowlines, seabed contours behind.
  function overviewLayer() {
    var W = OV.x1 - OV.x0, H = OV.y1 - OV.y0, ox = -OV.x0, oy = -OV.y0, cont = '', k, t;
    for (k = 0; k < 7; k++) {
      var rx = 640 + k * 250, ry = 380 + k * 140, d = '';
      for (t = 0; t <= 96; t++) { var a = t / 96 * Math.PI * 2, wob = 1 + 0.045 * Math.sin(3 * a + k * 0.9) + 0.025 * Math.sin(7 * a + k * 1.7); d += (t ? 'L' : 'M') + (ox + rx * wob * Math.cos(a)).toFixed(1) + ' ' + (oy + ry * wob * Math.sin(a)).toFixed(1); }
      cont += '<path d="' + d + 'Z" fill="none" stroke="rgba(152,217,247,' + (0.1 - k * 0.011).toFixed(3) + ')" stroke-width="3"/>';
    }
    var flows = NODES.filter(function (n) { return n.ring != null; }).map(function (n) {
      var p = ringPos(n.ring), ang = Math.atan2(p.y / RING.ry, p.x / RING.rx), sx = ox + Math.cos(ang) * 600, sy = oy + Math.sin(ang) * 360, tx = ox + p.x, ty = oy + p.y;
      var mx = (sx + tx) / 2 - (ty - sy) * 0.14, my = (sy + ty) / 2 + (tx - sx) * 0.14;
      var dd = 'M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + sx.toFixed(1) + ' ' + sy.toFixed(1);
      return '<path d="' + dd + '" fill="none" stroke="rgba(152,217,247,.22)" stroke-width="22" stroke-linecap="round"/><path class="flow" d="' + dd + '" fill="none" stroke="' + C.sky + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="2 46"/>';
    }).join('');
    var compass = '<g transform="translate(' + (W - 170) + ' 170)"><circle r="78" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3"/><path d="M0 -64L18 0L0 64L-18 0Z" fill="rgba(255,255,255,.14)"/><path d="M0 -64L18 0L-18 0Z" fill="' + C.sky + '"/><text y="-90" text-anchor="middle" class="cmp">N</text></g>';
    var svg = '<svg class="ringsvg" style="left:' + OV.x0 + 'px;top:' + OV.y0 + 'px" width="' + W + '" height="' + H + '">' + cont + flows + compass + '</svg>';
    var circles = NODES.filter(function (n) { return n.ring != null; }).map(function (n) {
      var p = ringPos(n.ring), r = RING.r;
      return '<div class="tc" data-go="' + n.id + '" style="left:' + (p.x - r) + 'px;top:' + (p.y - r) + 'px;width:' + (2 * r) + 'px;height:' + (2 * r) + 'px"><span class="tct">' + esc(n.t) + '</span><span class="tcn">' + (SEQ.indexOf(n.id) + 1) + '</span></div>';
    }).join('');
    var brand = '<div class="ovb" style="left:' + (OV.x0 + 40) + 'px;top:' + (OV.y0 + 36) + 'px">' + BRAND.logo(96, '#ffffff') + '<div><span>' + esc(BRAND.title) + ' ' + MID + ' ' + esc(BRAND.kicker) + '</span></div></div>';
    var as = assets().filter(function (a) { return isNum(S.wi[a]); });
    var share = as.length ? '<div class="ova" style="left:' + (OV.x1 - 640) + 'px;width:600px;top:' + (OV.y1 - 100 - 56 * (as.length + 1)) + 'px"><span>OKEA share</span>' + as.map(function (a) { return '<b><i style="background:' + acol(a) + '"></i>' + esc(a) + ' ' + pct(S.wi[a], 1) + '</b>'; }).join('') + '</div>' : '';
    var hint = '<div class="ovh" style="left:' + (OV.x0 + 40) + 'px;top:' + (OV.y1 - 120) + 'px">Click the centre to begin, or any circle to zoom straight in</div>';
    var glow = '<div class="hg" style="left:' + (-DW * HEAD_K / 2 - 60) + 'px;top:' + (-DH * HEAD_K / 2 - 60) + 'px;width:' + (DW * HEAD_K + 120) + 'px;height:' + (DH * HEAD_K + 120) + 'px"><span class="tcn">1</span></div>';
    return '<div class="ovl" id="ovl">' + svg + glow + circles + brand + share + hint + '</div>';
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
    layout(); markState(); tipEl = null;
    if (S.intro && !anim) { cam = camOf(S.cur); apply(cam); veil(); }
    if (S.dstack.length) renderDrill();
    renderNotes();
  }
  function renderHud() {
    var h = $('hud'); if (!h) return;
    var n = SEQ.length, pth = pathTo(S.cur);
    var crumbs = pth.map(function (id, i) { return (i ? '<i>›</i>' : '') + '<button class="crumb' + (id === S.cur ? ' on' : '') + '" data-go="' + id + '">' + esc(BY[id].t) + '</button>'; }).join('');
    h.innerHTML = '<div class="hb">' + BRAND.logo(16, '#ffffff') + '</div>' +
      '<div class="hc"><button class="hbtn" data-act="prev" aria-label="Previous">‹</button><div class="cnt"><b>' + (S.cur === 'root' ? n + ' stops' : (S.si + 1) + ' / ' + n) + '</b><div class="crumbs">' + crumbs + '</div></div><button class="hbtn" data-act="next" aria-label="Next">›</button></div>' +
      '<div class="hr"><button class="hbtn txt" data-act="up" title="Up one level (Esc)">Up <kbd>Esc</kbd></button><button class="hbtn txt' + (S.cur === 'root' ? ' on' : '') + '" data-act="overview">Overview <kbd>O</kbd></button><button class="hbtn txt' + (S.notes ? ' on' : '') + '" data-act="notes">Notes <kbd>N</kbd></button></div>' +
      '<div class="prog"><i style="width:' + (S.cur === 'root' ? 0 : ((S.si + 1) / n * 100)).toFixed(1) + '%"></i></div>';
    renderNotes();
  }
  function renderNotes() { var nb = $('notes'); if (!nb) return; nb.style.display = S.notes && coreLoaded() ? 'block' : 'none'; if (S.notes) nb.innerHTML = '<div class="nk">Talk track ' + MID + ' ' + esc(BY[S.cur].t) + '</div><p>' + esc(notes(S.cur)) + '</p>'; }

  // ---------- events ----------
  function onClick(e) {
    // inside the drill panel: Back, Close, or a row that drills one level deeper
    var dp = e.target.closest ? e.target.closest('#drill') : null;
    if (dp) {
      var da = e.target.closest('[data-dact]'), dk = e.target.closest('[data-dk]');
      if (da) { if (da.getAttribute('data-dact') === 'back') { S.dstack.pop(); renderDrill(); } else closeDrill(); }
      else if (dk) openDrill(dk.getAttribute('data-dk'), true);
      return;
    }
    // a bar, column or name on the slide in view opens the drill panel instead of moving on
    var dd = e.target.closest ? e.target.closest('[data-drill]') : null;
    if (dd && dd.closest('.card.cur') && !anim) { openDrill(dd.getAttribute('data-drill')); return; }
    var b = e.target.closest ? e.target.closest('[data-act]') : null;
    if (b) { var a = b.getAttribute('data-act'); if (a === 'next') next(); else if (a === 'prev') prev(); else if (a === 'up') up(); else if (a === 'home') goId(SEQ[0]); else if (a === 'overview') { if (S.cur === 'root') goId(SEQ[S.si || 0]); else goId('root'); } else if (a === 'notes') { S.notes = !S.notes; renderHud(); } return; }
    var g = e.target.closest ? e.target.closest('[data-go]') : null;
    if (g) { var id = g.getAttribute('data-go'); if (id !== S.cur) goId(id); return; }
    if (!coreLoaded() || !e.target.closest || !e.target.closest('#stage')) return;
    var c = e.target.closest('.card');
    if (c) { var cid = c.getAttribute('data-id'); if (cid !== S.cur) { goId(cid); return; } }
    if (S.dstack.length) { closeDrill(); return; }
    if (S.cur !== 'root') next();
  }
  function onKey(e) {
    var k = e.key;
    if (S.dstack.length && (k === 'Escape' || k === 'Backspace')) { e.preventDefault(); if (k === 'Backspace' && S.dstack.length > 1) { S.dstack.pop(); renderDrill(); } else closeDrill(); return; }
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
    '.stage{position:absolute;left:0;top:0;right:0;bottom:' + HUD + 'px;overflow:hidden;background:radial-gradient(1500px 1000px at 32% 28%,#0B6390 0%,' + C.navy + ' 40%,' + C.navy3 + ' 100%);cursor:pointer;user-select:none}',
    '.stage::before{content:"";position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:64px 64px}',
    '.world{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0}',
    '.ovl{position:absolute;left:0;top:0;transition:opacity .6s}.app:not(.ov) .ovl{opacity:.45}',
    '.ringsvg{position:absolute;pointer-events:none}.cmp{font-size:44px;font-weight:800;fill:rgba(255,255,255,.55)}',
    '.flow{animation:fl 2.6s linear infinite}@keyframes fl{to{stroke-dashoffset:-48}}.flying .flow{animation-play-state:paused}',
    '.tc{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 40%,' + C.paper + ' 0%,' + C.bg + ' 100%);box-shadow:0 30px 90px rgba(0,10,20,.5),0 0 0 14px rgba(152,217,247,.16);cursor:pointer;transition:box-shadow .3s}',
    '.tc:hover{box-shadow:0 30px 90px rgba(0,10,20,.5),0 0 0 18px ' + C.green + '}',
    '.tct{position:absolute;left:96px;right:96px;top:48px;height:96px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:31px;font-weight:800;line-height:1.12;color:' + C.navy + '}',
    '.tcn{position:absolute;left:50%;bottom:30px;transform:translateX(-50%);width:62px;height:62px;border-radius:50%;background:' + C.green + ';color:' + C.navy2 + ';font-size:32px;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.hg{position:absolute;border-radius:70px;background:rgba(255,255,255,.06);border:3px solid rgba(152,217,247,.28)}.hg .tcn{bottom:auto;top:-31px}',
    '.ovb{position:absolute;display:flex;align-items:center;gap:30px;color:#ffffff}.ovb b{display:block;font-size:92px;font-weight:800;line-height:1;letter-spacing:.06em}.ovb span{display:block;font-size:44px;opacity:.75;margin-top:10px}',
    '.ova{position:absolute;display:flex;flex-direction:column;align-items:flex-end;gap:10px;color:#ffffff}.ova span{font-size:28px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.6}.ova b{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:700;opacity:.9}.ova i{width:22px;height:22px;border-radius:50%;display:inline-block;box-shadow:0 0 0 3px rgba(255,255,255,.75)}',
    '.ovh{position:absolute;font-size:38px;color:rgba(255,255,255,.6);white-space:nowrap}',
    '.card{position:absolute;width:' + DW + 'px;height:' + DH + 'px;transform-origin:50% 50%;background:' + C.paper + ';border-radius:30px;box-shadow:0 30px 90px rgba(0,10,20,.4);transition:opacity .6s}',
    '.card::before{content:"";position:absolute;left:64px;top:26px;width:96px;height:6px;border-radius:3px;background:linear-gradient(90deg,' + C.green + ',' + C.blue + ')}',
    '.sl{position:absolute;inset:0;padding:54px 64px 40px;border-radius:30px;overflow:hidden}',
    '.portal{position:absolute;border-radius:50%;background:' + C.bg + ';border:5px solid ' + C.blue + ';box-shadow:0 10px 30px rgba(0,30,60,.22);cursor:zoom-in;z-index:1}',
    '.portal::after{content:"";position:absolute;inset:-14px;border-radius:50%;border:3px solid ' + C.green + ';opacity:0}',
    '.pulse::after,.tc.pulse{animation:pz .42s ease-out}@keyframes pz{0%{opacity:.9;transform:scale(.92)}100%{opacity:0;transform:scale(1.25)}}',
    '.tc.pulse{box-shadow:0 0 0 26px ' + C.green + '}',
    '.plab{position:absolute;width:320px;text-align:center;font-size:17px;font-weight:800;color:' + C.navy + ';cursor:zoom-in;z-index:1}',
    '.pwrap{position:relative}',
    '.veil{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .45s}.veil.on{opacity:1}.veil i{position:absolute;display:block;background:rgba(2,27,42,.4);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px)}',
    '.flying .card{transition:none}',
    '.hit{fill:' + C.navy + ';fill-opacity:0;transition:fill-opacity .15s}.card.cur .hit[data-drill]{cursor:pointer}.card.cur .hit:hover{fill-opacity:.06}',
    '.card.cur [data-drill]:not(.hit){cursor:pointer}.card.cur .plc span[data-drill]:hover{background:' + C.blueSoft + ';border-color:' + C.blue + '}.card.cur .rch b[data-drill]:hover{text-decoration:underline}.card.cur .sc[data-tip]{cursor:help}',
    '.ttp{position:absolute;left:0;top:0;z-index:40;pointer-events:none;max-width:340px;padding:10px 13px;border-radius:12px;background:rgba(2,30,46,.96);color:#ffffff;font-size:13px;line-height:1.45;box-shadow:0 14px 34px rgba(0,0,0,.35);opacity:0;transition:opacity .12s}',
    '.ttp.on{opacity:1}.ttp b{display:block;font-size:14px;font-weight:800;margin-bottom:3px}.ttp .tk{margin-top:5px;font-size:12px;font-weight:700;color:' + C.green + '}',
    '.dr{position:absolute;top:18px;right:18px;bottom:' + (HUD + 18) + 'px;width:470px;max-width:calc(100% - 36px);background:#ffffff;color:' + C.ink + ';border-radius:22px;box-shadow:0 26px 80px rgba(0,10,20,.5);transform:translateX(calc(100% + 40px));transition:transform .42s cubic-bezier(.22,.8,.24,1);display:flex;flex-direction:column;overflow:hidden;z-index:30}.dr.on{transform:none}',
    '.drh{position:relative;flex:none;padding:18px 58px 16px 22px;background:' + C.navy + ';color:#ffffff}.drh h3{margin:3px 0 0;font-size:24px;font-weight:800;line-height:1.2}.drh p{margin:6px 0 0;font-size:13px;line-height:1.45;opacity:.82}.drk{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + C.sky + '}',
    '.drx{position:absolute;right:14px;top:14px;width:34px;height:34px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#ffffff;font:inherit;font-size:22px;line-height:1;cursor:pointer}.drx:hover,.drbk:hover{background:rgba(255,255,255,.26)}.drbk{display:inline-block;margin-bottom:8px;background:rgba(255,255,255,.14);border:0;color:#ffffff;border-radius:999px;padding:4px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}',
    '.drb{flex:1;overflow:auto;padding:16px 20px 22px}.drt{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}.drt>div{background:' + C.bg + ';border-radius:12px;padding:9px 12px;border-left:5px solid var(--c)}.drt span{display:block;font-size:11px;font-weight:700;color:' + C.mut + '}.drt b{display:block;font-size:21px;font-weight:800;color:' + C.navy + ';margin-top:2px;white-space:nowrap}.drt b small{font-size:11px;font-weight:600;color:' + C.mut + '}.drt>div>small{display:block;font-size:11px;color:' + C.mut + ';margin-top:2px}',
    '.drs{margin-top:18px}.drsh{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + C.mut + ';margin-bottom:6px}.drg,.drw{display:grid;grid-template-columns:minmax(0,1fr) 72px 72px 66px;gap:8px;align-items:center}.drw.dro{grid-template-columns:minmax(0,1fr) 80px}',
    '.drg{font-size:11px;font-weight:700;color:' + C.mut + ';padding:0 8px 4px}.drg span,.drw>span{text-align:right}.drg span:first-child,.drw>.drn{text-align:left}.drw{font-size:13.5px;padding:7px 8px;border-radius:9px;color:' + C.ink + '}.drw.go{cursor:pointer}.drw.go:hover{background:' + C.blueSoft + '}.drw.tot{border-top:2px solid ' + C.line + ';border-radius:0;font-weight:800;margin-top:4px}',
    '.drn{position:relative;min-width:0;padding-bottom:5px}.drn em{display:block;font-style:normal;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.drn i{position:absolute;left:0;bottom:0;height:3px;border-radius:2px;opacity:.8}.drp,.drc{color:' + C.mut + '}.dru{color:' + C.orange + ';font-weight:800}.drd{color:' + C.greenInk + ';font-weight:800}',
    '.drf{display:grid;grid-template-columns:10px 1fr auto;gap:4px 10px;align-items:center;padding:7px 8px;border-bottom:1px solid ' + C.lineSoft + ';font-size:13px}.drf i{width:10px;height:10px;border-radius:50%}.drf b{color:' + C.navy + '}.drf span{color:' + C.mut + ';text-align:right}.drf p{grid-column:2 / 4;margin:2px 0 0;padding:8px 10px;border-radius:8px;background:' + C.orangeSoft + ';color:' + C.ink + ';font-size:12.5px;line-height:1.45}',
    '.k{font-size:16px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:' + C.navy + ';opacity:.75}',
    '.h{font-size:42px;font-weight:800;color:' + C.navy + ';line-height:1.14;margin:12px 0 10px;letter-spacing:-.01em}.h.big{font-size:60px;margin-top:20px}',
    '.l{font-size:20px;color:' + C.mut + ';line-height:1.5;max-width:1100px}',
    '.itag{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + C.navy + ';background:' + C.amberSoft + ';border:1px solid ' + C.amber + ';border-radius:999px;padding:2px 9px;vertical-align:2px}',
    '.brandrow{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:800;color:' + C.navy + ';margin-bottom:28px;letter-spacing:.06em}',
    '.t1{font-size:84px;font-weight:800;color:' + C.navy + ';letter-spacing:-.02em;line-height:1.02;margin:14px 0 16px}',
    '.agenda{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;max-width:1150px}.agenda span{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:' + C.navy + ';background:' + C.blueSoft + ';border-radius:999px;padding:7px 14px 7px 7px;cursor:pointer}.agenda span:hover{background:' + C.sky + '}.agenda b{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:' + C.navy + ';color:#ffffff;font-size:12px}',
    '.heroes{position:absolute;left:64px;right:64px;bottom:44px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:22px}',
    '.hero{position:relative;border-radius:22px;background:' + C.bg + ';padding:20px 24px;border-left:8px solid var(--c);height:224px}.hero.hp{padding-right:144px}.hl2{font-size:16px;font-weight:700;color:' + C.mut + ';line-height:1.3}.hv{font-size:50px;font-weight:800;color:' + C.navy + ';letter-spacing:-.02em;line-height:1.1;margin-top:8px}.hs{font-size:15px;color:' + C.mut + ';margin-top:6px;line-height:1.35}',
    '.chartbox{margin-top:20px}.svg{display:block;overflow:visible}.svg text{font-family:' + FONT + '}',
    '.wv{font-size:19px;font-weight:800}.wl{font-size:16px;fill:' + C.mut + ';font-weight:600}.ax{font-size:15px;fill:' + C.mut + '}.axb{font-weight:800;fill:' + C.navy + '}.ac{fill:' + C.orange + '}.zn{font-size:13px;font-weight:800;letter-spacing:.12em;fill:' + C.mut + '}.zn.ac{fill:' + C.orange + '}.pl2{font-size:15px;font-weight:800;fill:' + C.orange + '}',
    '.bl{font-size:18px;fill:' + C.ink + ';font-weight:600}.bv{font-size:19px;font-weight:800;fill:' + C.ink + '}.bs{font-size:15px;fill:' + C.mut + '}.bs.up{fill:' + C.orange + ';font-weight:700}.bs.dn{fill:' + C.greenInk + ';font-weight:700}.sgl{font-size:14px;font-weight:800}',
    '.lg{display:flex;gap:24px;font-size:16px;color:' + C.mut + ';margin-top:14px;align-items:center;flex-wrap:wrap}.lg i{display:inline-block;width:14px;height:14px;border-radius:50%;margin-right:8px;vertical-align:-1px}.lg i.dsh{border:2px dashed;height:14px;width:22px;border-radius:4px;background:none}',
    '.two{display:grid;grid-template-columns:820px 1fr;gap:28px;align-items:start}.two.w2{grid-template-columns:880px 1fr}',
    '.stats{display:grid;gap:14px;margin-top:22px}.st{background:' + C.bg + ';border-radius:18px;padding:14px 20px;border-left:6px solid var(--c,' + C.navy + ')}.st span{display:block;font-size:15px;color:' + C.mut + ';font-weight:700}.st b{display:block;font-size:32px;font-weight:800;color:' + C.navy + ';margin-top:2px}.st small{font-size:15px;color:' + C.mut + ';font-weight:600}',
    '.note{font-size:14px;color:' + C.mut + ';line-height:1.5}',
    '.tim{display:grid;grid-template-columns:520px 1fr;gap:40px;margin-top:22px;align-items:start}.sh{font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:' + C.mut + ';margin-bottom:12px}',
    '.rq{margin-top:22px;background:' + C.orangeSoft + ';border-left:8px solid ' + C.orange + ';border-radius:18px;padding:16px 20px}.rq small{display:block;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + C.orange + ';margin-bottom:6px}.rq p{font-size:18px;line-height:1.45;color:' + C.ink + ';font-weight:600}.rq span{display:block;margin-top:8px;font-size:14px;color:' + C.mut + '}',
    '.rdy{display:grid;grid-template-columns:300px 220px 1fr;gap:34px;align-items:start;margin-top:26px}.rng{position:relative;width:300px;height:300px}.rngc{position:absolute;left:-40px;right:-40px;top:312px;text-align:center;font-size:17px;color:' + C.mut + '}.rngc b{font-size:26px;color:' + C.navy + '}.rr2{color:' + C.orange + ';font-weight:800}',
    '.cnts{display:grid;gap:14px;margin-top:20px}.sc{display:grid;grid-template-columns:16px 44px 1fr;gap:10px;align-items:center;font-size:17px}.sc i{width:16px;height:16px;border-radius:50%}.sc b{font-size:28px;color:' + C.navy + '}.sc span{color:' + C.mut + '}',
    '.lists{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:26px}.lists.v{grid-template-columns:1fr;margin-top:0}.pl{background:' + C.bg + ';border-radius:18px;padding:16px 20px}.plh{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:' + C.mut + '}.plh i{width:14px;height:14px;border-radius:50%}.plh b{color:' + C.navy + ';font-size:18px}.plc{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.plc span{background:#ffffff;border:1px solid ' + C.line + ';border-radius:999px;padding:6px 14px;font-size:16px;font-weight:700;color:' + C.ink + '}.plc small{font-weight:500;color:' + C.mut + ';font-size:13px;margin-left:4px}.plc .nn{color:' + C.mut + ';font-weight:500}',
    '.rcs{display:grid;grid-template-columns:repeat(auto-fit,minmax(0,1fr));gap:22px;margin-top:28px}.rc{background:' + C.orangeSoft + ';border-radius:22px;padding:24px 26px;border-left:8px solid ' + C.orange + '}.rch{display:flex;justify-content:space-between;align-items:baseline;gap:12px}.rch b{font-size:30px;color:' + C.navy + '}.rch span{font-size:15px;color:' + C.mut + '}',
    '.rc small{display:block;font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:' + C.orange + ';margin-bottom:6px}.rcr{margin-top:16px}.rcr p{font-size:23px;line-height:1.45;color:' + C.ink + ';font-weight:600}.rcn{margin-top:18px;background:#ffffff;border-radius:14px;padding:14px 16px}.rcn small{color:' + C.mut + '}.rcn p{font-size:17px;line-height:1.45;color:' + C.ink + '}.rco{margin-top:12px;font-size:15px;color:' + C.mut + '}.none{font-size:19px;color:' + C.mut + '}',
    '.rcs.one{grid-template-columns:1fr;margin-top:20px}.rc.rich{padding:20px 26px}.rc.rich .rcr{margin-top:12px}.rc.rich .rcr p{font-size:20px}.rc.rich .rcn{margin-top:14px;padding:12px 16px}.rc.rich .rcn p{font-size:16px}',
    '.rcg{display:grid;grid-template-columns:1fr 300px;gap:28px;align-items:start}.rcx{display:grid;gap:10px;margin-top:12px}.rcx .st{background:#ffffff;padding:10px 16px}.rcx .st span{font-size:14px}.rcx .st b{font-size:24px}.rcx .st small{display:inline;margin:0;font-size:14px;font-weight:600;letter-spacing:0;text-transform:none;color:' + C.mut + '}',
    '.rst{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-top:16px;padding-top:14px;border-top:1px solid rgba(239,108,34,.25)}.rst span{display:block;background:#ffffff;border-radius:12px;padding:8px 12px;border-top:5px solid var(--c)}.rst span.on{box-shadow:0 0 0 3px ' + C.orange + '}.rst i{display:none}.rst b{display:block;font-size:14px;color:' + C.navy + ';line-height:1.25}.rst small{display:block;margin:4px 0 0;font-size:13px;font-weight:600;letter-spacing:0;text-transform:none;color:' + C.mut + '}',
    '.jump{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:34px}.jump span{font-size:15px;font-weight:700;color:' + C.mut + ';margin-right:6px}.jump button{font:inherit;font-size:15px;font-weight:700;color:' + C.navy + ';background:' + C.blueSoft + ';border:0;border-radius:999px;padding:8px 16px;cursor:pointer}.jump button:hover{background:' + C.sky + '}',
    '.dcs{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:20px;margin-top:28px;height:440px}.dc{display:flex;gap:20px;background:' + C.bg + ';border-radius:22px;padding:26px 28px;border-left:8px solid ' + C.blue + '}.dn2{flex:none;width:54px;height:54px;border-radius:50%;background:' + C.navy + ';color:#ffffff;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center}.dc b{display:block;font-size:26px;color:' + C.navy + ';line-height:1.25}.dc p{font-size:18px;color:' + C.mut + ';line-height:1.5;margin-top:10px}',
    '.one{font-size:32px;line-height:1.4;color:' + C.ink + ';font-weight:600;margin-top:18px;max-width:1120px}',
    '.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:40px}.tl{background:' + C.bg + ';border-radius:20px;padding:20px 22px;border-left:8px solid var(--c)}.tl span{display:block;font-size:15px;font-weight:700;color:' + C.mut + '}.tl b{display:block;font-size:40px;font-weight:800;color:' + C.navy + ';margin:4px 0 2px}.tl small{font-size:14px;color:' + C.mut + '}',
    '.acts{position:absolute;left:64px;bottom:52px;display:flex;gap:16px}.pbtn{font:inherit;font-size:20px;font-weight:700;border-radius:14px;padding:14px 26px;border:2px solid ' + C.navy + ';background:' + C.navy + ';color:#ffffff;cursor:pointer}.pbtn.ghost{background:#ffffff;color:' + C.navy + '}',
    '.hud{position:absolute;left:0;right:0;bottom:0;height:' + HUD + 'px;background:' + C.navy3 + ';color:#ffffff;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 20px;border-top:1px solid rgba(255,255,255,.08)}',
    '.hb{display:flex;align-items:center;gap:10px;min-width:0}.hb b{font-size:15px;letter-spacing:.08em}',
    '.hc{display:flex;align-items:center;gap:14px;min-width:0}.cnt{display:flex;flex-direction:column;align-items:center;width:min(440px,46vw);min-width:0;line-height:1.2}.cnt>b{font-size:13px;opacity:.75}',
    '.crumbs{display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap;overflow:hidden;max-width:100%}.crumbs i{font-style:normal;opacity:.45;font-size:13px}.crumb{font:inherit;font-size:14px;color:rgba(255,255,255,.72);background:none;border:0;padding:2px 4px;border-radius:6px;cursor:pointer}.crumb:hover{background:rgba(255,255,255,.1);color:#ffffff}.crumb.on{color:#ffffff;font-weight:800}',
    '.hr{display:flex;gap:8px}.hbtn{font:inherit;font-size:22px;font-weight:700;width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#ffffff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}.hbtn:hover{background:rgba(255,255,255,.14)}',
    '.hbtn.txt{width:auto;padding:0 14px;font-size:13px}.hbtn.on{background:' + C.green + ';color:' + C.navy2 + ';border-color:' + C.green + '}.hbtn kbd{font-family:inherit;font-size:11px;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,.16)}.hbtn.on kbd{background:rgba(0,0,0,.12)}',
    '.prog{position:absolute;left:0;right:0;top:-3px;height:3px;background:rgba(255,255,255,.08)}.prog i{display:block;height:100%;background:linear-gradient(90deg,' + C.green + ',' + C.blue + ');transition:width .6s}',
    '.notes{position:absolute;left:50%;bottom:' + (HUD + 16) + 'px;transform:translateX(-50%);width:min(860px,calc(100% - 32px));background:rgba(2,30,46,.94);color:#ffffff;border-radius:16px;padding:16px 20px;display:none;box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:5}.nk{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:' + C.green + ';margin-bottom:6px}.notes p{font-size:15px;line-height:1.55;margin:0}',
    '.errs{position:absolute;left:16px;top:16px;max-width:560px;background:' + C.orangeSoft + ';color:' + C.orange + ';border-radius:12px;padding:10px 14px;font-size:12px;display:none;z-index:6}',
    '.load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:12px;color:#ffffff;font-size:15px}.spin{width:18px;height:18px;border-radius:50%;border:3px solid rgba(255,255,255,.25);border-top-color:#ffffff;animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}',
    '@media (prefers-reduced-motion:reduce){.spin,.pulse::after,.tc.pulse,.flow{animation:none}.prog i,.veil,.ovl,.card,.dr,.ttp{transition:none}}',
    '@media (max-width:900px){.hb b{display:none}.hbtn.txt kbd{display:none}.hbtn.txt{padding:0 10px}.hud{padding:0 10px;gap:8px}.crumbs{max-width:42vw}}',
    '@media (max-width:560px){.hr .hbtn.txt:first-child{display:none}.hb{display:none}.crumbs{max-width:50vw}}'
  ].join('\n');
  document.head.appendChild(css);

  shell();
  renderHud();
  on(root, 'click', onClick);
  on(root, 'mousemove', onMove);
  on(root, 'mouseleave', hideTip);
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
