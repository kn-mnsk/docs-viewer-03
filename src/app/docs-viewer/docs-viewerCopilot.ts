import {
  Component,
  ElementRef,
  input,
  effect,
  OnInit,
  AfterViewInit,
  signal,
  ViewChild,
  OnDestroy,
  computed,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { take, firstValueFrom } from 'rxjs';

import { RenderService } from './markdown-enhancers/render.service';
import { DocsRegistry } from './registry/docs-registry';
import { ScrollService } from './markdown-enhancers/scroll.service';
import { navigate } from '../global.utils/global.utils';

import { readSessionState, writeSessionState } from './session-state.manage';

@Component({
  selector: 'app-docs-viewer',
  imports: [MatIconModule, CommonModule],
  templateUrl: './docs-viewer.html',
  styleUrls: ['./docs-viewer.scss'],
})
export class DocsViewer implements OnInit, AfterViewInit, OnDestroy {
  protected readonly $title = signal('DocsViewer');

  private $isBrowser = signal<boolean>(false);
  protected $isDarkMode = signal<boolean>(true);

  protected $inputDocId = input.required<string>();
  protected $docId = signal<string | null>(null);
  private $reload = signal(0);

  /** Debug mode for scroll restoration */
  debugScroll = false;

  $activeDocId = computed(() => ({
    docId: this.$docId() ?? this.$inputDocId(),
    reloadCounter: this.$reload(),
  }));

  protected docTitle!: string | undefined;

  private clickHandler = this.onClick.bind(this);
  private scrollHandler = this.onScroll.bind(this);

  @ViewChild('markdownViewer', { static: true })
  markdownViewer!: ElementRef<HTMLElement>;

  private internalLinks: NodeListOf<Element> | null = null;
  private rafPending = false;

  constructor(
    private router: Router,
    private renderService: RenderService,
    private docsRegistry: DocsRegistry,
    protected scrollService: ScrollService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const isBrowser = isPlatformBrowser(this.platformId);
    this.$isBrowser.set(isBrowser);

    if (isBrowser) {
      const savedTheme = localStorage.getItem('theme') || 'light';
      this.$isDarkMode.set(savedTheme === 'dark');
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    effect(() => {
      const { docId } = this.$activeDocId();
      this.effectWrapper(docId);
    });
  }

  ngOnInit(): void {}
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (!this.$isBrowser()) return;
    this.cleanupViewer(this.markdownViewer.nativeElement);
  }

  private async effectWrapper(docId: string): Promise<void> {
    if (!this.$isBrowser() || !docId) return;

    const viewer = this.markdownViewer?.nativeElement;
    if (!viewer) return;

    this.updateSessionState(docId);
    this.docTitle = this.docsRegistry.get(docId)?.title;

    await this.renderDocument(docId, viewer);
  }

  private updateSessionState(docId: string): void {
    const { docId: current } = readSessionState(this.$isBrowser());
    if (docId !== current) {
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
      const markdown = await firstValueFrom(
        this.renderService.loadMarkdown(docMeta.path).pipe(take(1))
      );

      const html = this.renderService.marked!.parse(markdown, { async: false });
      viewer.innerHTML = html;

      this.wireInternalLinks(viewer);
      viewer.addEventListener('scroll', this.scrollHandler);

      this.restoreScroll(docId, viewer);
    } catch (err) {
      viewer.innerHTML = `<p><em>Error loading document.</em></p>`;
      console.error(err);
    }
  }

  private wireInternalLinks(viewer: Element): void {
    this.internalLinks = viewer.querySelectorAll(
      'a[href^="#docId:"], a[href^="#inlineId:"]'
    );
    this.internalLinks.forEach((el) =>
      el.addEventListener('click', this.clickHandler)
    );
  }

  /** Scroll restoration with overlay + debug mode */
  private restoreScroll(docId: string, viewer: HTMLElement): void {
    const savedPos = this.scrollService.getPosition(docId);

    const overlay = viewer.parentElement!.querySelector(
      '.viewer-overlay'
    ) as HTMLElement;

    if (!overlay) {
      console.warn('Overlay not found — scroll hiding disabled.');
      viewer.scrollTop = savedPos;
      return;
    }

    overlay.classList.remove('hidden');

    if (this.debugScroll) {
      overlay.style.background = 'rgba(255,0,0,0.4)';
      console.log('[DEBUG] Scroll restore start → pos:', savedPos);
    }

    viewer.scrollTop = savedPos;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('hidden');

        if (this.debugScroll) {
          console.log('[DEBUG] Scroll restore complete');
        }
      });
    });
  }

  private onScroll(event: Event): void {
    if (!this.$isBrowser()) return;

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

    const anchor = e.currentTarget as HTMLAnchorElement;
    const href = anchor.getAttribute('href')?.split(':').flat() ?? null;

    if (!href) {
      navigate(this.router, ['/fallback']);
      return;
    }

    const hrefId = href[1];

    switch (href[0]) {
      case '#docId':
        this.$docId.set(hrefId);
        this.$reload.update((n) => n + 1);
        break;

      case '#inlineId': {
        const inlineRef = document.getElementById(hrefId);
        if (!inlineRef) return;

        if (!inlineRef.hasAttribute('contenteditable')) {
          inlineRef.setAttribute('contenteditable', 'true');
        }

        this.scrollService.scrollToElementInViewer(
          this.markdownViewer.nativeElement,
          inlineRef,
          'smooth',
          'center'
        );

        inlineRef.classList.add('highlight');
        setTimeout(() => inlineRef.classList.remove('highlight'), 1000);
        break;
      }
    }
  }

  private cleanupViewer(viewer: HTMLElement): void {
    viewer.innerHTML = '';
    viewer.removeEventListener('scroll', this.scrollHandler);

    if (this.internalLinks) {
      this.internalLinks.forEach((el) =>
        el.removeEventListener('click', this.clickHandler)
      );
      this.internalLinks = null;
    }
  }

  protected toggleTheme(event: Event): void {
    event.preventDefault();

    this.$isDarkMode.set(!this.$isDarkMode());
    const newTheme = this.$isDarkMode() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    this.$reload.update((n) => n + 1);
  }

  protected backToIndex(event?: MouseEvent): void {
    if (event) event.preventDefault();

    this.scrollService.setPosition('initialdoc', 0, 0);
    this.$docId.set('initialdoc');
    this.$reload.update((n) => n + 1);
  }

  protected backToPrevious(event?: MouseEvent): void {
    if (event) event.preventDefault();

    const prevDocId = readSessionState(this.$isBrowser()).prevDocId;
    if (!prevDocId) return;

    this.$docId.set(prevDocId);
    this.$reload.update((n) => n + 1);
  }
}
