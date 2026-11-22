# vp-pigment-plugins

VantagePoint's Claude Code plugins for building Pigment demos and client POCs.

## What's in it

| Plugin | Skill | What it does |
|---|---|---|
| `vp-pigment` | `vp-pigment-poc` | Builds or reviews a client-tailored Pigment demo or POC: run of show, story, VP-styled boards, guided cockpit frame, a two-part demo script (model explainer, then click path) and a tested demo. |

It sits on top of Pigment's own plugin (`pigment@pigment`), which has the modelling, formula, board and frame skills. This one adds VantagePoint's story, look, scripts and lessons from live builds.

## Install

In the project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "vp-pigment-plugins": {
      "source": { "source": "github", "repo": "mbenaron-vp/vp-pigment-plugins" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "vp-pigment@vp-pigment-plugins": true
  }
}
```

The repository is private: you need read access on GitHub and a working git login on your machine. Claude Code then pulls updates automatically.

If you also have the older claude.ai copy of the skill (`anthropic-skills:vp-pigment-poc`), turn it off in claude.ai (Customize > Skills) so only this version loads.

## Changing the skill

1. Ask Claude to make the change (for example "add this lesson to the vp-pigment-poc skill").
2. Claude edits the files here on a branch and pushes it.
3. Review and merge the pull request. Everyone gets it on their next session.

Keep lessons general. Client names and IDs belong in each project's `specs/<client>/build-spec.md`, not here, except as a short worked example.

## Layout

```
.claude-plugin/marketplace.json
plugins/vp-pigment/
  .claude-plugin/plugin.json
  skills/vp-pigment-poc/
    SKILL.md                 workflow and non-negotiables
    references/
      boards.md              layout units, column widths, colour, nav, view drafts
      demo-script.md         two-part script template (model explainer + click path)
      frames.md              frame rules, limits, delivery and testing
      testing.md             test pass and live checks
    assets/
      frame-test-harness.html  mock Pigment SDK page for testing a frame locally
      serve.ps1                tiny local web server (no Node or Python needed)
      examples/frame-build-kit/             Python build script, mock SDK and harness for a frame
      examples/trust-payments-spm-cockpit/  a full house-standard frame
```
