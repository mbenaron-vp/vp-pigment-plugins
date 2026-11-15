# Boards: the VP look, sizing and the gotchas

Read this before creating or changing any board or view. Every rule here comes from a live build that looked wrong on Mike's screen.

## Mike's standing feedback (Benchmark Capital and Trust Payments, Nov 2026)

1. **No "What this shows / Try this / Watch" boxes on boards.** They look like scaffolding. That text is the presenter's voice-over and lives in the demo script. A section header with one plain italic line under it is fine.
2. **Every grid shows full names.** Column headers, row headers and metric names must never be cut off ("Committed…", "Headroom if…").
3. **No scroll bars inside widgets and no big white space.** Size widgets so grids and text don't scroll; a narrow grid gets a chart or KPI beside it.
4. **No raw metric names on screen** (`CE_What changed`, `IN_Stage`). See "Metric names" below.
5. **Colour in grids:** amber inputs, colour scales on attainment-type numbers, coloured variance columns.
6. **Whole pounds at line level** (£1,768), never £0k or £0.1k. Use £k only for totals in the millions.
7. **Every POC gets a cockpit frame** without being asked (see frames.md), placed last in the story.

Always check the result in the browser before calling a board done (see testing.md).

## Grid units: how big things really are

- The board is 12 columns wide. **One row unit is about 23 CSS pixels** (it renders at about 14px in a scaled screenshot). Builds have repeatedly sized widgets at a third of what they need, because 2-4 rows looks plausible in JSON.
- Mike's display is 2560px wide, so one column is about 200px. On a 1440px laptop it is about 115px. Size widths for the laptop, then check on Mike's screen.

Heights that read well (rows):

| Widget | Height |
|---|---|
| Nav bar (Back, Home, step marker, Next, Guide) | 3 |
| Section header: H2 title + one italic line | 4 |
| KPI strip (one KPI widget, several metrics) | 6-7 |
| Home: client logo and title banner | 8 |
| Home: board cards (ActionButton, Card layout) | 10 |
| Chart | 22-25 |
| Grid, about 10-12 rows visible | 24-30 |
| Grid, long input list | 30-36 |
| Text box (Box layout) with 2-3 short paragraphs | 8-10 |
| Footer ("Illustrative data…" line) | 3 |

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

On a view with metrics on columns, **`dataColumnsWidth` is ignored on boards**: every column renders at 100px whatever the view says. Always set **`perMetricColumnWidthOverrides` for every value field** (ids from `get_views` with `Values`), plus `rowHeaderColumnWidths` for each row pivot. Set `rowHeight` (Medium) at the same time.

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

- Changing a view that you didn't create in the last hour makes a **draft** (the response says so). Others see the old view until it's saved. Collect the draft ids and ask Mike once for the batch, then `save_draft_views`.
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
| KPI strip | One KPI widget with the board's headline numbers | 6 |
| Main section | Input grid (amber) with the chart that moves when it changes, side by side, or the grid full width with the chart underneath | 22-36 |
| How it's worked out | Section header, then a table with the parts in formula order | 4 + 24 |
| Detail | Drill grid down to the people, roles or rows | 24-30 |
| Footer | "Illustrative data. …" | 3 |

- Back on step 1 goes to Home. The last board's Next can open the cockpit frame.
- Home uses `NavigateToBoard` to the Home board (`BackToHomepage` fails through the MCP). The frame opens with `OpenStaticLink` to `https://pigment.app/w/vantagepoint/application/{appId}/frames/{frameId}` (`NavigateToFrame` is rejected by the MCP).
- A board page selector only filters views that carry that dimension in Pages. Add the page to the view even when the dimension is on rows.
- Set each board's page defaults to the story's opening case.

## The Home board

Logo (Image widget, Fit, alt text, client's own site) beside a navy title box with one paragraph on what the app is for. Then:
- "The weekly review in N steps" header and one card per board in demo order (Card layout, title "1  Cost envelope" and a one-line question it answers).
- "This week at a glance" header and the main KPI strip.
- "If you want it presented differently" header, the cockpit card (Blue_80) and a short "how to read this app" box defining the one core concept.
- Footer with the illustrative-data note.

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

Conditional formatting with `mcpBooleanCondition` fails with a `varOperator` error; use static formatting or colour scales.

## Charts

- A chart where the series differ by a few percent on an axis from zero looks flat and meaningless (the Benchmark "run rate against the P&L" chart). Chart the difference instead, or start the axis near the data, or say in the section line what the gap means.
- KPI views: no rows, `metricsLocation` Columns. Waterfall Contribution: every dimension in rows.
- Remove a version from a board's page selector when a view makes no sense for it (Budget has no previous round).

## Make links visible

If the model links two things (a backfill role to the leaver it replaces, a merchant to its rep), show the link on a board as a column. Otherwise the audience asks "is anyone replacing that person?" and the answer is hidden in a list property.
