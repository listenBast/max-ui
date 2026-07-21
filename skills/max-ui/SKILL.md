---
name: max-ui
description: Project-aware frontend design, redesign, refactoring, and visual quality assurance. Use when Codex must build or improve websites, web apps, dashboards, landing pages, product UI, components, design systems, themes, typography, color systems, responsive layouts, motion, accessibility, or frontend polish; audit an existing interface for generic AI-generated patterns, excessive gradients, mismatched colors or fonts, card-heavy layouts, weak hierarchy, visual inconsistency, or mobile defects; preserve an existing product identity while modernizing it; or verify a frontend with screenshots and runtime checks before delivery.
---

# Max-UI

Act as a design engineer who reads the product before choosing a style. Improve the actual working frontend, not an abstract mockup, and preserve behavior, content, user data, and established product identity unless the user authorizes broader change.

## Operating Contract

1. Inspect the project and representative UI files before proposing or making visual changes.
2. Separate functional defects, accessibility defects, system inconsistency, and aesthetic judgment.
3. Treat static detector output as evidence to inspect, never as automatic proof that a design is bad.
4. Reuse the project's framework, component library, icons, tokens, and conventions when they are sound.
5. Avoid introducing a new UI library, font service, animation framework, or global reset without a concrete need.
6. Preserve existing changes in a dirty worktree. Do not overwrite a design system or theme without reading it first.
7. Verify rendered output at desktop and mobile sizes after implementation. A code-only review is incomplete for visual work.

## Route The Request

Choose one primary mode and combine secondary modes only when necessary:

- **Audit**: Inspect and report. Do not edit unless the user also asks for fixes.
- **Polish**: Keep the product structure and visual direction; repair the highest-impact defects.
- **Redesign**: Reconsider hierarchy, composition, type, palette, and interaction while preserving product purpose.
- **Build**: Create a new surface using a domain-specific visual direction and the existing project stack.
- **Systemize**: Extract, repair, or introduce tokens and reusable visual rules.
- **Verify**: Test responsive behavior, states, accessibility, motion, build health, and visual coherence.

If the user requests implementation, continue through editing and verification. If the user requests only a review, diagnosis, or explanation, stop after evidence-backed findings.

## Read The Project

Determine the concrete frontend root, including the relevant package in a monorepo. Then:

1. Run the bundled inspector from the user's project directory:

```bash
node <skill-dir>/scripts/inspect-project.mjs <project-root>
```

2. Read `references/project-reading.md`.
3. Read at least one global style or token file and one representative page or component.
4. Inspect `package.json`, framework config, styling config, public assets, font setup, and existing component primitives when present.
5. State a compact design read before substantial work:

```text
Surface: <page or product type>
Audience and job: <who uses it and what they must accomplish>
Register: <operational product, brand/marketing, editorial, consumer, or hybrid>
Existing identity: <what must remain recognizable>
Primary tension: <the most important visual or UX problem>
Signature opportunity: <one product-specific memorable device, if appropriate>
```

Do not invent a brand story when the repository already contains one. Do not mistake a framework starter theme for committed identity.

## Load Only Relevant Guidance

- Read `references/visual-language.md` for new builds, redesigns, typography, palette, layout, or anti-template work.
- Read `references/audit-rules.md` before auditing or using detector findings to justify edits.
- Read `references/framework-adapters.md` for framework and styling-system constraints.
- Read `references/verification.md` before the final visual QA pass.

Keep these references one level deep. Do not load every reference when the request is narrow.

## Audit With Evidence

Run the static auditor when the project contains web source files:

```bash
node <skill-dir>/scripts/audit-ui.mjs <project-root> --format markdown
```

Use `--format json` when structured output will help another script or review step. The auditor intentionally reports three evidence classes:

- `deterministic`: directly testable defects such as disabled zoom or measurable contrast failure.
- `strong-signal`: patterns that often harm quality but still require local context.
- `visual-review`: clues that must be judged in the rendered interface.

It also assigns one fixability class:

- `safe-auto`: a narrow repair can be made without choosing a new visual direction.
- `needs-review`: the defect is credible, but component behavior or layout context must be checked before editing.
- `direction-required`: the change depends on product identity, hierarchy, palette, typography, or another design decision.

