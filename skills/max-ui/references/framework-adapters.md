# Framework Adapters

Use the project's existing stack. Apply only the relevant section.

## React And Next.js

- Preserve server/client component boundaries.
- Use the existing router and data-loading model.
- Prefer existing component primitives and variants over parallel components.
- Check hydration-sensitive theme, time, locale, and viewport logic.
- Use `next/font` when already established; do not introduce a remote font loader beside it.
- Preserve image optimization and explicit dimensions.

## Vue And Nuxt

- Preserve Composition API or Options API conventions already used in the package.
- Keep scoped styles scoped unless a token or reset is intentionally global.
- Preserve Nuxt auto-import, layout, and server-rendering conventions.

## Svelte And SvelteKit

- Preserve component-local styling and reactive conventions.
- Check transition behavior under reduced motion and server rendering.
- Avoid introducing React-shaped component APIs.

## Tailwind

- Read the theme configuration and CSS token layer before adding raw arbitrary values.
- Reuse project utilities and component variant helpers.
- Do not convert established CSS into Tailwind or Tailwind into CSS merely for consistency with personal preference.
- Inspect long class strings for repeated one-off values that belong in tokens or variants.

## CSS Modules And Sass

- Keep selectors local and avoid specificity escalation.
- Reuse variables, mixins, and established composition patterns.
- Check that media-query changes do not conflict with neighboring modules.

## CSS-In-JS

- Preserve the active theming provider and server-rendering setup.
- Avoid mixing an additional runtime styling library into the same surface.
- Keep dynamic styles tied to state or tokens rather than repeated literals.

## Component Libraries

- Use the library's intended primitives, accessibility behavior, and variant APIs.
- Theme the library through its supported token or provider layer.
- Do not wrap every primitive in a custom component unless the wrapper creates a real product-level contract.
- Avoid replacing a stable library because its defaults are visually plain; improve composition and tokens first.

