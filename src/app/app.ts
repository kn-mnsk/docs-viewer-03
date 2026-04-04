import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, Renderer2, ViewChild, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

import { DocsViewerDirective } from './docs-viewer/docs-viewer.directive';
import { ScrollService } from './docs-viewer/markdown-enhancers/scroll.service';
import { SessionComponent } from './docs-viewer/meta/docs-meta';
import { readSessionState, writeSessionState } from './docs-viewer/session-state.manage';


@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    DocsViewerDirective,

  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly $title = signal('docs-viewer03');
  private readonly $isBrowser = signal<boolean>(false);

  protected $isVisible = signal<boolean | undefined>(false);
  protected $docId = signal<string | undefined>(undefined);


  @ViewChild('docsViewer', { static: true })
  docsViewer!: ElementRef<HTMLElement>;

  private removeKeydownListener?: () => void;
  private removeBeforeUnloadListener?: () => void;

  constructor(
    private scrollService: ScrollService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    const isBrowser = isPlatformBrowser(platformId);
    this.$isBrowser.set(isBrowser);

    if (isBrowser) {
      this.initTheme();
      this.initGlobalListeners();
      this.ensureInitialSessionState();
    }

  }

  private ensureInitialSessionState(): void {
    // Ensure there is at least a baseline state
    const current = readSessionState(this.$isBrowser());
    writeSessionState(current, this.$isBrowser());
  }

  // -------------------------
  // Browser-only initialization
  // -------------------------

  private initTheme(): void {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  private initGlobalListeners(): void {
    // Ctrl + C toggle
    this.removeKeydownListener = this.renderer.listen(
      'document',
      'keydown',
      (event: KeyboardEvent) => this.onKeyDown(event),
    );

    // Before unload: mark refresh
    this.removeBeforeUnloadListener = this.renderer.listen(
      window,
      'beforeunload',
      (event: BeforeUnloadEvent) => this.onBeforeUnload(event),
    );
  }

  // -------------------------
  // Refresh / restore logic
  // -------------------------

  private async restoreFromSessionState(): Promise<void> {
    const state = readSessionState(this.$isBrowser());

    // console.log(`Log: ${this.$title()} restoreFromSessionState()` +   `\nstate=${JSON.stringify(state, null, 2)}`);

    if (!state.refreshed) {
      // Normal start - show App template which is main screen
      return;
    }

    // Refresh flow
    if (state.component === 'App') {
      // Refreshed while on App: just clear refreshed flag
      writeSessionState({
        docId: null,
        prevDocId: null,
        refreshed: false,
        scrollPos: 0
      },
        this.$isBrowser()
      );

      return;
    }

    if (state.component === 'DocsViewer') {
      // Refreshed while viewing DocsViewer: restore doc + scroll
      const docId = state.docId ?? 'initialdoc';
      const scrollPos = state.scrollPos ?? 0;

      writeSessionState({ refreshed: false }, this.$isBrowser());

      this.scrollService.setPosition(docId, scrollPos, 0);
      this.$isVisible.set(true);
      this.$docId.set(docId);

      // console.log(`Log: ${this.$title()} restoreFromSessionState() DocsViewer Refresh` + `\nRestored docId=${docId}, scrollPos=${scrollPos}`);

      return;
    }

    // Fallback: no opinion, just clear refresh bit
    writeSessionState({ refreshed: false }, this.$isBrowser());
  }

  // -------------------------
  // Lifecycle hooks
  // -------------------------

  ngAfterViewInit(): void {
    if (this.$isBrowser()) {
      this.restoreFromSessionState();
    }
  }

  ngOnDestroy(): void {
    if (this.removeKeydownListener) {
      this.removeKeydownListener();
      this.removeKeydownListener = undefined;
    }

    if (this.removeBeforeUnloadListener) {
      this.removeBeforeUnloadListener();
      this.removeBeforeUnloadListener = undefined;
    }

    // App-level cleanup
    this.scrollService.setLastDocId(null);

    console.log(`Log ${this.$title()} ngOnDestroy Completed`);
  }

  // -------------------------
  // Handlers
  // -------------------------

  private onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key.toLowerCase() === 'c') {
      event.preventDefault();

      this.$isVisible.update(isVisible => !isVisible);

      const component: SessionComponent =
        this.$isVisible() ? 'DocsViewer' : 'App';

      // Decide which doc to show
      const lastState = readSessionState(this.$isBrowser());
      const docId = lastState.docId ?? 'initialdoc';
      this.$docId.set(docId);

      // Persist session state for refresh
      // note: docId is updated in DocsViewer
      writeSessionState({
        component
      }, this.$isBrowser());

      console.log(
        `Log ${this.$title()} onKeyDown Completed, ` +
        `isVisible=${this.$isVisible()}, docId=${this.$docId()}`,
      );
    }
  }

  private onBeforeUnload(event: BeforeUnloadEvent): void {
    // Mark that a refresh/unload is happening
    writeSessionState({ refreshed: true }, this.$isBrowser());

    // Optionally: let ScrollService push last scrollPos into sessionState
    // before unload, or keep that responsibility entirely on scroll events.
  }
}
