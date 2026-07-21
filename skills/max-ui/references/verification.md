# Verification

Use this checklist after frontend changes.

## Build Health

- Run the package's formatter when available.
- Run typecheck, lint, focused tests, and production build in proportion to the change.
- Check the browser console and network panel for errors and failed assets.
- Confirm the development server uses the intended package and route.

## Viewports

Inspect at minimum:

- Narrow mobile around 360-390 CSS pixels.
- Desktop around 1280-1440 CSS pixels.

For shared layouts, dashboards, or fixed-format tools also inspect tablet and wide desktop. Test the longest real heading and label, not only placeholder copy.

At each representative viewport, evaluate the full contents of `scripts/runtime-audit.js` in the page context and retain the returned JSON with the screenshot. The expression only reads the DOM and computed styles. Re-run it after fixes so measured defects can be compared directly.

Treat runtime output the same way as static output:

- Inspect `deterministic` findings at the reported selector and measured viewport.
- Confirm `strong-signal` findings against component behavior and product density.
- Use screenshots and product context before acting on `visual-review` findings.
- Apply `safe-auto` fixes narrowly; review `needs-review`; obtain or infer an authorized design direction before `direction-required` changes.

## Layout

- No accidental horizontal scrolling.
- No text, icon, badge, tooltip, menu, or control collision.
- Stable dimensions for toolbars, boards, tables, counters, and media.
- Sticky and fixed elements do not cover content.
- Dialogs, popovers, and menus escape clipping containers.
- Empty, sparse, dense, loading, error, disabled, and success states remain coherent.

## Interaction And Accessibility

- Keyboard can reach and operate the primary workflow.
- Focus is visible and returns correctly after dialogs or menus.
- Icon-only controls have accessible names.
- Hit targets remain usable on touch screens.
- Status is not communicated by color alone.
- Reduced-motion mode remains understandable and usable.
- Zoom is not disabled.

## Visual Language

- Palette roles are consistent across canvas, surface, text, action, and status.
- Body copy remains readable on every surface.
- Type hierarchy matches the container and information importance.
- Radius, border, shadow, and spacing choices form a system rather than a collection of effects.
- The distinctive device comes from product content and does not obscure the primary task.
- Marketing composition does not leak into dense operational surfaces.

## Dialogs And Overlays

- Escape closes dismissible custom dialogs.
- Initial focus moves into the dialog and remains contained while it is modal.
- Focus returns to the invoking control after close.
- Backdrops, close buttons, destructive actions, and nested popovers behave consistently with the product's interaction conventions.

## Evidence

Capture before/after screenshots for substantial work. Prefer full-page and focused component screenshots when both hierarchy and detail changed. When a screenshot is unavailable, state that visual verification remains incomplete.
