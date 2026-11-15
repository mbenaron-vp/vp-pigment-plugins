---
name: vp-pigment-poc
description: "Build or review a client-tailored, VantagePoint-branded Pigment demo or POC app: run of show, story, polished boards, guided cockpit frame, a two-part demo script (model explainer, then click path) and a test pass. Use for any VantagePoint client demo or POC build, review, board clean-up or demo prep in Pigment."
---

# VP Pigment POC

Builds a Pigment demo or POC app for a named prospect. It sits on top of Pigment's own build skills (`pigment@pigment`) and adds the parts they don't cover:

- the client story
- the VantagePoint look
- a guided cockpit frame with click-to-explain
- a demo script that teaches Mike the model, then the clicks
- the test pass

The bar:
- The prospect sees their own business, numbers and vocabulary on every screen.
- A presenter can run the whole demo from the boards and the frame alone, with the Pigment side panel closed.
- Mike can explain every number on every board and answer a critical question about it, because the demo script taught him.

## Reference files (read them at the step that needs them)

| File | Read before |
|---|---|
| `references/boards.md` | Creating or changing any board or view: grid units, widths, metric names, drafts and repointing, colour, nav, Home board |
| `references/frames.md` | Building or changing a frame: Pigment limits, SDK patterns, explain panel, tour, local testing |
| `references/demo-script.md` | Writing the demo script: Part 1 model explainer and Part 2 click path |
| `references/testing.md` | The test pass and the browser check |
| `assets/frame-test-harness.html`, `assets/serve.ps1` | Testing a frame locally |
| `assets/examples/trust-payments-spm-cockpit/` | A complete house-standard frame to copy from |

## Two modes

| Mode | When | What to run |
|---|---|---|
| **Build** | No app yet | Phases 0-6 in order |
| **Review** | An app exists and a demo is coming | "Review mode" below, then the relevant parts of Phases 4-6. Mike will do a quick human check, read the demo script, then demo. Leave everything ready for that. |

When several demos are being prepared, work in demo-date order and say which comes first.

## Working files (Claude Code)

- Each client has a folder `specs/<client>/` in the project: source files, `build-spec.md`, `demo-script.md`, frame source (`frames/`), prep doc, test results. Nothing goes in the project root.
- At the start of a session about an existing client, read its `build-spec.md` first and carry on from it.
- Keep `build-spec.md` current as you build: app and board ids, dimensions, metrics, changes by date, test results and open questions.
- Never change an application listed in the project's `.claude/protected-apps.txt`. Before a large structural change, duplicate the app.
- Confirm the workspace and application before the first change.

## Run of show and timing

Every demo gets a run of show that fits the slot. Work it out before touching the app.

| Block | Typical length | Source |
|---|---|---|
| Intro and slides | 10-15 min | VP deck |
| Pigment 101 | About 20 min for an FP&A audience; less if they've already seen Pigment | Standard product tour app, chosen to match their brief |
| The use case | Whatever is left after the other blocks | The client's POC app |
| Questions | Throughout; keep 5-10 min of slack | |
| Next steps | 5 min | Wrap-up board or slide |

Worked example: a 75-minute slot is 15 min of slides, 20 min of Pigment 101, about 30 min of use case and 10 min of slack.

**Scope rule.** The POC app covers only what the product tour can't: the client-specific engine, usually their revenue or capacity model, plus anything in their brief that standard assets don't show. Standard workforce, opex, drivers and assumptions come from the product tour.

## Reference builds (read these before building)

These are the house standard. Read their actual code with `search_frames` (by `id`, which returns the full body) before writing a new frame, or start from the local copy in `assets/examples/`.

| Reference | App ID | Frame / board ID | What to take from it |
|---|---|---|---|
| Trust Payments SPM Cockpit | `b0581029-8cce-4c63-910a-92b79aae7b6b` | frame `7f5f1f7a-c053-4200-969c-5b8423367541` (source in `assets/examples/`) | Newest standard: 4-step rail, click-to-explain drawer with Back stack, subscriptions kept under 10, write sinks, Reset, tour |
| Trust Payments SPM boards and demo script | same app | boards SPM 0-4 | Part 1 explainer tables, colour scales, whole-pound merchant grids |
| Benchmark Capital cost envelope | `8fa6e9c8-6474-416a-bfd5-883edf335ee2` | boards 00-06 | Board sizing and widths done properly; weekly versions; waterfall and bridge; approval impact |
| FRP Budget Round | `f33d2027-5f81-4177-9612-06cc6df08e5a` | frame `49bebf31-4523-4cf5-ae69-8346c2425d2b` | Readable frame template: levers that write, monthly impact against baseline, commentary, submit/approve |
| MAT Planning Cockpit (click to explain) | `804ef304-8e38-4dcd-94f6-92d94339ba9a` | frame `67d799be-9133-42f6-81c7-bdabcec1da51` | Click-to-explain panel, queued writes with a "recalculating" state, driver editor |
| MAT demo home | `804ef304-8e38-4dcd-94f6-92d94339ba9a` | board `2cf6a4dc-6751-4cde-9327-049a5fda1250` | Home board: client logo, cockpit card, numbered story boxes, one card per board |

