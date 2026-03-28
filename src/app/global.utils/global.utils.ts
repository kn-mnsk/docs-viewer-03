
import { Router } from "@angular/router";


/**
 * The isBrowser() guard is about execution environment, while signals are about reactivity
 * @returns
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

  /**
   * Slugify text to generate URLs dynamically, from titles or metadata
   * @param text
   * @returns
   */
  export function slugify(text: string | null): string | null {
    if (text == null) return null;
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')           // Replace spaces with hyphens
      .replace(/[^\w\-]+/g, '')         // Remove special characters
      .replace(/\-\-+/g, '-');          // Collapse multiple hyphens
  }

  /**
   * assuming text format /string/string/string
   * @param text
   * @returns
   */
  export function unslugifyA(text: string | null): string | null {

    if (text == null) return null;

    const results = text.replace(/\/(\w+)\/(\w+)\/(\w+)/, (_, p1, p2, p3) => {
      const hiphenToSpace = (s: string) => s.replace(/-/g, ' '); // replace - with space

      const cap = (s: string) => {
        const spaced = hiphenToSpace(s);
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
      };
      return `/${cap(p1)}/${cap(p2)}/${cap(p3)}`;

    });

    return results;
  }

  /**
   * make the first character uppre case and the hyphen space for each path slug
   * @param text
   * @returns
   */
  export function unslugify(text: string): string {

    return (text.charAt(0).toUpperCase() + text.slice(1)).replace(/-/g, ' ');
  }


  //-----------------------------------------------------------------
  // Sanitization
  //------------------------------------------------------------------
  /**
   * Recursively replace non-breaking spaces in text nodes.
   */
  export function sanitizeNodeText(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      textNode.textContent = textNode.textContent?.replace(/\u00A0/g, ' ') ?? '';
      return;
    }

    if (node instanceof HTMLElement || node instanceof DocumentFragment) {
      node.childNodes.forEach(child => sanitizeNodeText(child));
    }
  }


  // navigate to a specific route
  export async function navigate(router: Router, route: any[]): Promise<boolean | undefined> {

    // const url = route.join('/');
    // let results: boolean | undefined;

    const result = await router.navigate(route);
    return result;
    // this.router.navigate(route).then(
    //   (resolve) => {
    //     // console.log(`Debug SceneLoaderComponent: Succeeded in Navigating To`, url);
    //     results = resolve;
    //   },
    //   (reject) => {
    //     // console.warn(`Warning SceneLoaderComponent: Failed in navigating to`, url);
    //     results = reject;
    //   });

    // return results;
  }
