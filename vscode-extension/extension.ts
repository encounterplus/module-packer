import * as vscode from 'vscode'
import * as glob from 'glob'
import * as Markdown from 'markdown-it'
import { BuildModuleCommand } from './Commands/BuildModuleCommand'
import { CreateModuleProjectFileCommand } from './Commands/CreateModuleProjectFileCommand'
import { ExportToPdfCommand } from './Commands/ExportToPdfCommand'
import { MarkdownToggler } from './Commands/MarkdownToggler'
import { ModuleProjectProvider } from './TreeViewProviders/ModuleProjectProvider'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'

const buildModuleCommand = new BuildModuleCommand()
const createModuleProjectFileCommand = new CreateModuleProjectFileCommand()
const exportToPdfCommand = new ExportToPdfCommand()

export function activate(context: vscode.ExtensionContext) {
  console.log('EncounterPlus Markdown Extension loaded.')

  if (vscode.workspace.rootPath === undefined) {
    return
  }

  glob(vscode.workspace.rootPath + '/**/*.md', {}, (error, matches) => {
    if (matches && matches.length > 0) {
      vscode.commands.executeCommand('setContext', 'projectHasMarkdown', true)
    }
  })

  let moduleProjectProvider = new ModuleProjectProvider(vscode.workspace.rootPath)
  vscode.window.registerTreeDataProvider('encounter-plus-modules', moduleProjectProvider)
  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.refreshModules', () => moduleProjectProvider.refresh())
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.openPage', async (pagePath) => {
      let uri = vscode.Uri.file(pagePath)
      let doc = await vscode.workspace.openTextDocument(uri)
      vscode.window.showTextDocument(doc, vscode.ViewColumn.One)
    })
  )

  let markdownToggler = new MarkdownToggler()
  let toggles = markdownToggler.toggleDictionary
  for (const command in toggles) {
    vscode.commands.registerTextEditorCommand(command, (textEditor) => {
      markdownToggler.toggleFormat(textEditor, command)
    })
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.buildModule', (moduleTreeItem) => {
      buildModuleCommand.startModuleBuild(moduleTreeItem.moduleProject)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.createModuleProjectFile', () => {
      createModuleProjectFileCommand.startCommand()
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.exportModuleToPDF', (moduleTreeItem) => {
      exportToPdfCommand.startModuleExport(moduleTreeItem.moduleProject)
    })
  )

  return {
    extendMarkdownIt(md: Markdown) {
      try {
        let renderer = new MarkdownRenderer(false)
        return renderer.getRenderer()
      } catch(error) {
        console.error(error.message)
        throw error
      }
    },
  }
}
