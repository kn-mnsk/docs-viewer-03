# Add a Real Layout Shell (Sidebar, Header, TOC, Content Area)
This step gives you the visual structure of a documentation site, even before markdown is rendered.

We’ll introduce:

- a layout engine that wraps ULDE output in a real shell
- a layout component in Angular (optional but recommended)
- a layout stylesheet
- a TOC placeholder
- a sidebar placeholder
- a header

This keeps ULDE framework‑agnostic while Angular handles the chrome.

## 1. Add a Layout Shell Component (Angular)

This is the outer frame of your docs site.

__src/app/ulde/angular/layout-shell/layout-shell.ts__
```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ulde-layout-shell',
  templateUrl: './layout-shell.html',
  styleUrls: ['./layout-shell.scss'],
  standalone: true
})
export class UldeLayoutShell {
  @Input() html: string = '';
}
```

__src/app/ulde/angular/layout-shell/layout-shell.html__
```html
<div class="layout">
  <aside class="sidebar">
    <h2>Docs</h2>
    <nav>
      <a routerLink="/">Home</a>
      <a routerLink="/getting-started">Getting Started</a>
    </nav>
  </aside>

  <main class="content">
    <header class="header">
      <h1>ULDE Documentation</h1>
    </header>

    <article class="doc-body" [innerHTML]="html"></article>
  </main>
</div>
```

__src/app/ulde/angular/layout-shell/layout-shell.scss__
```scss
.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 260px;
  background: #1e1e1e;
  color: white;
  padding: 1.5rem;
}

.sidebar a {
  display: block;
  color: #ccc;
  margin: 0.5rem 0;
  text-decoration: none;
}

.sidebar a:hover {
  color: white;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}

.header {
  border-bottom: 1px solid #ddd;
  margin-bottom: 1.5rem;
}

.doc-body {
  line-height: 1.6;
}
```

## 2. Update UldeViewer to Use the Layout Shell

__ulde-viewer.html__
Replace:
```html
<div class="ulde-container" [innerHTML]="html()"></div>
```

With:
```html
<ulde-layout-shell [html]="html()"></ulde-layout-shell>
```

And import the component:
__ulde-viewer.ts__
```ts
import { UldeLayoutShell } from '../layout-shell/layout-shell';

@Component({
  ...
  imports: [UldeLayoutShell]
})
export class UldeViewer { ... }
```

Now ULDEViewer renders inside a real documentation layout.

## 3. Update LayoutEngine to Output Only the Inner HTML

Right now LayoutEngine wraps the content in &lt;article>.
But Angular’s layout shell already does that.

So simplify LayoutEngine:

__layout-engine.ts__
```ts
export class LayoutEngine {
  renderShell(html: string): string {
    return html; // let Angular handle the chrome
  }
}
```

This keeps ULDE clean and framework‑agnostic.

## Result After Adding the Above

When you run the app now, you’ll see:

- a sidebar
- a header
- a content area
- your markdown (still plain text) inside the layout
- plugin timing logs
- heading anchors (IDs)
- SSR‑safe viewer

This is a real documentation site skeleton.
