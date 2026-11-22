# The cockpit frame (house standard)

Frames are the optional finale, built after the boards work. Every POC gets one without being asked. Every number and input in a frame reads from or writes to the same metrics the boards use, so the frame never holds logic of its own.

The cockpit walks the user through their process step by step, with filters, a Guide button that highlights each area in turn, and the levers for the story. A reporting frame (board pack) follows the same rules.

Start from a reference and copy its structure; don't reinvent it:
- `assets/examples/trust-payments-spm-cockpit/spm_cockpit.js`: the newest, readable house-standard frame. It has a step rail, KPI strip, answer line, click-to-explain drawer with a Back stack, guided tour, Reset, queued writes, and subscriptions managed within the limit.
- The FRP and MAT reference frames in SKILL.md, read with `search_frames` by id.

## Pigment limits (found on live builds, not in the docs)

- **At most 10 active data-source subscriptions per frame.** The 11th fails with "Too many active subscriptions for this resource". Plan the sources before building:
  - unsubscribe lookup sources once loaded
  - compute small aggregates in JS from a source you already have instead of subscribing to another
  - for a frame with many screens (FRP cockpit: 35 sources, 13 screens), keep a few global sources, and subscribe each screen's sources only while that screen is open: unsubscribe them when the step changes
- **A data source cannot mix value types.** A text or dimension list property and numeric metrics need separate sources.
- **`update_frame` replaces the frame wholesale** and needs the full body, so changing data sources or bindings costs a full resend. `update_frame_body` find-and-replace is cheap for code-only fixes. Get the data sources right first time.
- **The frame's browser storage appears blocked inside Pigment**, so the localStorage "tour seen" check treats the tour as seen and it doesn't auto-start. The Guide button works; tell the presenter to use it.
- Frames are created **private** and the MCP has no field to change it. Mike must untick private in Pigment before anyone else opens it. **`update_frame` (full replace) sets the frame back to private and starts a new draft**, even after Mike has published and unticked it: tell him to publish and untick again. `update_frame_body` also starts a draft but keeps the private setting.
- Pigment asks the user for **permission the first time a frame writes**. Claude can't approve it, so frame writes are only proven once a person has clicked through. The presenter should choose "For this session" at the first Apply; otherwise it asks again for every cell.

## Lifecycle and safety

- Render into `#app`. Call any existing `root.__cleanup()` first, then clear it.
- Make it a full-viewport fixed layout.
- Track subscriptions, timers and listeners. Define `root.__cleanup` to unsubscribe, clear timers and remove listeners.
- Guard every callback with a `disposed` flag.

## Reading data

- `window.PigmentSDK.subscribeToDataSource(name, { dynamicFilters: [], onData, onError })`.
- In `onData`, ignore payloads where any label or value has `kind === 'loading'`.
- Read `d.rows[i].labels` and `d.rows[i].values`. Large sources page at 500 rows: use `updateScroll({ offset })` until `totalRowCount` is reached.
- Warn on screen when `d.totalRowCount > 1000`.
- Show `onError` messages in a visible error strip. Never fail silently.

## Writing data

- `PigmentSDK.editValue(sinkName, coords, value)`. Coords are keyed by the List binding names, for example `{ pillarList: 'Corporate Finance', locationList: 'Birmingham' }`.
- Wrap the call in a promise.
- Before the first write to a cell, capture its original value in an `ORIG` map.
- While writing, show a busy message ("Writing to Birmingham Corporate Finance…").
- On success, show a plain confirmation ("Salary increase 5% for Birmingham Corporate Finance.").
- On failure, show a toast: "Pigment did not save the change: …".
- For rapid slider input, queue writes as MAT does: one write in flight, the latest value held as pending, and the frame's own queue `flush()` sending the pending value when the previous write completes. `flush()` is the frame's code, not an SDK call. Then show a short "recalculating" state before re-reading.

## Reset

A "Reset" button writes every `ORIG` value back and confirms "Back to the [baseline name]".

**A lever on a month input that is normally blank.** Some inputs are typed only in the month a rate changes and carried forward by the formula (a tax rate per tonne from April, read with FILLFORWARD). If a lever writes to a month that is blank at baseline (the next April), `ORIG` captures a blank and Reset writes a blank back instead of a number, which can't be relied on to restore the baseline. Before building the lever, set that month's baseline value explicitly with `set_metric_input`, equal to the rate carried forward into it. No result changes, `ORIG` captures a number and Reset writes it back. Record the explicit value in the build spec and the demo script's reset table.

## Layout

