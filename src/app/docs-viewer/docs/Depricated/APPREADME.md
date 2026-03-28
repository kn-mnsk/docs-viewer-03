<!-- <div style="page-break-before: always;"></div> -->
# Application README (ID: APPREADME)
This document is the master reference for the entire documentation rendering system. It explains how Markdown is parsed, enhanced, displayed, and synchronized with user navigation. Tt also includes renderings by  Mermaid and KaTeX.
---
## 1. Overview
The documentation system is composed of three tightly coordinated modules:
1. App (app.ts) - displays main screen, which is currently blank
    - Detects refresh
    - Restores state
    - Controls visibility
    - Does NOT manage docId or scrollPos

2. DocsViewer (docs-viewer.ts) — displays rendered documentation, manages scroll restoration, anchor navigation, and UX polish. The DocsViewer is created via the DocsViewerDirective (docs-viewer.directive.ts)
    - Owns docId
    - Owns scrollPos
    - Writes both into sessionState
    - Restores scroll after rendering

3. MarkrenderService (mark-render.service.ts) — parses Markdown, applies transforms, runs async enhancements, and signals when layout is stable. The modeule uses KatexService(katex.service) and MermaidService(mermaid.service.ts) to render Latex and Mermaid graphs.

These modules work together through the following async pipeline:
  - Markdown parse (sync)
  - Katex and Mermaid renderings
  - HTML injection (sync)
  - Async enhancements (async)
  - Layout-sensitive viewer logic (async after completion)

This pipeline ensures:
  - Stable layout
  - Correct scroll restoration
  - Accurate anchor navigation
  - Smooth UX

3. Other importnat modules
  - docs-meta.ts - meta infomation for reference to markdown files, etc.
  - docs-viewer.utls.ts 
    - Owns persistence
    - SSR‑safe
    - Hydration‑safe
    - Centralized
    - Predictable
    - SessionState helpers

Here’s the lifecycle this system now follows:

1. App toggles visibility → writes component
2. DocsViewer updates docId → writes to sessionState
3. DocsViewer updates scrollPos → writes to sessionState
4. Before unload → App writes refreshed = true
5. After refresh → App reads sessionState
6. If DocsViewer was active → restore doc + scroll
7. If App was active → show App screen
8. DocsViewer loads markdown → restores scroll
9. Everything feels seamless

## 2. System Architecture

### architecture diagram that includes:
  - App
  - DocsViewer
  - ScrollService
  - docs-viewer.utils
  - sessionState
  - SSR + hydration lifecycle


