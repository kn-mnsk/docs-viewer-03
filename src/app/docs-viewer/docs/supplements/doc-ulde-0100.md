# ULDE Integration

this is the moment everything you’ve built with ULDE finally becomes the engine behind your documentation system rather than a standalone profiler.
Let’s map out the integration in a way that feels modular, visual, and contributor‑friendly — exactly your style.

Below is a clean, layered architecture plan that shows how ULDE slots into your documentation system without disrupting its existing structure, while opening the door to plugin‑extensible docs, visual lifecycles, and onboarding clarity.

## 1. The High‑Level Integration 

Think of your documentation system as having three layers:

Layer	|Purpose	|How ULDE integrates 
------|---------|--------------------
|1. Documentation Engine (DE)	|Renders pages, layouts, navigation, demos	|ULDE becomes a service and plugin host inside DE
|2. Plugin System	|Extends content, layout, interactivity	|ULDE becomes the runtime that manages plugin lifecycles
|3. ULDE Runtime	|Observes lifecycles, measures timings, visualizes behavior	|Embedded as a first‑class subsystem

ULDE doesn’t sit “next to” the docs — it becomes the observability and lifecycle backbone of the entire system.

## 2. Where ULDE Lives in Your Documentation System

Here’s the cleanest placement:

/core/ulde/

- ulde-runtime.service.ts
- ulde-lifecycle.service.ts
- ulde-plugin-registry.ts
- ulde-overlay.component.ts
- ulde-debug-tools/ (timeline, logs, overlays)

/plugins/

- content-*
- layout-*
- demo-*
- navigation-*
- ulde-* (ULDE’s own plugins)

/engine/

- Page rendering pipeline
- Layout engine
- Navigation system
- Markdown/MDX/Custom DSL renderer

ULDE becomes a core subsystem, not an add‑on.

## 3. The Integration 

This is the heart of the design — the contract between your documentation engine and ULDE.

__The Documentation Engine provides:__

- A stable lifecycle:

>- onInitDocs
>- onLoadPage
>- onRenderPage
>- onHydrateInteractiveBlocks
>- onAfterRender

- A plugin registration API
- A rendering pipeline that emits lifecycle events

__ULDE provides:__

- Lifecycle observation
- Plugin execution timing
- Frame/phase segmentation
- Debug overlays
- Plugin registry
- Visual timeline
- Contributor‑friendly diagnostics

__The contract is simple:__

> The Documentation Engine emits lifecycle events → ULDE observes them → ULDE visualizes and profiles them.

This keeps the integration clean and future‑proof.

## 4. The Unified Lifecycle Model

Your documentation system already has a natural lifecycle. ULDE has its own lifecycle.
We merge them into a single unified lifecycle:
```Code
DocsEngine.onInitDocs → ULDE.phase("init")
DocsEngine.onLoadPage → ULDE.phase("load")
DocsEngine.onRenderPage → ULDE.phase("render")
DocsEngine.onHydrateInteractiveBlocks → ULDE.phase("hydrate")
DocsEngine.onAfterRender → ULDE.phase("afterRender")
```

Each phase:

- starts a timing segment
- runs plugins
- records plugin timings
- emits data to the overlay

This gives you a full-frame timeline for every page load or navigation.

## 5. Plugin Architecture for Documentation

This is where your long-term vision shines.

__Plugin Types__ 
Plugin Type	|Purpose	|Example 
------------|---------|--------
Content plugins	|Transform or augment content	|Markdown → HTML, code block transformers
Layout plugins	|Modify page structure	|TOC injection, sidebar builders
Interactive plugins	|Add demos, sandboxes, playgrounds	|Live code editors
Navigation plugins	|Modify routing or breadcrumbs	|Auto‑generated navigation
ULDE plugins	|Profiling, overlays, diagnostics	|Timeline, logs, warnings

__Plugin Lifecycle__

Every plugin gets:

- onInit
- onPageLoad
- onBeforeRender
- onAfterRender
- onDestroy

ULDE measures all of these automatically.

## 6. How ULDE Hooks Into the Rendering Pipeline

Here’s the clean integration flow:

1. DocsEngine boots

>- ULDE initializes
>- ULDE registers built‑in plugins
>- ULDE exposes observe() API

2. Page navigation occurs

>- DocsEngine emits onLoadPage
>- ULDE starts a new frame
>- ULDE records timings

3. Rendering pipeline runs

>- Layout engine
>- Content engine
>- Interactive hydration
>- ULDE wraps each plugin execution

4. ULDE overlay updates

>- Phase segments
>- Plugin timings
>- Warnings
>- Debug logs

5. Contributors see a visual timeline

This becomes your onboarding superpower.

## 7. Contributor Onboarding Experience

This is where your architectural empathy shines.

Your onboarding guide will include:

__Visual artifacts__

- Unified lifecycle diagram
- Plugin lifecycle diagram
- Rendering pipeline timeline
- ULDE overlay screenshots
- Namespacing conventions

__Contracts__

- How to write a plugin
- How to register it
- How to test it with ULDE
- How to debug lifecycle issues

__Starter templates__

- plugin-content-starter
- plugin-layout-starter
- plugin-demo-starter
- plugin-ulde-starter

This makes your system contributor‑friendly and scalable.

## 8. Migration Strategy

A smooth, low‑risk path:

P__hase 1 — Integrate ULDE silently__

- ULDE observes lifecycles
- No overlay shown by default
- No plugin timings yet

__Phase 2 — Enable overlay in dev mode__

- Contributors see lifecycle phases
- Plugin timings appear
- Debug logs available

__Phase 3 — Migrate existing docs into plugin architecture__

- Content → content plugins
- Layout → layout plugins
- Demos → interactive plugins

__Phase 4 — ULDE becomes the official profiling layer__

- Performance budgets
- Plugin warnings
- Lifecycle anomalies
- Visual debugging

## 🌟 Where we go next

To keep momentum, I suggest we dive into one of these next:

__Option A — Define the unified lifecycle diagram__

> A visual, explicit, contributor‑friendly model.

__Option B — Design the plugin API for documentation plugins__

> Namespacing, contracts, lifecycle hooks.

__Option C — Architect the rendering pipeline with ULDE hooks__

> A clean, layered, future‑proof pipeline.

__Option D — Start building the Documentation Engine layer__

> The foundation for everything else.
