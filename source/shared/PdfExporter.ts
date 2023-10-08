import * as Cheerio from 'cheerio'
import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as PdfLib from 'pdf-lib'
import * as Puppeteer from 'puppeteer-core'
import * as Logger from 'winston'
import { pathToFileURL } from 'url'
import { Module, ModuleMode } from './Module Entities/Module'
import { ModuleEntity } from './Module Entities/ModuleEntity'
import { Page } from './Module Entities/Page'
import { Group } from './Module Entities/Group'
import { PrintDocumentSize, PrintLinkMode } from './ModuleProject'
import { outlinePdfFactory } from '@lillallol/outline-pdf'


export class PdfExporter {

  /** An optional download folder for the chromium engine */
  static downloadFolder: string | undefined

  /** The installed browser path */
  static browserPath: string | undefined

  /** The PDF Outline */
  static pdfOutline: string = ""

  /**
   * Exports a module to PDF (needs the chromium rendering engine already installed)
   * @param projectDirectory The project directory
   * @param appRootPath The application's root path
   * @param transformPageLocation An optional function to transform the page's location (needed for tools like VSCode)
   */
  public static async exportToPdf(projectDirectory: string, appRootPath: string, transformPageLocation?: (path: string) => string): Promise<string> {
    let PuppeteerBridge = ((Puppeteer as unknown) as Puppeteer.PuppeteerNode) // Workaround for poor typescript mapping
    let module = await Module.createModuleFromPath(projectDirectory, appRootPath, Path.basename(projectDirectory), ModuleMode.PrintToPDF)
    let moduleOutputPath = Path.join(projectDirectory, 'ModuleBuild')
    let customStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'custom.css')
    let globalStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'global.css')
    let printImageStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'print.css')
    let pageFormat: Puppeteer.PaperFormat = 'letter'
    if (module.moduleProjectInfo.printDocumentSize !== undefined && module.moduleProjectInfo.printDocumentSize == PrintDocumentSize.A4)
    {
      pageFormat = 'a4'
      printImageStyleLocation = Path.join(moduleOutputPath, 'assets', 'css', 'print_a4.css')
    }    
    let pageLocation = Path.join(moduleOutputPath, 'printPage.html')
    let saveLocation = Path.join(projectDirectory, `${module.moduleProjectInfo.slug}.pdf`)

    Logger.info(`Creating HTML for PDF output at ${pageLocation}...`)
    let html = `<!DOCTYPE html><html lang="en"><head>`
    html += `<meta charset="UTF-8">`
    html += `<link rel="stylesheet" href="${globalStyleLocation}">`
    html += `<link rel="stylesheet" href="${printImageStyleLocation}">`
    html += `<link rel="stylesheet" href="${customStyleLocation}">`

    let options = {
      headless: true,
      executablePath: PdfExporter.browserPath == undefined ? PuppeteerBridge.executablePath() : PdfExporter.browserPath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
    const browser = await Puppeteer.launch(options)
    const page = await browser.newPage()

    this.pdfOutline = ""
    html += `</head><body>`
    if (module.moduleProjectInfo.printCoverPath && module.moduleProjectInfo.moduleProjectPath) {
      let moduleDirectory = Path.dirname(module.moduleProjectInfo.moduleProjectPath)
      let fullImagePath = Path.join(moduleDirectory, module.moduleProjectInfo.printCoverPath)
      let coverImageData = FileSystem.readFileSync(fullImagePath).toString('base64')
      html += `<div class="print-cover-page" style="background-image: url(data:image;base64,${coverImageData})"></div>`
    }
    html += PdfExporter.getChildPageContent(module.children)
    html = PdfExporter.formatTableOfContents(html)
    let printLinkMode = module.moduleProjectInfo.printLinkMode
    if(printLinkMode !== undefined && printLinkMode !== PrintLinkMode.None) {
      html = PdfExporter.postProcessLinks(html, printLinkMode)
    }    
    html = PdfExporter.alternateFooters(html)
    FileSystem.writeFileSync(pageLocation, html)

    if (transformPageLocation) {
      pageLocation = transformPageLocation(pageLocation)
    } else {
      pageLocation = pathToFileURL(pageLocation).toString()
    }

    await page.goto(pageLocation, {
      waitUntil: 'networkidle0',
      timeout: 0
    })

    Logger.info(`Creating PDF file.`)
    const pdf = await page.pdf({
      format: pageFormat,
      printBackground: true,
      timeout: 0
    })

    if (this.pdfOutline != "") {
      Logger.info(`Adding outline to the PDF.`)
      const outlinePdf = outlinePdfFactory(PdfLib)
      Logger.info(`Generated outline: "${this.pdfOutline}"`)
      const outline: string = this.pdfOutline
      const outlinedPdfDocument = await outlinePdf({ outline, pdf })
      const outlinedPdf = await outlinedPdfDocument.save()
      Logger.info(`Saving PDF file at ${saveLocation}...`)
      FileSystem.writeFileSync(saveLocation, outlinedPdf)
    } else {
      Logger.info(`Saving PDF file at ${saveLocation}...`)
      FileSystem.writeFileSync(saveLocation, pdf)
    }

    await browser.close()
    return saveLocation
  }

  /**
   * Installs the Chromium engine to render the PDF if needed
   * @param downloadProgressChanged A callback to handle the download progress changing
   * @param path An optional path for where to download Chromium
   */
  public static async installChromiumForRendering(downloadProgressChanged?: (progress: number) => void) {
    try {
      const desiredRevision = '1108766'
      let downloadPath = PdfExporter.downloadFolder !== undefined ? PdfExporter.downloadFolder : Path.join(__dirname, '.cache', 'puppeteer')
      let browserFetcher = new Puppeteer.BrowserFetcher ({ path: downloadPath })

      const browserRevisions = await browserFetcher.localRevisions()
      if (browserRevisions.length != 0 && FileSystem.existsSync(browserFetcher.revisionInfo(browserRevisions[0]).executablePath))  {
        PdfExporter.browserPath = browserFetcher.revisionInfo(browserRevisions[0]).executablePath
        return
      }

      Logger.info("Downloading & installing Chromium PDF rendering engine...")
      if (downloadProgressChanged) {
        downloadProgressChanged(0)
      }

      // Download Chromium
      let revisionInfo = await browserFetcher.download(desiredRevision, (downloadBytes, totalBytes) => {
        const progress = (downloadBytes / totalBytes) * 100.0
        if (downloadProgressChanged) {
          downloadProgressChanged(progress)
        }
      })

      if (revisionInfo === undefined) {
        throw Error(`Could not download Chromium revision ${desiredRevision}`)
      }

      PdfExporter.browserPath = revisionInfo.executablePath
      let localRevisions = await browserFetcher.localRevisions()
      Logger.info('Chromium downloaded to ' + revisionInfo.folderPath)

      // Remove any older versions
      const cleanupOldVersions = await localRevisions.map(async (revision) => {
        if (revision !== desiredRevision) {
          await browserFetcher.remove(revision)
        }
      })
      return Promise.all(cleanupOldVersions)
    } catch (error: any) {
      Logger.error((error as Error).message)
      throw Error(`PDF engine installation failed: ${(error as Error).message}`)
    }
  }

  /**
   * Alternates the footer direction on odd vs even pages
   * @param html The page HTML
   */
  private static alternateFooters(html: string): string {
    let $ = Cheerio.load(html)
    let isEvenPage = false

    $('.print-page').each((i, element) => {
      $(element).find('.footer-background').each((i, element) => {
        if(isEvenPage) {
          $(element).attr('style', 'transform: scaleX(-1);')
        }
      })
      
      $(element).find('.footer-page-number').each((i, element) => {
        if(isEvenPage) {
          $(element).attr('style', 'right: unset; left: 2px;')
        }
      })

      isEvenPage = !isEvenPage
    })
    return $.html()
  }

  /**
   * Converts monster and spell links 
   * @param html The page HTML
   */
  private static postProcessLinks(html: string, printLinkMode: PrintLinkMode): string {
    let $ = Cheerio.load(html)

    $('a').each((i, element) => {
      let link = $(element).attr('href')
      if(link === undefined) {
        return
      }

      let ignoreLinkUpdate = $(element).hasClass('no-link-update')
      if(ignoreLinkUpdate === true) {
        return
      }

      let newLink = link
      if(link.startsWith('/roll/')) {
        let linkText = $(element).text()
        $(element).replaceWith(`<strong>${linkText}</strong>`)
      }
      if(link.startsWith('/monster/')) {
        if(printLinkMode === PrintLinkMode.DNDBeyondEntries) {
          newLink = link.replace('/monster/', 'https://www.dndbeyond.com/monsters/')
        }
        if(printLinkMode === PrintLinkMode.DNDBeyondSearch) {
          newLink = link.replace('/monster/', 'https://www.dndbeyond.com/search?q=')
        }       
        $(element).attr('href', newLink)
        $(element).addClass('monster')
      }
      if(link.startsWith('/spell/')) {
        if(printLinkMode === PrintLinkMode.DNDBeyondEntries) {
          newLink = link.replace('/spell/', 'https://www.dndbeyond.com/spells/')
        }
        if(printLinkMode === PrintLinkMode.DNDBeyondSearch) {
          newLink = link.replace('/spell/', 'https://www.dndbeyond.com/search?q=')
        }
        $(element).attr('href', newLink)
        $(element).addClass('spell')
      }
      if(link.startsWith('/item/')) {
        let isMagicItem = $(element).hasClass('magic-item')
        let isEquipment = $(element).hasClass('equipment')
        if(printLinkMode === PrintLinkMode.DNDBeyondEntries) {
          if(isMagicItem) {
            newLink = link.replace('/item/', 'https://www.dndbeyond.com/magic-items/')
          }
          else if(isEquipment) {
            newLink = link.replace('/item/', 'https://www.dndbeyond.com/equipment/')
          }
          else {
            newLink = link.replace('/item/', 'https://www.dndbeyond.com/search?q=')
          }
        }
        if(printLinkMode === PrintLinkMode.DNDBeyondSearch) {
          newLink = link.replace('/item/', 'https://www.dndbeyond.com/search?q=')
        }
        $(element).attr('href', newLink)
        $(element).addClass('item')
      }
    })

    return $.html()
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
    this.pdfOutline = ""

    // Use the footer-page-number elements to determine the
    // page count.
    $('.footer-page-number,a').each((i, element) => {
      let isAnchor = $(element)[0]?.tagName === 'a'
      if (isAnchor && $(element)[0].attribs['id']) {
        let anchorID = $(element)[0].attribs['id']
        anchorPageDictionary['#' + anchorID] = currentPage
      }

      let shouldIncrementPage = $(element).hasClass('footer-page-number')
      if (shouldIncrementPage) {
        let footerPageElement = $(element)[0]
        let footerPageText = `${currentPage}`
        $(footerPageElement).text(footerPageText)
        currentPage += 1
      }
    })

    // Replace the list items in an unordered list marked as a table of contents
    // with actual item and page numbers.
    let isFirstOutlineElement = true
    let categoryDepth = 0
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
            Logger.warn(`Could not find the link content or page number for "${linkHref}" when generating a table of contents.`)
            return
          }
          
          $(linkElement).replaceWith(`<span class="toc-title"><a href="${linkHref}">${linkContent}</a></span><span class="toc-page-number"><a href="${linkHref}">${pageNumber}</a></span>`)

          let newDepth = 2
          let maxCategoryDepthAddition = 1
          if (isFirstOutlineElement || listElement.attribs['class'] == 'part') {
            isFirstOutlineElement = false
            categoryDepth = 0
            newDepth = 0
          } else if (listElement.attribs['class'] == 'category') {
            categoryDepth = 1
            newDepth = 1
          } else if (listElement.attribs['class'] == 'subitem') {
            maxCategoryDepthAddition = 2
            newDepth = 3
          } else {
            newDepth = 2
          }

          let outlineDepthString = '|--|'
          let depth = Math.min(newDepth, categoryDepth + maxCategoryDepthAddition)
          switch (depth) {
            case 0:
              outlineDepthString = '||'
              break;
            case 1:
              outlineDepthString = '|-|'
              break;
            case 2:
              outlineDepthString = '|--|'
              break;
            case 3:
              outlineDepthString = '|---|'
              break;
          }

          this.pdfOutline += `${pageNumber + 1}${outlineDepthString}${linkContent}\n`
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
        html += `<a id="${child.slug}" style="display: none"></a>`
      }

      if (child instanceof Page) {
        html += `<a id="${child.slug}" style="display: none"></a>`
        html += child.content
      }
      html += PdfExporter.getChildPageContent(child.children)
    })
    return html
  }
}
