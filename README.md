# Max-UI

Max-UI is a project-aware frontend design and refactoring plugin for Codex. It reads the existing project before changing it, extracts the current design language, detects generic AI patterns and visual defects, applies scoped improvements, and verifies responsive behavior and accessibility.

## What It Does

- Detects frontend frameworks, styling systems, component libraries, icons, routes, and build commands.
- Extracts colors, fonts, CSS custom properties, radii, shadows, gradients, and other design signals.
- Separates deterministic defects, strong implementation signals, and findings that require visual review.
- Supports audit, polish, redesign, build, systemize, and verification workflows.
- Preserves established product identity and existing component conventions by default.
- Checks common failure modes such as viewport locks, hidden overflow, unstable image dimensions, excessive gradients, color sprawl, weak focus treatment, and card-heavy composition.

## Skill

Invoke the skill as:

```text
$max-ui
```

Example requests:

```text
Use $max-ui to audit this frontend without changing files.
Use $max-ui to polish this dashboard while preserving its industrial identity.
Use $max-ui to redesign this page and verify desktop and mobile layouts.
```

## Local Installation

Clone this repository into the personal plugin directory:

```text
git clone https://github.com/listenBast/max-ui.git ~/plugins/max-ui
```

The resulting plugin path should be:

```text
~/plugins/max-ui
```

Add it to a local Codex marketplace entry, then install it with:

```text
codex plugin add max-ui@personal
```

Start a new Codex task after installation so the new skill is loaded.

## Validation

Run the bundled script tests:

```text
node skills/max-ui/scripts/tests/run-tests.mjs
```

Run the Codex validators from their installed skill directories:

```text
python <skill-creator>/scripts/quick_validate.py skills/max-ui
python <plugin-creator>/scripts/validate_plugin.py .
```

## License

MIT. See [LICENSE](LICENSE).

## Structure

```text
.codex-plugin/plugin.json
skills/max-ui/SKILL.md
skills/max-ui/agents/openai.yaml
skills/max-ui/references/
skills/max-ui/scripts/
```
