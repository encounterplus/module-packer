import * as vscode from 'vscode'
import { Module } from '../shared/Module Entities/Module'
import * as Path from 'path'

export class Commands {
  static isBuildingModule: boolean = false

  /**
   * Previews a Markdown Page (this method is a work in progress)
   * @param context The VS Code context
   */
  static async previewModulePage(context: vscode.ExtensionContext) {
    let path = vscode.window.activeTextEditor?.document.uri.path
    if (!path) {
      return
    }

    const resourceRoots: vscode.Uri[] = []
    const workspaceRoots = vscode.workspace.workspaceFolders?.map(folder => folder.uri)
    if (workspaceRoots) {
      resourceRoots.push(...workspaceRoots)
    }    
    resourceRoots.push(vscode.Uri.file(Path.dirname(path)))
    resourceRoots.push(vscode.Uri.file(Path.join(context.extensionPath, 'assets', 'css')))
    resourceRoots.push(vscode.Uri.file(Path.join(context.extensionPath, 'assets', 'img')))
    resourceRoots.push(vscode.Uri.file(Path.join(context.extensionPath, 'assets', 'font')))
    resourceRoots.push(vscode.Uri.file(Path.join(context.extensionPath, 'assets', 'js')))
    
    let panel = vscode.window.createWebviewPanel(
      'encounterpluspreview',
      'EncounterPlus Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: resourceRoots,
      }
    )

    let pages = Module.processFile(path)
    if (pages.length > 0) {
      let globalStyleLocation = panel.webview.asWebviewUri(
        vscode.Uri.file(
          Path.join(context.extensionPath, 'assets', 'css', 'global.css')
        )
      )
      let customStyleLocation = panel.webview.asWebviewUri(
        vscode.Uri.file(
          Path.join(context.extensionPath, 'assets', 'css', 'custom.css')
        )
      )

      panel.webview.html = `<!DOCTYPE html><html lang="en"><head>`
      panel.webview.html = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${panel.webview.cspSource} https:; script-src ${panel.webview.cspSource}; style-src ${panel.webview.cspSource};" />`
      panel.webview.html += `<link rel="stylesheet" href="${globalStyleLocation}"><link rel="stylesheet" href="${customStyleLocation}">`
      panel.webview.html += `</head><body>`
      pages.forEach(page => {
        panel.webview.html += page.content
        panel.webview.html += "<br><br><br>"
      })
      panel.webview.html += '</body></html>'
    }
  }

  /** Builds an EncounterPlus Module from the workspace root directory */
  static async buildModule() {
    // Allow only 1 build to occur at a time
    if (Commands.isBuildingModule) {
      return
    }

    // Create a status bar item to show building
    let statusBarMessage = vscode.window.setStatusBarMessage(
      'Building EncounterPlus Module...'
    )
    try {
      Commands.isBuildingModule = true

      // Ensure we have a proper project path
      let projectPath = vscode.workspace.rootPath ?? ''
      if (projectPath === '') {
        Commands.isBuildingModule = false
        statusBarMessage.dispose()
        return
      }

      let module = await Module.createModuleFromPath(
        projectPath,
        Path.basename(projectPath)
      )
      let completeMessage = `Successfully created module: ${module.name}.`
      vscode.window
        .showInformationMessage(completeMessage, 'View Module File')
        .then((selection) => {
          if (module.moduleArchivePath) {
            let archiveURI = vscode.Uri.file(module.moduleArchivePath)
            vscode.commands.executeCommand('revealFileInOS', archiveURI)
          }
        })
      console.log(completeMessage)
      Commands.isBuildingModule = false
      statusBarMessage.dispose()
    } catch (error) {
      let errorMessage = (error as Error).message
      vscode.window.showErrorMessage(errorMessage)
      console.error(errorMessage)
      Commands.isBuildingModule = false
      statusBarMessage.dispose()
    }
  }
}
