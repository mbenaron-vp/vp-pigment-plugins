(function () {
  'use strict';
  // ================= BRAND: change this block (and the bindings in build_inbox.py) for another customer =================
  var BRAND = {
    name: 'Reconomy',
    product: 'Group review inbox',
    round: 'November forecast round',
    version: 'Forecast Nov 26',
    reviewer: 'Group review',
    // what "What's in it" shows for each stage, in stage order: schemes, sectors or pl
    stageViews: ['schemes', 'sectors', 'pl'],
    reasonStarters: ['Please recheck the growth assumption against recent volumes.', 'Explain the gap to budget before resubmitting.', 'Add commentary on the main movements.', 'Check the price and cost changes from January.'],
    statuses: { review: 'Submitted', returned: 'Returned', approved: 'Approved', notStarted: 'Not started', inProgress: 'In progress' },
    progress: { 'Not started': 0, 'In progress': 0.35, 'Submitted': 0.75, 'Returned': 0.35, 'Approved': 1 },
    C: { navy: '#014664', navy2: '#00344B', blue: '#215DDB', blue2: '#376EE1', blueSoft: '#E9F0FD', green: '#00CF42', greenInk: '#08843A', greenSoft: '#E2F8E9', amber: '#E8A200', amberInk: '#8A5A00', amberSoft: '#FFF7E0', amberLine: '#F2C94C', red: '#E5484D', redSoft: '#FDECEC', ink: '#10283A', mut: '#5B6B7A', line: '#E2E8EE', lineSoft: '#EEF2F6', rowHover: '#F7FAFD', bg: '#F4F7FA', cloud: '#BFD1E3', slate: '#3A5266', teal: '#0BA5A5', jade: '#00B39B', pine: '#08843A', coral: '#E5484D', gold: '#F2C94C', violet: '#7B61FF' },
    loopColours: ['#215DDB', '#00B39B', '#7B61FF', '#E8A200', '#0BA5A5', '#3A5266'],
    FONT: "'Montserrat', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    logo: '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="13" fill="#ffffff"/><path d="M14 5a9 9 0 0 1 8.5 6" fill="none" stroke="#00CF42" stroke-width="3.2" stroke-linecap="round"/><path d="M22.6 16.5A9 9 0 0 1 9 21.8" fill="none" stroke="#215DDB" stroke-width="3.2" stroke-linecap="round"/><path d="M6.2 18.4A9 9 0 0 1 10 6" fill="none" stroke="#014664" stroke-width="3.2" stroke-linecap="round"/></svg>'
  };
  // ================= end of brand block =================

  var root = document.getElementById('app');
  if (root.__cleanup) root.__cleanup();
  root.innerHTML = '';
  root.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;overflow:hidden;';
  var SDK = window.PigmentSDK;
  var disposed = false, timers = [], subs = {}, listeners = [];
  var C = BRAND.C, ST = BRAND.statuses, V = BRAND.version, FONT = BRAND.FONT;
  var GBP = '£', DASH = '–', ELL = '…', MID = '·';
  var ST_COL = {}; ST_COL[ST.notStarted] = '#cbd5e1'; ST_COL[ST.inProgress] = C.gold; ST_COL[ST.review] = C.violet; ST_COL[ST.returned] = C.coral; ST_COL[ST.approved] = C.green;
  var RANK = {}; RANK[ST.review] = 0; RANK[ST.returned] = 1; RANK[ST.inProgress] = 2; RANK[ST.notStarted] = 3; RANK[ST.approved] = 4;
  var FOLDERS = [
    { id: 'review', name: 'Needs review', hint: 'Submitted, waiting for you', test: function (w) { return w === ST.review; }, col: C.violet },
    { id: 'returned', name: 'Returned', hint: 'Back with the business to fix', test: function (w) { return w === ST.returned; }, col: C.coral },
    { id: 'approved', name: 'Approved', hint: 'Signed off', test: function (w) { return w === ST.approved; }, col: C.green },
    { id: 'waiting', name: 'Not submitted yet', hint: 'Not started or in progress', test: function (w) { return w === ST.notStarted || w === ST.inProgress; }, col: '#94a3b8' },
    { id: 'all', name: 'All', hint: 'Every business and stage', test: function () { return true; }, col: C.navy }
  ];
  var IC = {
    inbox: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 9.5V12a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 14 12V9.5M2 9.5 3.8 3.4A1.5 1.5 0 0 1 5.2 2.5h5.6a1.5 1.5 0 0 1 1.4.9L14 9.5M2 9.5h3.2l1 1.6h3.6l1-1.6H14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 4 2.5 7.5 6 11M3 7.5h6.5a4 4 0 0 1 0 8H8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8l2.3 1.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    all: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 6h6M5 8.5h6M5 11h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    reset: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v3h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    up: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 10 4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="currentColor" opacity=".12"/><path d="M9 8v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="5.3" r="1.1" fill="currentColor"/></svg>',
    spark: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 9.4 6.6 14.5 8 9.4 9.4 8 14.5 6.6 9.4 1.5 8 6.6 6.6Z" fill="currentColor"/></svg>'
  };
  var FOLDER_IC = { review: IC.inbox, returned: IC.back, approved: IC.check, waiting: IC.clock, all: IC.all };

  var S = {
    wfs: {}, wfc: {}, stages: [], ent: {}, ents: [], lines: [], sch: {}, schEnt: {}, entLoop: {}, ms: {}, sectors: [],
    loaded: {}, errors: {}, folder: 'review', stage: 'all', q: '', sel: null, seen: {}, compose: null, toast: null, busy: '', ORIG: {}
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
  function mf(v) { if (!isNum(v)) return DASH; var s = GBP + commas(Math.abs(v).toFixed(0)); return v < 0 ? '(' + s + ')' : s; }
  function mshort(v) { if (!isNum(v)) return DASH; var a = Math.abs(v), s = a >= 1e6 ? (a / 1e6).toFixed(1) + 'm' : a >= 1e3 ? (a / 1e3).toFixed(0) + 'k' : a.toFixed(0); return (v < 0 ? '-' : '') + GBP + s; }
  function pct(v, dp) { return isNum(v) ? (v * 100).toFixed(dp == null ? 1 : dp) + '%' : DASH; }
  function div(a, b) { return isNum(a) && isNum(b) && b ? a / b : null; }
  function stShort(st) { return String(st || '').replace(/^\d+\s*/, ''); }
  function initials(e) { var w = String(e || '').split(/\s+/).filter(Boolean); if (!w.length) return '?'; return (w.length > 1 ? w[0].charAt(0) + w[1].charAt(0) : w[0].slice(0, 2)).toUpperCase(); }
  function names(a) { return a.length <= 2 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function inkOn(w) { return w === ST.inProgress || w === ST.notStarted ? C.ink : '#ffffff'; }
  function chip(w) { return '<span class="chip" style="background:' + (ST_COL[w] || C.cloud) + ';color:' + inkOn(w) + '">' + esc(w) + '</span>'; }
  function loopList() { var o = {}; Object.keys(S.entLoop).forEach(function (e) { if (S.entLoop[e]) o[S.entLoop[e]] = 1; }); return Object.keys(o).sort(); }
  function loopCol(e) { var ls = loopList(), i = ls.indexOf(S.entLoop[e]); return i < 0 ? C.slate : BRAND.loopColours[i % BRAND.loopColours.length]; }
  function avatar(e, big, small) { return '<span class="av' + (big ? ' big' : '') + (small ? ' sm' : '') + '" style="background:' + loopCol(e) + '">' + esc(initials(e)) + '</span>'; }
  function wfc(it) { return (S.wfc[it.e] || {})[it.st] || {}; }

  // ---------- data ----------
  var renderQueued = false;
  function scheduleRender() { if (renderQueued || disposed) return; renderQueued = true; timer(function () { renderQueued = false; if (typing()) return; render(); }, 40); }
  function typing() { var a = document.activeElement; return !!(a && root.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.id !== 'q'))); }
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
        S.loaded[name] = true;
        scheduleRender();
      },
      onError: function (e) { if (disposed) return; S.errors[name] = name + ': ' + ((e && e.message) || 'could not load'); scheduleRender(); }
    });
  }
  function drop(name) { timer(function () { if (subs[name]) { try { subs[name].unsubscribe(); } catch (e) { } delete subs[name]; } }, 0); }
  var FV = [{ binding: 'versionList', selection: [V] }];
  function onWFS(d) { var o = {}, st = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]), w = sv(r.values[0]); if (!e || !s || !w) return; (o[e] = o[e] || {})[s] = w; st[s] = 1; }); S.wfs = o; S.stages = Object.keys(st).sort(); }
  function onWFC(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[0]), s = lab(r.labels[1]); if (!e || !s) return; (o[e] = o[e] || {})[s] = { c: sv(r.values[0]), o: sv(r.values[1]), r: sv(r.values[2]) }; }); S.wfc = o; }
  function onEnt(d) {
    var o = {}, ls = [], es = {};
    d.rows.forEach(function (r) { var e = lab(r.labels[0]), l = lab(r.labels[1]); if (!e || !l) return; (o[e] = o[e] || {})[l] = nz(r.values[0]); if (ls.indexOf(l) < 0) ls.push(l); if (isNum(r.values[0])) es[e] = 1; });
    S.ent = o; S.lines = ls; S.ents = Object.keys(es).sort(function (a, b) { return (entFirst(b) || 0) - (entFirst(a) || 0); });
  }
  function entFirst(e) { return (S.ent[e] || {})[S.lines[0]]; }
  function onSch(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (!s) return; o[s] = { rev: nz(r.values[0]), gp: nz(r.values[1]) }; }); S.sch = o; }
  function onMS(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[0]); if (!s) return; var v = r.values; o[s] = { rev: nz(v[0]), gp: nz(v[1]), inc: nz(v[2]), rec: nz(v[3]) }; }); S.ms = o; S.sectors = Object.keys(o).filter(function (k) { return isNum(o[k].rev); }).sort(function (a, b) { return o[b].rev - o[a].rev; }); }
  function onSchEnt(d) { var o = {}; d.rows.forEach(function (r) { var s = lab(r.labels[r.labels.length - 1]); if (s) o[s] = sv(r.values[0]); }); S.schEnt = o; drop('dsSchEnt'); }
  function onEntLoop(d) { var o = {}; d.rows.forEach(function (r) { var e = lab(r.labels[r.labels.length - 1]); if (e) o[e] = sv(r.values[0]); }); S.entLoop = o; drop('dsEntLoop'); }
  function startData() {
    subs.dsWFS = sub('dsWFS', onWFS);
    subs.dsWFC = sub('dsWFC', onWFC);
    subs.dsEnt = sub('dsEnt', onEnt, FV);
    subs.dsSch = sub('dsSch', onSch, FV);
    subs.dsMS = sub('dsMS', onMS, FV);
    subs.dsSchEnt = sub('dsSchEnt', onSchEnt);
    subs.dsEntLoop = sub('dsEntLoop', onEntLoop);
  }
  function coreLoaded() { return S.loaded.dsWFS && S.loaded.dsWFC; }

  // ---------- items and folders ----------
  function items() {
    var out = [];
    Object.keys(S.wfs).forEach(function (e) { Object.keys(S.wfs[e]).forEach(function (st) { var w = S.wfs[e][st]; out.push({ id: e + '|' + st, e: e, st: st, w: w, si: S.stages.indexOf(st) }); }); });
    var er = function (e) { var i = S.ents.indexOf(e); return i < 0 ? 99 : i; };
    out.sort(function (a, b) { return (RANK[a.w] == null ? 9 : RANK[a.w]) - (RANK[b.w] == null ? 9 : RANK[b.w]) || a.si - b.si || er(a.e) - er(b.e) || a.e.localeCompare(b.e); });
    return out;
  }
  function folder(id) { for (var i = 0; i < FOLDERS.length; i++) if (FOLDERS[i].id === id) return FOLDERS[i]; return FOLDERS[0]; }
  function inStage(it) { return S.stage === 'all' || it.st === S.stage; }
  function matchQ(it) { var q = S.q.trim().toLowerCase(); if (!q) return true; var cm = wfc(it); return (it.e + ' ' + it.st + ' ' + (cm.c || '') + ' ' + (cm.o || '') + ' ' + (cm.r || '')).toLowerCase().indexOf(q) >= 0; }
  function listItems() { var f = folder(S.folder); return items().filter(function (it) { return f.test(it.w) && inStage(it) && matchQ(it); }); }
  function count(fid) { var f = folder(fid); return items().filter(function (it) { return f.test(it.w) && inStage(it); }).length; }
  function byId(id) { var all = items(); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; return null; }
  function roundPct() { var all = items(), t = 0; all.forEach(function (it) { t += BRAND.progress[it.w] || 0; }); return all.length ? t / all.length : null; }

  // ---------- writes (queued, one in flight per cell, originals kept for Reset) ----------
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
    S.busy = 'Writing to Pigment' + ELL; render();
    var p; try { p = Promise.resolve(SDK.editValue(o.sink, o.coords, val)); } catch (e) { p = Promise.reject(e); }
    p.then(function () {
      if (disposed) return; q.inflight = false; S.busy = '';
      if (!q.quiet) toast('ok', o.label + ' set to ' + shown + '.'); else scheduleRender();
      flush(k);
    }).catch(function (e) { if (disposed) return; q.inflight = false; S.busy = ''; toast('err', 'Pigment did not save the change: ' + ((e && e.message) || e)); });
  }
  function resetAll() {
    var ks = Object.keys(S.ORIG); if (!ks.length) { toast('ok', 'Nothing to reset: every status is as it started.'); return; }
    S.busy = 'Putting back ' + ks.length + ' value' + (ks.length > 1 ? 's' : '') + ELL; render();
    var ps = ks.map(function (k) { var o = S.ORIG[k]; return Promise.resolve(SDK.editValue(o.sink, o.coords, o.v)); });
    Promise.all(ps).then(function () {
      if (disposed) return;
      ks.forEach(function (k) { var o = S.ORIG[k], e = o.coords.entityList, st = o.coords.stageList; if (o.sink === 'statusSink') (S.wfs[e] = S.wfs[e] || {})[st] = o.v; if (o.sink === 'returnSink') (((S.wfc[e] = S.wfc[e] || {})[st] = S.wfc[e][st] || {})).r = o.v; });
      S.ORIG = {}; S.busy = ''; toast('ok', 'Back to where the round started.');
    }).catch(function (e) { if (disposed) return; S.busy = ''; toast('err', 'Pigment did not save the reset: ' + ((e && e.message) || e)); });
  }
  function toast(kind, text) { S.toast = { kind: kind, text: text }; render(); timer(function () { S.toast = null; scheduleRender(); }, kind === 'err' ? 7000 : 3800); }

  // ---------- actions ----------
  function nextAfter(id) { var l = listItems(), i = -1; for (var k = 0; k < l.length; k++) if (l[k].id === id) i = k; var rest = l.filter(function (x) { return x.id !== id; }); return rest.length ? rest[Math.min(Math.max(i, 0), rest.length - 1)].id : null; }
  function whyNot(it) {
    if (it.w === ST.approved) return 'Approved. There is nothing left to do on this one.';
    if (it.w === ST.returned) return 'Returned to ' + it.e + '. It comes back to Needs review when they resubmit.';
    return it.e + ' has not submitted this stage yet. It lands in Needs review when they do.';
  }
  function approve(it) {
    if (!it) return;
    if (it.w !== ST.review) { toast('err', whyNot(it)); return; }
    var nx = nextAfter(it.id), coords = { entityList: it.e, stageList: it.st };
    write('statusSink', coords, ST.approved, 'Status for ' + it.e + ', ' + it.st, it.w, ST.approved, true);
    S.wfs[it.e][it.st] = ST.approved; S.compose = null; S.sel = nx;
    toast('ok', 'Approved ' + it.e + ' ' + MID + ' ' + stShort(it.st) + '. It shows as approved on the workflow tracker.');
  }
  function openCompose(it) {
    if (!it) return;
    if (it.w !== ST.review) { toast('err', whyNot(it)); return; }
    S.compose = { id: it.id, text: S.compose && S.compose.id === it.id ? S.compose.text : '', err: null }; render();
    timer(function () { var t = $('retNote'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } }, 20);
  }
  function sendReturn() {
    var it = S.compose && byId(S.compose.id); if (!it) return;
    var t = $('retNote'), why = (t ? t.value : S.compose.text || '').trim();
    if (t) S.compose.text = t.value;
    if (!why) { S.compose.err = 'Give a reason so ' + it.e + ' knows what to fix.'; render(); timer(function () { var t2 = $('retNote'); if (t2) t2.focus(); }, 20); return; }
    var nx = nextAfter(it.id), coords = { entityList: it.e, stageList: it.st }, cm = wfc(it), wasR = cm.r || '';
    write('returnSink', coords, why, 'Return reason for ' + it.e + ', ' + it.st, wasR, '"' + why + '"', true);
    write('statusSink', coords, ST.returned, 'Status for ' + it.e + ', ' + it.st, it.w, ST.returned, true);
    (((S.wfc[it.e] = S.wfc[it.e] || {})[it.st] = S.wfc[it.e][it.st] || {})).r = why;
    S.wfs[it.e][it.st] = ST.returned; S.compose = null; S.sel = nx;
    toast('ok', 'Returned to ' + it.e + ' with your reason. They see it on their step in the cockpit.');
  }
  function move(dir) { var l = listItems(); if (!l.length) return; var i = -1; for (var k = 0; k < l.length; k++) if (l[k].id === S.sel) i = k; i = Math.max(0, Math.min(l.length - 1, i + dir)); S.sel = l[i].id; S.compose = null; render(); var row = root.querySelector('[data-item="' + cssq(S.sel) + '"]'); if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest' }); }
  function cssq(s) { return String(s).replace(/["\\]/g, ''); }

  // ---------- render: rail ----------
  function rail() {
    var fs = FOLDERS.map(function (f) {
      var n = count(f.id);
      return '<button class="fd' + (S.folder === f.id ? ' on' : '') + '" data-folder="' + f.id + '" title="' + esc(f.hint) + '"><span class="fi" style="color:' + f.col + '">' + FOLDER_IC[f.id] + '</span><span class="fn">' + f.name + '</span><span class="fc' + (f.id === 'review' && n ? ' hot' : '') + '">' + n + '</span></button>';
    }).join('');
    var stg = '<button class="sf' + (S.stage === 'all' ? ' on' : '') + '" data-stage="all">All stages</button>' + S.stages.map(function (st) { return '<button class="sf' + (S.stage === st ? ' on' : '') + '" data-stage="' + esc(st) + '">' + esc(stShort(st)) + '</button>'; }).join('');
    var all = items(), byW = {}; all.forEach(function (it) { byW[it.w] = (byW[it.w] || 0) + 1; });
    var order = [ST.approved, ST.review, ST.inProgress, ST.returned, ST.notStarted];
    var bar = order.map(function (w) { return byW[w] ? '<i style="flex:' + byW[w] + ';background:' + ST_COL[w] + '" title="' + esc(w) + ': ' + byW[w] + '"></i>' : ''; }).join('');
    var leg = order.map(function (w) { return byW[w] ? '<span><i style="background:' + ST_COL[w] + '"></i>' + esc(w) + ' <b>' + byW[w] + '</b></span>' : ''; }).join('');
    return '<aside class="rail"><div class="rh">Inbox</div><div class="fds">' + fs + '</div>' +
      '<div class="rh">Stage</div><div class="sfs">' + stg + '</div>' +
      '<div class="rcard"><div class="rch"><span>Round progress</span><b>' + pct(roundPct(), 0) + '</b></div><div class="pbar">' + bar + '</div><div class="rleg">' + leg + '</div></div>' +
      '<div class="keys"><div class="rh">Keyboard</div><div><kbd>J</kbd><kbd>K</kbd> next, previous</div><div><kbd>A</kbd> approve</div><div><kbd>R</kbd> return with a reason</div><div><kbd>/</kbd> search ' + MID + ' <kbd>Esc</kbd> close</div></div></aside>';
  }

  // ---------- render: list ----------
  function listPane(list) {
    var f = folder(S.folder), n = list.length;
    var head = '<div class="lh"><div class="lt"><h2>' + f.name + '</h2><span class="ln">' + n + '</span></div><div class="lsub">' + esc(f.hint) + (S.stage !== 'all' ? ' ' + MID + ' ' + esc(stShort(S.stage)) : '') + '</div>' +
      '<label class="srch">' + IC.search + '<input id="q" type="text" placeholder="Search businesses, stages and notes" value="' + esc(S.q) + '" autocomplete="off"></label></div>';
    if (!coreLoaded()) return '<section class="list">' + head + '<div class="loading"><div class="spin"></div>Loading the round from Pigment' + ELL + '</div></section>';
    var body;
    if (!n && S.folder === 'review' && !S.q) body = zeroList();
    else if (!n) body = '<div class="empty"><div class="ei">' + FOLDER_IC[f.id] + '</div><b>' + (S.q ? 'No matches' : 'Nothing here') + '</b><span>' + (S.q ? 'Nothing in ' + f.name + ' matches ' + esc(S.q) + '.' : 'Nothing is ' + f.name.toLowerCase() + ' right now.') + '</span></div>';
    else body = list.map(function (it) {
      var cm = wfc(it), unread = it.w === ST.review && !S.seen[it.id], snip = it.w === ST.returned && cm.r ? 'Returned: ' + cm.r : (cm.c || 'No note yet');
      return '<button class="row' + (it.id === S.sel ? ' sel' : '') + (unread ? ' unread' : '') + '" data-item="' + esc(it.id) + '">' + (unread ? '<span class="ud"></span>' : '') + avatar(it.e) +
        '<span class="rb"><span class="r1"><b>' + esc(it.e) + '</b>' + chip(it.w) + '</span><span class="r2">' + esc(stShort(it.st)) + (cm.o ? ' ' + MID + ' ' + esc(cm.o) : '') + '</span><span class="r3' + (it.w === ST.returned ? ' bad' : '') + '">' + esc(snip) + '</span></span></button>';
    }).join('');
    if (S.folder === 'review' && !S.q) {
      var later = items().filter(function (it) { return folder('waiting').test(it.w) && inStage(it); });
      if (later.length) body += '<div class="later">Still to come ' + MID + ' ' + later.length + ' not submitted yet</div>' + later.map(function (it) {
        var cm = wfc(it);
        return '<button class="row ghost" data-goto="' + esc(it.id) + '">' + avatar(it.e) + '<span class="rb"><span class="r1"><b>' + esc(it.e) + '</b>' + chip(it.w) + '</span><span class="r2">' + esc(stShort(it.st)) + (cm.o ? ' ' + MID + ' ' + esc(cm.o) : '') + '</span>' + (cm.c ? '<span class="r3">' + esc(cm.c) + '</span>' : '') + '</span></button>';
      }).join('');
    }
    return '<section class="list">' + head + '<div class="rows" id="rows">' + body + '</div></section>';
  }
  function zeroList() {
    var dots = '';
    for (var i = 0; i < 18; i++) dots += '<i style="left:' + ((i * 37) % 100) + '%;background:' + [C.green, C.blue, C.violet, C.gold, C.teal][i % 5] + ';animation-delay:' + (i % 6) * 0.35 + 's"></i>';
    return '<div class="zero"><div class="conf">' + dots + '</div><div class="zc"><span class="zr"></span><span class="zr r2"></span>' + IC.check + '</div><b>Inbox zero</b><span>Every submission in this round has been reviewed.</span></div>';
  }

  // ---------- render: reading pane ----------
  function readPane(list) {
    if (!coreLoaded()) return '<section class="pane" id="pane"></section>';
    var it = S.sel ? byId(S.sel) : null;
    if (!it) return '<section class="pane" id="pane">' + (S.folder === 'review' && !list.length && !S.q ? zeroPane() : '<div class="pick">' + IC.inbox + '<b>Pick a submission</b><span>Choose a business on the left to read its note and the figures behind it.</span></div>') + '</section>';
    var cm = wfc(it), l = listItems(), idx = -1;
    for (var k = 0; k < l.length; k++) if (l[k].id === it.id) idx = k;
    var nav = '<div class="pnav"><span>' + (idx >= 0 ? (idx + 1) + ' of ' + l.length : '') + '</span><button class="ib" data-move="-1" title="Previous (K)">' + IC.up + '</button><button class="ib" data-move="1" title="Next (J)">' + IC.down + '</button></div>';
    var head = '<div class="ph">' + avatar(it.e, true) + '<div class="pt"><h1>' + esc(it.e) + '</h1><div class="pm">' + esc(stShort(it.st)) + (cm.o ? ' ' + MID + ' owner ' + esc(cm.o) : '') + (S.entLoop[it.e] ? ' ' + MID + ' ' + esc(S.entLoop[it.e]) + ' Loop' : '') + '</div></div>' + chip(it.w) + nav + '</div>';
    return '<section class="pane" id="pane">' + head + actions(it) + composer(it) + '<div class="pgrid"><div class="g-t">' + thread(it) + '</div><div class="g-f">' + figures(it) + '</div><div class="g-a">' + across(it) + '</div><div class="g-m">' + roundMatrix(it) + '</div></div></section>';
  }
  function actions(it) {
    if (it.w === ST.review) return '<div class="acts"><button class="btn approve" id="doApprove">' + IC.check + 'Approve<kbd>A</kbd></button><button class="btn ret' + (S.compose && S.compose.id === it.id ? ' on' : '') + '" id="doReturn">' + IC.back + 'Return with a reason<kbd>R</kbd></button><span class="ahint">Approving signs this stage off on the workflow tracker. Returning sends it back to ' + esc(it.e) + ' with your reason.</span></div>';
    return '<div class="acts off"><span class="ic">' + IC.info + '</span>' + esc(whyNot(it)) + '</div>';
  }
  function composer(it) {
    if (!S.compose || S.compose.id !== it.id) return '';
    var chips = BRAND.reasonStarters.map(function (t, i) { return '<button class="rs" data-rs="' + i + '">' + esc(t) + '</button>'; }).join('');
    return '<div class="composer"><div class="lbl">Why are you returning it? ' + esc(it.e) + ' sees this on its step</div><div class="rss">' + chips + '</div>' +
      '<textarea id="retNote" rows="3" placeholder="Say what needs fixing before they resubmit">' + esc(S.compose.text || '') + '</textarea>' + (S.compose.err ? '<div class="merr">' + esc(S.compose.err) + '</div>' : '') +
      '<div class="mb"><span class="mk"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> to send</span><button class="btn sec sm" id="cmpCancel">Cancel</button><button class="btn danger sm" id="cmpSend">' + IC.back + 'Return to ' + esc(it.e) + '</button></div></div>';
  }
  function bubble(kind, who, role, text) { return '<div class="msg ' + kind + '"><div class="mh"><b>' + esc(who) + '</b><span>' + esc(role) + '</span></div><p>' + esc(text) + '</p></div>'; }
  function sysMsg(text, col) { return '<div class="sys"><span style="background:' + col + '"></span>' + esc(text) + '</div>'; }
  function thread(it) {
    var cm = wfc(it), who = cm.o || it.e, out = [], note = cm.c;
    if (it.w === ST.notStarted || it.w === ST.inProgress) {
      out.push(sysMsg(it.w === ST.notStarted ? it.e + ' has not started this stage.' : it.e + ' is working on this stage.', ST_COL[it.w]));
      if (note) out.push(bubble('biz', who, 'working note', note));
    } else if (it.w === ST.returned) {
      if (note) out.push(bubble('biz', who, 'submitted', note));
      out.push(bubble('grp', BRAND.reviewer, 'returned it', cm.r || 'No reason was recorded.'));
      out.push(sysMsg('Waiting for ' + it.e + ' to fix and resubmit.', C.coral));
    } else {
      if (cm.r) out.push(bubble('grp', BRAND.reviewer, 'returned it earlier', cm.r));
      out.push(bubble('biz', who, cm.r ? 'resubmitted' : 'submitted', note || 'Submitted without a note.'));
      if (it.w === ST.approved) out.push(sysMsg('Approved by ' + BRAND.reviewer.toLowerCase() + '.', C.green));
    }
    return '<div class="card"><div class="ch"><h3>Conversation</h3></div><div class="thread">' + out.join('') + '</div></div>';
  }

  // the same business across every stage of the round
  function across(it) {
    var st = S.stages.filter(function (x) { return (S.wfs[it.e] || {})[x]; });
    if (st.length < 2) return '';
    var rows = st.map(function (x) {
      var w = S.wfs[it.e][x], cm = (S.wfc[it.e] || {})[x] || {}, id = it.e + '|' + x, cur = x === it.st;
      return '<button class="ar' + (cur ? ' cur' : '') + '" data-goto="' + esc(id) + '"><span class="ad" style="background:' + (ST_COL[w] || C.cloud) + '"></span><span class="at"><b>' + esc(stShort(x)) + '</b><small>' + esc(w === ST.returned && cm.r ? 'Returned: ' + cm.r : cm.c || 'No note yet') + '</small></span>' + chip(w) + '</button>';
    }).join('');
    return '<div class="card"><div class="ch"><h3>' + esc(it.e) + ' across the round</h3></div><div class="arl">' + rows + '</div></div>';
  }

  // every business and stage of the round in one grid; each cell opens that submission
  function roundMatrix(it) {
    var er = function (e) { var i = S.ents.indexOf(e); return i < 0 ? 99 : i; };
    var ents = Object.keys(S.wfs).sort(function (a, b) { return er(a) - er(b) || a.localeCompare(b); });
    var head = '<tr><th>Business</th>' + S.stages.map(function (st) { return '<th>' + esc(stShort(st)) + '</th>'; }).join('') + '</tr>';
    var rows = ents.map(function (e) {
      return '<tr><td><span class="mn">' + avatar(e, false, true) + esc(e) + '</span></td>' + S.stages.map(function (st) {
        var w = (S.wfs[e] || {})[st]; if (!w) return '<td class="na">' + DASH + '</td>';
        var id = e + '|' + st;
        return '<td><button class="mc' + (id === it.id ? ' cur' : '') + '" data-goto="' + esc(id) + '" style="background:' + (ST_COL[w] || C.cloud) + ';color:' + inkOn(w) + '">' + esc(w) + '</button></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="card"><div class="ch"><h3>The whole round</h3><span class="tag">click any cell to open it</span></div><div class="tw"><table class="tb mx"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  // ---------- "What's in it" ----------
  function viewOf(st) { return BRAND.stageViews[S.stages.indexOf(st)] || 'pl'; }
  function figures(it) {
    var v = viewOf(it.st), f = v === 'schemes' ? schemesFig(it.e) : v === 'sectors' ? sectorsFig() : plFig(it.e);
    return '<div class="card fig"><div class="ch"><h3>What is in it</h3><span class="tag">next 12 months ' + MID + ' ' + esc(V) + '</span></div>' + (f.look ? '<div class="look"><span class="ic">' + IC.spark + '</span><p>' + f.look + '</p></div>' : '') + f.html + '</div>';
  }
  function loadingFig(t) { return { html: '<div class="loading sm"><div class="spin"></div>' + t + '</div>' }; }
  function bar(v, mx, col) { var w = isNum(v) && mx ? Math.max(2, Math.round(Math.abs(v) / mx * 100)) : 0; return '<span class="hb"><i style="width:' + w + '%;background:' + col + '"></i></span>'; }
  function mchip(m) { var c = !isNum(m) ? C.cloud : m >= 0.2 ? C.pine : m >= 0.12 ? C.jade : m >= 0.08 ? C.amber : C.coral; return '<span class="chip" style="background:' + c + '">' + pct(m) + '</span>'; }
  function schemesFig(e) {
    if (!S.loaded.dsSch || !S.loaded.dsSchEnt) return loadingFig('Loading schemes' + ELL);
    var rows = Object.keys(S.schEnt).filter(function (s) { return S.schEnt[s] === e && S.sch[s]; }).sort(function (a, b) { return (S.sch[b].rev || 0) - (S.sch[a].rev || 0); });
    if (!rows.length) return { html: '<div class="empty sm">No schemes for ' + esc(e) + ' in the scheme register.</div>' };
    var tr = 0, tg = 0, mx = 0; rows.forEach(function (s) { tr += S.sch[s].rev || 0; tg += S.sch[s].gp || 0; mx = Math.max(mx, S.sch[s].rev || 0); });
    var low = rows.slice().sort(function (a, b) { return div(S.sch[a].gp, S.sch[a].rev) - div(S.sch[b].gp, S.sch[b].rev); })[0], big = rows[0];
    var look = esc(big) + ' brings ' + pct(div(S.sch[big].rev, tr), 0) + ' of ' + esc(e) + '’s scheme revenue. ' + (rows.length > 1 ? 'Lowest margin: ' + esc(low) + ' at ' + pct(div(S.sch[low].gp, S.sch[low].rev)) + ', against ' + pct(div(tg, tr)) + ' across its schemes.' : 'Margin ' + pct(div(tg, tr)) + '.');
    var body = rows.map(function (s) { var o = S.sch[s]; return '<tr><td><b>' + esc(s) + '</b>' + bar(o.rev, mx, C.cloud) + '</td><td class="num">' + mf(o.rev) + '</td><td class="num">' + mf(o.gp) + '</td><td class="num">' + mchip(div(o.gp, o.rev)) + '</td></tr>'; }).join('');
    return { look: look, html: '<div class="tw"><table class="tb"><thead><tr><th>Scheme</th><th>Revenue</th><th>Gross profit</th><th>Margin</th></tr></thead><tbody>' + body + '<tr class="tot"><td>' + rows.length + ' scheme' + (rows.length > 1 ? 's' : '') + '</td><td class="num">' + mf(tr) + '</td><td class="num">' + mf(tg) + '</td><td class="num">' + pct(div(tg, tr)) + '</td></tr></tbody></table></div>' };
  }
  function sectorsFig() {
    if (!S.loaded.dsMS) return loadingFig('Loading sectors' + ELL);
    if (!S.sectors.length) return { html: '<div class="empty sm">No sector figures yet.</div>' };
    var t = { rev: 0, gp: 0, inc: 0, rec: 0 }, worst = null, mx = 0;
    S.sectors.forEach(function (k) { var o = S.ms[k]; t.rev += o.rev || 0; t.gp += o.gp || 0; t.inc += o.inc || 0; t.rec += o.rec || 0; mx = Math.max(mx, o.inc || 0); if (!worst || (o.inc - o.rec) > (S.ms[worst].inc - S.ms[worst].rec)) worst = k; });
    var look = 'Cost increases of ' + mf(t.inc) + ': ' + mf(t.rec) + ' (' + pct(div(t.rec, t.inc), 0) + ') passed on to customers, ' + mf(t.inc - t.rec) + ' absorbed. ' + esc(worst) + ' absorbs the most: ' + mf(S.ms[worst].inc - S.ms[worst].rec) + '.';
    var body = S.sectors.map(function (k) { var o = S.ms[k]; return '<tr><td><b>' + esc(k) + '</b><span class="hb two"><i style="width:' + Math.round((o.inc || 0) / (mx || 1) * 100) + '%;background:' + C.coral + '"></i><i style="width:' + Math.round((o.rec || 0) / (mx || 1) * 100) + '%;background:' + C.jade + '"></i></span></td><td class="num">' + mf(o.rev) + '</td><td class="num">' + mchip(div(o.gp, o.rev)) + '</td><td class="num">' + mf(o.inc) + '</td><td class="num">' + mf(o.rec) + '</td><td class="num neg">' + mf(o.inc - o.rec) + '</td></tr>'; }).join('');
    return { look: look, html: '<div class="tw"><table class="tb"><thead><tr><th>Sector</th><th>Revenue</th><th>Margin</th><th>Cost increase</th><th>Passed on</th><th>Absorbed</th></tr></thead><tbody>' + body + '<tr class="tot"><td>All sectors</td><td class="num">' + mf(t.rev) + '</td><td class="num">' + pct(div(t.gp, t.rev)) + '</td><td class="num">' + mf(t.inc) + '</td><td class="num">' + mf(t.rec) + '</td><td class="num neg">' + mf(t.inc - t.rec) + '</td></tr></tbody></table></div><div class="leg2"><span><i style="background:' + C.coral + '"></i>Cost increase</span><span><i style="background:' + C.jade + '"></i>Passed on</span></div>' };
  }
  function plFig(e) {
    if (!S.loaded.dsEnt) return loadingFig('Loading the P&L' + ELL);
    var o = S.ent[e] || {}, ls = S.lines; if (!ls.length) return { html: '<div class="empty sm">No P&L figures yet.</div>' };
    var run = 0, sub = {}, mx = 0;
    ls.forEach(function (l, i) { var v = o[l]; if (!isNum(v)) return; mx = Math.max(mx, Math.abs(v)); if (i > 1 && Math.abs(v - run) < 1) sub[l] = 1; else run += v; });
    var rev = o[ls[0]], last = o[ls[ls.length - 1]], gl = ls.filter(function (l) { return sub[l]; })[0];
    var gRev = 0, gLast = 0; Object.keys(S.ent).forEach(function (x) { gRev += S.ent[x][ls[0]] || 0; gLast += S.ent[x][ls[ls.length - 1]] || 0; });
    var look = isNum(rev) && rev ? esc(ls[ls.length - 1]) + ' ' + mf(last) + ' at ' + pct(div(last, rev)) + ' of revenue, against ' + pct(div(gLast, gRev)) + ' for the group' + (gl ? '; ' + esc(gl).toLowerCase() + ' margin ' + pct(div(o[gl], rev)) : '') + '.' : 'No revenue: ' + esc(ls[ls.length - 1]) + ' ' + mf(last) + ' is central cost.';
    var body = ls.map(function (l) { var v = o[l]; return '<tr class="' + (sub[l] ? 'tot' : '') + '"><td>' + esc(l) + (sub[l] ? '' : bar(v, mx, v < 0 ? C.coral : C.blue)) + '</td><td class="num">' + mf(v) + '</td><td class="num mu">' + (isNum(rev) && rev ? pct(div(v, rev)) : DASH) + '</td></tr>'; }).join('');
    return { look: look, html: '<div class="tw"><table class="tb"><thead><tr><th>Line</th><th>Next 12 months</th><th>% of revenue</th></tr></thead><tbody>' + body + '</tbody></table></div>' };
  }
  function zeroPane() {
    var r = count('returned'), w = count('waiting'), a = count('approved');
    return '<div class="zp"><div class="zpc">' + IC.spark + '</div><h1>Nothing waiting for you</h1><p>Every submission in this round has been reviewed. Here is where the rest stand.</p>' +
      '<div class="zs"><button class="zst" data-folder="approved"><b style="color:' + C.greenInk + '">' + a + '</b><span>approved</span></button><button class="zst" data-folder="returned"><b style="color:' + C.red + '">' + r + '</b><span>back with the business</span></button><button class="zst" data-folder="waiting"><b>' + w + '</b><span>not submitted yet</span></button></div></div>';
  }

  // ---------- render ----------
  function header() {
    return '<header class="top"><div class="brand">' + BRAND.logo + '<span class="wm">' + esc(BRAND.name) + '</span><span class="sep"></span><span class="ttl">' + esc(BRAND.product) + '</span></div>' +
      '<div class="meta"><span class="pill">' + esc(BRAND.round) + '</span><span class="pill ghost">' + esc(V) + '</span></div>' +
      '<div class="acts2">' + (coreLoaded() ? '<span class="tp"><b>' + count('review') + '</b> to review ' + MID + ' ' + pct(roundPct(), 0) + ' round progress</span>' : '') + '<button class="btn ghost" id="resetBtn" title="Write every status and reason you changed back to where it started">' + IC.reset + 'Reset</button></div></header>';
  }
  function render() {
    if (disposed) return;
    var rows = $('rows'), pane = $('pane'), rs = rows ? rows.scrollTop : 0, ps = pane ? pane.scrollTop : 0, keepPane = S._lastSel === S.sel;
    var list = coreLoaded() ? listItems() : [];
    if (coreLoaded() && (!S.sel || !list.some(function (x) { return x.id === S.sel; }))) S.sel = list.length ? list[0].id : null;
    if (S.sel) S.seen[S.sel] = true;
    var errs = Object.keys(S.errors).map(function (k) { return S.errors[k]; });
    root.innerHTML = '<div class="app">' + header() + (errs.length ? '<div class="errs">' + errs.map(esc).join('<br>') + '</div>' : '') +
      '<div class="body">' + rail() + listPane(list) + readPane(list) + '</div>' +
      (S.busy ? '<div class="busy"><span class="spin sm"></span>' + esc(S.busy) + '</div>' : '') +
      (S.toast ? '<div class="toast ' + S.toast.kind + '">' + esc(S.toast.text) + '</div>' : '') + '</div>';
    var r2 = $('rows'), p2 = $('pane'); if (r2) r2.scrollTop = rs; if (p2 && keepPane) p2.scrollTop = ps;
    S._lastSel = S.sel;
  }

  // ---------- events ----------
  function onClick(e) {
    var t = e.target.closest ? e.target.closest('button') : null; if (!t || !root.contains(t)) return;
    var d = t.dataset;
    if (t.id === 'resetBtn') { resetAll(); return; }
    if (t.id === 'doApprove') { approve(byId(S.sel)); return; }
    if (t.id === 'doReturn') { if (S.compose) { S.compose = null; render(); } else openCompose(byId(S.sel)); return; }
    if (t.id === 'cmpCancel') { S.compose = null; render(); return; }
    if (t.id === 'cmpSend') { sendReturn(); return; }
    if (d.rs != null && S.compose) { var ta = $('retNote'), cur = ta ? ta.value.trim() : ''; var add = BRAND.reasonStarters[+d.rs] || ''; S.compose.text = cur ? cur + ' ' + add : add; S.compose.err = null; render(); timer(function () { var t2 = $('retNote'); if (t2) { t2.focus(); t2.setSelectionRange(t2.value.length, t2.value.length); } }, 20); return; }
    if (d.folder) { S.folder = d.folder; S.sel = null; S.compose = null; render(); return; }
    if (d.stage) { S.stage = d.stage; S.sel = null; S.compose = null; render(); return; }
    if (d.item) { if (S.sel !== d.item) S.compose = null; S.sel = d.item; render(); return; }
    if (d.move) { move(+d.move); return; }
    if (d['goto']) { var g = byId(d['goto']); if (g) { var f = folder(S.folder); if (!f.test(g.w) || !inStage(g)) { S.folder = 'all'; S.stage = 'all'; } S.q = ''; S.sel = g.id; S.compose = null; render(); } return; }
  }
  function onInput(e) {
    var t = e.target;
    if (t.id === 'q') { S.q = t.value; var pos = t.selectionStart; S.sel = null; render(); var q2 = $('q'); if (q2) { q2.focus(); try { q2.setSelectionRange(pos, pos); } catch (er) { } } return; }
    if (t.id === 'retNote' && S.compose) { S.compose.text = t.value; if (S.compose.err) { S.compose.err = null; } }
  }
  function onKey(e) {
    var t = e.target, inField = t && t.tagName && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT');
    if (e.key === 'Escape') { if (S.compose) { S.compose = null; render(); } else if (inField) { t.blur(); } return; }
    if (inField) { if (t.id === 'retNote' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); sendReturn(); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = String(e.key || '').toLowerCase();
    if (k === 'j' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (k === 'k' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (k === 'a') { e.preventDefault(); approve(byId(S.sel)); }
    else if (k === 'r') { e.preventDefault(); openCompose(byId(S.sel)); }
    else if (k === '/') { e.preventDefault(); var q = $('q'); if (q) q.focus(); }
  }

  // ---------- styles ----------
  var css = document.createElement('style');
  css.textContent = [
    '.app{--navy:' + C.navy + ';--navy2:' + C.navy2 + ';--blue:' + C.blue + ';--blue-soft:' + C.blueSoft + ';--green:' + C.green + ';--green-ink:' + C.greenInk + ';--amber-soft:' + C.amberSoft + ';--red:' + C.red + ';--red-soft:' + C.redSoft + ';--ink:' + C.ink + ';--mut:' + C.mut + ';--line:' + C.line + ';--bg:' + C.bg + ';--fs-xs:11px;--fs-s:12px;--fs-m:13px;--fs-b:14px;--fs-l:20px;--fs-xl:26px;font-family:' + FONT + ';font-size:var(--fs-m);line-height:1.4;color:var(--ink);background:var(--bg);height:100%;display:flex;flex-direction:column;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased}',
    '.app *{box-sizing:border-box}.app h1,.app h2,.app h3,.app p{font-family:inherit;margin:0}',
    '.top{flex:none;display:flex;align-items:center;gap:18px;height:56px;padding:0 20px;background:var(--navy);color:#ffffff}',
    '.brand{display:flex;align-items:center;gap:10px;min-width:0}.wm{font-weight:700;font-size:16px;letter-spacing:.01em}.sep{width:1px;height:22px;background:rgba(255,255,255,.25)}.ttl{font-size:var(--fs-b);opacity:.9;white-space:nowrap}',
    '.meta{display:flex;gap:8px;flex:1;min-width:0;overflow:hidden}.pill{font-size:var(--fs-s);font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.16);white-space:nowrap}.pill.ghost{background:none;font-weight:500;border:1px solid rgba(255,255,255,.24);color:rgba(255,255,255,.88)}',
    '.acts2{display:flex;align-items:center;gap:14px;flex:none}.tp{font-size:var(--fs-s);color:rgba(255,255,255,.85);white-space:nowrap}.tp b{color:#ffffff;font-size:var(--fs-b)}',
    '.btn{display:inline-flex;align-items:center;gap:7px;border:1px solid transparent;border-radius:10px;padding:8px 14px;font:inherit;font-size:var(--fs-m);font-weight:600;cursor:pointer;line-height:1.1;white-space:nowrap}.btn.sm{padding:6px 10px;font-size:var(--fs-s)}',
    '.btn.ghost{background:transparent;color:#ffffff;border-color:rgba(255,255,255,.35)}.btn.ghost:hover{background:rgba(255,255,255,.1)}',
    '.btn.sec{background:#ffffff;color:var(--navy);border-color:var(--line)}.btn.sec:hover{border-color:var(--blue);color:var(--blue)}',
    '.btn.approve{background:var(--green);color:' + C.navy2 + '}.btn.approve:hover{filter:brightness(1.05)}',
    '.btn.ret{background:#ffffff;color:var(--red);border-color:#F5B5B7}.btn.ret:hover,.btn.ret.on{background:var(--red-soft)}',
    '.btn.danger{background:var(--red);color:#ffffff}.btn.danger:hover{filter:brightness(1.05)}',
    '.btn kbd{margin-left:4px}kbd{display:inline-block;min-width:18px;padding:1px 5px;border-radius:5px;border:1px solid var(--line);border-bottom-width:2px;background:#ffffff;color:var(--mut);font-family:inherit;font-size:var(--fs-xs);font-weight:700;text-align:center;line-height:1.4}',
    '.btn.approve kbd,.btn.danger kbd{background:rgba(255,255,255,.35);border-color:rgba(0,0,0,.12);color:inherit}',
    '.errs{margin:10px 20px 0;padding:8px 12px;background:var(--red-soft);color:var(--red);border-radius:10px;font-size:var(--fs-s)}',
    '.body{flex:1;min-height:0;display:grid;grid-template-columns:236px 400px minmax(0,1fr)}',
    '.rail{background:#ffffff;border-right:1px solid var(--line);padding:16px 12px;overflow:auto;display:flex;flex-direction:column;gap:6px}',
    '.rh{font-size:var(--fs-xs);font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);margin:6px 8px 4px}',
    '.fds{display:flex;flex-direction:column;gap:2px}.fd{display:flex;align-items:center;gap:10px;border:0;background:none;border-radius:10px;padding:9px 10px;font:inherit;font-size:var(--fs-b);color:var(--ink);cursor:pointer;text-align:left}.fd:hover{background:var(--bg)}.fd.on{background:var(--blue-soft);color:var(--blue);font-weight:600}',
    '.fi{display:inline-flex;flex:none}.fn{flex:1;min-width:0}.fc{font-size:var(--fs-s);font-weight:700;color:var(--mut);min-width:22px;text-align:center;padding:1px 7px;border-radius:999px}.fc.hot{background:var(--blue);color:#ffffff}',
    '.sfs{display:flex;flex-wrap:wrap;gap:6px;padding:0 4px}.sf{border:1px solid var(--line);background:#ffffff;border-radius:999px;padding:5px 10px;font:inherit;font-size:var(--fs-s);font-weight:600;color:var(--navy);cursor:pointer}.sf:hover{border-color:var(--blue)}.sf.on{background:var(--navy);border-color:var(--navy);color:#ffffff}',
    '.rcard{margin:12px 4px 0;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--bg)}.rch{display:flex;justify-content:space-between;align-items:baseline;font-size:var(--fs-s);color:var(--mut);margin-bottom:8px}.rch b{font-size:var(--fs-l);color:var(--navy)}',
    '.pbar{display:flex;gap:2px;height:10px;border-radius:999px;overflow:hidden;background:#ffffff}.pbar i{display:block;height:100%}.rleg{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:8px;font-size:var(--fs-xs);color:var(--mut)}.rleg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}.rleg b{color:var(--ink)}',
    '.keys{margin:auto 4px 0;padding-top:14px;font-size:var(--fs-s);color:var(--mut);display:flex;flex-direction:column;gap:5px}.keys .rh{margin:0 0 2px}.keys kbd{margin-right:3px}',
    '.list{display:flex;flex-direction:column;min-height:0;background:#ffffff;border-right:1px solid var(--line)}',
    '.lh{padding:16px 16px 12px;border-bottom:1px solid var(--line)}.lt{display:flex;align-items:center;gap:8px}.lt h2{font-size:var(--fs-l);font-weight:700;color:var(--navy)}.ln{font-size:var(--fs-s);font-weight:700;color:var(--mut);background:var(--bg);border-radius:999px;padding:2px 8px}.lsub{font-size:var(--fs-s);color:var(--mut);margin:2px 0 10px}',
    '.srch{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:10px;padding:0 10px;color:var(--mut);background:var(--bg)}.srch:focus-within{border-color:var(--blue);background:#ffffff}.srch input{flex:1;border:0;background:none;font:inherit;font-size:var(--fs-m);padding:8px 0;color:var(--ink);outline:none;min-width:0}',
    '.rows{flex:1;overflow:auto}',
    '.row{position:relative;display:flex;gap:12px;width:100%;border:0;border-bottom:1px solid ' + C.lineSoft + ';border-left:3px solid transparent;background:#ffffff;padding:12px 14px 12px 15px;font:inherit;text-align:left;cursor:pointer;color:var(--ink)}.row:hover{background:' + C.rowHover + '}.row.sel{background:var(--blue-soft);border-left-color:var(--blue)}',
    '.ud{position:absolute;left:5px;top:22px;width:7px;height:7px;border-radius:50%;background:var(--blue)}.row.unread .r1 b{font-weight:800}',
    '.av{flex:none;width:36px;height:36px;border-radius:50%;color:#ffffff;font-weight:700;font-size:var(--fs-s);display:flex;align-items:center;justify-content:center;letter-spacing:.02em}.av.big{width:52px;height:52px;font-size:var(--fs-b)}',
    '.rb{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.r1{display:flex;justify-content:space-between;align-items:center;gap:8px}.r1 b{font-size:var(--fs-b);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.r2{font-size:var(--fs-s);color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.r3{font-size:var(--fs-s);color:var(--ink);opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.r3.bad{color:var(--red);opacity:1}',
    '.chip{display:inline-block;color:#ffffff;border-radius:999px;padding:2px 9px;font-weight:600;font-size:var(--fs-s);white-space:nowrap;flex:none}',
    '.pane{overflow:auto;padding:20px 24px 28px;min-width:0}',
    '.ph{display:flex;align-items:center;gap:14px;margin-bottom:14px}.pt{flex:1;min-width:0}.pt h1{font-size:var(--fs-xl);font-weight:700;color:var(--navy);line-height:1.15}.pm{font-size:var(--fs-b);color:var(--mut);margin-top:2px}',
    '.pnav{display:flex;align-items:center;gap:6px;margin-left:8px;font-size:var(--fs-s);color:var(--mut)}.pnav span{margin-right:4px;white-space:nowrap}.ib{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:#ffffff;color:var(--navy);cursor:pointer}.ib:hover{border-color:var(--blue);color:var(--blue)}',
    '.acts{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:12px 14px;background:#ffffff;border:1px solid var(--line);border-radius:14px;margin-bottom:14px}.ahint{flex:1;min-width:220px;font-size:var(--fs-s);color:var(--mut)}',
    '.acts.off{color:var(--mut);font-size:var(--fs-b);gap:10px}.acts .ic{color:var(--blue);display:inline-flex}',
    '.composer{background:#ffffff;border:1px solid #F5B5B7;border-left:4px solid var(--red);border-radius:14px;padding:14px 16px;margin-bottom:14px}.lbl{font-size:var(--fs-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:8px}',
    '.rss{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.rs{border:1px dashed ' + C.cloud + ';background:var(--bg);border-radius:999px;padding:5px 10px;font:inherit;font-size:var(--fs-s);color:var(--ink);cursor:pointer;text-align:left}.rs:hover{border-color:var(--red);color:var(--red)}',
    '.composer textarea{width:100%;border:1px solid ' + C.amberLine + ';background:var(--amber-soft);border-radius:10px;padding:10px 12px;font:inherit;font-size:var(--fs-b);resize:vertical;color:var(--ink)}.composer textarea:focus{outline:2px solid var(--blue);outline-offset:1px}',
    '.merr{margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--red-soft);color:var(--red);font-size:var(--fs-s);font-weight:600}.mb{display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:10px}.mk{flex:1;font-size:var(--fs-s);color:var(--mut)}',
    '.pgrid{display:grid;grid-template-columns:minmax(0,1fr);grid-template-areas:"t" "f" "a" "m";gap:14px;align-items:start}.g-m{grid-area:m;min-width:0}.g-t{grid-area:t;min-width:0}.g-f{grid-area:f;min-width:0}.g-a{grid-area:a;min-width:0}.g-a:empty{display:none}',
    '.av.sm{width:24px;height:24px;font-size:10px;margin-right:8px}.mn{display:inline-flex;align-items:center;font-weight:600}.tb.mx td{padding:5px 8px}.tb.mx th{text-align:center}.tb.mx th:first-child{text-align:left}.tb.mx td.na{text-align:center;color:' + C.cloud + '}',
    '.mc{display:block;width:100%;min-width:110px;border:2px solid transparent;border-radius:8px;padding:6px 8px;font:inherit;font-size:var(--fs-s);font-weight:600;cursor:pointer;text-align:center}.mc:hover{filter:brightness(1.06)}.mc.cur{border-color:var(--navy);box-shadow:0 0 0 2px #ffffff inset}',
    '.later{padding:14px 16px 6px;font-size:var(--fs-xs);font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);border-top:1px solid var(--line)}.row.ghost{opacity:.62}.row.ghost:hover{opacity:1}',
    '.arl{display:flex;flex-direction:column;gap:6px}.ar{display:flex;align-items:center;gap:10px;width:100%;border:1px solid var(--line);border-radius:10px;background:#ffffff;padding:8px 10px;font:inherit;text-align:left;cursor:pointer;color:var(--ink)}.ar:hover{border-color:var(--blue)}.ar.cur{background:var(--blue-soft);border-color:var(--blue-soft)}.ad{flex:none;width:9px;height:9px;border-radius:50%}.at{flex:1;min-width:0;display:flex;flex-direction:column}.at b{font-size:var(--fs-m)}.at small{font-size:var(--fs-s);color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.card{background:#ffffff;border:1px solid var(--line);border-radius:14px;padding:16px;min-width:0;box-shadow:0 1px 2px rgba(16,40,58,.05)}.ch{display:flex;align-items:center;gap:10px;margin-bottom:12px}.ch h3{flex:1;font-size:var(--fs-b);font-weight:700}',
    '.tag{font-size:var(--fs-xs);font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:var(--bg);color:var(--mut);white-space:nowrap}',
    '.thread{display:flex;flex-direction:column;gap:10px}.msg{max-width:78%;padding:10px 12px;border-radius:14px;border:1px solid var(--line);background:var(--bg)}.msg.biz{align-self:flex-start;border-top-left-radius:4px}.msg.grp{align-self:flex-end;background:var(--red-soft);border-color:#F5B5B7;border-top-right-radius:4px}',
    '.mh{display:flex;gap:8px;align-items:baseline;margin-bottom:4px;font-size:var(--fs-s)}.mh b{color:var(--navy)}.msg.grp .mh b{color:var(--red)}.mh span{color:var(--mut)}.msg p{font-size:var(--fs-b);line-height:1.5}',
    '.sys{align-self:center;display:inline-flex;align-items:center;gap:8px;font-size:var(--fs-s);color:var(--mut);background:#ffffff;border:1px solid var(--line);border-radius:999px;padding:4px 12px}.sys span{width:8px;height:8px;border-radius:50%}',
    '.look{display:flex;gap:10px;align-items:flex-start;background:var(--blue-soft);border-radius:10px;padding:10px 12px;margin-bottom:12px}.look .ic{color:var(--blue);flex:none;padding-top:2px;display:inline-flex}.look p{font-size:var(--fs-m);line-height:1.5;color:var(--navy)}',
    '.tw{overflow:auto}.tb{width:100%;border-collapse:separate;border-spacing:0;font-size:var(--fs-m)}.tb th{font-size:var(--fs-xs);font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--mut);text-align:right;padding:7px 8px;border-bottom:1px solid var(--line);white-space:nowrap}.tb th:first-child{text-align:left}',
    '.tb td{padding:7px 8px;border-bottom:1px solid ' + C.lineSoft + ';vertical-align:middle}.tb td:first-child{min-width:150px}.num{text-align:right;white-space:nowrap}.mu{color:var(--mut)}.neg{color:var(--red)}.tb tr.tot td{background:var(--bg);font-weight:700;border-top:1px solid var(--line)}',
    '.hb{display:block;height:5px;border-radius:3px;background:var(--bg);margin-top:5px;overflow:hidden;max-width:220px}.hb i{display:block;height:100%;border-radius:3px}.hb.two{height:9px;display:flex;flex-direction:column;gap:1px;background:none}.hb.two i{height:4px}',
    '.leg2{display:flex;gap:14px;margin-top:10px;font-size:var(--fs-s);color:var(--mut)}.leg2 i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:-1px}',
    '.empty{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:48px 24px;color:var(--mut)}.empty b{color:var(--ink);font-size:var(--fs-b)}.empty .ei{color:' + C.cloud + ';transform:scale(1.8);margin-bottom:8px}.empty.sm{padding:18px}',
    '.pick{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--mut);text-align:center}.pick b{color:var(--ink);font-size:var(--fs-b)}.pick svg{transform:scale(2);margin-bottom:14px;color:' + C.cloud + '}',
    '.zero{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:56px 24px 40px;color:var(--mut)}.zero b{font-size:var(--fs-l);color:var(--navy)}',
    '.zc{position:relative;width:76px;height:76px;border-radius:50%;background:var(--green);color:' + C.navy2 + ';display:flex;align-items:center;justify-content:center;margin-bottom:12px}.zc svg{transform:scale(2.2)}.zr{position:absolute;inset:0;border-radius:50%;border:2px solid var(--green);animation:ring 2.2s ease-out infinite}.zr.r2{animation-delay:1.1s}@keyframes ring{from{transform:scale(1);opacity:.7}to{transform:scale(1.9);opacity:0}}',
    '.conf{position:absolute;inset:0;pointer-events:none}.conf i{position:absolute;top:-10px;width:7px;height:11px;border-radius:2px;opacity:.85;animation:fall 3.2s linear infinite}@keyframes fall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(320px) rotate(300deg);opacity:0}}',
    '.zp{max-width:560px;margin:48px auto 0;text-align:center}.zpc{display:inline-flex;color:var(--green);transform:scale(2.4);margin-bottom:22px}.zp h1{font-size:var(--fs-xl);color:var(--navy);margin-bottom:6px}.zp p{color:var(--mut);font-size:var(--fs-b)}',
    '.zs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px}.zst{border:1px solid var(--line);background:#ffffff;border-radius:14px;padding:14px 10px;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:2px;color:var(--mut);font-size:var(--fs-s)}.zst:hover{border-color:var(--blue)}.zst b{font-size:var(--fs-xl);color:var(--navy)}',
    '.loading{display:flex;gap:12px;align-items:center;justify-content:center;min-height:200px;color:var(--mut);font-size:var(--fs-b)}.loading.sm{min-height:0;padding:24px}.spin{width:20px;height:20px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--blue);animation:sp 1s linear infinite;display:inline-block}.spin.sm{width:14px;height:14px;border-width:2px;border-color:rgba(255,255,255,.35);border-top-color:#ffffff}@keyframes sp{to{transform:rotate(360deg)}}',
    '.busy{position:fixed;left:50%;top:66px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;background:var(--navy2);color:#ffffff;padding:8px 16px;border-radius:999px;font-size:var(--fs-m);z-index:50;box-shadow:0 8px 24px rgba(0,30,50,.25)}',
    '.toast{position:fixed;right:20px;bottom:20px;max-width:460px;padding:12px 16px;border-radius:12px;color:#ffffff;z-index:60;box-shadow:0 10px 30px rgba(0,30,50,.25);font-size:var(--fs-m);line-height:1.45}.toast.ok{background:' + C.greenInk + '}.toast.err{background:var(--red)}',
    '@media (prefers-reduced-motion:reduce){.zr,.conf i,.spin{animation:none}}',
    '@media (min-width:1680px){.pgrid{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);grid-template-areas:"t f" "a f" "m m"}}',
    '@media (max-width:1280px){.meta{display:none}}',
    '@media (max-width:1100px){.body{grid-template-columns:340px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}.rail{grid-column:1/-1;flex-direction:row;flex-wrap:wrap;align-items:center;border-right:0;border-bottom:1px solid var(--line);padding:8px 12px;gap:8px}.rail .rh,.rcard,.keys{display:none}.fds{flex-direction:row;flex-wrap:wrap}.fd{padding:6px 10px;font-size:var(--fs-m)}.tp{display:none}}',
    '@media (max-width:760px){.app{overflow:auto}.body{display:flex;flex-direction:column;flex:none;min-height:auto}.rail,.list,.pane{flex:none}.list{border-right:0;border-bottom:1px solid var(--line)}.rows{flex:none;max-height:42vh}.pane{overflow:visible;padding:14px}.top{padding:0 12px;gap:10px}.ttl,.sep{display:none}.ph{flex-wrap:wrap}.pt{flex-basis:calc(100% - 70px)}.pnav{margin-left:auto}}'
  ].join('\n');
  document.head.appendChild(css);

  on(root, 'click', onClick);
  on(root, 'input', onInput);
  on(document, 'keydown', onKey);

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
