# Contributor Lifecycle Checklist (ID:doc30-guide-0300)

docs-viewer + mark-render.service
(Markdown, repo‑ready, onboarding‑friendly)

This checklist gives contributors a precise, step‑by‑step guide for working safely within the async Markdown rendering pipeline. It prevents timing bugs, misplaced effects, and DOM‑mutation surprises.

✔️ Contributor Lifecycle Checklist
1. When modifying docs-viewer
Do
Wait for enhancementComplete$ before running:

scroll restoration

anchor navigation

layout-sensitive transitions

Inject HTML immediately after calling renderMarkdown().

Use take(1) when subscribing to enhancementComplete$.

Keep viewer logic layout‑agnostic until enhancements finish.

Do NOT
Run scroll logic on HTML injection

Use container-ready events as layout-ready signals

Trigger enhancements from the viewer

Assume Mermaid/KaTeX are synchronous

2. When modifying mark-render.service
Do
Treat all enhancements as async

Emit enhancementComplete$ only after all enhancers finish

Include new enhancers in the pipeline

Use microtask flushing when needed

Keep renderer responsible for enhancement timing

Do NOT
Expose partial enhancement states to the viewer

Emit completion before DOM mutations settle

Let enhancements leak into viewer code

3. When adding a new enhancement (Mermaid-like, KaTeX-like, etc.)
Required steps
Implement enhancement inside the renderer

Ensure it returns a Promise or observable

Add it to the enhancement aggregation pipeline

Verify it mutates DOM before completion fires

Test scroll restoration and anchor navigation

Forbidden
Running enhancements in the viewer

Triggering enhancements on container-ready events

Emitting completion early

4. When debugging timing issues
Check these first
Did scroll restoration run before enhancements?

Did Mermaid finish after KaTeX?

Did syntax highlighting queue microtasks?

Did table patching change layout height?

Did the viewer subscribe to enhancementComplete$?

Common symptoms
Scroll jumps

Anchor offsets incorrect

First-load wrapping bug

Mermaid diagrams appear late

Code blocks resize after load

5. Golden Rules (memorize these)
HTML ready ≠ layout ready

Enhancements mutate the DOM

Only the renderer knows when layout is stable

Viewer must wait for enhancementComplete$

Scroll logic must run last

6. Quick Reference Code Snippets

Viewer pattern (correct)
```ts
const result = this.renderer.renderMarkdown(markdown);

this.markdownContainer.nativeElement.innerHTML = result.html;

result.enhancementComplete$
  .pipe(take(1))
  .subscribe(() => {
    this.restoreScrollPosition();
    this.navigateToAnchorIfPresent();
  });
```
Renderer pattern (correct)
```ts
const enhancementTasks = [
  this.runMermaid(),
  this.runKatex(),
  this.runSyntaxHighlighting(),
  this.patchTablesForTheme()
];

Promise.all(enhancementTasks).then(() => {
  queueMicrotask(() => this.enhancementComplete$.next());
});
```
7. What this checklist guarantees
Stable layout

Correct scroll restoration

Accurate anchor navigation

Predictable enhancement timing

Contributor-friendly architecture
