import * as MarkdownIt from 'markdown-it'
import * as Token from 'markdown-it/lib/token'
import * as Renderer from 'markdown-it/lib/renderer'

export class MarkdownRenderer {
  // ---------------------------------------------------------------
  // Private Fields
  // ---------------------------------------------------------------

  /** The markdown parsing engine */
  private markdown: MarkdownIt | undefined = undefined

  // ---------------------------------------------------------------
  // Initialization and Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `MarkdownRenderer`
   * @param forPrint If true, will format the markdown rendering for print
   */
  constructor(readonly forPrint: boolean) {}

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets the markdown renderer for the module packer.
   */
  getRenderer(): MarkdownIt {
    // Create markdown parser and load plugins if
    // the parser has not yet been created
    if (this.markdown === undefined) {
      this.markdown = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      })

      this.markdown
        .use(require('markdown-it-anchor'))
        .use(require('markdown-it-attrs'))
        .use(require('markdown-it-decorate'))
        .use(require('markdown-it-imsize'), { autofill: true })
        .use(require('markdown-it-mark'))
        .use(require('markdown-it-multimd-table'))
        .use(require('markdown-it-sub'))
        .use(require('markdown-it-sup'))
        .use(require('markdown-it-underline'))

      this.markdown.block.ruler.after('blockquote', 'pagebreak', (state, startLine, endLine) => {
        let startPos = state.bMarks[startLine] + state.tShift[startLine]
        let possiblePageString = state.src.substr(startPos, 6).toLowerCase()
        if (possiblePageString === '(page)') {
          state.line = startLine + 1
          let token = state.push('print_page_break', '', 0)
          token.markup = '(page)'
          token.map = [startLine, state.line]
          return true
        }
        return false
      })

      this.markdown.renderer.rules.blockquote_open = this.renderBlockquoteOpen
      this.markdown.renderer.rules.blockquote_close = this.renderBlockquoteClose
      this.markdown.renderer.rules.print_page_break = this.forPrint ? this.printPageBreak : this.renderEmpty
    }

    return this.markdown
  }

  /**
   * Renders an empty value for a token
   */
  private renderEmpty(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    return ''
  }

  /**
   * Renders a print page break when rendering for print layout
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private printPageBreak(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    return '</div><div class="footer-page-number"></div></div><div class="print-page"><div class="page-content">'
  }

  /**
   * Renders an open blockquote element wrapped with a special div.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private renderBlockquoteOpen(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    let token = tokens[idx]
    let defaultBlockquoteOpenHtml = self.renderToken(tokens, idx, options)

    let readValue = token.attrs?.find( (attribute) => {
      return attribute[0] === 'class' && attribute[1].split(' ').includes('read')
    })

    if (readValue) {
      return '<div class="blockquote-read-wrap">' + defaultBlockquoteOpenHtml
    } else {
      return '<div class="blockquote-wrap">' + defaultBlockquoteOpenHtml
    }
  }

  /**
   * Renders an close blockquote element wrapped with a special div.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private renderBlockquoteClose(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    let defaultBlockquoteCloseHtml = self.renderToken(tokens, idx, options)
    return defaultBlockquoteCloseHtml + '</div>'
  }
}
