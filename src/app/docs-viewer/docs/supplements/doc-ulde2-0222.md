## 1. Wire ContentEngine into UldeService

Your current UldeService calls the registry directly.
Now we introduce the ContentEngine so the service becomes:

- the Angular integration layer
- the orchestrator for content loading + plugin pipelines
- the single entry point for &lt;ulde-viewer>

__Updated src/app/ulde/angular/ulde.service.ts__
```ts
// src/app/ulde/angular/ulde.service.ts

import { Injectable, inject, Injector } from '@angular/core';
import { createUldePluginRegistry } from '../plugin-system/registry/plugin-registry';

import {
  UldePluginRegistry,
  UldePlugin,
  UldeDocNode,
  UldeContentResult,
} from '../core/runtime/ulde.types';

import { ContentEngine } from '../core/content-engine/content-engine';

// Built‑in plugins
import { HeadingAnchorsPlugin } from '../plugin-system/plugins/heading-anchors/heading-anchors.plugin';
import { MarkdownPlugin } from '../plugin-system/plugins/markdown/markdown.plugin';

@Injectable({ providedIn: 'root' })
export class UldeService {
  private readonly injector = inject(Injector);

  private readonly registry: UldePluginRegistry;
  private readonly contentEngine: ContentEngine;

  constructor() {
    // 1. Create registry
    this.registry = createUldePluginRegistry({
      globalConfig: {
        markdown: { enableGfm: true },
      },
    });

    // 2. Create content engine
    this.contentEngine = new ContentEngine(this.registry);

    // 3. Register built‑in plugins
    this.registerBuiltInPlugins();
  }

  // ---------------------------------------------
  // Plugin Registration
  // ---------------------------------------------

  private async registerBuiltInPlugins() {
    await this.registerPlugin(MarkdownPlugin);
    await this.registerPlugin(HeadingAnchorsPlugin);
  }

  async registerPlugin(plugin: UldePlugin) {
    return this.registry.register(plugin);
  }

  listPlugins() {
    return this.registry.listPlugins();
  }

  // ---------------------------------------------
  // Rendering API (used by <ulde-viewer>)
  // ---------------------------------------------

  async renderDoc(doc: UldeDocNode): Promise<UldeContentResult> {
    return this.contentEngine.renderDoc(doc);
  }

  async renderFromSource(source: {
    id: string;
    path: string;
    title?: string;
    format: UldeDocNode['format'];
    rawContent: string;
    metadata?: Record<string, unknown>;
  }): Promise<UldeContentResult> {
    return this.contentEngine.renderFromSource(source);
  }

  // ---------------------------------------------
  // Advanced access
  // ---------------------------------------------

  getRegistry(): UldePluginRegistry {
    return this.registry;
  }
}

```
This is now a clean, layered architecture:

- Angular → UldeService
- UldeService → ContentEngine
- ContentEngine → plugin registry
- plugin registry → plugin pipeline

Exactly what ULDE v2 should be.
