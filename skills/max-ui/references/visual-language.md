# Visual Language

Use this reference for aesthetic direction, typography, color, layout, and anti-template decisions.

## Distinctiveness Method

Build a visual direction from four inputs:

1. **Subject**: materials, tools, environments, artifacts, and visual conventions native to the product's domain.
2. **Audience**: expertise, trust requirements, attention level, device, and frequency of use.
3. **Job**: the information that must be understood and the action that must be completed.
4. **Constraint**: existing brand, content volume, assets, accessibility, performance, and implementation stack.

Select one signature device that belongs to those inputs. Examples include an inspection viewport for hardware software, a ledger rhythm for accounting, a timeline based on real events, or a workspace canvas for an editor. Do not select a signature because it is fashionable.

## Color

- Assign colors to roles before selecting exact values: canvas, surface, ink, secondary text, border, primary action, status, and data categories.
- Use OKLCH when introducing or rebuilding tokens because lightness and chroma are easier to reason about consistently.
- Preserve an established brand hue unless the user requests a rebrand or evidence shows it is incidental residue.
- Avoid one-hue interfaces in which every surface, border, shadow, and action is a variation of the same blue, purple, beige, or slate family.
- Avoid decorative gradients by default. Keep gradients for continuous data, real lighting/material effects, spatial depth, or an explicit brand language.
- Do not use muted gray text simply to make the interface appear refined. Body copy must remain comfortably readable.
- Tint supporting neutrals toward the brand only slightly. The interface still needs clear separation between canvas, surface, border, and text.
- Verify contrast in rendered output. Static token checks cannot fully resolve transparency, images, gradients, or computed color spaces.

## Typography

- Choose type for language, product register, content length, numeral behavior, and platform rendering.
- Verify Chinese glyph coverage before using a display or body face on Chinese content.
- Use one family with a strong internal range or pair families with a clear contrast in role. Avoid pairs that differ only subtly.
- Treat typography as structure: title, section heading, body, label, caption, code, and data each need a reasoned role.
- Avoid extreme display sizes inside compact tools, cards, sidebars, and settings panels.
- Keep long text at readable measure and use balanced wrapping only for short headings.
- Avoid destructive negative tracking. Tight display type should retain recognizable letterforms at all breakpoints.
- Do not reject a common font solely because it is common. Reject it when it erases the product's identity or fails the content.

## Layout And Density

- Use spacing to express grouping. Related controls sit closer together; different tasks receive stronger separation.
- Avoid representing every section as a floating card. Use page structure, dividers, tables, lists, bands, and whitespace when they better express relationships.
- Never nest decorative cards. A framed tool inside a larger layout may contain controls, but repeated border-radius, border, background, and shadow layers create false hierarchy.
- Match density to usage frequency. Repeated operational work benefits from compact predictable alignment; a campaign can spend more space on narrative and imagery.
- Give fixed-format elements stable dimensions with grid tracks, aspect ratios, min/max constraints, or container queries.
- Design long labels, translated text, empty content, dense content, and narrow screens deliberately.
- Use asymmetry only when it improves emphasis or reflects the subject. Random offsets are not personality.

## Motion

- Use motion to explain cause and effect, preserve spatial continuity, provide feedback, or create one intentional narrative moment.
- Prefer a few coordinated transitions over identical reveal animations on every section.
- Animate transform and opacity when possible; use layout animation only when the interaction requires it.
- Ensure the useful state exists without animation. Content must not remain invisible when scripts pause or rendering is headless.
- Provide reduced-motion behavior and keep interaction responsive while motion is running.

## Generic-Pattern Review

Investigate these patterns when they appear repeatedly or without product meaning:

- Purple, violet, cyan, or blue gradients used as automatic emphasis.
- Beige or cream canvas used as automatic sophistication.
- Dark surfaces with glowing borders and blurred colored shadows.
- Glass panels layered over decorative backgrounds.
- Oversized hero copy consuming most of the first viewport without revealing the product.
- Small uppercase labels repeated above every heading.
- Uniform icon-title-copy feature cards.
- Excessively rounded panels, pills used for non-compact content, and nested floating containers.
- Decorative grid lines, blurred blobs, or ambient orbs unrelated to the product.
- Placeholder dashboards made from invented metrics instead of meaningful product state.

Do not remove a pattern only because it appears on this list. Ask whether it communicates product meaning, supports the brand, and survives comparison with neighboring surfaces.

