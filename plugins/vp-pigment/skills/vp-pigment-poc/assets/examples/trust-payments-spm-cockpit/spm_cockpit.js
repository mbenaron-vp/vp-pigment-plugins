(function () {
  'use strict';
  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var disposed = false, timers = [], subs = {}, listeners = [];
  var GBP = 'Â£', DASH = 'â€“';
  var C = { navy: '#1B478B', blue: '#2079EE', jade: '#14B8A6', pine: '#0D9488', coral: '#F43F5E', amber: '#F59E0B', gold: '#FCD34D', seafoam: '#E0EAE9', cloud: '#AABED6', ink: '#181818', violet: '#96A0FF', slate: '#2D4E71', mut: '#64748b', line: '#e2e8f0', bg: '#f6f8fb' };
  var VCOL = ['#2079EE', '#1B478B', '#14B8A6', '#96A0FF', '#F59E0B', '#2D4E71', '#F43F5E', '#0D9488'];
  var OPEN_REP = 'Hannah Lowe', OPEN_Q = 'Q3 26';
  var TOUR_KEY = 'trustpayments_spm_cockpit_tour_seen_v1';

  var S = {
    reps: [], rep: {}, seg: {}, att: {}, months: [], co: {}, q: {}, quarters: [], rv: {}, bands: [], grid: {}, verticals: [],
    window: null, merchants: {}, merch: {}, loaded: {}, errors: {}, teamOf: {},
    selRep: OPEN_REP, selQ: OPEN_Q, step: 1, busy: '', toast: null, recalc: false,
    ORIG: {}, explain: null, stack: [], tour: -1, base: null, editing: false
  };

  // ---------- helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function nz(v) { return isNum(v) ? v : null; }
  function sv(v) { return typeof v === 'string' ? v : (v && typeof v === 'object' && typeof v.name === 'string' ? v.name : ''); }
  function lab(x) { return typeof x === 'string' ? x : (x && typeof x === 'object' && typeof x.name === 'string' ? x.name : ''); }
  function timer(fn, ms) { var t = setTimeout(function () { if (!disposed) fn(); }, ms); timers.push(t); return t; }
  function on(el, ev, fn) { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); }
  function commas(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function money(v) {
    if (!isNum(v)) return DASH;
    var a = Math.abs(v), s;
    if (a >= 1e6) s = (a / 1e6).toFixed(2) + 'm';
    else if (a >= 1e4) s = (a / 1e3).toFixed(0) + 'k';
    else s = commas(a.toFixed(0));
    s = GBP + s;
    return v < 0 ? '(' + s + ')' : s;
  }
  function moneyFull(v) { return isNum(v) ? (v < 0 ? '(' : '') + GBP + commas(Math.abs(v).toFixed(0)) + (v < 0 ? ')' : '') : DASH; }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 0 : dp) + '%' : DASH; }
  function mult(v) { return isNum(v) ? v.toFixed(1) + 'x' : DASH; }
  function MON(s) { var m = /^([A-Za-z]{3})\w*\s+(\d{2,4})$/.exec(s || ''); if (!m) return null; var mi = 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(m[1].slice(0, 3)) / 3; var y = +m[2]; if (y < 100) y += 2000; return y * 12 + mi; }
  function QKEY(q) { var m = /^Q(\d)\s+(\d{2})$/.exec(q || ''); return m ? (+m[2]) * 4 + (+m[1]) : 0; }
  function attCol(a) { if (!isNum(a)) return '#cbd5e1'; if (a >= 1.2) return C.pine; if (a >= 1) return C.jade; if (a >= 0.8) return C.amber; return C.coral; }
  function chip(a) { return '<span class="chip" style="background:' + attCol(a) + '">' + pct(a) + '</span>'; }

  // ---------- data ----------
  var renderQueued = false;
  function scheduleRender() { if (renderQueued || disposed) return; renderQueued = true; timer(function () { renderQueued = false; if (S.editing) return; render(); }, 40); }
  function hasLoad(a) { for (var i = 0; i < (a || []).length; i++) { var x = a[i]; if (x && typeof x === 'object' && x.kind === 'loading') return true; } return false; }
  function ready(d) { if (!d || !d.rows) return false; for (var r = 0; r < d.rows.length; r++) { if (hasLoad(d.rows[r].labels) || hasLoad(d.rows[r].values)) return false; } return true; }
  function sub(name, cb, opts) {
    opts = opts || {};
    var o = {
      onData: function (d) {
        if (disposed || !ready(d)) return;
        delete S.errors[name];
        if (d.totalRowCount > 1000 && !opts.paged) S.errors[name + '_size'] = name + ' returns ' + d.totalRowCount + ' rows; only the first 1,000 are used.';
        try { cb(d); } catch (e) { S.errors[name] = name + ': ' + String((e && e.message) || e); }
        S.loaded[name] = true; S.recalc = false;
        scheduleRender();
      },
      onError: function (e) { if (disposed) return; S.errors[name] = name + ': ' + ((e && e.message) || 'could not load'); scheduleRender(); },
      dynamicFilters: opts.filters || []
    };
    if (opts.scroll) o.scroll = opts.scroll;
    return SDK.subscribeToDataSource(name, o);
  }

  function onReps(d) {
    var list = [], idx = {};
    d.rows.forEach(function (r) {
      var v = r.values, n = lab(r.labels[0]); if (!n) return;
      var x = { name: n, team: S.teamOf[n] || '', salary: nz(v[0]), mult: nz(v[1]), target: nz(v[2]), l12: nz(v[3]), ach: nz(v[4]) };
      if (!isNum(x.salary) && !isNum(x.target)) return;
      idx[n] = x; list.push(x);
    });
    S.reps = list; S.rep = idx;
  }
  function onTeam(d) { d.rows.forEach(function (r) { var n = lab(r.labels[0]); if (n) S.teamOf[n] = sv(r.values[0]); }); S.reps.forEach(function (x) { x.team = S.teamOf[x.name] || x.team; }); timer(function () { if (subs.team) { try { subs.team.unsubscribe(); } catch (e) { } subs.team = null; } }, 0); }
  function onSeg(d) { var o = {}; d.rows.forEach(function (r) { var n = lab(r.labels[0]); if (n) o[n] = { mult: nz(r.values[0]), ach: nz(r.values[1]) }; }); S.seg = o; }
  function onAtt(d) {
    var o = {}, ms = {};
    d.rows.forEach(function (r) {
      var rep = lab(r.labels[0]), m = lab(r.labels[1]); if (!rep || !m) return;
      var v = r.values;
      (o[rep] = o[rep] || {})[m] = { att: nz(v[0]), r12: nz(v[1]), tgt: nz(v[2]), cr: nz(v[3]), inwin: nz(v[4]) };
      if (isNum(v[0]) || isNum(v[3])) ms[m] = MON(m);
    });
    S.att = o; S.months = Object.keys(ms).sort(function (a, b) { return ms[a] - ms[b]; });
  }
  function onCo(d) { var o = {}; d.rows.forEach(function (r) { var m = lab(r.labels[0]); if (m) o[m] = nz(r.values[0]); }); S.co = o; }
  function onQ(d) {
    var o = {}, qs = {};
    d.rows.forEach(function (r) {
      var rep = lab(r.labels[0]), q = lab(r.labels[1]); if (!rep || !q) return;
      var v = r.values; (o[rep] = o[rep] || {})[q] = { att: nz(v[0]), gp: nz(v[1]), eff: nz(v[2]), pay: nz(v[3]) };
      if (isNum(v[0]) || isNum(v[1])) qs[q] = 1;
    });
    S.q = o; S.quarters = Object.keys(qs).sort(function (a, b) { return QKEY(a) - QKEY(b); });
    if (S.quarters.length && S.quarters.indexOf(S.selQ) < 0) S.selQ = S.quarters[S.quarters.length - 1];
  }
  function onRV(d) {
    var o = {}, vs = {};
    d.rows.forEach(function (r) {
      var rep = lab(r.labels[0]), vt = lab(r.labels[2]); if (!rep || !vt) return;
      var v = r.values; (o[rep] = o[rep] || {})[vt] = { gp: nz(v[0]), rate: nz(v[1]), comm: nz(v[2]) }; vs[vt] = 1;
    });
    S.rv = o; Object.keys(vs).forEach(function (k) { if (S.verticals.indexOf(k) < 0) S.verticals.push(k); });
  }
  function onBands(d) {
    var a = []; d.rows.forEach(function (r) { var n = lab(r.labels[0]); if (n) a.push({ name: n, floor: nz(r.values[0]) }); });
    a.sort(function (x, y) { return (y.floor == null ? -1 : y.floor) - (x.floor == null ? -1 : x.floor); });
    S.bands = a;
  }
  function onGrid(d) {
    var o = {}, vs = {};
    d.rows.forEach(function (r) { var b = lab(r.labels[0]), vt = lab(r.labels[1]); if (!b || !vt) return; (o[b] = o[b] || {})[vt] = nz(r.values[0]); vs[vt] = 1; });
    S.grid = o; var order = Object.keys(vs); order.forEach(function (k) { if (S.verticals.indexOf(k) < 0) S.verticals.push(k); });
  }
  function onWin(d) { var r = d.rows[0]; S.window = r ? nz(r.values[0]) : null; }
  var mPages = {}, mNext = 0;
  function onMerchants(d) {
    mPages[d.rowOffset || 0] = d.rows;
    var o = {}; Object.keys(mPages).forEach(function (k) { mPages[k].forEach(function (r) { var n = lab(r.labels[0]); if (n) o[n] = { owner: sv(r.values[0]), vertical: sv(r.values[1]) }; }); });
    S.merchants = o;
    var end = (d.rowOffset || 0) + d.rows.length;
    if (end < d.totalRowCount && mNext < end) { mNext = end; timer(function () { if (subs.merchants && subs.merchants.updateScroll) subs.merchants.updateScroll({ offset: end, numberOfRows: 500 }); }, 0); }
    if (end >= d.totalRowCount) timer(function () { if (subs.merchants) { try { subs.merchants.unsubscribe(); } catch (e) { } subs.merchants = null; } S.merchantsDone = true; refreshMerchFilter(); }, 0);
  }
  function onMerch(d) {
    var o = {};
    d.rows.forEach(function (r) {
      var m = lab(r.labels[0]), mo = lab(r.labels[1]); if (!m || !mo) return;
      var v = r.values; if (!isNum(v[0]) && !isNum(v[1])) return;
      (o[m] = o[m] || {})[mo] = { gp: nz(v[0]), cr: nz(v[1]), rate: nz(v[2]), comm: nz(v[3]), live: nz(v[4]) };
    });
    S.merch = o;
  }

  function qMonths(q) {
    var m = /^Q(\d)\s+(\d{2})$/.exec(q || ''); if (!m) return [];
    var N = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' '), s = (+m[1] - 1) * 3, out = [];
    for (var i = 0; i < 3; i++) out.push(N[s + i] + ' ' + m[2]);
    return out;
  }
  function qEndMonth(q) { var ms = qMonths(q); return ms[2]; }
  function repMerchants(rep) { return Object.keys(S.merchants).filter(function (n) { return S.merchants[n].owner === rep; }); }
  var lastMerchKey = '';
  function refreshMerchFilter() {
    if (!S.merchantsDone) return;
    var names = repMerchants(S.selRep); if (!names.length) return;
    var key = S.selRep + '|' + S.selQ + '|' + names.length; if (key === lastMerchKey) return; lastMerchKey = key;
    var f = [{ binding: 'merchantList', selection: names }, { binding: 'monthList', selection: qMonths(S.selQ) }];
    if (!subs.merch) subs.merch = sub('dsMerch', onMerch, { filters: f }); else subs.merch.updateDynamicFilters(f);
  }
  function refreshRV() {
    var f = [{ binding: 'quarterList', selection: [S.selQ] }];
    if (!subs.rv) subs.rv = sub('dsRV', onRV, { filters: f }); else subs.rv.updateDynamicFilters(f);
  }

  function startData() {
    subs.team = sub('dsTeam', onTeam);
    subs.reps = sub('dsReps', onReps);
    subs.seg = sub('dsSeg', onSeg);
    subs.att = sub('dsAtt', onAtt);
    subs.q = sub('dsQ', onQ);
    subs.bands = sub('dsBands', onBands);
    subs.grid = sub('dsGrid', onGrid);
    subs.win = sub('dsWin', onWin);
    subs.merchants = sub('dsMerchants', onMerchants, { paged: true, scroll: { offset: 0, numberOfRows: 500 } });
    refreshRV();
  }

  // ---------- derived numbers ----------
  function repQ(rep, q) { return (S.q[rep] || {})[q || S.selQ] || {}; }
  function repM(rep, m) { return (S.att[rep] || {})[m] || {}; }
  function coAtt(m) { var a = 0, b = 0; S.reps.forEach(function (r) { var x = repM(r.name, m); if (isNum(x.r12) && isNum(x.tgt)) { a += x.r12; b += x.tgt; } }); return b ? a / b : null; }
  function bandFor(a) { if (!isNum(a)) return null; for (var i = 0; i < S.bands.length; i++) { var b = S.bands[i]; if (isNum(b.floor) && a >= b.floor - 1e-9) return b.name; } return S.bands.length ? S.bands[S.bands.length - 1].name : null; }
  function qTotals(q) {
    var pay = 0, gp = 0, hit = 0, n = 0;
    S.reps.forEach(function (r) { var x = repQ(r.name, q); if (isNum(x.pay)) pay += x.pay; if (isNum(x.gp)) gp += x.gp; if (isNum(x.att)) { n++; if (x.att >= 1) hit++; } });
    return { pay: pay, gp: gp, hit: hit, n: n };
  }
  function lastActualMonth() { var ms = S.months, qe = qEndMonth(S.selQ); return ms.indexOf(qe) >= 0 ? qe : ms[ms.length - 1]; }
  function answer() {
    var t = qTotals(S.selQ), r = repQ(S.selRep), band = bandFor(r.att);
    if (!t.n) return 'Loading the latest numbers from Pigmentâ€¦';
    return 'In ' + S.selQ + ', ' + t.hit + ' of ' + t.n + ' reps finished at or above 100% of their 12-month target and the quarter pays ' + moneyFull(t.pay) + ' of commission. ' +
      esc(S.selRep) + ' finished at ' + pct(r.att) + (band ? ', in the ' + esc(band) + ' band,' : '') + ' and is paid ' + moneyFull(r.pay) + '.';
  }

  // ---------- explain content ----------
  function R() { return S.rep[S.selRep] || {}; }
  function EX(key) {
    var rep = R(), m = lastActualMonth(), am = repM(S.selRep, m), q = repQ(S.selRep), band = bandFor(q.att), rv = S.rv[S.selRep] || {};
    var co = coAtt(qEndMonth(S.selQ));
    var X = {
      target: { t: '12-month GP target', v: money(rep.target), what: 'The gross profit ' + S.selRep + ' is expected to bring in from new merchants over any rolling 12 months.',
        f: 'Base salary Ã— target multiple', live: '= ' + money(rep.salary) + ' Ã— ' + mult(rep.mult) + ' = ' + money(rep.target),
        parts: [['Base salary', money(rep.salary), 'salary'], ['Ã— Target multiple', mult(rep.mult), 'mult']], change: ['mult', 'seg'], where: 'Board SPM 1 Target setting, rep grid' },
      salary: { t: 'Base salary', v: money(rep.salary), what: 'Annual base salary of the rep. Illustrative.', f: 'Input', live: '', parts: [], change: [], where: 'Board SPM 1 Target setting, rep grid (yellow)' },
      mult: { t: 'Target multiple', v: mult(rep.mult), what: 'How many times their salary a rep must deliver in gross profit. Defaults to the multiple for their segment and can be typed over for one rep, for example a new starter.',
        f: 'Segment multiple, unless overridden for this rep', live: '= ' + mult((S.seg[rep.team] || {}).mult) + ' for ' + (rep.team || 'the segment'), parts: [['Segment multiple (' + (rep.team || '') + ')', mult((S.seg[rep.team] || {}).mult), 'seg']], change: ['mult', 'seg'], where: 'Board SPM 1 Target setting' },
      seg: { t: 'Segment multiple', v: mult((S.seg[rep.team] || {}).mult), what: 'Target multiple for every rep in a sales segment (Enterprise, Mid-Market, Partnerships). Set from what each segment achieved last year.', f: 'Input, by segment', live: 'Achieved last 12 months: ' + mult((S.seg[rep.team] || {}).ach), parts: [], change: ['seg'], where: 'Board SPM 1 Target setting, segment multiples' },
      l12: { t: 'Credited GP, last 12 months', v: money(rep.l12), what: 'Gross profit from merchants this rep brought in, counted while each merchant is inside its credit window, summed over the last 12 actual months.',
        f: 'Sum of credited GP in month, last 12 months', live: '= ' + money(rep.l12), parts: [['Credited GP in month', money(am.cr) + ' in ' + m, 'cr']], change: ['window'], where: 'Board SPM 2 Attainment' },
      ach: { t: 'Achieved multiple', v: mult(rep.ach), what: 'What the rep actually delivered last year as a multiple of salary. Used to sense-check the target multiple.', f: 'Credited GP last 12 months Ã· base salary',
        live: '= ' + money(rep.l12) + ' Ã· ' + money(rep.salary) + ' = ' + mult(rep.ach), parts: [['Credited GP last 12 months', money(rep.l12), 'l12'], ['Ã· Base salary', money(rep.salary), 'salary']], change: [], where: 'Board SPM 1 Target setting' },
      cr: { t: 'Credited GP in month', v: money(am.cr), what: 'Gross profit in the month from the repâ€™s merchants that are still inside the credit window (their first ' + (S.window || 12) + ' months live).',
        f: 'Merchant gross profit, if months live â‰¤ credit window', live: am.inwin != null ? am.inwin + ' merchants in the window in ' + m : '', parts: [['Credit window', (S.window || DASH) + ' months', 'window']], change: ['window'], where: 'Board SPM 2 Attainment, merchant grid' },
      window: { t: 'Credit window', v: (S.window || DASH) + ' months', what: 'How many months from go-live a new merchantâ€™s gross profit counts towards the rep who signed it. Trust Payments uses 12 today.', f: 'Input', live: '', parts: [], change: ['window'], where: 'Board SPM 2 Attainment, top right' },
      r12: { t: 'Rolling 12-month credited GP', v: money(am.r12), what: 'Credited GP summed over the 12 months to ' + m + '.', f: 'Sum of credited GP in month, 12 months to the month', live: '= ' + money(am.r12), parts: [['Credited GP in ' + m, money(am.cr), 'cr']], change: ['window'], where: 'Board SPM 2 Attainment, how attainment is worked out' },
      att: { t: 'Rolling 12-month attainment', v: pct(am.att), what: 'How much of their 12-month target the rep has delivered, measured every month on a rolling 12 months.',
        f: 'Rolling 12-month credited GP Ã· 12-month target', live: '= ' + money(am.r12) + ' Ã· ' + money(am.tgt) + ' = ' + pct(am.att), parts: [['Rolling 12-month credited GP', money(am.r12), 'r12'], ['Ã· 12-month target', money(am.tgt), 'target']], change: ['window', 'mult', 'seg'], where: 'Board SPM 2 Attainment' },
      coatt: { t: 'Company attainment', v: pct(co), what: 'All reps together: total rolling 12-month credited GP against total 12-month target.', f: 'Sum of rolling 12m credited GP Ã· sum of targets', live: '= ' + pct(co) + ' at ' + qEndMonth(S.selQ), parts: [['One repâ€™s attainment', pct(am.att), 'att']], change: ['window', 'seg'], where: 'Board SPM 2 Attainment, top left' },
      qatt: { t: 'Attainment at quarter end', v: pct(q.att), what: 'The repâ€™s rolling 12-month attainment in the last month of the quarter. This is the 12-month look back that sets the commission band.', f: 'Rolling 12-month attainment in ' + qEndMonth(S.selQ), live: '= ' + pct(q.att), parts: [['Rolling 12-month attainment', pct(q.att), 'att']], change: ['window', 'mult'], where: 'Board SPM 3 Quarterly commission' },
      band: { t: 'Commission band', v: band || DASH, what: 'The highest band whose floor the quarter-end attainment reaches. The band picks the row of the rate grid.', f: 'Highest band with floor â‰¤ attainment at quarter end',
        live: pct(q.att) + ' reaches the ' + (band || DASH) + ' floor', parts: [['Attainment at quarter end', pct(q.att), 'qatt'], ['Band floors', S.bands.map(function (b) { return b.name + ' from ' + pct(b.floor); }).join(', '), 'floors']], change: ['floors'], where: 'Board SPM 3 Quarterly commission, band floors' },
      floors: { t: 'Band floors', v: S.bands.length + ' bands', what: 'The lowest 12-month attainment that qualifies for each band.', f: 'Input', live: '', parts: [], change: ['floors'], where: 'Board SPM 3 Quarterly commission' },
      rate: { t: 'Commission rate', v: band || '', what: 'Rate paid on credited GP. It depends on the repâ€™s band and on each merchantâ€™s vertical, so the same rep earns different rates on Travel and on Financial Services.', f: 'Rate grid at band Ã— vertical', live: S.verticals.map(function (vt) { return vt + ' ' + pct((rv[vt] || {}).rate, 1); }).join(' Â· '), parts: [['Band', band || DASH, 'band']], change: ['rates'], where: 'Board SPM 3 Quarterly commission, rate grid' },
      rates: { t: 'Rate grid', v: '', what: 'Commission rate for each band and merchant vertical.', f: 'Input', live: '', parts: [], change: ['rates'], where: 'Board SPM 3 Quarterly commission' },
      qgp: { t: 'Credited GP this quarter', v: money(q.gp), what: 'Credited GP of the repâ€™s merchants in the three months of the quarter. Commission is paid on this.', f: 'Sum of credited GP, months of the quarter', live: '= ' + money(q.gp), parts: [['Credited GP in month', money(am.cr), 'cr']], change: ['window'], where: 'Board SPM 4 Rep statement' },
      comm: { t: 'Commission payable', v: moneyFull(q.pay), what: 'What the rep is paid for the quarter: credited GP in each vertical times the rate for their band and that vertical.',
        f: 'Î£ by vertical (credited GP Ã— rate)', live: '= ' + S.verticals.filter(function (vt) { return isNum((rv[vt] || {}).gp) && rv[vt].gp; }).map(function (vt) { return money(rv[vt].gp) + ' Ã— ' + pct(rv[vt].rate, 1); }).join(' + ') + ' = ' + moneyFull(q.pay),
        parts: [['Credited GP this quarter', money(q.gp), 'qgp'], ['Ã— Rate for band and vertical', band || DASH, 'rate']], change: ['floors', 'rates'], where: 'Board SPM 3 Quarterly commission and SPM 4 Rep statement' },
      eff: { t: 'Effective rate', v: pct(q.eff, 1), what: 'Commission as a share of credited GP across all verticals. Shows the blended rate the rep earned.', f: 'Commission payable Ã· credited GP', live: '= ' + moneyFull(q.pay) + ' Ã· ' + money(q.gp) + ' = ' + pct(q.eff, 1), parts: [['Commission payable', moneyFull(q.pay), 'comm'], ['Ã· Credited GP', money(q.gp), 'qgp']], change: ['rates'], where: 'Board SPM 3 Quarterly commission' },
      qpay: { t: 'Commission this quarter, all reps', v: moneyFull(qTotals(S.selQ).pay), what: 'Total commission payable for the quarter across every rep.', f: 'Î£ reps (commission payable)', live: '', parts: [['One repâ€™s commission', moneyFull(q.pay), 'comm']], change: ['floors', 'rates'], where: 'Board SPM 3 Quarterly commission, top' }
    };
    return X[key];
  }
  var LEVER = { mult: ['Target multiple for ' + '{rep}', 1], seg: ['Segment multiples', 1], window: ['Credit window', 2], floors: ['Band floors', 3], rates: ['Rate grid', 3] };

  // ---------- writes ----------
  var Q = {};
  function cellKey(sink, coords) { return sink + '|' + JSON.stringify(coords); }
  function write(sink, coords, val, label, origVal) {
    var k = cellKey(sink, coords);
    if (!(k in S.ORIG)) S.ORIG[k] = { sink: sink, coords: coords, v: origVal, label: label };
    var q = Q[k] || (Q[k] = { inflight: false, pending: undefined });
    q.pending = val; flush(k, label);
  }
  function flush(k, label) {
    var q = Q[k]; if (!q || q.inflight || q.pending === undefined) return;
    var o = S.ORIG[k], val = q.pending; q.pending = undefined; q.inflight = true;
    S.busy = 'Writing ' + label + ' to Pigmentâ€¦'; render();
    var p;
    try { p = Promise.resolve(SDK.editValue(o.sink, o.coords, val)); } catch (e) { p = Promise.reject(e); }
    p.then(function () {
      if (disposed) return; q.inflight = false; S.busy = ''; S.recalc = true;
      toast('ok', label + ' set to ' + fmtVal(o.sink, val) + '. Pigment is recalculating.');
      timer(function () { S.recalc = false; scheduleRender(); }, 2500);
      flush(k, label);
    }).catch(function (e) {
      if (disposed) return; q.inflight = false; S.busy = '';
      toast('err', 'Pigment did not save the change: ' + ((e && e.message) || e));
    });
  }
  function fmtVal(sink, v) { if (sink === 'windowSink') return v + ' months'; if (sink === 'floorSink' || sink === 'rateSink') return pct(v, 1); return mult(v); }
  function resetAll() {
    var ks = Object.keys(S.ORIG); if (!ks.length) { toast('ok', 'Nothing to reset: the model is at the demo baseline.'); return; }
    S.busy = 'Putting back ' + ks.length + ' value' + (ks.length > 1 ? 's' : '') + 'â€¦'; render();
    var ps = ks.map(function (k) { var o = S.ORIG[k]; return Promise.resolve(SDK.editValue(o.sink, o.coords, o.v)); });
    Promise.all(ps).then(function () { if (disposed) return; S.ORIG = {}; S.busy = ''; S.recalc = true; toast('ok', 'Back to the demo baseline.'); })
      .catch(function (e) { if (disposed) return; S.busy = ''; toast('err', 'Pigment did not save the reset: ' + ((e && e.message) || e)); });
  }
  function toast(kind, text) { S.toast = { kind: kind, text: text }; render(); timer(function () { S.toast = null; render(); }, kind === 'err' ? 7000 : 3500); }

  // ---------- charts ----------
  function barsVsTarget(rows, h) {
    var W = 640, H = h || 230, pl = 46, pb = 46, pt = 14, n = rows.length || 1, mx = 0;
    rows.forEach(function (r) { mx = Math.max(mx, r.a || 0, r.b || 0); }); mx = mx || 1; mx *= 1.12;
    var bw = (W - pl - 10) / n, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none">';
    for (var g = 0; g <= 4; g++) { var y = pt + (H - pt - pb) * (1 - g / 4); s += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="' + C.line + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">' + money(mx * g / 4) + '</text>'; }
    rows.forEach(function (r, i) {
      var x = pl + i * bw, ih = H - pt - pb;
      var ha = (r.a || 0) / mx * ih, hb = (r.b || 0) / mx * ih, w = bw * 0.36;
      s += '<rect data-ex="target" data-rep="' + esc(r.label) + '" x="' + (x + bw * 0.12) + '" y="' + (H - pb - ha) + '" width="' + w + '" height="' + ha + '" rx="3" fill="' + C.cloud + '"><title>' + esc(r.label) + ' target ' + money(r.a) + '</title></rect>';
      s += '<rect data-ex="l12" data-rep="' + esc(r.label) + '" x="' + (x + bw * 0.5) + '" y="' + (H - pb - hb) + '" width="' + w + '" height="' + hb + '" rx="3" fill="' + ((r.b || 0) >= (r.a || 0) ? C.jade : C.coral) + '"><title>' + esc(r.label) + ' delivered ' + money(r.b) + '</title></rect>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - pb + 14) + '" text-anchor="middle" class="ax' + (r.label === S.selRep ? ' sel' : '') + '">' + esc(r.label.split(' ')[0]) + '</text>';
    });
    return s + '</svg><div class="legend"><i style="background:' + C.cloud + '"></i>12-month target <i style="background:' + C.jade + '"></i>Delivered, above target <i style="background:' + C.coral + '"></i>Delivered, below target</div>';
  }
  function attBars(rows) {
    var W = 640, H = 230, pl = 40, pb = 40, pt = 16, n = rows.length || 1, mx = 1.3;
    rows.forEach(function (r) { if (isNum(r.v)) mx = Math.max(mx, r.v * 1.1); });
    var bw = (W - pl - 10) / n, ih = H - pt - pb, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none">';
    var y100 = pt + ih * (1 - 1 / mx);
    rows.forEach(function (r, i) {
      var x = pl + i * bw, hh = (r.v || 0) / mx * ih, y = H - pb - hh;
      if (isNum(r.base) && Math.abs(r.base - r.v) > 0.0005) { var hb = r.base / mx * ih; s += '<rect x="' + (x + bw * 0.15) + '" y="' + (H - pb - hb) + '" width="' + bw * 0.7 + '" height="' + hb + '" fill="none" stroke="' + C.slate + '" stroke-dasharray="4 3" rx="3"/>'; }
      s += '<rect data-ex="att" data-rep="' + esc(r.label) + '" x="' + (x + bw * 0.2) + '" y="' + y + '" width="' + bw * 0.6 + '" height="' + hh + '" rx="4" fill="' + attCol(r.v) + '" opacity="' + (r.label === S.selRep ? 1 : 0.8) + '"><title>' + esc(r.label) + ' ' + pct(r.v) + '</title></rect>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="ax b">' + pct(r.v) + '</text>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - pb + 14) + '" text-anchor="middle" class="ax' + (r.label === S.selRep ? ' sel' : '') + '">' + esc(r.label.split(' ')[0]) + '</text>';
    });
    s += '<line x1="' + pl + '" x2="' + W + '" y1="' + y100 + '" y2="' + y100 + '" stroke="' + C.navy + '" stroke-width="1.5" stroke-dasharray="6 4"/><text x="' + (pl + 2) + '" y="' + (y100 - 4) + '" class="ax b" fill="' + C.navy + '">100% of target</text>';
    return s + '</svg>';
  }
  function lineChart(months, series, h) {
    var W = 640, H = h || 220, pl = 52, pb = 34, pt = 12, mx = 0, mn = Infinity, n = months.length || 1;
    series.forEach(function (sr) { sr.v.forEach(function (v) { if (isNum(v)) { mx = Math.max(mx, v); mn = Math.min(mn, v); } }); });
    if (!isFinite(mn)) mn = 0; mn = Math.min(0, mn); mx = mx * 1.08 || 1;
    var X = function (i) { return pl + (W - pl - 12) * (n === 1 ? 0.5 : i / (n - 1)); }, Y = function (v) { return pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn)); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none">';
    for (var g = 0; g <= 4; g++) { var gv = mn + (mx - mn) * g / 4, y = Y(gv); s += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="' + C.line + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="ax">' + money(gv) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / 9));
    months.forEach(function (m, i) { if (i % step === 0 || i === n - 1) s += '<text x="' + X(i) + '" y="' + (H - pb + 16) + '" text-anchor="middle" class="ax">' + esc(m) + '</text>'; });
    series.forEach(function (sr) {
      var d = '', started = false;
      sr.v.forEach(function (v, i) { if (!isNum(v)) return; d += (started ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); started = true; });
      s += '<path d="' + d + '" fill="none" stroke="' + sr.c + '" stroke-width="' + (sr.w || 2.5) + '"' + (sr.dash ? ' stroke-dasharray="6 4"' : '') + '/>';
      if (sr.ex) sr.v.forEach(function (v, i) { if (isNum(v)) s += '<circle data-ex="' + sr.ex + '" data-month="' + esc(months[i]) + '" cx="' + X(i) + '" cy="' + Y(v) + '" r="4" fill="' + sr.c + '"><title>' + esc(months[i]) + ' ' + money(v) + '</title></circle>'; });
    });
    return s + '</svg>';
  }
  function donut(items) {
    var tot = 0; items.forEach(function (x) { tot += Math.max(0, x.v || 0); }); if (!tot) return '<div class="empty">No commission in this quarter.</div>';
    var R = 70, r = 44, cx = 90, cy = 90, a0 = -Math.PI / 2, s = '<svg viewBox="0 0 180 180" class="donut">';
    items.forEach(function (x, i) {
      var f = Math.max(0, x.v || 0) / tot; if (!f) return; var a1 = a0 + f * Math.PI * 2, big = f > 0.5 ? 1 : 0;
      if (f > 0.9999) { s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R + r) / 2 + '" fill="none" stroke="' + VCOL[i % VCOL.length] + '" stroke-width="' + (R - r) + '"/>'; }
      else s += '<path data-ex="comm" d="M' + (cx + R * Math.cos(a0)) + ' ' + (cy + R * Math.sin(a0)) + 'A' + R + ' ' + R + ' 0 ' + big + ' 1 ' + (cx + R * Math.cos(a1)) + ' ' + (cy + R * Math.sin(a1)) + 'L' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1)) + 'A' + r + ' ' + r + ' 0 ' + big + ' 0 ' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0)) + 'Z" fill="' + VCOL[i % VCOL.length] + '"><title>' + esc(x.label) + ' ' + moneyFull(x.v) + '</title></path>';
      a0 = a1;
    });
    s += '<text x="90" y="88" text-anchor="middle" class="dt">' + moneyFull(tot) + '</text><text x="90" y="104" text-anchor="middle" class="ax">commission</text></svg>';
    s += '<div class="legend col">' + items.filter(function (x) { return x.v; }).map(function (x) { return '<span><i style="background:' + VCOL[items.indexOf(x) % VCOL.length] + '"></i>' + esc(x.label) + ' ' + moneyFull(x.v) + '</span>'; }).join('') + '</div>';
    return s;
  }
  function qBars(rep) {
    var qs = S.quarters.slice(-8), W = 640, H = 200, pl = 40, pb = 30, pt = 18, mx = 1.3, n = qs.length || 1;
    qs.forEach(function (q) { var a = repQ(rep, q).att; if (isNum(a)) mx = Math.max(mx, a * 1.1); });
    var bw = (W - pl - 10) / n, ih = H - pt - pb, s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none">';
    S.bands.forEach(function (b) { if (!isNum(b.floor) || b.floor <= 0) return; var y = pt + ih * (1 - b.floor / mx); s += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="' + C.cloud + '" stroke-dasharray="3 3"/><text x="' + (W - 4) + '" y="' + (y - 3) + '" text-anchor="end" class="ax">' + pct(b.floor) + '</text>'; });
    qs.forEach(function (q, i) {
      var a = repQ(rep, q).att, x = pl + i * bw, hh = (a || 0) / mx * ih;
      s += '<rect data-ex="qatt" x="' + (x + bw * 0.22) + '" y="' + (H - pb - hh) + '" width="' + bw * 0.56 + '" height="' + hh + '" rx="4" fill="' + attCol(a) + '" opacity="' + (q === S.selQ ? 1 : 0.55) + '"><title>' + q + ' ' + pct(a) + '</title></rect>';
      s += '<text x="' + (x + bw / 2) + '" y="' + (H - pb - hh - 5) + '" text-anchor="middle" class="ax b">' + pct(a) + '</text><text x="' + (x + bw / 2) + '" y="' + (H - pb + 14) + '" text-anchor="middle" class="ax' + (q === S.selQ ? ' sel' : '') + '">' + q + '</text>';
    });
    return s + '</svg>';
  }

  // ---------- render ----------
  function exl(key, text, cls) { return '<button class="ex ' + (cls || '') + '" data-ex="' + key + '">' + text + '</button>'; }
  function kpi(key, label, val, sub2) { return '<button class="kpi" data-ex="' + key + '"><span class="kl">' + label + '</span><span class="kv">' + val + '</span><span class="ks">' + (sub2 || 'How itâ€™s worked out â€º') + '</span></button>'; }
  function loadingAll() { return !(S.loaded.dsReps && S.loaded.dsQ && S.loaded.dsAtt); }

  function header() {
    var t = qTotals(S.selQ), co = coAtt(qEndMonth(S.selQ)), r = repQ(S.selRep);
    var reps = S.reps.map(function (x) { return '<option' + (x.name === S.selRep ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('');
    var qs = S.quarters.map(function (q) { return '<option' + (q === S.selQ ? ' selected' : '') + '>' + q + '</option>'; }).join('');
    return '<header class="hd"><div class="brand"><div class="logo">TP</div><div><div class="t1">Trust Payments Â· New business sales performance</div><div class="t2">Targets, attainment and quarterly commission in one place Â· illustrative data</div></div></div>' +
      '<div class="filters"><label>Rep<select id="selRep">' + reps + '</select></label><label>Quarter<select id="selQ">' + qs + '</select></label>' +
      '<button class="btn ghost" id="resetBtn" title="Write every value you changed back to the demo baseline">Reset</button><button class="btn guide" id="guideBtn">? Guide</button></div></header>' +
      '<div class="kpis" id="kpis">' + kpi('coatt', 'Company attainment, ' + qEndMonth(S.selQ), pct(co)) + kpi('qpay', 'Commission payable, ' + S.selQ, moneyFull(t.pay)) +
      kpi('qgp', 'Credited GP, ' + S.selQ + ', ' + esc(S.selRep.split(' ')[0]), money(r.gp)) + kpi('qatt', esc(S.selRep) + ' attainment at quarter end', pct(r.att), (bandFor(r.att) || '') + ' band â€º') + '</div>' +
      '<div class="answer" id="answer">' + answer() + '</div>';
  }
  function rail() {
    var st = [['1', 'Targets', 'Salary Ã— multiple'], ['2', 'Attainment', '12 months of credited GP'], ['3', 'Commission', 'Band Ã— vertical rate'], ['4', 'Rep statement', 'One rep, one quarter']];
    return '<nav class="rail" id="rail">' + st.map(function (x) { return '<button class="stp' + (S.step === +x[0] ? ' on' : '') + '" data-step="' + x[0] + '"><span class="n">' + x[0] + '</span><span><b>' + x[1] + '</b><small>' + x[2] + '</small></span></button>'; }).join('') +
      '<div class="flow">Each step feeds the next: a change on step 1 moves attainment, band and commission.</div></nav>';
  }
  function panelHead(n, title, lead) { return '<div class="ph"><span class="badge">' + n + '</span><div><h2>' + title + '</h2><p>' + lead + '</p></div></div>'; }

  function p1() {
    var segs = Object.keys(S.seg);
    var segHtml = segs.map(function (sg) {
      var x = S.seg[sg]; return '<div class="lev"><div class="lt">' + esc(sg) + '</div><div class="stepper"><button data-seg="' + esc(sg) + '" data-d="-0.5">âˆ’</button><input class="inp" data-segin="' + esc(sg) + '" value="' + (isNum(x.mult) ? x.mult.toFixed(1) : '') + '"><button data-seg="' + esc(sg) + '" data-d="0.5">+</button></div><div class="ls">Achieved last 12m ' + exl('seg', mult(x.ach)) + '</div></div>';
    }).join('');
    var rows = S.reps.slice().sort(function (a, b) { return (a.team || '').localeCompare(b.team || '') || a.name.localeCompare(b.name); }).map(function (r) {
      return '<tr class="' + (r.name === S.selRep ? 'sel' : '') + '" data-pick="' + esc(r.name) + '"><td><b>' + esc(r.name) + '</b><small>' + esc(r.team) + '</small></td><td class="num">' + money(r.salary) + '</td>' +
        '<td class="num"><input class="inp sm" data-multin="' + esc(r.name) + '" value="' + (isNum(r.mult) ? r.mult.toFixed(1) : '') + '"></td>' +
        '<td class="num">' + exl('target', money(r.target), 'strong') + '</td><td class="num">' + exl('l12', money(r.l12)) + '</td><td class="num">' + exl('ach', '<span class="chip" style="background:' + (r.ach >= r.mult ? C.jade : (r.ach >= r.mult * 0.6 ? C.amber : C.coral)) + '">' + mult(r.ach) + '</span>') + '</td></tr>';
    }).join('');
    var bars = S.reps.map(function (r) { return { label: r.name, a: r.target, b: r.l12 }; });
    return '<section class="panel" id="p1">' + panelHead(1, 'Targets: salary Ã— multiple', 'Each repâ€™s rolling 12-month gross profit target is their base salary times the multiple for their segment. Set the multiples from what each segment achieved last year.') +
      '<div class="grid2"><div class="card" id="t-seg"><h3>Segment multiples <span class="tag in">input</span></h3><div class="levs">' + segHtml + '</div><p class="hint">Type a multiple or use âˆ’ / +. Every rep in the segment moves unless they have their own multiple.</p></div>' +
      '<div class="card"><h3>12-month target vs delivered last 12 months</h3>' + barsVsTarget(bars) + '</div></div>' +
      '<div class="card" id="t-reps"><h3>Targets by rep <span class="tag in">yellow = input</span></h3><div class="tw"><table class="tb"><thead><tr><th>Rep</th><th>Base salary</th><th>Target multiple</th><th>12-month GP target</th><th>Credited GP, last 12m</th><th>Achieved multiple</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="hint">Click a rep to follow them through the next steps. Click any number for how itâ€™s worked out.</p></div></section>';
  }
  function p2() {
    var m = lastActualMonth();
    var rows = S.reps.map(function (r) { var a = repM(r.name, m).att; var b = S.base && S.base.att[r.name]; return { label: r.name, v: a, base: b }; });
    var ms = S.months.filter(function (x) { return MON(x) <= MON(m); }).slice(-24);
    var rr = S.att[S.selRep] || {};
    var r12 = ms.map(function (x) { return (rr[x] || {}).r12; }), tg = ms.map(function (x) { return (rr[x] || {}).tgt; });
    var series = [{ c: C.cloud, v: tg, w: 2, dash: true, ex: 'target' }, { c: C.blue, v: r12, ex: 'r12' }];
    var bs = S.base && S.base.r12[S.selRep]; if (bs && S.ORIG && Object.keys(S.ORIG).length) series.splice(1, 0, { c: C.slate, v: ms.map(function (x) { return bs[x]; }), w: 1.5, dash: true });
    var last6 = ms.slice(-6);
    var how = '<table class="tb how"><thead><tr><th></th>' + last6.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
      [['Credited GP in month', 'cr', function (o) { return money(o.cr); }], ['Merchants in window', 'cr', function (o) { return isNum(o.inwin) ? o.inwin : DASH; }], ['Rolling 12m credited GP', 'r12', function (o) { return money(o.r12); }], ['Ã· 12-month target', 'target', function (o) { return money(o.tgt); }], ['= Attainment', 'att', function (o) { return chip(o.att); }]]
        .map(function (row) { return '<tr><td>' + exl(row[1], row[0]) + '</td>' + last6.map(function (x) { return '<td class="num">' + row[2](rr[x] || {}) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    var wins = [6, 9, 12, 18, 24].map(function (w) { return '<button class="seg' + (S.window === w ? ' on' : '') + '" data-win="' + w + '">' + w + '</button>'; }).join('');
    return '<section class="panel" id="p2">' + panelHead(2, 'Attainment: 12 months of credited GP', 'A new merchantâ€™s gross profit counts towards the rep who signed it for its first months live (the credit window). Attainment is credited GP over the last 12 months against the 12-month target, measured every month.') +
      '<div class="grid2 wide"><div class="card" id="t-att"><h3>Rolling 12-month attainment by rep, ' + esc(m) + '</h3>' + attBars(rows) + '<div class="legend"><i style="background:' + C.coral + '"></i>below 80% <i style="background:' + C.amber + '"></i>80-100% <i style="background:' + C.jade + '"></i>100-120% <i style="background:' + C.pine + '"></i>above 120% <i class="dash"></i>before your change</div></div>' +
      '<div class="card" id="t-win"><h3>Credit window <span class="tag in">input</span></h3><div class="big">' + exl('window', (S.window || DASH) + ' months') + '</div><div class="segs">' + wins + '</div><p class="hint">Months from go-live that a merchantâ€™s GP is credited to its rep. A longer window credits more GP, so attainment rises.</p></div></div>' +
      '<div class="grid2"><div class="card"><h3>' + esc(S.selRep) + ': rolling 12-month credited GP vs target</h3>' + lineChart(ms, series) + '<div class="legend"><i style="background:' + C.blue + '"></i>Rolling 12m credited GP <i class="dash" style="border-color:' + C.cloud + '"></i>12-month target</div></div>' +
      '<div class="card"><h3>How attainment is worked out</h3><div class="tw">' + how + '</div></div></div></section>';
  }
  function p3() {
    var vts = S.verticals;
    var floors = S.bands.map(function (b) { return '<tr><td>' + esc(b.name) + '</td><td class="num"><input class="inp sm" data-floorin="' + esc(b.name) + '" value="' + (isNum(b.floor) ? (b.floor * 100).toFixed(0) : '') + '">%</td></tr>'; }).join('');
    var grid = '<table class="tb rg"><thead><tr><th>Band</th>' + vts.map(function (v) { return '<th>' + esc(v) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      S.bands.map(function (b) { return '<tr><td>' + esc(b.name) + '</td>' + vts.map(function (v) { var x = (S.grid[b.name] || {})[v]; return '<td class="num"><input class="inp xs" data-rate="' + esc(b.name) + '|' + esc(v) + '" value="' + (isNum(x) ? (x * 100).toFixed(1) : '') + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    var run = S.reps.slice().sort(function (a, b) { return (repQ(b.name).pay || 0) - (repQ(a.name).pay || 0); }).map(function (r) {
      var x = repQ(r.name), mx = 1; S.reps.forEach(function (z) { mx = Math.max(mx, repQ(z.name).pay || 0); });
      return '<tr class="' + (r.name === S.selRep ? 'sel' : '') + '" data-pick="' + esc(r.name) + '"><td><b>' + esc(r.name) + '</b><small>' + esc(r.team) + '</small></td><td class="num">' + exl('qatt', chip(x.att)) + '</td><td>' + exl('band', '<span class="bandtag">' + esc(bandFor(x.att) || DASH) + '</span>') + '</td><td class="num">' + exl('qgp', money(x.gp)) + '</td><td class="num">' + exl('eff', pct(x.eff, 1)) + '</td><td class="num barcell">' + exl('comm', moneyFull(x.pay), 'strong') + '<span class="mini" style="width:' + Math.round((x.pay || 0) / mx * 100) + '%"></span></td></tr>';
    }).join('');
    return '<section class="panel" id="p3">' + panelHead(3, 'Quarterly commission: band Ã— vertical rate', 'At each quarter end the repâ€™s rolling 12-month attainment sets their band. The band and each merchantâ€™s vertical set the rate paid on credited GP.') +
      '<div class="grid2 plan"><div class="card" id="t-floors"><h3>Band floors <span class="tag in">input</span></h3><table class="tb"><thead><tr><th>Band</th><th>Lowest attainment</th></tr></thead><tbody>' + floors + '</tbody></table></div>' +
      '<div class="card" id="t-rates"><h3>Commission rate by band and vertical, % <span class="tag in">input</span></h3><div class="tw">' + grid + '</div></div></div>' +
      '<div class="card" id="t-run"><h3>Commission run, ' + S.selQ + '</h3><div class="tw"><table class="tb"><thead><tr><th>Rep</th><th>12m attainment at quarter end</th><th>Band</th><th>Credited GP</th><th>Effective rate</th><th>Commission payable</th></tr></thead><tbody>' + run + '</tbody></table></div><p class="hint">Click a rep for their statement. Click any number for how itâ€™s worked out.</p></div></section>';
  }
  function p4() {
    var q = repQ(S.selRep), band = bandFor(q.att), rv = S.rv[S.selRep] || {}, vts = S.verticals;
    var chain = '<div class="chain" id="t-chain">' +
      '<button class="lk" data-ex="qatt"><small>1 Â· Attainment at ' + qEndMonth(S.selQ) + '</small><b>' + pct(q.att) + '</b></button><span class="arr">â€º</span>' +
      '<button class="lk" data-ex="band"><small>2 Â· Band</small><b>' + esc(band || DASH) + '</b></button><span class="arr">â€º</span>' +
      '<button class="lk" data-ex="rate"><small>3 Â· Rates by vertical</small><b>' + pct(q.eff, 1) + ' blended</b></button><span class="arr">â€º</span>' +
      '<button class="lk hi" data-ex="comm"><small>4 Â· Commission payable</small><b>' + moneyFull(q.pay) + '</b></button></div>';
    var vrows = vts.map(function (v) { var x = rv[v] || {}; if (!x.gp && !x.comm) return ''; return '<tr><td>' + esc(v) + '</td><td class="num">' + exl('qgp', money(x.gp)) + '</td><td class="num">Ã— ' + exl('rate', pct(x.rate, 1)) + '</td><td class="num">= ' + exl('comm', moneyFull(x.comm), 'strong') + '</td></tr>'; }).join('');
    var ms = qMonths(S.selQ), names = Object.keys(S.merch).sort(function (a, b) { return ((S.merchants[a] || {}).vertical || '').localeCompare((S.merchants[b] || {}).vertical || '') || a.localeCompare(b); });
    var mrows = names.map(function (n) {
      var o = S.merch[n] || {}, gp = 0, cr = 0, cm = 0, rate = null, live = null;
      ms.forEach(function (m) { var x = o[m] || {}; gp += x.gp || 0; cr += x.cr || 0; cm += x.comm || 0; if (isNum(x.rate)) rate = x.rate; if (isNum(x.live)) live = x.live; });
      if (!cr && !cm) return '';
      return '<tr><td><b>' + esc(n) + '</b><small>' + esc((S.merchants[n] || {}).vertical) + '</small></td><td class="num">' + (live == null ? DASH : live) + '</td><td class="num">' + moneyFull(gp) + '</td><td class="num">' + exl('cr', moneyFull(cr)) + '</td><td class="num">' + pct(rate, 1) + '</td><td class="num">' + exl('comm', moneyFull(cm), 'strong') + '</td></tr>';
    }).join('');
    return '<section class="panel" id="p4">' + panelHead(4, 'Rep statement: ' + esc(S.selRep) + ', ' + S.selQ, 'What the rep or their manager sees for the quarter: where they finished, the band that set their rates, commission by vertical and every merchant behind it.') + chain +
      '<div class="grid2"><div class="card"><h3>Credited GP Ã— rate = commission, by vertical</h3><table class="tb"><thead><tr><th>Vertical</th><th>Credited GP</th><th>Rate</th><th>Commission</th></tr></thead><tbody>' + (vrows || '<tr><td colspan="4" class="empty">No credited GP this quarter.</td></tr>') + '</tbody></table></div>' +
      '<div class="card"><h3>Commission by vertical</h3><div class="dw">' + donut(vts.map(function (v) { return { label: v, v: (rv[v] || {}).comm || 0 }; })) + '</div></div></div>' +
      '<div class="grid2"><div class="card"><h3>Attainment at each quarter end (dotted lines = band floors)</h3>' + qBars(S.selRep) + '</div>' +
      '<div class="card" id="t-merch"><h3>Merchants behind the number, ' + S.selQ + ' <small style="font-weight:400;color:#64748b">(merchants inside the credit window)</small></h3><div class="tw"><table class="tb"><thead><tr><th>Merchant</th><th>Months live at quarter end</th><th>Gross profit</th><th>Credited GP</th><th>Rate</th><th>Commission</th></tr></thead><tbody>' + (mrows || '<tr><td colspan="6" class="empty">Loading merchantsâ€¦</td></tr>') + '</tbody></table></div></div></div></section>';
  }

  function drawer() {
    if (!S.explain) return '';
    var x = EX(S.explain); if (!x) return '';
    var parts = x.parts.map(function (p) { return '<button class="part" data-ex="' + p[2] + '"><span>' + esc(p[0]) + '</span><b>' + esc(p[1]) + '</b><i>â€º</i></button>'; }).join('');
    var ch = x.change.map(function (c) { var l = LEVER[c]; return '<button class="btn sm" data-goto="' + l[1] + '" data-focus="' + c + '">Change ' + esc(l[0].replace('{rep}', S.selRep)) + '</button>'; }).join('');
    return '<div class="scrim" id="scrim"></div><aside class="drawer" id="drawer" role="dialog" aria-label="' + esc(x.t) + '">' +
      '<div class="dh">' + (S.stack.length ? '<button class="btn ghost sm" id="exBack">â€¹ Back</button>' : '<span></span>') + '<button class="btn ghost sm" id="exClose">Close âœ•</button></div>' +
      '<div class="dt2">' + esc(x.t) + '</div><div class="dv">' + esc(x.v) + '</div><p>' + esc(x.what) + '</p>' +
      '<div class="lbl">Formula</div><div class="fm">' + esc(x.f) + '</div>' + (x.live ? '<div class="lbl">With todayâ€™s numbers (' + esc(S.selRep) + ', ' + esc(S.selQ) + ')</div><div class="fm live">' + esc(x.live) + '</div>' : '') +
      (parts ? '<div class="lbl">The parts behind it</div>' + parts : '') + (ch ? '<div class="lbl">What changes it</div><div class="chg">' + ch + '</div>' : '') +
      '<div class="lbl">Where to change it on the boards</div><p class="where">' + esc(x.where) + '</p></aside>';
  }

  var TOUR = [
    { el: 'kpis', t: 'The headline numbers', b: 'Company attainment, the quarterâ€™s commission and the selected rep. Click any tile to see how it is worked out, with todayâ€™s numbers.' },
    { el: 'rail', t: 'Four steps, one process', b: 'Targets feed attainment, attainment sets the band, the band and vertical set the commission, and the rep statement shows the result. Click a step to jump to it.' },
    { el: 't-seg', t: 'Step 1: set the multiples', b: 'Take Mid-Market from 5.0x to 5.5x. Every Mid-Market target rises 10%, and Hannah Loweâ€™s attainment drops below 100% on step 2.', step: 1 },
    { el: 't-win', t: 'Step 2: the credit window', b: 'Try 18 months. More of each merchantâ€™s GP is credited, so attainment rises across the team. The dashed outline shows where each rep was before.', step: 2 },
    { el: 't-rates', t: 'Step 3: the commission plan', b: 'Band floors decide the band; the grid sets the rate by band and vertical. Change the 100% to 110% Gaming rate and watch the run below.', step: 3 },
    { el: 't-chain', t: 'Step 4: the rep statement', b: 'Attainment at quarter end, band, rates, commission. Every box opens its working, down to the merchants.', step: 4 },
    { el: 'resetBtn', t: 'Back to the baseline', b: 'Reset writes every value you changed back to where it started.' }
  ];
  function tourHtml() {
    if (S.tour < 0) return '';
    var st = TOUR[S.tour], el = $(st.el), r = el ? el.getBoundingClientRect() : { left: 40, top: 40, width: 200, height: 60, bottom: 100 };
    var pad = 8, top = Math.min(window.innerHeight - 220, r.bottom + 14), left = Math.max(16, Math.min(window.innerWidth - 380, r.left));
    return '<div class="spot" style="left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px"></div>' +
      '<div class="tcard" style="left:' + left + 'px;top:' + Math.max(16, top) + 'px"><div class="tn">' + (S.tour + 1) + ' of ' + TOUR.length + '</div><div class="tt">' + esc(st.t) + '</div><p>' + esc(st.b) + '</p>' +
      '<div class="tbtn"><button class="btn ghost sm" id="tSkip">Skip</button><span>' + (S.tour > 0 ? '<button class="btn ghost sm" id="tBack">Back</button>' : '') + '<button class="btn sm" id="tNext">' + (S.tour === TOUR.length - 1 ? 'Done' : 'Next') + '</button></span></div></div>';
  }

  function render() {
    if (disposed) return;
    var main = $('main'), sc = main ? main.scrollTop : 0;
    var errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; });
    var body;
    if (loadingAll()) body = '<div class="loading"><div class="spin"></div>Loading targets, attainment and commission from Pigmentâ€¦</div>';
    else body = p1() + p2() + p3() + p4();
    root.innerHTML = '<div class="app">' + header() + (errs.length ? '<div class="errs">' + errs.map(esc).join('<br>') + '</div>' : '') +
      '<div class="body">' + rail() + '<main id="main">' + body + '</main></div>' +
      (S.busy || S.recalc ? '<div class="busy">' + esc(S.busy || 'Recalculating in Pigmentâ€¦') + '</div>' : '') +
      (S.toast ? '<div class="toast ' + S.toast.kind + '">' + esc(S.toast.text) + '</div>' : '') + drawer() + '</div>' + '<div id="tourL">' + '</div>';
    var m2 = $('main'); if (m2) m2.scrollTop = sc;
    if (S.tour >= 0) $('tourL').innerHTML = tourHtml();
  }

  // ---------- events ----------
  function goStep(n, focus) {
    S.step = n; render();
    var el = $('p' + n), mn = $('main'); if (el && mn) mn.scrollTop = el.offsetTop - 12;
    if (focus) { var f = { seg: 't-seg', mult: 't-reps', window: 't-win', floors: 't-floors', rates: 't-rates' }[focus]; var fe = f && $(f); if (fe) { fe.classList.add('flash'); timer(function () { fe.classList.remove('flash'); }, 1600); } }
  }
  function openEx(key, push) { if (push && S.explain) S.stack.push(S.explain); else if (!push) S.stack = []; S.explain = key; render(); }
  function pickRep(n) { if (!n || !S.rep[n]) return; S.selRep = n; lastMerchKey = ''; S.merch = {}; refreshMerchFilter(); render(); }
  function parseNum(s) { var v = parseFloat(String(s).replace(/[^0-9.\-]/g, '')); return isFinite(v) ? v : null; }
  function commitInput(t) {
    var v = parseNum(t.value); if (v == null) return;
    if (t.dataset.segin) { var sg = t.dataset.segin, o = (S.seg[sg] || {}).mult; if (v !== o) { S.seg[sg].mult = v; write('segSink', { segmentList: sg }, v, sg + ' multiple', o); } }
    else if (t.dataset.multin) { var rn = t.dataset.multin, r = S.rep[rn], o2 = r.mult; if (v !== o2) { r.mult = v; write('multSink', { ownerList: rn }, v, rn + 'â€™s target multiple', o2); } }
    else if (t.dataset.floorin) { var bn = t.dataset.floorin, b = S.bands.filter(function (z) { return z.name === bn; })[0], f = v / 100; if (b && Math.abs(f - (b.floor || 0)) > 1e-9) { var o3 = b.floor; b.floor = f; write('floorSink', { bandList: bn }, f, bn + ' floor', o3); } }
    else if (t.dataset.rate) { var p = t.dataset.rate.split('|'), g = (S.grid[p[0]] = S.grid[p[0]] || {}), rv = v / 100; if (Math.abs(rv - (g[p[1]] || 0)) > 1e-9) { var o4 = g[p[1]]; g[p[1]] = rv; write('rateSink', { bandList: p[0], verticalList: p[1] }, rv, p[0] + ' ' + p[1] + ' rate', o4); } }
  }
  function onClick(e) {
    var t = e.target.closest ? e.target.closest('button,[data-ex],[data-pick],select,input') : null; if (!t) return;
    if (t.id === 'guideBtn') { S.tour = 0; tourStep(); return; }
    if (t.id === 'resetBtn') { resetAll(); return; }
    if (t.id === 'exClose' || t.id === 'scrim') { S.explain = null; S.stack = []; render(); return; }
    if (t.id === 'exBack') { S.explain = S.stack.pop() || null; render(); return; }
    if (t.id === 'tSkip') { endTour(); return; }
    if (t.id === 'tNext') { if (S.tour >= TOUR.length - 1) endTour(); else { S.tour++; tourStep(); } return; }
    if (t.id === 'tBack') { S.tour = Math.max(0, S.tour - 1); tourStep(); return; }
    if (t.dataset.step) { goStep(+t.dataset.step); return; }
    if (t.dataset.goto) { S.explain = null; S.stack = []; goStep(+t.dataset.goto, t.dataset.focus); return; }
    if (t.dataset.seg) { var sg = t.dataset.seg, o = (S.seg[sg] || {}).mult || 0, nv = Math.max(0.5, Math.round((o + parseFloat(t.dataset.d)) * 10) / 10); S.seg[sg].mult = nv; write('segSink', { segmentList: sg }, nv, sg + ' multiple', o); return; }
    if (t.dataset.win) { var w = +t.dataset.win, ow = S.window; if (w !== ow) { S.window = w; write('windowSink', {}, w, 'Credit window', ow); } return; }
    if (t.dataset.ex) { if (t.dataset.rep) pickRep(t.dataset.rep); openEx(t.dataset.ex, !!t.closest('.drawer')); return; }
    if (t.dataset.pick && t.tagName !== 'INPUT') { pickRep(t.dataset.pick); return; }
  }
  function onChange(e) {
    var t = e.target;
    if (t.id === 'selRep') { pickRep(t.value); return; }
    if (t.id === 'selQ') { S.selQ = t.value; lastMerchKey = ''; S.merch = {}; refreshRV(); refreshMerchFilter(); render(); return; }
    if (t.classList && t.classList.contains('inp')) { S.editing = false; commitInput(t); }
  }
  function onKey(e) {
    if (e.key === 'Escape') { if (S.tour >= 0) { endTour(); return; } if (S.explain) { S.explain = null; S.stack = []; render(); } return; }
    var t = e.target;
    if (e.key === 'Enter' && t.classList && t.classList.contains('inp')) { t.blur(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && t.dataset && t.dataset.ex && t.tagName !== 'BUTTON') { e.preventDefault(); openEx(t.dataset.ex); }
  }
  function onFocusIn(e) { if (e.target.classList && e.target.classList.contains('inp')) S.editing = true; }
  function onFocusOut(e) { if (e.target.classList && e.target.classList.contains('inp')) { S.editing = false; timer(scheduleRender, 50); } }
  function onScroll() { var m = $('main'); if (!m) return; var best = 1; for (var i = 1; i <= 4; i++) { var p = $('p' + i); if (p && p.offsetTop - 80 <= m.scrollTop) best = i; } if (best !== S.step) { S.step = best; var r = $('rail'); if (r) r.outerHTML = rail(); } }
  function tourStep() { var st = TOUR[S.tour]; if (st.step) goStep(st.step); else render(); timer(function () { var el = $(st.el); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); timer(function () { if ($('tourL')) $('tourL').innerHTML = tourHtml(); }, 250); }, 30); }
  function endTour() { S.tour = -1; try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) { } render(); }
  function maybeAutoTour() { var seen = false; try { seen = localStorage.getItem(TOUR_KEY) === '1'; } catch (e) { seen = true; } if (!seen && S.tour < 0) { S.tour = 0; tourStep(); } }
  function snapshotBase() {
    if (S.base || loadingAll()) return;
    var m = lastActualMonth(), a = {}, r = {};
    S.reps.forEach(function (x) { a[x.name] = repM(x.name, m).att; var o = {}; Object.keys(S.att[x.name] || {}).forEach(function (k) { o[k] = S.att[x.name][k].r12; }); r[x.name] = o; });
    S.base = { att: a, r12: r };
    timer(maybeAutoTour, 600);
  }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.app{font-family:Inter,"Segoe UI",system-ui,sans-serif;color:' + C.ink + ';background:' + C.bg + ';height:100%;display:flex;flex-direction:column;font-size:14px;font-variant-numeric:tabular-nums}',
    '.hd{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 22px;background:linear-gradient(90deg,' + C.navy + ',' + C.blue + ');color:#fff;flex-wrap:wrap}',
    '.brand{display:flex;gap:12px;align-items:center}.logo{width:40px;height:40px;border-radius:12px;background:#fff;color:' + C.navy + ';font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.t1{font-weight:700;font-size:17px}.t2{opacity:.85;font-size:12px}',
    '.filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.filters label{display:flex;flex-direction:column;font-size:11px;opacity:.95;gap:2px}',
    '.filters select{border:0;border-radius:10px;padding:7px 10px;font:inherit;font-size:13px;min-width:150px}',
    '.btn{border:0;border-radius:10px;padding:9px 14px;font:inherit;font-weight:600;cursor:pointer;background:' + C.blue + ';color:#fff}.btn.sm{padding:6px 10px;font-size:12px}',
    '.btn.ghost{background:rgba(255,255,255,.16);color:inherit;border:1px solid rgba(255,255,255,.4)}.drawer .btn.ghost,.tcard .btn.ghost{background:#fff;color:' + C.navy + ';border:1px solid ' + C.line + '}',
    '.btn.guide{background:#fff;color:' + C.navy + ';box-shadow:0 0 0 3px rgba(255,255,255,.35)}',
    '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:14px 22px 0}',
    '.kpi{background:#fff;border:1px solid ' + C.line + ';border-radius:16px;padding:12px 16px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px;font:inherit}.kpi:hover{border-color:' + C.blue + '}',
    '.kl{font-size:12px;color:' + C.mut + '}.kv{font-size:26px;font-weight:700;color:' + C.navy + '}.ks{font-size:11px;color:' + C.blue + '}',
    '.answer{margin:12px 22px 0;padding:10px 14px;border-radius:12px;background:' + C.seafoam + ';font-size:14px}',
    '.errs{margin:8px 22px 0;padding:8px 12px;background:#fff1f2;color:#9f1239;border-radius:10px;font-size:12px}',
    '.body{flex:1;display:flex;min-height:0;padding:12px 22px 16px;gap:16px}',
    '.rail{width:210px;flex:none;display:flex;flex-direction:column;gap:8px}',
    '.stp{display:flex;gap:10px;align-items:center;text-align:left;background:#fff;border:1px solid ' + C.line + ';border-radius:14px;padding:10px;cursor:pointer;font:inherit}',
    '.stp .n{width:28px;height:28px;border-radius:50%;background:' + C.seafoam + ';color:' + C.navy + ';font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}',
    '.stp b{display:block}.stp small{color:' + C.mut + '}.stp.on{border-color:' + C.navy + ';box-shadow:0 2px 10px rgba(27,71,139,.15)}.stp.on .n{background:' + C.navy + ';color:#fff}',
    '.flow{font-size:12px;color:' + C.mut + ';padding:6px 4px}',
    'main{flex:1;overflow:auto;min-width:0;position:relative}',
    '.panel{margin-bottom:22px}.ph{display:flex;gap:12px;align-items:flex-start;margin:4px 0 10px}.badge{width:34px;height:34px;border-radius:10px;background:' + C.navy + ';color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;flex:none}',
    'h2{margin:0;font-size:20px;color:' + C.navy + '}.ph p{margin:3px 0 0;color:#334155;max-width:900px}',
    '.card{background:#fff;border:1px solid ' + C.line + ';border-radius:18px;padding:14px 16px;margin-bottom:12px;min-width:0}.card h3{margin:0 0 10px;font-size:14px}',
    '.grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:12px}.grid2.wide{grid-template-columns:minmax(0,2.2fr) minmax(0,1fr)}.grid2.plan{grid-template-columns:minmax(0,1fr) minmax(0,2.4fr)}',
    '.tag{font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;background:' + C.gold + ';color:#78350f;margin-left:6px}',
    '.levs{display:flex;flex-direction:column;gap:10px}.lev{display:grid;grid-template-columns:120px auto 1fr;gap:10px;align-items:center}.lt{font-weight:600}.ls{font-size:12px;color:' + C.mut + '}',
    '.stepper{display:flex;align-items:center;gap:4px}.stepper button{width:30px;height:32px;border-radius:8px;border:1px solid ' + C.line + ';background:#fff;font-size:16px;cursor:pointer}',
    '.inp{width:64px;padding:6px 8px;border-radius:8px;border:1px solid ' + C.amber + ';background:#fffbeb;font:inherit;text-align:right}.inp.sm{width:56px}.inp.xs{width:52px}.inp:focus{outline:2px solid ' + C.blue + '}',
    '.hint{font-size:12px;color:' + C.mut + ';margin:8px 0 0}',
    '.tw{overflow:auto}.tb{width:100%;border-collapse:collapse}.tb th{font-size:12px;color:' + C.mut + ';font-weight:600;text-align:right;padding:8px 10px;border-bottom:1px solid ' + C.line + ';white-space:nowrap}.tb th:first-child{text-align:left}',
    '.tb td{padding:8px 10px;border-bottom:1px solid #f1f5f9}.tb td small{display:block;color:' + C.mut + ';font-size:11px}.num{text-align:right;white-space:nowrap}.tb tr.sel{background:#eff6ff}.tb tr[data-pick]{cursor:pointer}.tb tr[data-pick]:hover{background:#f8fafc}',
    '.ex{border:0;background:none;font:inherit;color:inherit;cursor:pointer;padding:0;border-bottom:1px dotted ' + C.cloud + '}.ex:hover{color:' + C.blue + '}.ex.strong{font-weight:700;color:' + C.navy + '}',
    '.chip{display:inline-block;color:#fff;border-radius:20px;padding:2px 9px;font-weight:600;font-size:12px}.bandtag{background:' + C.seafoam + ';border-radius:20px;padding:2px 9px;font-size:12px;white-space:nowrap}',
    '.barcell{position:relative}.mini{position:absolute;left:10px;bottom:3px;height:3px;border-radius:2px;background:' + C.violet + ';max-width:calc(100% - 20px)}',
    '.chart{width:100%;height:auto;display:block}.ax{font-size:10px;fill:' + C.mut + '}.ax.b{font-weight:700;fill:' + C.ink + '}.ax.sel{fill:' + C.blue + ';font-weight:700}.chart [data-ex]{cursor:pointer}.chart [data-ex]:hover{opacity:.75}',
    '.legend{display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:' + C.mut + ';margin-top:6px;align-items:center}.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}.legend i.dash{border-top:2px dashed ' + C.slate + ';height:0;width:14px;border-radius:0}.legend.col{flex-direction:column;align-items:flex-start;gap:4px}',
    '.big{font-size:30px;font-weight:700;color:' + C.navy + ';margin:4px 0 10px}.segs{display:flex;gap:6px;flex-wrap:wrap}.seg{border:1px solid ' + C.line + ';background:#fff;border-radius:10px;padding:8px 14px;cursor:pointer;font:inherit;font-weight:600}.seg.on{background:' + C.amber + ';border-color:' + C.amber + ';color:#fff}',
    '.chain{display:flex;align-items:stretch;gap:8px;margin-bottom:12px;flex-wrap:wrap}.lk{flex:1;min-width:150px;background:#fff;border:1px solid ' + C.line + ';border-radius:16px;padding:12px 14px;text-align:left;cursor:pointer;font:inherit}.lk small{display:block;color:' + C.mut + '}.lk b{font-size:20px;color:' + C.navy + '}.lk.hi{background:' + C.navy + '}.lk.hi b,.lk.hi small{color:#fff}.arr{align-self:center;font-size:22px;color:' + C.cloud + '}',
    '.dw{display:flex;gap:18px;align-items:center}.donut{width:180px;flex:none}.dt{font-size:15px;font-weight:700;fill:' + C.navy + '}.donut path{cursor:pointer}',
    '.empty{color:' + C.mut + ';font-size:13px;padding:10px}',
    '.loading{display:flex;gap:12px;align-items:center;justify-content:center;height:60%;color:' + C.mut + '}.spin{width:22px;height:22px;border-radius:50%;border:3px solid ' + C.line + ';border-top-color:' + C.blue + ';animation:sp 1s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}',
    '.busy{position:fixed;left:50%;top:14px;transform:translateX(-50%);background:' + C.navy + ';color:#fff;padding:8px 16px;border-radius:20px;font-size:13px;z-index:50;box-shadow:0 6px 20px rgba(0,0,0,.2)}',
    '.toast{position:fixed;right:20px;bottom:20px;max-width:420px;padding:12px 16px;border-radius:14px;color:#fff;z-index:60;box-shadow:0 8px 24px rgba(0,0,0,.2)}.toast.ok{background:' + C.pine + '}.toast.err{background:' + C.coral + '}',
    '.scrim{position:fixed;inset:0;background:rgba(15,23,42,.25);z-index:70}.drawer{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:92vw;background:#fff;z-index:71;padding:18px 20px;overflow:auto;box-shadow:-10px 0 30px rgba(0,0,0,.15)}',
    '.dh{display:flex;justify-content:space-between;margin-bottom:10px}.dt2{font-size:13px;color:' + C.mut + '}.dv{font-size:30px;font-weight:700;color:' + C.navy + ';margin:2px 0 6px}.lbl{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:' + C.mut + ';margin:14px 0 6px}',
    '.fm{background:' + C.bg + ';border-radius:10px;padding:10px 12px;font-weight:600}.fm.live{background:' + C.seafoam + '}',
    '.part{display:flex;width:100%;justify-content:space-between;gap:8px;align-items:center;border:1px solid ' + C.line + ';border-radius:12px;background:#fff;padding:10px 12px;margin-bottom:6px;cursor:pointer;font:inherit;text-align:left}.part:hover{border-color:' + C.blue + '}.part i{color:' + C.blue + ';font-style:normal}',
    '.chg{display:flex;gap:6px;flex-wrap:wrap}.where{color:#334155;margin:0}',
    '.spot{position:fixed;border-radius:16px;box-shadow:0 0 0 9999px rgba(15,23,42,.55);z-index:80;pointer-events:none;outline:3px solid ' + C.blue + ';animation:pl 1.6s ease-in-out infinite}@keyframes pl{50%{outline-color:' + C.jade + '}}',
    '.tcard{font-family:Inter,"Segoe UI",system-ui,sans-serif;font-size:14px;color:' + C.ink + ';position:fixed;width:360px;background:#fff;border-radius:16px;padding:16px;z-index:81;box-shadow:0 12px 40px rgba(0,0,0,.3)}.tn{font-size:11px;color:' + C.mut + '}.tt{font-weight:700;font-size:16px;color:' + C.navy + ';margin:2px 0 4px}.tcard p{margin:0 0 12px}.tbtn{display:flex;justify-content:space-between;gap:6px}.tbtn span{display:flex;gap:6px}',
    '.flash{animation:fl 1.6s}@keyframes fl{0%,60%{box-shadow:0 0 0 4px ' + C.amber + '}100%{box-shadow:none}}',
    '@media (max-width:1100px){.kpis{grid-template-columns:repeat(2,1fr)}.grid2,.grid2.wide,.grid2.plan{grid-template-columns:1fr}}',
    '@media (max-width:760px){.rail{display:none}.body{padding:10px}.hd{padding:12px}.kpis{padding:10px 10px 0}.answer{margin:10px 10px 0}.kv{font-size:20px}.lev{grid-template-columns:1fr auto}.lev .ls{grid-column:1/-1}.dw{flex-direction:column}}',
    '@media (max-width:620px){.kpis{grid-template-columns:1fr}.filters select{min-width:120px}}'
  ].join('\n');
  document.head.appendChild(css);

  on(root, 'click', onClick);
  on(root, 'change', onChange);
  on(root, 'focusin', onFocusIn);
  on(root, 'focusout', onFocusOut);
  on(document, 'keydown', onKey);
  var mainScroll = function (e) { if (e.target && e.target.id === 'main') onScroll(); };
  root.addEventListener('scroll', mainScroll, true); listeners.push([root, 'scroll', mainScroll, true]);
  on(window, 'resize', function () { if (S.tour >= 0 && $('tourL')) $('tourL').innerHTML = tourHtml(); });

  var baseTimer = setInterval(function () { if (!disposed) snapshotBase(); if (S.base) clearInterval(baseTimer); }, 300);
  root.__cleanup = function () {
    disposed = true; clearInterval(baseTimer);
    timers.forEach(clearTimeout);
    Object.keys(subs).forEach(function (k) { try { subs[k] && subs[k].unsubscribe && subs[k].unsubscribe(); } catch (e) { } });
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    if (css.parentNode) css.parentNode.removeChild(css);
  };

  render();
  if (!SDK) { S.errors.sdk = 'The Pigment SDK is not available.'; render(); return; }
  startData();
})();
