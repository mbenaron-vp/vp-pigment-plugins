// Mock Pigment SDK for the Reconomy world design page and harness only (illustrative data shaped like the live model).
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  var V = 'Forecast Nov 26';
  // Entity list: [name, Loop, Currency, Country, Planning Method] (mirrors the live Entity list properties)
  var ENT = [
    ['Reconomy UK', 'Recycle', 'GBP', 'United Kingdom', 'Driver engine - managed services'],
    ['Recycle North America', 'Recycle', 'USD', 'United States', 'Top-down'],
    ['Valpak', 'Comply', 'GBP', 'United Kingdom', 'Driver engine - compliance schemes'],
    ['Noventiz', 'Comply', 'EUR', 'Germany', 'Driver engine - compliance schemes'],
    ['RLG', 'Comply', 'EUR', 'Germany', 'Driver engine - compliance schemes'],
    ['Advanced Supply Chain', 'Re-use', 'GBP', 'United Kingdom', 'Top-down'],
    ['Cycleon', 'Re-use', 'EUR', 'Netherlands', 'Top-down'],
    ['Group central', 'Central', 'GBP', 'United Kingdom', 'Top-down']
  ];
  // Scheme list: [name, Entity, Country, Stream] (mirrors the live Scheme list properties)
  var SCH = [
    ['Valpak packaging compliance', 'Valpak', 'United Kingdom', 'Packaging'],
    ['Valpak WEEE compliance', 'Valpak', 'United Kingdom', 'WEEE'],
    ['Valpak battery compliance', 'Valpak', 'United Kingdom', 'Batteries'],
    ['Noventiz dual system licensing', 'Noventiz', 'Germany', 'Packaging'],
    ['Noventiz online licensing', 'Noventiz', 'Germany', 'Packaging'],
    ['RLG WEEE take-back', 'RLG', 'Germany', 'WEEE'],
    ['RLG battery take-back', 'RLG', 'Europe', 'Batteries'],
    ['RLG deposit clearing', 'RLG', 'Germany', 'Deposit return'],
    ['RLG packaging compliance Austria', 'RLG', 'Austria', 'Packaging'],
    ['RLG OEM returns programmes', 'RLG', 'Worldwide', 'Returns']
  ];
  // Next 12 months, pounds: scheme revenue and gross profit (close to the live baseline)
  var SCHV = {
    'Valpak packaging compliance': [194.6e6, 17.8e6], 'RLG OEM returns programmes': [86.4e6, 16.2e6], 'Noventiz dual system licensing': [74.9e6, 11.7e6],
    'RLG battery take-back': [60.7e6, 9.0e6], 'RLG WEEE take-back': [58.0e6, 11.3e6], 'Valpak WEEE compliance': [28.3e6, 5.2e6],
    'RLG packaging compliance Austria': [24.1e6, 5.1e6], 'Valpak battery compliance': [13.0e6, 2.5e6], 'RLG deposit clearing': [11.7e6, 3.2e6], 'Noventiz online licensing': [10.1e6, 2.1e6]
  };
  // Entity P&L, next 12 months: [revenue, gross profit, adjusted EBITDA] (close to the live baseline)
  var ENTV = {
    'Reconomy UK': [394.43e6, 98.23e6, 43.55e6], 'RLG': [240.96e6, 52.4e6, 21.92e6], 'Valpak': [235.93e6, 27.9e6, 13.69e6], 'Recycle North America': [209.65e6, 46.1e6, 15.28e6],
    'Advanced Supply Chain': [178.52e6, 51.8e6, 7.18e6], 'Noventiz': [84.99e6, 14.1e6, 10.92e6], 'Cycleon': [72.4e6, 23.2e6, 3.59e6], 'Group central': [0, 0, -31.37e6]
  };
  var LINES = ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'];
  function entLines(e) { var x = ENTV[e], r = x[0], gp = x[1], eb = x[2], oh = eb - gp; return [r, gp - r, gp, oh * 0.7, oh * 0.1, oh * 0.2, eb]; }
  var STAGES = ['1 Compliance scheme drivers', '2 Managed services drivers', '3 Group forecast and commentary'];
  var WF = { 'Valpak': ['Approved', null, 'Approved'], 'Noventiz': ['Submitted', null, 'Submitted'], 'RLG': ['Returned', null, 'Not started'], 'Reconomy UK': [null, 'In progress', 'In progress'], 'Recycle North America': [null, null, 'Submitted'], 'Advanced Supply Chain': [null, null, 'Returned'], 'Cycleon': [null, null, 'Submitted'], 'Group central': [null, null, 'Approved'] };
  var OWN = { 'Reconomy UK': 'UK Recycle finance manager', 'Recycle North America': 'North America controller', 'Valpak': 'Valpak finance manager', 'Noventiz': 'Noventiz controller', 'RLG': 'RLG controller', 'Advanced Supply Chain': 'Re-use finance manager', 'Cycleon': 'Re-use finance manager', 'Group central': 'Group FP&A' };
  var WFTXT = {
    'Valpak|1': ['PRN prices updated to the October market. Pass-through contracts protect gross profit.', ''],
    'Noventiz|1': ['January tariff +3% agreed; sorting contract renewal still open.', ''],
    'RLG|1': ['Battery take-back volumes grow 6% from the new retailer contracts; WEEE flat.', 'Battery take-back growth of 6% looks high against Q3 volumes. Please recheck it before resubmitting.'],
    'Reconomy UK|2': ['Waiting on the April 2027 landfill tax rate and the haulier rate review before submitting.', ''],
    'Valpak|3': ['Revenue ahead of budget on PRN prices; gross profit in line.', ''],
    'Noventiz|3': ['In line with budget.', ''],
    'Reconomy UK|3': ['Commentary drafted; holds until the drivers stage is signed off.', ''],
    'Recycle North America|3': ['Waste Focus fully in the run rate.', ''],
    'Advanced Supply Chain|3': ['Returns volumes below budget in Q3; recovery from Q2 with the new retailer launches.', 'Explain the gap to budget on returns volumes and the recovery assumption.'],
    'Cycleon|3': ['Steady; no change to the run rate.', ''],
    'Group central|3': ['Central costs in line with budget.', '']
  };
  var FX = { EUR: 0.87, USD: 0.755, GBP: 1 };
  var PROG = { 'Not started': 0, 'In progress': 0.35, 'Submitted': 0.75, 'Returned': 0.35, 'Approved': 1 };
  var D = {
    dsEntP: function () { return ENT.map(function (e) { return { labels: [{ name: e[1] }, { name: e[2] }, e[0]], values: [e[3], e[4]] }; }); },
    dsSchP: function () { return SCH.map(function (s) { return { labels: [{ name: s[1] }, s[0]], values: [s[2], s[3]] }; }); },
    dsEnt: function () { var o = []; Object.keys(ENTV).forEach(function (e) { entLines(e).forEach(function (v, i) { o.push({ labels: [e, LINES[i], V], values: [v] }); }); }); return o; },
    dsSch: function () { return SCH.map(function (s) { var v = SCHV[s[0]]; return { labels: [s[0], V], values: [v[0], v[1]] }; }); },
    dsFX: function () { return Object.keys(FX).map(function (c) { return { labels: [c, V], values: [FX[c]] }; }); },
    dsStat: function () { return Object.keys(PROG).map(function (s) { return { labels: [s], values: [PROG[s]] }; }); },
    dsWFS: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (s) o.push({ labels: [e, STAGES[i]], values: [{ name: s }] }); }); }); return o; },
    dsWFC: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (!s) return; var t = WFTXT[e + '|' + (i + 1)] || ['', '']; o.push({ labels: [e, STAGES[i]], values: [t[0], OWN[e] || '', t[1]] }); }); }); return o; }
  };
  var POS = { dsEnt: { versionList: 2 }, dsSch: { versionList: 1 }, dsFX: { versionList: 1 } };
  function apply(rows, f, name) { (f || []).forEach(function (x) { var p = (POS[name] || {})[x.binding]; if (p == null) { window.__errors.push('filter on ' + x.binding + ' not mapped for ' + name); return; } rows = rows.filter(function (r) { return x.selection.indexOf(r.labels[p]) >= 0; }); }); return rows; }
  var active = {}, nActive = 0;
  window.__subs = function () { return Object.keys(active).filter(function (k) { return active[k]; }); };
  window.__maxSubs = 0;
  window.PigmentSDK = {
    subscribeToDataSource: function (name, o) {
      nActive++; window.__maxSubs = Math.max(window.__maxSubs, nActive); active[name] = (active[name] || 0) + 1;
      if (nActive > 10) setTimeout(function () { o.onError({ message: 'Too many active subscriptions (mock limit 10)' }); }, 10);
      var f = o.dynamicFilters || [], dead = false;
      function send() { if (dead) return; if (!D[name]) { o.onError({ message: 'No mock data for ' + name }); return; } var rows = apply(D[name](), f, name); o.onData({ rows: rows, totalRowCount: rows.length, rowOffset: 0 }); }
      setTimeout(function () { if (!dead) o.onData({ rows: [{ labels: [{ kind: 'loading' }], values: [{ kind: 'loading' }] }], totalRowCount: 1 }); }, 5);
      setTimeout(send, 140);
      return { unsubscribe: function () { if (!dead) { dead = true; nActive--; active[name]--; } }, updateDynamicFilters: function (nf) { f = nf; setTimeout(send, 50); }, updateScroll: function () { } };
    },
    editValue: function () { return Promise.reject({ message: 'Reconomy world is read only' }); }
  };
})();
