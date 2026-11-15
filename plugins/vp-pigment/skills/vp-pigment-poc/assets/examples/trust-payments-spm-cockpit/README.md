# Example: Trust Payments SPM Cockpit (Nov 2026)

A complete house-standard cockpit frame. Copy its structure for new frames.

- `spm_cockpit.js`: readable frame source. It has:
  - a four-step rail (targets, attainment, commission, rep statement)
  - rep and quarter filters, a KPI strip and an answer line
  - a click-to-explain drawer with a Back stack, a guided tour (Esc closes) and Reset
  - queued writes to five sinks
- `spm_cockpit_config.json`: the frame's data sources, sinks and list bindings as created in Pigment.
- `test_harness.html`: the mock-SDK test page filled in for this frame. Serve with `../../serve.ps1`.

Points worth copying:
- It has 12 data sources but stays under Pigment's 10 live subscriptions. Company attainment is computed in the frame from `dsAtt`, and `dsTeam` and `dsMerchants` unsubscribe once loaded.
- `dsTeam` is separate from `dsReps` because a source can't mix a text property with numbers.

Live frame: app `b0581029-8cce-4c63-910a-92b79aae7b6b`, frame `7f5f1f7a-c053-4200-969c-5b8423367541`. Data is synthetic.
