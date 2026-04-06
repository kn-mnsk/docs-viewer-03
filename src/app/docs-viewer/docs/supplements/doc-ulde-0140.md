# How to Map Your Existing Documentation System Into the ULDE Architecture

It’s about mapping docs-vieweer into the ULDE architecture so you can grow into it safely, incrementally, and with full architectural clarity.

Below is the clean, structured version you can reuse anytime.

Your current system already has three major subsystems — even if they’re not explicitly separated yet:

Existing System Behavior	|ULDE Layer It Maps To	|What You Do Now 
--------------------------|-----------------------|----------------
Loading markdown/MDX/DSL, resolving links, metadata, frontmatter	|ContentEngine	|Wrap your existing loader/parsers into a ContentEngine class
Rendering layout: shell, TOC, sidebar, breadcrumbs, page chrome	|LayoutEngine	|Wrap your existing layout logic into a LayoutEngine class
Interactive demos, playgrounds, code runners, sandboxes	|InteractiveEngine	|Wrap your existing demo logic into an InteractiveEngine class

__You don’t rewrite these, but You wrap them.__

## Step 1 — Wrap What You Already Have (No Behavior Changes)

### 1. ContentEngine: wrap your existing content pipeline

You take your current markdown/MDX/DSL loader and simply expose it through a stable interface:

```ts
export class ContentEngine {
  load(path: string) {
    return existingMarkdownLoader(path); // your current logic
  }

  resolveLinks(html: string) {
    return existingLinkResolver(html); // your current logic
  }
}
```

__No rewriting, but Just a wrapper.__

### 2. LayoutEngine: wrap your existing layout shell

Your current layout system (sidebar, TOC, breadcrumbs, page chrome) becomes:

```ts
export class LayoutEngine {
  renderShell(content: HTMLElement) {
    return existingLayoutShell(content); // your current layout
  }
}
```

__Again, no rewriting, but just exposing it through a stable contract.__

### 3. InteractiveEngine: wrap your existing demos

Your current playgrounds/demos become:

```ts
export class InteractiveEngine {
  mountDemo(id: string, container: HTMLElement) {
    return existingDemoSystem.mount(id, container);
  }
}
```

__This is the easiest subsystem to wrap because it’s already modular.__

## Step 2 — Introduce ULDE as a Thin Orchestrator Layer

ULDE doesn’t replace your system. It sits above it, orchestrating the three engines.

```ts
export class ULDE {
  constructor(
    private content: ContentEngine,
    private layout: LayoutEngine,
    private interactive: InteractiveEngine
  ) {}

  async render(path: string) {
    const raw = await this.content.load(path);
    const html = this.content.resolveLinks(raw);
    const shell = this.layout.renderShell(html);
    this.interactive.mountDemo("auto", shell);
    return shell;
  }
}
```

__This is the “unified lifecycle” you and I have been designing.__

## Step 3 — Extract Your First Plugin (The Key Growth Step)

You don’t rewrite your system into plugins. You extract one plugin at a time.

Start with something small and self‑contained, like:

- “Auto‑generate heading anchors”
- “Add copy‑button to code blocks”
- “Track page load timings”
- “Inject demo metadata into the page”

A plugin looks like:
```ts
export const HeadingAnchorPlugin = {
  name: "heading-anchors",
  phase: "post-content",
  run(ctx) {
    ctx.html = addAnchors(ctx.html);
  }
};
```

You plug it into the registry:
```ts
pluginRegistry.register(HeadingAnchorPlugin);
```

__Your system now has its first plugin. This is how you grow into the architecture.__

## Step 4 — Gradually Decompose Your Existing System Into Plugins

Over time, you move logic out of your engines and into plugins:
Existing Behavior	|Plugin Phase	|Example Plugin 
------------------|-------------|---------------
Rewrite internal links	|post-content	|LinkRewritePlugin
Add code block syntax highlighting	|post-content	|PrismPlugin
Auto-generate TOC	|post-content	|TocPlugin
Inject demo metadata	|pre-interactive	|DemoMetadataPlugin
Track render timings	|instrumentation	|TimingPlugin

__This is how your system becomes modular, extensible, and contributor‑friendly.__

## Step 5 — Grow Into the Architecture at Your Own Pace

You can migrate in three safe phases:

__Phase 1 — Wrap existing logic__
Everything still works exactly as before.

__Phase 2 — Introduce ULDE orchestrator__
Your system now has a unified lifecycle.

__Phase 3 — Extract plugins gradually__
Your system becomes modular and extensible.

No rewrites.
No breakage.
No “big bang” migration.
