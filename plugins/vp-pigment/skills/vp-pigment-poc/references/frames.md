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
- **No storage.** Storage APIs (localStorage, sessionStorage, IndexedDB, cookies) are blocked in the sandbox and banned by Pigment's safe-code rules, so a frame remembers nothing between visits: no "tour seen" flag. The tour starts from the Guide button; tell the presenter to use it.
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
- No auto-start. A frame can't store a "tour seen" flag (storage is banned), and inside Pigment the tour never auto-started anyway. The Guide button is the only way in.
- Esc must close the tour. Test it; it has failed before.
- At least one step tells the viewer to do something specific ("Take the Mid-Market multiple to 5.5x") and what to watch.

## Bindings

- Name lists `xxxList`, metrics `mXxx`, data sources `dsXxx` and sinks `xxxSink`.
- Every sink binding must be a Metric or List that accepts input.
- Read list items from the bound lists, not from arrays typed into the code. Hard-coded values are only a fallback while data loads.
- One feed metric per data source in `06 Frame feeds`, summed to what the frame shows (year, not month), so no source passes 1,000 rows.

## Style

- Font stack: `Inter, "Segoe UI", system-ui, sans-serif`. System fonts only: a frame can't load web fonts, so Inter shows only where it is installed.
- A light theme, with all CSS in the frame body (Pigment's frame rules).
- VP palette mapped into a single `C = {...}` colour object.
- Rounded cards (16-20px), tabular numbers, soft borders `#e2e8f0`.
- Responsive: switch layout below about 760px and shrink chart padding below about 620px.
- Charts are inline SVG: line, stacked bar, bridge.

## Delivering through the MCP

- Keep readable source in the client folder (`specs/<client>/frames/<name>.js`) with its config JSON. The source is the master copy; the frame in Pigment is a deployment.
- The body is sent in full as a tool argument, so size is tokens: two 50 KB frames cost about 50k output tokens. Don't minify: Pigment's safe-code rules forbid minified frame code.
- **A body over about 20 KB:** create the frame with unique placeholder lines (`//P1`, `//P2`, ...), then replace each with `update_frame_body` in chunks under 20,000 characters, split on line boundaries. Compare the returned `bodySizeBytes` with the local file's byte size to confirm nothing was lost.
- **Keep non-ASCII characters as real UTF-8; never escape them.** Pigment's safe-code rules ban `\u` and `\x` escapes, so £, €, × and the en dash go into the body as the characters themselves. The live `bodySizeBytes` then equals the local file's UTF-8 byte size exactly (Reconomy, Nov 2026: 85,606 bytes both). This replaces the earlier advice to escape them and subtract the byte saving.
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
| `build_frame.py` | Run with `py -3.12 -I build_frame.py`. Writes the four files below and stops, writing nothing, on any check that fails. |
| `<name>.js` | The deployed body: the source with `story.json` (only the keys the frame reads, such as `explain` and `tour`) inlined at the placeholder, as real UTF-8 with no escapes. |
| `<name>_config.json` | Bindings, data sources and sinks for `create_frame`, generated from the lists in the script so the names can't drift. |
| `design.html` | The artifact-ready design page (see "Design in an Artifact, deploy to the frame"). |
| `harness.html` | The design page in a full HTML skeleton. It runs from `file://` in the browser pane with no server, as long as it is inside the session's project folder (the pane only shows a static snapshot of local files elsewhere; serve those with `serve.ps1`). |
| `mock_sdk.js` | A mock `PigmentSDK` (below). |
| `pull_design.py`, `deploy_edits.py` | Bring a restyled design page back, and deploy only the changed lines (see the next section). |

What the build script checks before writing anything:
- the placeholder was replaced, and the body passes `lint_frame`, a line-by-line check against Pigment's safe-code rules. It blocks fetch, XHR and WebSocket; storage APIs, `@import` and `url()`; postMessage and `window.top`/`parent`; eval, `new Function`, dynamic import and `document.write`; `location`, external URLs, `\u`/`\x` escapes, `atob`/`fromCharCode`, `<script` in markup, `javascript:` and Workers; and inline `on*=` handlers, `history.pushState`, string timers and `Proxy`/`Reflect`. `--no-lint` exists only to rebuild an old deployed baseline that predates the lint.
- every data source name and every sink name in the config appears in the body as a quoted string, so a renamed source fails the build, not the live frame
- it prints the body's UTF-8 byte size, which is the `bodySizeBytes` to expect, and the source, sink and binding counts

What the mock SDK does:
- **One data generator per source**, computed from a small in-memory input state that the sinks write to, so a lever visibly moves the numbers it should.
- **Filter positions per source**: which label position each list binding filters on. A filter on a binding that isn't mapped is logged to `window.__errors`, which catches a selector the real source doesn't have.
- **Limits**: counts live subscriptions (the 11th errors, as in Pigment), records the peak in `window.__maxSubs`, and logs any source over 1,000 rows.
- **Writes**: every `editValue` call goes to `window.__writes`; set `window.__refuse = true` to make writes fail and check the error toast.

Drive the harness with JavaScript from the browser pane at 1400px and 420px: open every step, check `window.__errors` is empty and `window.__maxSubs` is 10 or fewer, open and close the explain drawer (Back, Esc), step through the tour (Esc), move every lever, refuse a write, Reset and check every original comes back in `window.__writes`.

**SVG elements have no `.click()`.** A scripted `el.click()` on a chart bar or point throws a TypeError (`el.click is not a function`). Use `el.dispatchEvent(new MouseEvent('click', { bubbles: true }))`, which also reaches a click handler delegated on `#app`.

## Design in an Artifact, deploy to the frame (Mike, Reconomy 22 Nov 2026)

Mike gets the look he wants by working in claude.ai artifacts. So instead of describing a design for Claude to copy, he restyles the frame's own design page, and Claude deploys exactly what he approved. Uses the build kit in `assets/examples/frame-build-kit/`.

### 1. Publish the design page

- `build_frame.py` writes `design.html`: an artifact-ready page with a `<title>` ("<frame name> design"), the mock SDK in `<script id="mock-sdk">` and the real frame body in `<script id="frame-body">`. What Mike sees is the frame's real code running on mock data, not a mock-up.
- Publish it with the Artifact tool (private) and give Mike the link. Republish the same file to keep the same link.
- The page stays light even though artifacts usually follow dark mode: frames use a light theme.

### 2. Mike restyles it

- He changes it in claude.ai: colours, spacing, cards, charts. The changes land in the frame-body block's styles section and render strings.
- If he makes a free-form design artifact instead (his own page, not the design page), read it with the Artifact tool, port the look into the frame's styles and render strings by hand, rebuild, and republish the design page for his approval.

Rules the design must keep (Pigment's frame rules: `pigment:building-pigment-frames`, "Sandboxed runtime" and "Writing safe Frame code"):
- system fonts only: no Google Fonts, `@import` or CSS `url()`
- inline SVG for icons and images; no libraries or CDNs; no storage APIs
- a light theme
- all CSS inside the frame body's styles section: a `<style>` on the page does not deploy
- keep element ids, `data-*` attributes, the SDK calls and the data source and sink names

### 3. Pull it back

1. Save the page: Artifact tool, action `read`, `path` `index.html`. The result says where the file was saved.
2. Run `py -3.12 -I pull_design.py <saved file>`. It:
   - takes the **last** `<script id="frame-body">` block on the page. The page's comment names the tag too, and taking the first match picked up the wrong text once.
   - runs `lint_frame` and stops if the design broke a rule (fix it in the artifact first)
   - puts the explain and tour text back into `story.json`, and rewrites `<name>.src.js` with the `/*STORY_JSON*/{}` placeholder
   - writes `last_pull.diff`. Read it before going on: it shows exactly what the design changed.

### 4. Deploy only what changed

1. Run `build_frame.py`, then test `harness.html` (the checks above).
2. Run `py -3.12 -I deploy_edits.py`. It diffs `deployed.js` (an exact copy of the live body) against the new body and writes `deploy_edits.json`:
   - one edit per changed hunk, with context added until each `oldString` is unique in the live body
   - simulated in order before it is written, each string under 19,000 characters (the tool's limit is 20,000)
   - it prints the `bodySizeBytes` to expect
3. Send the file's contents as the `edits` of one `update_frame_body` call. The call is all or nothing: if one edit doesn't match, nothing changes.
4. Once Pigment's `bodySizeBytes` matches, run `py -3.12 -I deploy_edits.py --deployed` so `deployed.js` follows the live body. Start `deployed.js` the same way right after `create_frame`, once `search_frames` shows the expected size.
5. `update_frame_body` starts a new draft, so Mike publishes again.

Evidence from Reconomy (22 Nov 2026):
- artifact to source to build was byte-identical, with 0 edits
- a restyle dry run (accent colour and card radius) became 2 edits of 2,032 characters instead of an 86 KB resend
- the storage fix went live as 3 edits, and the live size matched the local file exactly (85,606 bytes)

## Submission and return workflow (Mike, Reconomy 22 Nov 2026)

Every cockpit with steps gets a real submission process, wired to the model, not to the screen. Copy it from `assets/examples/reconomy-cockpit/` (functions named in its README). Mike's feedback that set it:
- a step ticked as done just because he had visited it
- Next moved on with no "do you want to submit it?"
- he could see RLG was Returned but not why
- the pop-up let him submit Noventiz again although it was already submitted
- "2 of 3 submitted" didn't say which businesses
- the separate "Submit this step" and Next buttons looked untidy

### In the model (build it first)

| Metric | Type, dimensions | Who writes it |
|---|---|---|
| WF Stage Applies | Boolean, Stage × Entity | Set up once: which stages apply to which business |
| WF Stage Status | Dimension (Workflow Status), Stage × Entity. Formula `IF('WF Stage Applies', 'Workflow Status'."Not started")` with overrides on | The business (Submitted), the reviewer (Approved, Returned) |
| WF Stage Comment | Text, Stage × Entity | The business: its note when it submits |
| WF Return Reason | Text, Stage × Entity | The reviewer: why it went back. Kept as a record after resubmission |

Keep the business's note and the reviewer's reason in **two metrics**. With one comment field, resubmitting overwrites the reason and the reviewer can't see the conversation. Show both, plus status, owner, due date and progress, in every board's sign-off panel and in the tracker's review grid.

In the frame, comment, owner and return reason are one text source (same value type). Subscribe to it globally next to the status source, because every step shows them. Status, comment and return reason are three sinks.

### In the frame

- **Ticks follow status, never visits.** A step is done only when every business it applies to is Submitted or Approved. A step with a Returned business shows a red `!` in the rail.
- **The rail names who has to act.** Under each step: one coloured dot per business, then one line, e.g. "RLG returned", "Reconomy UK to submit", "Noventiz waiting for review" or "All approved". Never a bare count.
- **A status strip at the top of each step:**
  - one card per business with its status chip, a plain line ("Submitted, waiting for the group to review") and its owner
  - for each Returned business, a red box with the reason, the business's last note, and a **Fix and resubmit** button that opens the pop-up with only that business ticked
- **One action bar across the bottom.** A full-width bar that is a sibling of the scrolling area, not inside it, so it never scrolls away:
  - left: the step and one pill per business with its status
  - right: Back, **Submit step** with a count of businesses left to submit (or "All submitted"), and Next as the primary button
  - the toast sits above the bar
- **Next opens the submit pop-up only if something can be submitted.** In the pop-up:
  - Not started, In progress and Returned can be ticked, and start ticked. Submitted and Approved are greyed out with the reason ("Already submitted. Waiting for the group to review it.").
  - A Returned row shows **Why it came back** under it, and the comment box becomes "What did you change?". Resubmitting a returned business without saying what changed is blocked.
  - Show errors inside the pop-up: the toast sits behind the scrim.
  - The buttons are Cancel, Continue without submitting and Submit and continue. Write quietly, then show one toast for the lot ("Submitted compliance schemes for RLG. The group can now review it on the workflow tracker.").
- **The sign-off step shows where the round is.**
  - a stacked progress bar by status with counts and the round progress %
  - process columns Not started → In progress → Submitted → Approved, with a Returned lane underneath and an arrow back to In progress ("sent back to the business to fix, then submitted again")
  - every business and stage in it is a button that opens the review pop-up; the grid below shows the return reason in red in Returned cells
- **The review pop-up asks only what each status needs:**
  - Approve: no text, says it can't be resubmitted after that
  - Return: the reason is required and goes to Return reason; "the business sees this on its step"
  - any other status: a note, written to the comment
  - always show the business's note and, when re-reviewing, the previous return reason

### Boards

- Add Return reason to the sign-off panels and the review grid.
- **Build a new view fully configured (values, widths, formatting, filters) before it goes on any board, then repoint the widgets.** Any edit after that forks a draft, even on a view you created minutes earlier, and `save_draft_views` needs Mike's confirmation. If that happens, leave the draft and build the view again.

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
- **Close buttons Mike couldn't see** (Reconomy). A "ghost" button styled for the navy header (white text, transparent background) was reused in the white explain drawer and pop-ups, so Close was invisible. Use the light secondary style on white panels, and add a CSS fallback: `.drawer .btn.ghost, .modal .btn.ghost { color: navy; border-color: line; background: #fff }`.
- **The page jumps when a pop-up opens** (Reconomy). `render()` saved and restored the scroll position, but restored it before the charts were drawn. The charts are empty at that moment, so the page is shorter and the scroll position is cut short. Restore `scrollTop` after `drawCharts()`.
- **Figures touching chart bars** (Reconomy). Bar values drawn at the bar's end collide with the bars and with each other. Put them in their own right-hand column (about 90px, right-aligned), revenue and gross profit on two lines.
- **% sign hard against an input box** (Reconomy). Give a unit after an input its own span with a 6px left margin.
