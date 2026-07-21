# Project Reading

Use this reference to understand an existing frontend before changing it.

## Inventory

Establish the following from repository evidence:

- Concrete frontend root and whether it lives in a monorepo.
- Framework, router, rendering mode, package manager, build commands, and supported browsers.
- Styling mechanism: global CSS, CSS Modules, Tailwind, CSS-in-JS, Sass, utility wrappers, or a combination.
- Component primitives and icon library.
- Theme and token sources, including CSS variables, Tailwind theme values, JavaScript theme objects, and design-system packages.
- Font sources, weights, language coverage, preload behavior, and fallback stack.
- Major routes and the specific surface in scope.
- Existing product assets: logos, screenshots, product imagery, data visualizations, illustrations, and empty-state art.
- Existing responsive conventions and breakpoint strategy.
- Existing tests, Storybook stories, visual snapshots, or browser automation.

Do not read `.env` files, credentials, generated bundles, dependency directories, or private data files for visual context.

## Identity Classification

Classify evidence into three buckets:

1. **Committed identity**: repeated brand colors, shipped logo assets, documented tokens, stable typography, and components used across multiple surfaces.
2. **Useful convention**: established layout primitives, component APIs, spacing scales, and interaction patterns that reduce implementation risk.
3. **Incidental residue**: starter-template colors, one-off literals, abandoned components, copied demo content, or a style appearing on only one unfinished screen.

Preserve committed identity by default. Reuse useful conventions. Do not protect incidental residue merely because it already exists.

## Register

Choose the register from the work the interface performs:

- **Operational product**: dashboards, admin tools, editors, settings, CRM, monitoring, developer tools. Optimize scanning, comparison, repetition, and reliable action.
- **Brand/marketing**: product sites, campaigns, launches, venues, portfolios. Optimize identity, narrative, proof, and a memorable first viewport.
- **Editorial/content**: publications, documentation, reading experiences, research archives. Optimize hierarchy, rhythm, navigation, and sustained reading.
- **Consumer utility**: shopping, booking, finance, health, social, media. Optimize recognition, trust, feedback, and task completion.
- **Hybrid**: explicitly state which sections use which register. Do not style the entire product like its marketing home page.

## Change Boundary

Before editing, write down:

- Behavior and routes that must remain unchanged.
- Brand elements that should remain recognizable.
- Components and tokens that should be reused.
- Existing defects that justify system-level change.
- Whether the user authorized polish, redesign, or only diagnosis.

When the request is narrow, keep the change local. A weak button does not automatically justify a new global theme.

