import * as Cheerio from 'cheerio'
import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Puppeteer from 'puppeteer-core'
import { pathToFileURL } from 'url'
import { Module, ModuleMode } from './Module Entities/Module'
import { ModuleEntity } from './Module Entities/ModuleEntity'
import { Page } from './Module Entities/Page'
import { Group } from './Module Entities/Group'

export class PdfExporter {
  /**
   * Exports a module to PDF (needs the chromium rendering engine already installed)
   * @param projectDirectory The project directory
   * @param transformPageLocation An optional function to transform the page's location (needed for tools like VSCode)
   */
  public static async exportToPdf(projectDirectory: string, transformPageLocation?: (path: string) => string): Promise<string> {
    let module = await Module.createModuleFromPath(projectDirectory, Path.basename(projectDirectory), ModuleMode.PrintToPDF)
    let moduleOutputPath = Path.join(projectDirectory, 'ModuleBuild')
    let customStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'custom.css')
    let globalStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'global.css')
    let printImageStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'print.css')
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

    html += `</head><body>`
    if (module.moduleProjectInfo.printCoverPath && module.moduleProjectInfo.moduleProjectPath) {
      let moduleDirectory = Path.dirname(module.moduleProjectInfo.moduleProjectPath)
      let fullImagePath = Path.join(moduleDirectory, module.moduleProjectInfo.printCoverPath)
      let coverImageData = FileSystem.readFileSync(fullImagePath).toString('base64')
      html += `<div class="print-cover-page" style="background-image: url(data:image;base64,${coverImageData})"></div>`
    }
    html += PdfExporter.getChildPageContent(module.children)
    html = PdfExporter.formatTableOfContents(html)
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
   * Modify an unordered list that is a table of contents by replacing
   * the links with the page numbers
   * @param html The current page HTML
   */
  private static formatTableOfContents(html: string): string {
    let $ = Cheerio.load(html)
    let currentPage = 1
    let anchorPageDictionary: { [anchor: string]: number } = {}

    // Use the footer-page-number elements to determine the
    // page count.
    $('.footer-page-number,a').each((i, element) => {
      let isAnchor = $(element)[0]?.tagName === 'a'
      if (isAnchor && $(element)[0].attribs['id']) {
        let anchorID = $(element)[0].attribs['id']
        anchorPageDictionary['#' + anchorID] = currentPage
      }

      let isPageNumber = $(element).hasClass('footer-page-number')
      if (isPageNumber) {
        currentPage += 1
      }
    })

    // Replace the list items in an unordered list marked as a table of contents
    // with actual item and page numbers.
    $('ul.toc').each((i, element) => {
      $(element).find('li').each((i, listElement) => {
        $(listElement).find('a').each((i, linkElement) => {
          let linkHref = linkElement.attribs['href']          
          if(!linkHref) {
            return
          }

          let pageNumber = anchorPageDictionary[linkHref]
          let linkContent = linkElement.children[0]?.data
          if(!pageNumber || !linkContent) {
            return
          }
          
          $(linkElement).replaceWith(`<span class="toc-title"><a href="${linkHref}">${linkContent}</a></span><span class="toc-page-number"><a href="${linkHref}">${pageNumber}</a></span>`)
        })
      })
    })
    return $.html()
  }

  /**
   * Gets the page content from an array of module entity children
   * @param moduleEntities The module entity children
   */
  private static getChildPageContent(moduleEntities: ModuleEntity[]): string {
    let html = ''
    moduleEntities.forEach((child) => {
      if (child instanceof Group) {
        html += `<a id="${child.slug}"></a>`
      }

      if (child instanceof Page) {
        html += `<a id="${child.slug}"></a>`
        html += child.content
      }
      html += PdfExporter.getChildPageContent(child.children)
    })
    return html
  }
}