If a newer POC beats these, add it to this table.

## How this fits with the Pigment plugin skills

Load the specialist skill at the step that needs it:

| Step | Load |
|---|---|
| Architecture | `pigment:understanding-pigment-modeling`, `pigment:building-a-full-application` or `pigment:editing-an-existing-application` |
| Industry patterns | `pigment:solving-financial-planning`, `pigment:solving-workforce-planning`, `pigment:solving-sales-performance`, `pigment:solving-supply-chain` |
| Versions, actuals/forecast, scenarios | `pigment:building-versions-and-planning-cycles` |
| Every formula | `pigment:writing-pigment-formulas` (read the docs; never guess syntax) |
| Metrics and lists | `pigment:creating-metrics-and-tables`, `pigment:creating-dimensions-and-hierarchies` |
| Views and boards | `pigment:design-business-views`, `pigment:designing-boards-and-views`, then `references/boards.md` |
| Number formats, highlighting | `pigment:formatting-and-highlighting` |
| Frames | `pigment:building-pigment-frames`, then `references/frames.md` |
| Speed | `pigment:profiling-model-performance` |
| Reading data back | `pigment:analyzing-views` |

Deliberate overrides of Pigment's board guidance, for demo apps only:
- Images are expected (client logo on Home).
- Every board carries a navigation bar.
- **No instruction boxes on boards.** The explanation lives in the demo script.

## Non-negotiables

1. **One story, boards first.** It runs from the Home board through a logical sequence of native boards, into the demo script. Each board is one moment in the story and answers one client pain. **Frames are never the opener.** They come at the end as "if you want it presented differently, you can wrap the whole process in a frame". Every process shown in a frame must also exist as a board.
2. **No grid-only boards.** Every input grid has a chart or KPI that moves when a value changes. Use colour: inputs highlighted, variances coloured, colour scales on attainment-type numbers.
3. **No "What this shows / Try this / Watch" boxes on boards** (Mike, Nov 2026). A section header with one plain line under it is fine. The talk track, try-this and watch go in Part 2 of the demo script.
4. **Boards look finished** (`references/boards.md`):
   - widgets sized so nothing scrolls inside them
   - every column and row header readable, using per-column widths
   - no raw metric names on screen
   - no big white space
   - whole pounds at line level
   - checked in the browser
5. **Navigation on every board:** Back, Home, step marker ("Step 3 of 7"), Next, Guide. Demos run with the side panel closed.
6. **Everything drillable.** On boards, every KPI and chart has a drill grid. In the frame, every headline number opens its explanation.
7. **Plain English everywhere.** Write for someone who has never seen Pigment and doesn't know the client's jargon:
   - define each term the first time it appears
   - say what an element is for, not just what it is
8. **The client's language and data.** Use their terms, codes, units and currency. Use real data where you have it, and confirm which source file it came from. Anything illustrative is labelled "Illustrative".
9. **Copy rules.**
   - plain description, no slogans or punchy sales lines
   - no sentences starting with "Because"
   - sentence case
   - hyphens, never em dashes
10. **No orphans.** Every metric, assumption and driver the story relies on appears on a board, where the audience can see it and change it if it's an input. If the model links two things (a backfill to a leaver), show the link.
11. **Click-to-explain from day one.** On boards, drill grids and "how it's worked out" tables. In the frame, the explain panel. Both are part of the first build, never a retrofit.
12. **Scope to what the client asked for.** Leave out tabs and calculations they didn't raise, even when the data is in their files.
13. **Mike must understand the model.** The demo script's Part 1 explains every number, column, chart and rule on every board, with formulas in words and live values (`references/demo-script.md`). A click path alone is not enough.
14. **Change discipline near a demo:**
    - Don't change a core formula without Mike's say-so. Flag the issue with its size and a recommendation.
    - Make risky frame changes as a **new frame** and leave the old one as a fallback.
    - Inside the last few hours before a call, don't ship anything that can't be tested against the live model.
    - Restore every input you change while testing, and re-read the baseline afterwards.
