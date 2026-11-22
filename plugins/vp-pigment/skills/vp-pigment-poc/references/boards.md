# Boards: the VP look, sizing and the gotchas

Read this before creating or changing any board or view. Every rule here comes from a live build that looked wrong on Mike's screen.

## Mike's standing feedback (Benchmark Capital and Trust Payments, Nov 2026)

1. **No "What this shows / Try this / Watch" boxes on boards.** They look like scaffolding. That text is the presenter's voice-over and lives in the demo script. **Section headers are an H2 title only: no italic line under them and no footer note** (FRP, Nov 2026, superseding the earlier "one plain line is fine"). Exception: the one "what to do here" line beside the board title (see "FRP round 2" below).
2. **Every grid shows full names.** Column headers, row headers and metric names must never be cut off ("Committed…", "Headroom if…").
3. **No scroll bars inside widgets and no big white space.** Size widgets so grids and text don't scroll; a narrow grid gets a chart or KPI beside it.
4. **No raw metric names on screen** (`CE_What changed`, `IN_Stage`). See "Metric names" below.
5. **Colour in grids:** amber inputs, colour scales on attainment-type numbers, coloured variance columns.
6. **Whole pounds at line level** (£1,768), never £0k or £0.1k. Use £k only for totals in the millions.
7. **Every POC gets a cockpit frame** without being asked (see frames.md), placed last in the story.

## Mike's FRP feedback (Nov 2026): what made the first FRP build "unappealing"

8. **The P&L didn't look like a P&L:** account-level rows, wide, no colour, no subtotals. Use the management P&L pattern below.
9. **It copied the Excel:** one board per tab, and an "old rate / new rate" pair of columns. Use one overridable metric and story boards (SKILL.md non-negotiable 16).
10. **A scenario section on a board** duplicated what Pigment's native scenarios do. Don't build one.
11. **Boards outside the demo path were bare grids.** Every board in the app gets a KPI strip and charts, or goes into an archive folder.
12. **Home had no logo, mis-sized boxes and no link to every board.** See "The Home board".
13. **A single-table board (CapEx) has no story.** Give it an action and a consequence: approve, then watch spend, depreciation and net profit move.
14. **The workflow was tepid.** Every POC gets a sign-off area on each board and a workflow tracker board. See the pattern below.

Always check the result in the browser before calling a board done (see testing.md).

## Grid units: how big things really are

- The board is 12 columns wide. **One row unit is about 23 CSS pixels** (it renders at about 14px in a scaled screenshot). Builds have repeatedly sized widgets at a third of what they need, because 2-4 rows looks plausible in JSON.
- Mike's display is 2560px wide, so one column is about 200px. On a 1440px laptop it is about 115px. Size widths for the laptop, then check on Mike's screen.

Heights that read well (rows):

| Widget | Height |
|---|---|
| Nav bar (Back, Home, step marker, Next, Guide) | 3 |
| Section header: H2 title only | 2 |
| KPI strip (one KPI widget, several metrics) | 6 |
| Home: client logo (w2) beside the title banner (w8) and Guide (w2) | 4 |
| Home: board cards (ActionButton, Card layout), six per row at w2 | 7 |
| Chart | 13-15 (FRP); 22-25 if it is the board's main visual |
| Grid, management P&L of about 25 lines, Small rows | 30 |
| Grid, about 10-12 rows visible | 15-24 |
| Grid, long input list | 28-36 |
| Sign-off area: header 2, then panel (w9) beside progress KPI and tracker button (w3) | 2 + 5 |

These heights are in board rows as stored by the MCP. FRP boards rendered well with them on Mike's screen; check on screen anyway.

Pigment closes vertical gaps itself when a widget is deleted, so removing a widget doesn't need a re-layout.

## Widths: making grids fit

- A grid's row header plus its columns must be less than its widget's width; otherwise it scrolls sideways or cuts headers off.
- Typical widths: row header 220-300px (24-34 characters); data columns 140-260px. Mike's display shows columns smaller than the character estimate suggests, so check on screen.
- If a full-width grid still doesn't fit, shorten the **view value names** (`update_view_values` with `friendlyName`, for example "Cost carried" for "Cost carried (finance entity)") and explain the full meaning in the section line above the grid.
- An input grid with many columns gets the full 12-wide row; put its linked chart and "how it's worked out" table directly underneath, side by side.

