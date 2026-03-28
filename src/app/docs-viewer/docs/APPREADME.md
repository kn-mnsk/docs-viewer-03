[1st]:#inlineId:1-folder-structure "§1. Folder Structure(Main Part Only)"
[2nd]:#inlineId:2-key-features "§2. Key Features"
[3rd]:#inlineId:3-architecture-diagram "§3. Architecture Diagram"

Application README (ID: application-readme)
=============================
---
__This document is the master reference for the entire documentation rendering system. It explains how Markdown is parsed, enhanced, rendered to html, and synchronized with user navigation.__

---
  
<!-- ## 1. Folder Structure(Main Part Only) [next > 2. Key Features](#inlineId:2-key-features) -->
<h2 id="1-folder-structure">§1. Folder Structure(Main Part Only)</h2>

**[last section][3rd] &emsp; [next section][2nd]**

> ----
> The Docs-Vierwer folder contains the documentation viewer and the Markdown rendering pipeline used throughout the project. It includes the viewer component, the renderer service, enhancement logic, lifecycle coordination, and documentation.

```folder
Folder Structure

app/
│  
├── docs-viewer/
│   │
│   ├── docs/ (*1)
│   │   ├── supplements/
│   │   │   ├── doc10-app-0110.md (DocsViewer Key Logic Diagram)
│   │   │   ├── doc10-app-0140.md (Browser Refresh Recovery Diagram)
│   │   │   ├── github-doc-0100.md
│   │   │   └── marked.md
│   │   ├── ANGULARREADME.md
│   │   ├── APPREADME.md
│   │   ├── GITHUBREADME.md
│   │   └── INDEX.md
│   │
│   ├── markdown-enhancers/
│   │   ├── katex.service.ts
│   │   ├── marked.renderer.ts
│   │   ├── mermaid.service.ts
│   │   ├── render.service.ts
│   │   └── scroll.service.ts
│   │
│   ├── meta/ 
│   │   └── docs-meta.ts
│   │
│   ├── registry/
│   │   └── docs-registry.ts
│   │
│   ├── docs-viewer.directive.ts
│   ├── docs-viewer.html
│   ├── docs-viewer.scss
│   ├── docs-viewer.spec.ts
│   ├── docs-viewer.ts
│   └── session-state.manage.ts
│

...

└── app.ts

```

