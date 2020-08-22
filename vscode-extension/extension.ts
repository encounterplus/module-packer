import * as vscode from 'vscode'
import * as glob from 'glob'
import * as Markdown from 'markdown-it'
import * as FileSystem from 'fs-extra'
import * as Logger from 'winston'
import * as Transport from 'winston-transport'
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
  const vsCodeLogger = new VSCodeLogger()
  Logger.add(vsCodeLogger)
  Logger.info('EncounterPlus Markdown Extension loaded.')

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
      if (!FileSystem.existsSync(pagePath)) { 
        return 
      }
      let uri = vscode.Uri.file(pagePath)
      let doc = await vscode.workspace.openTextDocument(uri)
      vscode.window.showTextDocument(doc, vscode.ViewColumn.One)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.openModuleProjectFile', async (moduleProjectPath) => {
      if (!FileSystem.existsSync(moduleProjectPath)) { 
        return 
      }
      let uri = vscode.Uri.file(moduleProjectPath)
      let doc = await vscode.workspace.openTextDocument(uri)
      vscode.window.showTextDocument(doc, vscode.ViewColumn.One)
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('encounterPlusMarkdown.openGroupFile', async (groupFilePath) => {
      if (!FileSystem.existsSync(groupFilePath)) { 
        return 
      }
      let uri = vscode.Uri.file(groupFilePath)
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
        Logger.error(error.message)
        throw error
      }
    },
  }
}

/**
 * A simple logger transport for directing 
 * Winston logs to VS Code output.
 */
export class VSCodeLogger extends Transport {
  
  /** The output channel for the module packer */
  modulePackerOuput: vscode.OutputChannel = vscode.window.createOutputChannel('Encounter+ Module Packer')

  /**
   * Processes a log message
   * @param info The log info
   * @param callback The log callback
   */
  log(info: any, callback: any) {
    setImmediate(() => {
      setImmediate(() => this.emit("logged", info))
    })

    this.modulePackerOuput.show()
    this.modulePackerOuput.appendLine(`${info['level']}: ${info['message']}`)

    if (callback) {
      callback()
    }
  }
}