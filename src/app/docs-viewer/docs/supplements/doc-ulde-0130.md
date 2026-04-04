# Angular Integration — Where ULDE Lives in Your Real System

Now we map the lifecycle + plugin API into your Angular documentation engine.

This is where your architectural instincts shine.

## 1. Angular Component/Service Placement

/core/ulde/

- ulde-runtime.service.ts
- ulde-lifecycle.service.ts
- ulde-plugin-registry.ts
- ulde-overlay.component.ts
- ulde-debug-tools/

/engine/

- docs-engine.service.ts
- content-engine.service.ts
- layout-engine.service.ts
- interactive-engine.service.ts

/plugins/

- contributor plugins
- ULDE plugins
- system plugins

This structure is clean, scalable, and contributor‑friendly.

## 2. Angular Lifecycle 

Your Angular docs engine emits events that map directly to ULDE phases.

__Angular → Unified Lifecycle__
Angular Event	|Docs Engine Action	|ULDE Phase 
--------------|-------------------|-----------
App bootstrap	|init docs engine	|init
Route change start	|load page	|load
Route data resolved	|prepare content/layout	|load
Component render	|render page	|render
AfterViewInit	|hydrate interactive blocks	|hydrate
ChangeDetection stable	|finalize + overlay	|afterRender

This mapping is stable and intuitive.

## 3. Angular Implementation Sketch

__docs-engine.service.ts__
```ts
constructor(private ul: ULDELifecycle) {}

async navigateTo(pageId: string) {
  await this.ul.startPhase("load");
  await this.content.load(pageId);
  await this.layout.prepare(pageId);
  await this.plugins.run("onPageLoad", { pageId });
  await this.ul.endPhase("load");
}

async render(pageId: string) {
  await this.ul.startPhase("render");
  const ast = await this.content.transform(pageId);
  const html = await this.layout.render(ast);
  await this.plugins.run("onBeforeRender", { pageId, ast, html });
  await this.ul.endPhase("render");
}
```
__ulde-lifecycle.service.ts__
```ts
startPhase(name: PhaseName) {
  this.currentPhase = name;
  this.phaseStart = performance.now();
}

endPhase(name: PhaseName) {
  const duration = performance.now() - this.phaseStart;
  this.overlay.updatePhase(name, duration);
}
```
__ulde-overlay.component.ts__

- subscribes to ULDE lifecycle events
- renders phase bars
- renders plugin timings
- updates sparkline

## 4. Angular Signals (Optional Enhancement)

You can expose ULDE state via signals:
```ts
phase = signal<PhaseName>("init");
pluginTimings = signal<PluginTiming[]>([]);
frameHistory = signal<number[]>([]);
```
This makes the overlay reactive and efficient.

## 5. Angular Routing Integration

Hook into:

- Router.events
- NavigationStart
- NavigationEnd
- ResolveEnd
- AfterViewInit

This gives you perfect lifecycle alignment.

## 6. Final Architecture Summary

Plugin API

- clean
- namespaced
- lifecycle‑aligned
- ULDE‑observable

Angular Integration

- ULDE becomes a core subsystem
- DocsEngine emits lifecycle events
- ULDE wraps plugin execution
- Overlay visualizes everything

Your documentation system is now a platform, not just a renderer.

__If you want, I can now produce:
• A full contributor guide for plugin authors
• A visual architecture diagram for the Angular integration
• A starter template for plugins
• A debug overlay spec tied to Angular signals
Just tell me where you want to go next.__


You’re asking the right question: not “how do I rewrite everything?”, but “how do I map what I already have into this architecture and grow into it”.

Let’s treat this as:

- A new project skeleton that encodes the ULDE‑centric architecture
- A mapping guide from “existing docs system” → “new architecture”
- A migration path that lets you keep shipping while you reshape things

