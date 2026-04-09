# DOM Plugin API + Debug Overlay

This is where ULDE becomes powerful:

- onDomInit
- onDomUpdate
- onDomDestroy
- DOM budget enforcement
- Overlay injection
- Diagnostics UI
- &lt;ulde-debug-overlay> component

Three main pieces are added:

1. DOM budget + helpers (utils/dom/)
2. DOM plugin host service (angular/ulde-dom-host.service.ts)
3. Debug overlay component (angular/ulde-debug-overlay/)
4. Light wiring into &lt;ulde-viewer>

## 1. DOM budget helper

__src/app/ulde/utils/dom/dom-budget.ts__
```ts
// src/app/ulde/utils/dom/dom-budget.ts

import { UldeDomBudget } from '../../core/runtime/ulde.types';

export class DomBudgetTracker {
  private listeners = 0;
  private intervals = 0;
  private timeouts = 0;

  constructor(private readonly budget: UldeDomBudget) {}

  canAddListener(): boolean {
    return this.listeners < this.budget.maxListeners;
  }

  addedListener(): void {
    this.listeners++;
  }

  canAddInterval(): boolean {
    return this.intervals < this.budget.maxIntervals;
  }

  addedInterval(): void {
    this.intervals++;
  }

  canAddTimeout(): boolean {
    return this.timeouts < this.budget.maxTimeouts;
  }

  addedTimeout(): void {
    this.timeouts++;
  }
}

```
You can later wrap addEventListener, setInterval, etc., with this tracker if you want strict enforcement.

## 2. DOM plugin host service

This service owns:

- DOM plugins
- their lifecycle (onDomInit, onDomUpdate, onDomDestroy)
- diagnostics
- overlay registry

__src/app/ulde/angular/ulde-dom-host.service.ts__
```ts
// src/app/ulde/angular/ulde-dom-host.service.ts

import { Injectable, Injector, signal } from '@angular/core';
import {
  UldeDomPlugin,
  UldeDomPluginContext,
  UldeDomBudget,
  UldeDiagnostic,
} from '../core/runtime/ulde.types';

@Injectable({ providedIn: 'root' })
export class UldeDomHostService {
  private rootElement: HTMLElement | null = null;
  private injector: Injector | null = null;

  private readonly domBudget: UldeDomBudget = {
    maxListeners: 100,
    maxIntervals: 10,
    maxTimeouts: 20,
  };

  private readonly overlays = new Map<string, HTMLElement>();
  private readonly plugins: UldeDomPlugin[] = [];

  readonly diagnostics = signal<UldeDiagnostic[]>([]);

  registerDomPlugin(plugin: UldeDomPlugin) {
    this.plugins.push(plugin);
  }

  attach(rootElement: HTMLElement, injector: Injector) {
    this.rootElement = rootElement;
    this.injector = injector;
    this.runHook('onDomInit');
  }

  update() {
    this.runHook('onDomUpdate');
  }

  detach() {
    this.runHook('onDomDestroy');
    this.rootElement = null;
    this.injector = null;
    this.overlays.clear();
    this.diagnostics.set([]);
  }

  private createContext(pluginId: string): UldeDomPluginContext {
    if (!this.rootElement) {
      throw new Error('UldeDomHostService: rootElement not attached');
    }

    return {
      pluginId,
      rootElement: this.rootElement,
      injector: this.injector ?? undefined,
      budget: this.domBudget,
      reportDiagnostic: (diag: UldeDiagnostic) => {
        this.diagnostics.update((prev) => [...prev, diag]);
      },
      registerOverlay: (id: string, element: HTMLElement) => {
        this.overlays.set(id, element);
      },
      unregisterOverlay: (id: string) => {
        this.overlays.delete(id);
      },
    };
  }

  private async runHook(hook: 'onDomInit' | 'onDomUpdate' | 'onDomDestroy') {
    if (!this.rootElement) return;

    for (const plugin of this.plugins) {
      const fn = plugin[hook];
      if (!fn) continue;

      const ctx = this.createContext(plugin.meta.id);
      try {
        await fn.call(plugin, ctx);
      } catch (e) {
        this.diagnostics.update((prev) => [
          ...prev,
          {
            pluginId: plugin.meta.id,
            level: 'error',
            message: `${hook} failed`,
          },
        ]);
      }
    }
  }
}

```
You can later register DOM plugins here (e.g. scroll spy, link highlighter, etc.).

## 3. Debug overlay component

This reads diagnostics from UldeDomHostService and renders them.

