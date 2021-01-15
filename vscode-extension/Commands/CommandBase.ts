import * as vscode from 'vscode'
import * as Logger from 'winston'

export abstract class CommandBase {
  // ---------------------------------------------------------------
  // Private Fields
  // ---------------------------------------------------------------

  /**
   * A flag to indicate if a command is already running - only allow
   * one command to be executed at a time.
   */
  private static isRunningCommand: boolean = false

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage: string | undefined = undefined

  /**
   * If specified, this will be displayed as an info
   * message whtn the command succeeds.
   */
  successMessage: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public & Protected Methods
  // ---------------------------------------------------------------

  /**
   * Starts a command execution
   */
  async startCommand() {
    // Allow only 1 command to occur at a time
    if (CommandBase.isRunningCommand) {
      return
    }

    CommandBase.isRunningCommand = true

    // Create a status bar item message
    let statusBarMessage: vscode.Disposable | undefined = undefined
    if (this.statusMessage !== undefined) {
      Logger.info(this.statusMessage)
      statusBarMessage = vscode.window.setStatusBarMessage(this.statusMessage)
    }

    try {
      CommandBase.isRunningCommand = true

      await this.executeCommand()

      if (this.successMessage !== undefined) {
        Logger.info(this.successMessage)
        vscode.window.showInformationMessage(this.successMessage)
      }

      statusBarMessage?.dispose()
      CommandBase.isRunningCommand = false
    } catch (error) {
      let errorMessage = (error as Error).message
      vscode.window.showErrorMessage(errorMessage)
      Logger.error(`${errorMessage}\nStack: \n${(error as Error).stack}`)
      statusBarMessage?.dispose()
      CommandBase.isRunningCommand = false
    }
  }

  /**
   * Contains execution code for the command
   */
  protected abstract executeCommand(): Promise<void>
}
