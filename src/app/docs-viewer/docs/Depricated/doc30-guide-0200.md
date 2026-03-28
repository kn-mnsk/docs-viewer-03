# Contributor Onboarding Quickstart (ID:doc30-guide-0200)

## docs-viewer • mark-render.service • Enhancers
Welcome!
This is your quick, no‑nonsense introduction to how the documentation rendering system works and where your code should go.
You can read this in under a minute and start contributing confidently.

## 🧩 The System in 10 Seconds
The docs viewer works in four phases:

Parse Markdown → renderer

Inject HTML → viewer

Run async enhancements → Mermaid, KaTeX, HLJS, tables

Restore scroll + anchors → viewer

Everything you do will fit into one of these phases.

## 🧠 The Golden Rule
HTML ready ≠ layout ready.  
Enhancements mutate the DOM.
Only run scroll/anchor logic after enhancementComplete$.

This rule prevents 90% of lifecycle bugs.

## 🧭 Where Things Go (Super Short Version)
| Task                   | Goes Where                               |
|------------------------|-------------------------------------------|
| Parse Markdown         | mark-render.service.ts                    |
| Run Mermaid            | markdown-enhancers/mermaid.ts             |
| Run KaTeX              | markdown-enhancers/katex.ts               |
| Highlight code         | markdown-enhancers/syntax-highlighting.ts |
| Patch tables           | markdown-enhancers/table-patching.ts      |
| Aggregate enhancements | mark-render.service.ts                    |
| Inject HTML            | docs-viewer.component.ts                  |
| Restore scroll         | docs-viewer.component.ts                  |
| Anchor navigation      | docs-viewer.component.ts                  |
| Load files             | file.service.ts                           |
| Theme logic            | theme.service.ts                          |
| Documentation          | guides/, state/, ADRs/                    |


## 🔄 The Lifecycle (Mental Model)
```mermaid
flowchart LR
    A"[renderMarkdown()"] --> B[HTML returned]
    B --> C[HTML injected]
    C --> D[Async enhancements]
    D --> E[enhancementComplete$]
    E --> F[Scroll + anchors]
```
If you remember this diagram, you understand the system.

## 🛠️ The Two Most Important APIs
1. renderMarkdown(markdown)
Returns:

```ts
{ html, enhancementComplete$ }
```
2. enhancementComplete$
Subscribe to this before running anything layout-sensitive.

## 🚫 Common Mistakes to Avoid
Running scroll logic before enhancements finish

Assuming Mermaid/KaTeX are synchronous

Putting enhancement logic in the viewer

Putting viewer logic in the renderer

Forgetting microtask timing (renderer handles this for you)

## 🎯 Your First Contribution Checklist
Before submitting a PR, verify:

[ ] Did I put code in the correct module?

[ ] Did I avoid mixing viewer and renderer responsibilities?

[ ] Did I wait for enhancementComplete$ before layout logic?

[ ] Did I avoid triggering enhancements from the viewer?

[ ] Did I test with Mermaid, KaTeX, and long code blocks?

If all boxes are checked, your contribution is aligned with the architecture.

## 🏁 You’re Ready
You now understand:

The pipeline

The responsibilities

The lifecycle

The module boundaries

The common pitfalls

You’re fully equipped to contribute effectively.