When a page can be rendered, run `scripts/runtime-audit.js` in the page context at each representative viewport. The file is a self-contained browser expression: pass its full contents to the browser evaluation tool and capture the returned object. Use runtime findings to confirm horizontal overflow, clipping, computed contrast, broken images, duplicate IDs, small targets or text, unnamed icon controls, and effect density. The runtime auditor is read-only and does not replace keyboard walkthroughs or screenshot review.

Before reporting or fixing a finding, open the cited code and check whether a local exception makes sense. Prefer a short prioritized backlog over a long catalogue of minor preferences.

For audit-only requests, inspect the running interface when an existing browser runtime and dev command are available, especially before making `visual-review` claims. Do not install a browser or alter the project merely to complete a read-only audit. When rendering is unavailable, state clearly that the result is source-backed and that responsive composition, computed contrast, and visual hierarchy remain partially unverified.

## Choose A Direction

For polish work, infer the direction from the existing product and make the smallest coherent set of changes.

For redesign or new-build work:

1. Derive the direction from the product's subject matter, audience, environment, and content.
2. Define a compact token intent: surface, ink, accent, support colors, display type, body type, density, radius strategy, and motion character.
3. Spend distinctiveness in one or two places. Keep the rest disciplined.
4. When the visual direction is materially ambiguous, present 2-3 options that differ in layout logic, typography, palette strategy, and signature device. Wait for selection before a destructive redesign.
5. When the user has already specified a direction or explicitly authorized autonomous implementation, state the chosen direction and proceed.

Do not present several options that are merely recolored versions of one layout.

## Edit With Scope Discipline

Make changes in this order:

1. Repair broken layout, unreadable text, missing states, focus, contrast, overflow, and responsiveness.
2. Repair hierarchy, density, alignment, spacing rhythm, and component consistency.
3. Repair typography and palette roles.
4. Remove decorative patterns that do not support product meaning.
5. Add a restrained signature element only when the surface benefits from one.

Changes that usually do not require separate direction approval when implementation is already authorized:

- Fixing text overflow, unstable dimensions, missing focus states, broken mobile layout, and low contrast.
- Reusing existing tokens instead of repeated literals.
- Aligning inconsistent spacing, radii, shadows, and component states with an established local system.
- Replacing improvised icons with the project's existing icon library.

Changes that require explicit direction or strong prior authorization:

- Replacing the global font family or brand palette.
- Rewriting information architecture, navigation, or product copy at scale.
- Replacing the component library or styling architecture.
- Removing established brand assets or changing a product from light to dark as a global default.

## Resist Generic AI Output

Use `references/visual-language.md` rather than applying blanket bans. In particular:

- Do not default to purple-blue gradients, warm beige surfaces, glass panels, glowing dark themes, oversized hero copy, repeated feature-card grids, decorative blobs, or uniform rounded containers.
- Do not remove every gradient, card, serif, or animation. Keep one when its function, content, or brand makes it the right tool.
- Match interface density to the job. Operational tools should be quiet and efficient; brand surfaces may be more expressive.
- Make typography fit the language and content. Verify CJK coverage when Chinese is present.
- Prefer real product artifacts, data, imagery, and interaction over generic decoration.

## Verify The Rendered Result

After editing:

1. Run the relevant formatter, typecheck, lint, tests, and production build supported by the project.
2. Start the existing dev server when the project requires one.
3. Read `references/verification.md` and inspect at least one desktop and one mobile viewport with browser tooling.
4. Run `scripts/runtime-audit.js` in each inspected page and check console errors, failed assets, horizontal overflow, text collision, content clipping, focus visibility, hover/active states, reduced motion, empty/loading/error states, and long-content behavior.
5. Re-run `audit-ui.mjs` on the changed scope. Confirm that fixed findings disappeared and that no higher-severity findings were introduced.
6. Compare screenshots before and after when the change is substantial.

Do not call a frontend finished when the rendered page is blank, overlaps incoherently, shifts during loading, or only works at one viewport.

## Report The Outcome

Lead with what changed and what now works. Mention the design direction in one sentence, list the most important implementation areas, and report verification commands and viewport coverage. Separate unresolved product decisions from defects that remain because tooling or environment access was unavailable.
