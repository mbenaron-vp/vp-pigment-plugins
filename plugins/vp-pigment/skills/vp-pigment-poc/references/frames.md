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
- **A data source cannot mix value types.** A text or dimension list property and numeric metrics need separate sources.
- **`update_frame` replaces the frame wholesale** and needs the full body, so changing data sources or bindings costs a full resend. `update_frame_body` find-and-replace is cheap for code-only fixes. Get the data sources right first time.
- **The frame's browser storage appears blocked inside Pigment**, so the localStorage "tour seen" check treats the tour as seen and it doesn't auto-start. The Guide button works; tell the presenter to use it.
- Frames are created **private** and the MCP has no field to change it. Mike must untick private in Pigment before anyone else opens it.
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
- The body is sent in full as a tool argument, so size is tokens: two 50 KB frames cost about 50k output tokens. Minify only if it's large and the machine has a minifier.
- After `create_frame`, read it back with `search_frames` and compare it with the local file. Small fixes go through `update_frame_body` find-and-replace; mirror them in the local file.

## Testing a frame locally (no Node or Python needed)

Mike's machine has no Node or Python, so test with plain HTML and PowerShell:

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
