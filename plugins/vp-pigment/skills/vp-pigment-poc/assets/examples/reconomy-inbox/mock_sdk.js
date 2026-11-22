// Mock Pigment SDK for the review inbox design page and harness only. Illustrative data shaped like the
// Reconomy model (statuses, notes and return reasons mirror the live app on 22 Nov 2026).
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  var V = 'Forecast Nov 26';
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
  var OWNER = { 'Valpak': 'Valpak finance manager', 'Noventiz': 'Noventiz controller', 'RLG': 'RLG controller', 'Reconomy UK': 'UK Recycle finance manager', 'Recycle North America': 'North America controller', 'Advanced Supply Chain': 'Re-use finance manager', 'Cycleon': 'Re-use finance manager', 'Group central': 'Group FP&A' };
  var LOOP = { 'Reconomy UK': 'Recycle', 'Recycle North America': 'Recycle', 'Valpak': 'Comply', 'Noventiz': 'Comply', 'RLG': 'Comply', 'Advanced Supply Chain': 'Re-use', 'Cycleon': 'Re-use', 'Group central': 'Central' };
  // scheme, entity, revenue and gross profit next 12 months (pounds)
  var SCH = [
    ['Valpak packaging compliance', 'Valpak', 194624849, 17838877], ['Valpak WEEE compliance', 'Valpak', 28316402, 5214330], ['Valpak battery compliance', 'Valpak', 12987151, 2486210],
    ['Noventiz dual system licensing', 'Noventiz', 74900234, 11695195], ['Noventiz online licensing', 'Noventiz', 10087671, 2318402],
    ['RLG OEM returns programmes', 'RLG', 86412004, 16207118], ['RLG battery take-back', 'RLG', 60712556, 9020431], ['RLG WEEE take-back', 'RLG', 58014327, 11318246],
    ['RLG packaging compliance Austria', 'RLG', 24081736, 5097123], ['RLG deposit clearing', 'RLG', 11741403, 3190228]
  ];
  // entity, revenue next 12 months, gross margin, adjusted EBITDA next 12 months (live baseline)
  var ENTS = [['Reconomy UK', 394428576, 0.249, 43551736], ['RLG', 240963126, 0.16, 21916445], ['Valpak', 235928402, 0.108, 13689757], ['Recycle North America', 209651345, 0.22, 15276827],
    ['Advanced Supply Chain', 178519737, 0.3, 7175122], ['Noventiz', 84987905, 0.165, 10916262], ['Cycleon', 72404126, 0.32, 3591477], ['Group central', 0, 0, -31372407]];
  var LINES = ['Revenue', 'Direct costs', 'Gross profit', 'People costs', 'Sites and property', 'IT and other overheads', 'Adjusted EBITDA'];
  function entLines(e) { var r = e[1], gp = Math.round(r * e[2]), oh = e[3] - gp, pe = Math.round(oh * 0.7), si = Math.round(oh * 0.1), it = oh - pe - si; return [r, gp - r, gp, pe, si, it, e[3]]; }
  var SECT = [['Retail and leisure', 121020000, 28620000, 0.85], ['Construction and infrastructure', 110660000, 28160000, 0.60], ['Facilities management', 80600000, 19800000, 0.75], ['Manufacturing and logistics', 50350000, 12350000, 0.70], ['Public sector and healthcare', 34136000, 8976000, 0.40]];
  var IN = { status: {}, ret: {} };
  var D = {
    dsWFS: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (s) o.push({ labels: [e, STAGES[i]], values: [{ name: IN.status[e + '|' + STAGES[i]] || s }] }); }); }); return o; },
    dsWFC: function () { var o = []; Object.keys(WF).forEach(function (e) { WF[e].forEach(function (s, i) { if (!s) return; var k = e + '|' + STAGES[i], t = WFTXT[e + '|' + (i + 1)] || ['', '']; o.push({ labels: [e, STAGES[i]], values: [t[0], OWNER[e] || '', IN.ret[k] != null ? IN.ret[k] : t[1]] }); }); }); return o; },
    dsEnt: function () { var o = []; ENTS.forEach(function (e) { entLines(e).forEach(function (v, i) { o.push({ labels: [e[0], LINES[i], V], values: [v] }); }); }); return o; },
    dsSch: function () { return SCH.map(function (s) { return { labels: [s[0], V], values: [s[2], s[3]] }; }); },
    dsMS: function () { return SECT.map(function (s) { var inc = s[1] * 0.0094, rec = inc * s[3]; return { labels: [s[0], V], values: [s[1], s[2], inc, rec] }; }); },
    dsSchEnt: function () { return SCH.map(function (s) { return { labels: [s[0]], values: [{ name: s[1] }] }; }); },
    dsEntLoop: function () { return ENTS.map(function (e) { return { labels: [e[0]], values: [{ name: LOOP[e[0]] }] }; }); }
  };
  var POS = { dsEnt: { versionList: 2 }, dsSch: { versionList: 1 }, dsMS: { versionList: 1 } };
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
      function send() { if (dead) return; if (!D[name]) { o.onError({ message: 'No mock data for ' + name }); return; } var rows = apply(D[name](), f, name); if (rows.length > 1000) window.__errors.push(name + ' has ' + rows.length + ' rows'); o.onData({ rows: rows, totalRowCount: rows.length, rowOffset: 0 }); }
      var h = { send: send, dead: function () { return dead; } }; live.push(h);
      setTimeout(function () { o.onData({ rows: [{ labels: [{ kind: 'loading' }], values: [{ kind: 'loading' }] }], totalRowCount: 1 }); }, 5);
      setTimeout(send, 120);
      return { unsubscribe: function () { if (!dead) { dead = true; nActive--; active[name]--; } }, updateDynamicFilters: function (nf) { f = nf; setTimeout(send, 50); }, updateScroll: function () { } };
    },
    editValue: function (sink, c, v) {
      window.__writes.push([sink, c, v]);
      return new Promise(function (res, rej) {
        if (window.__refuse) { setTimeout(function () { rej({ message: 'refused by test' }); }, 50); return; }
        var k = c.entityList + '|' + c.stageList;
        if (sink === 'statusSink') IN.status[k] = v; else if (sink === 'returnSink') IN.ret[k] = v;
        setTimeout(function () { res(); live.forEach(function (h) { if (!h.dead()) setTimeout(h.send, 150); }); }, 80);
      });
    }
  };
})();