15. **Say what hasn't been tested**, plainly, and when it will be.

## Single source of truth: the story file

Before building, write `story.json` in the client folder. Every piece of explanatory text comes from it, so the boards, frame, tour and script never disagree.

```json
{
  "client": "OKEA", "app": "OKEA POC - Statfjord area", "audience": ["Stine Imsland", "Siri Hansen"],
  "core_concept": {"term": "Net production", "plain": "OKEA's share of what a licence produces: gross x working interest."},
  "glossary": [{"term": "Working interest", "plain": "OKEA's share of a licence. Gross figures x working interest = OKEA's net figures."}],
  "steps": [{
    "id": "p2", "board": "03 Phasing", "pain": "Moving a well from April to June means editing two workbooks",
    "try": "Move the RC7 start from Apr to Jun", "watch": "2026 net production and opex for Unit and Øst both shift",
    "talk": "One campaign, two licences, one change.",
    "tour": {"title": "Move a campaign", "body": "Drag RC7 two months later. Both assets reflow."}
  }],
  "explain": {"prodex": {"title": "Opex per barrel", "what": "What it costs OKEA to produce one barrel of oil equivalent.",
    "formula": "Net opex ÷ net production",
    "steps": [["Net opex", "OKEA's share of licence opex plus its own 100% costs", "opex"], ["÷ Net production", "OKEA's share of barrels produced", "prod"]],
    "inputs": [["opex", "Licence opex by JOA code"]], "where": "board 02, step 3"}}
}
```

| Output | Fields it uses |
|---|---|
| Demo script Part 1 | `core_concept`, `glossary`, `explain` |
| Demo script Part 2 | `pain`, `talk`, `try`, `watch` |
| Frame tour | `tour` |
| Frame click-to-explain | `explain` |

## Workflow

### Phase 0 - Intake and story brief

1. **Gather the account:**
   - Attio: deal, people, partner-seller signals
   - tl;dv: use `onlyParticipated: false`
   - Outlook: recaps and the client's own emails, including which data file they sent and when
   - Teams and SharePoint: client files, usually in a colleague's "Microsoft Teams Chat Files". Read every attachment on the message, not only search hits.
   - The project's memory and the client's `build-spec.md`
2. **Write the story brief:**
   - audience and decision maker
   - ranked pains, in the client's words
   - competition, and our one or two points of difference
   - their vocabulary
   - data inventory: real, illustrative, missing
   - 5-8 demo moments: pain → screen → action → what moves → line to say
3. **Confirm with Mike:** the board and frame plan, and which gaps can be filled with illustrative data. Don't build before this.

### Phase 1 - Read the client's files properly