```mermaid
---
title: "App + DocsViewer + SessionState + SSR/Hydration"
config:
  flowchart:
    curve: bumpY
---
%% curve stye: basis, bumpX, bumpY, cardinal, catmullRom, linear, monotoneX, monotoneY, natural, step, stepAfter, and stepBefore.
flowchart TD 
    %% ============================
    %%  GROUPS
    %% ============================
    
    subgraph SSR["SSR (Server Render)"]
      SSR-Render["Render App HTM<br>(no DOM/localStorage)"]
    end

    subgraph HYD["Hydration Engine"]
      HYD-Attach["Attach to existing DOM"]
      HYD-RunInit["Run component init hooks"]
    end

    subgraph APP["App Component"]
      direction TB
      App-Init["Browser Init<br>(isPlatformBrowser)"]
      App-Listeners["Set Renderer2 Listeners"]
      App-Restore["restoreFromSessionState()"]
    end

    subgraph DVD["DocsViewer Directive"]
      direction TB
      DVD-Effect["effectWrapper(docId)"]
      DVD-Import["Import DocsViewer"]
      DVD-Update["Update DocsViewer"]
    end

    subgraph DV["DocsViewer Component"]
      direction TB
      DV-Effect["effectWrapper()"]
      subgraph DV-LOAD["loadAndRenderMarkdown()"]
        DV-Load["loadMarkdown()"]
        DV-Render["renderMarkdownToDOM()"]
        DV-Link["Internal Links &<br> OnClick Handling "]
        DV-Scroll["OnScroll Handling "]
        DV-Restore["Restore Scroll After Rendering"]
      end
    end

    subgraph Enhancers["Markdown Enhancers"]
      direction TB
      Docs-Registry["DocsRegistry Service"]
      subgraph Mark["MarkRender Service"]
        MD-Load["Load Raw Markdown file"]
        Marked["Marked"]
        Katex["Katex Service"]
        Mermaid["Mermaid Service"]
      end 
      subgraph SCROLL["ScrollService"]
        Scroll-Get["getPosition()"]
        Scroll-Set["setPosition()"]
        Scroll-Restore["scrollTo<br>ElementInViewer()"]
      end
    end

    %% Document Repository
    DocsRepo["Raw Markdown Repository"]
    

    %% Session State
    subgraph SS["Session State Manager"]
      direction TB
      SS-Read["readSessionState()"]
      SS-Write["writeSessionState()"]
      SS-Clear["clearSessionState()"]
    end

    %% Listeners
    subgraph LISTENERS-App["Render2 Listeners"]
      direction TB
      ListenersApp-keydown["keydown 'Ctrl+C'<br>(isVisible: false ⇆ true)"]
      ListenersApp-beforeunload["beforeunload <br>'Browser Refresh'"]
    end

    subgraph LISTENERS-DV["AddEvent Listeners"]
      direction TB
      ListenersDV-OnClick["OnClcik for Linkage: <br> docId and inlineId"]
      ListenersDV-OnScroll["OnScroll for Docs Viewer"]
    end

    %%  Local Storage
    subgraph STORAGE["localStorage"]
      direction TB
      LS-Storage["sessionState JSON"]
      %% Includes component, docId, scrollPos, refreshed
    end

    %% ============================
    %%  FLOWS 
    %% ============================

    SSR-Render --> HYD-Attach
    HYD-Attach --> HYD-RunInit
    HYD-RunInit --> App-Init

    %% App
    App-Init ~~~ App-Restore
    App-Init --> App-Listeners
    SS-Read --> App-Init
    App-Restore -->|docId| DVD-Effect
    App-Listeners --> ListenersApp-keydown
    App-Listeners --> ListenersApp-beforeunload
  
    %% Session State
    SS-Read ~~~ SS-Write ~~~ SS-Clear
    STORAGE --> SS-Read
    SS-Write --> STORAGE
    SS-Clear --> STORAGE
    %% App-Restore -->|App active| App-Visible

    %% DVD - DocsViewerDirective
    DVD-Effect --> |DocsViewer new| DVD-Import
    DVD-Effect --> |DocsViewer active| DVD-Update
    DVD-Import -->|docId| DV-Effect
    DVD-Update -->|docId| DV-Effect

    %% DV - DocsViewer
    DV-Load ~~~ DV-Render ~~~ DV-Link ~~~ DV-Scroll ~~~ DV-Restore
    DV-Effect -->|docId| DV-LOAD
    DV-Effect --> SS-Write
    DV-Effect --> Scroll-Set
    DV-Render --> Mark
    DV-Render <--> Docs-Registry
    DV-Link --> ListenersDV-OnClick
    DV-Scroll --> ListenersDV-OnScroll
    Scroll-Get --> DV-Restore

    %% Markdown Enhancers
    Docs-Registry ~~~ Mark
    MD-Load --> Marked --> Katex --> Mermaid
    Mark ~~~ SCROLL
    DocsRepo --> MD-Load

    %% Scroll Service
    Scroll-Get ~~~ Scroll-Set ~~~ Scroll-Restore
    DV-Scroll --> Scroll-Set
    Scroll-Set --> SS-Write

    %% Listeners
    ListenersApp-keydown ~~~ ListenersApp-beforeunload
    ListenersApp-keydown --> |isVisibleTrue dopcId| DVD-Effect
    ListenersApp-keydown -->|isVisible=False| App-Init
    ListenersApp-beforeunload --> App-Restore

    ListenersDV-OnClick ~~~ ListenersDV-OnScroll
    ListenersDV-OnClick -->|docId| DV-Effect
    ListenersDV-OnClick -->|inlineId| Scroll-Restore

    ListenersDV-OnScroll --> Scroll-Set
    ListenersDV-OnScroll --> SS-Write

```
<div class="align-center">
<strong>What This Diagram Shows:</strong>

  1. SSR → Hydration → Browser Init 
      - SSR renders HTML with no DOM access
      - Hydration attaches Angular to the existing DOM
      - App detects browser environment and initializes listeners

  2. App owns refresh detection 
      - Render2 Listeners Setting - 'click', 'beforeunload'
        - click navigates to two internal links of docId and inlineId 
        - beforeunload sets refreshed = true
      - restoreFromSessionState() decides what to show on reload

  3. DocsViewer owns docId & inlineId + scrollPos 
      - AddEvent Listeners Setting - 'scroll'
      - Reactive effect loads markdown
        - render markdwon to html through 'Marked', 'Katex', and 'Mermaid
      - Scroll events update sessionState
      - Internal navigation updates seesionState

  4. ScrollService owns scroll persistence
      - Saves scrollPos
      - Restores scroll after markdown render

  5. session-state.manager.ts is the centralized layer
      - States are:
        - component
        - docId
        - scrollPos
        - refreshed

  6. localStorage is the single source of truth
      - No scattered keys
      - No hydration surprises
      - No race conditions

