import * as vscode from 'vscode'
import { Module } from '../shared/Module Entities/Module'
import * as Path from 'path'

export class Commands {

  static isBuildingModule: boolean = false

  /** Builds an EncounterPlus Module from the workspace root directory */
  static async buildModule() {
    
    // Allow only 1 build to occur at a time
    if (Commands.isBuildingModule) {
      return
    }

    // Create a status bar item to show building
    let statusBarMessage = vscode.window.setStatusBarMessage('Building EncounterPlus Module...')
    try {      
      Commands.isBuildingModule = true

      // Ensure we have a proper project path
      let projectPath = vscode.workspace.rootPath ?? ''
      if(projectPath === '') {
        Commands.isBuildingModule = false
        statusBarMessage.dispose()
        return
      }

      let module = await Module.createModuleFromPath(projectPath, Path.basename(projectPath))
      let completeMessage = `Successfully created module: ${module.name}.`
      vscode.window
        .showInformationMessage(completeMessage, 'View Module File')
        .then(selection => {
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
