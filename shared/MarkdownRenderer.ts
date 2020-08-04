import * as MarkdownIt from 'markdown-it'
import * as Renderer from 'markdown-it/lib/renderer'
import * as Token from 'markdown-it/lib/token'
import { Module } from './Module Entities/Module'
import { Monster } from './Module Entities/Monster'

export class MarkdownRenderer {
  // ---------------------------------------------------------------
  // Private Fields
  // ---------------------------------------------------------------

  /** The markdown parsing engine */
  private markdown: MarkdownIt | undefined = undefined

  /** The default image rendering rule */
  private static defaultImageRenderer: Renderer.RenderRule | undefined = undefined

  /** The default fence rendering rule */
  private static defaultFence: Renderer.RenderRule | undefined = undefined

  // ---------------------------------------------------------------
  // Initialization and Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `MarkdownRenderer`
   * @param forPrint If true, will format the markdown rendering for print
   * @param module The module for which this class is rendering
   */
  constructor(readonly forPrint: boolean, readonly module: Module | undefined = undefined) {}

  // ---------------------------------------------------------------
  // Monsters
  // ---------------------------------------------------------------

  /** Monsters parsed when parsing the markdown file */
  monsters: Monster[] = []

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

      this.markdown.block.ruler.after('blockquote', 'printbreaks', (state, startLine, endLine) => {
        let startPos = state.bMarks[startLine] + state.tShift[startLine]
        let endLinePos = state.eMarks[startLine]

        // Optimization: Check line starts with '('
        if (state.src.charCodeAt(startPos) !== 0x28) {
          return false
        }

        let lineString = state.src.substr(startPos, endLinePos).toLowerCase()

        if (lineString.startsWith('(print-page)')) {
          state.line = startLine + 1
          let token = state.push('print_page_break', '', 0)
          token.markup = '(print-page)'
          token.map = [startLine, state.line]
          return true
        }

        if (lineString.startsWith('(print-column)')) {
          state.line = startLine + 1
          let token = state.push('print_column_break', '', 0)
          token.markup = '(print-column)'
          token.map = [startLine, state.line]
          return true
        }

        return false
      })

      this.markdown.renderer.rules.blockquote_open = this.renderBlockquoteOpen
      this.markdown.renderer.rules.blockquote_close = this.renderBlockquoteClose
      MarkdownRenderer.defaultImageRenderer = this.markdown.renderer.rules.image
      this.markdown.renderer.rules.image = this.renderImage
      this.markdown.renderer.rules.print_page_break = this.forPrint ? this.printPageBreak : this.renderEmpty
      this.markdown.renderer.rules.print_column_break = this.forPrint ? this.printColumnBreak : this.renderEmpty
      MarkdownRenderer.defaultFence = this.markdown.renderer.rules.fence
      this.markdown.renderer.rules.fence = this.renderFence
    }

    return this.markdown
  }

  // ---------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------

  /**
   * Renders an empty value for a token
   */
  private renderEmpty = (tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) => {
    return ''
  }

  /**
   * Renders an image with as a figured caption if specified
   * split between pages when printing.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private renderFence = (tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) => {
    let token = tokens[idx]

    if (MarkdownRenderer.defaultFence === undefined) {
      return ''
    }

    let defaultFenceHTML = MarkdownRenderer.defaultFence(tokens, idx, options, env, self) || ''

    if (!token.info.toLowerCase().includes('monster')) {
      return defaultFenceHTML
    }

    let monster: Monster | undefined = undefined
    let monsterHTML = ''

    try {
      monster = Monster.fromYAMLContent(token.content)
      this.monsters.push(monster)
      monsterHTML = monster.getHTML(MarkdownRenderer.getTokenClasses(token))
    } catch (error) {
      monsterHTML = '<div class="statblock">'
      monsterHTML += '<hr class="statblock-border" />'
      monsterHTML += `<h1>Error</h1>`
      monsterHTML += `Error in Monster Stats: ${error}`
      monsterHTML += '<hr class="statblock-border bottom" />'
      monsterHTML += '</div>' // statblock
      return monsterHTML
    }

    return monsterHTML
  }

  /**
   * Renders an image with as a figured caption if specified
   * split between pages when printing.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private renderImage = (tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) => {
    let token = tokens[idx]

    if (MarkdownRenderer.defaultImageRenderer === undefined) {
      return ''
    }

    let defaultImageHTML = MarkdownRenderer.defaultImageRenderer(tokens, idx, options, env, self) || ''

    let captionValue = token.attrs?.find((attribute) => {
      return attribute[0] === 'class' && attribute[1].split(' ').includes('caption')
    })

    let alt = token.attrs?.find((attribute) => {
      return attribute[0] === 'alt'
    })

    if (captionValue && alt) {
      return `<figure class="${captionValue[1]}">${defaultImageHTML}<figcaption>${alt[1]}</figcaption></figure>`
    }
    return defaultImageHTML
  }

  /**
   * Renders a print page break when rendering for print layout
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private printPageBreak = (tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) => {
    if (this.module === undefined) {
      return ''
    }
    return this.module.getPageCloseHTML() + this.module.getPageOpenHTML()
  }

  /**
   * Renders a print column break when rendering for print layout
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private printColumnBreak = (tokens: Token[], idx: number, options: MarkdownIt.Options, env: any, self: Renderer) => {
    return '<div class="print-column-break"></div>'
  }

  /**
   * Renders an open blockquote element wrapped with a special div. These divs will
   * ensure that blockquote content that occurs above or below the blockquote is not
   * split between pages when printing.
   * @param tokens The Markdown tokens collection
   * @param idx The index of the token being rendered
   * @param options The markdown-it options
   * @param env The environment
   * @param self The HTML renderer
   */
  private renderBlockquoteOpen = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer
  ) => {
    let token = tokens[idx]
    let defaultBlockquoteOpenHtml = self.renderToken(tokens, idx, options)

    let hasReadStyle = MarkdownRenderer.getTokenHasClass(token, 'read')
    let hasPaperStyle = MarkdownRenderer.getTokenHasClass(token, 'paper')
    let hasFlowChartStyle =
      MarkdownRenderer.getTokenHasClass(token, 'flowchart') ||
      MarkdownRenderer.getTokenHasClass(token, 'flowchart-with-link')

    if (hasReadStyle) {
      return '<div class="blockquote-read-wrap">' + defaultBlockquoteOpenHtml
    } else if (hasPaperStyle) {
      return '<div class="blockquote-paper-wrap">' + defaultBlockquoteOpenHtml
    } else if (hasFlowChartStyle) {
      return '<div class="blockquote-flowchart-wrap">' + defaultBlockquoteOpenHtml
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
  private renderBlockquoteClose = (
    tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer
  ) => {
    let defaultBlockquoteCloseHtml = self.renderToken(tokens, idx, options)
    return defaultBlockquoteCloseHtml + '</div>'
  }

  private static getTokenClasses(token: Token): string[] {
    let classes: string[] = []
    if (!token.attrs || token.attrs.length == 0) {
      return classes
    }

    token.attrs.forEach((attribute) => {
      if (attribute[0] !== 'class') {
        return
      }

      attribute[1].split(' ').forEach((elementClass) => {
        classes.push(elementClass)
      })
    })
    return classes
  }

  /**
   * Gets whether a token has a particular class attribute
   * @param token The token
   * @param className The name of the class to check the token for
   */
  private static getTokenHasClass(token: Token, className: string): boolean {
    let classNames = MarkdownRenderer.getTokenClasses(token)
    return classNames.includes(className)
  }
}
