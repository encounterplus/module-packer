import * as vscode from 'vscode'
import * as glob from 'glob'
import { BuildModuleCommand } from './Commands/BuildModuleCommand'
import { CreateModuleJsonCommand } from './Commands/CreateModuleJsonCommand'
import { ExportToPdfCommand } from './Commands/ExportToPdfCommand'
import { MarkdownToggler } from './Commands/MarkdownToggler'

const buildModuleCommand = new BuildModuleCommand()
const createModuleJsonCommand = new CreateModuleJsonCommand()
const exportToPdfCommand = new ExportToPdfCommand()

export function activate(context: vscode.ExtensionContext) {
  console.log('EncounterPlus Markdown Extension loaded.')

  glob(vscode.workspace.rootPath + '/**/*.md', {}, (error, matches) => {
    if (matches && matches.length > 0) {
      vscode.commands.executeCommand('setContext', 'projectHasMarkdown', true)
    }
  })

  let markdownToggler = new MarkdownToggler()
  let toggles = markdownToggler.toggleDictionary
  for (const command in toggles) {
    vscode.commands.registerTextEditorCommand(command, textEditor => {
      markdownToggler.toggleFormat(textEditor, command)
    })
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.buildModule', () => {
      buildModuleCommand.startCommand()
    })
  )

  context.subscriptions.push(    
    vscode.commands.registerCommand('encounterPlusMarkdown.createModuleJson', () => {
      createModuleJsonCommand.startCommand()
    })
  )

  context.subscriptions.push(    
    vscode.commands.registerCommand('encounterPlusMarkdown.exportModuleToPDF', () => {
      exportToPdfCommand.startCommand()
    })
  )

  return {
    extendMarkdownIt(md: any) {
      return md
        .use(require('markdown-it-anchor'))
        .use(require('markdown-it-attrs'))
        .use(require('markdown-it-decorate'))
        .use(require('markdown-it-imsize'), { autofill: true })
        .use(require('markdown-it-mark'))
        .use(require('markdown-it-multimd-table'))        
        .use(require('markdown-it-sub'))
        .use(require('markdown-it-sup'))
        .use(require('markdown-it-underline'))
    },
  }
}