### Fit the widget to the grid, not the grid to the widget

Pigment does not stretch grid columns to fill the widget. A grid whose columns end halfway across its widget leaves a block of white space, while the chart beside it is squeezed and cuts off its labels (Benchmark board 03: grid 9 wide, content ended at about 1,100px of 1,820; chart 3 wide with clipped department names and bar labels).

1. Size the columns first (the rules above).
2. Measure how far the grid's content reaches: in the browser, take the right-most text element inside `[data-testid="board-widget-card-grid"]` and subtract the card's left edge. Scroll each card into view first, because grids below the fold don't render.
3. Width in board columns = (content + about 56px for padding and scrollbar) ÷ one board column, rounded up. One board column = (board width + 16) ÷ 12: about 204px on Mike's 2560px display, about 115px on a 1440px laptop. Use the width of the screen the demo will run on; if a laptop must also work, a grid sized at 204px columns will scroll sideways there, so say so in the prep doc.
4. Give every column you free up to the chart, KPI or text beside the grid. Typical results: 6/6 for a six-column input grid beside a bar chart, 4/8 for a one-column input list beside a chart, 5/7 for a four-column "how it's worked out" table beside a chart.
5. Re-check on screen: the grid should end close to its widget's right edge, and the companion chart should show full axis labels.

The same test applies to a grid alone on a full-width row: if its content ends well short of the board's width, that is white space too. Narrow it and put a chart or KPI beside it, rather than leaving it stretched.

### The width gotcha that wasted an hour

On most views, **`dataColumnsWidth` is ignored on boards**: every data column renders at 100px whatever the view says. Which setting works depends on the view's shape:

| View | `dataColumnsWidth` on a board | Set instead |
|---|---|---|
| Metrics on columns | Ignored (100px) | One `perMetricColumnWidthOverrides` entry for every value field |
| Single-metric view: a Metric block's view, no `metricsLocation` (for example one P&L report metric with months or versions on columns, or a status heatmap) | Ignored (100px) | One `perMetricColumnWidthOverrides` entry on the metric's value field id; it sizes the data columns |
| Table view with metrics on rows | Honoured | `dataColumnsWidth` is enough |

Read the value field ids with `get_views` (include `Values`). Always set `rowHeaderColumnWidths` for each row pivot, and `rowHeight` (Medium) at the same time.

```
update_view_grid_layout(viewId, layout = {
  rowHeight: "Medium",
  columnWidths: {
    rowHeaderColumnWidths: [{ pivotFieldId: <row pivot id>, characters: 30 }],
    perMetricColumnWidthOverrides: [
      { valueFieldId: <value id 1>, characters: 19 },
      { valueFieldId: <value id 2>, characters: 19 }
    ]
  }
})
```

Then measure in the browser (`getBoundingClientRect` on a header cell, or a zoomed screenshot) to confirm the width took effect.

## Metric names

- Model metrics often carry folder prefixes (`CE_`, `CR_`, `IN_`, `FF_`, `VAR_`). They are fine for modelling but must never show on a board.
- Fix it once at the source: set `displayNameByLocale: {"en-US": "<plain name>"}` on every prefixed metric with `bulk_update_metrics`, **10 metrics per call**. The underlying name doesn't change, so formulas and frame bindings are safe.
- For a label that should differ on one view only, use the view's value `friendlyName`.

## Drafts, saving and repointing

