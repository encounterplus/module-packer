import * as vscode from 'vscode'
import { Module } from '../../shared/Module Entities/Module'
import { CommandBase } from './CommandBase'
import * as Path from 'path'
import * as FileSystem from 'fs-extra'
import { v4 as UUIDV4 } from 'uuid'

export class CreateModuleJsonCommand extends CommandBase {

  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage = 'Creating Module.json...'

  /**
   * If specified, this will be displayed as an info
   * message whtn the command succeeds.
   */
  successMessage = 'Module.json created successfully.'

  /**
   * Contains execution code for the command
   */
  protected async executeCommand() {
    let projectPath = vscode.workspace.rootPath
    if (projectPath === undefined) {
      throw Error('Could not locate module project path.')
    }

        // See if a module.json file already exists
    let moduleJsonPath = Path.join(projectPath, 'module.json')
    if (FileSystem.existsSync(moduleJsonPath)) {
      throw Error('Module.json already exists.')
    }

    // Show an input box to get the module name from the user
    let inputBoxOptions = {
      prompt: 'Module Name',
      placeholder: 'My Module',
    }

    let moduleName = await vscode.window.showInputBox(inputBoxOptions)   
    
    // Check module path again in case it was deleted
    // while we were waiting for user input
    if (FileSystem.existsSync(moduleJsonPath)) {
      throw Error('Module.json already exists.')
    }

    if (moduleName === undefined) {
      throw Error('Invalid Module.json name.')
    }

    // Format module.json data
    let moduleJsonOutput = {
      id: UUIDV4(),
      name: moduleName,
      slug: Module.sanitizeSlug(moduleName),
      description: 'TBD',
      category: 'adventure',
      author: 'Anonymous',
      code: 'TBD',
      cover: 'cover.jpg',
      version: 1,
      autoIncrementVersion: true,
    }

    // Write module.json
    let outputJson = JSON.stringify(moduleJsonOutput, null, 2)
    FileSystem.writeFileSync(moduleJsonPath, outputJson)
  }
}