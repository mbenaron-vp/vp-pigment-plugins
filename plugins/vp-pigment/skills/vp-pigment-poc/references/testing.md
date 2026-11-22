# Test pass (required before telling Mike it's ready)

Report results as a short pass/fail table with the fixes made, and write it into `specs/<client>/build-spec.md`. The tested numbers feed Part 2 of the demo script.

## What MCP can and can't read

- `fetch_metric_data` reads Number, Integer and Boolean metrics. Text, date and dimension-typed metrics need every dimension filtered to one item, or checking by eye on the board. List which ones you checked by eye.
- `set_metric_input` writes inputs (numbers, ISO dates, dimension items by display name; an empty string clears). No-dimension metrics take `dimensionDisplayNames: []` and one value per row.
- List properties (for example a "Savings go to central pot" flag) are written with `update_list_property_input_data` by modality id.

## The checks

1. **Board changes.** For each change in the demo script:
   - read the KPI it should move
   - make the change
   - read again and confirm the direction and size
   - **restore it**
   - after all tests, re-read the baseline headline numbers and confirm they match the start exactly
2. **Headline arithmetic.** Headroom = envelope - committed; division values sum to the total; week-on-week movements sum to the net change. Write the actual numbers in the script.
3. **Every claim on screen or in the script.** "Wealth is over its envelope", "£85k of new leavers", "takes Wealth to £205k over": read each one from the model.
4. **Frame writes.** For each lever and data sink:
   - write a value with `set_metric_input` on the bound metric (or through the frame)
   - confirm the frame's data source changes, then reset
   - confirm Reset puts every `ORIG` value back, as numbers: a lever on a month input that is normally blank needs that month's baseline set explicitly first (frames.md "Reset")
5. **Frame robustness:**
   - "Loading…" shows with no data, not errors
   - no source over 1,000 rows
   - 10 or fewer subscriptions
   - the error strip is empty
   - the frame is not private
6. **Explain and tour:** every explain key referenced in the frame exists in `story.json`, every tour target id exists in the frame, and every operand link resolves.
7. **Navigation:** every button on every board goes to the right place, and Guide opens the frame.
8. **Layout:** `get_board` on every board: no overlaps, 12 or fewer columns per row, symmetrical pairs, heights from boards.md.
9. **Drill:** every KPI and chart has a working path to its rows.
10. **Reconciliation:** Pigment totals tie to the client's source totals, shown as a table (source, Pigment, difference). Find the source file (Outlook, SharePoint, Teams) and confirm which file the app was built from.
11. **Performance:** no input takes more than about 2 seconds to show its effect (`get_top_blocks_by_performance`).
12. **Copy:** client terms correct, no raw metric names on screen, copy rules met, "Illustrative" labels present.
13. **Saved, not drafted:** every view change saved, and every widget repointed after a save that promoted a view (boards.md).
14. **Opening state:** each board and the frame open on the story's opening case through page defaults, and no chart or KPI opens empty or at £0 (seed a baseline input for what-if deltas; boards.md "Charts").
15. **Template leftovers removed:** no template scenario names, no empty list items in selectors, no leftover demo controls.
15a. **Workflow:** change one stage's status on a story board's sign-off area, re-read Stage Progress and Stage Count for that entity, confirm the tracker board moves, then put the status back. Also: an overridable input (type over a calculated value, then clear it) returns to the formula value.
15c. **Planner test:** for each Excel input tab, do on its board what a budget holder does on the tab (type an input, phase a month, add a joiner, change a method) and check the board shows last year beside the budget. List anything the tab can do that the board can't.
15d. **Roll-forward rehearsal:** move the switchover (for example "Actuals to" from Apr to Oct), check every month grid header flips to Actual for those months and the totals match a known figure, then reset and re-read the baseline. Check that no comparison metric double-counts the overlap between the Actual and Budget versions.
15b. **No text on boards beyond titles:** no subtitle lines, footers or instruction boxes; every board in the app has a KPI and a chart.
16. **Visual check in the browser** (below).
17. **Reset:** restore the "Demo baseline" snapshot (or the reset table) and confirm the KPIs match the reconciliation table.
18. **Live state matches the script:** right before the call, check every headline number on screen against the demo script. Look for leftover inputs from rehearsal.

## Checking boards in the browser

Use Claude in Chrome (Mike's own browser and Pigment login):
- Board URL: `https://pigment.app/w/vantagepoint/application/{appId}/boards/{boardId}` (plural "boards"). Frame: `/frames/{frameId}`.
- Wait 8-10 seconds for widgets to load, then screenshot. Scroll and screenshot again for long boards.
- Mike's screen is 2560px wide and screenshots come back scaled. Check real sizes with JavaScript (`innerWidth`, header cell `getBoundingClientRect().width`) rather than guessing from the image.
- If navigation is blocked by a "Leave site?" dialog after a draft preview, navigate with `force: true`; nothing on the server is lost.
- **Screenshots can time out** on heavy boards ("Page.captureScreenshot timed out"), especially when the Chrome window isn't in front. Fall back to text: `document.querySelector('main').innerText`, and count `Nothing to display` to find empty widgets. Widgets render lazily, so a KPI read too early shows only its caption: wait and read again before calling it broken. Text checks don't prove the look: say which boards were only checked by text, and ask Mike to bring the Chrome window to the front for screenshots.
- Look for:
  - scroll bars inside widgets
  - cut-off headers
  - raw metric names
  - empty space beside narrow grids
  - charts that look flat
  - widgets still on an old view

## Reporting

Say plainly what wasn't tested and when it will be: frame writes waiting on the permission prompt, the tour inside Pigment, the private flag, reconciliation without the source file.
