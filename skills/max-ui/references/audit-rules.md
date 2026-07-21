# Audit Rules

Use this reference to interpret static audit output and perform evidence-backed review.

## Evidence Classes

### Deterministic

Directly testable in source or runtime. Examples:

- Browser zoom disabled.
- Missing accessible name on an icon-only control.
- Measurable text contrast below the chosen threshold.
- Text or controls outside the viewport.
- Missing image dimensions causing layout shift.
- Focus outline removed without a visible replacement.

Treat these as defects unless repository context proves the detector read the code incorrectly.

### Strong Signal

A measurable implementation pattern that frequently causes poor results:

- `transition: all`.
- Repeated hard-coded colors instead of existing tokens.
- Large fixed widths without responsive constraints.
- Multiple gradients or glass effects on one surface.
- Display tracking or type size outside a readable range.
- Many card-like containers with identical styling.

Inspect the rendered component and surrounding system before changing it.

### Visual Review

A clue that cannot be judged reliably from source alone:

- Palette feels generic or poorly matched to the product.
- Font personality conflicts with the interface.
- Layout lacks rhythm or hierarchy.
- A page resembles a common generated template.
- Decorative effects dominate real product content.

Require screenshots or live inspection before presenting these as conclusions.

## Fixability Classes

### Safe Auto

Use only when the repair is narrow, local, and does not choose a new design direction. Examples include restoring browser zoom or adding an accessible name that is already unambiguous from nearby copy. Re-run the relevant static and runtime checks after the edit.

### Needs Review

Use when the evidence is credible but the correct repair depends on component behavior, responsive intent, or surrounding layout. Examples include undersized controls in a dense toolbar, a late cascade override, clipped text, duplicate IDs with references, or an incomplete custom-dialog focus lifecycle.

### Direction Required

Use when several technically valid repairs would produce meaningfully different product identity or hierarchy. Examples include palette roles, font changes, broad contrast-token changes, card removal, effect density, or replacing a repeated visual motif.

Fixability is separate from severity. A critical issue can still need review, while a low-severity defect may be safe to repair automatically.

## Prioritization

Order findings by impact:

1. Broken workflow, unreadable content, inaccessible interaction, or responsive failure.
2. Inconsistent system behavior that multiplies across pages or components.
3. Weak information hierarchy, density, typography, or palette roles.
4. Generic decoration and low-value polish.

Do not bury a broken form below dozens of aesthetic preferences.

## False-Positive Controls

- Inspect the cited code block, not only the matching line.
- Check whether a component library supplies behavior that static source does not show.
- Check whether a pattern is part of committed identity.
- Check whether a value is overridden at runtime or resolved through tokens.
- Check whether native HTML semantics already satisfy the requirement.
- Treat generated files, snapshots, demos, and vendor code as out of scope.

## Reporting

For each actionable finding include:

- Severity and evidence class.
- File and line.
- User-visible consequence.
- Why it conflicts with this product, not merely with a style preference.
- Smallest coherent fix.
- Whether it is safe to fix automatically or requires design direction.

When no issues are found, say so and report the runtime or viewport gaps that remain untested.
