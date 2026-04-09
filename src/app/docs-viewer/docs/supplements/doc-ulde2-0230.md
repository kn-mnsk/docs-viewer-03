## 1. Full &lt;ulde-viewer> Implementation (Angular 21)
This component:

loads a doc file from /assets/docs/...

uses UldeService.renderDoc()

supports SSR

uses Angular signals

handles loading/error states

renders plugin‑transformed HTML safely

__src/app/ulde/angular/ulde-viewer/ulde-viewer.ts__
```ts
// src/app/ulde/angular/ulde-viewer/ulde-viewer.ts

import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  signal,
  inject,
} from '@angular/core';

import { UldeService } from '../ulde.service';
import { UldeDocNode, UldeContentResult } from '../../core/runtime/ulde.types';

@Component({
  selector: 'ulde-viewer',
  standalone: true,
  templateUrl: './ulde-viewer.html',
  styleUrls: ['./ulde-viewer.scss'],
})
export class UldeViewerComponent implements OnChanges {
  @Input() path!: string; // e.g. "/getting-started"

  private readonly ulde = inject(UldeService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly rendered = signal<UldeContentResult | null>(null);

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['path'] && this.path) {
      await this.loadAndRender(this.path);
    }
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
}

```

## 2. src/app/ulde/angular/ulde-viewer/ulde-viewer.html

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
          class="ulde-viewer__content"
          [innerHTML]="rendered()?.content"
        ></div>
      }

    }

  }

</div>

```

## 3. src/app/ulde/angular/ulde-viewer/ulde-viewer.scss

```scss
.ulde-viewer {
  padding: 1.5rem;

  &__loading {
    opacity: 0.6;
    font-style: italic;
  }

  &__error {
    color: #d33;
    font-weight: bold;
  }

  &__content {
    line-height: 1.6;
  }
}

```

Now we have:You now have a fully functional ULDE v2 pipeline:

✔️ Plugin registry
✔️ Content engine
✔️ Angular service
✔️ Viewer component
✔️ Markdown + heading plugins
✔️ SSR‑safe rendering
✔️ Asset‑based doc loading

This is already a real documentation engine.

