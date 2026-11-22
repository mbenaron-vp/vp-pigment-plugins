# Reconomy world (frame design, not deployed)

A 3D globe of the November forecast, built from the model's own geography: Entity.Country, Entity.Loop, Entity.Currency, Scheme.Country, Scheme.Entity, Scheme.Stream. Read only (no sinks).

Design page (private Artifact): https://claude.ai/artifact/CBW74ksXrdSJTh99z5Dxy1

## Files
| File | What it is |
|---|---|
| `world.src.js` | Frame source. The `BRAND` block at the top is the only part another customer changes (name, title, palette, logo, P&L line item names, status colours). Below it: reference geography only (country centroids, region circles, coarse land outlines). |
| `build_world.py` | `py -3.12 -I build_world.py` lints the body (parent `build_frame.lint_frame`), writes `world.js`, `world_config.json`, `design.html`, `harness.html`. |
| `mock_sdk.js` | Mock SDK mirroring the live Entity and Scheme properties and the next-12-month baseline. |

## Data sources (8 live subscriptions, all global)
| Source | Kind | Labels | Values |
|---|---|---|---|
| dsEntP | List (Entity) | entLoop, entCurrency, entityList | entCountry, entMethod (text) |
| dsSchP | List (Scheme) | schEntity, schemeList | schCountry, schStream (text) |
| dsStat | List (Workflow Status) | statusList | statusProgress (number) |
| dsEnt | Metric | entityList, plLineList, versionList (selector) | mPLR12 |
| dsSch | Metric | schemeList, versionList (selector) | mCsRevR12, mCsGpR12 |
| dsFX | Metric | currencyList, versionList (selector) | mFx |
| dsWFS | Metric | entityList, stageList | mWfStatus |
| dsWFC | Metric | entityList, stageList | mWfComment, mWfOwner, mWfReturn |

**List-property technical names** sit in the `TN` map in `build_world.py` (Reconomy: Entity Loop `_loop_17PFVA`, Currency `currency_FPXSRL`, Country `country_Z2FTY4`, Planning Method `planning_method_6PVZ4B`; Scheme Entity `entity_VJ7N2Z`, Country `country_ESWYB9`, Stream `stream_MH3AGY`; Workflow Status Progress `progress_19M29E`). For a new customer, read theirs with `get_list_items` and `extraPropertyFriendlyNames` (`columns[].technicalName`).

## Reuse for another customer
1. Change the `BRAND` block (name, title, sub, pills, version item, P&L line names, palette, logo).
2. Point the bindings at the customer's lists and metrics; any list with a Country text property works. Add missing countries to `GEO` (centroid) or regions to `REGION`; "Worldwide/Global" becomes an orbit. Anything it can't place is listed under the legend as "Not on the map".
3. The hub (arcs start there) is the country with the most businesses; Loop colours follow `BRAND.series` in order of revenue.