1. Start with a new ULDE‑centric project skeleton
```
docs-platform/
  src/
    core/
      ulde/
        ulde-runtime.service.ts
        ulde-lifecycle.service.ts
        ulde-plugin-registry.service.ts
        ulde-overlay/
          ulde-overlay.component.ts
          ulde-overlay.service.ts
          ulde-overlay.scss
    engine/
      docs-engine.service.ts
      content-engine.service.ts
      layout-engine.service.ts
      interactive-engine.service.ts
    plugins/
      content/
      layout/
      demo/
      nav/
      ulde/
    app/
      app.component.ts
      app-routing.module.ts
      app.module.ts

```
This is the target architecture.
Your existing system will be mapped into it, not rewritten.

2. Map your existing system into the new layers

__Content Engine__
Move your current markdown/MDX/DSL loader + parser here:
```ts
export class ContentEngine {
  load(pageId: string) { /* existing loader */ }
  transform(pageId: string) { /* existing parser */ }
}
```
__Layout Engine__
Move your current layout logic (shell, TOC, sidebars) here:
```ts
export class LayoutEngine {
  prepare(pageId: string) { /* choose layout */ }
  render(astOrHtml) { /* apply layout */ }
}
```
__Interactive Engine__
Move your current demo/playground activation here:
```ts
export class InteractiveEngine {
  hydrate(pageId: string) { /* bootstrap demos */ }
}
```
Nothing is rewritten — it’s just reorganized.

3. Introduce ULDE as a thin layer around your existing flow

Wrap your existing logic with ULDE lifecycle phases:
```ts
export class DocsEngine {
  constructor(
    private ulde: ULDELifecycleService,
    private content: ContentEngine,
    private layout: LayoutEngine,
    private interactive: InteractiveEngine,
  ) {}

  async navigateTo(pageId: string) {
    await this.runLoadPhase(pageId);
    await this.runRenderPhase(pageId);
    await this.runHydratePhase(pageId);
    await this.runAfterRenderPhase(pageId);
  }
}
```
This gives you observability without rewriting anything.

4. Add the plugin registry as an adapter layer

Introduce plugins without forcing your system to use them immediately:
```ts
export class ULDEPluginRegistry {
  register(plugin: DocsPlugin) { /* store plugin */ }
  async run(hookName, ...args) { /* run hooks + ULDE timings */ }
}
```
Then wire it into the lifecycle:
```ts
await this.plugins.run("onPageLoad", { pageId });
```
Now your system is plugin‑ready, even if you only register one plugin at first.

5. Gradually migrate existing behavior into plugins

Do this in thin slices:

__Phase 1 — Wrap, don’t rewrite__

- Move existing logic into engines
- Add ULDE lifecycle
- Add plugin registry
- No plugins yet (or trivial ones)

__Phase 2 — Extract first plugin__

Take one behavior (e.g., TOC generation) and move it into a plugin:
```ts
PluginRegistry.register({
  name: "layout.toc",
  hooks: {
    onBeforeRender(ctx) { /* inject TOC */ }
  }
});
```

__Phase 3 — Decompose over time__

Move transforms, layout tweaks, demos, navigation logic into plugins.

__Phase 4 — Add ULDE overlay__

Once the lifecycle + plugins are stable, mount the overlay in dev mode.

6. How to think about mapping

For each piece of your existing system, ask:

- Is it content, layout, interactivity, or navigation?  
→ move to the corresponding engine or plugin type.
- When does it run?  
→ map to init, load, render, hydrate, afterRender.
- Should contributors be able to extend it?  
→ make it a plugin.
- Is it core infrastructure?  
→ keep it in engine/ or core/ulde/.

This mindset ensures a smooth, incremental migration.

🎯 The Core Idea
You don’t rewrite your documentation system.
You wrap it, orchestrate it, and grow into plugins.

This is the migration path you asked me to prepare for your new chat — and it’s ready for you to use anytime.

1. a starter project scaffold
2. the folder structure
3. the Angular integration layer
4. the plugin registry boilerplate
5. the lifecycle diagrams
6. or a full migration checklist


