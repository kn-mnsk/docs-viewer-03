# Lifecycle integration and Plugin‑ready documentation components 

## 1. The Browser–Angular Lifecycle Alignment

(A clean, explicit model that future contributors can actually see.)

Angular’s lifecycle is reactive and signal‑driven; the browser’s lifecycle is frame‑driven. The trick is to treat each browser frame as a “render budget window” and let Angular’s reactive graph schedule work inside that window.

### 1. The Three-Layer Model

Here’s the model I propose — it’s simple, explicit, and plugin‑friendly:

Layer	|Purpose	|Trigger	|Angular Mapping
------|---------|---------|----------------
Frame Layer	|Controls when work is allowed	|requestAnimationFrame	|“Frame budget window”
Reactive Layer	|Controls what work is needed	|Signals, computed, effects	|Angular’s reactive graph
DOM Layer	|Controls how work is applied	|DOM writes	|Angular 

### 2. The Core Rule

__Angular effects should never directly mutate the DOM.__  
Instead, they enqueue work into a Frame Task Queue that flushes on the next animation frame.

This gives you:

- deterministic DOM writes
- no layout thrashing
- plugin‑safe rendering
- a single place to visualize DOM mutations (your debug overlay dream)

### 3. The Contributor‑Friendly Lifecycle Diagram

Here’s the lifecycle in a form that’s perfect for onboarding:
```
Browser Frame Tick
   ↓
Frame Task Queue (collect DOM work)
   ↓
Angular Reactive Graph (signals → effects)
   ↓
Effects enqueue DOM mutations (never apply directly)
   ↓
Frame Task Queue flushes
   ↓
DOM updated in a single batch
```
This is the “invisible made visible” moment — the kind of thing your debug overlay can literally show.

---
## 2. Plugin‑System‑Ready Documentation Components

(Namespaced, conflict‑free, predictable, and lifecycle‑aware.)

Your instinct to treat documentation components as plugins is spot‑on. The key is to give each plugin:

- a namespace
- a registration contract
- a lifecycle contract
- a rendering contract
- a DOM budget contract (ties into the frame lifecycle above)

### 1. The Plugin Contract (v1)
Here’s a clean, contributor‑friendly contract:

```ts
interface DocsPlugin {
  namespace: string; // e.g. "mermaid", "callout", "tabs"

  // Called once when plugin is registered
  setup?(context: PluginSetupContext): void;

  // Called whenever a matching node appears in the DOM
  onMount?(el: HTMLElement, context: PluginMountContext): void;

  // Called before the element is removed
  onUnmount?(el: HTMLElement): void;

  // Optional: plugin contributes reactive state
  signals?: Record<string, Signal<any>>;
}
```

### 2. Namespacing Strategy

Your namespacing rule is elegant and scalable:
```
docs-plugin/<namespace>/<component>
```

Examples:

- docs-plugin/mermaid/diagram
- docs-plugin/callout/info
- docs-plugin/tabs/container

This prevents collisions and makes plugin discovery trivial.

### 3. Plugin Registration Pattern

A contributor‑friendly registry:
```ts
const registry = new Map<string, DocsPlugin>();

export function registerPlugin(plugin: DocsPlugin) {
  if (registry.has(plugin.namespace)) {
    throw new Error(`Plugin namespace conflict: ${plugin.namespace}`);
  }
  registry.set(plugin.namespace, plugin);
}
```

This is the backbone of your plugin ecosystem.

---
## 3. The Integration: Plugins + Frame Lifecycle

This is where your architectural instincts shine.

Each plugin’s onMount should never mutate the DOM directly.
Instead, it should enqueue DOM work into the Frame Task Queue.

This gives you:

- predictable rendering
- no plugin can block the UI
- no plugin can cause layout thrashing
- plugins become “frame‑aware citizens” of the system

### 1. Example: Plugin DOM Work
```ts
onMount(el, context) {
  context.enqueueDOM(() => {
    renderMermaidDiagram(el);
  });
}
```

### 2. Why this matters
This is the moment your entire documentation system becomes:

- deterministic
- debuggable
- plugin‑safe
- future‑proof
- contributor‑friendly

And it aligns perfectly with your philosophy of making invisible behaviors explicit.

---
## 4. What We Can Build Next
Here are the next artifacts that would make this architecture sing:

### 1. A unified lifecycle diagram

Frame → Reactive → Plugin → DOM
(You love diagrams; this one will anchor the whole system.)

