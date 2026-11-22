// Mock Pigment SDK for the CFO story design page and harness only. Numbers mirror the live model (22 Nov 2026).
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  var V = 'Forecast Nov 26', VB = 'Budget FY26';
  var MN = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  var MONTHS = []; for (var y = 25; y <= 27; y++) MN.forEach(function (m) { MONTHS.push(m + ' ' + y); });
  function mk(m) { var p = m.split(' '); return (+p[1]) * 12 + MN.indexOf(p[0]); }
  var R12 = MONTHS.filter(function (m) { return mk(m) >= mk('Nov 26') && mk(m) <= mk('Oct 27'); });
  var LINES = ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'];
  // entity: revenue, gross profit, adjusted EBITDA (next 12 months), loop, currency
  var ENT = [
    ['Reconomy UK', 394428576, 98225564, 43551736, 'Recycle', 'GBP'],
    ['RLG', 240963126, 44800000, 21916445, 'Comply', 'EUR'],
    ['Valpak', 235928402, 25500000, 13689757, 'Comply', 'GBP'],
    ['Recycle North America', 209651345, 46123296, 15276827, 'Recycle', 'USD'],
    ['Advanced Supply Chain', 178519737, 53555921, 7175122, 'Re-use', 'GBP'],
    ['Noventiz', 84987905, 16636036, 10916262, 'Comply', 'EUR'],
    ['Cycleon', 72404126, 23169321, 3591477, 'Re-use', 'EUR'],
    ['Group central', 0, 0, -31372407, 'Central', 'GBP']
  ];
  function entLines(e) { var oh = e[2] - e[3], pe = -oh * 0.75, si = -oh * 0.1, it = -oh - pe - si; return [e[1], e[2] - e[1], e[2], pe, si, it, e[3]]; }
  var FYF = [1306712992, -1007492441, 299220551, -140705906, -32928085, -39957652, 85628908];
  var FYB = [1299371326, -988390658, 310980668, -139446084, -32719064, -39619458, 99196062];
  var R12T = [0, 0, 0, 0, 0, 0, 0]; ENT.forEach(function (e) { entLines(e).forEach(function (v, i) { R12T[i] += v; }); });
  function shape(m, a, ph) { var i = MN.indexOf(m.split(' ')[0]); return 1 + a * Math.sin(2 * Math.PI * (i + ph) / 12); }
  var CS = [
    ['Valpak packaging compliance', 'Membership fee', 'Fixed price', 3000, 0.03, 2400, 0.05, 300, 0.03],
    ['Valpak packaging compliance', 'Recycling evidence - plastic (PRN)', 'Cost plus fee', 20000, 0.02, 10, 0, 420, 0],
    ['Valpak packaging compliance', 'Recycling evidence - other materials (PRN)', 'Cost plus fee', 60000, 0.02, 8, 0, 95, 0],
    ['Valpak packaging compliance', 'Data and reporting services', 'Fixed price', 40, 0.10, 15000, 0.04, 9500, 0.03],
    ['Valpak WEEE compliance', 'Take-back fee per tonne', 'Fixed price', 6000, 0.03, 350, 0.04, 300, 0.05],
    ['Noventiz dual system licensing', 'Licence fee per tonne', 'Fixed price', 21000, 0.02, 320, 0.03, 270, 0.04],
    ['Noventiz online licensing', 'Membership fee', 'Fixed price', 7000, 0.12, 450, 0.03, 60, 0.03],
    ['RLG WEEE take-back', 'Take-back fee per tonne', 'Fixed price', 18000, 0.03, 280, 0.03, 235, 0.04],
    ['RLG battery take-back', 'Take-back fee per tonne', 'Fixed price', 16000, 0.06, 320, 0.03, 270, 0.03],
    ['RLG OEM returns programmes', 'Fee per unit returned', 'Fixed price', 900, 0.05, 8000, 0.02, 6600, 0.03]
  ];
  function line(r) {
    var m = /Membership/.test(r[1]) ? 12 : 1, cp = r[2] === 'Cost plus fee', rev = 0, dc = 0;
    R12.forEach(function (mo) { var nx = /27$/.test(mo); var c = r[7] * (nx ? 1 + r[8] : 1), p = r[5] * (nx ? 1 + r[6] : 1); rev += r[3] * (cp ? c + p : p) / m; dc += r[3] * c / m; });
    var fx = /^Valpak/.test(r[0]) ? 1 : 0.87; return { rev: rev * fx, gp: (rev - dc) * fx };
  }
  var SECT = [['Retail and leisure', 121020000, 28620000, 1200000, 0.85], ['Construction and infrastructure', 110660000, 28160000, 1100000, 0.60], ['Facilities management', 80600000, 19800000, 800000, 0.75], ['Manufacturing and logistics', 50350000, 12350000, 500000, 0.70], ['Public sector and healthcare', 34136000, 8976000, 340000, 0.40]];
  var STAGES = ['1 Compliance scheme drivers', '2 Managed services drivers', '3 Group forecast and commentary'];
  var WF = { 'Valpak': ['Approved', null, 'Approved'], 'Noventiz': ['Submitted', null, 'Submitted'], 'RLG': ['Returned', null, 'Not started'], 'Reconomy UK': [null, 'In progress', 'In progress'], 'Recycle North America': [null, null, 'Submitted'], 'Advanced Supply Chain': [null, null, 'Returned'], 'Cycleon': [null, null, 'Submitted'], 'Group central': [null, null, 'Approved'] };
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
  var D = {
    dsEnt: function () { var o = []; ENT.forEach(function (e) { entLines(e).forEach(function (v, i) { o.push({ labels: [e[0], LINES[i], V], values: [v] }); }); }); return o; },
    dsPLM: function () {
      var o = [];
      MONTHS.forEach(function (m) {
        var k = mk(m); if (k < mk('Jan 26') || k > mk('Oct 27')) return;
        var fyM = /26$/.test(m), sf = shape(m, 0.06, 1), sb = shape(m, 0.05, 2);
        LINES.forEach(function (l, i) { o.push({ labels: [m, l, V], values: [fyM ? FYF[i] / 12 * sf : R12T[i] / 12 * sf] }); if (fyM) o.push({ labels: [m, l, VB], values: [FYB[i] / 12 * sb] }); });
      });
      return o;
    },
    dsCS: function () { var xs = CS.map(line), tr = 0, tg = 0; xs.forEach(function (x) { tr += x.rev; tg += x.gp; }); var fr = 561879432 / tr, fg = 86936036 / tg; return CS.map(function (r, i) { return { labels: [r[0], r[1], V], values: [xs[i].rev * fr, Math.min(xs[i].gp * fg, xs[i].rev * fr * 0.9)] }; }); },
    dsCSB: function () { return CS.map(function (r) { return { labels: [r[0], r[1]], values: [{ name: r[2] }] }; }); },
    dsMS: function () { return SECT.map(function (s) { var rec = s[3] * s[4]; return { labels: [s[0], V], values: [s[1], s[2], s[3], rec, s[4]] }; }); },
    dsFX: function () { return [['EUR', 0.87], ['USD', 0.755], ['GBP', 1]].map(function (c) { return { labels: [c[0], V], values: [c[1]] }; }); },
    dsWFS: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (s) o.push({ labels: [e, STAGES[i]], values: [{ name: s }] }); }); }); return o; },
    dsWFC: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (!s) return; var t = WFTXT[e + '|' + (i + 1)] || ['', '']; o.push({ labels: [e, STAGES[i]], values: [t[0], e + ' finance lead', t[1]] }); }); }); return o; },
    dsEntP: function () { return ENT.map(function (e) { return { labels: [e[0]], values: [{ name: e[4] }, { name: e[5] }] }; }); }
  };
  var POS = { dsEnt: { versionList: 2 }, dsCS: { versionList: 2 }, dsMS: { versionList: 1 }, dsPLM: { monthList: 0, versionList: 2 }, dsFX: { versionList: 1 } };
  function apply(rows, f, name) { (f || []).forEach(function (x) { var p = (POS[name] || {})[x.binding]; if (p == null) { window.__errors.push('filter on ' + x.binding + ' not mapped for ' + name); return; } rows = rows.filter(function (r) { return x.selection.indexOf(r.labels[p]) >= 0; }); }); return rows; }
  var active = {}, nActive = 0;
  window.__subs = function () { return Object.keys(active).filter(function (k) { return active[k]; }); };
  window.__maxSubs = 0;
  window.__writes = [];
  window.PigmentSDK = {
    subscribeToDataSource: function (name, o) {
      nActive++; window.__maxSubs = Math.max(window.__maxSubs, nActive); active[name] = (active[name] || 0) + 1;
      if (nActive > 10) setTimeout(function () { o.onError({ message: 'Too many active subscriptions (mock limit 10)' }); }, 10);
      var f = o.dynamicFilters || [], dead = false;
      function send() { if (dead) return; if (!D[name]) { o.onError({ message: 'No mock data for ' + name }); return; } var rows = apply(D[name](), f, name); if (rows.length > 1000) window.__errors.push(name + ' has ' + rows.length + ' rows'); o.onData({ rows: rows.slice(0, 1000), totalRowCount: rows.length, rowOffset: 0 }); }
      setTimeout(function () { o.onData({ rows: [{ labels: [{ kind: 'loading' }], values: [{ kind: 'loading' }] }], totalRowCount: 1 }); }, 5);
      setTimeout(send, 120);
      return { unsubscribe: function () { if (!dead) { dead = true; nActive--; active[name]--; } }, updateDynamicFilters: function (nf) { f = nf; setTimeout(send, 50); }, updateScroll: function () { } };
    },
    editValue: function (sink, c, v) { window.__writes.push([sink, c, v]); window.__errors.push('the CFO story must not write (' + sink + ')'); return Promise.reject({ message: 'read only' }); }
  };
})();
