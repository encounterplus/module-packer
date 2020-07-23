import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'url'
import { Module } from './Module Entities/Module'
import { ModuleEntity } from './Module Entities/ModuleEntity'
import { Page } from './Module Entities/Page'

export class PdfExporter {
  /**
   * Exports a module to PDF (needs the chromium rendering engine already installed)
   * @param projectDirectory The project directory
   * @param transformPageLocation An optional function to transform the page's location (needed for tools like VSCode)
   */
  public static async exportToPdf(
    projectDirectory: string,
    transformPageLocation?: (path: string) => string
  ): Promise<string> {
    let module = await Module.createModuleFromPath(projectDirectory, Path.basename(projectDirectory), true)
    let moduleOutputPath = Path.join(projectDirectory, 'ModuleBuild')
    let customStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'custom.css')
    let globalStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'global.css')
    let printImageStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'print-img.css')
    let pageLocation = Path.join(moduleOutputPath, 'printPage.html')
    let saveLocation = Path.join(projectDirectory, `${module.moduleProjectInfo.slug}.pdf`)

    let html = `<!DOCTYPE html><html lang="en"><head>`
    html += `<link rel="stylesheet" href="${globalStyleLocation}">`
    html += `<link rel="stylesheet" href="${printImageStyleLocation}">`
    html += `<link rel="stylesheet" href="${customStyleLocation}">`

    let options = {
      headless: true,
      executablePath: Puppeteer.executablePath(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
    const browser = await Puppeteer.launch(options)
    const page = await browser.newPage()

    html += PdfExporter.getChildPageContent(module.children)
    html += `</head><body>`
    FileSystem.writeFileSync(pageLocation, html)

    if (transformPageLocation) {
      pageLocation = transformPageLocation(pageLocation)
    } else {
      pageLocation = pathToFileURL(pageLocation).toString()
    }

    await page.goto(pageLocation, {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
    })
    FileSystem.writeFileSync(saveLocation, pdf)
    await browser.close()
    return saveLocation
  }

  /**
   * Installs the Chromium engine to render the PDF if needed
   * @param downloadProgressChanged A callback to handle the download progress changing
   */
  public static async installChromiumForRendering(downloadProgressChanged?: (progress: number) => void) {
    try {
      if (FileSystem.existsSync(Puppeteer.executablePath())) {
        return
      }

      if (downloadProgressChanged) {
        downloadProgressChanged(0)
      }

      // Download Chromium
      const desiredRevision = '756035'
      const browserFetcher = Puppeteer.createBrowserFetcher()
      let revisionInfo = await browserFetcher.download(desiredRevision, (downloadBytes, totalBytes) => {
        const progress = (downloadBytes / totalBytes) * 100.0
        if (downloadProgressChanged) {
          downloadProgressChanged(progress)
        }
      })
      let localRevisions = await browserFetcher.localRevisions()
      console.log('Chromium downloaded to ' + revisionInfo.folderPath)

      // Remove any older versions
      const cleanupOldVersions = await localRevisions.map(async (revision) => {
        if (revision !== desiredRevision) {
          await browserFetcher.remove(revision)
        }
      })

      if (FileSystem.existsSync(Puppeteer.executablePath())) {
        return Promise.all(cleanupOldVersions)
      }
    } catch (error) {
      console.log(error.message)
      throw Error(`PDF engine installation failed: ${error.Message}`)
    }
  }

  /**
   * Gets the page content from an array of module entity children
   * @param moduleEntities The module entity children
   */
  private static getChildPageContent(moduleEntities: ModuleEntity[]): string {
    let html = ''
    moduleEntities.forEach((child) => {
      if (child instanceof Page) {
        html += child.content
      }
      html += PdfExporter.getChildPageContent(child.children)
    })
    return html
  }

}
