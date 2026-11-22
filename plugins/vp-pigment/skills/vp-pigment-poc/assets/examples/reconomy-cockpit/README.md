# Reconomy cockpit (Nov 2026)

The newest house-standard cockpit. Four steps: two driver engines, a group forecast, then sign-off. Mike shaped the look in an Artifact design page, and the submission workflow came from his review. Build it with the `frame-build-kit` scripts: copy the bindings, data sources and sinks from `reconomy_cockpit_config.json` into `build_frame.py`, pointed at the client's ids.

| File | What it is |
|---|---|
| `reconomy_cockpit.src.js` | The frame source. `var STORY = /*STORY_JSON*/{};` is filled from the client's `story.json` (`explain`, `tour`) at build time |
| `mock_sdk.js` | Mock PigmentSDK for the design page and harness: one generator per source, sinks write to an in-memory state, 10-subscription limit |
| `reconomy_cockpit_config.json` | Bindings (39), data sources (11) and sinks (11) as sent to `create_frame` / `update_frame` |

## What to lift, by function

| Need | Functions |
|---|---|
| Branded header, KPI strip, answer line | `header`, `kpiStrip`, `answer`, the `C` palette and CSS type scale (11/12/13/14/20/26px) |
| Step rail that ticks on status and names who must act | `stageInfo`, `stageLine`, `dots`, `stepSub`, `rail`, `stepDone` |
| Status strip with return reasons on each step | `stageStrip`, `panelHead` |
| Action bar across the bottom | `stepNav` (rendered after `</main>` in `render`) |
| Submit pop-up: lock submitted rows, show why returned, require "what changed" | `openSubmit`, `submitModal`, `saveSubmit`, `SUB_WHY` |
| Sign-off step: progress bar and process columns with a Returned loop | `flowCard`, `flowCol`, `flowItems`, `p4` |
| Review pop-up: approve, return with a required reason, or note | `signoffModal`, `keepSoNote`, `saveSignoff` |
| Pixel-true SVG charts with crosshair tooltips and expand | `card`, `hbars`, `lineChart`, `drawCharts`, `barSvg`, `lineSvg`, `chartHover`, `expandModal` |
| Queued writes, one toast per action, Reset | `write` (its `quiet` flag), `flush`, `resetAll` |
| Click-to-explain drawer with Back stack, tour | `EX`, `drawer`, `openEx`, `tourHtml`, `tourStep` |

## The model it needs

The workflow metrics (Stage × Entity): WF Stage Applies (Boolean), WF Stage Status (Dimension, defaults to Not started where the stage applies), WF Stage Comment (Text, the business's note), WF Return Reason (Text, the reviewer's reason). See "Submission and return workflow" in `references/frames.md`.

## Client-specific parts to replace

- `PRN`, `NOV`: the two levers on step 1 (scheme and line names)
- `STEPS`, `SUBN`: step names
- `p1` to `p3`: the client's driver screens
- `V`, `VB`, `R12`, `VIEW`, `PLM`, `LAST_ACT`: version names and month windows
- The header pills and the logo in `IC.logo`
