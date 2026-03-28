RenderService API Reference (ID:doc10-app-0130)
=====================================
---
This document explains the public and internal APIs of the renderer.

1. Public API

>1. loadMarkdown():

>> The main entry point for the DocsViewer.
<div class="align-center7">

```typescript
  loadMarkdown(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }
```
</div>

>2. renderMarkdown()

>> Converts raw Markdown into HTML synchronously, starts async enhancements, and then ends when all enhancements are complete.
<div class="align-center7">

```typescript
async renderMarkdownToDOM(
    markdown: string,
    filetype: string | undefined,
    viewer: HTMLElement,
    isDarkMode: boolean
  ): Promise<void> {

    // 1. Markdown -> html
    const html = this.marked?.parse(markdown) as string;
    viewer.innerHTML = html;
    
    // 2. Sanitize text nodes (replace non-breaking spaces)
    sanitizeNodeText(viewer);
    if (filetype !== "ts") {
      // 3. Katex: Render math expressions
      this.katexService.renderMath(viewer);

      // 4. Apply Mermaid theme
      this.mermaidService.applyMermaidTheme(isDarkMode);

      // 5. Wait for DOM + CSS + fonts + transitions
      await this.waitForViewerToSettle(viewer);;

      // 6. Mermaid: Render diagrams and charts
      await this.mermaidService.renderMermaidBlocks(viewer);
    }

    // 7. Wait again for Mermaid’s own layout changes
    await this.waitForViewerToSettle(viewer);

    // force layout flush
    viewer.getBoundingClientRect();
  }
```
</div>

2. Internal Enhancement Pipeline
These methods run automatically inside renderMarkdown() and are not called by the viewer.

private runMermaid(): Promise<void>
Renders Mermaid diagrams and injects SVGs into the DOM.

Mutates layout

Must complete before enhancementComplete$ fires

Often the slowest enhancement

private runKatex(): Promise<void>
Renders inline and block math expressions.

Replaces math nodes

Affects line height and layout

private runSyntaxHighlighting(): Promise<void>
Applies syntax highlighting to code blocks.

Uses microtasks internally

Can cause small layout shifts

private patchTablesForTheme(): Promise<void>
Applies theme-aware classes and fixes table rendering issues.

Ensures consistent dark/light mode behavior

Fixes first-load wrapping issues

3. Enhancement Aggregation
All enhancement tasks are combined into a single completion signal.

private runAllEnhancements(): Promise<void>
Coordinates all async tasks.

Implementation pattern
ts
const tasks = [
  this.runMermaid(),
  this.runKatex(),
  this.runSyntaxHighlighting(),
  this.patchTablesForTheme()
];

return Promise.all(tasks).then(() => {
  queueMicrotask(() => this.enhancementComplete$.next());
});
Why microtask flushing?
Ensures syntax highlighter microtasks finish

Prevents late layout shifts

Guarantees stable DOM before viewer scroll logic

4. Enhancement Completion Observable
enhancementComplete$: Subject<void>
A subject that emits once per render cycle when all enhancements are complete and the DOM is stable.

Characteristics
Fires after all enhancements

Fires after microtasks settle

Viewer must subscribe with take(1)

Viewer must not run scroll logic before this

Example
ts
result.enhancementComplete$
  .pipe(take(1))
  .subscribe(() => this.restoreScrollPosition());
5. Renderer Responsibilities Summary
Owns enhancement timing

Ensures layout stability before viewer scroll logic

Aggregates async tasks into a single signal

Provides HTML immediately but guarantees nothing about layout until enhancements finish

Must include any new enhancement in the pipeline

6. Contributor Notes
If you add a new enhancement:
Implement it as a Promise-returning method

Add it to runAllEnhancements()

Ensure it completes before enhancementComplete$ fires

Test scroll restoration and anchor navigation

If you modify existing enhancements:
Maintain async behavior

Do not emit completion early

Ensure DOM mutations finish before microtask flush

---
[<- previous: DocsViewer API Reference][previous-link] &ensp; &ensp; &ensp; [next: Browser Refresh Recovery Diagram ->][next-link]