### 2. A plugin authoring guide

A contributor‑friendly document that explains:

- namespacing
- lifecycle hooks
- DOM budget rules
- examples
- anti‑patterns

### 3. A debug overlay

A visual layer that shows:

- frame ticks
- DOM batch flushes
- plugin mounts/unmounts
- reactive graph triggers

This is the kind of thing that makes onboarding delightful.

---
# How plugins fit into a documentation system whose core component is DocsViewer

## 1. The Core Idea

A DocsViewer is your “host environment.”
Plugins are behaviors that attach to specific DOM patterns inside the viewer.

Think of it like this:

- DocsViewer: parses, renders, and updates documentation content
- Plugins: enhance that content by transforming or augmenting specific nodes
- Registry: keeps plugins namespaced and conflict‑free
- Lifecycle: ensures plugins mount/unmount predictably and safely

This is exactly the same pattern as browser extensions, VSCode extensions, or Markdown‑it plugins — but with your architectural rigor.

## 2. The Architecture at a Glance
```
DocsViewer
   ↓ parses content
DOM nodes appear
   ↓
Plugin Registry matches nodes
   ↓
Plugin.onMount(el)
   ↓
Plugin performs DOM work (via frame task queue)
```

__And when content changes:__
```
DOM nodes removed
   ↓
Plugin.onUnmount(el)
```

This gives you a clean, predictable lifecycle.

### . How Plugins Fit Into DocsViewer

Let’s make this concrete.

### Step 1: DocsViewer renders documentation content
This could be Markdown → HTML, MDX → Angular templates, or any other format.

Example DOM:

```html
<div class="docs">
  <pre data-plugin="mermaid">graph TD; A-->B;</pre>
  <div data-plugin="callout" data-type="info">Important note…</div>
</div>
```
Your viewer doesn’t need to know anything about Mermaid or Callouts.
It only needs to detect:
__“This node belongs to plugin X.”__

### Step 2: Plugin Registry

You maintain a registry:
```ts
const registry = new Map<string, DocsPlugin>();

export function registerPlugin(plugin: DocsPlugin) {
  registry.set(plugin.namespace, plugin);
}
```

Plugins register themselves at startup:
```ts
registerPlugin({
  namespace: "mermaid",
  onMount(el, ctx) {
    ctx.enqueueDOM(() => renderMermaid(el));
  }
});
```

### Step 3: DocsViewer Scans for Plugin Nodes

When DocsViewer finishes rendering:
```ts
const pluginNodes = root.querySelectorAll("[data-plugin]");
pluginNodes.forEach(el => {
  const ns = el.getAttribute("data-plugin");
  const plugin = registry.get(ns);
  plugin?.onMount?.(el, context);
});
```

This is the moment plugins “activate.”

### Step 4: Plugins Run Inside the Frame Lifecycle

This is where your architectural philosophy shines.

Plugins never mutate the DOM directly.
They enqueue DOM work:
```ts
onMount(el, context) {
  context.enqueueDOM(() => {
    renderMermaidDiagram(el);
  });
}
```
This ensures:

- no layout thrashing
- deterministic DOM updates
- plugins can’t block rendering
- everything is debuggable

## 4. A Minimal, Realistic Example

Here’s a plugin for “callout boxes”:
```ts
registerPlugin({
  namespace: "callout",

  onMount(el, ctx) {
    const type = el.getAttribute("data-type") ?? "info";

    ctx.enqueueDOM(() => {
      el.classList.add("callout", `callout-${type}`);
    });
  },

  onUnmount(el) {
    el.classList.remove("callout");
  }
});
```
And DocsViewer only needs to do:
```ts
renderContent(html);
activatePlugins();
```

## 5. Why This Architecture Works So Well

__✔ Plugins are isolated__
No plugin can interfere with another.

__✔ Plugins are namespaced__
No collisions, predictable behavior.

__✔ Plugins are lifecycle‑aware__
Mount → Update → Unmount is explicit.

__✔ Plugins are frame‑safe__
DOM work is batched and deterministic.

__✔ DocsViewer stays simple__
It doesn’t need to know anything about plugin internals.

__✔ Contributors get a clear contract__
They know exactly what to implement.

---
# Namespaced plugin directory structure

This structure is designed for:

- Contributor clarity
- Plugin isolation
- Namespaced discovery
- Lifecycle‑safe DOM work
- Future extensibility (versioning, docs, tests, assets)

