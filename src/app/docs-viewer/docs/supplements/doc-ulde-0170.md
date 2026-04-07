# Add Maredown Rendering

Once the layout is in place, we plug in a markdown parser.

You have three good choices:

Library	|Pros	|Notes 
--------|-----|------
marked	|Fast, simple	|Great default
markdown-it	|Plugin ecosystem	|Best extensibility
remark/unified	|Most powerful	|Heavier, async

Given your plugin‑extensible architecture, markdown-it is the best fit.

## 1. Install markdown-it
```
npm install markdown-it
```

## 2. Update ContentEngine to Render Markdown

__content-engine.ts__
```ts
import MarkdownIt from 'markdown-it';

export class ContentEngine {
  private md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });

  async load(path: string): Promise<string> {
    const response = await fetch(`/assets/docs/${path}`);
    return await response.text();
  }

  renderMarkdown(raw: string): string {
    return this.md.render(raw);
  }

  resolveLinks(html: string): string {
    return html; // keep for later
  }
}
```

## 3. Update ULDE Orchestrator to Use Markdown Rendering

__ulde.ts__

Replace:
```ts
ctx.html = this.content.resolveLinks(ctx.raw);
```

With:
```ts
ctx.html = this.content.renderMarkdown(ctx.raw);
ctx.html = this.content.resolveLinks(ctx.html);
```

## Result

Now when you run the app:

- arkdown renders as real HTML
- Headings get IDs
- Layout shell wraps everything
- Plugins still run
- ULDE lifecycle is intact
- Viewer is SSR‑safe
- You have a real documentation site

