import * as vscode from 'vscode'
import * as Path from 'path'
import { CommandBase } from './CommandBase'
import { PdfExporter } from '../../shared/PdfExporter'
import { ModuleProject } from '../../shared/ModuleProject'

export class ExportToPdfCommand extends CommandBase {

  /** The module project that will be exported to PDF */
  private moduleProject: ModuleProject | undefined = undefined

  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage = 'Exporting Module to PDF...'

  /**
   * Starts a module project exporting to PDF
   * @param moduleProject The module project to export to PDF
   */
  async startModuleExport(moduleProject: ModuleProject) {
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
 
    vscode.window.showInformationMessage(`Beginning export of "${this.moduleProject?.name}" to PDF`)
    await PdfExporter.installChromiumForRendering(this.onBrowserDownload)    
    let pdfPath = await PdfExporter.exportToPdf(projectDirectory, (path) => {
      return vscode.Uri.file(path).toString()
    })

    let completeMessage = `Successfully exported module to PDF.`
    vscode.window
      .showInformationMessage(completeMessage, 'Open PDF Location')
      .then((selection) => {
        if (selection !== 'Open PDF Location') {
          return
        }

        if (pdfPath) {
          let archiveURI = vscode.Uri.file(pdfPath)
          vscode.commands.executeCommand('revealFileInOS', archiveURI)
        }
      })
  }

  /**
   * Handles browser download progress changes
   * @param progress The percent progress of the download (1.5 = 1.5%)
   */
  private onBrowserDownload(progress: number) {    
    if(progress === 0) {
      vscode.window.showInformationMessage('[EncounterPlus Markdown] Installing Chromium for PDF rendering...')
      vscode.window.setStatusBarMessage('Installing Chromium PDF engine...', 1000)
    }

    vscode.window.setStatusBarMessage(`Downloading PDF engine: ${progress.toFixed(1)}%`, 1000)
  }
}
