import * as vscode from 'vscode'
import { Module } from '../../shared/Module Entities/Module'
import { CommandBase } from './CommandBase'
import * as Path from 'path'
import * as FileSystem from 'fs-extra'
import * as Puppeteer from 'puppeteer-core'

export class ExportToPdfCommand extends CommandBase {
  /**
   * If specified, this will be displayed in the status bar
   * as the command executes
   */
  statusMessage = 'Exporting Module to PDF...'

  /**
   * Contains execution code for the command
   */
  protected async executeCommand() {
    await this.installChromiumIfNeeded()
    let projectPath = vscode.workspace.rootPath
    if (projectPath === undefined) {
      throw Error('Could not locate module project path.')
    }

    let module = await Module.createModuleFromPath(projectPath, Path.basename(projectPath))
    let moduleOutputPath = Path.join(projectPath, 'ModuleBuild')
    let customStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'custom.css')
    let globalStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'global.css')
    let pageLocation = Path.join(moduleOutputPath, 'printPage.html')
    let saveLocation = Path.join(projectPath, `${module.slug}.pdf`)

    let html = `<!DOCTYPE html><html lang="en"><head>`
    html += `<link rel="stylesheet" href="${globalStyleLocation}"><link rel="stylesheet" href="${customStyleLocation}">`

    let options = {
      headless: true,
      executablePath: Puppeteer.executablePath(),
      args: ['--lang=' + vscode.env.language, '--no-sandbox', '--disable-setuid-sandbox'],
    }
    const browser = await Puppeteer.launch(options)
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
    module.pages.forEach((page) => {
      html += '<div class="printbg"><div class="innerprint">'
      html += page.content
      html += '</div></div>'
      html += '<p style="page-break-before: always">'
    })
    html += `</head><body>`
    FileSystem.writeFileSync(pageLocation, html)

    await page.goto(vscode.Uri.file(pageLocation).toString(), {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    })
    FileSystem.writeFileSync(saveLocation, pdf)
    await browser.close()

    let completeMessage = `Successfully exported module: ${module.name}.`
    vscode.window
      .showInformationMessage(completeMessage, 'Open PDF Location')
      .then((selection) => {
        if (module.moduleArchivePath) {
          let archiveURI = vscode.Uri.file(module.moduleArchivePath)
          vscode.commands.executeCommand('revealFileInOS', archiveURI)
        }
      })
  }

  /** Installs the Chromium engine to render the PDF if needed */
  private async installChromiumIfNeeded() {
    try {
      if (FileSystem.existsSync(Puppeteer.executablePath())) {
        return
      }

      vscode.window.showInformationMessage('[EncounterPlus Markdown] Installing Chromium for PDF rendering...')
      var statusbarmessage = vscode.window.setStatusBarMessage('Installing Chromium PDF engine...')

      const https_proxy = vscode.workspace.getConfiguration('http')['proxy'] || ''
      if (https_proxy) {
        process.env.HTTPS_PROXY = https_proxy
        process.env.HTTP_PROXY = https_proxy
      }

      // Download Chromium
      const browserFetcher = Puppeteer.createBrowserFetcher()
      let revisionInfo = await browserFetcher.download('756035', this.onBrowserDownload)
      let localRevisions = await browserFetcher.localRevisions()
      console.log('Chromium downloaded to ' + revisionInfo.folderPath)

      // Remove any older versions
      const cleanupOldVersions = await localRevisions.map(async (revision) => {
        await browserFetcher.remove(revision)
      })

      if (FileSystem.existsSync(Puppeteer.executablePath())) {
        statusbarmessage.dispose()
        vscode.window.setStatusBarMessage('PDF engine installation succeeded.', 3000)
        vscode.window.showInformationMessage('PDF engine installation succeeded.')
        return Promise.all(cleanupOldVersions)
      }
    } catch (error) {
      console.log(error.message)
      throw Error(`PDF engine installation failed: ${error.Message}`)
    }
  }

  /**
   * Handles browser download progress changes
   * @param downloadBytes The number of bytes downloaded
   * @param totalBytes The total bytes for the download
   */
  private onBrowserDownload(downloadBytes: number, totalBytes: number) {
    const progress = (downloadBytes / totalBytes) * 100.0
    vscode.window.setStatusBarMessage(`Downloading PDF engine: ${progress}`, 1000)
  }
}
