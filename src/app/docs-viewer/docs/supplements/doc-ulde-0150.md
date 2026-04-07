# ULDE Project Skeleton

Below is the full project skeleton, followed by explanations, lifecycle mapping, and where your existing system plugs in.

## 1. Angular v21‑Correct ULDE Project Structure

Angular v21 uses:

- src/ at the root of the project
- app/ for application code
- feature libraries under src/app/... or via workspace libs
- standalone components by default (but you can still use templateUrl + styleUrls)
- Vite as the build tool
- flat, modular folder structure

Here is the ULDE‑aligned Angular‑correct structure:
```
ulde-docs/
├── src/
│   ├── app/
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   ├── app.scss
│   │   ├── pages/
│   │   │   ├── home/
│   │   │   └── docs/
│   │   └── ulde/
│   │       ├── core/
│   │       │   ├── content-engine/
│   │       │   │   └── content-engine.ts
│   │       │   ├── layout-engine/
│   │       │   │   └── layout-engine.ts
│   │       │   ├── interactive-engine/
│   │       │   │   └── interactive-engine.ts
│   │       │   └── ulde/
│   │       │       ├── ulde.ts
│   │       │       ├── ulde-context.ts
│   │       │       └── ulde.types.ts
│   │       │
│   │       ├── plugin-system/
│   │       │   ├── registry/
│   │       │   │   └── plugin-registry.ts
│   │       │   ├── hooks/
│   │       │   │   └── plugin-phases.ts
│   │       │   └── plugins/
│   │       │       └── heading-anchors/
│   │       │           └── heading-anchors.plugin.ts
│   │       │
│   │       ├── angular/
│   │       │   ├── ulde-layout-shell/
│   │       │   │   ├── ulde-layout-shell.ts
│   │       │   │   ├── ulde-layout-shell.html
│   │       │   │   └── ulde-layout-shell.scss
│   │       │   ├── ulde-viewer/
│   │       │   │   ├── ulde-viewer.ts
│   │       │   │   ├── ulde-viewer.html
│   │       │   │   └── ulde-viewer.scss
│   │       │   └── ulde.service.ts
│   │       │
│   │       └── utils/
│   │           ├── dom/
│   │           ├── timing/
│   │           │   └── timing.plugin.ts
│   │           └── logging/
│   │
│   ├── assets/
│   │    ├── docs/
│   │    │   ├── getting-started.md
│   │    │   └── index.md
│   │    └── images/
│   │
│   ├── index.html
...
│   └── styles.scss
...
├── README.md
...


```

## 2. Why this structure is correct for Angular v21

__✔ src/ at the root__
Angular always expects src/ at the project root.
Your app, assets, and global styles live here.

__✔ app/ contains the Angular application__
This is where:

- routing
- root component
- Angular integration for ULDE

live.

__✔ ULDE lives inside app/ulde/__
This keeps ULDE:

- modular
- self‑contained
- framework‑agnostic
- but still accessible to Angular

__✔ Your engines + plugin system are pure TypeScript__
They live under:
```
src/app/ulde/core/
src/app/ulde/plugin-system/
```

This keeps them framework‑independent.

__✔ Angular integration layer is separate__
Under:
```
src/app/ulde/angular/
```

This is where:

- ulde-viewer component
- ulde.service

live.

__✔ Your naming conventions are preserved__
You don’t use .component.ts  
So your Angular component is:
```
ulde-viewer.ts
ulde-viewer.html
ulde-viewer.scss
```

Angular v21 supports this perfectly.

## 3. Angular v21 + ULDE: How They Fit Together

__Angular handles:__

- routing
- rendering the ULDE viewer
- change detection (signals)
- hydration (if SSR later)

__ULDE handles:__

- content loading
- layout orchestration
- plugin lifecycle
- interactive demos
- instrumentation

__The boundary is clean:__
```
Angular → ULDE.render(path) → HTML output → Angular renders it
```

## 4. Angular Component (v21‑correct, templateUrl, custom naming)

__ulde-viewer.ts__
```ts
import { Component, signal } from '@angular/core';
import { ULDE } from '../core/ulde/ulde';

@Component({
  selector: 'ulde-viewer',
  templateUrl: './ulde-viewer.html',
  styleUrls: ['./ulde-viewer.scss'],
  standalone: true
})
export class ULDEViewer {
  html = signal<string>('');

  constructor(private ulde: ULDE) {}

  async load(path: string) {
    const result = await this.ulde.render(path);
    this.html.set(result.html);
  }
}
```

This is fully Angular v21‑correct.

# How the App works

Here’s exactly what will happen when you try‑run the project right now, with the scaffold exactly as we built it.

I’ll walk you through it like a dry‑run of the runtime lifecycle — so you know what to expect, what will render, and what errors (if any) you might see.

## 1. Angular boots successfully

Your main.ts + app.config.ts + AppComponent are all valid Angular v21 patterns.

So Angular will start normally and mount:
```
<app-root>
  <router-outlet>
    <ulde-viewer>
```
No DI errors, because:

Ulde is provided via { provide: Ulde, useClass: Ulde }

ULDEViewer injects it correctly

So DI is clean.

## 2. ULDEViewer loads and calls:
```ts
this.load('index.md');
```
This triggers:

```ts
const ctx = await this.ulde.render('index.md');
```

So ULDE begins its lifecycle.

## 3. ContentEngine tries to fetch:
```
/assets/docs/index.md
```

If you created:
```
src/assets/docs/index.md
```

Angular will serve it correctly.

If you did not create it, you’ll get:
```
GET /assets/docs/index.md 404
```

And ULDE will try to render an empty string.

So the first thing you’ll see is:

- If file exists → you see your markdown
- If file missing → you see a blank page

## 4. Plugins run

Two plugins are registered:

- HeadingAnchorsPlugin (post-content)
- TimingPlugin (instrumentation)

So you’ll see in the console:
```
[ULDE] Rendered index.md at 2026-04-06T...
```

And your headings will get IDs.

## 5. LayoutEngine wraps the HTML

Your markdown is not yet parsed into HTML — because we haven’t plugged in a markdown parser.

So right now:
```ts
ctx.raw = "# Welcome to ULDE Docs"
ctx.html = "# Welcome to ULDE Docs"
```

Then LayoutEngine wraps it:
```html
<article class="docs-article">
  # Welcome to ULDE Docs
</article>
```

So you will literally see the markdown text, not rendered HTML.

This is expected — we haven’t added a markdown parser yet.

## 6. ULDEViewer renders the HTML

Angular sets:
```ts
html.set(ctx.html);
```

And your viewer displays it via:
```html
<div [innerHTML]="html()"></div>
```

So the browser will show:
```
# Welcome to ULDE Docs
```
As plain text.

## Summary of What You’ll See

__✔ App boots
✔ ULDEViewer loads
✔ ULDE orchestrator runs
✔ Plugins run
✔ Console logs timing
✔ Markdown loads (if file exists)
✔ Markdown displays as plain text (no HTML parsing yet)

__❗You will NOT see formatted markdown__
Because we haven’t added a markdown parser like:

- marked
- markdown-it
- unified/remark

Yet.
