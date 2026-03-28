import { Component, ElementRef, input, effect, OnInit, AfterViewInit, signal, ViewChild, OnDestroy, computed, PLATFORM_ID, Inject, } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { take, firstValueFrom } from 'rxjs';

import { RenderService } from './markdown-enhancers/render.service';
import { DocsRegistry } from './registry/docs-registry'
import { ScrollService } from './markdown-enhancers/scroll.service';
import { navigate } from '../global.utils/global.utils';

import { readSessionState, writeSessionState } from './session-state.manage';

@Component({
  selector: 'app-docs-viewer',
  imports: [
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './docs-viewer.html',
  styleUrls: ['./docs-viewer.scss']
})
export class DocsViewer implements OnInit, AfterViewInit, OnDestroy {

  protected readonly $title = signal("DocsViewer");

  private $isBrowser = signal<boolean>(false);

  protected $isDarkMode = signal<boolean>(true);

  protected $inputDocId = input.required<string>(); // from DocsViewerDirective
  protected $docId = signal<string | null>(null);
  private $reload = signal(0);

  /** Debug mode for scroll restoration */
  debugScroll = false;
  // debugScroll = true;

  $activeDocId = computed<{ docId: string, reloadCounter: number }>(() => ({
    docId: this.$docId() ?? this.$inputDocId(),
    reloadCounter: this.$reload()
  }));

  protected docTitle!: string | undefined;

  // keep a reference to the handler
  private clickHandler = this.onClick.bind(this);
  private scrollHandler = this.onScroll.bind(this);

  @ViewChild('markdownViewer', { static: true }) markdownViewer!: ElementRef<HTMLElement>;

  private internalLinks: NodeListOf<Element> | null = null;
  private rafPending = false;

  constructor(
    private router: Router,
    private renderService: RenderService,
    private docsRegistry: DocsRegistry,
    protected scrollService: ScrollService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {

    const isBrowser = isPlatformBrowser(this.platformId);
    this.$isBrowser.set(isBrowser);

    if (isBrowser) {
      // thema setting
      const savedTheme = localStorage.getItem("theme") || "light";
      this.$isDarkMode.set(savedTheme === "dark"); // Sync button state
      document.documentElement.setAttribute("data-theme", savedTheme);

    }

    effect(() => {
      const { docId } = this.$activeDocId();
      this.effectWrapper(docId);
    });
  }

  ngOnInit(): void { }


  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    if (!this.$isBrowser()) return;

    this.cleanupViewer(this.markdownViewer.nativeElement);
    // console.log(`Log: ${this.$title()} ngOnDestroy completed isBrowser=true`);

  }


  /**
     * Reactive effect:
     * - Watches activeDocId()
     * - Loads markdown into the viewer
     * - On first load only, triggers a safe "second read" of the initial doc
  */
  private async effectWrapper(docId: string): Promise<void> {

    if (!this.$isBrowser() || !docId) return;

    // Guard: only run if markdownViewer is initialized
    const viewer = this.markdownViewer?.nativeElement;
    if (!viewer) {
      console.error(`Error ${this.$title()} effectwrapper(): viewer not found`);
      return;
    }

    this.updateSessionState(docId);
    this.docTitle = this.docsRegistry.get(docId)?.title;

    // Fire-and-forget async pipeline, but internally fully awaited.
    await this.renderDocument(docId, viewer);

  }

  private updateSessionState(docId: string): void {
    const { docId: current } = readSessionState(this.$isBrowser());
    if (docId !== current) {
      // set current docId to previous odcId, set new docId to current docId;
      writeSessionState({ docId, prevDocId: current }, this.$isBrowser());

    }
  }

  private async renderDocument(docId: string, viewer: HTMLElement): Promise<void> {

    this.cleanupViewer(viewer);

    const docMeta = this.docsRegistry.get(docId);
    if (!docMeta?.path) {
      viewer.innerHTML = `<p><em>Documentation not found.</em></p>`;
      return;
    }

    try {

      const markdown = await firstValueFrom<string>(
        this.renderService.loadMarkdown(docMeta.path).pipe(take(1))
      );

      const html = this.renderService.marked!.parse(markdown, { async: false });
      viewer.innerHTML = html;

      this.wireInternalLinks(viewer);
      viewer.addEventListener('scroll', this.scrollHandler);

      this.restoreScroll(docId, viewer);
    }
    catch (err) {
      viewer.innerHTML = `<p><em>Error loading dcoument</em></p>`;
      console.error(`Error: ${this.$title()}`, err);
    }
  }

  private wireInternalLinks(viewer: Element): void {
    this.internalLinks = viewer.querySelectorAll('a[href^="#docId:"], a[href^="#inlineId:"]');
    this.internalLinks?.forEach((el: Element) => {
      el.addEventListener('click', this.clickHandler);
    });
  }

  private restoreScroll(docId: string, viewer: HTMLElement): void {

    const savedPos = this.scrollService.getPosition(docId);

    const overlay = viewer.parentElement!.querySelector('.viewer-overlay') as HTMLElement;
    if (!overlay) {
      console.warn('Overlay not found — scroll hiding disabled.');
      viewer.scrollTop = savedPos;
      return;
    }

    if (this.debugScroll) {
      this.timeline.clear();
      this.mark("start");
      overlay.style.background = 'rgba(255,0,0,0.4)';
      console.log('[DEBUG] Scroll restore start → pos:', savedPos);
    }

    overlay.classList.remove('hidden'); // show overlay immediately

    viewer.scrollTop = savedPos;

    requestAnimationFrame(() => {
      if (this.debugScroll) this.mark("after-first-raf");

      requestAnimationFrame(() => {
        overlay.classList.add('hidden'); // always hide overlay

        if (this.debugScroll) {
          this.mark("overlay-hidden");
          console.log('[DEBUG] Scroll restore complete');

          const max = viewer.scrollHeight - viewer.clientHeight;
          const percent = max > 0 ? (savedPos / max) * 100 : 0;

          this.showScrollDebugOverlay({
            restored: savedPos,
            max,
            percent,
          });
        }
      });
    });
  }

  private restoreScroll01(docId: string, viewer: HTMLElement): void {
    const savedPos = this.scrollService.getPosition(docId);

    // Hide immediately
    viewer.classList.add('hidden-during-render');

    // Apply scroll synchronously
    // viewer.scrollTop = savedPos;

    // Wait for next paint cycle
    requestAnimationFrame(() => {

      // Apply scroll synchronously
      viewer.scrollTop = savedPos;
      // Wait for the paint *after* that
      requestAnimationFrame(() => {
        viewer.classList.remove('hidden-during-render');
      });
    });
  }

  // ensures to write scrollPos at most once per animation frame (~60fps max).
  private onScroll(event: Event): void {
    if (!this.$isBrowser()) return;

    // Capture the element synchronously — this is CRITICAL
    const el = event.currentTarget as HTMLElement;
    const docId = this.$activeDocId().docId ?? '';

    if (!this.rafPending) {
      this.rafPending = true;

      requestAnimationFrame(() => {
        const pos = el.scrollTop;
        const height = el.scrollHeight - el.clientHeight;
        this.scrollService.setPosition(docId, pos, height);
        writeSessionState({ scrollPos: pos }, this.$isBrowser());

        if (this.debugScroll) {
          console.log('[DEBUG] scroll event → pos:', pos);
        }

        this.rafPending = false;
      });
    }
  }

  private onClick(e: Event): void {

    e.preventDefault();
    // Use currentTarget to reliably reference the element you attached the listener to. and Use HTMLAnchorElement to get type-safe access to anchor-specific properties.
    const anchor = e.currentTarget as HTMLAnchorElement;
    const href = (anchor.getAttribute('href'))?.split(':').flat() ?? null;

    if (!href) {
      console.warn(`Warn ${this.$title()} : On Click  Failed  Reference Not Found`);
      navigate(this.router, ['/fallback']);
      return;
    }

    // console.log(`Log ${this.title()} On Click -> href=`, JSON.stringify(href));

    const hrefId = href[1];

    switch (href[0]) {
      case '#docId': {
        this.$docId.set(hrefId);
        this.$reload.update((n) => n + 1); // is necessary?
        break;
      }
      case '#inlineId': {
        // console.log(`Log ${this.title()} On Click -> inlineId=`, hrefId);

        const inlineRef = document.getElementById(hrefId);

        if (!inlineRef) {
          console.error(`Error ${this.$title()} Invalid inlineRef`, href, inlineRef);
          return;
        }

        if (!inlineRef.hasAttribute("contenteditable")) {
          inlineRef.setAttribute("contenteditable", "true");
        }

        // scroll to inlineRef
        this.scrollService.scrollToElementInViewer(
          this.markdownViewer.nativeElement,
          inlineRef,
          "instant",
          // "smooth",
          "top"
          // "center"
        );

        // Add a temporary highlight
        inlineRef.classList.add("highlight");
        setTimeout(() => {
          inlineRef.classList.remove("highlight");
        }, 1000);
        break;
      }
    }
  }

  private cleanupViewer(viewer: HTMLElement): void {
    viewer.innerHTML = '';
    viewer.removeEventListener('scroll', this.scrollHandler);

    if (this.internalLinks) {
      this.internalLinks.forEach((el: Element) => {
        el.removeEventListener('click', this.clickHandler);
      });
      this.internalLinks = null;
    }
  }

  // private clearPreviousDoc(): void {
  //   const viewer = this.markdownViewer?.nativeElement;
  //   if (viewer) {
  //     viewer.innerHTML = '';
  //     viewer.removeEventListener('scroll', this.scrollHandler);
  //   }

  //   if (this.internalLinks) {
  //     this.internalLinks.forEach((el: Element) => {
  //       el.removeEventListener('click', this.clickHandler);
  //     });

  //     this.internalLinks = null;
  //   }

  // }

  protected toggleTheme(event: Event): void {
    event.preventDefault();
    // console.log(`Log ${this.title()} toogleTheme event`, event);
    this.$isDarkMode.set(!this.$isDarkMode());

    const newTheme = this.$isDarkMode() ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme); // Save preference

    // force effect to reload markdown, in order to enable thema chage
    this.$reload.update(n => n + 1);
  }

  protected backToIndex(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.scrollService.setPosition('initialdoc', 0, 0);
    this.$docId.set('initialdoc');
    // force effect to reload markdown in case the activeDocId is the same as previously
    this.$reload.update(n => n + 1);

  }

  protected backToPrevious(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
    }
    // this.scrollService.setPosition('initialdoc', 0, 0);
    const prevDocId = readSessionState(this.$isBrowser()).prevDocId;
    if (!prevDocId) return;

    this.$docId.set(prevDocId);
    // force effect to reload markdown in case the activeDocId is the same as previously
    this.$reload.update(n => n + 1);
  }


  /* ---------------------------------------------------------
     Debug Tools
  --------------------------------------------------------- */

  private timeline = new Map<string, number>();

  private mark(label: string) {
    this.timeline.set(label, performance.now());
  }

  private exportTimeline(): Record<string, number> {
    const base = [...this.timeline.values()][0] ?? 0;
    const out: Record<string, number> = {};
    for (const [k, v] of this.timeline.entries()) {
      out[k] = Math.round(v - base);
    }
    return out;
  }

  private showScrollDebugOverlay(info: {
    restored: number;
    max: number;
    percent: number;
  }) {
    if (!this.debugScroll) return;

    const timeline = this.exportTimeline();

    const overlay = document.createElement('div');
    overlay.className = 'dv-scroll-debug-overlay';

    overlay.innerHTML = `
    <div class="dv-title">Scroll Restoration Debug</div>
    <div>Restored: <strong>${info.restored}px</strong></div>
    <div>Max: <strong>${info.max}px</strong></div>
    <div>Percent: <strong>${info.percent.toFixed(1)}%</strong></div>

    <div class="dv-subtitle">Timeline (ms)</div>
    ${Object.entries(timeline)
        .map(([k, v]) => `<div>${k}: ${v}</div>`)
        .join('')}
  `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });

    setTimeout(() => {
      overlay.classList.remove('visible');
      setTimeout(() => overlay.remove(), 300);
    }, 10000);
  }




}

