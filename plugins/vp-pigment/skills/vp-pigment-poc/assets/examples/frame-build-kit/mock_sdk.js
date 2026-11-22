// Mock Pigment SDK for harness.html only (build_frame.py inlines it ahead of the frame body).
// Edit the three parts marked EDIT; leave the engine below them alone.
//
// Test hooks:
//   window.__errors    page errors, unmapped filters and oversized sources (should stay [])
//   window.__writes    every editValue call: [sink, coords, value]
//   window.__refuse    set to true to make writes fail (checks the error toast)
//   window.__maxSubs   peak live subscriptions (Pigment allows 10)
//   window.__subs()    names of the sources live right now
window.__errors = [];
window.addEventListener('error', function (e) { window.__errors.push(String(e.message) + ' @' + e.lineno); });
(function () {
  // ---- EDIT 1: illustrative input state. Sinks write here, so a lever moves the numbers. ----
  var V = 'Forecast';
  var REGIONS = [['North', 1200000, 0.62], ['South', 950000, 0.58], ['East', 700000, 0.66], ['West', 520000, 0.6]];
  var IN = { growth: { North: 0.03, South: 0.02, East: 0.05, West: 0.01 } };

  // ---- EDIT 2: one generator per data source, rows in the frame's binding order ----
  // { labels: [list item, ...], values: [value, ...] }. A dimension-typed value is { name: 'Item' }.
  var D = {
    dsRegion: function () {
      return REGIONS.map(function (r) {
        var g = IN.growth[r[0]], rev = r[1] * (1 + g);
        return { labels: [r[0], V], values: [rev, rev * r[2], g] };
      });
    }
  };
  // Which label position each selector binding filters on, per source. An unmapped filter is an error.
  var POS = { dsRegion: { versionList: 1 } };

  // ---- EDIT 3: apply a write to the input state ----
  function applyWrite(sink, c, v) {
    if (sink === 'growthSink') IN.growth[c.regionList] = v;
    else throw new Error('mock has no handler for ' + sink);
  }

  // ---- engine ----
  function filter(rows, f, name) {
    (f || []).forEach(function (x) {
      var p = (POS[name] || {})[x.binding];
      if (p == null) { window.__errors.push('filter on ' + x.binding + ' not mapped for ' + name); return; }
      rows = rows.filter(function (r) { return x.selection.indexOf(r.labels[p]) >= 0; });
    });
    return rows;
  }
  var active = {}, nActive = 0, live = [];
  window.__subs = function () { return Object.keys(active).filter(function (k) { return active[k] > 0; }); };
  window.__maxSubs = 0;
  window.__writes = [];
  window.__refuse = false;
  window.PigmentSDK = {
    subscribeToDataSource: function (name, o) {
      nActive++; window.__maxSubs = Math.max(window.__maxSubs, nActive); active[name] = (active[name] || 0) + 1;
      if (nActive > 10) setTimeout(function () { o.onError && o.onError({ message: 'Too many active subscriptions for this resource (mock limit 10)' }); }, 10);
      var f = o.dynamicFilters || [], off = 0, dead = false;
      function send() {
        if (dead) return;
        if (!D[name]) { o.onError && o.onError({ message: 'No mock data for ' + name }); return; }
        var rows = filter(D[name](), f, name);
        if (rows.length > 1000) window.__errors.push(name + ' returns ' + rows.length + ' rows (keep sources under 1,000)');
        o.onData({ rows: rows.slice(off, off + 500), totalRowCount: rows.length, rowOffset: off });
      }
      var h = { send: send, dead: function () { return dead; } };
      live.push(h);
      setTimeout(function () { if (!dead) o.onData({ rows: [{ labels: [{ kind: 'loading' }], values: [{ kind: 'loading' }] }], totalRowCount: 1 }); }, 5);
      setTimeout(send, 120);
      return {
        unsubscribe: function () { if (!dead) { dead = true; nActive--; active[name]--; } },
        updateDynamicFilters: function (nf) { f = nf; setTimeout(send, 50); },
        updateScroll: function (s) { off = (s && s.offset) || 0; setTimeout(send, 50); }
      };
    },
    editValue: function (sink, c, v) {
      window.__writes.push([sink, c, v]);
      return new Promise(function (res, rej) {
        if (window.__refuse) { setTimeout(function () { rej({ message: 'refused by test' }); }, 50); return; }
        try { applyWrite(sink, c, v); } catch (e) { setTimeout(function () { rej(e); }, 10); return; }
        // as Pigment does after a recalculation: every live source sends fresh data
        setTimeout(function () { res(); live.forEach(function (x) { if (!x.dead()) setTimeout(x.send, 150); }); }, 80);
      });
    }
  };
})();
