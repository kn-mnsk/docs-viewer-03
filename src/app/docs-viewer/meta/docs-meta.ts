import { MermaidConfig } from "mermaid"

// Session State
export type SessionComponent = 'App' | 'DocsViewer';
export interface SessionState {
  component: SessionComponent;
  docId: string | null;
  prevDocId: string | null;
  scrollPos: number;
  refreshed: boolean;
}
export const SESSION_STATE_KEY = 'sessionState';
export const SESSION_STATE_DEFAULT: SessionState = {
  component: 'App',
  docId: null,
  prevDocId: null,
  scrollPos: 0,
  refreshed: false,
};
// Session Satet

export interface DocMeta {
  id: string;
  title: string;
  filetype?: string;
  path: string;
}

export const DocsList: DocMeta[] = [
  {
    "id": "initialdoc",
    "title": "Index",
    "filetype": "md",
    "path": "app/docs-viewer/docs/INDEX.md",
  },
  {
    "id": "angular-readme",
    "title": "Angular README",
    "filetype": "md",
    "path": "app/docs-viewer/docs/ANGULARREADME.md",
  },
  {
    "id": "application-readme",
    "title": "Application README",
    "filetype": "md",
    "path": "app/docs-viewer/docs/APPREADME.md",
  },
  {
    "id": "github-readme",
    "title": "GitHub README",
    "filetype": "md",
    "path": "app/docs-viewer/docs/GITHUBREADME.md",
  },
  {
    "id": "index",
    "title": "Index",
    "filetype": "md",
    "path": "app/docs-viewer/docs/INDEX.md",
  },
  // APPREADEME suppliments
  {
    "id": "doc10-app-0110",
    "title": "DocsViewer Key Logic Diagram",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc10-app-0110.md",
  },
  {
    "id": "doc10-app-0140",
    "title": "Browser Refresh Recovery",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc10-app-0140.md",
  },
  {
    "id": "doc10-app-0150",
    "title": "Browser SCroll Rstoration",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc10-app-0150.md",
  },
  {
    "id": "doc10-app-0151",
    "title": "Scroll Restoration & Timing Diagram",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc10-app-0151.md",
  },
  {
    "id": "doc-app-0200",
    "title": "lifecycle integration and the plugin‑ready documentation components",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-app-0200.md",
  },
  {
    "id": "doc-marked-0100",
    "title": "Supplemental Docs of 'Marked'",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-marked-0100.md",
  },
  {
    "id": "doc-marked-0200",
    "title": "Lexer and Parser'",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-marked-0200.md",
  },
  {
    "id": "doc-github-0100",
    "title": "Github Troubleshooting Guide",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-github-0100.md",
  },
  {
    "id": "doc-webapi-0100",
    "title": "requestAnimationFrame vs queueMicrotask",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-webapi-0100.md",
  },
  {
    "id": "doc-webapi-0120",
    "title": "queueMicrotask vs signal",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-webapi-0120.md",
  },
  {
    "id": "doc-angular-0100",
    "title": "Angular’s Lifecycle vs Browser frame lifecycle",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-angular-0100.md",
  },
  {
    "id": "doc-ulde-0100",
    "title": "ULDE Integration",
    "filetype": "md",
    "path": "app/docs-viewer/docs/supplements/doc-ulde-0100.md",
  },
  // TypeScript
  {
    "id": "docs-meta",
    "title": "Docs Meta",
    "filetype": "ts",
    "path": "app/docs-viewer/meta/docs-meta.ts",
  },
  {
    "id": "docs-registry",
    "title": "Doc Meta",
    "filetype": "ts",
    "path": "app/docs-viewer/registry/docs-registry.ts",
  },
  {
    "id": "app",
    "title": "App Component",
    "filetype": "ts",
    "path": "app/app.ts",
  },
  {
    "id": "docsviewer",
    "title": "DocsViewer Component",
    "filetype": "ts",
    "path": "app/docs-viewer/docs-viewer.ts",
  },
  {
    "id": "viewerdirective",
    "title": "DocsViewer Directive",
    "filetype": "ts",
    "path": "app/docs-viewer/docs-viewer.directive.ts",
  },
  {
    "id": "renderservice",
    "title": "Render Service ",
    "filetype": "ts",
    "path": "app/docs-viewer/markdown-enhancers/render.service.ts",
  },
  {
    "id": "katexservice",
    "title": "KatexService ",
    "filetype": "ts",
    "path": "app/docs-viewer/markdown-enhancers/katex.service.ts",
  },
  {
    "id": "mermaidservice",
    "title": "Mermaid Service ",
    "filetype": "ts",
    "path": "app/docs-viewer/markdown-enhancers/mermaid.service.ts",
  },
  {
    "id": "session-state",
    "title": "Session State Manager",
    "filetype": "ts",
    "path": "app/docs-viewer/markdown-enhancers/session-state.manager.ts",
  },
]

export const mermaidConfigDarkTheme: MermaidConfig = {
  // startOnLoad: true,
  // legacyMathML: true,
  theme: 'dark',
  themeVariables: {
    fontSize: '18px',
    fontFamily: 'Trebuchet MS, Verdana, Arial, Sans-Serif',
    primaryColor: '#2d3748',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#63b3ed',
    secondaryColor: '#4a5568',
    tertiaryColor: '#2c5282',
    lineColor: '#63b3ed',
    nodeTextSize: '20px',
    edgeLabelFontSize: '14px',
    labelTextSize: '16px',
    background: '#1e1e1e',
    clusterBkg: '#2d3748',
    clusterBorder: '#63b3ed'
  },
  flowchart: { htmlLabels: true, curve: 'linear' }
};

export const mermaidConfigLightTheme: MermaidConfig = {
  // startOnLoad: true,
  // legacyMathML: true,
  theme: 'default',
  themeVariables: {
    fontSize: '16px',
    fontFamily: 'Trebuchet MS, Verdana, Arial, Sans-Serif',
    primaryColor: '#f0f9ff',
    primaryTextColor: '#1a202c',
    primaryBorderColor: '#3182ce',
    secondaryColor: '#bee3f8',
    tertiaryColor: '#90cdf4',
    lineColor: '#3182ce',
    nodeTextSize: '18px',
    edgeLabelFontSize: '14px',
    labelTextSize: '16px',
    background: '#ffffff',
    clusterBkg: '#edf2f7',
    clusterBorder: '#3182ce'
  },
  flowchart: { htmlLabels: true, curve: 'basis' }
};
