import * as vscode from 'vscode'
import * as Path from 'path'
import { Module } from '../../shared/Module Entities/Module'
import { CommandBase } from './CommandBase'
import { ModuleProject } from '../../shared/ModuleProject'

export class BuildModuleCommand extends CommandBase {

  /** The module project that will be built */
  private moduleProject: ModuleProject | undefined = undefined

  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage = 'Building EncounterPlus Module...'

  /**
   * Starts a module project building
   * @param moduleProject The module project to build
   */
  async startModuleBuild(moduleProject: ModuleProject) {
    this.moduleProject = moduleProject
    this.startCommand()
  }

  /**
   * Contains execution code for the command
   */
  protected async executeCommand() {
    let moduleProjectPath = this.moduleProject?.moduleProjectPath

    // Ensure we have a proper project path
    if (moduleProjectPath === undefined) {
      throw Error('Could not locate module project path.')
    }

    let projectDirectory = Path.dirname(moduleProjectPath)
    let module = await Module.createModuleFromPath(projectDirectory, Path.basename(projectDirectory))

    let completeMessage = `Successfully created module: ${module.moduleProjectInfo.name}.`
    vscode.window.showInformationMessage(completeMessage, 'View Module File').then((selection) => {
      if (module.moduleArchivePath) {
        let archiveURI = vscode.Uri.file(module.moduleArchivePath)
        vscode.commands.executeCommand('revealFileInOS', archiveURI)
      }
    })
  }
}