</div>



### 🔄 [Render API Refernce](#docId:app0040)

```mermaid
flowchart TB

    A[Navigate to doc] --> B[Load Markdown]
    B --> C["renderMarkdown()"]
    C --> D[HTML returned]
    D --> E[Inject HTML into markdownContainer]

    E --> F[DOM live but NOT stable]

    F --> G["Async enhancements<br/>Mermaid, KaTeX, HLJS, tables"]
    G --> H[Microtask flush]

    H --> I[enhancementComplete$ fires]

    I --> J["restoreScrollPosition()"]
    I --> K["navigateToAnchorIfPresent()"]
    I --> L[UX polish]

    L --> M[Layout stable]
```

### 🧠 [Renderer State Machine](#docId:state0010)
```mermaid
stateDiagram-v2
    [*] --> PARSING
    PARSING --> HTML_READY
    HTML_READY --> ENHANCING
    ENHANCING --> MICROTASK_FLUSH
    MICROTASK_FLUSH --> STABLE
    STABLE --> [*]
```
### 🛠️ [API References](#docId:guides0030)
docs-viewer.component
Public Methods
loadDocument(path: string)

restoreScrollPosition()

navigateToAnchorIfPresent()

Internal Helpers
saveScrollPosition()

scrollTo(y: number)

scrollToAnchor(id: string)

Responsibilities
Inject HTML

Subscribe to enhancementComplete$

Run layout-sensitive logic

mark-render.service
Public Method
renderMarkdown(markdown: string): RenderResult

RenderResult
```ts
interface RenderResult {
  html: string;
  enhancementComplete$: Observable<void>;
}
```
Internal Enhancers
runMermaid()

runKatex()

runSyntaxHighlighting()

patchTablesForTheme()

Enhancement Aggregation
```ts
Promise.all(tasks).then(() => {
  queueMicrotask(() => this.enhancementComplete$.next());
});
```
### 📘 [ADR Summary](#docId:adr0010)
ADR: Async Rendering Pipeline
Defines:

The four-phase pipeline

Renderer/viewer responsibilities

Enhancement completion contract

Trade-offs and consequences

This ADR is the architectural backbone of the system.

### 🧩 Contributor Guides
[Contributor Guide (Narrative)](#docId:guides0010) 
Explains:

Why rendering is async

Why scroll logic must wait

How enhancements mutate the DOM

How to safely extend the system

Lifecycle Checklist
Covers:

Do/Don’t rules

Debugging timing issues

Adding new enhancements

Avoiding common pitfalls

Viewer Lifecycle Diagram
Shows:

When viewer acts

When viewer waits

How enhancements affect layout



### 📁 [Conponent Dependency Graph](#docId:app0010)

### 📁 [Folder Structure (Annotated)](#docId:app0020)

### 📁 [Architecture Diagram](#docId:app0030)

### 📁 [Refresh Recovery Lifecycle Diagram](#docId:app0060)

### 🎯 Goals of the Documentation System
Make the architecture explicit

Make the async pipeline predictable

Make onboarding friendly

Make enhancements safe to extend

Make lifecycle bugs rare and easy to diagnose

This documentation is designed to be a living system that grows with the project.

### 🏁 Final Notes
This comprehensive documentation package now includes:

Full folder README

Renderer API reference

Viewer API reference

Contributor guide

Lifecycle checklist

Renderer state machine

Viewer lifecycle diagram

ADR for the async pipeline

Architecture diagrams

Enhancement pipeline documentation

This is the complete, unified documentation system you envisioned — explicit, visual, modular, and contributor‑friendly.

### [What Goes Where” Cheat Sheet](#docId:app0900)

