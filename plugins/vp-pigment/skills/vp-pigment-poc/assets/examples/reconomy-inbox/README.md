# Reconomy group review inbox (design, 22 Nov 2026)

The reviewer's side of the cockpit's submission workflow, laid out like an email client. Not deployed: the design page runs the real frame code on mock data.

- Design page (private Artifact): https://claude.ai/artifact/8tGF6onbwrgNBoXSD9a3Tx
- Build: `py -3.12 -I build_inbox.py` (uses `lint_frame` from `../build_frame.py`) writes `review_inbox.js`, `review_inbox_config.json`, `design.html`, `harness.html`.
- Another customer: change the `BRAND` block at the top of `review_inbox.src.js` (name, round, version, stage views, reason starters, statuses, palette, logo) and the bindings in `build_inbox.py`.

## Data (7 sources, peak 7 live subscriptions, 5 after the two lookups unsubscribe)

| Source | Labels / selectors | Values | Type |
|---|---|---|---|
| dsWFS | entityList x stageList | mWfStatus | dimension |
| dsWFC | entityList x stageList | mWfComment, mWfOwner, mWfReturn | text |
| dsEnt | entityList x plLineList x versionList (selector versionList) | mPLR12 | number |
| dsSch | schemeList x versionList (selector versionList) | mCsRevR12, mCsGpR12 | number |
| dsMS | sectorList x versionList (selector versionList) | mMsRevR12, mMsGpR12, mMsIncR12, mMsRecR12 | number |
| dsSchEnt | list source on Scheme, label schemeList | pSchemeEntity (Scheme.Entity) | dimension, unsubscribed once loaded |
| dsEntLoop | list source on Entity, label entityList | pEntityLoop (Entity.Loop) | dimension, unsubscribed once loaded |

Sinks: `statusSink` (WF Stage Status), `returnSink` (WF Return Reason). The reviewer never writes the business's comment.

**List-property technical names** (`pSchemeEntity` = Scheme > Entity `entity_VJ7N2Z`, `pEntityLoop` = Entity > Loop `_loop_17PFVA` for Reconomy) come from `get_list_items` with `extraPropertyFriendlyNames`: read `columns[].technicalName`. For a new customer, look theirs up the same way and set them in `build_inbox.py`. Text, date and dimension values are read with `sv()` (string or `{name}`), as in the cockpit.

## Harness test (22 Nov 2026)
No errors at 1440, 1000 and 420 px, no horizontal page scroll. J/K and arrows move, A approves (one statusSink write, item moves to Approved, next item selected), R opens the composer, sending with no reason is blocked inside the composer with no write, starter chips fill the reason, Esc cancels, a return writes returnSink then statusSink Returned and shows the thread with the group's reason. Approve on a Returned item is blocked with an explanation. Approving every item shows Inbox zero. Reset wrote all five originals back (four statuses to Submitted, the new return reason to blank).
