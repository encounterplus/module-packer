import * as vscode from 'vscode'
import { Module } from '../../shared/Module Entities/Module'
import { CommandBase } from './CommandBase'
import * as Path from 'path'

export class BuildModuleCommand extends CommandBase {

  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage = 'Building EncounterPlus Module...'

  /**
   * Contains execution code for the command
   */
  protected async executeCommand() {

    // Ensure we have a proper project path
    let projectPath = vscode.workspace.rootPath
    if (projectPath === undefined) {
      throw Error('Could not locate module project path.')
    }

    let module = await Module.createModuleFromPath(
      projectPath,
      Path.basename(projectPath)
    )
    
    let completeMessage = `Successfully created module: ${module.moduleProjectInfo.name}.`
    vscode.window
      .showInformationMessage(completeMessage, 'View Module File')
      .then((selection) => {
        if (module.moduleArchivePath) {
          let archiveURI = vscode.Uri.file(module.moduleArchivePath)
          vscode.commands.executeCommand('revealFileInOS', archiveURI)
        }
      })
  }
}