import { Group } from './Group'
import { Page } from './Page'
import { ModuleEntity } from './ModuleEntity'
import { v4 as UUIDV4 } from 'uuid'
import Slugify from 'slugify'
import * as Path from 'path'
import * as FileSystem from 'fs-extra'
import * as GrayMatter from 'gray-matter'
import * as Markdown from 'markdown-it'
import * as Cheerio from 'cheerio'
import * as XML2JS from 'xml2js'
import * as Archiver from 'archiver'

/**
 * Represents an EncounterPlus module. Contains
 * logic for parsing modules from markdown.
 */
export class Module {
  // ---------------------------------------------------------------
  // Private fields
  // ---------------------------------------------------------------

  /** The markdown parsing engine */
  private markdown: Markdown

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Module`
   * @param name The name of the module
   */
  private constructor(name: string) {
    this.name = name
    this.id = UUIDV4()
    this.slug = Module.getSlugFromValue(name)
    this.markdown = Markdown({
      html: true,
      linkify: true,
      typographer: true,
    })

    // Load plugins for markdown
    this.markdown
      .use(require('markdown-it-attrs'))
      .use(require('markdown-it-anchor'))
      .use(require('markdown-it-imsize'), { autofill: true })
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** An array of existing slugs to ensure slugs
   * are not duplicated.  */
  static existingSlugs: string[] = []

  /** The name of the module */
  name: string

  /** The UUID of the module */
  id: string

  /** The slug for the module */
  slug: string

  /** The module description */
  description: string | undefined = undefined

  /** The module author */
  author: string | undefined = undefined

  /** The module category */
  category: string | undefined = undefined

  /** The reference code of the module */
  referenceCode: String | undefined = undefined

  /** The module image relative path */
  imagePath: string | undefined = undefined

  /** The groups of the module */
  groups: Group[] = []

  /** The pages of the module */
  pages: Page[] = []

  /** The maps of the module */
  maps: ModuleEntity[] = []

  /** The encounters of the module */
  encounters: ModuleEntity[] = []

  /** The module version */
  version: number | undefined = undefined

  /** The path for the module archive (after it is created) */
  moduleArchivePath: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public & Protected Methods
  // ---------------------------------------------------------------

  /**
   * Sanitizes a string as a slug. This can be
   * an existing slug value.
   * @param slug The slug to sanitize
   */
  static sanitizeSlug(slug: string): string {
    return Slugify(slug, {
      lower: true,
      remove: /[*+~.()'"!:@&’]/g,
      strict: true,
    })
  }

  /** Gets a slug from a value */
  static getSlugFromValue(value: string): string {
    let generatedSlug: string = Module.sanitizeSlug(value)
    let automaticSlugNumber = 1

    // Ensure we don't auto-generate a duplicate slug.
    // Start with "my-slug", then move to "my-slug-2",
    // "my-slug-3", etc.
    let slug: string = generatedSlug
    while (Module.existingSlugs.includes(slug)) {
      slug = `${generatedSlug}-${automaticSlugNumber.toString()}`
      automaticSlugNumber += 1
    }
    return slug
  }

  /**
   * Gets the name from the Module.json file if one already exists.
   * @param projectDirectory The project directory
   */
  static getModuleName(projectDirectory: string): string | undefined {
    // Ensure the path we're parsing is a directory
    if (!FileSystem.statSync(projectDirectory).isDirectory()) {
      return undefined
    }

    // Check for module.json
    let moduleJsonPath = Path.join(projectDirectory, 'module.json')    
    if(!FileSystem.existsSync(moduleJsonPath)) {
      return undefined
    }

    let moduleDataBuffer = FileSystem.readFileSync(moduleJsonPath)
    let moduleData = JSON.parse(moduleDataBuffer.toString())

    return moduleData['name']
  }

  /**
   * Builds modules from markdown at a specified directory.
   * @param projectDirectory The module project directory.
   * @param name The name of the module.
   */
  static async createModuleFromPath(projectDirectory: string, name: string): Promise<Module> {
    // Ensure the path we're parsing is a directory
    if (!FileSystem.statSync(projectDirectory).isDirectory()) {
      throw Error('Specified module project path is not a directory.')
    }

    // Create a new module object and reset the list of
    // existing slugs as we're parsing a new module project
    let module = new Module(name)
    Module.existingSlugs = []

    // Parse the module JSON - if it doesn't exist, the parsing
    // method will handle it
    module.parseModuleJSON(Path.join(projectDirectory, 'module.json'))

    // Check for cover image if not already defined. This was
    // the legacy way of defining the cover image path.
    let coverPath = Path.join(projectDirectory, 'cover.jpg')
    if (module.imagePath === undefined && FileSystem.existsSync(coverPath)) {
      module.imagePath = 'cover.jpg'
    }

    // Create a Module Build folder so the main
    // folder gets minimally altered
    let moduleBuildPath = Path.join(projectDirectory, 'ModuleBuild')
    if (!FileSystem.existsSync(moduleBuildPath)) {
      FileSystem.mkdirSync(moduleBuildPath)
    }

    // Parse the project directory - navigating through
    // all subdirectories (which become groups unless they
    // are explicitly ignored).
    module.processDirectory(projectDirectory, moduleBuildPath)

    // Export module.xml file
    module.exportXML(Path.join(moduleBuildPath, 'module.xml'))

    // Copy the assets folder if it isn't already there. If
    // it is already there, don't overwrite it as the CSS
    // may be customized.
    let assetsOutputPath = Path.join(moduleBuildPath, 'assets')
    if (!FileSystem.existsSync(assetsOutputPath)) {
      let packedAssets = Path.join(__dirname, '../../assets')
      FileSystem.copySync(packedAssets, assetsOutputPath)
    }

    let moduleArchivePath = Path.join(projectDirectory, `${module.slug}.module`)
    await module.createArchive(moduleArchivePath, moduleBuildPath)
    module.moduleArchivePath = moduleArchivePath

    return module
  }

  // ---------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------

  /**
   * Parses the module JSON file to define key properties
   * about the module
   * @param moduleJsonPath The module JSON file to parse/update.
   */
  private parseModuleJSON(moduleJsonPath: string) {
    // Simply return if module doesn't exist - default
    // module naming and handling will apply.
    if(!FileSystem.existsSync(moduleJsonPath)) {
      return
    }

    let moduleDataBuffer = FileSystem.readFileSync(moduleJsonPath)
    let moduleData = JSON.parse(moduleDataBuffer.toString())

    // If ID is specified in module.json, ensure it is a UUID and use that
    let id = (moduleData['id'] as string)
    if(id) {
      let uuidValidationRegEx = RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/, 'i')
      let matches = id.match(uuidValidationRegEx)
      if(matches && matches.length > 0) {
        this.id = id
      } else {
        throw Error(`Invalid UUID specified in ${moduleJsonPath}`)
      }
    }

    // If name is specified in module.json, use that
    let name = (moduleData['name'] as string)
    if (name) {
      this.name = name
    }

    // Reset module slugs because we may have changed
    // the name of the module
    Module.existingSlugs = [] 

    // If name is specified in module.json, use that, otherwise
    // use the slug based on the name
    let slug = (moduleData['slug'] as string) 
    if (slug) {
      this.slug = Module.sanitizeSlug(slug)
    } else {
      this.slug = Module.getSlugFromValue(this.name)
    }

    // If description is specified in module.json, use that.
    let description = (moduleData['description'] as string)
    if (description) {
      this.description = description
    }

    // If category is specified in module.json, use that.
    // Ensure values are 'adevnture' or 'other'
    let category = (moduleData['category'] as string)
    if (category === 'adventure' || category === 'other') {
      this.category = category
    }

    // If author is specified in module.json, use that
    let author = (moduleData['author'] as string)
    if (author) {
      this.author = author
    }

    // If reference code is specified in module.json, use that
    let code = (moduleData['code'] as string)
    if (code) {
      this.referenceCode = code
    }

    // If version is specified in module.json, use that
    let version = (moduleData['version'] as number)
    if (version) {
      this.version = version
    }

    // If cover image is specified in module.json, use that.
    // Ensure cover image actually exists
    let imagePath = (moduleData['cover'] as string)
    if (imagePath) {
      let moduleDirectory = Path.dirname(moduleJsonPath)
      let fullImagePath = Path.join(moduleDirectory, imagePath)
      if (!FileSystem.existsSync(fullImagePath)){
        throw Error(`Module cover image path does not exist: ${fullImagePath}`)
      }
      this.imagePath = imagePath
    }

    // It auto-increment is specified, then auto-increment the version with 
    // each build. Write a new module.json each build.
    let autoIncrementVersion = (moduleData['autoIncrementVersion'] as boolean)
    if (version !== undefined && autoIncrementVersion) {
      version += 1
      this.version = version
      let newModuleJson: any = new Object
      if(this.id) { newModuleJson['id'] = this.id }
      if(this.name) { newModuleJson['name'] = this.name }
      if(this.slug) { newModuleJson['slug'] = this.slug }
      if(this.description) { newModuleJson['description'] = this.description }
      if(this.category) { newModuleJson['category'] = this.category }
      if(this.author) { newModuleJson['author'] = this.author }
      if(this.referenceCode) { newModuleJson['code'] = this.referenceCode }
      if(this.imagePath) { newModuleJson['cover'] = this.imagePath }
      newModuleJson['version'] = this.version
      newModuleJson['autoIncrementVersion'] = true
      let outputJson = JSON.stringify(newModuleJson, null, 2)
      FileSystem.writeFileSync(moduleJsonPath, outputJson)
    }
  }

  /**
   * Archives the module information as a .module file
   * @param outputPath The output path for the module file
   * @param moduleBuildPath The module build directory
   */
  private async createArchive(outputPath: string, moduleBuildPath: string) {    
    let filename = Path.join(outputPath)
    var archiveStream = FileSystem.createWriteStream(filename)
    var archive = Archiver('zip', {
      zlib: { level: 9 }
    })

    // Good practice - catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function(error) {
      let errorMessage = (error as Error).message
      if (error.code === 'ENOENT') {
        console.warn(errorMessage)
      } else {
        throw error
      }
    })

    // Good practice - catch this error explicitly
    archive.on('error', function(error) {
      throw error
    })

    archive.pipe(archiveStream)
    archive.glob('./**/*', {cwd: moduleBuildPath})
    await archive.finalize()
  }

  /**
   * Exports the module XML
   * @param outputPath The path where the XML file will be created
   */
  private exportXML(outputPath: string) {
    console.log(`Exporting module to XML: ${outputPath}`)

    // Map page data
    let pages = this.pages.map((page) => {
      let pageAttributes = {
        id: page.id,
        parent: page.parent?.id,
      }
      return {
        $: pageAttributes,
        name: page.name,
        slug: page.slug,
        content: page.content,
      }
    })

    // Map group data
    let groups = this.groups.map((group) => {
      let groupAttributes = {
        id: group.id,
        parent: group.parent?.id,
      }
      return { $: groupAttributes, name: group.name, slug: group.slug }
    })

    // Layout root module data structure
    let moduleData = {
      $: { id: this.id },
      name: this.name,
      slug: this.slug,
      description: this.description,
      author: this.author,
      code: this.referenceCode,
      category: this.category,
      image: this.imagePath,
      group: groups,
      page: pages,
    }

    let xmlBuilder = new XML2JS.Builder({ rootName: 'module' })
    let xml = xmlBuilder.buildObject(moduleData)
    FileSystem.writeFileSync(outputPath, xml)
  }

  /**
   * Processes a directory, parsing and copying module content
   * @param directoryPath The directory path
   * @param moduleBuildPath The module build folder path
   * @param parentGroup The parent group (optional)
   */
  private processDirectory(
    directoryPath: string,
    moduleBuildPath: string,
    parentGroup: Group | undefined = undefined
  ) {
    console.log(`Processing directory: ${directoryPath}`)

    // Get all subdirectories - we will recursively scan
    // through these, creating Groups.
    let subdirectoryNames: string[] = FileSystem.readdirSync(
      directoryPath
    ).filter(function (file) {
      let childPath = Path.join(directoryPath, file)
      return FileSystem.statSync(childPath).isDirectory()
    })

    // Parse subdirectories
    subdirectoryNames.forEach((subdirectoryName) => {
      let subdirectoryPath = Path.join(directoryPath, subdirectoryName)
      if (subdirectoryPath === moduleBuildPath) {
        return
      }

      // Skip any folder with an ".ignoregroup" file for the purpose of
      // creating groups or reading .md files. However, copy
      // their content to the module output (as they may be an
      // image or resource folder) if they're in the root level.
      let ignoreFilePath = Path.join(subdirectoryPath, '.ignoreGroup')
      if (FileSystem.existsSync(ignoreFilePath)) {
        if (parentGroup === undefined) {
          // If a root-level ignored folder, copy to output
          FileSystem.copySync(
            subdirectoryPath,
            Path.join(moduleBuildPath, subdirectoryName)
          )
        }
        return
      }

      // Create a new group with a random UUID
      // and assign the parent
      let newGroup = new Group(subdirectoryName)
      newGroup.parent = parentGroup

      // Push group to list of groups and recursively start
      // parsing subdirectory
      this.groups.push(newGroup)
      this.processDirectory(subdirectoryPath, moduleBuildPath, newGroup)
    })

    // Ensure there are files in the modules directory
    let directoryChildren = FileSystem.readdirSync(directoryPath)
    if (directoryChildren.length == 0) {
      return
    }

    // Parse each file
    directoryChildren.forEach((itemName) => {
      let fullPath = Path.join(directoryPath, itemName)
      if (!FileSystem.statSync(fullPath).isFile()) {
        return
      }

      this.processFile(fullPath, moduleBuildPath, parentGroup)
    })
  }

  /**
   * Processes a markdown file and converts it to module-appopriate
   * HTML.
   * @param filePath The path of the markdown file to process
   * @param moduleBuildPath The module build folder path
   * @param parentGroup The parent group (optional)
   */
  private processFile(
    filePath: string,
    moduleBuildPath: string,
    parentGroup: Group | undefined = undefined
  ) {
    console.log(`Processing file: ${filePath}`)

    // Copy all images to the base ModuleBuild folder
    // This allows you to create same-directory image
    // references when authoring markdown
    const imageExtensions = ['.gif', '.jpeg', '.jpg', '.png']
    let extension = Path.extname(filePath)
    if (imageExtensions.includes(extension)) {
      let filename = Path.basename(filePath)
      let newDestination = Path.join(moduleBuildPath, filename)
      FileSystem.copyFileSync(filePath, newDestination)
    }

    // All code below is for parsing markdown files,
    // so ignore any non-markdown files
    if (extension != '.md') {
      return
    }

    // Read the markdown file contents
    let data = FileSystem.readFileSync(filePath, 'utf8')

    // Use GrayMatter to separate YAML front-matter (name, slug, etc.)
    // from markdown. Matter data are attributes, matter content is the
    // body of the page.
    let matter = GrayMatter(data)

    // Convert markdown to HTML
    let html = this.markdown.render(matter.content)

    // If defined in the front-matter, get the name
    // for the page there. Otherwise, get it from
    // the file name
    let attributes = matter.data
    let pageName = (attributes['name'] as string) || Path.basename(filePath)

    let pagebreaks = attributes['pagebreak'] as string
    let pagebreakContentFound = false

    // If we have pagebreaks defined, we'll attempt to split
    // up, group, and subgroup content by header values
    if (pagebreaks !== undefined) {
      let $ = Cheerio.load(html)
      let cover: CheerioElement | undefined = undefined
      let pagesByHeader: { [slug: string]: ModuleEntity } = {}

      $(pagebreaks).each((i, element) => {
        let headerText = $(element).text()
        console.log(`Parsing page ${headerText} from header ${element.tagName}`)

        // Create Page from current HTML
        let page = new Page(headerText)
        page.content += $.html(element)

        // Advance through page content until the next header
        $(element)
          .nextUntil(pagebreaks)
          .each((i, element) => {
            // Special case cover images - they will be moved
            // to the beginning of the page later
            if ($(element).find('.size-cover').length > 0) {
              cover = element
            } else {
              page.content += $.html(element)
            }
          })

        pagesByHeader[headerText] = page

        // Find higher level header levels - for example, if the user specified
        // "h1,h2,h3" for pagebreaks, then this will return "h1,h2".
        let parentPagebreaks = Module.trim(
          pagebreaks.split(element.tagName)[0],
          ','
        )

        // Traverse backwards until we find the parent page break
        let parentElement = $(element).prevAll(parentPagebreaks).first()

        // If we found a parent page break, we can assign that as the
        // parent for this group
        if (parentElement) {
          let parentHeader = parentElement.text()
          page.parent = pagesByHeader[parentHeader]
        }

        // If there is a cover image, apply to top current page
        if (cover) {
          page.content = $.html(cover) + page.content
          cover = undefined
        }

        // If the page has no parent and there is a group,
        // make page belong to that group
        if (parentElement.length === 0 && parentGroup !== undefined) {
          page.parent = parentGroup
        }

        // Finally, add the page to the module
        this.pages.push(page)
        pagebreakContentFound = true
      })
    }

    // If a page hasn't otherwise been created by
    // pagebreak parsing logic, use full HTML
    // to create page
    if (!pagebreakContentFound) {
      let page = new Page(pageName)
      page.content = html
      page.parent = parentGroup
      this.pages.push(page)
    }
  }

  /**
   * Trims one or more instances of a character from the
   * beginning and end of a string
   * @param value The string to trim
   * @param character The character to trim from the string
   */
  private static trim(value: string, character: string) {
    if (character === ']') character = '\\]'
    if (character === '\\') character = '\\\\'
    return value.replace(
      new RegExp('^[' + character + ']+|[' + character + ']+$', 'g'),
      ''
    )
  }
}
