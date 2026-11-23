# OKEA board pack story (live, 23 Nov 2026): the newest CFO story

A read-only Prezi-style story over live Pigment data, built on the Reconomy CFO story (`../reconomy-cfo-story/`), with three upgrades Mike asked for on 23 Nov 2026:
- **an even pace**: the transitions had felt "not a uniform pace and a bit jolty";
- **tooltips** over the slide data;
- **click-to-drill** on the slide data.

Start new CFO stories from this one.

| File | What it is |
|---|---|
| `okea_story.src.js` | Frame source. `BRAND` (with the client's real logo as inline SVG) and `CFG` at the top are the per-client blocks; `NODES` and `SEQ` are the story tree and order |
| `okea_story_config.json` | Bindings and 8 data sources (no sinks) |
| `mock_sdk.js` | Mock SDK shaped like the live model, for the harness |

The OKEA build script (`build_story.py`) lives with the client files. It runs the frame kit's safe-code lint and writes `design.html` and `harness.html` the same way as `../frame-build-kit/`.

## What to lift

| Piece | Functions | Notes |
|---|---|---|
| Smooth camera | `ease()`, `zoomPath()`, `fly()`, `goId()` | One van Wijk zoom-and-pan curve (RHO 1.5). The ease rises on a sine for the first 28% of the move, holds, then settles over the last 28%. Duration = 1000 ms per unit of path, clamped 1.0-2.6 s. The target pulses during the move, not before it |
| Hit areas | `hit(x, y, w, h, r)` and the `hs` string in each chart | One invisible rect per row or column, drawn last, carrying `data-tip` and `data-drill` from the row object (`r.tip`, `r.drill`) |
| Tooltip | `onMove()`, `hideTip()`, `#ttp` | Built with `textContent`. First line bold; a line starting "Click " is the call to action. Shows only on `.card.cur` and hides while flying |
| Drill panel | `drillView()`, `dAsset()`, `dClass()`, `dYear()`, `dReason()`, `drTiles()`, `drTable()`, `openDrill()`, `renderDrill()`, `closeDrill()`, `#drill` | Keys `a\|`, `c\|`, `y\|`, `r\|`. Each view is tiles plus this-round / previous / change tables whose rows drill again. Back stack in `S.dstack`; Esc and Backspace close it first. Uses only data already loaded |
| Click order | `onClick()` | Panel buttons and rows first. Then a drill target on the current slide. Then the existing `data-act` and `data-go`. A click on the slide while the panel is open closes the panel instead of advancing |

Adapting it to another client: rewrite the drill views around that model's dimensions (entity, scheme, cost centre, month), keeping the key format `<type>|<value>`.

## Checking the motion

The Claude preview pane throttles `requestAnimationFrame`, so watching it tells you nothing. Replay the camera maths at 60 fps against the rendered layout instead:
1. Open `harness.html` in the preview at 1600×900.
2. Read each `.card`'s `style.left`, `style.top` and its transform scale, which give the camera targets (`camOf`).
3. Run the old and new path functions for every move in `SEQ`, sampling `1 / (duration / 16.67)` steps.
4. Per frame, perceived speed = `hypot(Δ ln zoom, Δ pan × zoom / viewport width) × 60`.

Report the peak speed over the mean, and the largest frame-to-frame change as a share of the peak.

OKEA's 13 moves:

| | Old (two legs, cubic ease) | New |
|---|---|---|
| Peak speed vs the move's average | up to 3.14× | 1.39-1.71× |
| Worst frame-to-frame speed jump | 80.7% of peak, at the joint between legs | 9.3% |
| Average speed, slowest to fastest move | 1.3 to 2.5 | 1.0 to 1.7 |

## Deploying it

The upgrade went live as 52 `update_frame_body` edits in 3 batches of about 18,000 characters. The live size matched the build to the byte (111,698). `../frame-build-kit/deploy_edits.py` now writes the batches and the size to expect after each.

Checked live:
- the hero tooltip;
- the dive into net cost by class;
- the CAPEX drill: 830.4 against 918.5 (−88.0), with Øst −64.2;
- the Øst asset view: share, class, year, products and sign-off.
