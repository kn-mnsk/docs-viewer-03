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