- **Read the whole file.** The SharePoint connector truncates large workbooks, typically after about 50 rows. Get the actual files and parse them with `openpyxl` where Python is available.
- **Map how the workbook works:** inputs → calculations → summaries → exports; version and plan-tier mechanics; time grain and horizon; master lists.
- **Map each Excel construct to a Pigment object.**
- **Pull out real totals** to use as reconciliation targets.
- **Log every error or quirk** (#REF!, flat forecast months, stale headers). These become demo moments and questions for the client.
- **Find the hidden side calculations:** list the workbook's external links and count the formulas pointing at each one.
- **Look for history kept inside input sheets:** prior forecast rows are real version data for the comparison screen.
- **Check "previous version" blocks for stale copies** across files.
- **Read the formulas, not just the values:**
  - font colour that marks actuals
  - plug formulas such as `(full year − YTD) / remaining months`
  - constants typed into formulas (`*1.02`)
  - which months are actual and which are forecast
- **Work out the rates behind side calculations** by dividing outputs by their drivers. Use these when the client won't share the side workbook.
- Anonymised files (headcount IDs, no names or titles) are fine. Note it in the script's known gaps and keep any linking fields (role, team, backfill).

### Phase 2 - Story and screen plan

**Short vs long POC.**

| POC type | When | Screens |
|---|---|---|
| Short | A use-case slot inside a standard demo (about 30-45 min) | **Maximum 5**, counting the Home board and the cockpit frame |
| Long | A detailed POC playback, or a session given over to the use case | More than 5 is fine; allow about 5-7 min per screen including questions |

**Default use-case arc.** Adapt it to the pains and the minutes available. Boards first, frames last.

| # | Screen | Purpose |
|---|---|---|
| 0 | Home board | Client logo, objective, numbered story cards, headline KPIs, cockpit card last |
| 1 | Overview board | Headline KPIs and trend for the whole client, with drill to the lowest level |
| 2 | Inputs and drivers board | Where the client's planners enter numbers, with live KPIs beside the grid |
| 3 | Headline moment board | The one thing Excel can't do for them, shown live |
| 4 | Side calculations board | The calculations they keep in side workbooks, rebuilt as visible drivers |
| 5 | Versions and variance board | Current against previous, with commentary and audit trail |
| 6 | Reporting board | Board pack, or the feed to their reporting tool |
| 7 | Process frame (optional, at the end) | The same process wrapped in one guided screen |
| 8 | Reporting frame (optional, at the end) | A presentation-style board pack |

**Side workbooks the client won't share:** build an illustrative calculation with plausible rates, show it as a visible driver table with "how it's worked out", label it illustrative, and present it as the mechanism.

**Missing history:** build an illustrative prior version consistent with the client's own comments and label it illustrative.

### Phase 3 - Model build

- **Keep the model light.** Build only what the story needs.
- **Folders:** `01 Dimensions`, `02 Inputs`, `03 Calculations`, `04 Outputs`, `05 Demo controls`, `06 Frame feeds`.
- **Metric names:**
  - Name output metrics (anything a board shows) in plain English from the start.
  - Prefixed working metrics (`IN_`, `CE_` and so on) get an en-US display name before any board uses them (`references/boards.md`).
  - Give every metric a one-line description; Part 1 of the script is built from them.
- **App name:** `[DEMO] [Client] POC - [scope]`, with a description that says what the app does and whether the data is real or illustrative.
- **Calendar and locale:** set the client's fiscal year start, period structure, currency and number format before loading data.
- **Illustrative data** is scaled to the client's published figures, with the source noted in the app description.
- **Demo controls** are small input metrics: lever values, phasing shifts, scenario selector. The frame writes to these through data sinks.
- **Frame feeds:** one small metric per frame data source, shaped to exactly what the frame reads, well under 1,000 rows.
- **Baseline:** snapshot "Demo baseline" before the first rehearsal.
- **Loading data:** real data from cleaned files; keep the transformation script in the client folder.
- **Cheaper loads:** `set_metric_input` matches rows by the list's display property, so temporarily switch a long-named list to display a short code, load, then switch back.
- **Illustrative earlier rounds:** put a formula on the INPUT metric, check it, then `copy_formula_as_user_inputs` to freeze it as inputs.
- **Check the client's version blocks before loading them** and log each fix.
- **Formula lessons that cost time:**
  - `[BY: x]` needs an aggregator (`[BY SUM: 'Version'.'Next version']`).
  - Arrow BY drops every dimension you don't name, so list Version and Month.
  - FILTER can't take a metric with dimensions the target lacks; use `IF(cond, x)[REMOVE: ...]`.
  - Text roll-ups use `[REMOVE TEXTLIST: ...]`.
  - Previous week or version: `[SELECT: Version - 1]`.

### Phase 4a - Boards (the VP look)

Read `references/boards.md` first. In short:
- Build every board on the standard template: nav bar, KPI strip, input grid with its chart, how it's worked out, drill grid, footer.
- Size widgets in rows of about 23px; set per-column widths on every grid.
- Give prefixed metrics display names.
- Fill white space with charts and KPIs.
- After saving drafts, repoint widgets.
- Check every board in the browser.

**Build boards from a generator.** Keep the widget JSON per board (or a small generator with `nav`, `header`, `card`, `view`, `footer`) in the client folder. Every board then has the same nav bar and footer, and a re-layout doesn't mean re-reading every board.

### Phase 4b - Cockpit frame

Read `references/frames.md` first. Every POC gets one. Key points:
- Copy the Trust Payments SPM Cockpit structure.
- Keep to 10 or fewer live subscriptions and no mixed value types in a source.
- Test locally with the harness before sending.
- The frame is private until Mike unticks it, and the first write asks permission.

### Phase 5 - Test pass

Read `references/testing.md`. Test every change in the demo script on the live model:
- read the number before
- make the change
- read the number after
- restore the input
- re-read the baseline at the end

Check every board in the browser. Report a pass/fail table and write it into `build-spec.md`.

### Review mode (an app already exists)

1. **Context:** read `build-spec.md`, memory, emails, tl;dv and the demo slot length. For an RFI or long brief, build a coverage table (requirement, where it's shown, status).
2. **Story audit:** does the app run A → B → C in the client's terms, and does each board answer one pain? Cut, merge or reorder to fit the run of show.
3. **Orphan audit:** list every metric and input the story uses; flag any not on a board.
4. **Calculation audit:** trace each headline number to its inputs; check the logic against the brief; flag defects with their size and a recommended fix. Don't change core formulas without Mike's say-so.
5. **Board beauty pass:** bring every board up to `references/boards.md`:
   - sizes and widths
   - display names
   - remove instruction boxes
   - colour
   - charts beside grids
   - browser check
6. **Frame:** if there isn't one, build it. If there is, upgrade it in a **new frame** and keep the old one as a fallback.
7. **Demo script and test pass** (Phases 5-6).
8. **Report back**, as short as possible:
   - Verdict per demo: ready to rehearse, or not, and why.
   - The story in one line per board.
   - What changed.
   - **Needs you:** decisions only Mike can make (save drafts, formula fixes, frame private flag), each with a recommendation.
   - **On the day:** permission prompt, tour behaviour, reset steps.

### Phase 6 - Handover

All in the client folder.

**Demo script** (`demo-script.md`, see `references/demo-script.md`). It is the main deliverable Mike reads:
- **Part 1 - Understand the model:**
  - the core concept
  - how the model is built
  - categories and rules
  - the headline numbers
  - every board element (plain English, formula in words, live value, business rule)
  - known gaps with answers
- **Part 2 - The demo:**
  - per board: pain, say, point at, change, watch, put back, line, next
  - the cockpit finale
  - likely questions
  - a reset table with baseline values

**Prep doc** (optional, or a section of the script):
- run of show with minute marks, the screen for each block and handover lines
- what changed since the last review
- the morning-of checklist: reset to baseline, opening filters, frame not private, permission prompt, tour behaviour

**Layman walkthrough guide** (when someone other than Mike will present): one section per screen in story order (what you're looking at, what it's for, click by click, what happens, why it matters, under the bonnet, if they ask), plus a glossary of Pigment and client terms, resetting, and what's illustrative.

Give Mike a short chat summary: the click path in one line per screen, what wasn't tested, and what needs him.

**Open questions and assumptions** go in `build-spec.md`.

**Attio:** a short note on the deal with the app link and demo date. Never create Attio tasks.

**Rehearsal:** offer a 15-minute dry run.

## Industry starters

| Industry | Core measures and drivers | What they care about |
|---|---|---|
| Upstream oil and gas | Production by product (kboe, boe/d), gross to net at working interest, opex per barrel, JOA cost codes, capex, decommissioning, oil and gas price, NOK/USD | Phasing of wells and shutdowns, operated vs non-operated, 7+5 / 10+2 forecasts |
| SaaS / B2B tech | ARR bridge, NRR/GRR, cohorts, CAC payback, headcount | Board metrics, hiring, runway |
| Retail and hospitality | Sites, like-for-like, covers, average spend, labour % | Roll-outs, weekly grain, promotions |
| Professional services | Utilisation, rates, WIP, fee earners | Per-employee budgets, location roll-up, budget round |
| Contact centre / advice services | FTE, shrinkage, ramp, productivity by channel, demand, funded units | Capacity against funding, cost per unit |
| Energy from waste / infrastructure | Gate fees, tonnage, CPI/RPI indexation | Contract-level modelling |
| Care and health services | Occupancy, fee rates, agency vs permanent staff | Home-level P&L |
| Rail and public bodies | 13-period year, grant funding | Period calendar, capex depreciation |
| Fintech and payments | TPV, take rate, unit costs, FX; for sales teams: salary-multiple targets, credit windows, attainment bands, commission by vertical | Merchant and product economics, rep commission |
| Wealth and financial advice | Run rate vs envelope, adviser:support ratio, hiring pipeline stages, entity recharges | Weekly people-cost position, ELT approvals |

## Definition of done

- The run of show fits the slot, including Pigment 101 and the product tour
- The story brief is confirmed and `story.json` is written
- Home board, cockpit frame and every board follow `references/boards.md` and `references/frames.md`, checked in the browser
- Every board has a nav bar, live KPI or chart beside its inputs, a "how it's worked out" table for its headline numbers and a drill path; no instruction boxes, no raw metric names, no cut-off headers, no scrolling widgets
- No orphan metrics or assumptions; every view saved and every widget pointing at the saved view; boards and frame open on the story's opening case
- The frame has click-to-explain on every number and driver tile, a guided tour with Skip and Esc, write-back with reset, and is not private
- Real data is reconciled against the named source file, illustrative data is labelled, and template leftovers are gone
- The test pass table is green, or each exception is explained
- `demo-script.md` has Part 1 (model explainer, every element) and Part 2 (tested click path, reset table), and `build-spec.md` is current
- The "Demo baseline" snapshot exists and the live model matches the demo script
