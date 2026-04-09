# ULDE v2 Project

## Structure

```
ulde-docs/
├── src/
│   ├── app/
│   ├── assets/
│   ├── index.html
│   └── styles.scss
└── README.md

```

```
src/app/
├── app.config.ts
├── app.routes.ts
├── app.ts
├── app.html
├── app.scss
│
├── pages/
│   ├── home/
│   └── docs/
│
├── ulde/
│   ├── core/
│   │   ├── content-engine/
│   │   │   └── content-engine.ts
│   │   ├── layout-engine/
│   │   │   └── layout-engine.ts
│   │   ├── interactive-engine/
│   │   │   └── interactive-engine.ts
│   │   └── runtime/
│   │       ├── ulde.ts
│   │       ├── ulde-context.ts
│   │       └── ulde.types.ts
│   │
│   ├── plugin-system/
│   │   ├── registry/
│   │   │   └── plugin-registry.ts
│   │   ├── hooks/
│   │   │   └── plugin-phases.ts
│   │   └── plugins/
│   │       ├── heading-anchors/
│   │       │   └── heading-anchors.plugin.ts
│   │       └── markdown/
│   │           └── markdown.plugin.ts
│   │
│   ├── angular/
│   │   ├── ulde-debug-overlay/
│   │   │   ├── ulde-debug-overlayt.ts
│   │   │   ├── ulde-debug-overlay.html
│   │   │   └── ulde-debug-overlay.scss
│   │   ├── ulde-layout-shell/
│   │   │   ├── ulde-layout-shell.ts
│   │   │   ├── ulde-layout-shell.html
│   │   │   └── ulde-layout-shell.scss
│   │   ├── ulde-viewer/
│   │   │   ├── ulde-viewer.ts
│   │   │   ├── ulde-viewer.html
│   │   │   └── ulde-viewer.scss
│   │   ├── ulde-dom-host.service.ts
│   │   └── ulde.service.ts
│   │
│   └── utils/
│       ├── dom/
│       │   ├── dom-budget.ts
│       │   └── dom-sanitizer.ts
│       ├── timing/
│       │   └── timing.plugin.ts
│       └── logging/
│           └── ulde-logger.ts

```
