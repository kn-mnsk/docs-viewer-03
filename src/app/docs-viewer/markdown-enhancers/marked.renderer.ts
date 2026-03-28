// Base on an implementation by @markedjs (MIT License)
// Source: https://github.com/UziTech/marked-html-renderer/blob/main/src/renderer.ts#L42

import { Renderer, MarkedOptions, MarkedExtension, Tokenizer, Parser, Tokens, Marked, Token } from 'marked';

/**
 * Custom renderer for Markdown → HTML.
 * Handles code blocks (Mermaid, Bash, generic) and tables.
 */

export const markedString = new Marked<string, Node | string>();

function renderSpecialBlock(lang: string, text: string): any {
  const div = document.createElement('div');
  div.className = `${lang}-container`;

  const pre = document.createElement('pre');
  pre.className = lang;
  pre.textContent = text;

  div.appendChild(pre);
  return div.outerHTML;
};

function renderCodeBlock(lang: string, text: string): any {
  const pre = document.createElement('pre');
  const code = document.createElement('code');

  code.className = `language-${lang}`;
  code.textContent = text;

  pre.appendChild(code);
  return pre.outerHTML;
};


export const markedStringRenderer: any = {

  options: null as unknown as MarkedOptions<string, Node | string>,
  parser: null as unknown as Parser<string, Node | string>,

  code(token: Tokens.Code) {
    const lang = token.lang || "plaintext"; // Default to plaintext
    
    if (lang === 'mermaid' || lang === 'folder') {
      return renderSpecialBlock(lang, token.text);
    }

    return renderCodeBlock(lang, token.text);

  },

  table(token: Tokens.Table) {
    const table = document.createElement('table');
    table.className = "md-table"
    const thead = document.createElement('thead');

    const headerCell = document.createDocumentFragment();
    for (let j = 0; j < token.header.length; j++) {
      headerCell.append(this.tablecell(token.header[j]));
    }
    // console.log(`Log: RederService renderer headercell=`, headerCell);
    thead.append(headerCell);

    table.append(thead);

    if (token.rows.length === 0) {
      return table.outerHTML;
    }

    const tbody = document.createElement('tbody');
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];


      const cell = document.createDocumentFragment();
      for (let k = 0; k < row.length; k++) {
        cell.append(this.tablecell(row[k]));
      }

      tbody.append(this.tablerow({ text: cell }));
      // console.log(`Log: RederService renderer cell=`, j, cell);
    }

    table.append(tbody);

    const div = document.createElement('div');
    div.className = "md-table-container";
    div.append(table);

    // console.log(`Log: RederService renderer table=`, div);
    return div.outerHTML;
  },

  tablerow(token: Tokens.TableRow) {
    const tr = document.createElement('tr');
    tr.append(token.text);
    // console.log(`Log: RederService renderer tablerow`, tr);

    return tr;
  },

  tablecell(token: Tokens.TableCell) {

    const content = this.parser.parseInline(token.tokens);

    // console.log(`Log: RederService renderer tablecell content=`, token.text);

    const cell = document.createElement(token.header ? 'th' : 'td');

    cell.innerHTML = String(content);
    // cell.innerHTML = content;

    if (token.align) {
      cell.setAttribute('align', token.align);
    }
    // console.log(`Log: RederService renderer tablecell=`, cell.outerHTML, `tonek.header`, token.header);

    return cell;

  },

}

export const markedExtensionStringRenderer: MarkedExtension<string, Node | string> = {
  async: false,
  breaks: false,
  gfm: true,
  pedantic: false,
  renderer: markedStringRenderer,
  silent: false,
  tokenizer: new Tokenizer(),
  walkTokens: null
}


export const markedHtml = new Marked<DocumentFragment, Node | string>();

const other = {
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  percentDecode: /%25/g,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
};

const escapeReplacements: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
} as const;
const getEscapeReplacement = (ch: string) => escapeReplacements[ch];

function escapeText(html: string, encode?: boolean) {
  if (encode) {
    if (other.escapeTest.test(html)) {
      return html.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html)) {
      return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }

  return html;
}

