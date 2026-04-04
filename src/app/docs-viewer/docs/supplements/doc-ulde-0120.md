# Plugin API Design

This is where your documentation system becomes a real platform, with ULDE acting as the observability backbone and the plugin API acting as the extension contract.

__Plugin API — The Official 

Your plugin system needs to be:

- namespaced
- predictable
- lifecycle‑aligned
- ULDE‑observable
- easy for contributors to adopt

Below is the canonical API.

## Plugin Metadata Contract

Every plugin declares:
```ts
export interface DocsPlugin {
  name: string;                 // required, namespaced
  version?: string;             // optional
  description?: string;         // optional
  enabled?: boolean;            // default true
  hooks: PluginHooks;           // lifecycle hooks
}
```
__Naming convention__

You enforce namespacing, so:

- content.markdown
- layout.toc
- demo.playground
- nav.breadcrumbs
- ulde.timeline (ULDE’s own plugin)

This keeps the ecosystem clean and conflict‑free.

## 2. Plugin Lifecycle Hooks

These map 1:1 to the unified lifecycle phases.
```ts
export interface PluginHooks {
  onInit?(): void | Promise<void>;
  onPageLoad?(ctx: PageContext): void | Promise<void>;
  onBeforeRender?(ctx: RenderContext): void | Promise<void>;
  onAfterRender?(ctx: RenderContext): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
```

__Why this works__

- Every hook is optional
- ULDE wraps each hook to measure timing  
- Contributors only implement what they need
- Hooks are phase‑aligned and predictable

## 3. Execution Contract (ULDE‑Aware)

This is the heart of the system.

ULDE wraps every plugin hook:
```ts
async executeHook(plugin, hookName, ...args) {
  const start = performance.now();
  try {
    await plugin.hooks[hookName]?.(...args);
  } finally {
    const end = performance.now();
    this.ULDE.recordPluginTiming(plugin.name, hookName, end - start);
  }
}
```
This ensures:

- no plugin can “escape” measurement
- ULDE always has accurate timings
- the overlay stays in sync with the lifecycle

## 4. Plugin Registration 

Contributor‑friendly and explicit:
```ts
PluginRegistry.register({
  name: "content.markdown",
  hooks: {
    onPageLoad(ctx) { /* ... */ },
    onBeforeRender(ctx) { /* ... */ }
  }
});
```
Registry responsibilities

- store plugins
- enforce namespacing
- run hooks in order
- provide ULDE with plugin metadata
- expose plugin list to the overlay

## 5. Plugin Context Objects

__PageContext__
```ts
interface PageContext {
  pageId: string;
  route: string;
  frontmatter: Record<string, any>;
  rawContent: string;
}
```
__RenderContext__
```ts
interface RenderContext {
  pageId: string;
  ast: any;           // markdown/MDX/custom AST
  html: string;       // intermediate or final
  layout: string;     // layout identifier
}
```
These contexts make plugins powerful but safe.

## 6. Plugin Execution Order

Within each phase:

1. ULDE starts phase
2. Plugins run in registration order
3. ULDE records timings
4. ULDE ends phase

This gives you deterministic behavior and clean debugging.

