import { Injectable, signal, ComponentRef, ViewContainerRef } from '@angular/core';

import { DocMeta, DocsList } from '../meta/docs-meta';

@Injectable({
  providedIn: 'root'
})
export class DocsRegistry {
  title = signal<string>('Docs Rgistry');

  constructor() {
    this.initLoad();
  }

  private docsRegistry = new Map<string, DocMeta>();
  private injectedRef: ComponentRef<any> | null = null;


  private initLoad(): void{
    this.docsRegistry.clear();
    DocsList.forEach(doc => {
      this.register(doc);
    })
  }

  register(meta: DocMeta) {
    this.docsRegistry.set(meta.id, meta);
  }

  has(id: string): boolean {
    return this.docsRegistry.has(id);
  }

  get(id: string | null): DocMeta | undefined {

    return id === null ? undefined : this.docsRegistry.get(id);
  }

  // getRoutes(): Routes {
  //   return Array.from(this.scenes.values()).map(scene => ({
  //     path: scene.path,
  //     title: scene.title,
  //     loadComponent: scene.loader
  //   }));
  // }


  // Optional: expose signal for reactive UI
  readonly docsList = signal<Array<DocMeta>>([]);
  refreshSignal() {
    this.docsList.set(Array.from(this.docsRegistry.values()));
  }

  getAll(): DocMeta[] {
    return Array.from(this.docsRegistry.values());
  }

  unregister(id: string): void {
    this.docsRegistry.delete(id);
    this.refreshSignal();
  }

  // findByPath(path: string): SceneMeta | undefined {
  //   return Array.from(this.scenes.values()).find(scene => scene.path === path);
  // }

  /** manage lifecycle more explicitly
   * Track and destroy previous component
   * @param id
   * @param vcr
   * @returns
   */
  async inject(id: string | null | undefined, vcr: ViewContainerRef): Promise<ComponentRef<any> | null> {
    if (!id) return null;
    const meta = this.get(id);
    if (!meta) return null;

    // console.log(`Log ${this.title()} inject()`, id);
    const loader = () => import('../../docs-viewer/docs-viewer').then(m => m.DocsViewer);
    loader().then(component => {
      this.injectedRef = vcr.createComponent(component);
      this.injectedRef.setInput('docId', id);
      console.log(`Log ${this.title()} inject()`, id);

    })

    return this.injectedRef;
  }

}
