
import * as MarkdownIt from 'markdown-it'
import * as Token from 'markdown-it/lib/token'
import * as Renderer from 'markdown-it/lib/renderer'

export class MarkdownRenderer {

  // ---------------------------------------------------------------
  // Private Fields
  // ---------------------------------------------------------------

  /** The markdown parsing engine */
  private static markdown: MarkdownIt | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets the markdown renderer for the module packer.
   */
  static getRenderer(): MarkdownIt {
    
    // Create markdown parser and load plugins if
    // the parser has not yet been created
    if (MarkdownRenderer.markdown === undefined) {
      MarkdownRenderer.markdown = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      })

      MarkdownRenderer.markdown.use(require('markdown-it-anchor'))
        .use(require('markdown-it-attrs'))
        .use(require('markdown-it-decorate'))
        .use(require('markdown-it-imsize'), { autofill: true })
        .use(require('markdown-it-mark'))
        .use(require('markdown-it-multimd-table'))
        .use(require('markdown-it-sub'))
        .use(require('markdown-it-sup'))
        .use(require('markdown-it-underline'))

      MarkdownRenderer.markdown.renderer.rules.blockquote_open = MarkdownRenderer.renderBlockquoteOpen
      MarkdownRenderer.markdown.renderer.rules.blockquote_close = MarkdownRenderer.renderBlockquoteClose        
    }

    return MarkdownRenderer.markdown
  }

  /**
   * Renders an open blockquote element wrapped with a special div.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private static renderBlockquoteOpen(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    let defaultBlockquoteOpenHtml = self.renderToken(tokens, idx, options)
    return '<div class="blockquote-wrap">' + defaultBlockquoteOpenHtml
  }

  /**
   * Renders an close blockquote element wrapped with a special div.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private static renderBlockquoteClose(tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) {
    let defaultBlockquoteCloseHtml = self.renderToken(tokens, idx, options)
    return defaultBlockquoteCloseHtml + '</div>'
  }

}