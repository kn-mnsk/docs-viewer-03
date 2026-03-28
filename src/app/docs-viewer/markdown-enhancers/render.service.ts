import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { markedStringRenderer, } from './marked.renderer';

import { KatexService } from './katex.service';
import { MermaidService } from './mermaid.service';

import { sanitizeNodeText } from '../../global.utils/global.utils';
import { Marked, MarkedExtension, HooksObject } from 'marked';
import mermaid from 'mermaid';

@Injectable({ providedIn: 'root' })
export class RenderService {

  $title = signal<string>('MarkService');

  //Reference: https://marked.js.org/using_advanced

  marked: any | null = null;

  constructor(
    private http: HttpClient,
    private katexService: KatexService,
    private mermaidService: MermaidService,
  ) {
    this.initializeMarked();
    this.mermaidService.initializeMermaidCore();

  }

  /**
  * Load raw Markdown text from a URL.
  */
  loadMarkdown(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' });
  }

  /**
   * Marked Hooks wrapper
   * @param filetype
   * @param isDarkMode
   * @returns
   */
  private hooksWrapper(): HooksObject<string, string> {
    return {
      // postprocess: (html: string): Promise<string> => {
        postprocess: (html: string): string | Promise<string> => {
        // postprocess: (htmlStrg: string): string | Promise<string> => {

        const container = this.createContainer(html);
        // const container = document.createElement('div');
        // container.innerHTML = htmlStrg;

        // 1. Sanitize text nodes (replace non-breaking spaces)
        this.sanitize(container);
        // sanitizeNodeText(container);

        // 2. Render KaTeX math expressions
        this.renderKatex(container);
        // this.katexService.renderMath(container);

        // 3. render Mermaid
        // run mermaid after the before-rendering tasks complete
        this.renderMermaid();
        // this.renderMermaidAsync();
        // await this.renderMermaidAsync();
        // queueMicrotask(() => {
        //   this.mermaidService.renderMermaid();
        // });

        return container.innerHTML;
      }

    }
  }

  private createContainer(html: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div;
  }

  private sanitize(container: HTMLElement): void{
    sanitizeNodeText(container);
  }

  private renderKatex(container: HTMLElement): void{
    this.katexService.renderMath(container);
  }

  private async renderMermaidAsync(): Promise<void> {
    await queueMicrotask(() => this.mermaidService.renderMermaid());
  }

  private renderMermaid(): void {
    queueMicrotask(() => this.mermaidService.renderMermaid());
  }

  //--------------------------
  // Marked Initialization
  //--------------------------
  private initializeMarked(): void {

    if (!this.marked) {
      this.marked = new Marked<string, string>();
    }


    this.marked.use({
      async: false,
      breaks: true,
      gfm: true,
      hooks: this.hooksWrapper(),
      renderer: markedStringRenderer,
    });

    // const markedExtension: MarkedExtension<string, string> = {

    //   async: false,
    //   // async: true,
    //   breaks: true,
    //   gfm: true,
    //   hooks: this.hooksWrapper(), // to be recoded: argument as fileType
    //   pedantic: false,
    //   renderer: markedStringRenderer,
    //   // renderer: markedHtmlRenderer,
    //   silent: false,
    //   tokenizer: null,
    //   walkTokens: null
    // }

    // this.marked.use(markedExtension);


    // console.log(`Log: ${this.$title()} initializeMarked() FINISHED`);
  }

}




