import * as vscode from 'vscode'
import * as Markdown from 'markdown-it'
import * as FileSystem from 'fs-extra'
import * as Logger from 'winston'
import * as Path from 'path'
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

  try {
    let workspacePath = VSCodeUtilities.getPrimaryWorkspaceFolderPath()
    if (workspacePath === undefined) {
      return
    }

    let moduleProjectProvider = new ModuleProjectProvider(workspacePath)
    vscode.window.registerTreeDataProvider('encounter-plus-modules', moduleProjectProvider)
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.refreshModules', () => moduleProjectProvider.refresh())
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.openPage', async (pagePath, pageName) => {
        if (!FileSystem.existsSync(pagePath)) {
          return
        }
        let uri = vscode.Uri.file(`${pagePath}`)
        let doc = await vscode.workspace.openTextDocument(uri)

        let docText = doc.getText()
        let lineNumber = 0
        let headerIndex = docText.indexOf(`# ${pageName}`)
        if (headerIndex != -1) {
          let textToHeader = docText.substring(0, headerIndex)
          lineNumber = textToHeader.split('\n').length - 1
        }       
        
        let openPosition = new vscode.Position(lineNumber, 0)
        let openRange = new vscode.Range(openPosition, openPosition)
        let showOptions = {
          viewColumn: vscode.ViewColumn.One,
          preserveFocus: false,
          preview: false,
          selection: openRange,
        }
        vscode.window.showTextDocument(doc, showOptions)
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
        buildModuleCommand.startModuleBuild(moduleTreeItem.module.moduleProjectInfo)
      })
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createModuleProjectFile', () => {
        createModuleProjectFileCommand.startCommand()
      })
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.exportModuleToPDF', (moduleTreeItem) => {
        exportToPdfCommand.startModuleExport(moduleTreeItem.module.moduleProjectInfo)
      })
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createMonsterStub', (moduleTreeItem) => {       
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Monster\nname:\nslug:\nsize:\ntype:\nalignment:\nac:\nhp:\nspeed:\nstr:\ndex:\ncon:\nint:\nwis:\ncha:\nsaves:\nskills:\nvulnerabilities:\nresistances:\ndamageImmunities:\nconditionImmunities:\nsenses:\nlanguages:\nchallenge:\nenvironments:\nimage:\ntoken:\ntraits:\n  - name:\n    description:\nactions:\n  - name:\n    description:\nreactions:\n  - name:\n    description:\nlegendaryActions:\n  - description:\n  - name:\n    description:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit(editBuilder => {
          editBuilder.insert(insertPosition, insertText)
        })        
      })
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createItemStub', (moduleTreeItem) => {       
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Item\nname:\nslug:\ntype:\nattunement:\nprimaryDamage:\nsecondaryDamage:\nproperties:\n  - \ndamageType:\ndescription:\nvalue:\nsource:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit(editBuilder => {
          editBuilder.insert(insertPosition, insertText)
        })        
      })
    )

    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createSpellStub', (moduleTreeItem) => {       
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Spell\nname:\nslug:\nlevel:\nschool:\nritual:\ntime:\nrange:\ncomponents:\nduration:\ndescription:\nclasses:\nimage:\nsource:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit(editBuilder => {
          editBuilder.insert(insertPosition, insertText)
        })        
      })
    )

    vscode.workspace.onDidCreateFiles((event: vscode.FileCreateEvent) => {
      moduleProjectProvider.refresh()
    })

    vscode.workspace.onDidDeleteFiles((event: vscode.FileDeleteEvent) => {
      moduleProjectProvider.refresh()
    })

    vscode.workspace.onDidRenameFiles((event: vscode.FileRenameEvent) => {
      moduleProjectProvider.refresh()
    })

    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      let extension = Path.extname(document.fileName)
      if (extension === '.md' || extension === '.yaml') {
        moduleProjectProvider.refresh()
      }
    })
  } catch (error) {
    let errorMessage = (error as Error).message
    Logger.error(`${errorMessage}\nStack: \n${(error as Error).stack}`)
    throw error
  }

  return {
    extendMarkdownIt(md: Markdown) {
      try {
        let renderer = new MarkdownRenderer(false)
        return renderer.getRenderer()
      } catch (error) {
        Logger.error(error.message)
        throw error
      }
    },
  }
}

export class VSCodeUtilities {
  /** Gets the first workspace folder path */
  static getPrimaryWorkspaceFolderPath(): string | undefined {
    if (vscode.workspace.workspaceFolders === undefined) {
      return undefined
    }
    return vscode.workspace.workspaceFolders[0].uri.fsPath
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
      setImmediate(() => this.emit('logged', info))
    })

    this.modulePackerOuput.show()
    if (info['level'] !== 'info') {
      this.modulePackerOuput.appendLine(`${info['level']}: ${info['message']}`)
    } else {
      this.modulePackerOuput.appendLine(`${info['message']}`)
    }

    if (callback) {
      callback()
    }
  }
}
