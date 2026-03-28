import { Injectable, ElementRef, signal } from '@angular/core';

import renderMathInElement from "katex/contrib/auto-render";
import { Observable, BehaviorSubject } from 'rxjs';
import { map, filter, take } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class KatexService {

  $title = signal<string>('Katex Service')

  private katexLoaded$ = new BehaviorSubject<boolean>(false);

  loadKaTeX(): Observable<boolean> {
    if (!this.katexLoaded$.value) {
      this.katexLoaded$.next(true);
    }
    return this.katexLoaded$.pipe(filter((loaded) => loaded), take(1));
  }

  constructor() { }

  renderMath(container: HTMLElement): void {
  // renderMath(container: HTMLElement): void {

    this.loadKaTeX().subscribe(() => {
      renderMathInElement(container, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\begin{equation}", right: "\\end{equation}", display: true },
          { left: "\\begin{align}", right: "\\end{align}", display: true },
          { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
          { left: "\\begin{gather}", right: "\\end{gather}", display: true },
          { left: "\\begin{CD}", right: "\\end{CD}", display: true },
          { left: "\\[", right: "\\]", display: true }
        ],
        errorCallback: (err) => {
          console.error('Error in katex-render.service renderMathInElement', JSON.stringify(`${err}`));
        },
        throwOnError: true,
        errorColor: "#ff0000",
        output: "mathml",

      });
    });
    // console.log(`Log ${this.title()} renderMathInElement`, container);
  }

}
