(function () {
  'use strict';
  // Reconomy November forecast cockpit. Source of truth: specs/reconomy/frames/reconomy_cockpit.src.js
  // build_frame.py inlines story.json at STORY_JSON and writes reconomy_cockpit.js (the deployed body).
  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var disposed = false, timers = [], subs = {}, listeners = [];
  var GBP = '£', EUR = '€', DASH = '–', ELL = '…';
  var STORY = /*STORY_JSON*/{};
  var EXT = STORY.explain || {}, TOUR = STORY.tour || [];
  var C = { navy: '#014664', navy2: '#00344B', blue: '#215DDB', blue2: '#376EE1', blueSoft: '#E9F0FD', green: '#00CF42', greenInk: '#08843A', greenSoft: '#E2F8E9', amber: '#E8A200', amberInk: '#8A5A00', amberSoft: '#FFF7E0', amberLine: '#F2C94C', red: '#E5484D', redSoft: '#FDECEC', ink: '#10283A', mut: '#5B6B7A', line: '#E2E8EE', lineSoft: '#EEF2F6', rowHover: '#F7FAFD', bg: '#F4F7FA', cloud: '#BFD1E3', slate: '#3A5266', sky: '#8EB4F5', teal: '#0BA5A5', jade: '#00B39B', pine: '#08843A', coral: '#E5484D', gold: '#F2C94C', violet: '#7B61FF', seafoam: '#E6F2F7' };
  var FONT = "'Montserrat', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
  var IC = {
    logo: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="#ffffff"/><path d="M14 5a9 9 0 0 1 8.5 6" fill="none" stroke="' + '#00CF42' + '" stroke-width="3.2" stroke-linecap="round"/><path d="M22.6 16.5A9 9 0 0 1 9 21.8" fill="none" stroke="' + '#215DDB' + '" stroke-width="3.2" stroke-linecap="round"/><path d="M6.2 18.4A9 9 0 0 1 10 6" fill="none" stroke="' + '#014664' + '" stroke-width="3.2" stroke-linecap="round"/></svg>',
    guide: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.2 6.2a1.9 1.9 0 1 1 2.6 1.8c-.6.3-.8.6-.8 1.2v.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.8" r=".9" fill="currentColor"/></svg>',
    reset: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    expand: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M9.5 2.5h4v4M6.5 13.5h-4v-4M13.5 2.5 9 7M2.5 13.5 7 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="currentColor" opacity=".12"/><path d="M9 8v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="5.3" r="1.1" fill="currentColor"/></svg>'
  };

  var V = 'Forecast Nov 26', VB = 'Budget FY26';
  var MN = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  function monthsFrom(y, m, n) { var o = []; for (var i = 0; i < n; i++) { var k = m + i; o.push(MN[k % 12] + ' ' + (y + Math.floor(k / 12))); } return o; }
  var R12 = monthsFrom(26, 10, 12);          // Nov 26 - Oct 27
  var VIEW = monthsFrom(26, 7, 15);          // Aug 26 - Oct 27
  var PLM = monthsFrom(26, 0, 22);           // Jan 26 - Oct 27
  var FY26 = monthsFrom(26, 0, 12);
  var LAST_ACT = 'Oct 26';
  function isAct(m) { return MKEY(m) <= MKEY(LAST_ACT); }
  var PL_ORDER = ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'];
  var SUBTOTAL = { 'Gross profit': 1, 'Adjusted EBITDA': 1 };
  var STATUSES = ['Not started', 'In progress', 'Submitted', 'Returned', 'Approved'];
  var ST_COL = { 'Not started': '#cbd5e1', 'In progress': C.gold, 'Submitted': C.violet, 'Returned': C.coral, 'Approved': C.green };
  var ST_PROG = { 'Not started': 0, 'In progress': 0.35, 'Submitted': 0.75, 'Returned': 0.35, 'Approved': 1 };
  var PRN = { s: 'Valpak packaging compliance', l: 'Recycling evidence - plastic (PRN)' };
  var NOV = { s: 'Noventiz dual system licensing', l: 'Licence fee per tonne' };

  var S = {
    cs: {}, schemes: [], basis: {}, basisDone: false, ms: {}, sectors: [], ent: {}, ents: [], lines: [],
    csm: {}, msm: {}, haul: null, plm: {}, fx: {}, wfs: {}, wfc: {}, stages: [], wfEnts: [],
    loaded: {}, errors: {}, step: 1, selScheme: PRN.s, busy: '', toast: null, recalc: false,
    visited: { 1: true }, submit: null, ORIG: {}, explain: null, stack: [], tour: -1, base: null, baseM: {}, editing: false, ptr: false, signoff: null, expand: null
  };

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
  function MKEY(s) { var m = /^([A-Za-z]{3})\w*\s+(\d{2,4})$/.exec(s || ''); if (!m) return 0; var y = +m[2]; if (y < 100) y += 2000; return y * 12 + MN.indexOf(m[1]); }
  function mf(v, cur) { if (!isNum(v)) return DASH; var s = (cur || GBP) + commas(Math.abs(v).toFixed(0)); return v < 0 ? '(' + s + ')' : s; }
  function mshort(v) { if (!isNum(v)) return DASH; var a = Math.abs(v), s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + 'm' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'k' : a.toFixed(0); return (v < 0 ? '-' : '') + GBP + s; }
  function signed(v) { if (!isNum(v)) return DASH; return (v >= 0 ? '+' : '-') + GBP + commas(Math.abs(v).toFixed(0)); }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 1 : dp) + '%' : DASH; }
  function num(v, dp) { return isNum(v) ? commas(v.toFixed(dp || 0)) : DASH; }
  function rate(v) { return isNum(v) ? v.toFixed(4) : DASH; }
  function curOf(s) { return /^Valpak/.test(s || '') ? GBP : EUR; }
  function div(a, b) { return isNum(a) && isNum(b) && b ? a / b : null; }
  function sum(arr) { var t = 0, any = false; arr.forEach(function (v) { if (isNum(v)) { t += v; any = true; } }); return any ? t : null; }
  function ordered(names, order) { return names.slice().sort(function (a, b) { var ia = order.indexOf(a), ib = order.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); }); }
  function changed() { return Object.keys(S.ORIG).length > 0; }

  // ---------- data ----------
  var renderQueued = false;
  function scheduleRender() { if (renderQueued || disposed) return; renderQueued = true; timer(function () { renderQueued = false; if (S.editing || S.ptr) return; render(); }, 40); }
  function hasLoad(a) { for (var i = 0; i < (a || []).length; i++) { var x = a[i]; if (x && typeof x === 'object' && x.kind === 'loading') return true; } return false; }
  function ready(d) { if (!d || !d.rows) return false; for (var r = 0; r < d.rows.length; r++) { if (hasLoad(d.rows[r].labels) || hasLoad(d.rows[r].values)) return false; } return true; }
  function sub(name, cb, filters) {
    return SDK.subscribeToDataSource(name, {
      dynamicFilters: filters || [],
      onData: function (d) {
        if (disposed || !ready(d)) return;
        delete S.errors[name];
        if (d.totalRowCount > 1000) S.errors[name + '_size'] = name + ' returns ' + d.totalRowCount + ' rows; only the first 1,000 are used.';
        try { cb(d); } catch (e) { S.errors[name] = name + ': ' + String((e && e.message) || e); }
        S.loaded[name] = true; S.recalc = false;
        snapshotBase();
        scheduleRender();
      },
      onError: function (e) { if (disposed) return; S.errors[name] = name + ': ' + ((e && e.message) || 'could not load'); scheduleRender(); }
    });
  }
  var FV = [{ binding: 'versionList', selection: [V] }];
  function onEnt(d) {
    var o = {}, es = {}, ls = {};
    d.rows.forEach(function (r) { var e = lab(r.labels[0]), l = lab(r.labels[1]); if (!e || !l) return; (o[e] = o[e] || {})[l] = nz(r.values[0]); if (isNum(r.values[0])) { es[e] = 1; ls[l] = 1; } });
    S.ent = o; S.ents = Object.keys(es); S.lines = ordered(Object.keys(ls), PL_ORDER);
    S.ents.sort(function (a, b) { return (entV(b, 'Revenue') || 0) - (entV(a, 'Revenue') || 0); });
  }
  function onCS(d) {
    var o = {}, ss = {};
    d.rows.forEach(function (r) {
      var s = lab(r.labels[0]), l = lab(r.labels[1]); if (!s || !l) return; var v = r.values;
      if (!isNum(v[0]) && !isNum(v[2]) && !isNum(v[3])) return;
      (o[s] = o[s] || {})[l] = { rev: nz(v[0]), gp: nz(v[1]), price: nz(v[2]), cost: nz(v[3]), pchg: nz(v[4]), cchg: nz(v[5]), vol: nz(v[6]), growth: nz(v[7]) };
      ss[s] = 1;
    });
    S.cs = o; S.schemes = Object.keys(ss).sort(function (a, b) { return (schTot(b).rev || 0) - (schTot(a).rev || 0); });
  }
  function schemeKey(s) { return ({ Valpak: '1', Noventiz: '2', RLG: '3' }[s.split(' ')[0]] || '9') + s; }
  function onBasis(d) { d.rows.forEach(function (r) { var s = lab(r.labels[0]), l = lab(r.labels[1]); if (s && l) S.basis[s + '|' + l] = sv(r.values[0]); }); S.basisDone = true; timer(function () { if (subs.dsCSB) { try { subs.dsCSB.unsubscribe(); } catch (e) { } delete subs.dsCSB; } }, 0); }
  function onMS(d) {
    var o = {};
    d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (!s) return; var v = r.values; o[s] = { rev: nz(v[0]), gp: nz(v[1]), inc: nz(v[2]), rec: nz(v[3]), pass: nz(v[4]) }; });
    S.ms = o; S.sectors = Object.keys(o).filter(function (k) { return isNum(o[k].rev); }).sort(function (a, b) { return (o[b].rev || 0) - (o[a].rev || 0); });
  }
  function onCSM(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]), m = lab(r.labels[1]); if (!s || !m) return; (o[s] = o[s] || {})[m] = { rev: nz(r.values[0]), gp: nz(r.values[1]) }; }); S.csm = o; baseMonthly('csm', function () { var b = {}; VIEW.forEach(function (m) { b[m] = csMonth(m).gp; }); return b; }); }
  function onMSM(d) { var o = {}; d.rows.forEach(function (r) { var m = lab(r.labels[0]); if (!m) return; var v = r.values; o[m] = { rev: nz(v[0]), gp: nz(v[1]), inc: nz(v[2]), rec: nz(v[3]), lt: nz(v[4]), ltin: nz(v[5]) }; }); S.msm = o; baseMonthly('msm', function () { var b = {}; VIEW.forEach(function (m) { b[m] = (o[m] || {}).gp; }); return b; }); }
  function onKnob(d) { var r = d.rows[0]; S.haul = r ? nz(r.values[0]) : null; }
  function onPLM(d) { var o = {}; d.rows.forEach(function (r) { var m = lab(r.labels[0]), l = lab(r.labels[1]), v = lab(r.labels[2]); if (!m || !l || !v) return; ((o[v] = o[v] || {})[m] = o[v][m] || {})[l] = nz(r.values[0]); }); S.plm = o; baseMonthly('plm', function () { var b = {}; PLM.forEach(function (m) { b[m] = plv(V, m, 'Adjusted EBITDA'); }); return b; }); }
  function onFX(d) { var o = {}; d.rows.forEach(function (r) { var c = lab(r.labels[0]); if (c) o[c] = nz(r.values[0]); }); S.fx = o; }
  function onWFS(d) { var o = {}, st = {}, es = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = sv(r.values[0]); st[s] = 1; es[e] = 1; }); S.wfs = o; S.stages = Object.keys(st).sort(); S.wfEnts = Object.keys(es); }
  function onWFC(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = { c: sv(r.values[0]), o: sv(r.values[1]), r: sv(r.values[2]) }; }); S.wfc = o; }
  function baseMonthly(k, fn) { if (!S.baseM[k] && !changed()) S.baseM[k] = fn(); }

  var STEP_SRC = {
    1: [['dsCSB', onBasis], ['dsCSM', onCSM, [{ binding: 'versionList', selection: [V] }, { binding: 'monthList', selection: VIEW }]]],
    2: [['dsMSM', onMSM, [{ binding: 'versionList', selection: [V] }, { binding: 'monthList', selection: VIEW }]], ['dsKnob', onKnob, FV]],
    3: [['dsPLM', onPLM, [{ binding: 'versionList', selection: [V, VB] }, { binding: 'monthList', selection: PLM }]], ['dsFX', onFX, FV]],
    4: []
  };
  function startData() {
    subs.dsEnt = sub('dsEnt', onEnt, FV);
    subs.dsCS = sub('dsCS', onCS, FV);
    subs.dsMS = sub('dsMS', onMS, FV);
    subs.dsWFS = sub('dsWFS', onWFS);
    subs.dsWFC = sub('dsWFC', onWFC);
    stepData(S.step);
  }
  function stepData(n) {
    Object.keys(STEP_SRC).forEach(function (k) {
      STEP_SRC[k].forEach(function (x) {
        var name = x[0], want = (+k === n) && !(name === 'dsCSB' && S.basisDone);
        if (want && !subs[name]) subs[name] = sub(name, x[1], x[2]);
        if (!want && subs[name]) { try { subs[name].unsubscribe(); } catch (e) { } delete subs[name]; }
      });
    });
  }

  // ---------- derived numbers ----------
  function entV(e, l) { return (S.ent[e] || {})[l]; }
  function grp(l) { return sum(S.ents.map(function (e) { return entV(e, l); })); }
  function csTot() { var rev = [], gp = []; S.schemes.forEach(function (s) { var x = schTot(s); rev.push(x.rev); gp.push(x.gp); }); return { rev: sum(rev), gp: sum(gp) }; }
  function schTot(s) { var o = S.cs[s] || {}, rev = [], gp = []; Object.keys(o).forEach(function (l) { rev.push(o[l].rev); gp.push(o[l].gp); }); return { rev: sum(rev), gp: sum(gp) }; }
  function csLine(s, l) { return (S.cs[s] || {})[l] || {}; }
  function msTot() { var o = { rev: [], gp: [], inc: [], rec: [] }; S.sectors.forEach(function (k) { var x = S.ms[k]; o.rev.push(x.rev); o.gp.push(x.gp); o.inc.push(x.inc); o.rec.push(x.rec); }); return { rev: sum(o.rev), gp: sum(o.gp), inc: sum(o.inc), rec: sum(o.rec) }; }
  function csMonth(m, s) { var ks = s ? [s] : Object.keys(S.csm), rev = [], gp = []; ks.forEach(function (k) { var x = (S.csm[k] || {})[m] || {}; rev.push(x.rev); gp.push(x.gp); }); return { rev: sum(rev), gp: sum(gp) }; }
  function plv(v, m, l) { return ((S.plm[v] || {})[m] || {})[l]; }
  function plFY(v, l) { return sum(FY26.map(function (m) { return plv(v, m, l); })); }
  function isCostPlus(s, l) { return /cost plus/i.test(S.basis[s + '|' + l] || '') || (!S.basisDone && /PRN/.test(l)); }
  function coreLoaded() { return S.loaded.dsEnt && S.loaded.dsCS && S.loaded.dsMS; }
  function snapshotBase() {
    if (S.base || !coreLoaded()) return;
    var cs = csTot(), ms = msTot(), sch = {}, sec = {}, ent = {};
    S.schemes.forEach(function (s) { sch[s] = schTot(s); });
    S.sectors.forEach(function (k) { sec[k] = { gp: S.ms[k].gp, inc: S.ms[k].inc, rec: S.ms[k].rec }; });
    S.ents.forEach(function (e) { ent[e] = { rev: entV(e, 'Revenue'), eb: entV(e, 'Adjusted EBITDA') }; });
    S.base = { grev: grp('Revenue'), geb: grp('Adjusted EBITDA'), csrev: cs.rev, csgp: cs.gp, msrev: ms.rev, msgp: ms.gp, sch: sch, sec: sec, ent: ent };
  }
  function delta(now, was) { if (!changed() || !isNum(now) || !isNum(was) || Math.abs(now - was) < 0.5) return ''; return '<span class="dl ' + (now > was ? 'up' : 'dn') + '">' + (now > was ? '▲ ' : '▼ ') + signed(now - was).replace(/^[+-]/, '') + ' vs start</span>'; }
  function answer() {
    if (!coreLoaded()) return 'Loading the November forecast from Pigment' + ELL;
    var rev = grp('Revenue'), eb = grp('Adjusted EBITDA'), cs = csTot(), ms = msTot(), b = S.base || {};
    var t = 'Over the next 12 months (Nov 26 to Oct 27) the group forecasts ' + mf(rev) + ' of revenue and ' + mf(eb) + ' of adjusted EBITDA, a ' + pct(div(eb, rev)) + ' margin.';
    if (changed() && isNum(b.geb)) {
      var dEb = eb - b.geb, bits = [];
      if (Math.abs(cs.gp - b.csgp) >= 1000) bits.push('compliance gross profit ' + signed(cs.gp - b.csgp));
      if (Math.abs(ms.gp - b.msgp) >= 1000) bits.push('UK managed services gross profit ' + signed(ms.gp - b.msgp));
      t += Math.abs(dEb) < 1000 ? ' Your changes leave adjusted EBITDA where it started.' : ' Your changes move adjusted EBITDA by ' + signed(dEb) + ' against the starting forecast' + (bits.length ? ': ' + bits.join(', ') : ', through exchange rates') + '.';
      if (Math.abs(cs.rev - b.csrev) > 1000 && Math.abs(cs.gp - b.csgp) < Math.abs(cs.rev - b.csrev) * 0.05) t += ' Compliance revenue moved ' + signed(cs.rev - b.csrev) + ' with almost no change in gross profit: that cost is passed through.';
    } else t += ' Compliance schemes earn ' + mf(cs.gp) + ' gross profit at ' + pct(div(cs.gp, cs.rev)) + ' and UK managed services ' + mf(ms.gp) + ' at ' + pct(div(ms.gp, ms.rev)) + '.';
    return t;
  }

  // ---------- explain ----------
  function P(label, value, key, ctx) { return { label: label, value: value, key: key, ctx: ctx || {} }; }
  function EX(key, c) {
    c = c || {};
    var st = EXT[key] || { t: key, what: '', f: '', where: '' }, x = { t: st.t, what: st.what, f: st.f, where: st.where, v: '', live: '', parts: [], rows: null, change: [] };
    var rev, gp, o, l, s;
    switch (key) {
      case 'grev':
        rev = grp('Revenue'); x.v = mf(rev); x.live = '= ' + S.ents.slice(0, 4).map(function (e) { return e + ' ' + mshort(entV(e, 'Revenue')); }).join(' + ') + ' + ' + (S.ents.length - 4) + ' more';
        x.parts = S.ents.map(function (e) { return P(e, mf(entV(e, 'Revenue')), 'ent', { e: e }); });
        x.rows = plRows('Revenue'); x.change = ['fx', 'prn', 'ltax']; break;
      case 'gebitda':
        x.v = mf(grp('Adjusted EBITDA'));
        x.live = '= gross profit ' + mshort(grp('Gross profit')) + ' + people ' + mshort(grp('People costs')) + ' + sites ' + mshort(grp('Sites and property')) + ' + IT and other ' + mshort(grp('IT and other overheads'));
        x.parts = ['Gross profit', 'People costs', 'Sites and property', 'IT and other overheads'].map(function (k) { return P(k, mf(grp(k)), 'line', { line: k }); });
        x.rows = S.ents.map(function (e) { return [e, entV(e, 'Adjusted EBITDA')]; }); x.rowsLabel = 'By entity'; x.change = ['fx', 'nov', 'ltax', 'haul']; break;
      case 'gmargin':
        rev = grp('Revenue'); var eb = grp('Adjusted EBITDA'); x.v = pct(div(eb, rev)); x.live = '= ' + mf(eb) + ' / ' + mf(rev);
        x.parts = [P('Adjusted EBITDA', mf(eb), 'gebitda'), P('Revenue', mf(rev), 'grev')]; break;
      case 'line':
        l = c.line || 'Revenue'; x.t = l + ', next 12 months'; x.v = mf(grp(l)); x.live = SUBTOTAL[l] ? 'Running total of the lines above, all entities' : 'Sum of ' + S.ents.length + ' entities';
        x.parts = S.ents.map(function (e) { return P(e, mf(entV(e, l)), 'ent', { e: e }); }); x.rows = plRows(l); break;
      case 'ent':
        var e = c.e; x.t = e + ', next 12 months'; x.v = mf(entV(e, 'Adjusted EBITDA')) + ' adj. EBITDA';
        x.live = 'Revenue ' + mf(entV(e, 'Revenue')) + ' + direct costs ' + mf(entV(e, 'Direct costs')) + ' = gross profit ' + mf(entV(e, 'Gross profit')) + '; less overheads = ' + mf(entV(e, 'Adjusted EBITDA'));
        x.parts = S.lines.map(function (k) { return P(k, mf(entV(e, k)), 'line', { line: k }); }); x.change = /Noventiz|RLG|Cycleon|North America/.test(e) ? ['fx'] : /Valpak/.test(e) ? ['prn'] : /Reconomy UK/.test(e) ? ['ltax', 'haul'] : []; break;
      case 'fyvar':
        l = c.line || 'Adjusted EBITDA'; var f = plFY(V, l), bu = plFY(VB, l); x.t = l + ': FY26 forecast against budget'; x.v = signed(isNum(f) && isNum(bu) ? f - bu : null);
        x.live = '= ' + mf(f) + ' forecast - ' + mf(bu) + ' budget'; x.parts = [P('Forecast FY26', mf(f), 'line', { line: l }), P('Budget FY26', mf(bu), 'line', { line: l })];
        x.rows = FY26.map(function (m) { var a = plv(V, m, l), b2 = plv(VB, m, l); return [m + (isAct(m) ? ' (actual)' : ''), isNum(a) && isNum(b2) ? a - b2 : null]; }); x.rowsLabel = 'Forecast minus budget by month'; break;
      case 'fx':
        x.t = 'Plan rate, ' + (c.cur || 'EUR'); x.v = rate(S.fx[c.cur || 'EUR']) + ' ' + GBP + ' per unit'; x.live = 'Used for every forecast month from Nov 26'; x.change = ['fx']; break;
      case 'csrev': case 'csgp':
        var t = csTot(), isR = key === 'csrev'; x.v = mf(isR ? t.rev : t.gp); if (!isR) x.live = '= revenue ' + mf(t.rev) + ' - direct cost ' + mf(t.rev - t.gp) + ' (margin ' + pct(div(t.gp, t.rev)) + ')';
        x.parts = S.schemes.map(function (s2) { var z = schTot(s2); return P(s2, mf(isR ? z.rev : z.gp), isR ? 'schrev' : 'schgp', { s: s2 }); });
        x.rows = Object.keys(S.csm).length ? VIEW.map(function (m) { var z = csMonth(m); return [m + (isAct(m) ? ' (actual)' : ''), isR ? z.rev : z.gp]; }) : null; x.change = ['prn', 'nov', 'lines']; break;
      case 'schrev': case 'schgp':
        s = c.s; o = schTot(s); isR = key === 'schrev'; x.t = s + (isR ? ': revenue' : ': gross profit') + ', next 12 months'; x.v = mf(isR ? o.rev : o.gp);
        if (!isR) x.live = '= revenue ' + mf(o.rev) + ' - direct cost ' + mf(o.rev - o.gp) + ' (margin ' + pct(div(o.gp, o.rev)) + ')';
        x.parts = Object.keys(S.cs[s] || {}).map(function (k) { var z = csLine(s, k); return P(k, mf(isR ? z.rev : z.gp), isR ? 'linerev' : 'linegp', { s: s, l: k }); });
        x.rows = S.csm[s] ? VIEW.map(function (m) { var z = csMonth(m, s); return [m + (isAct(m) ? ' (actual)' : ''), isR ? z.rev : z.gp]; }) : null; x.change = ['lines']; break;
      case 'linerev': case 'linegp':
        s = c.s; l = c.l; o = csLine(s, l); var cp = isCostPlus(s, l), cu = curOf(s); x.t = l + ', ' + s; x.v = mf(key === 'linerev' ? o.rev : o.gp);
        x.live = key === 'linerev' ? num(o.vol) + ' a month x ' + (cp ? '(cost ' + mf(o.cost, cu) + ' + fee ' + mf(o.price, cu) + ')' : 'price ' + mf(o.price, cu)) + (/Membership/.test(l) ? ' / 12' : '') + ', grown ' + pct(o.growth) + ' a year, in pounds' : '= revenue ' + mf(o.rev) + ' - direct cost ' + mf(o.rev - o.gp) + (cp ? ' (cost passed through: gross profit is the fee)' : '');
        x.parts = [P('Pricing basis', S.basis[s + '|' + l] || (cp ? 'Cost plus fee' : 'Fixed price'), 'basis', c), P('Volume per month', num(o.vol), 'vol', c), P('Price or fee per unit', mf(o.price, cu), 'price', c), P('Cost per unit', mf(o.cost, cu), 'cost', c), P('Price change Jan', pct(o.pchg), 'pchg', c), P('Cost change Jan', pct(o.cchg), 'cchg', c)];
        x.change = s === PRN.s && l === PRN.l ? ['prn', 'lines'] : s === NOV.s && l === NOV.l ? ['nov', 'lines'] : ['lines']; break;
      case 'price': case 'cost': case 'pchg': case 'cchg': case 'vol': case 'basis':
        s = c.s; l = c.l; o = csLine(s, l); cu = curOf(s);
        x.t = (EXT[key] || {}).t + ', ' + l + ', ' + s;
        x.v = key === 'price' ? mf(o.price, cu) : key === 'cost' ? mf(o.cost, cu) : key === 'pchg' ? pct(o.pchg) : key === 'cchg' ? pct(o.cchg) : key === 'vol' ? num(o.vol) + ' a month' : (S.basis[s + '|' + l] || DASH);
        x.parts = [P('Line revenue, next 12 months', mf(o.rev), 'linerev', c), P('Line gross profit, next 12 months', mf(o.gp), 'linegp', c)];
        x.change = s === PRN.s && l === PRN.l && key === 'cost' ? ['prn', 'lines'] : s === NOV.s && l === NOV.l && key === 'cchg' ? ['nov', 'lines'] : ['lines']; break;
      case 'msrev': case 'msgp':
        var mt = msTot(); isR = key === 'msrev'; x.v = mf(isR ? mt.rev : mt.gp);
        x.live = isR ? 'includes ' + mf(mt.rec) + ' of cost increases passed on' : '= revenue ' + mf(mt.rev) + ' - direct cost ' + mf(mt.rev - mt.gp) + ' (margin ' + pct(div(mt.gp, mt.rev)) + ')';
        x.parts = S.sectors.map(function (k) { return P(k, mf(isR ? S.ms[k].rev : S.ms[k].gp), 'secgp', { sec: k }); });
        x.rows = Object.keys(S.msm).length ? VIEW.map(function (m) { var z = S.msm[m] || {}; return [m + (isAct(m) ? ' (actual)' : ''), isR ? z.rev : z.gp]; }) : null; x.change = ['ltax', 'haul', 'pass']; break;
      case 'secgp':
        o = S.ms[c.sec] || {}; x.t = c.sec + ': gross profit, next 12 months'; x.v = mf(o.gp); x.live = '= revenue ' + mf(o.rev) + ' - direct cost ' + mf(o.rev - o.gp) + ' (margin ' + pct(div(o.gp, o.rev)) + ')';
        x.parts = [P('Cost increase', mf(o.inc), 'secinc', c), P('Passed on to customers', mf(o.rec), 'secrec', c), P('Pass-through share', pct(o.pass, 0), 'pass', c)]; x.change = ['ltax', 'haul', 'pass']; break;
      case 'secinc':
        o = S.ms[c.sec] || {}; x.t = c.sec + ': cost increase, next 12 months'; x.v = mf(o.inc); x.live = 'Haulier rate rise ' + pct(S.haul, 0) + ' from Jan 27; landfill tax ' + mf((S.msm['Apr 27'] || {}).lt) + ' a tonne from Apr 27 against ' + GBP + '130.75 today';
        x.parts = [P('Haulier rate increase', pct(S.haul, 0), 'haul'), P('Landfill tax from Apr 27', mf((S.msm['Apr 27'] || {}).lt), 'ltax')]; x.change = ['ltax', 'haul']; break;
      case 'secrec':
        o = S.ms[c.sec] || {}; x.t = c.sec + ': passed on, next 12 months'; x.v = mf(o.rec); x.live = '= ' + mf(o.inc) + ' x ' + pct(o.pass, 0) + '; absorbed ' + mf(isNum(o.inc) && isNum(o.rec) ? o.inc - o.rec : null);
        x.parts = [P('Cost increase', mf(o.inc), 'secinc', c), P('Pass-through share', pct(o.pass, 0), 'pass', c)]; x.change = ['pass']; break;
      case 'pass':
        o = S.ms[c.sec] || {}; x.t = 'Pass-through share' + (c.sec ? ', ' + c.sec : ''); x.v = pct(o.pass, 0); x.change = ['pass']; break;
      case 'ltax':
        x.v = mf((S.msm['Apr 27'] || {}).lt) + ' from Apr 27'; x.live = 'Today ' + GBP + '130.75 a tonne (from Apr 26)';
        x.rows = Object.keys(S.msm).length ? VIEW.map(function (m) { return [m, (S.msm[m] || {}).lt]; }) : null; x.rowsLabel = 'Landfill tax per tonne by month'; x.rowsFmt = 'rate2'; x.change = ['ltax']; break;
      case 'haul':
        x.v = pct(S.haul, 0) + ' from Jan 27'; x.live = 'Haulier factor ' + (isNum(S.haul) ? (1 + S.haul).toFixed(3) : DASH) + ' on every lift from Jan 27'; x.change = ['haul']; break;
      case 'status':
        var w = (S.wfs[c.e] || {})[c.st] || 'Not started', cm = (S.wfc[c.e] || {})[c.st] || {};
        x.t = c.e + ': ' + c.st; x.v = w; x.live = 'Progress ' + pct(ST_PROG[w], 0) + (cm.o ? '; owner ' + cm.o : '') + (cm.c ? '; "' + cm.c + '"' : ''); break;
    }
    return x;
  }
  function plRows(l) { return Object.keys(S.plm).length ? PLM.filter(function (m) { return MKEY(m) >= MKEY('Aug 26'); }).map(function (m) { return [m + (isAct(m) ? ' (actual)' : ''), plv(V, m, l)]; }) : S.ents.map(function (e) { return [e, entV(e, l)]; }); }
  var LEVER = { prn: ['plastic PRN cost', 1, 't-cslev'], nov: ['Noventiz sorting cost', 1, 't-csnov'], lines: ['scheme drivers', 1, 't-lines'], ltax: ['landfill tax', 2, 't-mslev'], haul: ['haulier increase', 2, 't-mslev'], pass: ['pass-through by sector', 2, 't-pass'], fx: ['plan exchange rates', 3, 't-fx'] };

  // ---------- writes ----------
  var Q = {};
  function write(sink, coords, val, label, origVal, shown, quiet) {
    var k = sink + '|' + JSON.stringify(coords);
    if (!(k in S.ORIG)) S.ORIG[k] = { sink: sink, coords: coords, v: origVal, label: label };
    var q = Q[k] || (Q[k] = { inflight: false, pending: undefined, shown: '' });
    q.pending = val; q.shown = shown || String(val); q.quiet = !!quiet; flush(k);
  }
  function flush(k) {
    var q = Q[k]; if (!q || q.inflight || q.pending === undefined) return;
    var o = S.ORIG[k], val = q.pending, shown = q.shown; q.pending = undefined; q.inflight = true;
    S.busy = 'Writing ' + o.label + ' to Pigment' + ELL; render();
    var p; try { p = Promise.resolve(SDK.editValue(o.sink, o.coords, val)); } catch (e) { p = Promise.reject(e); }
    p.then(function () {
      if (disposed) return; q.inflight = false; S.busy = ''; S.recalc = true;
      if (!q.quiet) toast('ok', o.label + ' set to ' + shown + '. Pigment is recalculating.');
      timer(function () { S.recalc = false; scheduleRender(); }, 3000);
      flush(k);
    }).catch(function (e) { if (disposed) return; q.inflight = false; S.busy = ''; toast('err', 'Pigment did not save the change: ' + ((e && e.message) || e)); });
  }
  function resetAll() {
    var ks = Object.keys(S.ORIG); if (!ks.length) { toast('ok', 'Nothing to reset: the model is at the starting forecast.'); return; }
    S.busy = 'Putting back ' + ks.length + ' value' + (ks.length > 1 ? 's' : '') + ELL; render();
    var ps = ks.map(function (k) { var o = S.ORIG[k]; return Promise.resolve(SDK.editValue(o.sink, o.coords, o.v)); });
    Promise.all(ps).then(function () { if (disposed) return; S.ORIG = {}; S.busy = ''; S.recalc = true; restoreLocal(); toast('ok', 'Back to the starting forecast.'); timer(function () { S.recalc = false; scheduleRender(); }, 3000); })
      .catch(function (e) { if (disposed) return; S.busy = ''; toast('err', 'Pigment did not save the reset: ' + ((e && e.message) || e)); });
  }
  function restoreLocal() { /* values come back through the data sources after recalculation */ }
  function toast(kind, text) { S.toast = { kind: kind, text: text }; render(); timer(function () { S.toast = null; scheduleRender(); }, kind === 'err' ? 7000 : 3500); }
  var CV = { versionList: V };
  function csCoords(s, l) { return { versionList: V, schemeList: s, lineList: l }; }
  function setCS(field, s, l, v) {
    var o = (S.cs[s] = S.cs[s] || {})[l] = csLine(s, l), was = o[field]; if (isNum(was) && Math.abs(was - v) < 1e-9) return;
    o[field] = v; var sink = { price: 'priceSink', cost: 'costSink', pchg: 'priceChgSink', cchg: 'costChgSink' }[field];
    var nm = { price: 'Price or fee', cost: 'Cost per unit', pchg: 'Price change Jan', cchg: 'Cost change Jan' }[field] + ' for ' + l + ', ' + s;
    write(sink, csCoords(s, l), v, nm, was, /chg/.test(field) ? pct(v) : mf(v, curOf(s)));
  }
  function setLtax(v) { var o = S.msm['Apr 27'] = S.msm['Apr 27'] || {}, was = isNum(o.ltin) ? o.ltin : 130.75; if (Math.abs(was - v) < 1e-9) return; o.ltin = v; o.lt = v; write('ltaxSink', { versionList: V, monthList: 'Apr 27' }, v, 'Landfill tax from Apr 27', was, mf(v) + ' a tonne'); }
  function setHaul(v) { var was = S.haul; if (isNum(was) && Math.abs(was - v) < 1e-9) return; S.haul = v; write('haulSink', CV, v, 'Haulier rate increase from Jan 27', was, pct(v, 0)); }
  function setPass(sec, v) { var o = S.ms[sec] || {}, was = o.pass; if (isNum(was) && Math.abs(was - v) < 1e-9) return; o.pass = v; write('passSink', { versionList: V, sectorList: sec }, v, 'Pass-through for ' + sec, was, pct(v, 0)); }
  function setFx(cur, v) { var was = S.fx[cur]; if (isNum(was) && Math.abs(was - v) < 1e-9) return; S.fx[cur] = v; write('fxSink', { versionList: V, currencyList: cur }, v, cur + ' plan rate', was, rate(v)); }

  // ---------- charts (drawn at real pixel size after each render, so text never scales) ----------
  var CH = {}, CHT = {}, chartSeq = 0, hoverEl = null;
  function card(id, title, body, opts) {
    opts = opts || {};
    var m = opts.chart ? /data-chart="([^"]+)"/.exec(body) : null, cid = m ? m[1] : null;
    if (cid) CHT[cid] = title;
    return '<div class="card' + (opts.cls ? ' ' + opts.cls : '') + '"' + (opts.domId ? ' id="' + opts.domId + '"' : '') + '><div class="ch"><h3>' + title + '</h3>' + (opts.tag ? '<span class="tag">' + opts.tag + '</span>' : '') + (cid ? '<button class="icon-btn" data-expand="' + cid + '" title="Open full width" aria-label="Open full width">' + IC.expand + '</button>' : '') + '</div>' + body + '</div>';
  }
  function dattr(key, c) { var s = ' data-ex="' + key + '"'; Object.keys(c || {}).forEach(function (k) { s += ' data-c' + k + '="' + esc(c[k]) + '"'; }); return s; }
  function legendHtml(items) { return '<div class="legend">' + items.map(function (x) { return x.dash ? '<span><i class="dash" style="border-color:' + x.c + '"></i>' + esc(x.n) + '</span>' : '<span><i style="background:' + x.c + '"></i>' + esc(x.n) + '</span>'; }).join('') + '</div>'; }
  // horizontal paired bars: rows [{label, a, b, base, c}]
  function hbars(rows, la, lb, ca, cb, keyA, keyB) {
    var id = 'ch' + (++chartSeq), leg = [{ n: la, c: ca }, { n: lb, c: cb }];
    if (changed()) leg.push({ n: lb + ' before your change', c: C.slate, dash: true });
    CH[id] = { type: 'bar', rows: rows, la: la, lb: lb, ca: ca, cb: cb, keyA: keyA, keyB: keyB, legend: legendHtml(leg) };
    return '<div class="chart" data-chart="' + id + '"></div>' + CH[id].legend;
  }
  // line chart over months, actual months shaded: series [{name, v:[], c, dash, w, key, ctx}]
  function lineChart(months, series, h, fmt) {
    var id = 'ch' + (++chartSeq), keyed = series.filter(function (x) { return x.key; })[0] || {};
    CH[id] = { type: 'line', months: months, series: series, h: h || 260, fmt: fmt, key: keyed.key, ctx: keyed.ctx || {}, legend: legendHtml(series.map(function (x) { return { n: x.name, c: x.c, dash: x.dash }; })) };
    return '<div class="chart" data-chart="' + id + '"></div>' + CH[id].legend;
  }
  function drawCharts() {
    var els = root.querySelectorAll('[data-chart]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], sp = CH[el.getAttribute('data-chart')]; if (!sp) continue;
      var w = Math.max(280, Math.floor(el.clientWidth || 600)), h = +(el.getAttribute('data-h') || 0) || sp.h;
      el.innerHTML = sp.type === 'line' ? lineSvg(sp, w, h, el) : barSvg(sp, w, el);
    }
  }
  function cut(t, n) { return t.length > n ? t.slice(0, n - 1) + ELL : t; }
  function barSvg(sp, w, el) {
    var rows = sp.rows, rh = 40, pt = 4, H = rows.length * rh + pt * 2, lw = Math.min(240, Math.round(w * 0.32)), x0 = lw + 16, vc = 92, x1 = Math.max(x0 + 40, w - vc - 16), mx = 0;
    rows.forEach(function (r) { mx = Math.max(mx, Math.abs(r.a || 0), Math.abs(r.b || 0), Math.abs(r.base || 0)); }); mx = mx || 1;
    var X = function (v) { return x0 + (x1 - x0) * Math.max(0, v || 0) / mx; };
    var s = '<svg class="svg" width="' + w + '" height="' + H + '"><rect class="hb" x="0" y="0" width="' + w + '" height="' + rh + '" rx="8" fill="' + C.blueSoft + '" style="display:none"/>';
    s += '<line x1="' + (w - vc - 6) + '" x2="' + (w - vc - 6) + '" y1="' + pt + '" y2="' + (H - pt) + '" stroke="' + C.lineSoft + '"/>';
    rows.forEach(function (r, i) {
      var y = pt + i * rh;
      s += '<text class="t-lab" x="' + lw + '" y="' + (y + 24) + '" text-anchor="end">' + esc(cut(r.label, Math.floor(lw / 6.4))) + '</text>';
      if (isNum(r.a)) s += '<rect x="' + x0 + '" y="' + (y + 9) + '" width="' + Math.max(2, X(r.a) - x0) + '" height="8" rx="4" fill="' + sp.ca + '"/>';
      if (isNum(r.base) && changed() && Math.abs(r.base - (r.b || 0)) > 0.5) s += '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + Math.max(2, X(r.base) - x0) + '" height="10" rx="5" fill="none" stroke="' + C.slate + '" stroke-dasharray="4 3"/>';
      if (isNum(r.b)) s += '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + Math.max(2, X(r.b) - x0) + '" height="10" rx="5" fill="' + sp.cb + '"/>';
      s += '<text class="t-ax" x="' + (w - 4) + '" y="' + (y + 17) + '" text-anchor="end">' + mshort(r.a) + '</text>';
      s += '<text class="t-val" x="' + (w - 4) + '" y="' + (y + 31) + '" text-anchor="end">' + mshort(r.b) + '</text>';
    });
    el.__g = { type: 'bar', pt: pt, rh: rh, n: rows.length, sp: sp, idx: null };
    return s + '</svg>';
  }
  function lineSvg(sp, w, h, el) {
    var months = sp.months, series = sp.series, H = h, pl = 62, pr = 18, pt = 22, pb = 28, n = months.length || 1, mx = -Infinity, mn = Infinity, F = sp.fmt || mshort;
    series.forEach(function (sr) { sr.v.forEach(function (v) { if (isNum(v)) { mx = Math.max(mx, v); mn = Math.min(mn, v); } }); });
    if (!isFinite(mx)) { mx = 1; mn = 0; } mn = Math.min(0, mn); mx = mx > 0 ? mx * 1.1 : 1;
    var step = (w - pl - pr) / Math.max(1, n - 1), X = function (i) { return pl + (n === 1 ? (w - pl - pr) / 2 : i * step); }, Y = function (v) { return pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn)); };
    var s = '<svg class="svg" width="' + w + '" height="' + H + '">', na = months.filter(isAct).length;
    if (na) {
      var xa = X(na - 1) + step / 2;
      s += '<rect x="' + pl + '" y="' + pt + '" width="' + Math.max(0, xa - pl) + '" height="' + (H - pt - pb) + '" fill="' + C.bg + '"/><text class="t-zone" x="' + (pl + 6) + '" y="' + (pt - 7) + '">ACTUAL</text><text class="t-zone" x="' + (xa + 6) + '" y="' + (pt - 7) + '">FORECAST</text>';
    }
    for (var g = 0; g <= 4; g++) { var gv = mn + (mx - mn) * g / 4, y = Y(gv); s += '<line x1="' + pl + '" x2="' + (w - pr) + '" y1="' + y + '" y2="' + y + '" stroke="' + C.lineSoft + '"/><text class="t-ax" x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + F(gv) + '</text>'; }
    var every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor((w - pl - pr) / 64))));
    months.forEach(function (m, i) { if (i % every === 0 || i === n - 1) s += '<text class="t-ax" x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(m) + '</text>'; });
    var ys = series.map(function (sr) { return sr.v.map(function (v) { return isNum(v) ? Y(v) : null; }); });
    series.forEach(function (sr, k) {
      var d = '', started = false, first = null, last = null;
      ys[k].forEach(function (y, i) { if (y == null) { started = false; return; } d += (started ? 'L' : 'M') + X(i).toFixed(1) + ' ' + y.toFixed(1); if (first == null) first = i; last = i; started = true; });
      if (k === 0 && !sr.dash && first != null) s += '<path d="' + d + 'L' + X(last).toFixed(1) + ' ' + Y(mn) + 'L' + X(first).toFixed(1) + ' ' + Y(mn) + 'Z" fill="' + sr.c + '" fill-opacity=".10"/>';
      s += '<path d="' + d + '" fill="none" stroke="' + sr.c + '" stroke-width="' + (sr.w || 2.4) + '" stroke-linejoin="round" stroke-linecap="round"' + (sr.dash ? ' stroke-dasharray="6 5"' : '') + '/>';
    });
    s += '<line class="xh" x1="0" x2="0" y1="' + pt + '" y2="' + (H - pb) + '" stroke="' + C.slate + '" stroke-width="1" stroke-dasharray="3 3" style="display:none"/>';
    series.forEach(function (sr, k) { s += '<circle class="hd" data-k="' + k + '" r="4.5" fill="' + sr.c + '" stroke="#ffffff" stroke-width="2" style="display:none"/>'; });
    s += '<rect class="hit" x="' + pl + '" y="' + pt + '" width="' + (w - pl - pr) + '" height="' + (H - pt - pb) + '" fill="transparent"/></svg>';
    el.__g = { type: 'line', xs: months.map(function (m, i) { return X(i); }), ys: ys, sp: sp, idx: null };
    return s;
  }
  function placeTip(tip, e) {
    tip.style.display = 'block';
    var tw = tip.offsetWidth, th = tip.offsetHeight, x = e.clientX + 16, y = e.clientY + 16;
    if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 16;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - 16;
    tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px';
  }
  function clearHover() {
    var tip = $('tip'); if (tip) tip.style.display = 'none';
    if (!hoverEl) return;
    var els = hoverEl.querySelectorAll('.xh,.hd,.hb'); for (var i = 0; i < els.length; i++) els[i].style.display = 'none';
    if (hoverEl.__g) hoverEl.__g.idx = null; hoverEl = null;
  }
  function chartHover(ch, e, tip) {
    var g = ch.__g, svg = ch.querySelector('svg'); if (!g || !svg) return clearHover();
    if (hoverEl && hoverEl !== ch) clearHover();
    var r = svg.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, sp = g.sp, html;
    if (g.type === 'line') {
      var best = 0; for (var i = 1; i < g.xs.length; i++) if (Math.abs(g.xs[i] - x) < Math.abs(g.xs[best] - x)) best = i;
      g.idx = best; var m = sp.months[best], xh = ch.querySelector('.xh');
      if (xh) { xh.setAttribute('x1', g.xs[best]); xh.setAttribute('x2', g.xs[best]); xh.style.display = ''; }
      var dots = ch.querySelectorAll('.hd'); for (var k = 0; k < dots.length; k++) { var yy = g.ys[k][best]; if (yy == null) { dots[k].style.display = 'none'; continue; } dots[k].setAttribute('cx', g.xs[best]); dots[k].setAttribute('cy', yy); dots[k].style.display = ''; }
      var F = sp.fmt || mf;
      html = '<div class="tt-h"><b>' + esc(m) + '</b><span class="tag2">' + (isAct(m) ? 'Actual' : 'Forecast') + '</span></div>' + sp.series.map(function (sr) { var v = sr.v[best]; return '<div class="tt-r"><i style="background:' + sr.c + '"></i><span>' + esc(sr.name) + '</span><b>' + (isNum(v) ? F(v) : DASH) + '</b></div>'; }).join('') + (sp.key ? '<div class="tt-f">Click for how it’s worked out</div>' : '');
    } else {
      var i2 = Math.floor((y - g.pt) / g.rh); if (i2 < 0 || i2 >= g.n) return clearHover();
      g.idx = i2; var row = sp.rows[i2], hb = ch.querySelector('.hb');
      if (hb) { hb.setAttribute('y', g.pt + i2 * g.rh); hb.style.display = ''; }
      var mg = isNum(row.a) && isNum(row.b) && row.a && sp.la === 'Revenue' ? '<div class="tt-r"><i></i><span>Margin</span><b>' + pct(row.b / row.a) + '</b></div>' : '';
      html = '<div class="tt-h"><b>' + esc(row.label) + '</b></div><div class="tt-r"><i style="background:' + sp.ca + '"></i><span>' + esc(sp.la) + '</span><b>' + mf(row.a) + '</b></div><div class="tt-r"><i style="background:' + sp.cb + '"></i><span>' + esc(sp.lb) + '</span><b>' + mf(row.b) + '</b></div>' + mg + (changed() && isNum(row.base) ? '<div class="tt-r"><i class="ring"></i><span>Before your change</span><b>' + mf(row.base) + '</b></div>' : '') + '<div class="tt-f">Click for how it’s worked out</div>';
    }
    hoverEl = ch; tip.innerHTML = html; placeTip(tip, e);
  }
  function chartClick(ch) {
    var g = ch.__g, sp = g.sp; if (g.idx == null) return false;
    if (g.type === 'line') { if (!sp.key) return false; openEx(sp.key, sp.ctx || {}, false); return true; }
    var row = sp.rows[g.idx]; openEx(sp.keyB, row.c || {}, false); return true;
  }
  function miniRows(rows, fmt) {
    var mx = 0; rows.forEach(function (r) { if (isNum(r[1])) mx = Math.max(mx, Math.abs(r[1])); }); mx = mx || 1;
    return '<div class="mrows">' + rows.map(function (r) { var w = isNum(r[1]) ? Math.round(Math.abs(r[1]) / mx * 100) : 0; return '<div class="mr"><span>' + esc(r[0]) + '</span><i style="width:' + w + '%;background:' + (r[1] < 0 ? C.coral : /actual/.test(r[0]) ? C.cloud : C.blue) + '"></i><b>' + (fmt === 'rate2' ? (isNum(r[1]) ? GBP + r[1].toFixed(2) : DASH) : mf(r[1])) + '</b></div>'; }).join('') + '</div>';
  }

  // ---------- render ----------
  function ex(key, c, text, cls) { return '<button class="ex ' + (cls || '') + '"' + dattr(key, c) + '>' + text + '</button>'; }
  function kpi(key, label, val, sub2, d, col) { return '<button class="kpi"' + dattr(key) + ' style="--k:' + (col || C.blue) + '"><span class="kl">' + label + '</span><span class="kv">' + val + '</span><span class="ks">' + (sub2 ? '<span>' + sub2 + '</span>' : '') + (d || '') + '</span></button>'; }
  function header() {
    return '<header class="top"><div class="brand">' + IC.logo + '<span class="wm">Reconomy</span><span class="sep"></span><span class="ttl">November forecast cockpit</span></div>' +
      '<div class="meta"><span class="pill">Forecast Nov 26</span><span class="pill ghost">Actuals to Oct 26</span><span class="pill ghost">Next 12 months: Nov 26 to Oct 27</span><span class="pill ghost">Illustrative data</span></div>' +
      '<div class="acts"><button class="btn ghost" id="resetBtn" title="Write every value you changed back to the starting forecast">' + IC.reset + 'Reset</button><button class="btn go" id="guideBtn">' + IC.guide + 'Guide</button></div></header>';
  }
  function kpiStrip() {
    var b = S.base || {}, rev = grp('Revenue'), eb = grp('Adjusted EBITDA'), cs = csTot(), ms = msTot();
    return '<section class="kpis" id="kpis">' + kpi('grev', 'Group revenue, next 12 months', mf(rev), 'Nov 26 to Oct 27', delta(rev, b.grev), C.navy) +
      kpi('gebitda', 'Adjusted EBITDA, next 12 months', mf(eb), pct(div(eb, rev)) + ' margin', delta(eb, b.geb), C.blue) +
      kpi('csgp', 'Compliance gross profit', mf(cs.gp), pct(div(cs.gp, cs.rev)) + ' margin', delta(cs.gp, b.csgp), C.green) +
      kpi('msgp', 'UK managed services gross profit', mf(ms.gp), pct(div(ms.gp, ms.rev)) + ' margin', delta(ms.gp, b.msgp), C.teal) + '</section>';
  }
  var STEPS = [['Compliance schemes', 'One driver library'], ['UK managed services', 'Lifts, tonnes, pass-through'], ['Group forecast', 'One P&L in pounds'], ['Sign-off', 'Every business, every stage']];
  var ST_LINE = { 'Not started': 'Not started yet', 'In progress': 'Being worked on, not submitted', 'Submitted': 'Submitted, waiting for the group to review', 'Returned': 'Sent back by the group to fix', 'Approved': 'Approved by the group' };
  function canSubmit(w) { return w === 'Not started' || w === 'In progress' || w === 'Returned'; }
  function wfc(e, st) { return (S.wfc[e] || {})[st] || {}; }
  function stShort(st) { return String(st || '').replace(/^\d+\s*/, ''); }
  function inkOn(w) { return w === 'In progress' || w === 'Not started' ? C.ink : '#ffffff'; }
  function chip(w, label) { return '<span class="chip" style="background:' + (ST_COL[w] || C.cloud) + ';color:' + inkOn(w) + '">' + esc(label || w) + '</span>'; }
  function names(a) { return a.length <= 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function stageInfo(n) {
    var st = S.stages[n - 1], ents = [], c = { todo: 0, ret: 0, rev: 0, ok: 0 };
    if (!st) return { st: null, ents: ents, done: 0, total: 0, todo: 0, ret: 0, rev: 0, ok: 0 };
    S.wfEnts.slice().sort(function (a, b) { return S.ents.indexOf(a) - S.ents.indexOf(b); }).forEach(function (e) {
      var w = (S.wfs[e] || {})[st]; if (!w) return;
      ents.push({ e: e, w: w });
      if (w === 'Returned') c.ret++;
      if (canSubmit(w)) c.todo++; else if (w === 'Approved') c.ok++; else c.rev++;
    });
    return { st: st, ents: ents, done: c.ok + c.rev, total: ents.length, todo: c.todo, ret: c.ret, rev: c.rev, ok: c.ok };
  }
  function roundInfo() { var all = 0, ok = 0, ret = 0, prog = 0; S.stages.forEach(function (st, i) { stageInfo(i + 1).ents.forEach(function (x) { all++; prog += ST_PROG[x.w] || 0; if (x.w === 'Approved') ok++; if (x.w === 'Returned') ret++; }); }); return { all: all, ok: ok, ret: ret, pct: all ? prog / all : null }; }
  function stepDone(n) { if (!S.loaded.dsWFS) return false; if (n === 4) { var r = roundInfo(); return r.all > 0 && r.ok === r.all; } var x = stageInfo(n); return x.total > 0 && x.done === x.total; }
  // One plain line naming the businesses that have to act on a step
  function stageLine(x) {
    var by = function (f) { return x.ents.filter(f).map(function (i) { return i.e; }); };
    var ret = by(function (i) { return i.w === 'Returned'; }), todo = by(function (i) { return i.w === 'Not started' || i.w === 'In progress'; }), rev = by(function (i) { return i.w === 'Submitted'; });
    if (ret.length) return { t: names(ret) + ' returned' + (todo.length ? ', ' + names(todo) + ' to submit' : ''), k: 'bad' };
    if (todo.length) return { t: names(todo) + ' to submit', k: 'todo' };
    if (rev.length) return { t: names(rev) + ' waiting for review', k: 'rev' };
    return { t: 'All approved', k: 'ok' };
  }
  function dots(x) { return '<span class="sdots">' + x.ents.map(function (i) { return '<i style="background:' + (ST_COL[i.w] || C.cloud) + '" title="' + esc(i.e + ': ' + i.w) + '"></i>'; }).join('') + '</span>'; }
  function stepSub(n) {
    if (!S.loaded.dsWFS) return esc(STEPS[n - 1][1]);
    if (n === 4) { var r = roundInfo(); return r.ok + ' of ' + r.all + ' approved' + (r.ret ? ' · <span class="sr">' + r.ret + ' returned</span>' : ''); }
    var x = stageInfo(n); if (!x.total) return esc(STEPS[n - 1][1]);
    var l = stageLine(x); return dots(x) + '<span' + (l.k === 'bad' ? ' class="sr"' : '') + '>' + esc(l.t) + '</span>';
  }
  function rail() {
    return '<nav class="stepper" id="rail">' + STEPS.map(function (x, i) {
      var n = i + 1, on = S.step === n, done = stepDone(n), warn = !done && n <= 3 && S.loaded.dsWFS && stageInfo(n).ret > 0;
      return (i ? '<span class="sline' + (stepDone(i) ? ' done' : '') + '"></span>' : '') + '<button class="stp' + (on ? ' on' : '') + (done ? ' done' : '') + (warn ? ' warn' : '') + '" data-step="' + n + '"><span class="n">' + (done ? IC.check : warn ? '!' : n) + '</span><span class="sl"><b>' + x[0] + '</b><small>' + stepSub(n) + '</small></span></button>';
    }).join('') + '</nav>';
  }
  function panelHead(n, title, lead) { return '<div class="ph"><div class="eyebrow">Step ' + n + ' of 4</div><h2>' + title + '</h2><p>' + lead + '</p></div>' + (n <= 3 ? stageStrip(n) : ''); }
  // Who has signed off this step, and why anything came back
  function stageStrip(n) {
    if (!S.loaded.dsWFS) return '';
    var x = stageInfo(n); if (!x.total) return '';
    var l = stageLine(x);
    var cards = x.ents.map(function (i) {
      var cm = wfc(i.e, x.st);
      return '<div class="wfe" style="--c:' + (ST_COL[i.w] || C.cloud) + '"><div class="wfeh"><b>' + esc(i.e) + '</b>' + chip(i.w) + '</div><div class="wfes">' + esc(ST_LINE[i.w] || '') + '</div>' + (cm.o ? '<small>Owner: ' + esc(cm.o) + '</small>' : '') + '</div>';
    }).join('');
    var rets = x.ents.filter(function (i) { return i.w === 'Returned'; }).map(function (i) {
      var cm = wfc(i.e, x.st);
      return '<div class="retbox"><span class="ri">!</span><div class="rt"><b>' + esc(i.e) + ' was returned by the group</b><p>' + esc(cm.r || 'No reason has been added yet. It goes in Return reason on the workflow tracker.') + '</p>' +
        (cm.c ? '<small>' + esc(i.e) + '’s note when it submitted: ' + esc(cm.c) + '</small>' : '') + '</div><button class="btn primary sm" data-submit="' + n + '" data-only="' + esc(i.e) + '">Fix and resubmit</button></div>';
    }).join('');
    return '<div class="card wfs" id="t-wfs"><div class="ch"><h3>Sign-off for this step</h3><span class="wfl ' + l.k + '">' + esc(l.t) + '</span></div><div class="wfg">' + cards + '</div>' + rets + '</div>';
  }
  // The action bar along the bottom: who stands where on the left, the actions on the right
  function stepNav(n) {
    var x = n <= 3 ? stageInfo(n) : null, left = '';
    if (x && x.total) left = x.ents.map(function (i) { return '<span class="abp"><i style="background:' + (ST_COL[i.w] || C.cloud) + '"></i><b>' + esc(i.e) + '</b>' + esc(i.w.toLowerCase()) + '</span>'; }).join('');
    else if (n === 4 && S.loaded.dsWFS) { var r = roundInfo(); left = '<span class="abp"><i style="background:' + C.green + '"></i><b>' + r.ok + ' of ' + r.all + '</b>approved</span>' + (r.ret ? '<span class="abp"><i style="background:' + C.coral + '"></i><b>' + r.ret + '</b>returned</span>' : '') + '<span class="abp"><b>' + pct(r.pct, 0) + '</b>round progress</span>'; }
    var back = n > 1 ? '<button class="btn sec" data-step="' + (n - 1) + '">← ' + STEPS[n - 2][0] + '</button>' : '';
    var sub2 = x && x.total ? (x.todo ? '<button class="btn sec" data-submit="' + n + '">Submit step<span class="cnt">' + x.todo + '</span></button>' : '<span class="abok">' + IC.check + 'All submitted</span>') : '';
    var next = n < 4 ? '<button class="btn primary" data-next="' + (n + 1) + '">Next: ' + STEPS[n][0] + ' →</button>' : '<button class="btn sec" id="resetBtn2">' + IC.reset + 'Back to the starting forecast</button>';
    return '<footer class="abar" id="abar"><div class="abl"><span class="eyebrow">Step ' + n + ' of 4</span><div class="abs">' + left + '</div></div><div class="abr">' + back + sub2 + next + '</div></footer>';
  }
  var SUBN = ['compliance schemes', 'UK managed services', 'the group forecast'];
  function openSubmit(n, goTo, only) {
    var x = stageInfo(n), sel = {};
    if (!x.todo) { if (goTo) setStep(goTo); return; }
    x.ents.forEach(function (it) { if (canSubmit(it.w) && (!only || it.e === only)) sel[it.e] = true; });
    S.submit = { n: n, go: goTo || null, sel: sel, note: '', err: null }; render();
    timer(function () { var nt = $('subNote'); if (nt) nt.focus(); }, 30);
  }
  var SUB_WHY = { 'Not started': 'Not started. Submit when the drivers are ready.', 'In progress': 'In progress. Ready to submit.', 'Returned': 'Returned by the group. Submitting sends your fix back for review.', 'Submitted': 'Already submitted. Waiting for the group to review it.', 'Approved': 'Approved. Nothing to submit.' };
  function submitModal() {
    if (!S.submit) return '';
    var n = S.submit.n, x = stageInfo(n), name = STEPS[n - 1][0], anyRet = false;
    var rows = x.ents.map(function (it) {
      var ok = canSubmit(it.w), on = ok && !!S.submit.sel[it.e], cm = wfc(it.e, x.st);
      if (on && it.w === 'Returned') anyRet = true;
      return '<label class="subrow' + (ok ? '' : ' dis') + (it.w === 'Returned' ? ' bad' : '') + '"><input type="checkbox" data-subsel="' + esc(it.e) + '"' + (on ? ' checked' : '') + (ok ? '' : ' disabled') + '><span class="se"><b>' + esc(it.e) + '</b><small>' + SUB_WHY[it.w] + '</small></span>' + chip(it.w) + '</label>' +
        (it.w === 'Returned' ? '<div class="subwhy"><b>Why it came back</b>' + esc(cm.r || 'No reason has been added yet.') + '</div>' : '');
    }).join('');
    return '<div class="scrim" id="subScrim"></div><div class="modal" role="dialog" aria-label="Submit this step"><div class="eyebrow">Step ' + n + ' of 4</div><h3>Submit ' + esc(SUBN[n - 1] || name) + '?</h3>' +
      '<p class="mlead">Tick the businesses to send to the group. They move to Submitted on the workflow tracker, with your comment.</p>' +
      '<div class="lbl">Businesses</div><div class="subl">' + rows + '</div>' +
      '<div class="lbl">' + (anyRet ? 'What did you change? The group reads this before approving' : 'Comment for the group (optional)') + '</div><textarea id="subNote" rows="3" placeholder="' + (anyRet ? 'For example: growth assumption rechecked against recent volumes and lowered' : 'For example: drivers reviewed and prices updated') + '">' + esc(S.submit.note || '') + '</textarea>' +
      (S.submit.err ? '<div class="merr">' + esc(S.submit.err) + '</div>' : '') +
      '<div class="mb"><button class="btn sec sm" id="subCancel">Cancel</button>' + (S.submit.go ? '<button class="btn sec sm" id="subSkip">Continue without submitting</button>' : '') +
      '<button class="btn primary sm" id="subSave">' + (S.submit.go ? 'Submit and continue' : 'Submit') + '</button></div></div>';
  }
  function saveSubmit() {
    var so = S.submit; if (!so) return;
    var nt = $('subNote'), note = nt ? nt.value.trim() : '', x = stageInfo(so.n), st = x.st, n = 0;
    if (nt) so.note = nt.value;
    var picks = x.ents.filter(function (it) { return so.sel[it.e] && canSubmit(it.w); });
    if (!picks.length) { so.err = 'Tick at least one business, or choose ' + (so.go ? 'Continue without submitting.' : 'Cancel.'); render(); return; }
    var rets = picks.filter(function (it) { return it.w === 'Returned'; }).map(function (it) { return it.e; });
    if (rets.length && !note) { so.err = 'Say what you changed for ' + names(rets) + ' before resubmitting. The group reads it before approving.'; render(); return; }
    S.submit = null;
    picks.forEach(function (it) {
      var coords = { entityList: it.e, stageList: st }, cm = wfc(it.e, st), wasC = cm.c || '';
      (S.wfs[it.e] = S.wfs[it.e] || {})[st] = 'Submitted';
      write('statusSink', coords, 'Submitted', 'Status for ' + it.e + ', ' + st, it.w, 'Submitted', true);
      if (note && note !== wasC) { cm.c = note; (S.wfc[it.e] = S.wfc[it.e] || {})[st] = cm; write('commentSink', coords, note, 'Note for ' + it.e + ', ' + st, wasC, '"' + note + '"', true); }
      n++;
    });
    toast('ok', 'Submitted ' + (SUBN[so.n - 1] || STEPS[so.n - 1][0]) + ' for ' + names(picks.map(function (it) { return it.e; })) + '. The group can now review ' + (n > 1 ? 'them' : 'it') + ' on the workflow tracker.');
    if (so.go) setStep(so.go); else render();
  }
  function stepper(id, val, shown, d) { return '<div class="nstep"><button data-stp="' + id + '" data-d="' + (-d) + '" aria-label="Decrease">−</button><input class="inp" data-in="' + id + '" value="' + esc(shown) + '"><button data-stp="' + id + '" data-d="' + d + '" aria-label="Increase">+</button></div>'; }
  function loadingCard(t) { return '<div class="card"><div class="loading sm"><div class="spin"></div>' + t + '</div></div>'; }

  function p1() {
    var prn = csLine(PRN.s, PRN.l), nov = csLine(NOV.s, NOV.l), b = S.base || { sch: {} };
    var lev1 = card('lev1', 'Plastic PRN cost per tonne, Valpak packaging', '<div class="lrow">' + stepper('prn', prn.cost, isNum(prn.cost) ? prn.cost.toFixed(0) : '', 50) + '<button class="seg" data-quick="prn">Spike to ' + GBP + '650</button></div>' +
      '<div class="kv2">' + ex('linerev', PRN, 'Line revenue ' + mf(prn.rev)) + ' · ' + ex('linegp', PRN, 'gross profit ' + mf(prn.gp)) + '</div><div class="hint">Cost plus fee: the PRN cost is passed through to members.</div>', { domId: 't-cslev', tag: 'input' });
    var lev2 = card('lev2', 'Noventiz dual system: sorting cost change in January', '<div class="lrow">' + stepper('nov', nov.cchg, isNum(nov.cchg) ? (nov.cchg * 100).toFixed(0) : '', 1) + '<span class="unit">%</span><button class="seg" data-quick="nov">Set to 12%</button></div>' +
      '<div class="kv2">' + ex('linerev', NOV, 'Line revenue ' + mf(nov.rev)) + ' · ' + ex('linegp', NOV, 'gross profit ' + mf(nov.gp)) + '</div><div class="hint">Fixed price: a cost rise comes straight off margin.</div>', { domId: 't-csnov', tag: 'input' });
    var bars = S.schemes.map(function (s) { var o = schTot(s); return { label: s, a: o.rev, b: o.gp, base: (b.sch[s] || {}).gp, c: { s: s } }; });
    var chart = card('c1', 'Revenue and gross profit by scheme, next 12 months', hbars(bars, 'Revenue', 'Gross profit', C.cloud, C.navy, 'schrev', 'schgp'), { chart: true });
    var s = S.selScheme, cu = curOf(s), lines = Object.keys(S.cs[s] || {});
    var opts = S.schemes.map(function (x) { return '<option' + (x === s ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('');
    var rows = lines.map(function (l) {
      var o = csLine(s, l), c = { s: s, l: l }, cp = isCostPlus(s, l);
      return '<tr><td><b>' + ex('linerev', c, esc(l)) + '</b></td><td>' + ex('basis', c, '<span class="bt ' + (cp ? 'cp' : 'fp') + '">' + esc(S.basis[s + '|' + l] || (cp ? 'Cost plus fee' : 'Fixed price')) + '</span>') + '</td>' +
        '<td class="num">' + ex('vol', c, num(o.vol)) + '</td>' +
        '<td class="num"><input class="inp sm" data-cs="price" data-s="' + esc(s) + '" data-l="' + esc(l) + '" value="' + (isNum(o.price) ? o.price : '') + '"></td>' +
        '<td class="num"><input class="inp sm" data-cs="cost" data-s="' + esc(s) + '" data-l="' + esc(l) + '" value="' + (isNum(o.cost) ? o.cost : '') + '"></td>' +
        '<td class="num"><input class="inp xs" data-cs="pchg" data-s="' + esc(s) + '" data-l="' + esc(l) + '" value="' + (isNum(o.pchg) ? (o.pchg * 100).toFixed(1) : '') + '"><span class="pc">%</span></td>' +
        '<td class="num"><input class="inp xs" data-cs="cchg" data-s="' + esc(s) + '" data-l="' + esc(l) + '" value="' + (isNum(o.cchg) ? (o.cchg * 100).toFixed(1) : '') + '"><span class="pc">%</span></td>' +
        '<td class="num">' + ex('linerev', c, mf(o.rev), 'strong') + '</td><td class="num">' + ex('linegp', c, mf(o.gp), 'strong') + '</td><td class="num">' + ex('linegp', c, '<span class="chip" style="background:' + mcol(div(o.gp, o.rev)) + '">' + pct(div(o.gp, o.rev)) + '</span>') + '</td></tr>';
    }).join('');
    var st = schTot(s);
    var table = '<div class="card" id="t-lines"><div class="ch"><h3>Scheme drivers</h3><select id="selScheme">' + opts + '</select><span class="tag in">amber = input, in ' + (cu === GBP ? 'pounds' : 'euros') + '</span></div><div class="tw"><table class="tb"><thead><tr><th>Revenue line</th><th>Pricing basis</th><th>Volume a month</th><th>Price or fee</th><th>Cost per unit</th><th>Price change Jan</th><th>Cost change Jan</th><th>Revenue next 12m</th><th>Gross profit next 12m</th><th>Margin</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td><b>' + esc(s) + '</b></td><td></td><td></td><td></td><td></td><td></td><td></td><td class="num">' + ex('schrev', { s: s }, mf(st.rev), 'strong') + '</td><td class="num">' + ex('schgp', { s: s }, mf(st.gp), 'strong') + '</td><td class="num">' + pct(div(st.gp, st.rev)) + '</td></tr></tbody></table></div></div>';
    var mon = S.loaded.dsCSM ? card('c2', 'Compliance revenue and gross profit by month', lineChart(VIEW, [{ name: 'Revenue', v: VIEW.map(function (m) { return csMonth(m).rev; }), c: C.cloud, key: 'csrev' }, { name: 'Gross profit', v: VIEW.map(function (m) { return csMonth(m).gp; }), c: C.navy, key: 'csgp' }].concat(changed() && S.baseM.csm ? [{ name: 'Gross profit before your change', v: VIEW.map(function (m) { return S.baseM.csm[m]; }), c: C.slate, dash: true, w: 1.5 }] : [])), { chart: true }) : loadingCard('Loading months' + ELL);
    return '<section class="panel">' + panelHead(1, 'Compliance schemes: one driver library', 'Every Valpak, Noventiz and RLG scheme picks its revenue lines from one library. Each line is volume x rate, either at a fixed price or at cost plus a fee, with January tariff changes and FX to pounds.') +
      '<div class="grid2"><div>' + lev1 + lev2 + '</div>' + chart + '</div>' + table + mon + '</section>';
  }
  function mcol(m) { if (!isNum(m)) return '#cbd5e1'; if (m >= 0.3) return C.pine; if (m >= 0.15) return C.jade; if (m >= 0.08) return C.amber; return C.coral; }

  function p2() {
    if (!S.loaded.dsMSM) return '<section class="panel">' + panelHead(2, 'UK managed services', 'Loading' + ELL) + loadingCard('Loading UK managed services' + ELL) + '</section>';
    var apr = S.msm['Apr 27'] || {}, b = S.base || { sec: {} }, mt = msTot();
    var haul = [0, 0.03, 0.05, 0.08].map(function (v) { return '<button class="seg' + (isNum(S.haul) && Math.abs(S.haul - v) < 1e-6 ? ' on' : '') + '" data-haul="' + v + '">' + (v * 100).toFixed(0) + '%</button>'; }).join('');
    var lev = card('lev3', 'Cost pressures', '<div class="lt2">' + ex('ltax', {}, 'Landfill tax per tonne from April 2027') + '</div><div class="lrow">' + stepper('ltax', apr.ltin, isNum(apr.ltin) ? apr.ltin.toFixed(2) : '130.75', 5) + '<button class="seg" data-quick="ltax">' + GBP + '140 from April</button></div><div class="hint">Today’s prices include ' + GBP + '130.75 a tonne.</div>' +
      '<div class="lt2" style="margin-top:12px">' + ex('haul', {}, 'Haulier rate increase from January 2027') + '</div><div class="segs">' + haul + '</div>' +
      '<div class="kv2" style="margin-top:12px">' + ex('msrev', {}, 'Cost increase ' + mf(mt.inc)) + ' · passed on ' + mf(mt.rec) + ' · absorbed ' + mf(isNum(mt.inc) && isNum(mt.rec) ? mt.inc - mt.rec : null) + '</div>', { domId: 't-mslev', tag: 'input' });
    var bars = S.sectors.map(function (k) { var o = S.ms[k]; return { label: k, a: o.inc, b: o.rec, base: (b.sec[k] || {}).rec, c: { sec: k } }; });
    var chart = card('c3', 'Cost increase and amount passed on by sector, next 12 months', hbars(bars, 'Cost increase', 'Passed on', C.coral, C.jade, 'secinc', 'secrec'), { chart: true });
    var rows = S.sectors.map(function (k) {
      var o = S.ms[k], c = { sec: k };
      return '<tr><td><b>' + ex('secgp', c, esc(k)) + '</b></td><td class="num"><input class="inp xs" data-pass="' + esc(k) + '" value="' + (isNum(o.pass) ? (o.pass * 100).toFixed(0) : '') + '"><span class="pc">%</span></td><td class="num">' + mf(o.rev) + '</td><td class="num">' + ex('secgp', c, mf(o.gp), 'strong') + '</td><td class="num"><span class="chip" style="background:' + mcol(div(o.gp, o.rev)) + '">' + pct(div(o.gp, o.rev)) + '</span></td>' +
        '<td class="num">' + ex('secinc', c, mf(o.inc)) + '</td><td class="num">' + ex('secrec', c, mf(o.rec)) + '</td><td class="num neg">' + mf(isNum(o.inc) && isNum(o.rec) ? o.inc - o.rec : null) + '</td></tr>';
    }).join('');
    var table = '<div class="card" id="t-pass"><div class="ch"><h3>By sector, next 12 months</h3><span class="tag in">amber = pass-through input</span></div><div class="tw"><table class="tb"><thead><tr><th>Sector</th><th>Passed on</th><th>Revenue</th><th>Gross profit</th><th>Margin</th><th>Cost increase</th><th>Passed on</th><th>Absorbed</th></tr></thead><tbody>' + rows +
      '<tr class="tot"><td><b>UK managed services</b></td><td></td><td class="num">' + ex('msrev', {}, mf(mt.rev), 'strong') + '</td><td class="num">' + ex('msgp', {}, mf(mt.gp), 'strong') + '</td><td class="num">' + pct(div(mt.gp, mt.rev)) + '</td><td class="num">' + mf(mt.inc) + '</td><td class="num">' + mf(mt.rec) + '</td><td class="num neg">' + mf(isNum(mt.inc) && isNum(mt.rec) ? mt.inc - mt.rec : null) + '</td></tr></tbody></table></div></div>';
    var mon = card('c4', 'Gross profit by month, and landfill tax per tonne', lineChart(VIEW, [{ name: 'Gross profit', v: VIEW.map(function (m) { return (S.msm[m] || {}).gp; }), c: C.navy, key: 'msgp' }, { name: 'Cost increase', v: VIEW.map(function (m) { return (S.msm[m] || {}).inc; }), c: C.coral, key: 'msgp' }].concat(changed() && S.baseM.msm ? [{ name: 'Gross profit before your change', v: VIEW.map(function (m) { return S.baseM.msm[m]; }), c: C.slate, dash: true, w: 1.5 }] : [])) +
      '<div class="lt3">' + VIEW.filter(function (m) { return MKEY(m) >= MKEY('Jan 27'); }).map(function (m) { return '<span' + (m === 'Apr 27' ? ' class="hi"' : '') + '>' + m + ' ' + ex('ltax', {}, GBP + ((S.msm[m] || {}).lt || 0).toFixed(2)) + '</span>'; }).join('') + '</div>', { chart: true });
    return '<section class="panel">' + panelHead(2, 'UK managed services: lifts, tonnes and cost pass-through', 'Revenue is lifts x price per lift. Cost is haulage plus disposal, including landfill tax on tonnes sent to landfill. When haulier rates or landfill tax rise, each sector’s contracts pass part of the rise on to customers.') +
      '<div class="grid2">' + lev + chart + '</div><div class="grid2 r">' + table + mon + '</div></section>';
  }

  function p3() {
    if (!S.loaded.dsPLM || !S.loaded.dsFX) return '<section class="panel">' + panelHead(3, 'Group forecast', 'Loading' + ELL) + loadingCard('Loading the group P&L' + ELL) + '</section>';
    var b = S.base || { ent: {} };
    var fx = ['EUR', 'USD'].map(function (c) { return '<div class="lrow"><span class="lt">' + ex('fx', { cur: c }, c) + '</span>' + stepper('fx' + c, S.fx[c], isNum(S.fx[c]) ? S.fx[c].toFixed(4) : '', 0.01) + '<span class="unit">' + GBP + ' per ' + (c === 'EUR' ? EUR + '1' : '$1') + '</span></div>'; }).join('');
    var lev = card('lev4', 'Plan exchange rates', fx + '<button class="seg" data-quick="fx">Euro to 0.82</button><div class="hint">Noventiz, RLG and Cycleon report in euros; Recycle North America in dollars.</div>', { domId: 't-fx', tag: 'input' });
    var bars = S.ents.map(function (e) { return { label: e, a: entV(e, 'Gross profit'), b: entV(e, 'Adjusted EBITDA'), base: (b.ent[e] || {}).eb, c: { e: e } }; });
    var chart = card('c5', 'Gross profit and adjusted EBITDA by entity, next 12 months', hbars(bars, 'Gross profit', 'Adjusted EBITDA', C.cloud, C.blue, 'ent', 'ent'), { chart: true });
    var pl = '<table class="tb"><thead><tr><th>Line</th><th>Next 12 months</th><th>FY26 budget</th><th>FY26 forecast</th><th>Forecast vs budget</th></tr></thead><tbody>' + S.lines.map(function (l) {
      var f = plFY(V, l), bu = plFY(VB, l), d = isNum(f) && isNum(bu) ? f - bu : null;
      return '<tr class="' + (SUBTOTAL[l] ? 'tot' : '') + '"><td>' + ex('line', { line: l }, esc(l)) + '</td><td class="num">' + ex('line', { line: l }, mf(grp(l)), 'strong') + '</td><td class="num">' + mf(bu) + '</td><td class="num">' + mf(f) + '</td><td class="num">' + ex('fyvar', { line: l }, '<span class="' + (d < 0 ? 'neg' : 'pos') + '">' + signed(d) + '</span>') + '</td></tr>';
    }).join('') + '</tbody></table>';
    var plc = card('t3', 'Management P&L', '<div class="tw">' + pl + '</div><div class="hint">FY26 forecast is ten months of actuals plus November and December.</div>');
    var mon = card('c6', 'Adjusted EBITDA by month, forecast against budget', lineChart(PLM, [{ name: 'Adjusted EBITDA', v: PLM.map(function (m) { return plv(V, m, 'Adjusted EBITDA'); }), c: C.blue, key: 'gebitda' }, { name: 'Budget adjusted EBITDA', v: PLM.map(function (m) { return plv(VB, m, 'Adjusted EBITDA'); }), c: C.amber, dash: true, w: 1.5 }]), { chart: true });
    var et = '<table class="tb"><thead><tr><th>Entity</th><th>Revenue</th><th>Gross profit</th><th>Adjusted EBITDA</th><th>EBITDA margin</th></tr></thead><tbody>' + S.ents.map(function (e) {
      var c = { e: e }, r = entV(e, 'Revenue'), x = entV(e, 'Adjusted EBITDA');
      return '<tr><td><b>' + ex('ent', c, esc(e)) + '</b></td><td class="num">' + mf(r) + '</td><td class="num">' + mf(entV(e, 'Gross profit')) + '</td><td class="num">' + ex('ent', c, mf(x), 'strong') + delta(x, (b.ent[e] || {}).eb) + '</td><td class="num">' + pct(div(x, r)) + '</td></tr>';
    }).join('') + '</tbody></table>';
    return '<section class="panel">' + panelHead(3, 'Group forecast: one management P&L in pounds', 'Both engines feed revenue and direct cost for their entities. Top-down businesses grow a three-month run rate. Overheads grow from their run rate. Everything converts to pounds at the plan rate.') +
      '<div class="grid2">' + lev + chart + '</div><div class="grid2 r">' + plc + mon + '</div>' + card('t4', 'Contribution by entity, next 12 months', '<div class="tw">' + et + '</div>') + '</section>';
  }

  var ARROW = '<svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h18M14 1l5 5-5 5" fill="none" stroke="' + C.cloud + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LOOP = '<svg width="44" height="34" viewBox="0 0 44 34" aria-hidden="true"><path d="M42 26H10V5M4 11l6-6 6 6" fill="none" stroke="' + C.coral + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var FLOW = [['Not started', 'Waiting for the business'], ['In progress', 'The business is working on it'], ['Submitted', 'Waiting for the group to review'], ['Approved', 'Signed off by the group']];
  function flowItems(list, ret) { return list.length ? list.map(function (i) { var cm = wfc(i.e, i.st); return '<button class="fli" data-sign="' + esc(i.e) + '|' + esc(i.st) + '"><b>' + esc(i.e) + '</b><span>' + esc(stShort(i.st)) + '</span>' + (ret ? '<em>' + esc(cm.r || 'No reason added yet') + '</em>' : '') + '</button>'; }).join('') : '<div class="fle">None</div>'; }
  function flowCol(w, sub2, list, ret) { return '<div class="flc' + (ret ? ' bad' : '') + '" style="--c:' + ST_COL[w] + '"><div class="flh"><span class="fln" style="color:' + inkOn(w) + '">' + list.length + '</span><div><b>' + w + '</b><small>' + sub2 + '</small></div></div><div class="fls">' + flowItems(list, ret) + '</div></div>'; }
  function flowCard(by, n, tot) {
    var order = ['Approved', 'Submitted', 'In progress', 'Returned', 'Not started'];
    var seg = order.map(function (w) { var k = (by[w] || []).length; return k ? '<i style="flex:' + k + ';background:' + ST_COL[w] + '" title="' + w + ': ' + k + '"></i>' : ''; }).join('');
    var leg = order.map(function (w) { return '<span><i style="background:' + ST_COL[w] + '"></i>' + w + ' <b>' + (by[w] || []).length + '</b></span>'; }).join('');
    var cols = FLOW.map(function (f, i) { return (i ? '<div class="fla">' + ARROW + '</div>' : '') + flowCol(f[0], f[1], by[f[0]] || []); }).join('');
    return '<div class="card" id="t-flow"><div class="ch"><h3>Where the round is: ' + n + ' sign-offs</h3><span class="wp">Round progress <b>' + pct(n ? tot / n : null, 0) + '</b></span></div>' +
      '<div class="pbar">' + seg + '</div><div class="legend">' + leg + '</div>' +
      '<div class="flow">' + cols + '</div>' +
      '<div class="flow flr"><div class="flrl">' + LOOP + '<span>Sent back to the business to fix, then submitted again</span></div>' + flowCol('Returned', 'The group sent it back with a reason', by.Returned || [], true) + '</div></div>';
  }
  function p4() {
    if (!S.loaded.dsWFS) return '<section class="panel">' + panelHead(4, 'Sign-off', 'Loading' + ELL) + loadingCard('Loading sign-off status' + ELL) + '</section>';
    var ents = S.wfEnts.slice().sort(function (a, b) { return S.ents.indexOf(a) - S.ents.indexOf(b); }), by = {}, tot = 0, n = 0;
    STATUSES.forEach(function (x) { by[x] = []; });
    var rows = ents.map(function (e) {
      return '<tr><td><b>' + esc(e) + '</b></td>' + S.stages.map(function (st) {
        var w = (S.wfs[e] || {})[st]; if (!w) return '<td class="na">' + DASH + '</td>';
        (by[w] = by[w] || []).push({ e: e, st: st }); tot += ST_PROG[w] || 0; n++;
        var cm = wfc(e, st), txt = w === 'Returned' ? '<small class="rr">Why: ' + esc(cm.r || 'no reason added yet') + '</small>' : (cm.c ? '<small>' + esc(cm.c) + '</small>' : '');
        return '<td><button class="sgn" data-sign="' + esc(e) + '|' + esc(st) + '">' + chip(w) + txt + '</button></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<section class="panel">' + panelHead(4, 'Sign-off: every business, every stage', 'Each business submits its drivers, the group reviews them, and each stage is approved or returned with a reason. Click any business to review it; the tracker board updates at once.') +
      flowCard(by, n, tot) +
      '<div class="card" id="t-wf"><div class="ch"><h3>By business and stage</h3></div><div class="tw"><table class="tb wf"><thead><tr><th>Business</th>' + S.stages.map(function (st) { return '<th>' + esc(st) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></div></section>';
  }
  function keepSoNote() { var so = S.signoff, nt = $('soNote'); if (!so || !nt) return; if (nt.getAttribute('data-k') === 'r') so.rNote = nt.value; else so.cNote = nt.value; }
  function signoffModal() {
    if (!S.signoff) return '';
    var so = S.signoff, e = so.e, st = so.st, w = so.w, cm = wfc(e, st), was = (S.wfs[e] || {})[st] || 'Not started';
    var box = w === 'Returned' ? '<div class="lbl">Why are you returning it? ' + esc(e) + ' sees this on its step</div><textarea id="soNote" data-k="r" rows="3" placeholder="For example: the growth assumption looks high against recent volumes. Please recheck it.">' + esc(so.rNote != null ? so.rNote : (cm.r || '')) + '</textarea>'
      : w === 'Approved' ? '<p class="mlead sop">Approving signs this stage off for ' + esc(e) + '. It cannot be resubmitted after that.</p>'
      : '<div class="lbl">Note</div><textarea id="soNote" data-k="c" rows="3" placeholder="For example: drivers reviewed with the finance manager">' + esc(so.cNote != null ? so.cNote : (cm.c || '')) + '</textarea>';
    return '<div class="scrim" id="soScrim"></div><div class="modal" role="dialog" aria-label="Review and sign off"><div class="eyebrow">Review and sign off</div><h3>' + esc(e) + ' · ' + esc(stShort(st)) + '</h3>' +
      '<div class="sonow"><span>Now</span>' + chip(was) + (cm.o ? '<span>Owner: ' + esc(cm.o) + '</span>' : '') + '</div>' +
      (cm.c ? '<div class="bnote"><b>' + esc(e) + '’s note</b>' + esc(cm.c) + '</div>' : '') +
      (was === 'Returned' && cm.r && w !== 'Returned' ? '<div class="subwhy"><b>Returned because</b>' + esc(cm.r) + '</div>' : '') +
      '<div class="lbl">Set the status to</div><div class="segs">' + STATUSES.map(function (x) { return '<button class="seg' + (x === w ? ' on' : '') + '" data-sostat="' + x + '">' + x + '</button>'; }).join('') + '</div>' +
      box + (so.err ? '<div class="merr">' + esc(so.err) + '</div>' : '') +
      '<div class="mb"><button class="btn sec sm" id="soCancel">Cancel</button><button class="btn primary sm" id="soSave">' + (w === 'Returned' ? 'Return to ' + esc(e) : w === 'Approved' ? 'Approve' : 'Save') + '</button></div></div>';
  }

  function drawer() {
    if (!S.explain) return '';
    var x = EX(S.explain.key, S.explain.c); if (!x) return '';
    var parts = x.parts.map(function (p) { return '<button class="part"' + dattr(p.key, p.ctx) + '><span>' + esc(p.label) + '</span><b>' + esc(p.value) + '</b><i>›</i></button>'; }).join('');
    var ch = (x.change || []).map(function (k) { var l = LEVER[k]; return l ? '<button class="btn sm" data-goto="' + l[1] + '" data-focus="' + l[2] + '">Change ' + esc(l[0]) + '</button>' : ''; }).join('');
    return '<div class="scrim" id="scrim"></div><aside class="drawer" id="drawer" role="dialog" aria-label="' + esc(x.t) + '">' +
      '<div class="dh">' + (S.stack.length ? '<button class="btn sec sm" id="exBack">‹ Back</button>' : '<span></span>') + '<button class="btn sec sm" id="exClose">Close ✕</button></div>' +
      '<div class="dt2">' + esc(x.t) + '</div><div class="dv">' + esc(x.v) + '</div><p>' + esc(x.what) + '</p>' +
      '<div class="lbl">Formula</div><div class="fm">' + esc(x.f) + '</div>' + (x.live ? '<div class="lbl">With today’s numbers</div><div class="fm live">' + esc(x.live) + '</div>' : '') +
      (x.rows && x.rows.length ? '<div class="lbl">' + esc(x.rowsLabel || 'By month, read live from Pigment') + '</div>' + miniRows(x.rows, x.rowsFmt) : '') +
      (parts ? '<div class="lbl">The parts behind it</div>' + parts : '') + (ch ? '<div class="lbl">What changes it</div><div class="chg">' + ch + '</div>' : '') +
      '<div class="lbl">Where to change it on the boards</div><p class="where">' + esc(x.where) + '</p></aside>';
  }
  function expandModal() { if (!S.expand || !CH[S.expand]) return ''; return '<div class="scrim" id="xpScrim"></div><div class="xmodal"><div class="ch"><h3>' + (CHT[S.expand] || '') + '</h3><button class="btn sec sm" id="xpClose">Close</button></div><div class="chart" data-chart="' + S.expand + '" data-h="440"></div>' + CH[S.expand].legend + '</div>'; }
  function tourHtml() {
    if (S.tour < 0 || !TOUR[S.tour]) return '';
    var st = TOUR[S.tour], el = $(st.el), r = el ? el.getBoundingClientRect() : { left: 40, top: 40, width: 200, height: 60, bottom: 100 };
    var pad = 8, top = r.bottom + 14 > window.innerHeight - 220 ? Math.max(16, r.top - 230) : r.bottom + 14, left = Math.max(16, Math.min(window.innerWidth - 380, r.left));
    return '<div class="spot" style="left:' + (r.left - pad) + 'px;top:' + (r.top - pad) + 'px;width:' + (r.width + pad * 2) + 'px;height:' + (r.height + pad * 2) + 'px"></div>' +
      '<div class="tcard" style="left:' + left + 'px;top:' + Math.max(16, top) + 'px"><div class="tn">' + (S.tour + 1) + ' of ' + TOUR.length + '</div><div class="tt">' + esc(st.t) + '</div><p>' + esc(st.b) + '</p>' +
      '<div class="tbtn"><button class="btn ghost sm" id="tSkip">Skip</button><span>' + (S.tour > 0 ? '<button class="btn ghost sm" id="tBack">Back</button>' : '') + '<button class="btn sm" id="tNext">' + (S.tour === TOUR.length - 1 ? 'Done' : 'Next') + '</button></span></div></div>';
  }

  function render() {
    if (disposed) return;
    var main = $('main'), sc = main ? main.scrollTop : 0;
    var errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; });
    CH = {}; CHT = {}; chartSeq = 0; hoverEl = null;
    var body = !coreLoaded() ? '<div class="loading"><div class="spin"></div>Loading the November forecast from Pigment' + ELL + '</div>' : [p1, p2, p3, p4][S.step - 1]();
    root.innerHTML = '<div class="app">' + header() + rail() + (coreLoaded() ? kpiStrip() : '') + (errs.length ? '<div class="errs" id="errs">' + errs.map(esc).join('<br>') + '</div>' : '') +
      '<main id="main">' + (coreLoaded() ? '<div class="insight" id="answer"><span class="ic">' + IC.info + '</span><p>' + answer() + '</p></div>' : '') + body + '</main>' + (coreLoaded() ? stepNav(S.step) : '') +
      (S.busy || S.recalc ? '<div class="busy"><span class="spin sm"></span>' + esc(S.busy || 'Recalculating in Pigment' + ELL) + '</div>' : '') +
      (S.toast ? '<div class="toast ' + S.toast.kind + '">' + esc(S.toast.text) + '</div>' : '') + drawer() + signoffModal() + submitModal() + expandModal() + '</div><div id="tip" class="tip"></div><div id="tourL"></div>';
    drawCharts();
    var m2 = $('main'); if (m2) m2.scrollTop = sc;
    if (S.tour >= 0) $('tourL').innerHTML = tourHtml();
  }

  // ---------- events ----------
  function setStep(n, focus) {
    S.step = n; S.visited[n] = true; stepData(n); render(); var mn = $('main'); if (mn) mn.scrollTop = 0;
    if (focus) timer(function () { var fe = $(focus); if (fe) { fe.scrollIntoView && fe.scrollIntoView({ block: 'center' }); fe.classList.add('flash'); timer(function () { fe.classList.remove('flash'); }, 1600); } }, 60);
  }
  function ctxOf(t) { var c = {}; ['s', 'l', 'sec', 'e', 'line', 'cur', 'st'].forEach(function (k) { var v = t.getAttribute('data-c' + k); if (v != null) c[k] = v; }); return c; }
  function openEx(key, c, push) { if (push && S.explain) S.stack.push(S.explain); else if (!push) S.stack = []; S.explain = { key: key, c: c }; render(); }
  function parseNum(s) { var v = parseFloat(String(s).replace(/[^0-9.\-]/g, '')); return isFinite(v) ? v : null; }
  function stepVal(id) { return id === 'prn' ? csLine(PRN.s, PRN.l).cost : id === 'nov' ? (csLine(NOV.s, NOV.l).cchg || 0) * 100 : id === 'ltax' ? ((S.msm['Apr 27'] || {}).ltin || 130.75) : id === 'fxEUR' ? S.fx.EUR : id === 'fxUSD' ? S.fx.USD : null; }
  function applyStep(id, v) {
    if (!isNum(v)) return;
    if (id === 'prn') setCS('cost', PRN.s, PRN.l, Math.max(0, Math.round(v)));
    else if (id === 'nov') setCS('cchg', NOV.s, NOV.l, Math.round(v * 10) / 1000);
    else if (id === 'ltax') setLtax(Math.max(0, Math.round(v * 100) / 100));
    else if (id === 'fxEUR' || id === 'fxUSD') setFx(id.slice(2), Math.max(0.01, Math.round(v * 10000) / 10000));
  }
  function commitInput(t) {
    var v = parseNum(t.value); if (v == null) return;
    if (t.dataset.in) applyStep(t.dataset.in, v);
    else if (t.dataset.cs) { var f = t.dataset.cs; setCS(f, t.dataset.s, t.dataset.l, /chg/.test(f) ? v / 100 : v); }
    else if (t.dataset.pass) setPass(t.dataset.pass, v / 100);
  }
  function onClick(e) {
    var chEl = e.target.closest ? e.target.closest('[data-chart]') : null;
    if (chEl && chEl.__g && chEl.__g.idx != null && !e.target.closest('.legend')) { if (chartClick(chEl)) return; }
    var t = e.target.closest ? e.target.closest('button,[data-ex],select,input,textarea,#scrim,#soScrim,#xpScrim,#subScrim') : null; if (!t) return;
    if (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA') return;
    if (t.id === 'guideBtn') { S.explain = null; S.tour = 0; tourStep(); return; }
    if (t.id === 'resetBtn' || t.id === 'resetBtn2') { resetAll(); return; }
    if (t.id === 'exClose' || t.id === 'scrim') { S.explain = null; S.stack = []; render(); return; }
    if (t.id === 'exBack') { S.explain = S.stack.pop() || null; render(); return; }
    if (t.id === 'xpClose' || t.id === 'xpScrim') { S.expand = null; render(); return; }
    if (t.id === 'soCancel' || t.id === 'soScrim') { S.signoff = null; render(); return; }
    if (t.id === 'soSave') { saveSignoff(); return; }
    if (t.id === 'subCancel' || t.id === 'subScrim') { S.submit = null; render(); return; }
    if (t.id === 'subSkip') { var go = S.submit && S.submit.go; S.submit = null; if (go) setStep(go); else render(); return; }
    if (t.id === 'subSave') { var nt0 = $('subNote'); if (S.submit && nt0) S.submit.note = nt0.value; saveSubmit(); return; }
    if (t.id === 'tSkip') { endTour(); return; }
    if (t.id === 'tNext') { if (S.tour >= TOUR.length - 1) endTour(); else { S.tour++; tourStep(); } return; }
    if (t.id === 'tBack') { S.tour = Math.max(0, S.tour - 1); tourStep(); return; }
    var d = t.dataset;
    if (d.next) { var cur = S.step, xi = cur <= 3 ? stageInfo(cur) : null; if (xi && xi.todo) openSubmit(cur, +d.next); else setStep(+d.next); return; }
    if (d.submit) { openSubmit(+d.submit, null, d.only || null); return; }
    if (d.step) { setStep(+d.step); return; }
    if (d.goto) { S.explain = null; S.stack = []; setStep(+d.goto, d.focus); return; }
    if (d.expand) { S.expand = d.expand; render(); return; }
    if (d.stp) { var cur = stepVal(d.stp); applyStep(d.stp, (isNum(cur) ? cur : 0) + parseFloat(d.d)); render(); return; }
    if (d.quick) { if (d.quick === 'prn') setCS('cost', PRN.s, PRN.l, 650); else if (d.quick === 'nov') setCS('cchg', NOV.s, NOV.l, 0.12); else if (d.quick === 'ltax') setLtax(140); else if (d.quick === 'fx') setFx('EUR', 0.82); render(); return; }
    if (d.haul != null) { setHaul(parseFloat(d.haul)); render(); return; }
    if (d.sign) { var p = d.sign.split('|'); S.signoff = { e: p[0], st: p[1], w: (S.wfs[p[0]] || {})[p[1]] || 'Not started', cNote: null, rNote: null, err: null }; render(); timer(function () { var n = $('soNote'); if (n) n.focus(); }, 30); return; }
    if (d.sostat) { keepSoNote(); S.signoff.w = d.sostat; S.signoff.err = null; render(); return; }
    if (d.ex) { openEx(d.ex, ctxOf(t), !!t.closest('.drawer')); return; }
  }
  function saveSignoff() {
    keepSoNote();
    var so = S.signoff; if (!so) return;
    var coords = { entityList: so.e, stageList: so.st }, was = (S.wfs[so.e] || {})[so.st] || 'Not started', cm = wfc(so.e, so.st);
    if (so.w === 'Returned') {
      var why = (so.rNote != null ? so.rNote : (cm.r || '')).trim(), wasR = cm.r || '';
      if (!why) { so.err = 'Give a reason so ' + so.e + ' knows what to fix.'; render(); return; }
      if (why !== wasR) { cm.r = why; (S.wfc[so.e] = S.wfc[so.e] || {})[so.st] = cm; write('returnSink', coords, why, 'Return reason for ' + so.e + ', ' + so.st, wasR, '"' + why + '"', true); }
    } else if (so.w !== 'Approved' && so.cNote != null) {
      var note = so.cNote.trim(), wasC = cm.c || '';
      if (note && note !== wasC) { cm.c = note; (S.wfc[so.e] = S.wfc[so.e] || {})[so.st] = cm; write('commentSink', coords, note, 'Note for ' + so.e + ', ' + so.st, wasC, '"' + note + '"', so.w !== was); }
    }
    (S.wfs[so.e] = S.wfs[so.e] || {})[so.st] = so.w;
    if (so.w !== was) write('statusSink', coords, so.w, 'Status for ' + so.e + ', ' + so.st, was, so.w);
    S.signoff = null; render();
  }
  function onChange(e) {
    var t = e.target;
    if (t.getAttribute && t.getAttribute('data-subsel') != null && S.submit) { S.submit.sel[t.getAttribute('data-subsel')] = t.checked; var nt1 = $('subNote'); if (nt1) S.submit.note = nt1.value; S.submit.err = null; render(); return; }
    if (t.id === 'selScheme') { S.selScheme = t.value; render(); return; }
    if (t.classList && t.classList.contains('inp')) { S.editing = false; commitInput(t); render(); }
  }
  function onKey(e) {
    if (e.key === 'Escape') { if (S.tour >= 0) { endTour(); return; } if (S.expand) { S.expand = null; render(); return; } if (S.submit) { S.submit = null; render(); return; } if (S.signoff) { S.signoff = null; render(); return; } if (S.explain) { S.explain = null; S.stack = []; render(); } return; }
    var t = e.target;
    if (e.key === 'Enter' && t.classList && t.classList.contains('inp')) { t.blur(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('data-ex') && t.tagName !== 'BUTTON') { e.preventDefault(); openEx(t.getAttribute('data-ex'), ctxOf(t)); }
  }
  function onFocusIn(e) { if (e.target.classList && e.target.classList.contains('inp')) S.editing = true; }
  function onFocusOut(e) { if (e.target.classList && e.target.classList.contains('inp')) { S.editing = false; timer(scheduleRender, 50); } }
  function onMove(e) {
    var tip = $('tip'); if (!tip) return;
    var ch = e.target.closest ? e.target.closest('[data-chart]') : null;
    if (ch && ch.__g) { chartHover(ch, e, tip); return; }
    clearHover();
    var t = e.target.closest ? e.target.closest('[data-tip]') : null; if (!t) return;
    tip.textContent = t.getAttribute('data-tip'); placeTip(tip, e);
  }
  function onLeave() { clearHover(); }
  function onDown() { S.ptr = true; }
  function onUp() { if (!S.ptr) return; S.ptr = false; timer(scheduleRender, 0); }
  function tourStep() { var st = TOUR[S.tour]; if (!st) return endTour(); if (st.step && st.step !== S.step) setStep(st.step); else render(); timer(function () { var el = $(st.el); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); timer(function () { if ($('tourL')) $('tourL').innerHTML = tourHtml(); }, 250); }, 60); }
  function endTour() { S.tour = -1; render(); }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.app{--navy:' + C.navy + ';--navy2:' + C.navy2 + ';--blue:' + C.blue + ';--blue-soft:' + C.blueSoft + ';--green:' + C.green + ';--green-ink:' + C.greenInk + ';--amber-soft:' + C.amberSoft + ';--red:' + C.red + ';--ink:' + C.ink + ';--mut:' + C.mut + ';--line:' + C.line + ';--bg:' + C.bg + ';--fs-xs:11px;--fs-s:12px;--fs-m:13px;--fs-b:14px;--fs-l:20px;--fs-xl:26px;font-family:' + FONT + ';font-size:var(--fs-m);line-height:1.4;color:var(--ink);background:var(--bg);height:100%;display:flex;flex-direction:column;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}',
    '.app *{box-sizing:border-box}.app h2,.app h3,.app p{font-family:inherit}',
    '.top{flex:none;display:flex;align-items:center;gap:18px;height:56px;padding:0 24px;background:var(--navy);color:#ffffff}',
    '.brand{display:flex;align-items:center;gap:10px;min-width:0}.wm{font-weight:700;font-size:16px;letter-spacing:.01em}.sep{width:1px;height:22px;background:rgba(255,255,255,.25)}.ttl{font-size:var(--fs-b);opacity:.9;white-space:nowrap}',
    '.meta{display:flex;gap:8px;flex:1;min-width:0;overflow:hidden}.pill{font-size:var(--fs-s);font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.16);white-space:nowrap}.pill.ghost{background:none;font-weight:500;border:1px solid rgba(255,255,255,.24);color:rgba(255,255,255,.88)}',
    '.acts{display:flex;gap:8px;flex:none}',
    '.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:10px;padding:8px 14px;font:inherit;font-size:var(--fs-m);font-weight:600;cursor:pointer;line-height:1.1;white-space:nowrap}.btn.sm{padding:6px 10px;font-size:var(--fs-s)}',
    '.btn.primary{background:var(--blue);color:#ffffff}.btn.primary:hover{background:' + C.blue2 + '}',
    '.btn.go{background:var(--green);color:' + C.navy2 + '}.btn.go:hover{filter:brightness(1.05)}',
    '.btn.ghost{background:transparent;color:#ffffff;border-color:rgba(255,255,255,.35)}.btn.ghost:hover{background:rgba(255,255,255,.1)}',
    '.btn.sec{background:#ffffff;color:var(--navy);border-color:var(--line)}.btn.sec:hover{border-color:var(--blue);color:var(--blue)}',
    '.stepper{flex:none;display:flex;align-items:center;gap:8px;padding:10px 24px;background:#ffffff;border-bottom:1px solid var(--line)}',
    '.stp{display:flex;align-items:center;gap:10px;background:none;border:0;padding:6px 10px 6px 6px;border-radius:12px;cursor:pointer;font:inherit;text-align:left;color:var(--ink);flex:none}.stp:hover{background:var(--bg)}',
    '.stp .n{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:var(--fs-m);background:var(--bg);color:var(--mut);border:1px solid var(--line);flex:none}',
    '.stp.on .n{background:var(--blue);color:#ffffff;border-color:var(--blue);box-shadow:0 0 0 4px var(--blue-soft)}.stp.done .n{background:var(--green);border-color:var(--green);color:' + C.navy2 + '}',
    '.stp b{display:block;font-size:var(--fs-b);font-weight:600}.stp small{display:block;font-size:var(--fs-s);color:var(--mut)}.stp.on b{color:var(--blue)}',
    '.sline{flex:1;height:2px;background:var(--line);border-radius:2px;min-width:12px}.sline.done{background:var(--green)}',
    '.kpis{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:14px 24px 0}',
    '.kpi{position:relative;overflow:hidden;background:#ffffff;border:1px solid var(--line);border-radius:14px;padding:12px 16px 12px 20px;text-align:left;cursor:pointer;font:inherit;color:var(--ink);display:flex;flex-direction:column;gap:3px;box-shadow:0 1px 2px rgba(16,40,58,.05);transition:box-shadow .15s,border-color .15s}',
    '.kpi::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--k)}.kpi:hover{border-color:var(--blue);box-shadow:0 6px 18px rgba(16,40,58,.09)}',
    '.kl{font-size:var(--fs-s);color:var(--mut);font-weight:600}.kv{font-size:var(--fs-xl);font-weight:700;color:var(--navy);letter-spacing:-.01em;line-height:1.15}.ks{display:flex;gap:8px;align-items:center;font-size:var(--fs-s);color:var(--mut);flex-wrap:wrap;min-height:20px}',
    '.dl{font-size:var(--fs-s);font-weight:700;padding:2px 8px;border-radius:999px}.dl.up{background:' + C.greenSoft + ';color:var(--green-ink)}.dl.dn{background:' + C.redSoft + ';color:var(--red)}',
    '.errs{margin:10px 24px 0;padding:8px 12px;background:' + C.redSoft + ';color:var(--red);border-radius:10px;font-size:var(--fs-s)}',
    'main{flex:1;overflow:auto;padding:16px 24px 28px;min-height:0}',
    '.insight{display:flex;gap:12px;align-items:flex-start;background:#ffffff;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:12px;padding:12px 16px;margin-bottom:18px}.insight p{margin:0;font-size:var(--fs-b);line-height:1.55}.insight .ic{color:var(--blue);flex:none;padding-top:1px}',
    '.ph{margin:2px 0 14px}.eyebrow{font-size:var(--fs-xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}.ph h2{margin:4px 0;font-size:var(--fs-l);font-weight:700;color:var(--navy);line-height:1.25}.ph p{margin:0;color:var(--mut);font-size:var(--fs-b);max-width:980px;line-height:1.55}',
    '.card{background:#ffffff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:14px;min-width:0;box-shadow:0 1px 2px rgba(16,40,58,.05)}',
    '.ch{display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}.ch h3{margin:0;font-size:var(--fs-b);font-weight:700;color:var(--ink);flex:1;min-width:0}',
    '.ch select{border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit;font-size:var(--fs-m);background:#ffffff;color:var(--ink)}',
    '.icon-btn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;border:1px solid var(--line);background:#ffffff;color:var(--mut);cursor:pointer;padding:0}.icon-btn:hover{color:var(--blue);border-color:var(--blue)}',
    '.tag{font-size:var(--fs-xs);font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:var(--amber-soft);color:' + C.amberInk + '}',
    '.grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:14px;align-items:start}.grid2.r{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}',
    '.lrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0}.lt{font-weight:700;width:44px}.lt2{font-weight:600;margin-bottom:6px}.unit{color:var(--mut);font-size:var(--fs-s)}.kv2{margin-top:12px;color:var(--mut)}',
    '.nstep{display:inline-flex;align-items:stretch;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#ffffff}.nstep button{width:34px;border:0;background:var(--bg);font:inherit;font-size:16px;font-weight:600;color:var(--navy);cursor:pointer}.nstep button:hover{background:var(--blue-soft);color:var(--blue)}',
    '.inp{width:84px;height:30px;padding:0 8px;border-radius:8px;border:1px solid ' + C.amberLine + ';background:var(--amber-soft);font:inherit;font-size:var(--fs-m);text-align:right;color:var(--ink)}.inp.sm{width:82px}.inp.xs{width:58px}.inp:focus{outline:2px solid var(--blue);outline-offset:1px}',
    '.nstep .inp{border:0;border-left:1px solid var(--line);border-right:1px solid var(--line);border-radius:0;width:100px;height:36px;font-size:var(--fs-b);font-weight:600}',
    '.hint{font-size:var(--fs-s);color:var(--mut);margin:10px 0 0;line-height:1.5}',
    '.tw{overflow:auto}.tb{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--fs-m)}',
    '.tb th{font-size:var(--fs-xs);font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);text-align:right;padding:8px 10px;border-bottom:1px solid var(--line);white-space:nowrap;background:#ffffff}.tb th:first-child{text-align:left}',
    '.tb td{padding:8px 10px;border-bottom:1px solid ' + C.lineSoft + ';vertical-align:middle}.tb tbody tr:hover td{background:' + C.rowHover + '}.num{text-align:right;white-space:nowrap}',
    '.tb tr.tot td{background:var(--bg);font-weight:700;border-top:1px solid var(--line)}.neg{color:var(--red)}.pos{color:var(--green-ink)}',
    '.ex{border:0;background:none;font:inherit;color:inherit;cursor:pointer;padding:0;border-bottom:1px dashed ' + C.cloud + ';text-align:inherit}.ex:hover{color:var(--blue);border-bottom-color:var(--blue)}.ex.strong{font-weight:700;color:var(--navy)}',
    '.chip{display:inline-block;color:#ffffff;border-radius:999px;padding:2px 9px;font-weight:600;font-size:var(--fs-s);white-space:nowrap}',
    '.bt{border-radius:999px;padding:2px 9px;font-size:var(--fs-s);font-weight:600;white-space:nowrap}.bt.cp{background:' + C.greenSoft + ';color:var(--green-ink)}.bt.fp{background:var(--blue-soft);color:var(--blue)}',
    '.chart{width:100%;position:relative;min-height:40px}.chart[data-chart]{cursor:pointer}.svg{display:block}.svg text{font-family:' + FONT + '}',
    '.t-ax{font-size:11px;fill:' + C.mut + '}.t-lab{font-size:12px;fill:' + C.ink + '}.t-val{font-size:12px;font-weight:700;fill:' + C.ink + '}.t-zone{font-size:10px;font-weight:700;letter-spacing:.08em;fill:' + C.mut + '}',
    '.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:var(--fs-s);color:var(--mut);margin-top:10px;align-items:center}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}.legend i.dash{border-top:2px dashed ' + C.slate + ';height:0;width:16px;border-radius:0}',
    '.segs{display:flex;gap:6px;flex-wrap:wrap}.seg{border:1px solid var(--line);background:#ffffff;border-radius:10px;padding:7px 12px;cursor:pointer;font:inherit;font-size:var(--fs-m);font-weight:600;color:var(--navy)}.seg:hover{border-color:var(--blue);color:var(--blue)}.seg.on{background:var(--navy);border-color:var(--navy);color:#ffffff}',
    '.lt3{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:var(--fs-s);color:var(--mut);margin-top:10px}.lt3 .hi{color:var(--ink);font-weight:700}',
    '.wsum{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;align-items:center}.wsum b{margin-left:6px}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}.wp{margin-left:auto;font-size:var(--fs-b)}',
    '.tb.wf td{vertical-align:top}.sgn{border:1px solid transparent;background:none;border-radius:10px;padding:6px 8px;cursor:pointer;font:inherit;text-align:left;display:flex;flex-direction:column;gap:4px;max-width:320px}.sgn:hover{border-color:var(--blue);background:var(--bg)}.sgn small{color:var(--mut);font-size:var(--fs-s)}.na{color:' + C.cloud + '}',
    '.pnav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px;padding-top:14px;border-top:1px solid var(--line)}',
    '.empty{color:var(--mut);padding:10px}',
    '.loading{display:flex;gap:12px;align-items:center;justify-content:center;min-height:240px;color:var(--mut);font-size:var(--fs-b)}.loading.sm{min-height:0;padding:30px}.spin{width:20px;height:20px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--blue);animation:sp 1s linear infinite;display:inline-block}.spin.sm{width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,.35);border-top-color:#ffffff}@keyframes sp{to{transform:rotate(360deg)}}',
    '.busy{position:fixed;left:50%;top:66px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;background:var(--navy2);color:#ffffff;padding:8px 16px;border-radius:999px;font-size:var(--fs-m);z-index:50;box-shadow:0 8px 24px rgba(0,30,50,.25)}',
    '.toast{position:fixed;right:20px;bottom:76px;max-width:440px;padding:12px 16px;border-radius:12px;color:#ffffff;z-index:60;box-shadow:0 10px 30px rgba(0,30,50,.25);font-size:var(--fs-m);line-height:1.45}.toast.ok{background:' + C.greenInk + '}.toast.err{background:var(--red)}',
    '.scrim{position:fixed;inset:0;background:rgba(0,30,50,.32);z-index:70}.drawer{position:fixed;top:0;right:0;bottom:0;width:460px;max-width:92vw;background:#ffffff;z-index:71;padding:20px 22px;overflow:auto;box-shadow:-12px 0 36px rgba(0,30,50,.18)}',
    '.dh{display:flex;justify-content:space-between;margin-bottom:12px}.dt2{font-size:var(--fs-m);color:var(--mut);font-weight:600}.dv{font-size:var(--fs-xl);font-weight:700;color:var(--navy);margin:2px 0 8px}.drawer p{font-size:var(--fs-b);line-height:1.55;margin:0}.lbl{font-size:var(--fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin:16px 0 6px}',
    '.fm{background:var(--bg);border-radius:10px;padding:10px 12px;font-weight:600;line-height:1.5}.fm.live{background:var(--blue-soft);color:var(--navy)}',
    '.part{display:flex;width:100%;justify-content:space-between;gap:8px;align-items:center;border:1px solid var(--line);border-radius:10px;background:#ffffff;padding:9px 12px;margin-bottom:6px;cursor:pointer;font:inherit;text-align:left;color:var(--ink)}.part:hover{border-color:var(--blue)}.part i{color:var(--blue);font-style:normal}',
    '.chg{display:flex;gap:6px;flex-wrap:wrap}.where{color:var(--mut)}',
    '.mrows{display:flex;flex-direction:column;gap:4px}.mr{display:grid;grid-template-columns:120px 1fr 110px;gap:8px;align-items:center;font-size:var(--fs-s)}.mr i{height:8px;border-radius:4px;display:block}.mr b{text-align:right;font-weight:600}',
    '.modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:540px;max-width:92vw;background:#ffffff;border-radius:16px;padding:20px 22px;z-index:72;box-shadow:0 20px 60px rgba(0,30,50,.3)}.modal h3{margin:2px 0 6px;color:var(--navy);font-size:var(--fs-l)}',
    '.modal textarea{width:100%;border:1px solid ' + C.amberLine + ';background:var(--amber-soft);border-radius:10px;padding:8px 10px;font:inherit;font-size:var(--fs-m)}.mb{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
    '.xmodal{position:fixed;left:4vw;right:4vw;top:6vh;max-height:88vh;overflow:auto;background:#ffffff;border-radius:16px;padding:20px 24px;z-index:72;box-shadow:0 20px 60px rgba(0,30,50,.3)}',
    '.tip{position:fixed;display:none;z-index:90;background:' + C.navy2 + ';color:#ffffff;font-family:' + FONT + ';font-size:12px;line-height:1.4;padding:10px 12px;border-radius:10px;pointer-events:none;min-width:190px;max-width:300px;box-shadow:0 10px 30px rgba(0,30,50,.28)}',
    '.tt-h{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:6px;font-size:13px}.tt-r{display:grid;grid-template-columns:10px 1fr auto;gap:8px;align-items:center;padding:2px 0}.tt-r i{width:10px;height:10px;border-radius:50%;display:block}.tt-r i.ring{border:2px dashed #ffffff}.tt-r b{font-weight:700}.tt-f{margin-top:6px;opacity:.7;font-size:11px}.tag2{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.16)}',
    '.spot{position:fixed;border-radius:16px;box-shadow:0 0 0 9999px rgba(0,30,50,.55);z-index:80;pointer-events:none;outline:3px solid ' + C.green + ';animation:pl 1.6s ease-in-out infinite}@keyframes pl{50%{outline-color:' + C.blue + '}}',
    '.tcard{font-family:' + FONT + ';font-size:14px;line-height:1.5;color:' + C.ink + ';position:fixed;width:360px;background:#ffffff;border-radius:14px;padding:16px;z-index:81;box-shadow:0 16px 48px rgba(0,30,50,.32)}.tn{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:' + C.blue + '}.tt{font-weight:700;font-size:16px;color:' + C.navy + ';margin:2px 0 6px}.tcard p{margin:0 0 12px}.tbtn{display:flex;justify-content:space-between;gap:6px}.tbtn span{display:flex;gap:6px}',
    '.tcard .btn{font-family:' + FONT + ';font-size:12px;padding:6px 10px;border-radius:8px;border:1px solid ' + C.line + ';background:#ffffff;color:' + C.navy + ';cursor:pointer;font-weight:600}.tcard #tNext{background:' + C.blue + ';border-color:' + C.blue + ';color:#ffffff}',
    '.flash{animation:fl 1.6s}@keyframes fl{0%,60%{box-shadow:0 0 0 4px ' + C.amberLine + '}100%{box-shadow:none}}',
    '.pc{margin-left:6px;color:var(--mut)}.unit{margin-left:2px}',
    '.pnav{flex-wrap:wrap}.pmid{display:flex;align-items:center;gap:10px}.subst{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-s);font-weight:600;color:var(--mut);background:var(--bg);border:1px solid var(--line);border-radius:999px;padding:5px 10px}.subst.ok{color:var(--green-ink);background:' + C.greenSoft + ';border-color:' + C.greenSoft + '}',
    '.mlead{margin:0;color:var(--mut);font-size:var(--fs-m);line-height:1.5}.subl{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow:auto}.subrow{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;cursor:pointer}.subrow:hover{border-color:var(--blue)}.subrow.dis{opacity:.6;cursor:default}.subrow .se{flex:1;font-weight:600}.subrow input{width:16px;height:16px;accent-color:' + C.blue + '}',
    '.modal .eyebrow{margin-bottom:2px}',
    '.drawer .btn.ghost,.modal .btn.ghost,.xmodal .btn.ghost{color:var(--navy);border-color:var(--line);background:#ffffff}',
    '.stp.warn .n{background:' + C.redSoft + ';border-color:var(--red);color:var(--red)}.stp small .sr,.sr{color:var(--red);font-weight:600}.sdots{display:inline-flex;gap:3px;margin-right:6px;vertical-align:1px}.sdots i{width:8px;height:8px;border-radius:50%;display:inline-block}',
    '.wfs .ch{margin-bottom:10px}.wfl{font-size:var(--fs-s);font-weight:700;padding:4px 10px;border-radius:999px;background:var(--bg);color:var(--mut)}.wfl.bad{background:' + C.redSoft + ';color:var(--red)}.wfl.todo{background:var(--amber-soft);color:' + C.amberInk + '}.wfl.rev{background:#F0EDFF;color:' + C.violet + '}.wfl.ok{background:' + C.greenSoft + ';color:var(--green-ink)}',
    '.wfg{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.wfe{border:1px solid var(--line);border-left:4px solid var(--c);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;min-width:0}.wfeh{display:flex;justify-content:space-between;align-items:center;gap:8px}.wfeh b{font-size:var(--fs-b)}.wfes{font-size:var(--fs-s);color:var(--ink)}.wfe small{font-size:var(--fs-s);color:var(--mut)}',
    '.retbox{display:flex;gap:12px;align-items:flex-start;margin-top:12px;padding:12px 14px;border:1px solid #F5B5B7;background:' + C.redSoft + ';border-radius:12px}.ri{flex:none;width:26px;height:26px;border-radius:50%;background:var(--red);color:#ffffff;font-weight:800;display:flex;align-items:center;justify-content:center}.rt{flex:1;min-width:0}.rt b{color:var(--red);font-size:var(--fs-b)}.rt p{margin:4px 0;font-size:var(--fs-b);color:var(--ink);line-height:1.5}.rt small{color:var(--mut);font-size:var(--fs-s)}',
    '.abar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 24px;background:#ffffff;border-top:1px solid var(--line);box-shadow:0 -6px 18px rgba(16,40,58,.06);z-index:5}.abl{display:flex;align-items:center;gap:14px;min-width:0;flex-wrap:wrap}.abs{display:flex;gap:6px;flex-wrap:wrap}',
    '.abp{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-s);color:var(--mut);background:var(--bg);border-radius:999px;padding:4px 10px;white-space:nowrap}.abp i{width:8px;height:8px;border-radius:50%;display:inline-block}.abp b{color:var(--ink);font-weight:600}',
    '.abr{display:flex;align-items:center;gap:8px;flex:none}.cnt{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--blue-soft);color:var(--blue);font-size:var(--fs-xs);font-weight:700}.abok{display:inline-flex;align-items:center;gap:6px;font-size:var(--fs-s);font-weight:700;color:var(--green-ink);background:' + C.greenSoft + ';border-radius:999px;padding:6px 12px}',
    '.subrow{align-items:center}.subrow .se{display:flex;flex-direction:column;gap:1px}.subrow .se small{font-size:var(--fs-s);color:var(--mut);font-weight:400}.subrow.dis{opacity:1;background:var(--bg)}.subrow.dis .se b{color:var(--mut)}.subrow.bad{border-color:#F5B5B7}',
    '.subwhy{margin:-2px 0 4px 26px;padding:8px 10px;border-radius:8px;background:' + C.redSoft + ';color:var(--ink);font-size:var(--fs-s);line-height:1.5}.subwhy b{display:block;color:var(--red);font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}',
    '.merr{margin-top:10px;padding:8px 10px;border-radius:8px;background:' + C.redSoft + ';color:var(--red);font-size:var(--fs-s);font-weight:600}.sonow{display:flex;align-items:center;gap:8px;font-size:var(--fs-s);color:var(--mut);margin:4px 0 8px}.bnote{background:var(--bg);border-radius:8px;padding:8px 10px;font-size:var(--fs-s);line-height:1.5;margin-bottom:6px}.bnote b{display:block;font-size:var(--fs-xs);text-transform:uppercase;letter-spacing:.05em;color:var(--mut);margin-bottom:2px}.sop{margin-top:12px}',
    '.pbar{display:flex;gap:2px;height:12px;border-radius:999px;overflow:hidden;background:var(--bg)}.pbar i{display:block;height:100%}.wp{font-size:var(--fs-b)}',
    '.flow{display:grid;grid-template-columns:minmax(0,1fr) 30px minmax(0,1fr) 30px minmax(0,1fr) 30px minmax(0,1fr);margin-top:16px;align-items:stretch}.fla{display:flex;align-items:flex-start;justify-content:center;padding-top:18px}',
    '.flc{background:#ffffff;border:1px solid var(--line);border-top:4px solid var(--c);border-radius:12px;padding:10px;min-width:0}.flc.bad{background:#FFF9F9;border-color:#F5B5B7;border-top-color:var(--c)}.flh{display:flex;gap:10px;align-items:center;margin-bottom:8px}.fln{flex:none;width:30px;height:30px;border-radius:50%;background:var(--c);font-weight:700;display:flex;align-items:center;justify-content:center}.flh b{display:block;font-size:var(--fs-b)}.flh small{display:block;color:var(--mut);font-size:var(--fs-s)}',
    '.fls{display:flex;flex-direction:column;gap:6px}.fli{display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1px solid var(--line);border-radius:8px;background:var(--bg);padding:6px 8px;font:inherit;text-align:left;cursor:pointer;color:var(--ink);width:100%}.fli:hover{border-color:var(--blue)}.fli span{font-size:var(--fs-s);color:var(--mut)}.fli em{font-style:normal;font-size:var(--fs-s);color:var(--red);margin-top:2px;line-height:1.4}.fle{font-size:var(--fs-s);color:var(--mut);padding:4px 2px}',
    '.flr{margin-top:10px}.flrl{grid-column:1/5;display:flex;align-items:flex-start;justify-content:flex-end;gap:8px;color:var(--red);font-size:var(--fs-s);font-weight:600;padding:2px 10px 0 0;text-align:right}.flr .flc{grid-column:5/8}.rr{color:var(--red)!important}',
    '@media (prefers-reduced-motion:reduce){.spot,.spin,.flash{animation:none}}',
    '@media (max-width:1200px){.meta{display:none}}@media (max-width:980px){.stp small{display:none}}',
    '@media (max-width:1100px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.grid2,.grid2.r{grid-template-columns:1fr}.flow{grid-template-columns:1fr}.fla{padding:4px 0;transform:rotate(90deg)}.flrl,.flr .flc{grid-column:auto}.flrl{justify-content:flex-start}}',
    '@media (max-width:760px){.app{overflow:auto}main{overflow:visible;padding:12px}.top{padding:0 12px;gap:10px}.ttl,.sep{display:none}.stepper{padding:8px 12px;overflow-x:auto}.stp .sl{display:none}.kpis{padding:12px 12px 0}.kv{font-size:20px}.mr{grid-template-columns:90px 1fr 90px}.abar{flex-direction:column;align-items:stretch;padding:10px 12px}.abr{flex-wrap:wrap}}',
    '@media (max-width:620px){.kpis{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(css);

  on(root, 'click', onClick);
  on(root, 'change', onChange);
  on(root, 'focusin', onFocusIn);
  on(root, 'focusout', onFocusOut);
  on(root, 'mousemove', onMove);
  on(root, 'pointerdown', onDown);
  on(document, 'pointerup', onUp);
  on(document, 'keydown', onKey);
  var rzT = null;
  function onResize() { if (rzT) clearTimeout(rzT); rzT = timer(function () { drawCharts(); if (S.tour >= 0 && $('tourL')) $('tourL').innerHTML = tourHtml(); }, 120); }
  on(window, 'resize', onResize);
  on(root, 'mouseleave', onLeave);

  root.__cleanup = function () {
    disposed = true;
    timers.forEach(clearTimeout);
    Object.keys(subs).forEach(function (k) { try { subs[k] && subs[k].unsubscribe && subs[k].unsubscribe(); } catch (e) { } });
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    if (css.parentNode) css.parentNode.removeChild(css);
  };

  render();
  if (!SDK) { S.errors.sdk = 'The Pigment SDK is not available.'; render(); return; }
  startData();
})();
