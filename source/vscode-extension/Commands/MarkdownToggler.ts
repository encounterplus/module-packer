import * as vscode from 'vscode'
import Slugify from 'slugify'
import { MarkdownToggle } from './MarkdownToggle'

/** Toggles markdown states on and off */
export class MarkdownToggler {

  /** The collection of Markdown Toggle commands */
  toggleDictionary: { [commandID: string]: MarkdownToggle } = {}

  /**
   * Initializes an instance of `MarkdownToggler`
   */
  constructor() {
    this.toggleDictionary['encounterPlusMarkdown.toggleBold'] = {
      isMultiline: false,
      detectRegExp: /\*\*(\S.*?\S)\*\*/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\*\*(\S.*?\S)\*\*/gi,
      enableFormat: '**$1**',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 2,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleItalics'] = {
      isMultiline: false,
      detectRegExp: /\*(\S.*?\S)\*(?!=\*)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\*(\S.*?\S)\*(?!=\*)/gi,
      enableFormat: '*$1*',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 1,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleUnderLine'] = {
      isMultiline: false,
      detectRegExp: /_(\S.*?\S)_/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /_(\S.*?\S)_/gi,
      enableFormat: '_$1_',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 1,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleMark'] = {
      isMultiline: false,
      detectRegExp: /==(\S.*?\S)==/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /==(\S.*?\S)==/gi,
      enableFormat: '==$1==',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 2,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleSuperscript'] = {
      isMultiline: false,
      detectRegExp: /\^(\S.*?\S)\^/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\^(\S.*?\S)\^/gi,
      enableFormat: '^$1^',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 1,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleSubscript'] = {
      isMultiline: false,
      detectRegExp: /~(\S.*?\S)~(?!=~)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /~(\S.*?\S)~(?!=~)/gi,
      enableFormat: '~$1~',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 1,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleStrikethrough'] = {
      isMultiline: false,
      detectRegExp: /~~(\S.*?\S)~~/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /~~(\S.*?\S)~~/gi,
      enableFormat: '~~$1~~',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 2,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleCodeInline'] = {
      isMultiline: false,
      detectRegExp: /`(\S.*?\S)`/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /`(\S.*?\S)`/gi,
      enableFormat: '`$1`',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 1,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleCodeBlock'] = {
      isMultiline: true,
      detectRegExp: /^```\r?\n[\S\s]+\r?\n```\s*$/gi,
      enableRegExp: /((?:\S|\s)+)/gi,
      disableRegExp: /^```\r?\n([\S\s]+)\r?\n```\s*$/gi,
      enableFormat: '```\n$1\n```',
      disableFormat: '$1',
      lineOffset: 1,
      characterOffset: 0,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleUList'] = {
      isMultiline: true,
      detectRegExp: /((^|\n)-\s+(.+)\s*(?=$|\n))+/gi,
      enableRegExp: /(^|\n)\s*(.+?)\s*(?=$|\n)/gi,
      disableRegExp: /(^|\n)-\s+(.+)\s*(?=$|\n)/gi,
      enableFormat: '$1- $2',
      disableFormat: '$1$2',
      lineOffset: 0,
      characterOffset: 2,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleOList'] = {
      isMultiline: true,
      detectRegExp: /((^|\n)(?:\d+\.)\s+(.+)\s*(?=$|\n))+/gi,
      enableRegExp: /(^|\n)\s*(.+?)\s*(?=$|\n)/gi,
      disableRegExp: /(^|\n)(?:\d+\.)\s+(.+)\s*(?=$|\n)/gi,
      enableFormat: '$11. $2',
      disableFormat: '$1$2',
      lineOffset: 0,
      characterOffset: 3,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.toggleBlockQuote'] = {
      isMultiline: true,
      detectRegExp: /((^|\n)>[^\S\n]*(.*?)[^\S\n]*(?=$|\n))+/gi,
      enableRegExp: /(^|\n)[^\S\n]*(.*?)[^\S\n]*(?=$|\n)/gi,
      disableRegExp: /(^|\n)>[^\S\n]+(.*?)[^\S\n]*(?=$|\n)/gi,
      enableFormat: '$1> $2',
      disableFormat: '$1$2',
      lineOffset: 0,
      characterOffset: 2,
      deselectAfter: false,
    }

    this.toggleDictionary['encounterPlusMarkdown.createLink'] = {
      isMultiline: false,
      detectRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableFormat: '[$1]()',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 3,
      deselectAfter: true,
    }

    this.toggleDictionary['encounterPlusMarkdown.createSlugLink'] = {
      isMultiline: false,
      detectRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableFormat: '[$1]()',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 3,
      deselectAfter: true,
    }

    this.toggleDictionary['encounterPlusMarkdown.createMonsterLink'] = {
      isMultiline: false,
      detectRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableFormat: '[$1](/monster/)',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 12,
      deselectAfter: true,
    }

    this.toggleDictionary['encounterPlusMarkdown.createItemLink'] = {
      isMultiline: false,
      detectRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableFormat: '[$1](/item/)',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 9,
      deselectAfter: true,
    }

    this.toggleDictionary['encounterPlusMarkdown.createSpellLink'] = {
      isMultiline: false,
      detectRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableRegExp: /(.+)/gi,
      disableRegExp: /\[(\S.*?\S)\]\((\S*?)\)/gi,
      enableFormat: '[$1](/spell/)',
      disableFormat: '$1',
      lineOffset: 0,
      characterOffset: 10,
      deselectAfter: true,
    }
  }

