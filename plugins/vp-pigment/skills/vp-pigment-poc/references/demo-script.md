# The demo script

Every POC ships a demo script in the client folder (`specs/<client>/demo-script.md`). Mike presents it, but Claude built the model, so the script has to teach him the model as well as the clicks.

It has two parts, in this order:

1. **Part 1 - Understand the model.** After reading it, Mike can explain every number on every board and answer a critical question about any of them.
2. **Part 2 - The demo.** The click-by-click story with tested numbers, what to change, what moves and what to say.

Build both from the live model, never from memory:
- formulas and descriptions: `search_metrics_and_lists` with `showDetails: true`
- list rules (stages, categories, flags): `get_list_items` with the properties
- live values: `fetch_metric_data`
- what each Try-this change does: the test pass (testing.md)

Every number in the script must be one you've read from the model.

## Header

- App name, demo date, the opening filter state ("Week W/C 16 Nov, Division All, side panel closed").
- **The story in one line**: the client's pain and what the app does about it, in their words.
- "Every number below was read from the live model on <date>. If the screen shows something different, see Reset."

## Part 1 - Understand the model

### 1. The core concept first

One short section on the single idea everything hangs on, in plain English, with a worked example. Benchmark: **run rate** (the annual salary of a seat as if it ran a full 12 months from today; a snapshot of commitment, not this year's spend). Trust Payments SPM: target = salary x multiple, credited GP over a 12-month window, attainment, band, rate, commission, written as one chain.

Say what the concept includes and excludes (salary only, no on-costs) and why the client manages this way.

### 2. How the model is built

A table: each main list or input (people, roles, versions or weeks, envelopes, merchants), what one row is, and where it comes from (client file, illustrative, formula). Define any timing idea (as-of date, credit window, switchover month).

### 3. Categories and rules

Any classification that drives the numbers (waterfall bars, recruitment stages, bands): a table with what's in each, how it's valued, and how an item moves between them.

### 4. The headline numbers

A table of the KPI strip: number, plain meaning, formula in words, live value. Include the parts that make it up (Benchmark: the four requests behind "Awaiting approval £221,000").

### 5. Board by board

For each board, use this table so nothing is missed:

| Element | What it is, in plain English | Formula in words | Live value | Business rule |
|---|---|---|---|---|

Cover **every** KPI, chart, table column and amber input. In particular:
- **Every column header** in every grid, even the obvious ones (Envelope, Headcount in seat, Open roles).
- **Every chart:** what each series is, what the gap between them means and why it matters. Explain any chart that looks odd (identical bars against a flat line) before someone asks.
- **Every rule column** (Who approves, band, approval route): the exact logic, with a live example each way, and any quirk (Benchmark: each request is tested alone against today's headroom, not cumulatively).
- **Every negative or "out of" number** ("Out of run rate"): why it is taken out and where the replacement sits.
- **Links between lists** (a backfill to the leaver it replaces), with a live example. Answer the obvious question: "is anyone replacing this leaver?"
- **IDs instead of names** (HC-1001048): say why (anonymised source) and how to find out who or what it is.

### 6. Known gaps: have an answer ready

A table: what they might spot, then the answer. Always consider:
- anonymised IDs instead of names or job titles
- links that exist in the model but aren't on a board
- rule choices that could reasonably be different
- charts that look odd
- what's salary only, and what's excluded
- what's illustrative and what's their data
- what isn't built (access rights, integrations, approvals workflow) and how Pigment would do it

Don't claim a feature is built unless you've seen it in the app.

## Part 2 - The demo

For each step, in story order:

- **Board name and minutes** (from the run of show).
- **Pain**, in the client's words.
- **Say:** the talk track, two or three sentences. It replaces the old on-board "What this shows" box.
- **Point at:** the numbers to call out, with live values.
- **Change (live):** the exact cell, where it is on screen, the value to type.
- **Watch:** what moves and by how much (from the test pass).
- **Then:** put it back.
- **Line to land.**
- **Click:** Next.

Then:
- **The custom agent** (`agent.md`): a Part 1 section (what it is, what it knows, what it can do, the four starters) and a Part 2 step at the end of the board whose question it answers. Give the starter, the expected answer with its numbers from the test, and "Enter sends; answers take 1-2 minutes; collapse the chat-history sidebar first".
- **Optional finale:** the cockpit frame. Permission prompt: choose "For this session". Tour behaviour: skip, or use the Guide button. Untick private before the call.
- **Likely questions** with short answers.
- **Reset table:** every input touched in the script with its baseline value, plus the baseline headline numbers to check against before starting.

## Style

- Sentence case, hyphens not em dashes, no sentences starting with "Because", no slogans.
- Plain English; define each term the first time it appears.
- Numbers as they show on screen (£27,914,527; +£9,700; 1.66).
- Markdown in the client folder. Send it to Mike as a file when it's done; offer a Claude Doc or page only if he wants to share it.