- A header with client name, the same filters the boards use (defaulting to the story's opening case) and a KPI strip.
- An "answer" line: one sentence written from the live numbers that rewrites itself when a lever moves.
- A left step rail with numbered steps that scroll to their panels.
- Each panel has a number badge, an H2 title, a one-sentence lead and its content.
- Show the baseline as a dashed line and "now" as a solid line. Tag months that moved.

## Click-to-explain

- **What's clickable:** every headline number, KPI tile, chart point, chart total and driver tile. Each carries a visible cue: "How it's worked out ›".
- **What the panel shows,** in this order (built from `story.json` `explain`):
  1. title, live value, and "What it is" in one plain sentence
  2. the formula in words
  3. the same formula with today's live numbers
  4. the rows behind it, read live from the model, by month and by the relevant dimension
  5. "What changes it", with buttons that open the driver editor
  6. "Where to change it on the boards"
- **Every operand is clickable** and opens its own explanation, with a Back stack.
- **Keyboard:** Enter and Space open the panel; Esc closes it.

The explain text should match Part 1 of the demo script; both come from `story.json`.

## Guided tour

- A "? Guide" button, always visible top-right, in a navy-to-Sid-Blue gradient.
- Tour steps come from `story.json` (target element id, title, body).
- Use a spotlight cut-out with a pulsing outline and a card with Next, Back, Skip and "n of N".
- Auto-start once per browser after data has loaded, using a versioned localStorage key (`<client>_<frame>_tour_seen_v1`) wrapped in try/catch. Inside Pigment this usually won't fire (storage blocked), so the Guide button is the real entry point.
- Esc must close the tour. Test it; it has failed before.
- At least one step tells the viewer to do something specific ("Take the Mid-Market multiple to 5.5x") and what to watch.

## Bindings

- Name lists `xxxList`, metrics `mXxx`, data sources `dsXxx` and sinks `xxxSink`.
- Every sink binding must be a Metric or List that accepts input.
- Read list items from the bound lists, not from arrays typed into the code. Hard-coded values are only a fallback while data loads.
- One feed metric per data source in `06 Frame feeds`, summed to what the frame shows (year, not month), so no source passes 1,000 rows.

## Style

- Font stack: `Inter, "Segoe UI", system-ui, sans-serif`.
- VP palette mapped into a single `C = {...}` colour object.
- Rounded cards (16-20px), tabular numbers, soft borders `#e2e8f0`.
- Responsive: switch layout below about 760px and shrink chart padding below about 620px.
- Charts are inline SVG: line, stacked bar, bridge.

## Delivering through the MCP

- Keep readable source in the client folder (`specs/<client>/frames/<name>.js`) with its config JSON. The source is the master copy; the frame in Pigment is a deployment.
- The body is sent in full as a tool argument, so size is tokens: two 50 KB frames cost about 50k output tokens. Don't minify: Pigment's safe-code rules forbid minified frame code.
- **A body over about 20 KB:** create the frame with unique placeholder lines (`//P1`, `//P2`, ...), then replace each with `update_frame_body` in chunks under 20,000 characters, split on line boundaries. Compare the returned `bodySizeBytes` with the local file's byte size to confirm nothing was lost.
- **Escaped characters make the live body smaller.** If the build escapes non-ASCII characters (`\u00a3` for £), the body Pigment stores has the real characters instead. The escapes are converted on the way in, possibly before Pigment sees them: Claude's tool calls also turn `\u` escapes in their arguments into characters. The frame still works, but `bodySizeBytes` is smaller than the local file: each 6-byte escape becomes a 2-byte (£, ×) or 3-byte (€, the en dash) UTF-8 character. Subtract that saving before comparing (Reconomy, Nov 2026: local 86,032 bytes, live 85,930, 102 bytes saved by the £ and € escapes). The build kit in `assets/examples/frame-build-kit/` prints the size to expect.
- After `create_frame`, read it back with `search_frames` and compare it with the local file. Small fixes go through `update_frame_body` find-and-replace; mirror them in the local file.

## Testing a frame locally

Without Python (Mike's machine has no Node), test with plain HTML and PowerShell; with Python, use the build script below.

1. Copy `assets/frame-test-harness.html` next to the frame's `.js`, rename the script tag, and fill the `D` object with sample rows for each data source, shaped as the frame expects (`labels` then `values`, in binding order).
2. Run `assets/serve.ps1` in that folder (a PowerShell HttpListener on http://localhost:8765). `file://` only renders a static snapshot, so serve it.
3. Open it in the browser pane at 1400px and 420px. Check:
   - `window.__errors` is empty
   - every panel renders
   - the explain drawer opens and closes (Esc)
   - the tour steps through and Esc closes it
   - writes appear in `window.__writes`
   - Reset writes the originals back
4. Then test on the live model: each lever writes, the data source changes, Reset restores the baseline.
   - Until Mike publishes, the frame's normal URL shows only "You are viewing a draft". Open `.../frames/<id>/edit` in a **new** Chrome tab: an older background tab's renderer freezes and screenshots time out.
   - The first click just after the frame loads is sometimes ignored; click again.

### With Python: a build script and a self-contained harness (Reconomy, Nov 2026)

Where Python is available (`py -3.12` on Mike's machine since Nov 2026), build the frame from a script instead of editing the deployed body by hand. A generic copy is in `assets/examples/frame-build-kit/`. Keep these files in `specs/<client>/frames/`:

| File | What it is |
|---|---|
| `<name>.src.js` | The readable source, the master copy. It holds `var STORY = /*STORY_JSON*/{};` where the story text goes, and may use £, € and other characters directly. |
| `build_frame.py` | Run with `py -3.12 -I build_frame.py`. Writes the three files below and stops on any check that fails. |
| `<name>.js` | The deployed body: the source with `story.json` (only the keys the frame reads, such as `explain` and `tour`) inlined at the placeholder and every non-ASCII character escaped to `\uXXXX`, so the body is pure ASCII. |
| `<name>_config.json` | Bindings, data sources and sinks for `create_frame`, generated from the lists in the script so the names can't drift. |
| `mock_sdk.js` | A mock `PigmentSDK` (below). |
| `harness.html` | The mock SDK and the deployed body inlined into one page. It runs from `file://` in the browser pane with no server, as long as it is inside the session's project folder (the pane only shows a static snapshot of local files elsewhere; serve those with `serve.ps1`). |

What the build script checks before writing anything:
- the placeholder was replaced and the body encodes as ASCII
- every data source name and every sink name in the config appears in the body as a quoted string, so a renamed source fails the build, not the live frame
- it prints the body's byte size, the size Pigment will report once it stores the escapes as real characters (see "Delivering through the MCP"), and the source, sink and binding counts

What the mock SDK does:
- **One data generator per source**, computed from a small in-memory input state that the sinks write to, so a lever visibly moves the numbers it should.
- **Filter positions per source**: which label position each list binding filters on. A filter on a binding that isn't mapped is logged to `window.__errors`, which catches a selector the real source doesn't have.
- **Limits**: counts live subscriptions (the 11th errors, as in Pigment), records the peak in `window.__maxSubs`, and logs any source over 1,000 rows.
- **Writes**: every `editValue` call goes to `window.__writes`; set `window.__refuse = true` to make writes fail and check the error toast.

Drive the harness with JavaScript from the browser pane at 1400px and 420px: open every step, check `window.__errors` is empty and `window.__maxSubs` is 10 or fewer, open and close the explain drawer (Back, Esc), step through the tour (Esc), move every lever, refuse a write, Reset and check every original comes back in `window.__writes`.

**SVG elements have no `.click()`.** A scripted `el.click()` on a chart bar or point throws a TypeError (`el.click is not a function`). Use `el.dispatchEvent(new MouseEvent('click', { bubbles: true }))`, which also reaches a click handler delegated on `#app`.


## Drill everywhere (Mike, FRP 17 Nov 2026)

Mike's verdict on a frame where only the KPI tiles opened an explanation: "none of it's drillable... the charts are not an improvement over the Pigment charts". The house standard is now:

- **Every number on screen opens its explanation**: grid cells, year totals, row names, mini KPI tiles, chart bars and points. Build it once, generically:
  - a per-render registry: `dx(obj)` stores `{ t, v, what, f, parts, series, step, where }` under an id and the cell gets `data-dx`; one click handler opens the drawer from the registry. Reset the registry at the start of each render.
  - month grids: give each row an `x` spec `{ f: 'formula in words', parts: [[label, getter(month), fmt, drill, kind]] }`; the cell drawer shows the parts for that month (or summed for the year, first/last month for opening/closing rows) and a mini bar chart of the row with the clicked month highlighted.
  - parts can carry their own drill object, so the drawer drills down a level with a Back stack (P&L subtotal → its lines → one line by month).
  - person rows: the drawer shows the person's calculation chain (hours → available → chargeable → rate → work done; salary → pension → NI → cost).
- **Charts are interactive**: a hover tooltip (one fixed div moved on mousemove over `[data-tip]`), click a bar or point to drill, and an **Expand** button on every chart card that opens it full width in a modal.
- **Sign-off is a button, not a drop-down**: "Sign off this step" opens a pop-up with the status and a note on what was done, writing the status and a stage comment metric (Workflow Stage × Location, text). Show the last note on the sign-off bar.
- **Leave pure input screens to the boards.** Mike dropped the frame's "Input sheet and rates" step: settings tables add nothing in a frame. The frame steps should be where a change visibly moves something.

## Frame bugs Mike found (fix before shipping)

- **First month header stuck and left-aligned when scrolling right.** `th:first-child` also matches the first month cell of the second header row. Put the sticky-left rule on an explicit class (`th.c0`), and give the second header row `top` equal to the first row's height.
- **Clicks lost.** A re-render between pointer down and up replaces the button under the cursor. Set a flag on `pointerdown`, skip renders while it is set, and render once on `pointerup`.
- **Read-only cells look like text.** Give drillable cells `cursor:pointer` and a hover outline so it is obvious they open something.
