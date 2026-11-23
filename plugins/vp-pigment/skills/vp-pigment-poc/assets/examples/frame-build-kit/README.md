# Frame build kit (Nov 2026)

Build a frame from readable source with Python, check it against Pigment's safe-code rules, test it against a mock SDK, let Mike restyle it as a claude.ai Artifact, and deploy only what changed. Proven on the Reconomy POC. Use it where Python is available (`py -3.12`); without Python, use `../../frame-test-harness.html` and `../../serve.ps1`. The rules behind it are in `references/frames.md`: "With Python: a build script and a self-contained harness" and "Design in an Artifact, deploy to the frame".

| File | What it is |
|---|---|
| `build_frame.py` | Inlines `story.json`, runs `lint_frame` (Pigment's safe-code rules), and writes the deployed body (real UTF-8, no escapes), the `create_frame` config, `design.html` and `harness.html` |
| `pull_design.py` | Brings a restyled design page back: last frame-body block, lint, story text into `story.json`, source rewritten, `last_pull.diff` |
| `deploy_edits.py` | Diffs `deployed.js` (the live body) against the new build and writes `update_frame_body` edits; `--deployed` once Pigment confirms the size |
| `mock_sdk.js` | Mock `PigmentSDK`: a generator per data source over an input state the sinks write to, filter positions, the 10-subscription limit, `__writes`, `__refuse` |
| `example_frame.src.js` | A small working frame (one source, one lever, KPI tiles, a clickable SVG chart, click-to-explain, queued writes, Reset) to show the pattern. Copy the structure from the Trust Payments example for a real cockpit. |
| `trace_logo.js` | Traces the client's raster logo (PNG, WebP, JPG) into SVG paths in the browser, on the client's own website. Method and checks in `references/frames.md`, "No logo file from Mike" |
| `story.json` | Sample story text for the example. On a POC, the scripts read the client's `story.json` one folder up instead. |

## Use it on a POC

1. Copy the three scripts and `mock_sdk.js` into `specs/<client>/frames/`. Write `<name>.src.js` with `var STORY = /*STORY_JSON*/{};` where the story text goes, and all CSS in one styles section.
2. In `build_frame.py`, set `NAME`, `TITLE` and `STORY_KEYS`, and fill `BINDINGS`, `SOURCES` and `SINKS` with the app's ids.
3. In `mock_sdk.js`, edit the three parts marked EDIT: the input state, one generator per source (rows in binding order) with its filter positions, and what each sink writes.
4. Run `py -3.12 -I build_frame.py`. It stops if the body breaks a safe-code rule, and prints the byte size Pigment will report as `bodySizeBytes`.
5. Open `harness.html` in the browser pane. From `file://` the pane runs it only inside the session's project folder (`specs/<client>/frames/` is fine); anywhere else, serve the folder with `../../serve.ps1` and open `http://localhost:8765/harness.html`.
6. Create the frame with `create_frame` from the config and the body (chunked if over 20 KB). Once `search_frames` shows the expected size, run `py -3.12 -I deploy_edits.py --deployed`.

## Design loop

1. Publish `design.html` with the Artifact tool (private) and give Mike the link.
2. When he has restyled it, save it with the Artifact tool (action `read`, path `index.html`) and run `py -3.12 -I pull_design.py <saved file>`. Read `last_pull.diff`.
3. Rebuild, test `harness.html`, then run `py -3.12 -I deploy_edits.py` and send `deploy_edits.json` as the `edits` of one `update_frame_body` call.
4. When the live `bodySizeBytes` matches, run `py -3.12 -I deploy_edits.py --deployed`. Mike publishes the new draft.

## Scripted checks (paste into the browser pane's JavaScript tool)

```js
const wait = ms => new Promise(r => setTimeout(r, ms));
await wait(500);
const out = { errors: [...window.__errors], maxSubs: window.__maxSubs };
// SVG has no .click(): dispatch the event instead
document.querySelector('rect[data-dx]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
await wait(50); out.drawer = !!document.querySelector('.drawer');
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
await wait(50); out.closedByEsc = !document.querySelector('.drawer');
document.querySelector('button[data-act="up"]').click(); await wait(800);
window.__refuse = true; document.querySelector('button[data-act="down"]').click(); await wait(400);
out.refusedToast = (document.querySelector('.toast') || {}).textContent; window.__refuse = false;
document.getElementById('resetBtn').click(); await wait(800);
out.writes = window.__writes; out.errorsAfter = [...window.__errors];
out
```

Expect empty `errors`, `maxSubs` of 10 or fewer, the drawer opening and closing, a "Pigment did not save the change" toast, and Reset's writes putting every original value back.

The ids in `build_frame.py` are placeholders and the data in `mock_sdk.js` is illustrative.
