import * as vscode from 'vscode'
import { Commands } from './Commands'

export function activate(context: vscode.ExtensionContext) {
  console.log('EncounterPlus Markdown Extension loaded.')

  context.subscriptions.push(
    vscode.commands.registerCommand('extension.buildModule', () => {
      Commands.buildModule()
    })
  )

  return {
    extendMarkdownIt(md: any) {
      return md
        .use(require('markdown-it-attrs'))
        .use(require('markdown-it-anchor'))
        .use(require('markdown-it-imsize'), { autofill: true })
    },
  }
}
