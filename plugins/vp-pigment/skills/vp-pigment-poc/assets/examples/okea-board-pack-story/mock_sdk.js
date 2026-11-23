// Mock Pigment SDK for the OKEA board pack story design page and harness only.
// Numbers mirror the live OKEA app (read 22 Nov 2026, OKEA net; FY 26 = forecast year of 7+5).
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  var R = '7+5', P = '4+8';
  var YRS = []; for (var y = 26; y <= 40; y++) YRS.push('FY ' + y);
  var ASSETS = ['Statfjord Unit', 'Statfjord Nord', 'Statfjord Øst', 'Sygna'];
  // FEED Net Cost by Year (mNOK), FY 26..FY 40
  var COST = {};
  COST[R] = {
    'Statfjord Unit': [1694.53, 1662.58, 1529.92, 1348.50, 1237.00, 1043.96, 895.91, 869.44, 860.15, 782.82, 1111.41, 1625.18, 1716.39, 713.32, 45.85],
    'Statfjord Nord': [301.81, 453.24, 234.45, 214.31, 195.19, 202.87, 185.28, 182.40, 178.17, 190.29, 296.56, 427.56, 462.88, 167.96, 10.93],
    'Statfjord Øst': [160.75, 264.80, 192.74, 99.39, 83.29, 63.75, 62.22, 61.19, 57.09, 58.12, 97.38, 147.14, 159.43, 65.04, 4.20],
    'Sygna': [26.54, 23.07, 14.10, 12.95, 11.56, 11.21, 19.94, 28.82, 8.36, 7.89, 102.49, 16.60, 31.42, 0.75, null]
  };
  COST[P] = {
    'Statfjord Unit': [1685.77, 1646.94, 1521.41, 1333.39, 1222.49, 1022.51, 878.59, 852.21, 844.06, 769.27, 1099.52, 1613.20, 1703.82, 712.78, 45.85],
    'Statfjord Nord': [308.66, 459.24, 236.55, 216.27, 197.07, 204.63, 186.14, 183.09, 178.91, 191.06, 297.58, 428.62, 463.70, 167.86, 10.93],
    'Statfjord Øst': [227.33, 269.61, 106.50, 100.22, 84.00, 63.80, 62.22, 61.14, 57.03, 58.13, 97.44, 147.21, 159.43, 64.99, 4.20],
    'Sygna': [27.06, 22.81, 13.92, 12.74, 11.50, 11.14, 20.14, 29.28, 8.27, 7.81, 102.43, 16.55, 31.31, 0.73, null]
  };
  // FEED Net Production by Year (kboe), FY 26..FY 38
  var PROD = {};
  PROD[R] = {
    'Statfjord Unit': [1756.12, 1909.09, 2439.66, 2529.43, 2612.35, 2556.05, 2092.96, 1736.46, 1546.20, 1318.15, 1155.68, 1041.64, 893.83],
    'Statfjord Nord': [789.64, 640.41, 629.17, 542.86, 459.33, 451.62, 423.95, 374.41, 380.37, 364.54, 328.20, 338.02, 327.19],
    'Statfjord Øst': [336.69, 294.91, 237.91, 235.22, 206.54, 158.86, 131.21, 102.37, 91.75, 80.71, 67.99, 65.24, 59.94],
    'Sygna': [73.85, 46.70, 33.58, 27.77, 21.51, 19.19, 16.04, 12.45, 11.16, 9.35, 7.33, 6.58, 5.54]
  };
  PROD[P] = {
    'Statfjord Unit': PROD[R]['Statfjord Unit'], 'Statfjord Nord': PROD[R]['Statfjord Nord'],
    'Statfjord Øst': [330.18, 279.43, 295.30, 252.04, 157.95, 133.88, 111.70, 88.17, 83.23, 73.76, 62.72, 61.36, 56.65],
    'Sygna': [72.19, 36.06, 33.58, 27.77, 21.51, 19.19, 16.04, 12.45, 11.16, 9.35, 7.33, 6.58, 5.54]
  };
  // OUT PRODEX per boe by Asset / OUT Unit Opex by Asset (NOK/boe), FY 26
  var PRDX = {}; PRDX[R] = { 'Statfjord Unit': [603.80, 508.62], 'Statfjord Nord': [218.33, 143.15], 'Statfjord Øst': [293.25, 174.54], 'Sygna': [179.71, 127.75] };
  PRDX[P] = { 'Statfjord Unit': [587.76, 486.79], 'Statfjord Nord': [221.94, 143.39], 'Statfjord Øst': [306.15, 180.11], 'Sygna': [185.54, 130.75] };
  // OUT FY Net Cost by asset and cost class (mNOK)
  var CLS = ['Exploration (EXPEX)', 'Investments (CAPEX)', 'Operating cost (OPEX)', 'Operating income', 'Shutdown and removal (ABEX)', 'General cost', 'OKEA 100% costs'];
  var FYC = {};
  FYC[R] = {
    'Statfjord Unit': [null, 626.38, 893.20, -206.16, 7.81, 247.24, 126.07],
    'Statfjord Nord': [0.31, 129.10, 113.04, null, 0.0017, 51.23, 8.14],
    'Statfjord Øst': [null, 62.02, 58.77, null, null, 30.36, 9.60],
    'Sygna': [0.33, 12.94, 9.43, null, null, 3.25, 0.59]
  };
  FYC[P] = {
    'Statfjord Unit': [0, 645.79, 854.86, -206.16, 7.81, 258.66, 124.81],
    'Statfjord Nord': [0.31, 133.10, 113.23, 0, 0.0017, 53.97, 8.05],
    'Statfjord Øst': [0, 126.24, 59.47, 0, 0, 32.11, 9.51],
    'Sygna': [0.33, 13.34, 9.44, 0, 0, 3.37, 0.59]
  };
  // FEED Change by Reason FY (mNOK), 7+5 against 4+8
  var RSN = ['Operator WP&B update', 'RNB update', 'OKEA estimate', 'Timing change', 'Scope change', 'Actuals true-up'];
  var CHG = {
    'Statfjord Unit': [29.96, 0.97, -11.21, -19.42, 8.36, null],
    'Statfjord Nord': [0.57, 0.08, -2.87, -4.00, 0.95, -1.72],
    'Statfjord Øst': [0.15, null, -1.79, -63.93, 0.19, -1.05],
    'Sygna': [0.04, null, null, -0.34, 0.09, -0.14]
  };
  // OUT Net Production FY 26 by asset (Project.Asset) and product (kboe)
  var PRD = {}; PRD[R] = { 'Statfjord Unit': [787.91, 652.17, 316.04], 'Statfjord Nord': [661.94, 88.45, 39.26], 'Statfjord Øst': [224.78, 74.91, 36.99], 'Sygna': [73.85, null, null] };
  PRD[P] = { 'Statfjord Unit': [787.91, 652.17, 316.04], 'Statfjord Nord': [661.94, 88.45, 39.26], 'Statfjord Øst': [224.50, 71.90, 33.77], 'Sygna': [72.19, null, null] };
  var PRODUCTS = ['Oil', 'Sales Gas', 'NGL'];
  // FEED CO2 Tax Gross by Year (mNOK) and ASSUMP CO2 Price (NOK/t), FY 27..FY 38 (same in both rounds)
  var CO2Y = ['FY 27', 'FY 28', 'FY 29', 'FY 30', 'FY 31', 'FY 32', 'FY 33', 'FY 34', 'FY 35', 'FY 36', 'FY 37', 'FY 38'];
  var TAX = [1327.22, 1222.27, 1180.21, 1242.52, 1471.05, 1564.12, 1674.43, 1768.02, 1873.10, 1900.51, 1834.60, 1769.46];
  var PRICE = [2422.24, 2611.68, 2790.80, 2923.80, 2599.24, 2798.86, 2998.85, 3199.23, 3400.00, 3420.49, 3441.38, 3462.70];
  // Workflow: stage x asset
  var STAGES = ['1 Portfolio review', '2 Asset inputs', '3 Projects and drilling', '4 Side calculations', '5 Forecast comparison', '6 Board pack'];
  var WF = {
    'Sygna': ['Approved', 'Approved', 'Approved', 'Approved', 'Approved', 'Submitted'],
    'Statfjord Nord': ['Approved', 'Approved', 'Approved', 'Submitted', 'Submitted', 'In progress'],
    'Statfjord Unit': ['In progress', 'Submitted', 'Submitted', 'Submitted', 'In progress', 'Not started'],
    'Statfjord Øst': ['In progress', 'Submitted', 'Submitted', 'Approved', 'Returned', 'Not started']
  };
  var OWN = ['Asset controlling manager', 'Asset controller', 'Asset controller', 'Asset controller', 'Asset controlling manager', 'VP Finance'];
  var NOTE = {
    'Statfjord Unit|5': 'Opex is up 38.3 mNOK on 4+8. Reasons set on the main lines; drafting the commentary.',
    'Statfjord Øst|4': 'CO2 price path agreed with Finance.',
    'Sygna|6': 'Submitted for the VP Finance review.',
    'Statfjord Unit|2': 'Jan-Jul actuals loaded from Visma; Aug-Dec reforecast by line.',
    'Statfjord Øst|5': 'Capex down 64.2 mNOK on 4+8: RC7 Øst well 2 follows the operator\'s latest rig plan. Change reason to follow.'
  };
  var RET = { 'Statfjord Øst|5': 'Net capex is down 64.2 mNOK on 4+8 because RC7 Øst well 2 has moved out of 2026. Confirm the timing with the operator and set the change reason before resubmitting.' };
  var WI = { 'Statfjord Unit': 0.2393123, 'Statfjord Nord': 0.28, 'Statfjord Øst': 0.14, 'Sygna': 0.154 };

  var D = {
    dsAY: function () {
      var o = [];
      [R, P].forEach(function (v) { ASSETS.forEach(function (a) { YRS.forEach(function (yy, i) {
        var c = COST[v][a][i], p = PROD[v][a][i], x = i === 0 ? PRDX[v][a] : [null, null];
        if (c == null && p == null) return;
        o.push({ labels: [a, yy, v], values: [c, p == null ? null : p, x[0], x[1]] });
      }); }); });
      return o;
    },
    dsClass: function () { var o = []; [R, P].forEach(function (v) { ASSETS.forEach(function (a) { CLS.forEach(function (c, i) { var x = FYC[v][a][i]; if (x != null) o.push({ labels: [a, c, v], values: [x] }); }); }); }); return o; },
    dsReason: function () { var o = []; ASSETS.forEach(function (a) { RSN.forEach(function (r, i) { var x = CHG[a][i]; if (x != null) o.push({ labels: [a, r, R], values: [x] }); }); }); return o; },
    dsProduct: function () { var o = []; [R, P].forEach(function (v) { ASSETS.forEach(function (a) { PRODUCTS.forEach(function (p, i) { var x = PRD[v][a][i]; if (x != null) o.push({ labels: [a, p, v], values: [x] }); }); }); }); return o; },
    dsCO2: function () { var o = []; [R, P].forEach(function (v) { CO2Y.forEach(function (yy, i) { o.push({ labels: [yy, v], values: [TAX[i], PRICE[i]] }); }); }); return o; },
    dsWFS: function () { var o = []; Object.keys(WF).forEach(function (a) { WF[a].forEach(function (s, i) { o.push({ labels: [a, STAGES[i]], values: [{ name: s }] }); }); }); return o; },
    dsWFC: function () { var o = []; Object.keys(WF).forEach(function (a) { STAGES.forEach(function (st, i) { var k = a + '|' + (i + 1); o.push({ labels: [a, st], values: [NOTE[k] || null, OWN[i], RET[k] || null] }); }); }); return o; },
    dsAssetP: function () { return ASSETS.map(function (a) { return { labels: [a], values: [WI[a]] }; }); }
  };
  // label position of each filterable binding, per source (-1: no such label; the filter only narrows the aggregation)
  var POS = { dsAY: { versionList: 2, yearList: 1 }, dsClass: { versionList: 2 }, dsReason: { versionList: 2 }, dsProduct: { versionList: 2, monthList: -1 }, dsCO2: { versionList: 1, yearList: 0 } };
  function apply(rows, f, name) {
    (f || []).forEach(function (x) {
      var p = (POS[name] || {})[x.binding];
      if (p == null) { window.__errors.push('filter on ' + x.binding + ' not mapped for ' + name); return; }
      if (p < 0) return;
      rows = rows.filter(function (r) { return x.selection.indexOf(r.labels[p]) >= 0; });
    });
    return rows;
  }
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
    editValue: function (sink, c, v) { window.__writes.push([sink, c, v]); window.__errors.push('the board pack story must not write (' + sink + ')'); return Promise.reject({ message: 'read only' }); }
  };
})();