[(*1) See DocsList in th the docs-meta.ts](#docId:docs-meta)

--- 

<h2 id="2-key-features">§2. Key Features</h2>

**[previous section][1st] &emsp; [next section][3rd]**  
> ---
> This is the markdown documentation system, which complies with Katex  and Mermaid renderings. Therefore a user views the most recentlty updated markdown file while editting it, through the browser refersh recovery management.
The system is designed to follow a clear async pipeline that ensures stable layout, correct scroll restoration, and accurate anchor navigation.
    
>1. __App__

>> displays main screen(currently blank, though):

>>- Adds Render2 listeners - beforeunload and keydown
>>- Detects browser refresh  
>>- Restores Session State
>>- Controls visibility of App and DocsViewer templates
>>- Does NOT manage docId or scrollPos

>> [ref-1: app.ts](#docId:app)

>> [ref-2: Browser Refresh Recovery](#docId:doc10-app-0140)


>2. __DocsViewer__

>> displays rendered documentation, manages scroll restoration, anchor navigation. The DocsViewer is created via the [DocsViewerDirective](#docId:viewerdirective):

>>- Owns docId and scrollPos, and writes both into sessionState
>>- navigates one doc to another
>>- loads <a href="https://daringfireball.net/projects/markdown/" target="_blank">Markdown</a>, converts it into html using <a href="https://marked.js.org/" target="_blank">Marked</a>,  renders math typesetting using <a href="https://katex.org/" target="_blank">Katex</a>, renders diagrams & charts using  <a href="https://mermaid.js.org/" target="_blank">Mermaid</a>, via MarkService, reacting to docId signal 
>>- Restores scrollPos after rendering

>> [ref-1: docs-viewer.ts](#docId:docsviewer)

>> [ref-2: DocsViewer Key Logic Diagram](#docId:doc10-app-0110)


>3. __RenderService__

>> loads Markdown, and convert Markdown to html with custom transforms using __Marked__, and enhances html to render mathh typesetting using __Katex__ and to render diagrams and charts using __Mermaid__.Those modules work together through the following async pipeline, which is the backbone of the entire documentation experience.

>>- __Key Public APIs:__

>>>1. loadMarkdown():

>>>> The main entry point for the DocsViewer.
<div class="align-center10">

```typescript
        loadMarkdown(url: string): Observable<string> {
          return this.http.get(url, { responseType: 'text' });
        }
```
</div>

>>>2. renderMarkdown()

>>>> After the loadMarkdown(), converts raw Markdown into HTML synchronously, starts async enhancements, and then ends when all enhancements are complete:
<div class="align-center10">

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

>>- Document(markdown + typrscript) loading (async)
>>- Marked to parse and custom-transform Markdown (sync)
>>- Katex to render math typesetting (async)
>>- Mermaid to render diagrams and (aysnc)
>>- HTML injection (sync)
>>- Layout-sensitive viewer logic (async after completion)
>>- And, this pipeline ensures:

>>>- Stable layout
>>>- Correct scroll restoration
>>>- Accurate anchor navigation

>> [ref-1: render.service.ts](#docId:renderservice)


>4. __Other importnat modules__

>>- [docs-meta.ts](#docId:docs-meta) - meta infomation for reference to markdown files, etc.
>>- [docs-registry.ts](#docsId:docs-registry) - load DocsList in the docs-meta.ts file and provide document title and path
>>- [session-state.manager.ts](#docId:session-state) - helpers to manager SessionState with localStorage

<br/>

> **In summary:**

>1. Rendering is asynchronous
HTML is returned immediately, but enhancements like Mermaid and KaTeX run later.
This means layout is not stable until enhancements complete.

>2. Viewer must wait for enhancementComplete$
Scroll restoration and anchor navigation must run only after enhancements finish.

>3. Renderer owns enhancement timing
The viewer never runs enhancements directly.

>4. Enhancements mutate the DOM
Mermaid injects SVGs, KaTeX replaces nodes, syntax highlighting queues microtasks, and table patching adjusts layout.
    
>5. lifecycle this system follows:

>>1. App toggles(Ctrl+c) visibility → writes DocsViewer via Directive
>>2. DocsViewer updates docId → writes to sessionState
>>3. DocsViewer updates scrollPos → writes to sessionState
>>4. Before unload → App writes refreshed = true
>>5. After refresh → App reads sessionState
>>6. If DocsViewer was active → restore doc and sccroll position
>>7. If App was active → show App screen

---

<h2 id="3-architecture-diagram">§3. Architecture Diagram</h2>

**[previous section][2nd] &emsp; [first section][1st]**  
> ---
<div class="align-center7">
<strong>What This Diagram Shows:</strong>

  1. SSR → Hydration → Browser Init 

  >- SSR renders HTML with no DOM access
  >- Hydration attaches Angular to the existing DOM
  >- App detects browser environment and initializes listeners

  2. App owns refresh detection  [(See Browser Refresh Recovery)](#docId:doc10-app-0140)

  >- Global Listeners Setting

  >>- keydown event - Ctrl+C to toggle App ⇄ DocsViewer
  >>- beforeunload event - sets sessionState.refreshed = true

  >- restoreFromSessionState() decides what to show on reload

  3. DocsViewer owns docId & inlineId + scrollPos [(see DocsViewer Key Logic Diagram)](#docId:doc10-app-0110)

  >- AddEvent Listeners Setting - click event and scroll event
  >- Reactive effect:

  >>- loads raw markdown file, and
  >>- converts markdwon to html using **Marked**, and 
  >>- renders math typesetting using **Katex**, and
  >>- renders diagrams and charts using **Mermaid**
  >- Scroll event update sessionState
  >- click event enables internal navigations among documents, and updates seesionState

  4. ScrollService owns scroll persistence

  >- Saves scrollPos
  >- Restores scroll after markdown render

  5. session-state.manager.ts is the centralized layer

  >- States are:

  >>- component
  >>- docId
  >>- prevDocId
  >>- scrollPos
  >>- refreshed

  6. localStorage is the single source of sessionState

  >- No scattered keys
  >- No hydration surprises
  >- No race conditions

</div>

---

```mermaid
---
title: "Architecture Diagram"
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
      render_SSR["Render App HTML<br>(no DOM/localStorage)"]
    end

    subgraph HYD["Hydration Engine"]
      attch_HYD["Attach to existing DOM"]
      runInit_HYD["Run component <br>init hooks"]
    end

    subgraph APP["App Component"]
      direction TB
      init_APP["Browser Init<br>(isPlatformBrowser)"]
      listeners_APP["Global Listeners<br>Setting"]
      restore_APP["restoreFromSessionState()"]
    end

    subgraph DVD["DocsViewer Directive"]
      direction TB
      signal_DVD["signal"]
      effect_DVD["effect()"]
      import_DVD["Import DocsViewer"]
      update_DVD["Update DocsViewer"]
    end

    subgraph DV["DocsViewer Component"]
      direction TB
      signal_DV["signal"]
      effect_DV["effect()"]
      subgraph LOAD_DV["loadAndRenderMarkdown()"]
        load_DV["loadMarkdown()"]
        render_DV["renderMarkdownToDOM()"]
        link_DV["Internal Links &<br> OnClick Handling "]
        scroll_DV["OnScroll Handling "]
        restore_DV["Restore Scroll After Rendering"]
      end
    end

    subgraph Enhancers["Markdown Enhancers"]
      direction TB
      Docs-Registry["DocsRegistry Service"]
      subgraph Render_Service["Render Service"]
        load_RS["Load Markdown file"]
        marked_RS["Marked"]
        katex_RS["Katex"]
        mermaid_RS["Mermaid"]
      end 
      subgraph Scroll["ScrollService"]
        get_Scroll["getPosition()"]
        set_Scroll["setPosition()"]
        restore_Scroll["scrollTo<br>ElementInViewer()"]
      end
    end

    %% Document Repository
    Markdown_Repo["Markdown File<br>Repository"]
    

    %% Session State
    subgraph SS_Manager["Session State Manager"]
      direction TB
      read_SS["readSessionState()"]
      write_SS["writeSessionState()"]
      clear_SS["clearSessionState()"]
    end

    %% Listeners
    subgraph App_Listeners["Global Listeners"]
      direction TB
      keydown_App_Listener["keydown event 'Ctrl+C'<br>(isVisible signal<br>false ⇆ true)"]
      beforeunload_App_Listener["beforeunload event<br>'Reload'"]
    end

    subgraph DV_Listeners["AddEvent Listeners"]
      direction TB
      Click_DV_Listener["click event for anchor tag: <br> docId and inlineId"]
      Scroll_DV_Listener["scroll event for Docs Viewer"]
    end

    %%  Local Storage (LS)
    subgraph Local_Storage["localStorage"]
      direction TB
      sessionState_LS["sessionState JSON"]
      %% Includes component, docId, scrollPos, refreshed
    end

    %% ============================
    %%  FLOWS 
    %% ============================

    render_SSR --> attch_HYD
    attch_HYD --> runInit_HYD
    runInit_HYD --> init_APP

    %% App
    init_APP ~~~ restore_APP
    init_APP --> listeners_APP
    read_SS --> init_APP
    restore_APP -->|docId| signal_DVD
    %% restore_APP -->|docId| effect_DVD
    listeners_APP --> keydown_App_Listener
    listeners_APP --> beforeunload_App_Listener
  
    %% SS - Session State
    read_SS ~~~ write_SS ~~~ clear_SS
    Local_Storage --> read_SS
    write_SS --> Local_Storage
    clear_SS --> Local_Storage
    %% restore_APP -->|App active| App-Visible

    %% DVD - DocsViewerDirective
    signal_DVD --> effect_DVD
    effect_DVD --> |DocsViewer new| import_DVD
    effect_DVD --> |DocsViewer active| update_DVD
    import_DVD -->|docId| signal_DV
    update_DVD -->|docId| signal_DV

    %% DV - DocsViewer
    load_DV ~~~ render_DV ~~~ link_DV ~~~ scroll_DV ~~~ restore_DV
    signal_DV --> effect_DV
    effect_DV -->|docId| LOAD_DV
    effect_DV --> write_SS
    effect_DV --> set_Scroll
    render_DV --> Render_Service
    render_DV <--> Docs-Registry
    link_DV --> Click_DV_Listener
    scroll_DV --> Scroll_DV_Listener
    get_Scroll --> restore_DV

    %% Markdown Enhancers
    Docs-Registry ~~~ Render_Service
    load_RS --> marked_RS --> katex_RS --> mermaid_RS
    Render_Service ~~~ Scroll
    Markdown_Repo --> load_RS

    %% Scroll Service
    get_Scroll ~~~ set_Scroll ~~~ restore_Scroll
    scroll_DV --> set_Scroll
    set_Scroll --> write_SS

    %% Listeners
    keydown_App_Listener ~~~ beforeunload_App_Listener
    keydown_App_Listener --> |isVisibleTrue dopcId| signal_DVD
    keydown_App_Listener -->|isVisible=False| init_APP
    beforeunload_App_Listener --> restore_APP

    Click_DV_Listener ~~~ Scroll_DV_Listener
    Click_DV_Listener -->|docId| effect_DV
    Click_DV_Listener -->|inlineId| restore_Scroll

    Scroll_DV_Listener --> set_Scroll
    Scroll_DV_Listener --> write_SS

```
