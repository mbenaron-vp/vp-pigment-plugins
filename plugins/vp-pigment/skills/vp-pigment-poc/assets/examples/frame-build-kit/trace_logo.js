// Trace a client's raster logo (PNG/WebP/JPG) into SVG paths, in the browser.
// Run it on the client's own website (same origin, so the canvas isn't tainted), e.g. with the
// Chrome javascript tool. First used on 23 Nov 2026 for a client whose site had WebP logos only.
//
// 1. Set URL to the logo file and SEEDS to the logo's flat colours (rough values are fine; they are refined).
// 2. Run. window.__logo holds { seeds, bbox, paths: {name: d} }. Each path is evenodd-ready.
// 3. Put the result in the page as text and read it with get_page_text (javascript results truncate at ~1,000 chars).
// 4. Overlay-check against the original at 5x on light and dark backgrounds before using it.
//
// Method: per-pixel membership to each colour (inverse squared distance) x alpha -> marching squares at
// ISO (lower ISO for shapes drawn on top, so they cover seams) -> Douglas-Peucker simplification.
(async function () {
  var URL = '/path/to/logo.webp';  // EDIT: the logo file, on this site
  var SEEDS = { white: [255, 255, 255], blue: [64, 100, 224], green: [0, 200, 90] };  // EDIT: the logo's colours
  var ISO = { white: 0.5, blue: 0.4, green: 0.4 };  // 0.5 for the base layer, 0.4 for shapes drawn on top
  var EPS = 0.3;

  var im = new Image(); im.src = URL; await im.decode();
  var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  var W = c.width, H = c.height, D = g.getImageData(0, 0, W, H).data;
  var d2 = function (a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]) + (a[2] - b[2]) * (a[2] - b[2]); };
  var keys = Object.keys(SEEDS);

  // refine the seed colours from solid pixels
  for (var it = 0; it < 3; it++) {
    var acc = {}; keys.forEach(function (k) { acc[k] = [0, 0, 0, 0]; });
    for (var i = 0; i < D.length; i += 4) {
      if (D[i + 3] < 250) continue;
      var p = [D[i], D[i + 1], D[i + 2]], best = null, bd = 1e9;
      keys.forEach(function (k) { var dd = d2(p, SEEDS[k]); if (dd < bd) { bd = dd; best = k; } });
      if (bd < 3600) { acc[best][0] += p[0]; acc[best][1] += p[1]; acc[best][2] += p[2]; acc[best][3]++; }
    }
    keys.forEach(function (k) { if (acc[k][3]) SEEDS[k] = [acc[k][0] / acc[k][3], acc[k][1] / acc[k][3], acc[k][2] / acc[k][3]]; });
  }

  // membership fields, padded by one pixel of zeros so every contour closes
  var GW = W + 2, GH = H + 2, F = {}, minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
  keys.forEach(function (k) { F[k] = new Float32Array(GW * GH); });
  for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
    var j = (y * W + x) * 4, a = D[j + 3] / 255;
    if (a <= 0.02) continue;
    if (a > 0.3) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
    var q = [D[j], D[j + 1], D[j + 2]], ws = {}, s = 0;
    keys.forEach(function (k) { ws[k] = 1 / (d2(q, SEEDS[k]) + 1); s += ws[k]; });
    keys.forEach(function (k) { F[k][(y + 1) * GW + x + 1] = a * ws[k] / s; });
  }

  function trace(f, iso) {
    var segs = [], adj = new Map(), V = function (x, y) { return f[y * GW + x]; };
    function pt(key) {
      var t = key[0], xy = key.slice(1).split(',').map(Number), x0 = xy[0], y0 = xy[1];
      var x1 = t === 'h' ? x0 + 1 : x0, y1 = t === 'h' ? y0 : y0 + 1, v0 = V(x0, y0), v1 = V(x1, y1), tt = (iso - v0) / (v1 - v0);
      return [x0 + (x1 - x0) * tt - 0.5, y0 + (y1 - y0) * tt - 0.5];
    }
    function add(a, b) { var n = segs.length; segs.push([a, b]); [a, b].forEach(function (k) { if (!adj.has(k)) adj.set(k, []); adj.get(k).push(n); }); }
    for (var y = 0; y < GH - 1; y++) for (var x = 0; x < GW - 1; x++) {
      var tl = V(x, y) >= iso, tr = V(x + 1, y) >= iso, br = V(x + 1, y + 1) >= iso, bl = V(x, y + 1) >= iso;
      var cs = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
      if (cs === 0 || cs === 15) continue;
      var T = 'h' + x + ',' + y, R = 'v' + (x + 1) + ',' + y, B = 'h' + x + ',' + (y + 1), L = 'v' + x + ',' + y;
      var ctr = (V(x, y) + V(x + 1, y) + V(x + 1, y + 1) + V(x, y + 1)) / 4 >= iso;
      switch (cs) {
        case 1: add(L, B); break; case 2: add(B, R); break; case 3: add(L, R); break; case 4: add(T, R); break;
        case 5: if (ctr) { add(T, L); add(B, R); } else { add(L, B); add(T, R); } break;
        case 6: add(T, B); break; case 7: add(T, L); break; case 8: add(T, L); break; case 9: add(T, B); break;
        case 10: if (ctr) { add(T, R); add(L, B); } else { add(T, L); add(B, R); } break;
        case 11: add(T, R); break; case 12: add(L, R); break; case 13: add(B, R); break; case 14: add(L, B); break;
      }
    }
    var used = new Uint8Array(segs.length), loops = [];
    for (var s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue; used[s0] = 1;
      var start = segs[s0][0], cur = segs[s0][1], ks = [start, cur], guard = 0;
      while (cur !== start && guard++ < 1e6) {
        var nx = adj.get(cur).find(function (n) { return !used[n]; });
        if (nx === undefined) break;
        used[nx] = 1; var sg = segs[nx]; cur = sg[0] === cur ? sg[1] : sg[0]; if (cur !== start) ks.push(cur);
      }
      loops.push(ks.map(pt));
    }
    return loops;
  }
  function rdp(p, e) {
    if (p.length < 3) return p;
    var a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1e-9, dm = 0, ix = 0;
    for (var i = 1; i < p.length - 1; i++) { var d = Math.abs(dy * p[i][0] - dx * p[i][1] + b[0] * a[1] - b[1] * a[0]) / L; if (d > dm) { dm = d; ix = i; } }
    if (dm > e) { var l = rdp(p.slice(0, ix + 1), e), r = rdp(p.slice(ix), e); return l.slice(0, -1).concat(r); }
    return [a, b];
  }
  function closedRdp(lp, e) {
    var far = 0, fd = 0;
    for (var i = 1; i < lp.length; i++) { var d = Math.hypot(lp[i][0] - lp[0][0], lp[i][1] - lp[0][1]); if (d > fd) { fd = d; far = i; } }
    var A = rdp(lp.slice(0, far + 1), e), B = rdp(lp.slice(far).concat([lp[0]]), e);
    return A.slice(0, -1).concat(B.slice(0, -1));
  }
  var n1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
  function toPath(loops) {
    return loops.filter(function (l) { return l.length >= 6; }).map(function (l) {
      return 'M' + closedRdp(l, EPS).map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' ') + 'Z';
    }).join('');
  }
  var paths = {};
  keys.forEach(function (k) { paths[k] = toPath(trace(F[k], ISO[k])); });
  window.__logo = { seeds: SEEDS, bbox: [minx, miny, maxx, maxy], paths: paths };
  return JSON.stringify({ bbox: window.__logo.bbox, lengths: keys.map(function (k) { return k + ' ' + paths[k].length; }) });
})();