And it aligns beautifully with your architectural style: explicit, modular, and teachable.

## 1. Namespaced Plugin Directory Structure

_(A structure that feels like a real ecosystem, not a pile of scripts.)_

```
docs-plugins/
  ├── mermaid/
  │   ├── index.ts
  │   ├── mermaid.plugin.ts
  │   ├── mermaid.renderer.ts
  │   ├── mermaid.styles.css
  │   ├── README.md
  │   └── tests/
  │       └── mermaid.plugin.spec.ts
  │
  ├── callout/
  │   ├── index.ts
  │   ├── callout.plugin.ts
  │   ├── callout.styles.css
  │   ├── README.md
  │   └── tests/
  │       └── callout.plugin.spec.ts
  │
  ├── tabs/
  │   ├── index.ts
  │   ├── tabs.plugin.ts
  │   ├── tabs.controller.ts
  │   ├── tabs.styles.css
  │   ├── README.md
  │   └── tests/
  │       └── tabs.plugin.spec.ts
  │
  └── registry.ts

```
### 1. Top-Level: docs-plugins/

This is your plugin namespace root.

It communicates:

- “Plugins live here”
- “Everything inside follows the same contract”
- “This is a modular ecosystem”

It’s the equivalent of src/plugins in VSCode or packages/* in a monorepo.

### 2. One Folder Per Plugin

Each plugin gets its own namespace folder:
```
docs-plugins/mermaid/
docs-plugins/callout/
docs-plugins/tabs/
```

This ensures:

- isolation
- discoverability
- no naming collisions
- easy removal or replacement
- clear ownership

A contributor can open a folder and immediately understand the plugin.

### 3. Inside Each Plugin Folder

__✔ index.ts__
Exports the plugin in a clean, stable way:
```ts
export * from './mermaid.plugin';
```
This keeps the plugin’s public API tidy.

__✔ *.plugin.ts__
The actual plugin implementation:
```ts
export const MermaidPlugin: DocsPlugin = {
  namespace: "mermaid",

  onMount(el, ctx) {
    ctx.enqueueDOM(() => renderMermaid(el));
  },

  onUnmount(el) {
    cleanupMermaid(el);
  }
};
```
This file is the heart of the plugin.

__✔ Optional: Supporting Modules__
Depending on complexity:

- mermaid.renderer.ts
- tabs.controller.ts
- callout.utils.ts

This keeps the plugin file small and readable.

__✔ Styles__
Each plugin owns its own CSS:
```
mermaid.styles.css
callout.styles.css
tabs.styles.css
```
This prevents global style leakage and makes plugin removal trivial.

__✔ README.md__
A contributor‑friendly guide:

- what the plugin does
- how to use it
- what DOM patterns it matches
- lifecycle notes
- examples

This is gold for onboarding.

__✔ tests/__
Each plugin has its own test suite:
```
tests/mermaid.plugin.spec.ts
```
This encourages plugin authors to write isolated, predictable tests.

### 4. The Plugin Registry

At the root:
```
docs-plugins/registry.
```
This file:

- imports all plugins
- registers them
- exports a single registry object

Example:
```ts
import { MermaidPlugin } from './mermaid';
import { CalloutPlugin } from './callout';
import { TabsPlugin } from './tabs';

export const PLUGINS = [
  MermaidPlugin,
  CalloutPlugin,
  TabsPlugin
];
```

DocsViewer can then do:
```ts
import { PLUGINS } from './docs-plugins/registry';

PLUGINS.forEach(registerPlugin);
```

This keeps plugin discovery explicit and predictable.

#### Why This Structure Is So Effective

_✔ Namespaced_
Every plugin lives in its own world.

_✔ Extensible_
Adding a new plugin is as simple as adding a folder.

_✔ Contributor‑friendly_
Each plugin folder is self‑contained and documented.

_✔ Lifecycle‑safe_
Plugins follow the same contract and lifecycle hooks.

_✔ Debug‑overlay‑ready_
You can easily instrument plugin mounts/unmounts.

_✔ Future‑proof_
You can add:

- versioning
- plugin metadata
- plugin capabilities
- plugin configuration

without breaking the structure.

## 2. Full Example Plugin

Let’s implement a Callout plugin — simple enough to understand, but rich enough to show the lifecycle and DOM‑budget pattern.

Here’s the directory:
```
docs-plugins/
  └── callout/
      ├── index.ts
      ├── callout.plugin.ts
      ├── callout.styles.css
      ├── README.md
      └── tests/
          └── callout.plugin.spec.ts

```

__index.ts__
```ts 
export * from './callout.plugin';
```

__callout.plugin.ts__
This plugin:

- activates on elements with data-plugin="callout"
- reads a data-type attribute (info, warning, danger)
- applies styles inside the frame lifecycle
- cleans up on unmount

```ts
import type { DocsPlugin } from '../types';

export const CalloutPlugin: DocsPlugin = {
  namespace: 'callout',

  onMount(el, ctx) {
    const type = el.getAttribute('data-type') ?? 'info';

    ctx.enqueueDOM(() => {
      el.classList.add('callout', `callout-${type}`);
    });
  },

  onUnmount(el) {
    el.classList.remove('callout');
    el.classList.remove('callout-info', 'callout-warning', 'callout-danger');
  }
};
```

__callout.styles.css__
```css
.callout {
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  border-left: 4px solid;
}

.callout-info {
  background: #eef6ff;
  border-color: #3b82f6;
}

.callout-warning {
  background: #fff8e1;
  border-color: #f59e0b;
}

.callout-danger {
  background: #fee2e2;
  border-color: #ef4444;
}

```

__README.md__
```md
# Callout Plugin

Enhances elements marked with `data-plugin="callout"`.

## Usage

```html
<div data-plugin="callout" data-type="warning">
  Be careful with this step.
</div>

```

__Supported types__

- info (default)
- warning
- danger

__Lifecycle__

- onMount applies classes inside the frame task queue
- onUnmount removes all classes

## 3. DocsViewer Integration Sketch

This is the part that ties everything together — the lifecycle, the registry, the DOM scanning, and the frame‑safe DOM work.

Let’s build it in layers.

### Layer 1: Plugin Registry

__docs-plugins/registry.ts__
```ts
import { CalloutPlugin } from './callout';

export const PLUGINS = [
  CalloutPlugin
];
```

### Layer 2: Frame Task Queue

This is the heart of your deterministic DOM‑budget model.
```ts
export class FrameTaskQueue {
  private queue: Array<() => void> = [];
  private scheduled = false;

  enqueue(task: () => void) {
    this.queue.push(task);
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => this.flush());
    }
  }

  private flush() {
    for (const task of this.queue) task();
    this.queue = [];
    this.scheduled = false;
  }
}
```

### Layer 3: DocsViewer Plugin Context
```ts
export interface PluginContext {
  enqueueDOM: (fn: () => void) => void;
}
```

### Layer 4: DocsViewer Plugin Activation

This is the core integration.
```ts
import { PLUGINS } from '../docs-plugins/registry';
import { FrameTaskQueue } from './frame-task-queue';

export class DocsViewer {
  private root: HTMLElement;
  private frameQueue = new FrameTaskQueue();
  private mounted = new Map<HTMLElement, DocsPlugin>();

  constructor(root: HTMLElement) {
    this.root = root;
  }

  render(html: string) {
    // Unmount old plugins
    this.unmountPlugins();

    // Render new content
    this.root.innerHTML = html;

    // Mount plugins for new content
    this.mountPlugins();
  }

  private mountPlugins() {
    const ctx = {
      enqueueDOM: (fn: () => void) => this.frameQueue.enqueue(fn)
    };

    const nodes = this.root.querySelectorAll('[data-plugin]');

    nodes.forEach(el => {
      const ns = el.getAttribute('data-plugin');
      const plugin = PLUGINS.find(p => p.namespace === ns);

      if (plugin) {
        plugin.onMount?.(el as HTMLElement, ctx);
        this.mounted.set(el as HTMLElement, plugin);
      }
    });
  }

  private unmountPlugins() {
    this.mounted.forEach((plugin, el) => {
      plugin.onUnmount?.(el);
    });
    this.mounted.clear();
  }
}
```

### What This Gives You

__✔ A deterministic, frame‑safe plugin lifecycle__
Plugins never mutate the DOM directly — they schedule work.

__✔ A clean mount/unmount model__
Perfect for navigation, hot reload, or dynamic content.

__✔ A contributor‑friendly plugin contract__
Anyone can write a plugin with minimal cognitive load.

__✔ A scalable architecture__
You can add 20 plugins without touching DocsViewer.

__✔ A future‑proof foundation__
You can add:

- plugin configuration
- plugin capabilities
- plugin versioning
- plugin discovery UI
- debug overlays

without changing the core model.

