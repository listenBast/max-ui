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

## Evidence

Capture before/after screenshots for substantial work. Prefer full-page and focused component screenshots when both hierarchy and detail changed. When a screenshot is unavailable, state that visual verification remains incomplete.

