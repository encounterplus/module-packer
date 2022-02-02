import * as Archiver from 'archiver'
import * as Cheerio from 'cheerio'
import * as FileSystem from 'fs-extra'
import * as GrayMatter from 'gray-matter'
import * as Path from 'path'
import * as Logger from 'winston'
import Slugify from 'slugify'
import { v4 as UUIDV4, v5 as UUIDV5 } from 'uuid'
import * as XML2JS from 'xml2js'
import * as YAML from 'yaml'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { ModuleProject } from '../ModuleProject'
import { Group } from './Group'
import { Item } from './Item'
import { ModuleEntity, IncludeMode } from './ModuleEntity'
import { Monster } from './Monster'
import { Page } from './Page'
import { Map } from './Map'
import { Encounter } from './Encounter'
import { Spell } from './Spell'
import { RollTable } from './RollTable'
import { RollTableColumn, RollTableColumnAlignment } from './RollTableColumn'

/**
 * Represents an EncounterPlus module. Contains
 * logic for parsing modules from markdown.
 */
export class Module {
  // ---------------------------------------------------------------
  // Private Properties
  // ---------------------------------------------------------------

  /** The content to print in the footer */
  private printFooterContent: string = ''

  /** A flag indicating whether to hide the footer background from display */
  private hideFooter: boolean = false

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Module`
   */
  private constructor() {}

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The module build folder name */
  static buildFolderName = 'ModuleBuild'

  /** The module project file name */
  static moduleProjectFileName = 'Module.yaml'

  /** An array of existing slugs to ensure slugs
   * are not duplicated.  */
  static existingSlugs: string[] = []

  /** A list of image extensions */
  static imageExtensions: string[] = ['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp', '.bmp', '.tif', '.tiff', '.apng', '.avif', '.jfif', '.pjpeg', '.pjp', '.ico', '.cur', '.heif']

  /** A temporary flag while the broken link checking code is in development */
  static scanForBrokenLinks = false

  /** The module's slug */
  slug: string = ''

  /** The module project information */
  moduleProjectInfo: ModuleProject = new ModuleProject()

  /** The nodes at the root level of the module */
  children: ModuleEntity[] = []

  /** The groups of the module */
  groups: Group[] = []

  /** The pages of the module */
  pages: Page[] = []

  /** The maps of the module */
  maps: Map[] = []

  /** The encounters of the module */
  encounters: Encounter[] = []

  /** The monster associated with the module */
  monsters: Monster[] = []

  /** The items associated with the module */
  items: Item[] = []

  /** The spells associated with the module */
  spells: Spell[] = []

  /** The roll tables associated with the module */
  rollTables: RollTable[] = []

  /** The path for the module archive (after it is created) */
  moduleArchivePath: string | undefined = undefined

  /** The path where the module creates temporary build files */
  moduleBuildPath: string | undefined = undefined

  /** The mode of export for the module */
  exportMode: ModuleMode = ModuleMode.ScanModule

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
   * Gets the name from the Module.yaml file if one already exists.
   * @param projectDirectory The project directory
   */
  static getModuleName(projectDirectory: string): string | undefined {
    // Ensure the path we're parsing is a directory
    if (!FileSystem.statSync(projectDirectory).isDirectory()) {
      return undefined
    }

    // Check for Module.yaml
    let moduleProjectFilePath = Path.join(projectDirectory, Module.moduleProjectFileName)
    if (!FileSystem.existsSync(moduleProjectFilePath)) {
      return undefined
    }

    let moduleDataBuffer = FileSystem.readFileSync(moduleProjectFilePath)
    let moduleData: any = undefined
    try {
      moduleData = YAML.parse(moduleDataBuffer.toString())
    } catch (error: any) {
      throw Error(`Failed to parse ${moduleProjectFilePath}. Error: ${(error as Error).message}`)
    }

    return moduleData['name']
  }

  /**
   * Builds modules from markdown at a specified directory.
   * @param projectDirectory The module project directory.
   * @param appRootPath The application's root path
   * @param name The name of the module.
   * @param mode The mode for creating the module. Valid values are 'module' -
   * for creating a module file, 'pdf' for creating a print PDF, and
   * 'scan' - for scanning the directory
   */
  static async createModuleFromPath(
    projectDirectory: string,
    appRootPath: string,
    name: string,
    mode: ModuleMode = ModuleMode.ScanModule
  ): Promise<Module> {
    // Ensure the path we're parsing is a directory
    if (!FileSystem.statSync(projectDirectory).isDirectory()) {
      throw Error('Specified module project path is not a directory.')
    }

    // Create a new module object and reset the list of
    // existing slugs as we're parsing a new module project
    let module = new Module()
    module.exportMode = mode
    let forPrint = mode === ModuleMode.PrintToPDF
    let scanOnly = mode === ModuleMode.ScanModule
    let forModule = mode === ModuleMode.ModuleExport
    Module.existingSlugs = []

    // Parse the module project file. If one doesn't exist - create it.
    let moduleProjectFilePath = Path.join(projectDirectory, Module.moduleProjectFileName)
    module.moduleProjectInfo.name = name
    module.moduleProjectInfo.slug = Module.getSlugFromValue(name)
    module.moduleProjectInfo.id = UUIDV5(module.moduleProjectInfo.slug, UUIDV4()) // Random UUID for modules
    if (FileSystem.existsSync(moduleProjectFilePath)) {
      module.moduleProjectInfo = ModuleProject.parseModuleProject(moduleProjectFilePath) ?? module.moduleProjectInfo
    } else {
      module.moduleProjectInfo.writeModuleProjectFile(moduleProjectFilePath)
    }

    // Legacy: Check for cover image if not already defined. This was
    // the legacy way of defining the cover image path.
    let coverPath = Path.join(projectDirectory, 'cover.jpg')
    if (module.moduleProjectInfo.moduleCoverPath === undefined && FileSystem.existsSync(coverPath)) {
      module.moduleProjectInfo.moduleCoverPath = 'cover.jpg'
    }

    // Create a Module Build folder so the main
    // folder gets minimally altered
    let moduleBuildPath = Path.join(projectDirectory, Module.buildFolderName)
    module.moduleBuildPath = moduleBuildPath
    if (!scanOnly && FileSystem.existsSync(moduleBuildPath)) {
      FileSystem.removeSync(moduleBuildPath)
    }
    if (!scanOnly) {
      FileSystem.mkdirSync(moduleBuildPath)
    }

    // Copy the assets folder. The assets in the build folder should
    // always be replaced. They can be overridden by a user by having
    // an assets folder in their module.
    let assetsOutputPath = Path.join(moduleBuildPath, 'assets')
    if (!scanOnly && FileSystem.existsSync(assetsOutputPath)) {
      FileSystem.removeSync(assetsOutputPath)
    }
    if (!scanOnly) {
      let baseAssets = Path.join(appRootPath, 'assets/base')
      FileSystem.copySync(baseAssets, assetsOutputPath)
    }

    // Copy print assets if doing the module for print.
    if (!scanOnly && forPrint) {
      let printAssets = Path.join(appRootPath, 'assets/print')
      FileSystem.copySync(printAssets, assetsOutputPath)
    }

    // Parse the project directory - navigating through
    // all subdirectories (which become groups unless they
    // are explicitly ignored).
    module.processDirectory(projectDirectory, moduleBuildPath)

    // Add Maps
    let mapPromises: Promise<void>[] = []
    if (forModule) {
      module.moduleProjectInfo.mapFiles.forEach(async (map) => {
        let parseMapPromise = map.extractMapObject(moduleBuildPath, projectDirectory, module.moduleProjectInfo.id).then((mapObject) => {
          module.maps.push(mapObject)
        })
        mapPromises.push(parseMapPromise)
      })

      await Promise.all(mapPromises)
    }

    // Add Encounters
    let encounterPromises: Promise<void>[] = []
    if (forModule) {
      module.moduleProjectInfo.encounterFiles.forEach(async (encounter) => {
        let parseEncounterPromise = encounter
          .extractEncounterObject(moduleBuildPath, projectDirectory, module.moduleProjectInfo.id)
          .then((encounterObject) => {
            module.encounters.push(encounterObject)
          })
        encounterPromises.push(parseEncounterPromise)
      })

      await Promise.all(encounterPromises)
    }

    // Resolve forced parent reassignments
    let allEntities = module.getAllEntities()
    allEntities.forEach((entity) => {
      let parentSlug = entity.parentSlug
      if (parentSlug !== undefined) {
        if (entity.parent !== undefined) {
          entity.parent.children = entity.parent.children.filter((childEntity) => {
            return childEntity !== entity
          })
        }

        if (parentSlug == module.slug) {
          entity.parent = undefined
        }
        
        entity.parent = allEntities.filter((entity) => {
          return entity.slug === parentSlug
        })[0]
        entity.parent?.children.push(entity)
      }
    })

    // Prunes an entity and children from the tree
    function removeEntityAndChildren(entity: ModuleEntity) {
      // Recursively remove children of children
      entity.children.forEach((child) => {
        removeEntityAndChildren(child)
      })

      module.pages = module.pages.filter((page) => {
        return page !== entity
      })
      module.groups = module.groups.filter((group) => {
        return group !== entity
      })
      module.monsters = module.monsters.filter((monster) => {
        return monster !== entity
      })
      module.items = module.items.filter((item) => {
        return item !== entity
      })
      module.spells = module.spells.filter((spell) => {
        return spell !== entity
      })
      entity.children = []

      if (entity.parent) {
        entity.parent.children = entity.parent.children.filter((child) => {
          return child !== entity
        })
      } else {
        module.children = module.children.filter((child) => {
          return child !== entity
        })
      }
    }

    function getEntitiesToRemove(entities: ModuleEntity[]): ModuleEntity[] {
      return entities.filter((entity) => {
        let keepEntity =
          entity.includeIn === IncludeMode.All ||
          (entity.includeIn === IncludeMode.Module && forModule) ||
          (entity.includeIn === IncludeMode.Print && forPrint)

        return !keepEntity
      })
    }

    // Filter entities based on whether they are marked for inclusion
    // in the particular build target
    let entitiesToRemove: ModuleEntity[] = []
    entitiesToRemove.push(...getEntitiesToRemove(allEntities))
    entitiesToRemove.forEach((entity) => {
      removeEntityAndChildren(entity)
    })

    // Delete empty groups
    if (module.moduleProjectInfo.deleteEmptyGroups) {
      var deletedEmptyGroup = true
      // Delete empty groups in a while loop until empty groups are no longer deleted
      // This covers the case of multiple levels of empty groups being nested
      while (deletedEmptyGroup) { 
        deletedEmptyGroup = false
        let groupsToRemove: Group[] = []
        module.groups.forEach((group) => {
          if(group.children.length == 0) {
            groupsToRemove.push(group)
            deletedEmptyGroup = true
          }
        })
        groupsToRemove.forEach((group) => {
          removeEntityAndChildren(group)
        })
      }
    }

    // Check for cyclic dependencies
    allEntities.forEach((entity) => {
      const maxCycles = 50
      let currentParent: ModuleEntity | undefined = entity.parent

      let cycleCount = 0
      while (currentParent !== undefined) {
        if (currentParent === entity) {
          throw Error(`The entity "${[entity.slug]}" is cyclic. Check the parent properties of your items.`)
        }
        if (cycleCount > maxCycles) {
          // Shouldn't hit this unless someone nested crazy-deep, but it's a safety so the cyclic check doesn't spin forever.
          throw Error(
            `The nested count of the entity "${[entity.slug]}" is exceeded ${maxCycles}. Entity may be cyclic. Reduce or remove nesting.`
          )
        }
        currentParent = currentParent.parent
      }
    })

    // Sort module children
    module.children = module.sortChildren(module.children)

    // Checks for unresolved links in the module and
    // issues a warning if the links can't be resolved
    if (Module.scanForBrokenLinks) {
      module.checkForBrokenLinks()
    }    

    // Export module.xml file
    if (mode == ModuleMode.ModuleExport) {
      module.exportXML(moduleBuildPath)
      module.exportTables(moduleBuildPath)
      let moduleArchivePath = Path.join(projectDirectory, `${module.moduleProjectInfo.slug}.module`)
      await module.createArchive(moduleArchivePath, moduleBuildPath)
      module.moduleArchivePath = moduleArchivePath
    }

    // If incrementing version, we need to rewrite Module project file.
    if (!scanOnly && module.moduleProjectInfo.autoIncrementVersion) {
      module.moduleProjectInfo.writeModuleProjectFile(moduleProjectFilePath)
    }

    return module
  }

  /** Gets the HTML elements that start a page when printing */
  getPageOpenHTML = (): string => {
    if (this.exportMode !== ModuleMode.PrintToPDF) {
      return ''
    }

    let html = '<div class="print-page">'
    html += '<div class="page-content two-column">'
    return html
  }

  /**
   * Gets the HTML elements that start a page when printing
   * @param multiColumn If true, the page is multicolumn. If false, the page is single ViewColumn.
   */
  getColumnSpecificPageOpenHTML = (multiColumn: Boolean): string => {
    if (this.exportMode !== ModuleMode.PrintToPDF) {
      return ''
    }

    let html = '<div class="print-page">'
    html += multiColumn ? '<div class="page-content force-two-column">' : '<div class="page-content">'
    return html
  }

  /** Gets the HTML elements that end a page when printing */
  getPageCloseHTML = (): string => {
    if (this.exportMode !== ModuleMode.PrintToPDF) {
      return ''
    }

    let html = '</div>'
    if (this.hideFooter) {
      html += '<div class="footer-background hidden"></div>'
      html += `<div class="footer-content hidden"></div>`
      html += '<div class="footer-page-number hidden"></div>'
    } else {
      html += '<div class="footer-background"></div>'
      html += `<div class="footer-content">${this.printFooterContent}</div>`
      html += '<div class="footer-page-number"></div>'
    }

    html += '</div>'
    return html
  }

  // ---------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------

  /**
   * Gets all entities combined into a single list
   */
  private getAllEntities = (): ModuleEntity[] => {
    let allEntities: ModuleEntity[] = []
    this.pages.forEach((page) => {
      allEntities.push(page)
    })
    this.groups.forEach((group) => {
      allEntities.push(group)
    })
    this.maps.forEach((map) => {
      allEntities.push(map)
    })
    this.encounters.forEach((encounter) => {
      allEntities.push(encounter)
    })
    return allEntities
  }

  /**
   * Sorts an array of module entity by the "order" (or "sort") value.
   * Also sorts all the children of the children recursively.
   * @param children The module entity children.
   */
  private sortChildren(children: ModuleEntity[]): ModuleEntity[] {
    children.forEach((child) => {
      child.children = this.sortChildren(child.children)
    })

    return children.sort((a, b) => {
      let aVal = a.sort === undefined ? 1000 : a.sort
      let bVal = b.sort === undefined ? 1000 : b.sort

      if (aVal === bVal) {
        return 0
      }

      return aVal < bVal ? -1 : 1
    })
  }

  /** Issues a warning for any detected broken links */
  private checkForBrokenLinks = () => {
    const forPrint = this.exportMode === ModuleMode.PrintToPDF
    const forModuleExport = this.exportMode === ModuleMode.ModuleExport
    const scanOnly = this.exportMode === ModuleMode.ScanModule

    if (scanOnly) {
      return
    }

    // Index all the links on pages in the module
    let moduleLinks: { [pageID: string]: string[] } = {}
    this.pages.forEach((page) => {
      let pageWillBeInOutput = page.includeIn === IncludeMode.All ||
        (page.includeIn === IncludeMode.Module && forModuleExport) ||
        (page.includeIn === IncludeMode.Print && forPrint)

      if (!pageWillBeInOutput) {
        return
      }

      moduleLinks[page.slug] = []
      let $ = Cheerio.load(page.content);
      let links = $('a');
      $(links).each((i, link) => {
        let linkDestination = $(link).attr('href')
        if (linkDestination !== undefined) {
          moduleLinks[page.slug].push(linkDestination)
        }
      })      
    })

    // Check for unresolvable links
    if (!scanOnly) {
      let entitySlugList: { [slug: string]: boolean } = {}
      let allEntities = this.getAllEntities()
      allEntities.forEach((entity) => entitySlugList[entity.slug] = true)
      Object.entries(moduleLinks).forEach(([pageSlug, links]) => {
        links.forEach((link) => {
          if (forPrint && link.startsWith('#')) {
            link = link.replace('#', '')
          }

          let srcIsAbsolute = /^https?:\/\//i.test(link)
          if (srcIsAbsolute) {
            return
          }

          let srcIsCompendium = /^(\/monster\/.+)|(\/item\/.+)|(\/spell\/.+)|(\/page\/.+)|(\/roll\/.+)/i.test(link)
          if (srcIsCompendium) {
            return
          }

          let linkResolves = entitySlugList[link]
          if (!linkResolves) {
            Logger.warn(`Possible broken link: "${link}" in page "${pageSlug}"`)
          }
        })
      })
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
      zlib: { level: 9 },
    })

    archive.on('warning', function (error) {
      let errorMessage = (error as Error).message
      if (error.code === 'ENOENT') {
        Logger.warn(errorMessage)
      } else {
        throw error
      }
    })

    archive.on('error', function (error) {
      throw error
    })

    archive.pipe(archiveStream)
    archive.directory(moduleBuildPath, false)
    await archive.finalize()
  }

  /**
   * Exports the module tables
   * @param outputPath The path where the JSON file will be created
   */
  private exportTables = (outputPath: string) => {
    let tablesPath = Path.join(outputPath, 'tables.json')
    let hasTablesData = this.rollTables.length > 0

    if (hasTablesData) {
      Logger.info(`Exporting ${this.rollTables.length} Tables to JSON: ${outputPath}`)
      let tablesJson = JSON.stringify(this.rollTables)
      FileSystem.writeFileSync(tablesPath, tablesJson)
    }
  }

  /**
   * Exports the module XML
   * @param outputPath The path where the XML files will be created
   */
  private exportXML = (outputPath: string) => {
    Logger.info(`Exporting module to XML: ${outputPath}`)

    let modulePath = Path.join(outputPath, 'module.xml')
    let compendiumPath = Path.join(outputPath, 'compendium.xml')

    // Map page data
    let pages = this.pages.map((page) => {
      let pageAttributes = {
        id: page.id,
        sort: page.sort,
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
        sort: group.sort,
        parent: group.parent?.id,
      }
      return { $: groupAttributes, name: group.name, slug: group.slug }
    })

    // Map map data
    let maps = this.maps.map((mapObject) => {
      let mapAttributes = {
        id: mapObject.id,
        sort: mapObject.sort,
        parent: mapObject.parent?.id,
      }
      let mapData: any = mapObject.mapData
      mapData['$'] = mapAttributes
      mapData['name'] = mapObject.name
      mapData['slug'] = mapObject.slug
      return mapData
    })

    // Map encounter data
    let encounters = this.encounters.map((encounterObject) => {
      let encounterAttributes = {
        id: encounterObject.id,
        sort: encounterObject.sort,
        parent: encounterObject.parent?.id,
      }
      let encounterData: any = encounterObject.encounterData
      encounterData['$'] = encounterAttributes
      encounterData['name'] = encounterObject.name
      encounterData['slug'] = encounterObject.slug
      return encounterData
    })

    // Map monster data
    let monsters = this.monsters.map((monster) => {
      let monsterImageFolder = Path.join(outputPath, 'monsters')
      if (!FileSystem.existsSync(monsterImageFolder)) {
        FileSystem.mkdirSync(monsterImageFolder)
      }

      let monsterAttributes = {
        id: monster.id,
      }

      let traits = monster.traits.map((trait) => {
        return { name: trait.name, text: trait.description }
      })
      let actions = monster.actions.map((action) => {
        return { name: action.name, text: action.description }
      })
      let bonusActions = monster.bonusActions.map((bonusAction) => {
        return { name: bonusAction.name, text: bonusAction.description }
      })
      let reactions = monster.reactions.map((reaction) => {
        return { name: reaction.name, text: reaction.description }
      })
      let legendaryActions = monster.legendaryActions.map((legendaryAction) => {
        return { name: legendaryAction.name, text: legendaryAction.description }
      })

      let monsterObj: any = {
        $: monsterAttributes,
        name: monster.name,
        slug: monster.slug,
        size: Monster.getCompendiumSize(monster),
        type: monster.type,
        alignment: monster.alignment,
        ac: monster.ac,
        hp: monster.hp,
        speed: monster.speed,
        str: monster.str,
        dex: monster.dex,
        con: monster.con,
        int: monster.int,
        wis: monster.wis,
        cha: monster.cha,
        save: monster.saves,
        skill: monster.skills,
        vulnerable: monster.vulnerabilities,
        resist: monster.resistances,
        immune: monster.damageImmunities,
        conditionImmune: monster.conditionImmunities,
        senses: monster.senses,
        passive: monster.passivePerception,
        languages: monster.languages,
        cr: monster.challenge,
        environment: monster.environments,
        image: monster.image,
        token: monster.token,
        trait: traits,
        action: actions,
        bonus: bonusActions,
        reaction: reactions,
        legendary: legendaryActions,
        description: monster.description
      }

      // Delete undefined fields
      Object.keys(monsterObj).forEach((key) => {
        if (monsterObj[key] === undefined) {
          delete monsterObj[key]
        }
      })
      return monsterObj
    })

    // Map item data
    let items = this.items.map((item) => {
      let itemImageFolder = Path.join(outputPath, 'items')
      if (!FileSystem.existsSync(itemImageFolder)) {
        FileSystem.mkdirSync(itemImageFolder)
      }

      let itemAttributes = {
        id: item.id,
      }

      let itemObj: any = {
        $: itemAttributes,
        name: item.name,
        slug: item.slug,
        type: Item.getCompendiumType(item),
        property: Item.getCompendiumProperty(item),
        dmgType: Item.getCompendiumDmgType(item),
        weight: item.weight,
        heading: item.heading,
        attunement: item.attunement,
        rarity: item.rarity,
        value: item.value,
        dmg1: item.primaryDamage,
        dmg2: item.secondaryDamage,
        range: item.range,
        ac: item.ac,
        source: item.source,
        image: item.image,
        text: item.description,
      }

      // Delete undefined fields
      Object.keys(itemObj).forEach((key) => {
        if (itemObj[key] === undefined) {
          delete itemObj[key]
        }
      })
      return itemObj
    })

    // Map spell data
    let spells = this.spells.map((spell) => {
      let spellImageFolder = Path.join(outputPath, 'spells')
      if (!FileSystem.existsSync(spellImageFolder)) {
        FileSystem.mkdirSync(spellImageFolder)
      }

      let spellAttributes = {
        id: spell.id,
      }

      let spellObj: any = {
        $: spellAttributes,
        name: spell.name,
        slug: spell.slug,
        level: spell.level,
        school: Spell.getCompendiumSchool(spell),
        ritual: spell.ritual ? 'YES' : 'NO',
        time: spell.time,
        range: spell.range,
        components: spell.components,
        duration: spell.duration,
        classes: spell.classes,
        source: spell.source,
        image: spell.image,
        text: spell.description,
      }

      // Delete undefined fields
      Object.keys(spellObj).forEach((key) => {
        if (spellObj[key] === undefined) {
          delete spellObj[key]
        }
      })
      return spellObj
    })

    // Layout root module data structure
    let moduleData = {
      $: { id: this.moduleProjectInfo.id },
      name: this.moduleProjectInfo.name,
      slug: this.moduleProjectInfo.slug,
      description: this.moduleProjectInfo.description,
      author: this.moduleProjectInfo.author,
      code: this.moduleProjectInfo.referenceCode,
      category: this.moduleProjectInfo.category,
      image: this.moduleProjectInfo.moduleCoverPath,
      group: groups,
      page: pages,
      map: maps,
      encounter: encounters,
    }

    let moduleBuilder = new XML2JS.Builder({ rootName: 'module' })
    let moduleXML = moduleBuilder.buildObject(moduleData)

    FileSystem.writeFileSync(modulePath, moduleXML)

    let hasCompendiumData = monsters.length > 0 || items.length > 0 || spells.length > 0
    let compendiumData = {
      monster: monsters,
      item: items,
      spell: spells,
    }

    if (hasCompendiumData) {
      let compendiumBuilder = new XML2JS.Builder({ rootName: 'compendium' })
      let compendiumXML = compendiumBuilder.buildObject(compendiumData)
      FileSystem.writeFileSync(compendiumPath, compendiumXML)
    }
  }

  /**
   * Processes a directory, parsing and copying module content
   * @param directoryPath The directory path
   * @param moduleBuildPath The module build folder path
   * @param parentGroup The parent group (optional)
   */
  private processDirectory = (directoryPath: string, moduleBuildPath: string, parentGroup: Group | undefined = undefined) => {
    const scanOnly = this.exportMode === ModuleMode.ScanModule

    if (!scanOnly) {
      Logger.info(`Processing directory: ${directoryPath}`)
    }

    let moduleProjectDirectory = this.moduleProjectInfo.moduleProjectDirectory
    if (!moduleProjectDirectory) {
      throw Error('The module project directory was empty. Was the module project file deleted?')
    }

    let relativeDirectoryPath = Path.relative(moduleProjectDirectory, directoryPath)
    let moduleBuildClonePath = Path.join(moduleBuildPath, relativeDirectoryPath)
    if (!scanOnly && !FileSystem.existsSync(moduleBuildClonePath)) {
      FileSystem.mkdirSync(moduleBuildClonePath)
    }

    // Get all subdirectories - we will recursively scan
    // through these, creating Groups.
    let subdirectoryNames: string[] = FileSystem.readdirSync(directoryPath).filter(function (file) {
      let childPath = Path.join(directoryPath, file)
      // skip hidden directories
      return FileSystem.statSync(childPath).isDirectory() && !/(^|\/)\.[^\/\.]/g.test(file)
    })

    // Ensure there are files in the modules directory
    let directoryChildren = FileSystem.readdirSync(directoryPath)

    // Parse each file
    directoryChildren.forEach((itemName) => {
      let fullPath = Path.join(directoryPath, itemName)
      if (!FileSystem.statSync(fullPath).isFile()) {
        return
      }

      // Copy images to their clone path in the module build folder
      let extension = Path.extname(fullPath)

      // Copy source files to the output so they are stored with the module
      const sourceExtensions = ['.md', '.yaml']

      if (!moduleProjectDirectory) {
        throw Error('The module project directory was empty. Was the module project file deleted?')
      }
      let itemRelativePath = Path.relative(moduleProjectDirectory, fullPath)
      let itemClonePath = Path.join(moduleBuildPath, itemRelativePath)
      let skipCopy = parentGroup !== undefined && !parentGroup.copyFiles && this.exportMode === ModuleMode.ModuleExport
      if (!scanOnly && !skipCopy && (Module.imageExtensions.includes(extension) || sourceExtensions.includes(extension))) {
        FileSystem.copyFileSync(fullPath, itemClonePath)
      }

      let newPages = this.processFile(fullPath, moduleBuildPath, parentGroup)
      newPages.forEach((page) => {
        this.pages.push(page)
      })
    })

    // Parse subdirectories
    subdirectoryNames.forEach((subdirectoryName) => {
      let subdirectoryPath = Path.join(directoryPath, subdirectoryName)
      if (subdirectoryPath === moduleBuildPath) {
        return
      }

      // Skip any folder with a "Module.yaml" file. This is indication
      // this is the start of another module project.
      let moduleProjectFilePath = Path.join(subdirectoryPath, Module.moduleProjectFileName)
      if (FileSystem.existsSync(moduleProjectFilePath)) {
        return
      }

      // Create a new group with a random UUID
      // and assign the parent
      let newGroup = new Group(subdirectoryName, this.moduleProjectInfo.id, subdirectoryPath)

      // Skip any folder with an ".ignoregroup" file for the purpose of
      // creating groups or reading .md files. However, copy
      // their content to the module output (as they may be an
      // image or resource folder) if they're in the root level. This is legacy
      // behavior, and is now taken care of by setting the include-in to files for
      // Groups in the group.yaml.
      let ignoreFilePath = Path.join(subdirectoryPath, '.ignoreGroup')
      let isFilesOnly = newGroup.includeIn === IncludeMode.Files || FileSystem.existsSync(ignoreFilePath)
      let skipCopy = !newGroup.copyFiles && this.exportMode == ModuleMode.ModuleExport

      var includeGroup: boolean = (newGroup.includeIn === IncludeMode.All ||
        (newGroup.includeIn === IncludeMode.Print && this.exportMode === ModuleMode.PrintToPDF) ||
        (newGroup.includeIn === IncludeMode.Module && this.exportMode === ModuleMode.ModuleExport))
        && !isFilesOnly
        
      if (includeGroup) {        
        newGroup.parent = parentGroup
        if (parentGroup) {
          parentGroup.children.push(newGroup)
        } else {
          this.children.push(newGroup)
        }

        // Push group to list of groups and recursively start
        // parsing subdirectory
        this.groups.push(newGroup)
      } else {
        // If not simply scanning - still copy the directory
        // so the resources are part of the module (unless the group is explicitly
        // marked not to)
        if(!scanOnly && !skipCopy) {
          let copyPath = Path.join(moduleBuildClonePath, subdirectoryName)
          FileSystem.copySync(subdirectoryPath, copyPath)
        }
      }

      // Do not process subdirectories if files only
      if (isFilesOnly) {
        return
      }

      this.processDirectory(subdirectoryPath, moduleBuildPath, newGroup)
    })
  }

  /**
   * Processes a markdown file and converts it to module-appropriate
   * HTML.
   * @param filePath The path of the markdown file to process
   * @param moduleBuildPath The module build folder path
   * @param parentGroup The parent group (optional)
   */
  public processFile = (filePath: string, moduleBuildPath: string, parentGroup: Group | undefined = undefined): Page[] => {
    const scanOnly = this.exportMode === ModuleMode.ScanModule
    const forPrint = this.exportMode === ModuleMode.PrintToPDF
    const forModuleExport = this.exportMode === ModuleMode.ModuleExport
    
    let markdownRenderer = new MarkdownRenderer(forPrint, this)
    let markdown = markdownRenderer.getRenderer()

    let pages: Page[] = []
    let extension = Path.extname(filePath)

    let isIgnored = false
    this.moduleProjectInfo.ignoredFiles.forEach(ignoredFile => {
      isIgnored = isIgnored || (ignoredFile == filePath)
    })
    if (isIgnored) {
      return pages
    }

    let monsterModulePath = Path.join(moduleBuildPath, 'monsters')
    if (forModuleExport && !FileSystem.existsSync(monsterModulePath)) {
      FileSystem.mkdirSync(monsterModulePath)
    }

    let itemModulePath = Path.join(moduleBuildPath, 'items')
    if (forModuleExport && !FileSystem.existsSync(itemModulePath)) {
      FileSystem.mkdirSync(itemModulePath)
    }

    let spellModulePath = Path.join(moduleBuildPath, 'spells')
    if (forModuleExport && !FileSystem.existsSync(spellModulePath)) {
      FileSystem.mkdirSync(spellModulePath)
    }

    let fileFolderPath = Path.dirname(filePath)

    // All code below is for parsing markdown files,
    // so ignore any non-markdown files
    if (extension != '.md') {
      return pages
    }

    if (!scanOnly) {
      Logger.info(`Processing file: ${filePath}`)
    }

    // Read the markdown file contents
    let data = FileSystem.readFileSync(filePath, 'utf8')

    // Use GrayMatter to separate YAML front-matter (name, slug, etc.)
    // from markdown. Matter data are attributes, matter content is the
    // body of the page.
    let matter = GrayMatter(data)
    let frontMatter = matter.data
    for (let key in frontMatter) {
      frontMatter[key.toLowerCase()] = frontMatter[key]
    }

    // If defined in the front-matter, get the name
    // for the page there. Otherwise, get it from
    // the file name
    let pageName = (frontMatter['name'] as string) || Path.basename(filePath)
    let order = frontMatter['order'] as number
    let slug = frontMatter['slug'] as string
    let printMultiColumn = (frontMatter['pdf-page-style'] as string) !== 'single-column'
    let pagebreaks = forPrint ? (frontMatter['pdf-pagebreaks'] as string) : (frontMatter['module-pagebreaks'] as string)
    let printCoverOnly = (frontMatter['print-cover-only'] as boolean) === true
    this.slug = slug

    // "parent-page" is the legacy way of defining the parent for a page
    let parentSlug = frontMatter['parent-page'] as string
    if (frontMatter['parent']) {
      parentSlug = frontMatter['parent']
    }

    let pagebreakContentFound = false

    let includeIn = frontMatter['include-in']

    // Get footer text. By default, it will be "<Page Name> | <Parent Name>"
    let parentName = parentGroup ? parentGroup.name : this.moduleProjectInfo.name
    let footerText = frontMatter['footer'] as string
    this.printFooterContent = footerText || `${pageName} | ${parentName}`
    if ((frontMatter['hide-footer-text'] as boolean) === true) {
      this.printFooterContent = ''
    }

    if ((frontMatter['hide-footer'] as boolean) === true) {
      this.hideFooter = true
    } else {
      this.hideFooter = false
    }

    // Convert markdown to HTML
    let html = markdown.render(matter.content)

    // Add monsters parsed from the markdown page into
    // the module's monster list.
    markdownRenderer.monsters.forEach((monster) => {
      if (forModuleExport && monster.image) {
        let imageAbsolutePath = Path.join(fileFolderPath, monster.image)
        let monsterImageExtension = Path.extname(imageAbsolutePath)
        let newMonsterImageFileName = `${monster.id}-image${monsterImageExtension}`
        let imageDestinationPath = Path.join(monsterModulePath, newMonsterImageFileName)
        monster.image = newMonsterImageFileName
        FileSystem.copyFileSync(imageAbsolutePath, imageDestinationPath)
      }
      if (forModuleExport && monster.token) {
        let tokenAbsolutePath = Path.join(fileFolderPath, monster.token)
        let tokenImageExtension = Path.extname(tokenAbsolutePath)
        let newTokenImageFileName = `${monster.id}-token${tokenImageExtension}`
        let tokenDestinationPath = Path.join(monsterModulePath, newTokenImageFileName)
        monster.token = newTokenImageFileName
        FileSystem.copyFileSync(tokenAbsolutePath, tokenDestinationPath)
      }

      this.monsters.push(monster)
    })

    // Add items parsed from the markdown page into
    // the module's item list.
    markdownRenderer.items.forEach((item) => {
      if (forModuleExport && item.image) {
        let imageAbsolutePath = Path.join(fileFolderPath, item.image)
        let imageExtension = Path.extname(imageAbsolutePath)
        let newImageFileName = `${item.id}-image${imageExtension}`
        let imageDestinationPath = Path.join(itemModulePath, newImageFileName)
        item.image = newImageFileName
        FileSystem.copyFileSync(imageAbsolutePath, imageDestinationPath)
      }
      this.items.push(item)
    })

    // Add spells parsed from the markdown page into
    // the module's spells list.
    markdownRenderer.spells.forEach((spell) => {
      if (forModuleExport && spell.image) {
        let imageAbsolutePath = Path.join(fileFolderPath, spell.image)
        let imageExtension = Path.extname(imageAbsolutePath)
        let newImageFileName = `${spell.id}-image${imageExtension}`
        let imageDestinationPath = Path.join(spellModulePath, newImageFileName)
        spell.image = newImageFileName
        FileSystem.copyFileSync(imageAbsolutePath, imageDestinationPath)
      }
      this.spells.push(spell)
    })

    let coverImagePath: string | undefined = undefined
    if (frontMatter['cover']) {
      coverImagePath = Path.join(fileFolderPath, frontMatter['cover'])
    }

    // If we have pagebreaks defined, we'll attempt to split
    // up, group, and subgroup content by header values
    if (pagebreaks !== undefined) {
      // Remove spaces from pagebreaks list
      pagebreaks = pagebreaks.replace(/\s/g, '')

      let $ = Cheerio.load(html)
      let cover: cheerio.Element | undefined = undefined
      let pagesByHeader: { [slug: string]: ModuleEntity } = {}

      let firstPageBreak = $('*').find(pagebreaks).first()
      $(firstPageBreak)
        .prevAll()
        .each((i, element) => {
          if ($(element).find('.before-next-page-header').length > 0) {
            cover = element
          }
        })

      let nestedSortOrder = 0
      $(pagebreaks).each((i, element) => {
        let headerText = $(element).text()

        if (!scanOnly) {
          Logger.info(`Parsing page from header "${headerText}"`)
        }

        // Create Page from current HTML
        let page = new Page(headerText, this.moduleProjectInfo.id, filePath)
        if (!scanOnly) {
          Logger.info(`Slug for page "${page.name}": ${page.slug}`)
        }

        page.content += $.html(element)
        page.printCoverOnly = printCoverOnly
        page.sort = order

        // If there is a cover image, apply to top current page
        if (cover) {
          page.content = $.html(cover) + page.content
          cover = undefined
        }

        // Advance through page content until the next header
        $(element)
          .nextUntil(pagebreaks)
          .each((i, element) => {
            // Special case cover images - they will be moved
            // to the beginning of the page later
            if ($(element).find('.before-next-page-header').length > 0) {
              cover = element              
            } else {
              page.content += $.html(element)
            }
          })

        pagesByHeader[headerText] = page

        // Find higher level header levels - for example, if the user specified
        // "h1,h2,h3" for pagebreaks, then this will return "h1,h2".
        let parentPagebreaks = Module.trim(pagebreaks.split(element.tagName)[0], ',')

        // Traverse backwards until we find the parent page break
        let parentElement: cheerio.Cheerio | undefined = undefined

        // Parent page breaks will be "" if none exist
        if (parentPagebreaks) {
          parentElement = $(element).prevAll(parentPagebreaks).first()
        }

        // If we found a parent page break, we can assign that as the
        // parent for this group
        if (parentElement !== undefined && parentElement.length !== 0) {
          let parentHeader = parentElement.text()
          const pageParent = pagesByHeader[parentHeader]
          if (pageParent) {
            page.parent = pageParent
            pageParent.children.push(page)
            page.sort = nestedSortOrder
            nestedSortOrder += 1
          } else {
            Logger.info(`Page for header "${parentHeader}" was not found. This is a bug in the module packer.`)
          }
        }

        // If the page has no parent and there is a group,
        // make page belong to that group. If a parent page
        // is defined (for nested pages), use that.
        if ((parentElement === undefined || parentElement.length === 0) && parentGroup !== undefined) {
          page.parent = parentGroup
          parentGroup.children.push(page)
          page.parentSlug = parentSlug
        }

        // Assign page as child of root module if no parent assigned
        if (!page.parent) {
          this.children.push(page)
        }

        // If page doesn't explicitly set IncludeIn, inherit it
        if(includeIn !== undefined) {
          page.includeIn = ModuleEntity.getIncludeModeFromString(includeIn)
        } else if (page.parent !== undefined) {
          page.includeIn = page.parent.includeIn
        } else {
          page.includeIn = IncludeMode.All
        }        
        if(page.includeIn === IncludeMode.Files)
        {
          throw Error(`The 'include-in' value for groups cannot be 'files'`)
        }

        this.postProcessPage(page, filePath, printMultiColumn, coverImagePath)  

        // Finally, add the page to the module
        pages.push(page)
        pagebreakContentFound = true
      })
    }

    // If a page hasn't otherwise been created by
    // pagebreak parsing logic, use full HTML
    // to create page
    if (!pagebreakContentFound) {
      let page = new Page(pageName, this.moduleProjectInfo.id, filePath, slug)
      if (!scanOnly) {
        Logger.info(`Slug for page "${page.name}": ${page.slug}`)
      }

      page.printCoverOnly = printCoverOnly
      page.sort = order
      page.parentSlug = parentSlug

      if (parentGroup) {
        page.parent = parentGroup
        parentGroup.children.push(page)
      } else {
        this.children.push(page)
      }

      page.content = html

      // If page doesn't explicitly set IncludeIn, inherit it
      if(includeIn !== undefined) {
        page.includeIn = ModuleEntity.getIncludeModeFromString(includeIn)
      } else if (page.parent !== undefined) {
        page.includeIn = page.parent.includeIn
      } else {
        page.includeIn = IncludeMode.All
      }        
      if(page.includeIn === IncludeMode.Files)
      {
        throw Error(`The 'include-in' value for groups cannot be 'files'`)
      }

      this.postProcessPage(page, filePath, printMultiColumn, coverImagePath)

      pages.push(page)
    }

    return pages
  }

  /**
   * Applies post-processing to the page
   * @param page The page to post-process
   * @param filePath The file path of of the page
   * @param printMultiColumn Whether the page is multi-column
   * @param coverImagePath The page's cover image path (or undefined if it does not have one)
   */
  private postProcessPage = (page: Page, filePath: string, printMultiColumn: boolean, coverImagePath: string | undefined) => {
    const printToPDF = this.exportMode === ModuleMode.PrintToPDF

    // Wrap page content in a page DIV when printing
    page.content = this.wrapPageInPrintDivs(page.content)

    // Process image and script links to handle relative paths
    page.content = this.postProcessLinks(page.content, filePath)

    // Process elements for print layouts
    page.content = this.postProcessForPrint(page.content, printMultiColumn)

    // Process anchors
    page.content = this.postProcessAnchors(page.content, page.slug)

    // Process roll tables
    page.content = this.postProcessRollTables(page.content, page.name, page.slug)

    // Prepend a cover page if this section has one
    if (coverImagePath && printToPDF) {
      let coverImageData = FileSystem.readFileSync(coverImagePath).toString('base64')
      let prependContent = `<div class="print-section-cover-page" style="background-image: url(data:image;base64,${coverImageData})">`
      prependContent += `<div class="print-page hidden">`
      prependContent += `<div class="footer-page-number hidden">`
      prependContent += `</div>` // footer-page-number
      prependContent += `</div>` // print-page
      prependContent += `</div>` // print-section-cover-page

      // If the markdown is designed to show only the print cover,
      // then the content of the page can be removed
      if (page.printCoverOnly) {
        page.content = prependContent
      } else {
        page.content = prependContent + page.content
      }
    }
  }

  /**
   * Converts HTML roll tables into E+ roll tables
   * @param pageContent The page content
   * @param pageName The page name
   * @param pageSlug The page slug
   * @returns The page content modified with anchors
   */
   private postProcessRollTables = (pageContent: string, pageName: string, pageSlug: string): string => {
    const moduleBuild = this.exportMode === ModuleMode.ModuleExport
    const createRollTables = this.moduleProjectInfo.createRollTables === true

    if (!moduleBuild || !createRollTables) {
      return pageContent
    }

    let $ = Cheerio.load(pageContent)
    let rollTables: RollTable[] = []
    $('table').each((i, element) => {
      let isFirstHeader = true
      let isRollTable = false
      let rollHeaderLink: cheerio.Element | undefined = undefined
      let columns: RollTableColumn[] = []
      let rows: string[][] = []
      $(element).find('thead > tr > th').each((i, header) => {
        let headerText = $(header).text()
        if (isFirstHeader) {
          isFirstHeader = false          
          $(header).find('a').each((i, headerLink) => {
            rollHeaderLink = headerLink
            let headerLinkDestination = $(headerLink).attr('href')
            isRollTable = headerLinkDestination !== undefined && headerLinkDestination.startsWith('/roll/')
          })
        }

        if (!isRollTable) {
          return
        }

        let headerStyle = $(header).attr('style')
        let columnAlignment: RollTableColumnAlignment = RollTableColumnAlignment.Left
        if (headerStyle !== undefined && headerStyle.includes('text-align:center')) {
          columnAlignment = RollTableColumnAlignment.Center
        } else if (headerStyle !== undefined && headerStyle.includes('text-align:right')) {
          columnAlignment = RollTableColumnAlignment.Right
        }
        
        columns.push(new RollTableColumn(headerText, columnAlignment))
      })

      if (!isRollTable) {
        return
      }

      $(element).find('tbody > tr').each((i, row) => {
        let rowTexts: string[] = []
        $(row).find('td').each((i, cell) => {
          rowTexts.push($(cell).text())
        })
        rows.push(rowTexts)
      })
      let rollTableSlug = Module.getSlugFromValue(`${this.slug}-${pageSlug}-roll-table`)
      let rollTable = new RollTable(`${this.moduleProjectInfo.name} - ${pageName}`, this.moduleProjectInfo.id, rollTableSlug)
      rollTable.source = this.moduleProjectInfo.name
      rollTable.columns = columns
      rollTable.rows = rows
      rollTables.push(rollTable)
      $(rollHeaderLink).attr('href', `/table-roll/${rollTableSlug}`)
    })

    rollTables.forEach((rollTable) => {
      this.rollTables.push(rollTable)
    })
    return $('body').html() ?? pageContent
  }

  /**
   * Adds slugified anchors for all of the header content
   * @param pageContent The page content
   * @param slug The slug of the parent page
   * @returns The page content modified with anchors
   */
  private postProcessAnchors = (pageContent: string, slug: string): string => {
    const scanOnly = this.exportMode === ModuleMode.ScanModule

    if (scanOnly) {
      return pageContent
    }

    let $ = Cheerio.load(pageContent)
    $('h1,h2,h3,h4,h5,h6').each((i, element) => {
      let headerText = $(element).text()
      if (!headerText) {
        return
      }

      let headerSlug = Slugify(headerText, {
        lower: true,
        remove: /[*+~.()'"!:@&’]/g,
        strict: true,
      })

      // Create an anchor out of just the header slug. In
      // many cases, this will create duplicates. Which anchor
      // the client will navigate to one of the IDs
      // (which one is not specified, but probably the first)
      $(element).prepend(`<a id="${headerSlug}"></a>`)
      Logger.info(`Anchor created: ${headerSlug}`)

      let anchorID = `${slug}-${headerSlug}`
      $(element).prepend(`<a id="${anchorID}"></a>`)
      Logger.info(`Anchor created: ${anchorID}`)
    })

    return $('body').html() ?? pageContent
  }

  /**
   * Converts all image and script sources into the relative links they need to be
   * after conversion to a module (which places all pages in the root folder
   * effectively)
   * @param pageContent The page content
   * @param markdownFilePath The path of the markdown file being processed
   */
  private postProcessLinks = (pageContent: string, markdownFilePath: string): string => {
    const scanOnly = this.exportMode === ModuleMode.ScanModule

    if (scanOnly) {
      return pageContent
    }

    let moduleProjectDirectory = this.moduleProjectInfo.moduleProjectDirectory
    if (!moduleProjectDirectory) {
      throw Error('The module project directory was empty. Was the module project file deleted?')
    }

    let fileFolder = Path.dirname(markdownFilePath)
    let relativeFolderPath = Path.relative(moduleProjectDirectory, fileFolder)

    let $ = Cheerio.load(pageContent)
    $('img, script').each((i, element) => {
      let oldSrc = $(element).attr('src')
      if (!oldSrc) {
        return
      }

      if (oldSrc.startsWith('/')) {
        // Make absolute paths relative to the module's root by stripping the /
        let newSrc = oldSrc.substring(1);
        $(element).attr('src', newSrc)
      } else {
        let srcIsAbsolute = /^https?:\/\//i.test(oldSrc)
        if (!srcIsAbsolute) {
          let newSrc = Path.join(relativeFolderPath, oldSrc)
          $(element).attr('src', newSrc)
        }
      }
    })

    return $('body').html() ?? pageContent
  }

  /**
   * Post-processes the HTML elements for print layout
   * @param pageContent The current page HTML
   * @param printMultiColumn If true, the print layout is two columns
   */
  private postProcessForPrint = (pageContent: string, printMultiColumn: boolean): string => {
    const forPrint = this.exportMode === ModuleMode.PrintToPDF

    if (!forPrint) {
      return pageContent
    }

    let $ = Cheerio.load(pageContent)
    if (!printMultiColumn) {
      $('div.page-content.two-column').each((i, element) => {
        $(element).attr('class', 'page-content')
      })
    }

    // Remove images meant for screen only on print output
    $('img.screen-only').each((i, element) => {
      $(element).remove()
    })

    $('img.size-cover').each((i, element) => {
      $(element).parents('p').attr('class', 'size-cover')
    })

    $('img.size-side-right').each((i, element) => {
      $(element).parents('p').attr('class', 'size-side-right')
    })

    $('img.size-full').each((i, element) => {
      $(element).parents('p').attr('class', 'size-full')
    })

    $('figure.size-full').each((i, element) => {
      $(element).parents('p').attr('class', 'size-full')
    })

    $('div.statblock.two-column').each((i, element) => {
      let oldClasses = $(element).attr('class')
      $(element).attr('class', oldClasses + ' size-full')
    })

    $('a').each((i, element) => {
      let oldHref = $(element).attr('href')
      if (oldHref && !oldHref.includes('/')) {
        $(element).attr('href', `#${oldHref}`)
      }
    })

    return $('body').html() ?? pageContent
  }

  /**
   * Gets all files and folders in a directory, recursively going through subdirectory
   * @param directoryPath The directory path
   */
  private getAllDirectoryImages = (directoryPath: string): string[] => {
    let items: string[] = FileSystem.readdirSync(directoryPath)
    let images: string[] = []

    items.forEach((item) => {
      let fullPath = Path.join(directoryPath, item)
      if (FileSystem.statSync(fullPath).isDirectory()) {
        let subDirImages = this.getAllDirectoryImages(fullPath)
        subDirImages.forEach((image) => {
          images.push(image)
        })
      } else {
        let extension = Path.extname(fullPath)
        if (Module.imageExtensions.includes(extension)) {
          images.push(fullPath)
        }
      }
    })

    return images
  }

  /**
   * If true, wraps the page HTML in print divs
   * when the `exportForPrint` flag is true.
   * @param originalHTML The original HTML
   */
  private wrapPageInPrintDivs = (originalHTML: string): string => {
    const forPrint = this.exportMode === ModuleMode.PrintToPDF
    if (!forPrint) {
      return originalHTML
    }

    let newHTML = this.getPageOpenHTML()
    newHTML += originalHTML
    newHTML += this.getPageCloseHTML()
    return newHTML
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
    return value.replace(new RegExp('^[' + character + ']+|[' + character + ']+$', 'g'), '')
  }
}

/** The module creation mode */
export enum ModuleMode {
  /** Exports a module to a .module file */
  ModuleExport = 1,

  /** Exports a module to a PDF file */
  PrintToPDF,

  /** Does not create a module file - simply scans the module info */
  ScanModule,
}
