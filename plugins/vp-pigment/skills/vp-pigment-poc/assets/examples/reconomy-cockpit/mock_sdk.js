// Mock Pigment SDK with illustrative Reconomy-shaped data, for harness.html only.
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  var V = 'Forecast Nov 26', VB = 'Budget FY26';
  var MN = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  var MONTHS = []; for (var y = 25; y <= 27; y++) MN.forEach(function (m) { MONTHS.push(m + ' ' + y); });
  function mk(m) { var p = m.split(' '); return (+p[1]) * 12 + MN.indexOf(p[0]); }
  var R12 = MONTHS.filter(function (m) { return mk(m) >= mk('Nov 26') && mk(m) <= mk('Oct 27'); });
  var CS = [
    ['Valpak packaging compliance', 'Membership fee', 'Fixed price', 3000, 0.03, 2400, 0.05, 300, 0.03],
    ['Valpak packaging compliance', 'Recycling evidence - plastic (PRN)', 'Cost plus fee', 20000, 0.02, 10, 0, 420, 0],
    ['Valpak packaging compliance', 'Recycling evidence - other materials (PRN)', 'Cost plus fee', 60000, 0.02, 8, 0, 95, 0],
    ['Valpak packaging compliance', 'Data and reporting services', 'Fixed price', 40, 0.10, 15000, 0.04, 9500, 0.03],
    ['Valpak WEEE compliance', 'Take-back fee per tonne', 'Fixed price', 6000, 0.03, 350, 0.04, 300, 0.05],
    ['Noventiz dual system licensing', 'Licence fee per tonne', 'Fixed price', 21000, 0.02, 320, 0.03, 270, 0.04],
    ['Noventiz online licensing', 'Membership fee', 'Fixed price', 7000, 0.12, 450, 0.03, 60, 0.03],
    ['RLG WEEE take-back', 'Take-back fee per tonne', 'Fixed price', 18000, 0.03, 280, 0.03, 235, 0.04],
    ['RLG OEM returns programmes', 'Fee per unit returned', 'Fixed price', 900, 0.05, 8000, 0.02, 6600, 0.03]
  ];
  var IN = { cost: {}, price: {}, pchg: {}, cchg: {}, pass: {}, fx: { EUR: 0.87, USD: 0.755, GBP: 1 }, haul: 0.03, ltax: 130.75, status: {}, comment: {}, ret: {} };
  function fxOf(s) { return /^Valpak/.test(s) ? 1 : IN.fx.EUR; }
  function line(r) {
    var k = r[0] + '|' + r[1], cost = IN.cost[k] != null ? IN.cost[k] : r[7], price = IN.price[k] != null ? IN.price[k] : r[5];
    var cchg = IN.cchg[k] != null ? IN.cchg[k] : r[8], pchg = IN.pchg[k] != null ? IN.pchg[k] : r[6], m = /Membership/.test(r[1]) ? 12 : 1, cp = r[2] === 'Cost plus fee';
    var rev = 0, dc = 0; R12.forEach(function (mo) { var nx = /27$/.test(mo); var c = cost * (nx ? 1 + cchg : 1), p = price * (nx ? 1 + pchg : 1); rev += r[3] * (cp ? c + p : p) / m; dc += r[3] * c / m; });
    var fx = fxOf(r[0]); return { rev: rev * fx, gp: (rev - dc) * fx, price: price, cost: cost, pchg: pchg, cchg: cchg, vol: r[3], growth: r[4] };
  }
  var SECT = [['Retail and leisure', 120e6, 0.24, 0.85], ['Construction and infrastructure', 110e6, 0.26, 0.60], ['Facilities management', 80e6, 0.25, 0.75], ['Manufacturing and logistics', 50e6, 0.25, 0.70], ['Public sector and healthcare', 34e6, 0.27, 0.40]];
  function sec(s) { var p = IN.pass[s[0]] != null ? IN.pass[s[0]] : s[3]; var inc = s[1] * 0.4 * IN.haul * 10 / 12 + s[1] * 0.02 * Math.max(0, IN.ltax - 130.75) / 130.75 * 7 / 12 * 3; var rec = inc * p; return { rev: s[1] + rec, gp: s[1] * s[2] - inc + rec, inc: inc, rec: rec, pass: p }; }
  var ENTS = [['Reconomy UK', 394e6, 0.25], ['RLG', 230e6, 0.16], ['Valpak', 231e6, 0.12], ['Recycle North America', 200e6, 0.22], ['Advanced Supply Chain', 175e6, 0.3], ['Noventiz', 82e6, 0.14], ['Cycleon', 70e6, 0.32], ['Group central', 0, 0]];
  var LINES = ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'];
  function entLines(e, k) { var r = e[1] * (/Noventiz|RLG|Cycleon/.test(e[0]) ? IN.fx.EUR / 0.87 : 1) * k, gp = r * e[2], pe = e[0] === 'Group central' ? -18e6 * k : -r * 0.08, si = e[0] === 'Group central' ? -3e6 * k : -r * 0.01, it = e[0] === 'Group central' ? -9e6 * k : -r * 0.02; return [r, gp - r, gp, pe, si, it, gp + pe + si + it]; }
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
    dsEnt: function () { var o = []; ENTS.forEach(function (e) { entLines(e, 1).forEach(function (v, i) { o.push({ labels: [e[0], LINES[i], V], values: [v] }); }); }); return o; },
    dsCS: function () { return CS.map(function (r) { var x = line(r); return { labels: [r[0], r[1], V], values: [x.rev, x.gp, x.price, x.cost, x.pchg, x.cchg, x.vol, x.growth] }; }); },
    dsCSB: function () { return CS.map(function (r) { return { labels: [r[0], r[1]], values: [{ name: r[2] }] }; }); },
    dsMS: function () { return SECT.map(function (s) { var x = sec(s); return { labels: [s[0], V], values: [x.rev, x.gp, x.inc, x.rec, x.pass] }; }); },
    dsCSM: function () { var o = []; CS.forEach(function (r) { var x = line(r); MONTHS.forEach(function (m, i) { var a = mk(m) <= mk('Oct 26'), f = 1 + 0.05 * Math.cos(i); o.push({ labels: [r[0], m, V], values: [x.rev / 12 * f * (a ? 0.95 : 1), x.gp / 12 * f * (a ? 0.97 : 1)] }); }); }); return o; },
    dsMSM: function () { var t = SECT.map(sec).reduce(function (a, b) { return { rev: a.rev + b.rev, gp: a.gp + b.gp, inc: a.inc + b.inc, rec: a.rec + b.rec }; }); return MONTHS.map(function (m, i) { var a = mk(m) <= mk('Oct 26'), inc = a ? null : (mk(m) >= mk('Jan 27') ? t.inc / 10 : 0); var lt = mk(m) >= mk('Apr 27') ? IN.ltax : mk(m) >= mk('Apr 26') ? 130.75 : 126.15; return { labels: [m, V], values: [t.rev / 12 * (1 + 0.04 * Math.sin(i)), t.gp / 12 * (1 + 0.05 * Math.sin(i)), inc, a ? null : (inc || 0) * 0.7, lt, m === 'Apr 27' ? IN.ltax : m === 'Apr 26' ? 130.75 : null] }; }); },
    dsKnob: function () { return [{ labels: [V], values: [IN.haul] }]; },
    dsPLM: function () { var o = []; [V, VB].forEach(function (v) { MONTHS.forEach(function (m) { if (v === VB && !/26$/.test(m)) return; var k = (v === VB ? 1.01 : 1) / 12; var tot = [0, 0, 0, 0, 0, 0, 0]; ENTS.forEach(function (e) { entLines(e, k).forEach(function (x, i) { tot[i] += x; }); }); if (v === VB) { tot[6] += 1.1e6; } tot.forEach(function (x, i) { o.push({ labels: [m, LINES[i], v], values: [x] }); }); }); }); return o; },
    dsFX: function () { return ['EUR', 'USD', 'GBP'].map(function (c) { return { labels: [c, V], values: [IN.fx[c]] }; }); },
    dsWFS: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (s) o.push({ labels: [e, STAGES[i]], values: [{ name: IN.status[e + '|' + STAGES[i]] || s }] }); }); }); return o; },
    dsWFC: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (!s) return; var k = e + '|' + STAGES[i], t = WFTXT[e + '|' + (i + 1)] || ['', '']; o.push({ labels: [e, STAGES[i]], values: [IN.comment[k] != null ? IN.comment[k] : t[0], e + ' finance lead', IN.ret[k] != null ? IN.ret[k] : t[1]] }); }); }); return o; }
  };
  var POS = { dsEnt: { versionList: 2 }, dsCS: { versionList: 2 }, dsMS: { versionList: 1 }, dsCSM: { monthList: 1, versionList: 2 }, dsMSM: { monthList: 0, versionList: 1 }, dsKnob: { versionList: 0 }, dsPLM: { monthList: 0, versionList: 2 }, dsFX: { versionList: 1 } };
  function apply(rows, f, name) { (f || []).forEach(function (x) { var p = (POS[name] || {})[x.binding]; if (p == null) { window.__errors.push('filter on ' + x.binding + ' not mapped for ' + name); return; } rows = rows.filter(function (r) { return x.selection.indexOf(r.labels[p]) >= 0; }); }); return rows; }
  var active = {}, nActive = 0, live = [];
  window.__subs = function () { return Object.keys(active).filter(function (k) { return active[k]; }); };
  window.__maxSubs = 0;
  window.__writes = [];
  window.PigmentSDK = {
    subscribeToDataSource: function (name, o) {
      nActive++; window.__maxSubs = Math.max(window.__maxSubs, nActive); active[name] = (active[name] || 0) + 1;
      if (nActive > 10) setTimeout(function () { o.onError({ message: 'Too many active subscriptions (mock limit 10)' }); }, 10);
      var f = o.dynamicFilters || [], dead = false;
      function send() { if (dead) return; if (!D[name]) { o.onError({ message: 'No mock data for ' + name }); return; } var rows = apply(D[name](), f, name); if (rows.length > 1000) window.__errors.push(name + ' has ' + rows.length + ' rows'); o.onData({ rows: rows.slice(0, 500 * 2), totalRowCount: rows.length, rowOffset: 0 }); }
      var h = { send: send, dead: function () { return dead; } }; live.push(h);
      setTimeout(function () { o.onData({ rows: [{ labels: [{ kind: 'loading' }], values: [{ kind: 'loading' }] }], totalRowCount: 1 }); }, 5);
      setTimeout(send, 120);
      return { unsubscribe: function () { if (!dead) { dead = true; nActive--; active[name]--; } }, updateDynamicFilters: function (nf) { f = nf; setTimeout(send, 50); }, updateScroll: function () { } };
    },
    editValue: function (sink, c, v) {
      window.__writes.push([sink, c, v]);
      return new Promise(function (res, rej) {
        if (window.__refuse) { setTimeout(function () { rej({ message: 'refused by test' }); }, 50); return; }
        var k = c.schemeList + '|' + c.lineList;
        if (sink === 'costSink') IN.cost[k] = v; else if (sink === 'priceSink') IN.price[k] = v; else if (sink === 'priceChgSink') IN.pchg[k] = v; else if (sink === 'costChgSink') IN.cchg[k] = v;
        else if (sink === 'passSink') IN.pass[c.sectorList] = v; else if (sink === 'fxSink') IN.fx[c.currencyList] = v; else if (sink === 'haulSink') IN.haul = v; else if (sink === 'ltaxSink') IN.ltax = v;
        else if (sink === 'statusSink') IN.status[c.entityList + '|' + c.stageList] = v; else if (sink === 'commentSink') IN.comment[c.entityList + '|' + c.stageList] = v; else if (sink === 'returnSink') IN.ret[c.entityList + '|' + c.stageList] = v;
        setTimeout(function () { res(); live.forEach(function (h) { if (!h.dead()) setTimeout(h.send, 150); }); }, 80);
      });
    }
  };
})();
