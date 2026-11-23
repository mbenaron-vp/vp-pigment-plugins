# CFO story (design, 22 Nov 2026; v2 nested zoom)

A read-only, Prezi-style frame that zooms into itself. The overview is one branded picture: Reconomy's loop as a ring, the headline in the centre and six topic circles on the ring, each holding its slide at small scale. Each slide holds the next detail inside one of its own elements (a portal circle), so the camera dives into the thing on screen rather than flying between sibling cards. Every number and sentence is written from Pigment data. Not deployed yet.

| File | What it is |
|---|---|
| `cfo_story.src.js` | Frame source. `BRAND` (look) and `CFG` (version names, actuals-to month, labels) at the top are the per-customer blocks; `NODES` is the story tree |
| `cfo_story.v1.src.js` | The first, flat version (sibling cards on a map), kept for reference |
| `mock_sdk.js` | Mock SDK mirroring the live figures (next-12-month revenue £1,416,883,217, adjusted EBITDA £84,745,219; FY26 £85,628,908 vs budget £99,196,062) |
| `build_cfo.py` | `py -3.12 -I build_cfo.py` writes `cfo_story.js`, `cfo_story_config.json`, `design.html`, `harness.html`; runs the cockpit kit's safe-code lint |
| `patch_v2.py`, `_parts/` | Working files from the v1 layout pass and the v2 rewrite |

## The tree (and the story order)
Overview (the loop)
- 1 Headline (centre). Its adjusted EBITDA tile holds **2 FY26 against budget** (waterfall), whose biggest variance bar holds **3 Month by month**.
- 4 Where profit comes from (ring)
- 5 Two engines (ring): two circles holding **6 Engine 1, compliance** (its biggest scheme bar holds **7 the scheme line by line**) and **8 Engine 2, managed services**.
- 9 Currency (ring)
- 10 Readiness (ring): the progress ring holds **11 Returned, and why**.
- 12 Decisions (ring), 13 In one line (ring).

## Camera and controls
**Superseded for new builds:** `../okea-board-pack-story/` replaces the two-leg flight below with one smooth curve at an even pace, and adds tooltips and click-to-drill on every slide.

- Child positions are measured from the portal elements after each render (offsetLeft/Top up to the card), so a slide's layout decides where its children sit.
- A move flies out only as far as the common parent, then into the target. Zooming in keeps the destination steady on screen; zooming out keeps the place you left steady; one eased curve over the whole path. The element you are about to dive into pulses first.
- While deep, four bands around the current slide dim and blur the parent context (backdrop-filter, so the cost is screen-sized, not world-sized).
- Arrow keys, Space, Enter: next and back along the story. Esc or Backspace: up one level. Click any portal, circle, chip, card or breadcrumb to go there. O: overview. N: talk track. Home / End. Reduced motion cuts instead of flying.

## Data
Nine data sources, eight live after the pricing-basis lookup unsubscribes (limit 10). No sinks.
dsEnt (entity x P&L line, next 12 months), dsPLM (month x line, Forecast + Budget), dsCS (scheme x line revenue and GP), dsCSB (pricing basis, one-off), dsMS (sector), dsFX (plan rates), dsWFS (status), dsWFC (note, owner, return reason), dsEntP (list source on Entity: Loop and Currency).

Subtotal lines are found from the numbers (a line equal to the running total of the plain lines above it), so P&L line names are never in the code.

List-property bindings on Entity (list fb8eebb9-af77-4fef-a6be-c363c6efa4e4): `entLoop` = Loop (`_loop_17PFVA`), `entCurrency` = Currency (`currency_FPXSRL`). For reference: Country `country_Z2FTY4`, Planning Method `planning_method_6PVZ4B`.