function cleanUrl(href: string) {
  return encodeURI(href).replace(other.percentDecode, '%');
}

export const markedHtmlRenderer: Renderer<string, Node | string> = {
  // export const markedHtmlRenderer: Renderer<DocumentFragment, Node | string> = {
  options: null as unknown as MarkedOptions<string, Node | string>,
  // options: null as unknown as MarkedOptions<DocumentFragment, Node | string>,
  parser: null as unknown as Parser<string, Node | string>,
  // parser: null as unknown as Parser<DocumentFragment, Node | string>,

  space() {
    return '';
  },

  code(token: Tokens.Code) {
    const langString = token.lang || "plaintext"; // Default to plaintext if no language is provided

    const preEl = document.createElement('pre');

    if (langString === 'mermaid' || langString === 'folder') {
      const divEl = document.createElement('div');
      divEl.className = langString + '-container';
      preEl.className = langString;
      preEl.innerHTML = token.text;
      divEl.appendChild(preEl);
      // console.log(`Log: marked.renderer.ts markedHtmlRenderer code=`, divEl);
      return divEl.outerHTML;
    }

    const codeEl = document.createElement('code');
    codeEl.innerHTML = token.text;
    codeEl.className = 'language-' + langString;
    preEl.appendChild(codeEl);

    // console.log(`Log: marked.renderer.ts markedHtmlRenderer code=`, preEl);
    return preEl.outerHTML;
  },

  // update
  blockquote(token: Tokens.Blockquote) {
    const blockquote = document.createElement('blockquote');
    const parsed = this.parser.parse(token.tokens);
    blockquote.append(parsed);
    blockquote.innerHTML = String(parsed);
    // console.log(`Log: marked.renderer markedHtmlRenderer blockquote`, token, blockquote);
    return blockquote.outerHTML;
  },

  html(token: Tokens.HTML) {
    const comment = /^<!--([\s\S]*?)-->/.exec(token.text);

    // console.log(`Log: marked.renderer msrkedHtmlRendere html: `, token.text, comment);
    if (comment) {
      // markdown comment: return '' to hide
      return '';
      // return document.createComment(comment[1]);
    }
    // If it is not just assume it is text.
    return token.text;
  },

  def(token: Tokens.Def) {
    // link definition: return '' to hide
    // return document.createDocumentFragment();
    return '';
  },

  heading(token: Tokens.Heading) {
    // heading({ tokens, depth }) {
    const heading = document.createElement('h' + token.depth);
    const parsed = this.parser.parseInline(token.tokens);
    heading.innerHTML = String(parsed);
    // heading.append(parsed);
    return heading.outerHTML;
  },

  hr(token: Tokens.Hr) {
    const hrEl = document.createElement('hr');
    return hrEl.outerHTML;
  },

  list(token: Tokens.List) {
    // list(token) {
    const ordered = token.ordered;
    const start = token.start.toString();

    const list = document.createElement(ordered ? 'ol' : 'ul');
    for (let j = 0; j < token.items.length; j++) {
      const item = token.items[j];
      list.append(this.listitem(item));
    }

    if (ordered && start !== '1') {
      list.setAttribute('start', start);
    }

    return list.outerHTML;
  },

  listitem(token: Tokens.ListItem) {
    const item = document.createElement('li');
    const parsed = this.parser.parse(token.tokens);
    // item.append(parsed);
    item.innerHTML = parsed;

    return item.innerHTML;
  },

  checkbox({ checked }) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    if (checked) {
      checkbox.setAttribute('checked', '');
    }
    checkbox.disabled = true;
    return checkbox.innerHTML;
  },

  paragraph(token: Tokens.Paragraph) {
    const parsed = this.parser.parseInline(token.tokens)
    const paragraph = document.createElement('p');
    // paragraph.append(parsed);
    paragraph.innerHTML = String(parsed);
    // console.log(`Log: marked.renderer markedHtmlRenderer paragraph:`, token.tokens, String(parsed), paragraph);
    return paragraph.outerHTML;
  },

  table(token) {
    const table = document.createElement('table');
    table.className = "md-table"
    const thead = document.createElement('thead');

    const headerCell = document.createDocumentFragment();
    for (let j = 0; j < token.header.length; j++) {
      headerCell.append(this.tablecell(token.header[j]));
    }
    // console.log(`Log: RederService renderer headercell=`, headerCell);
    thead.append(headerCell);

    table.append(thead);

    if (token.rows.length === 0) {
      return table.outerHTML;
    }

    const tbody = document.createElement('tbody');
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];
      const cell = document.createDocumentFragment();
      for (let k = 0; k < row.length; k++) {
        cell.append(this.tablecell(row[k]));
      }

      tbody.append(this.tablerow({ text: String(cell) }));
      // tbody.append(this.tablerow({ text: cell }));
      // console.log(`Log: RederService renderer cell=`, j, cell);
    }

    table.append(tbody);

    const div = document.createElement('div');
    div.className = "md-table-container";
    div.append(table);

    // console.log(`Log: RederService renderer table=`, div);
    return div.outerHTML;
  },

  tablerow(token: Tokens.TableRow) {
    // tablerow({ text }) {
    const tr = document.createElement('tr');
    tr.append(token.text);
    // console.log(`Log: RederService renderer tablerow`, tr);

    return tr;
  },

  tablecell(token: Tokens.TableCell) {

    const parsed = this.parser.parseInline(token.tokens);
    const cell = document.createElement(token.header ? 'th' : 'td');
    // cell.append(parsed);
    cell.innerHTML = parsed;
    if (token.align) {
      cell.setAttribute('align', token.align);
    }

    // console.log(`Log: RederService renderer tablecell=`, cell.outerHTML, `tonek.header`, token.header);
    return cell.innerHTML;
  },

  /**
   * span level renderer
   */
  strong({ tokens }) {
    const parsed = this.parser.parseInline(tokens);
    const strong = document.createElement('strong');
    // strong.append(parsed);
    strong.innerHTML = String(parsed);
    return strong.outerHTML;
  },

  em(token: Tokens.Em) {
    const em = document.createElement('em');
    const parsed = this.parser.parseInline(token.tokens)
    // em.append(parsed);
    em.innerHTML = String(parsed);
    // console.log(`Log: marked.renderer em`, token.tokens, parsed, em.outerHTML);
    return em.outerHTML;
  },

  codespan(token: Tokens.Codespan) {
    const code = document.createElement('code');
    code.innerHTML = escapeText(token.text, true);
    return code.outerHTML;
  },

  br(token: Tokens.Br) {
    return document.createElement('br');
  },

  del({ tokens }) {
    const del = document.createElement('del');
    const parsed = this.parser.parseInline(tokens);
    del.innerHTML = String(parsed);
    // del.append(parsed);
    return del;
  },

  link(token: Tokens.Link) {
    const parsed = this.parser.parseInline(token.tokens);
    const href = cleanUrl(token.href);
    const anchor = document.createElement('a');
    anchor.href = href;
    if (token.title) {
      anchor.title = token.title;
    }
    anchor.innerHTML = String(parsed);
    // anchor.append(parsed);
    // console.log(`Log: marked.renderer link: `, parsed, token.title, anchor);
    return anchor.outerHTML;
  },

  image({ href, title, text, tokens }) {
    const body = this.parser.parseInline(tokens, this.parser.textRenderer);

    href = cleanUrl(href);
    const image = document.createElement('img');
    image.src = href;
    image.alt = text || '';
    // image.alt = body.textContent || '';
    if (title) {
      image.title = escapeText(title);
    }
    image.append(body);
    return image;
  },

  text(token: Tokens.Text) {
    const parsed = this.parser.parseInline(token.tokens || [] as Token[]);
    // console.log(`Log: marked.renderer markedHtmlRenderer text: `,  parsed, token);

    if (parsed) {
      return String(parsed);
    } else {
      return token.text;
    }
  },
};


export const markedExtensionHtmlRnderer: MarkedExtension<string, Node | string> = {
  async: false,
  breaks: false,
  gfm: true,
  pedantic: false,
  renderer: markedHtmlRenderer,
  silent: false,
  tokenizer: new Tokenizer(),
  walkTokens: null
};