  /**
   * Toggles a markdown format state
   * @param editor The VS Code editor
   * @param command The toggle command issued
   */
  public toggleFormat(editor: vscode.TextEditor, command: string) {
    if (!editor || !editor.document) {
      return
    }

    let toggle = this.toggleDictionary[command]
    let document = editor.document
    let selection = editor.selection
    
    let selectionLineRanges = this.getLineSelections(document, selection)
    if (selectionLineRanges.length == 0) {
      return
    }

    if(selectionLineRanges.length == 1 && selectionLineRanges[0].isEmpty) {
      let wordSelection = this.getWordAtCursor(document, selection)
      if (!wordSelection) {
        return
      }
      selectionLineRanges = [wordSelection]
    }

    let firstSelectionText = document.getText(selectionLineRanges[0])
    let shouldEnable = !toggle.detectRegExp.test(firstSelectionText)
    let edits: vscode.TextEdit[] = []

    if (!toggle.isMultiline && selectionLineRanges.length > 1) {
      return
    } 

    selectionLineRanges.forEach(selectionLineRange => {
      let selectionText = document.getText(selectionLineRange)
      let matches: RegExpMatchArray | null
      let matchRegExp = shouldEnable ? toggle.enableRegExp : toggle.disableRegExp
      let replaceFormat = shouldEnable ? toggle.enableFormat : toggle.disableFormat
      
      matches = selectionText.match(matchRegExp)
      if (matches) {
        let lineNumber = selectionLineRange.start.line
        let startCharacter = selectionLineRange.start.character + (matches.index ?? 0)
        let endCharacter = startCharacter + matches[0].length
        let matchRange = new vscode.Range(lineNumber, startCharacter, lineNumber, endCharacter)
        let replacedText = selectionText.replace(matchRegExp, replaceFormat)
        if (command === 'encounterPlusMarkdown.createSlugLink') {
          let slugText = Slugify(selectionText, {
            lower: true,
            remove: /[*+~.()'"!:@&’]/g,
            strict: true,
          })
          let replacedTextLength = replacedText.length
          replacedText = replacedText.slice(0, replacedTextLength - 1) + slugText + replacedText.slice(replacedTextLength - 1, replacedTextLength)
        }
        edits.push(new vscode.TextEdit(matchRange, replacedText))
      }
    })

    let selections: vscode.Selection[] = []
    editor.edit(editBuilder => {
      edits.forEach(edit => {
        // Replace the text
        editBuilder.replace(edit.range, edit.newText)
        let lineDifference = shouldEnable ? toggle.lineOffset : -toggle.lineOffset
        let characterDifference = shouldEnable ? toggle.characterOffset : -toggle.characterOffset        
        
        // Modify the selection if the text changed out from under it. Do not apply the
        // selections in the editor until AFTER the edit has been made, or odd things
        // will happen
        selections = editor.selections.map( selection => {
          if(toggle.deselectAfter && shouldEnable) {
            return new vscode.Selection(
              new vscode.Position(edit.range.end.line, edit.range.end.character + characterDifference),
              new vscode.Position(edit.range.end.line, edit.range.end.character + characterDifference))
          }
          
          return new vscode.Selection(
              new vscode.Position(selection.start.line + lineDifference, selection.start.character + characterDifference),
              new vscode.Position(selection.end.line + lineDifference, selection.end.character + characterDifference))
        })        
      })
    })

    // After edit has been made, apply any new selections
    editor.selections = selections
  }

  /**
   * Gets the word that surrounds the cursor
   * @param document The document being edited 
   * @param selection The current selection
   */
  private getWordAtCursor(
    document: vscode.TextDocument,
    selection: vscode.Selection
  ): vscode.Range | undefined {
    let cursor = selection.active
    let line = document.lineAt(cursor.line)
    let lineText = line.text
    
    let wordRegExp = RegExp(/([&\*=_~`A-Za-z])+/gi)
    let match: RegExpMatchArray | null
    while (match = wordRegExp.exec(lineText)) {
      if (match.index === undefined) {
        return
      }

      let wordStartPosition = new vscode.Position(line.lineNumber, match.index)
      let wordEndPosition = new vscode.Position(line.lineNumber, wordStartPosition.character + match[0].length)

      if (cursor.character >= wordStartPosition.character && cursor.character < wordEndPosition.character) {
        return new vscode.Range(wordStartPosition, wordEndPosition)
      }
    }
    
    return undefined
  }

  /**
   * Splits the selection into an array of selections, separated
   * by any newlines that occur in the selection
   * @param document The document being edited 
   * @param selection The current selection
   */
  private getLineSelections(
    document: vscode.TextDocument,
    selection: vscode.Selection
  ): vscode.Range[] {    
    let startLine = document.lineAt(selection.start)
    let endLine = document.lineAt(selection.end)
    let textRanges: vscode.Range[] = []

    if (startLine.lineNumber === endLine.lineNumber) {
      textRanges.push(new vscode.Range(selection.start, selection.end))
      return textRanges
    }

    for (let i = startLine.lineNumber; i <= endLine.lineNumber; i++) {
      let line = document.lineAt(i)
      let selectionIntersection = selection.intersection(line.range)
      if(selectionIntersection) {
        textRanges.push(selectionIntersection)
      } 
    }

    return textRanges
  }
}