__src/app/ulde/angular/ulde-debug-overlay/ulde-debug-overlay.ts__
```ts
// src/app/ulde/angular/ulde-debug-overlay/ulde-debug-overlay.ts
import { Component, inject, computed } from '@angular/core';
import { UldeDomHostService } from '../ulde-dom-host.service';

@Component({
  selector: 'app-ulde-debug-overlay',
  imports: [],
  templateUrl: './ulde-debug-overlay.html',
  styleUrl: './ulde-debug-overlay.scss',
})
export class UldeDebugOverlay {
  private readonly domHost = inject(UldeDomHostService);

  readonly diagnostics = computed(() => this.domHost.diagnostics());
}

```

__src/app/ulde/angular/ulde-debug-overlay/ulde-debug-overlay.html__
```html
@if (diagnostics().length > 0) {
  <div class="ulde-debug-overlay">
    <h4 class="ulde-debug-overlay__title">ULDE Diagnostics</h4>

    <ul class="ulde-debug-overlay__list">
      @for (d of diagnostics(); track d) {
        <li class="ulde-debug-overlay__item ulde-debug-overlay__item--{{ d.level }}">
          <span class="ulde-debug-overlay__plugin">{{ d.pluginId }}</span>
          <span class="ulde-debug-overlay__message">{{ d.message }}</span>
        </li>
      }
    </ul>
  </div>
}

```

__src/app/ulde/angular/ulde-debug-overlay/ulde-debug-overlay.scss__
```scss
.ulde-debug-overlay {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  max-width: 320px;
  max-height: 40vh;
  overflow: auto;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.85);
  color: #f5f5f5;
  font-size: 0.8rem;
  border-radius: 4px;
  z-index: 9999;

  &__title {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;

    &--info {
      color: #9fd3ff;
    }

    &--warning {
      color: #ffd27f;
    }

    &--error {
      color: #ff9f9f;
    }
  }

  &__plugin {
    font-weight: 600;
  }

  &__message {
    flex: 1;
  }
}

```

## 4. Wire DOM host + overlay into &lt;ulde-viewer>

We need:

- a reference to the rendered content root
- to attach/detach the DOM host
- to include the debug overlay in the template

__Updated src/app/ulde/angular/ulde-viewer/ulde-viewer.ts__
```ts
// src/app/ulde/angular/ulde-viewer/ulde-viewer.ts

import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { UldeService } from '../ulde.service';
import { UldeDomHostService } from '../ulde-dom-host.service';
import { UldeDocNode, UldeContentResult } from '../../core/runtime/ulde.types';

@Component({
  selector: 'ulde-viewer',
  standalone: true,
  templateUrl: './ulde-viewer.html',
  styleUrls: ['./ulde-viewer.scss'],
})
export class UldeViewerComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() path!: string;

  @ViewChild('contentRoot', { static: false })
  contentRoot?: ElementRef<HTMLElement>;

  private readonly ulde = inject(UldeService);
  private readonly domHost = inject(UldeDomHostService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rendered = signal<UldeContentResult | null>(null);

  private viewInitialized = false;

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['path'] && this.path) {
      await this.loadAndRender(this.path);
    }
  }

  ngAfterViewInit() {
    this.viewInitialized = true;
    this.attachDomHostIfReady();
  }

  ngOnDestroy() {
    this.domHost.detach();
  }

  private async loadAndRender(path: string) {
    this.loading.set(true);
    this.error.set(null);

    try {
      const raw = await this.fetchDoc(path);

      const result = await this.ulde.renderFromSource({
        id: path,
        path,
        format: 'markdown',
        rawContent: raw,
      });

      this.rendered.set(result);

      if (this.viewInitialized) {
        this.attachDomHostIfReady();
        this.domHost.update();
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to load document');
    } finally {
      this.loading.set(false);
    }
  }

  private async fetchDoc(path: string): Promise<string> {
    const url = `/assets/docs${path}.md`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Document not found: ${url}`);
    }

    return res.text();
  }

  private attachDomHostIfReady() {
    if (!this.contentRoot?.nativeElement) return;
    this.domHost.attach(this.contentRoot.nativeElement, inject(ElementRef).injector as any);
  }
}

```
Note: if inject(ElementRef).injector feels awkward, you can instead pass the component’s injector via constructor injection and store it.

__Updated src/app/ulde/angular/ulde-viewer/ulde-viewer.html__
```html
<div class="ulde-viewer">

  @if (loading()) {
    <div class="ulde-viewer__loading">
      Loading…
    </div>
  } @else {

    @if (error()) {
      <div class="ulde-viewer__error">
        {{ error() }}
      </div>
    } @else {

      @if (rendered()) {
        <div
          #contentRoot
          class="ulde-viewer__content"
          [innerHTML]="rendered()?.content"
        ></div>

        <ulde-debug-overlay />
      }

    }

  }

</div>

```
Make sure to import UldeDebugOverlayComponent into the UldeViewerComponent imports array if you later convert it to a module‑style declaration; as a standalone component, you can also add imports: [UldeDebugOverlayComponent] in the @Component metadata if needed.