- **Configure a view completely before you put it on a board**: values and names, widths, filters (hide empty rows and columns), formatting, chart or KPI settings, aggregations. Once it's on a board, later edits can fork a draft.
- Changing a view that you didn't create in the last hour makes a **draft** (the response says so). Others see the old view until it's saved. Collect the draft ids and ask Mike once for the batch, then `save_draft_views`.
- **To change an older view that is on a board without a draft:** create a new view with the same pivots, configure it, and point the widget at it (`update_board_widgets` with the widget's id). Delete or ignore the old view. Faster and safer than a draft-save-repoint cycle.
- **To fix a raw label without touching the view:** set the metric's en-US display name (`bulk_update_metrics`). It changes the label everywhere and forks nothing.
- **A saved draft of a view used on more than one board is promoted to a new view** (`action: PromotedToNewView`, a new `savedViewId`). A view used on exactly one board is merged back in place, and nothing needs repointing.
- **Pigment only repoints widgets that had the draft previewed on them** (`set_widget_preview`). Those come back in `widgetUpdates` with `success: true`. Every other widget showing the old view stays on it, and `widgetUpdates` doesn't mention them.
- So after every save that promotes a view:
  1. List every board and widget that showed the old view id. Search your board JSON, or `get_board` on each board.
  2. Repoint each one not in `widgetUpdates` with `update_board_widgets`, using the new `savedViewId`. Keep the widget's current position.
  3. `get_board` each touched board and confirm the view id.
- Before repointing, read the widget's current position with `get_board`; don't work it out from earlier layouts. Stored y values don't change when Pigment closes a visual gap, so a guessed y can overlap other widgets.
- Use `set_widget_preview` to check a draft on a board before saving, then `clear_widget_preview` once saved. Previewing every widget that shows the view before saving also makes Pigment repoint them all for you.
- Promoted views get a hash in their name ("Leaving and fixed-term ends - fa1c8f34"). Record the new view ids in `build-spec.md`. The old views stay in the app unused; tidy them after the demo, not before.

## Board widget updates

- `update_board_widgets` upserts by id but **requires the full widget config**: a position-only patch fails ("Invalid block configuration"). Resend the whole widget (type, position and its config) every time.
- Keep each board's widget JSON (or the generator script) in the client folder, so re-layouts don't mean re-reading every board.

## The standard board

| Row | Contents | Height |
|---|---|---|
| Nav bar | Back x0 w2, Home x2 w2, navy step marker x4 w4 ("Step 2 of 6 - Weekly movements"), Next x8 w2, Guide x10 w2 | 3 |
| Title | H2 text only | 2 |
| KPI strip | One KPI widget with the board's headline numbers | 6 |
| Main section | Input grid (amber) with the chart that moves when it changes, side by side, or the grid full width with the chart underneath | 13-36 |
| How it's worked out | H2 header, then a table with the parts in formula order | 2 + 15-24 |
| Detail | Drill grid down to the people, roles or rows | 24-30 |
| Sign-off | H2 "Sign-off" box (Indigo_10 background), sign-off panel w9 h5, round progress KPI w3 h3, "Open workflow tracker" button w3 h2 (Green_80) | 2 + 5 |

- No footer. Illustrative-data notes go in the demo script's known gaps.
- Back on step 1 goes to Home. The last board (the workflow tracker) has Finish, which goes to Home.
- Home uses `NavigateToBoard` to the Home board (`BackToHomepage` fails through the MCP).
- **Buttons that open the frame (Guide, the Home cockpit card) use `OpenStaticLink`** to `https://pigment.app/w/<workspace>/application/<appId>/frames/<frameId>` (`<workspace>` is the slug in the Pigment URL, `vantagepoint` for VP's workspace). An ActionButton of type `NavigateToFrame` is rejected ("Value cannot be null") while the frame is a private draft, which it is from `create_frame` until Mike publishes it. Note in the build spec which buttons carry the static link, so they can be found if the frame is ever recreated with a new id.
- A board page selector only filters views that carry that dimension in Pages. Add the page to the view even when the dimension is on rows.
- Set each board's page defaults to the story's opening case.
- **Grouping pages merge into the dimension's selector.** A view paged by Employee > Location or Month > Year shows up as the board's Location or Year selector, so one selector drives views paged by the dimension and by the grouping.
- **A Month > Year grouping page adds a Year selector defaulting to All.** Set the board's Year default (FY 26 or the story year) in the same pass, or charts plot every month of every year.
- **Pin a view to one item with a hidden page:** give the view a page on the dimension, then set that board page to `pageDisplayMode: Hide` with a default. This is how one sign-off view shows a different stage on every board.
- `update_board_page_configurations` rejects a page no view on the board exposes. After removing widgets, re-read the board's pages before setting defaults.
- A single-select Version selector can still default to two items (`singleModality: false`, Actual + Budget) for a multi-year view, when the versions don't overlap in time.

## The Home board

Logo (Image widget, Fit, white background, alt text, from the client's own site: find it with `document.querySelectorAll('img')` on their home page) at x0 w2 h4, the navy title box at x2 w8 h4, and Guide at x10 w2 h4. Then:
- "At a glance" H2 and the main KPI strip, then a league table and chart by entity.
- "The round in N steps" H2 and **one card for every board** in demo order, six per row at w2 h7 (Card layout, title "1  Overview" and a one-line description). Colour the cards by act (for example blue for the model, teal for the planning round, green for the tracker).
- "Round status" H2: round progress KPI, sign-offs by status KPI, progress by entity chart.
- An "Under the bonnet" card for the archive folder, and the cockpit frame card last.
- No subtitle paragraph and no footer.

## The management P&L pattern

Build this whenever the client has a P&L. An account-level grid is not a P&L.

1. **Report-line list** (`PL Line`): every line of the client's management P&L in order, with a Sort and an `Is Subtotal` boolean. Subtotals: Total turnover, Gross profit, EBITDA, Net profit (use the client's names).
2. **Map accounts to lines**: a dimension property on the account (or on an intermediate comparison line).
3. **One report metric** by PL Line x Version x Entity x Month:
   ```
   IF('PL Line'.'Is Subtotal',
     CUMULATE(<PL>[BY SUM: Account.'PL Line'], 'PL Line'),
     <PL>[BY SUM: Account.'PL Line'])
   ```
   With income positive and costs negative, the running total down the list gives every subtotal.
4. **Views:**
   - Monthly P&L: PL Line rows, Month columns, Small rows, row header about 230px, months about 112px, empty rows hidden. Subtotal rows Blue_20 and bold; the bottom line (net profit) Indigo_100 with white text, area Both.
   - Budget against forecast: Version columns filtered to the two versions, plus a calculated item (forecast minus budget) coloured red below 0 and green above.
   - KPI strip filtered to the four subtotals.
   - Waterfall (Contribution) with the subtotals filtered out, so each bar is one line.
   - By year: a Month > Year grouping on columns for the multi-year board.

## The workflow tracker and sign-off pattern

Standard in every POC (SKILL.md non-negotiable 18).

**Model** (own block folder, for example "09. Workflow"):
- List **Workflow Status** with a Progress number property: Not started 0, In progress 0.35, Returned 0.35, Submitted 0.75, Approved 1.
- List **Workflow Stage**: one item per story board, in story order.
- Metrics by Stage x Entity: **Stage Status** (dimension type, Workflow Status), Stage Owner (text), Stage Due Date (date), Stage Comment (text), **Stage Progress** = `'Stage Status'.'Progress'` with Avg aggregators, **Stage Count** by Stage x Entity x Workflow Status = `IF('Stage Status' = 'Workflow Status', 1)`.
- A table with Status, Owner, Due, Comment, Progress.
- Seed it so it tells a story: one entity ahead, one behind, one stage Returned with a comment that points at the variance story.

**Views** (configure fully before placing):
- **Sign-off panel**: Stage rows; pages Stage and Entity; Large rows; widths about 210 / 150 / 260 / 120 / 560 / 110; status colours (below); progress colour scale Red_20 → Yellow_30 → Green_50.
- **Round progress KPI**: Stage Progress, Avg on hidden dimensions.
- **Sign-offs by status KPI**: Stage Count, Workflow Status on columns.
- **Status heatmap**: Entity rows x Stage columns, status colours, about 112px per stage so all stages fit without scrolling.
- **Stacked bar** by stage and status (series coloured per status); **progress by entity** horizontal bar.
- **Workflow detail**: Entity and Stage rows, every field, for review and approve.

**Status colours** (conditional formatting, Text condition): Approved Green_50 / White; Submitted Blue_80 / White; In progress Yellow_30 / Orange_100; Returned Red_50 / White; Not started Grey_10 / Grey_80.

**On every story board:** the sign-off area at the bottom (see the standard board), with the board's hidden Stage page defaulting to its own stage.

**Test it:** change one status on a board, re-read the entity's progress and the status counts, then put it back.

## Colour (Organization_Custom slots if the VP palette is loaded; otherwise the fallback)

| Role | VP colour | Fallback |
|---|---|---|
| Nav bar, step marker, title box | David Navy #1B478B | Indigo_100 |
| Primary buttons, main series | Sid Blue #2079EE | Blue_80 |
| Positive variance | Tessa Jade #14B8A6 / Tim Pine #0D9488 | Teal_50 / Teal_80 |
| Negative variance | Mike Coral #F43F5E | Red_50 |
| Input cells | James Amber #F59E0B / Matt Gold #FCD34D | Orange_50 / Yellow_30 |
| Explanation boxes | Rolf Seafoam #E0EAE9 | Teal_10 |
| Secondary panels | Octavia Cloud #AABED6 | Blue_20 |
| Text | Jake Graphite #181818 | Grey_100 |
| Second series | John Violet #96A0FF / Anton Slate #2D4E71 | Violet_50 / Grey_80 |

### Conditional formatting works if the condition is flattened

`update_view_formatting` rejects the documented nested shape (`condition.mcpNumberComparisonCondition`), first asking for `kind` and then for `varOperator`. Put the fields directly on `condition` and give both `varOperator` and `operator`:

```
"condition": {"kind": "NumberComparison", "varOperator": "LessThan", "operator": "LessThan", "value": 0}
"condition": {"kind": "Text", "varOperator": "EqualTo", "operator": "EqualTo", "text": "Approved"}
"condition": {"kind": "ColorScale", "minValue": 0, "midValue": 0.5, "maxValue": 1,
              "minColor": "Red_20", "midColor": "Yellow_30", "maxColor": "Green_50", "applyTo": "Background"}
```

Target a calculated item (a variance column) with its pivot id and the calculated item's id as the Modality. Overrides replace the view's formatting wholesale, so resend any you want to keep.

## Charts

- A chart where the series differ by a few percent on an axis from zero looks flat and meaningless (the Benchmark "run rate against the P&L" chart). Chart the difference instead, or start the axis near the data, or say in the section line what the gap means.
- KPI views: no rows, `metricsLocation` Columns. Waterfall Contribution: every dimension in rows.
- Remove a version from a board's page selector when a view makes no sense for it (Budget has no previous round).
- KPI views over a snapshot metric (headcount) need a hidden-dimension aggregation of Avg (or Last) on time, or they add twelve months together.
- A balance (closing WIP) on a grid with a month total needs a LastNonBlank aggregation on the month pivot for that value.
- A chart on a dimension whose display property is a code (grade "9") shows codes on the axis: set the pivot's `customDisplayProperty` (for example "Job Title").
- An input grid whose input columns are empty at baseline (an Approve tick box) needs `showEmptyColumns: true`, or the columns the presenter has to click are hidden.
- **No chart or KPI opens at £0.** A what-if delta (cost increase since actuals, amount passed on to customers, change against budget) is zero until someone moves a lever, so on opening it shows an empty chart and a £0 tile and looks broken. Seed a realistic non-zero baseline input so every chart has bars on opening (Reconomy, Nov 2026: a 3% haulier rate rise from January). The seeded value is now part of the baseline: record it in the build spec, the demo script's reset table and the morning-of checklist, and have the demo move it on from there (3% to 5%) rather than from zero.

## Scenarios

There is no MCP tool to create or delete native scenarios (only `list_scenarios`). Template leftovers ("Oil Crash", "P90") and the downside scenario the story needs are a UI step for Mike: put them in the morning-of checklist. Never build a low/high scenario section on a board instead.

## Make links visible

If the model links two things (a backfill role to the leaver it replaces, a merchant to its rep), show the link on a board as a column. Otherwise the audience asks "is anyone replacing that person?" and the answer is hidden in a list property.

## Input-tab boards: the client's layout on top, reporting below (FRP, Nov 2026)

Each Excel input tab becomes one story board:

1. **Top:**
   - selectors for the split the workbook uses (entity, pillar, category)
   - the input grid in the workbook's layout, inputs coloured like the client's input cells (`Yellow_10` data, `Yellow_30` header for FRP's yellow)
2. **Middle:** the tab's calculated rows in the same order as the workbook (for example the work-done journey: gross, holidays, sick, stat holiday, study, non-chargeable, chargeable, inter-office, seasonality, total, utilisation, headcount).
3. **Bottom:** the consolidated view (all pillars or entities), KPIs and charts that move when an input changes, then the sign-off area.

### Data Type header (Actual / Budget / Forecast above the months)

- **Mapping metric:** `Data Type`, Version × Month → Version Type, formula:

  ```
  IF(IsActual, ITEM("Actual", 'Version Type'.Name),
  IF(IsPlan, IF('Version Switchover' > Version.'Switchover Month', ITEM("Forecast", 'Version Type'.Name), Version.'Version Type')))
  ```

- **Columns:** `Year` grouping, then a Joined pivot `{"kind":"Joined","dimensionId":<Version Type list>,"mappingMetricId":<Data Type>}`, then `Month`. `get_available_pivots` lists it once the mapping metric exists.
- **Colour:** target the Joined pivot's members in `update_view_formatting` (Actual Grey_10, Budget Yellow_10, Forecast Teal_10).
- **The metric needs Version.** Put Version on the page.

### One budget version holds last year's actuals

- **Window:** set the budget version's Start Month a year before the budget year, so IsActual covers last year and every grid shows actuals beside budget.
- **Comparison metrics** that add the Actual and Budget versions then double-count the overlap. Filter them on a `Reported Timeline` flag (Version × Month): the budget version for its window, the Actual version only before it.

### Overheads: planning method per line

**Metrics:**

| Metric | Shape | What it does |
|---|---|---|
| `Line Method` | Location × Account → method list | Formula default = the account's method, overrides on, so it's a drop-down per office |
| `Line Uplift %` | Location × Account | Input |
| `Run Rate Window` | Month boolean | The last three actual months up to the switchover |
| `Line Method Amount` | Location × Account × Month | Nested IF on the method: annual / 12, last year's month × (1 + uplift), 3-month average, blank |
| `Line Budget` | Version × Location × Account × Month, overrides on | `IF(IsActual, GL actual, IF(IsPlan, IF(budget year, IFBLANK(typed month, method amount))))`; feeds the P&L build |

Typing over a month overrides it (phasing).

**Board:**

1. **Category page selector:** keeps each grid to 15-25 rows, no scroll.
2. **Planning grid:** a table of last year, method, annual amount, uplift %, FY total and next-year total, with the method, annual and uplift columns in yellow. A category KPI and a last-year-against-budget bar sit beside it.
3. **Monthly grid:** Line Budget with the Data Type header for last year and the budget year.

The P&L board reuses `Line Budget` filtered to the workbook's P&L input lines (method = monthly input, not in an overhead group).

### Multi-year comparison with % change

- **No duplicate value field:** a metric view can't show the same metric twice (the second value field is dropped).
- **Instead:** use two grids side by side, £ by year and the same metric with show-value-as `PercentGrowthFromAnItem` (Relative, offset -1, on the Year pivot).
- **Consolidation:** this works at any level, so a multi-select entity page gives a consolidated comparison.

### Native-scenario roll-forward board

- **Grid:** P&L lines × the Scenario pivot (`{"kind":"Scenario"}` on columns; a Scenario page is added automatically).
- **Chart:** net profit by month with Scenario on rows.
- **Input:** the "Actuals to" input on the same board.
- **Board page:** set the Scenario page to multi-select with Base as the default.
- **Live demo:** the presenter creates the scenario from Base, ticks it in the page, and sets "Actuals to" in it.


## FRP round 2 (Mike, 17 Nov 2026): what he asked for once the story was right

- **"What to do here" line beside every board title.** Plain text on the title row, to the right: what the person arriving needs to do (enter, check, approve). Narrow the title widget to make room. Keep it to one line at 1536px.
- **Neutral KPI tiles on every board.** No rainbow of KPI colours. House default: KPI view formatting with one override, empty `pathElements`, `area: Both`, `backgroundColor: Indigo_10`, `textColor: Indigo_100` (pale indigo, navy text; matches an Indigo nav bar). The colour lives on the view, so build a new view with the style and repoint the widget rather than editing a view already on a board (that forks a draft).
- **Average utilisation (or the board's key ratio) as a KPI tile** beside the headline tiles, not only as a yellow total in the grid.
- **Budget holder commentary as a card on the board it belongs to** (WIP and cash on the WIP board, overheads on the overheads board, direct costs on staff). Keep the consolidated narrative board as well. One editable view per card, filtered to its section, following the board's Location page.
- **No white space next to input grids.** Under an input grid and beside a small settings table, add a chart that moves with the inputs (for example closing WIP by month stacked by pillar).
- **Home story tiles at 4 per row** (w3) with short descriptions, so they still fit on a smaller screen than the one you built on. Check Home at 1536px and at Mike's 2560px.
- **Month headers with Actual / Budget / Forecast** must match across boards: Grey_10 / Yellow_10 / Teal_10 on header and cells, header text bold Grey_100. Grey text on a grey header reads as broken.
- **Header colour trials:** when Mike asks to try client-coloured headers, build each variant as a new view (rows on one grid, columns on another) and write down how to revert.
