# Frame build kit (Nov 2026)

Build a frame from readable source with Python and test it against a mock SDK, as on the Reconomy POC. Use it where Python is available (`py -3.12`); without Python, use `../../frame-test-harness.html` and `../../serve.ps1`. The rules behind it are in `references/frames.md`, "With Python: a build script and a self-contained harness".

| File | What it is |
|---|---|
| `build_frame.py` | Inlines `story.json`, escapes non-ASCII, writes the deployed body, the `create_frame` config and `harness.html`, and checks names and sizes |
| `mock_sdk.js` | Mock `PigmentSDK`: a generator per data source over an input state the sinks write to, filter positions, the 10-subscription limit, `__writes`, `__refuse` |
| `example_frame.src.js` | A small working frame (one source, one lever, KPI tiles, a clickable SVG chart, click-to-explain, queued writes, Reset) to show the pattern. Copy the structure from the Trust Payments example for a real cockpit. |
| `story.json` | Sample story text for the example. On a POC, the build script reads the client's `story.json` one folder up instead. |

## Use it on a POC

1. Copy `build_frame.py` and `mock_sdk.js` into `specs/<client>/frames/`. Write `<name>.src.js` with `var STORY = /*STORY_JSON*/{};` where the story text goes.
2. In `build_frame.py`, set `NAME`, `TITLE` and `STORY_KEYS`, and fill `BINDINGS`, `SOURCES` and `SINKS` with the app's ids.
3. In `mock_sdk.js`, edit the three parts marked EDIT: the input state, one generator per source (rows in binding order) with its filter positions, and what each sink writes.
4. Run `py -3.12 -I build_frame.py`. It writes `<name>.js`, `<name>_config.json` and `harness.html`, and prints the byte size Pigment will report as `bodySizeBytes`.
5. Open `harness.html` in the browser pane. From `file://` the pane runs it only inside the session's project folder (`specs/<client>/frames/` is fine); anywhere else, serve the folder with `../../serve.ps1` and open `http://localhost:8765/harness.html`.
6. Create the frame with `create_frame` from the config and the body (chunked if over 20 KB), then compare `bodySizeBytes` with the size the build printed.

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
