import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollService {
  // reactive signal for current scroll percentage
  readonly scrollPercent = signal(0);

  private lastDocId: string | null = null;

  private positions = new Map<string, number>();

  async setPosition(docId: string, pos: number, containerHeight: number) {
    if (this.positions.has('docId')){
      // possibility to refer to teh same DocId mulitiple titmes
      this.positions.delete('docId');
    }
    this.positions.set(docId, pos);
    const percent = containerHeight > 0 ? Math.round((pos / containerHeight) * 100) : 0;
    this.scrollPercent.set(percent);
    // this.setLastDocId(docId);
  }

  getPosition(docId: string): number {
    return this.positions.get(docId) ?? 0;
  }

  async setLastDocId(docId: string | null) {
    this.lastDocId = docId;
  }

  getLastDocId(): string| null{
    return this.lastDocId;
  }

/**
 * encapsulate scrolling logic
 * @param viewer:  view container which includes the followinfg element
 * @param element: element to be scrolled to its position
 * @param behavior
 * @param align
 * @returns
 */
scrollToElementInViewer(
  viewer: Element,
  // viewer: HTMLElement,
  element: HTMLElement,
  behavior: ScrollBehavior = "smooth",
  align: "top" | "center" = "top"
): void {
  if (!viewer || !element) return;

  const elementRect = element.getBoundingClientRect();
  const viewerRect = viewer.getBoundingClientRect();

  // Current scroll position of the viewer
  const currentScroll = viewer.scrollTop;

  // Distance from viewer top to element top
  const offsetTop = elementRect.top - viewerRect.top + currentScroll;

  let targetScroll = offsetTop;

  if (align === "center") {
    const elementHeight = elementRect.height;
    const viewerHeight = viewerRect.height;
    targetScroll = offsetTop - (viewerHeight / 2) + (elementHeight / 2);
  }

  viewer.scrollTo({ top: targetScroll, left: 0, behavior });
}


}
