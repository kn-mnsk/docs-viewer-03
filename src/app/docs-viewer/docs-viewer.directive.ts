import { Directive, input, ViewContainerRef, effect, signal, ComponentRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[docsViewerDirective]',
})
export class DocsViewerDirective {

  protected $title = signal<string>('DocsViewer Directive')

  private $isBrowser = signal<boolean>(false);

  $inputDocId = input<string>();

  private compRef: ComponentRef<any> | null = null;

  constructor(
    public vcr: ViewContainerRef,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {

    const isBrowser = isPlatformBrowser(platformId);
    this.$isBrowser.set(isBrowser);

    effect(() => {
      const docId = this.$inputDocId();
      this.effectWrapper(docId);
    });

  }

  private effectWrapper(docId: string | undefined): void {

    if (!docId) return;

    if (!this.$isBrowser()) return;

    // console.log(`Log: ${this.$title()} docId=${docId}`);

    if (!this.compRef) {
      // First-time load: dynamically import and create component
      import('./docs-viewer')
        .then(m => {
          this.vcr.clear();
          this.compRef = this.vcr.createComponent(m.DocsViewer);
          this.compRef.setInput('$inputDocId', docId);
        });

    } else {
      // Update existing component input without recreating
      this.compRef.setInput('$inputDocId', docId);
      // console.log(`Log ${this.title()} updated DocsViewer docId=${id}`);
    }
  }


}
