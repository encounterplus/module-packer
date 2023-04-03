import * as vscode from 'vscode'
import * as Markdown from 'markdown-it'
import * as FileSystem from 'fs-extra'
import * as Logger from 'winston'
import * as Path from 'path'
import Slugify from 'slugify'
import * as Transport from 'winston-transport'
import { BuildModuleCommand } from './Commands/BuildModuleCommand'
import { CreateModuleProjectFileCommand } from './Commands/CreateModuleProjectFileCommand'
import { ExportToPdfCommand } from './Commands/ExportToPdfCommand'
import { MarkdownToggler } from './Commands/MarkdownToggler'
import { ModuleProjectProvider, ModuleTreeItem } from './TreeViewProviders/ModuleProjectProvider'
import { MarkdownRenderer } from '../shared/MarkdownRenderer'
import { Module } from '../shared/Module Entities/Module'

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

    // Open Page
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

    // Open Module Project File
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

    // Open Group File
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

    // Markdown Toggler
    let markdownToggler = new MarkdownToggler()
    let toggles = markdownToggler.toggleDictionary
    for (const command in toggles) {
      vscode.commands.registerTextEditorCommand(command, (textEditor) => {
        markdownToggler.toggleFormat(textEditor, command)
      })
    }

    // Build Module
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.buildModule', async (moduleTreeItem) => {
        Module.scanForBrokenLinks = vscode.workspace.getConfiguration().get('encounterPlusMarkdown.scanForBrokenLinks') ?? false
        if (moduleTreeItem !== undefined) {
          buildModuleCommand.startModuleBuild(moduleTreeItem.module.moduleProjectInfo)
        } else { // If no module selected, build the first module
          moduleProjectProvider.refresh()
          let moduleItems = await moduleProjectProvider.getChildren()
          let firstModuleItem = moduleItems[0] as ModuleTreeItem
          if (firstModuleItem !== undefined) {
            buildModuleCommand.startModuleBuild(firstModuleItem.module.moduleProjectInfo)
          }          
        }
      })
    )

    // Create Module Project File
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createModuleProjectFile', () => {
        createModuleProjectFileCommand.startCommand()
      })
    )

    // Export Module to PDF
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.exportModuleToPDF', async (moduleTreeItem) => {
        Module.scanForBrokenLinks = vscode.workspace.getConfiguration().get('encounterPlusMarkdown.scanForBrokenLinks') ?? false
        if (moduleTreeItem !== undefined) {
          exportToPdfCommand.startModuleExport(moduleTreeItem.module.moduleProjectInfo)
        } else { // If no module selected, build the first module
          moduleProjectProvider.refresh()
          let moduleItems = await moduleProjectProvider.getChildren()
          let firstModuleItem = moduleItems[0] as ModuleTreeItem
          if (firstModuleItem !== undefined) {
            exportToPdfCommand.startModuleExport(firstModuleItem.module.moduleProjectInfo)
          }          
        }        
      })
    )

    // Create Page Stub
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createPageStub', (moduleTreeItem) => {
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `---\nname:\nslug:\norder:\nparent:\nmodule-pagebreaks:\npdf-pagebreaks:\nfooter:\nhide-footer: false\nhide-footer-text: false\ninclude-in: all\ncover:\nprint-cover-only: false\n---`
        let insertPosition = editor.selection.end
        editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, insertText)
        })
      })
    )

    // Create Group Stub
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createGroupStub', (moduleTreeItem) => {
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `---\nname:\nslug:\norder:\nparent:\ninclude-in: all\ncopy-files: true\n---`
        let insertPosition = editor.selection.end
        editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, insertText)
        })
      })
    )

    // Create Monster Stub
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createMonsterStub', (moduleTreeItem) => {
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Monster\nname:\nslug:\nsize:\ntype:\nalignment:\nac:\nhp:\nspeed:\nstr:\ndex:\ncon:\nint:\nwis:\ncha:\nsaves:\nskills:\nvulnerabilities:\nresistances:\ndamageImmunities:\nconditionImmunities:\nsenses:\nlanguages:\nchallenge:\nenvironments:\ntraits:\n  - name:\n    description: ""\nactions:\n  - name:\n    description: ""\nbonus-actions:\n  - name:\n    description: ""\nreactions:\n  - name:\n    description: ""\nlegendary-actions:\n  - description: ""\n  - name:\n    description: ""\nmythic-actions:\n  - description: ""\n  - name:\n    description: ""\nimage:\ntoken:\ncolumn-after: traits\ncolumn-after-property:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, insertText)
        })
      })
    )

    // Create Item Stub
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createItemStub', (moduleTreeItem) => {
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Item\nname:\nslug:\ntype:\nrarity:\nattunement:\nprimaryDamage:\nsecondaryDamage:\nproperties:\n  - \ndamageType:\ndescription: ""\nvalue:\nsource:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, insertText)
        })
      })
    )

    // Create Spell Stub
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.createSpellStub', (moduleTreeItem) => {
        let editor = vscode.window.activeTextEditor
        if (editor === undefined) {
          return
        }
        let insertText = `\`\`\`Spell\nname:\nslug:\nlevel:\nschool:\nritual:\ntime:\nrange:\ncomponents:\nduration:\ndescription: ""\nclasses:\nimage:\nsource:\n\`\`\``
        let insertPosition = editor.selection.end
        editor.edit((editBuilder) => {
          editBuilder.insert(insertPosition, insertText)
        })
      })
    )

    // Paste as a slug
    context.subscriptions.push(
      vscode.commands.registerCommand('encounterPlusMarkdown.slugPaste', (documentTreeItem) => {
        vscode.env.clipboard.readText().then((clipboardText) => {
          let editor = vscode.window.activeTextEditor
          if (editor === undefined) {
            return
          }

          let insertText = Slugify(clipboardText, {
            lower: true,
            remove: /[*+~.()'"!:@&’]/g,
            strict: true
          })
          let selection = editor.selection
          editor.edit((editBuilder) => {
            editBuilder.replace(selection, insertText)
          })
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
  } catch (error: any) {
    let errorMessage = (error as Error).message
    Logger.error(`${errorMessage}\nStack: \n${(error as Error).stack}`)
    throw error
  }

  return {
    extendMarkdownIt(md: Markdown) {
      try {
        let renderer = new MarkdownRenderer(false)
        return renderer.getRenderer()
      } catch (error: any) {
        Logger.error((error as Error).message)
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
