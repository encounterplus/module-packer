import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Glob from 'glob'
import { v4 as UUIDV4 } from 'uuid'
import * as YAML from 'yaml'
import { Module } from './Module Entities/Module'
import { MapFileReference } from './MapFileReference'
import { EncounterFileReference } from './EncounterFileReference'
import { ReferenceInfo } from './ReferenceInfo'

/** 
 * Defines project-level information about a project
 */
export class ModuleProject {

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The name of the module */
  name: string = 'New Module'

  /** The UUID of the module */
  id: string = UUIDV4()

  /** The slug for the module */
  slug: string = 'new-module'

  /** The module description */
  description: string | undefined = undefined

  /** The module author */
  author: string | undefined = undefined

  /** The module category */
  category: string | undefined = undefined

  /** The reference code of the module */
  referenceCode: string | undefined = undefined

  /** The module image relative path */
  moduleCoverPath: string | undefined = undefined

  /** The cover image for print */
  printCoverPath: string | undefined = undefined

  /** The module version */
  version: number | undefined = undefined

  /** The path for the module archive (after it is created) */
  moduleArchivePath: string | undefined = undefined

  /** The root directory for the module project */
  moduleProjectDirectory: string | undefined = undefined

  /** The path for the module project definition file */
  moduleProjectPath: string | undefined = undefined

  /** Whether the module project auto-increments its version */
  autoIncrementVersion: boolean | undefined = undefined

  /** Whether the module will automatically compress images when building */
  compressImages: boolean | undefined = undefined

  /** Whether the module will automatically delete empty groups */
  deleteEmptyGroups: boolean | undefined = undefined

  /** The print link mode */
  printLinkMode: PrintLinkMode | undefined = undefined

  /** The document size */
  printDocumentSize: PrintDocumentSize | undefined = undefined

  /** The module map references for the project */
  mapFiles: MapFileReference[] = []

  /** The module encounter references for the project */
  encounterFiles: EncounterFileReference[] = []

  /** The references for the project */
  references: ReferenceInfo[] = []

  /** The list of paths that are ignored from being processed */
  ignoredPaths: string[] | undefined = undefined

  /** The list of ignored files */
  ignoredFiles: string[] = []

  /** Whether to automatically create roll tables */
  createRollTables: boolean | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------
  
  /**
   * Finds all module projects in a given directory.
   * @param rootDirectory The root directory
   */
  static findModuleProjects(rootDirectory: string): ModuleProject[] {
    let moduleProjects: ModuleProject[] = []

    // Get all subdirectories - we will recursively scan
    // through these, creating Groups.
    let subdirectoryNames: string[] = FileSystem.readdirSync(rootDirectory).filter(function (file) {
      let childPath = Path.join(rootDirectory, file)
      return FileSystem.statSync(childPath).isDirectory() && !(file === 'ModuleBuild')
    })

    // Get module projects from subdirectories
    subdirectoryNames.forEach((subdirectoryName) => {      
      let subdirectoryPath = Path.join(rootDirectory, subdirectoryName)
      let subdirectoryModules = ModuleProject.findModuleProjects(subdirectoryPath)
      subdirectoryModules.forEach ( (moduleProject) => {
        moduleProjects.push(moduleProject)
      })
    })

    let moduleProjectPath = Path.join(rootDirectory, Module.moduleProjectFileName)
    if(FileSystem.existsSync(moduleProjectPath)) {
      let moduleProject = ModuleProject.parseModuleProject(moduleProjectPath)
      if(moduleProject !== undefined) {
        moduleProjects.push(moduleProject)
      }
    }

    return moduleProjects
  }

  /**
   * Parses a Module.yaml as a ModuleProject
   * @param projectFilePath The path to the Module.yaml file
   */
  static parseModuleProject(projectFilePath: string): ModuleProject | undefined {
    // Simply return if module doesn't exist - default
    // module naming and handling will apply.
    if (!FileSystem.existsSync(projectFilePath)) {
      return undefined
    }

    let moduleProject = new ModuleProject()
    let moduleDataBuffer = FileSystem.readFileSync(projectFilePath)
    let moduleData: any = undefined
    try {
      moduleData = YAML.parse(moduleDataBuffer.toString())
    } catch (error: any) {
      throw Error(`Failed to parse ${projectFilePath}. Error: ${(error as Error).message}`)
    }
    
    moduleProject.moduleProjectPath = projectFilePath
    if(!FileSystem.existsSync(moduleProject.moduleProjectPath)) {
      throw Error(`Error, the project path "${moduleProject.moduleProjectPath}" could not be found.`)
    }

    moduleProject.moduleProjectDirectory = Path.dirname(projectFilePath)
    if(!FileSystem.existsSync(moduleProject.moduleProjectPath)) {
      throw Error(`Error, the directory "${moduleProject.moduleProjectDirectory}" could not be found.`)
    }

    if (moduleData === undefined || moduleData === null) {
      moduleData = []
    }

    // If ID is specified in Module project file, ensure it is a UUID and use that
    let id = moduleData['id'] as string
    if (id) {
      let uuidValidationRegEx = RegExp(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        'i'
      )
      let matches = id.match(uuidValidationRegEx)
      if (matches && matches.length > 0) {
        moduleProject.id = id
      } else {
        throw Error(`Invalid UUID specified in Module Project File at ${projectFilePath}`)
      }
    }

    // If name is specified in Module project file, use that
    let name = moduleData['name'] as string
    if (name) {
      moduleProject.name = name
    } else {
      let folderName = Path.basename(moduleProject.moduleProjectDirectory)
      moduleProject.name = folderName
    }

    // If name is specified in Module project file, use that, otherwise
    // use the slug based on the name
    let slug = moduleData['slug'] as string
    if (slug) {
      moduleProject.slug = Module.sanitizeSlug(slug)
    } else {
      moduleProject.slug = Module.getSlugFromValue(this.name)
    }

    // If description is specified in Module project file, use that.
    let description = moduleData['description'] as string
    if (description) {
      moduleProject.description = description
    }

    // If category is specified in Module project file, use that.
    // Ensure values are 'adventure' or 'other'
    let category = moduleData['category'] as string
    if (category === 'adventure' || category === 'other') {
      moduleProject.category = category
    }

    // If author is specified in Module project file, use that
    let author = moduleData['author'] as string
    if (author) {
      moduleProject.author = author
    }

    // If reference code is specified in Module project file, use that
    let code = moduleData['code'] as string
    if (code) {
      moduleProject.referenceCode = code
    }

    // If version is specified in Module project file, use that
    let version = moduleData['version'] as number
    if (version) {
      moduleProject.version = version
    }

    // If autoIncrementVersion is specified in Module project file, use that
    let autoIncrementVersion = (moduleData['autoIncrementVersion'] as boolean || moduleData['auto-increment-version'] as boolean)
    if (autoIncrementVersion !== undefined) {
      moduleProject.autoIncrementVersion = autoIncrementVersion
    }

    // If compressImages is specified in Module project file, use that
    let compressImages = (moduleData['compressImages'] as boolean || moduleData['compress-images'] as boolean)
    if (compressImages !== undefined) {
      moduleProject.compressImages = compressImages
    }

    // If deleteEmptyGroups is specified in Module project file, use that
    let deleteEmptyGroups = (moduleData['deleteEmptyGroups'] as boolean || moduleData['delete-empty-groups'] as boolean)
    if (deleteEmptyGroups !== undefined) {
      moduleProject.deleteEmptyGroups = deleteEmptyGroups
    }

    // If printLinkMode is specified in Module project file, use that
    let printLinkModeString = (moduleData['printLinkUpdate'] as string || moduleData['print-link-update'] as string)
    if (printLinkModeString) {
      moduleProject.printLinkMode = ModuleProject.getPrintLinkMode(printLinkModeString)
    }

    // If printDocumentSize is specified in Module project file, use that
    let printDocumentSize = (moduleData['printDocumentSize'] as string || moduleData['print-document-size'] as string)
    if (printDocumentSize) {
      moduleProject.printDocumentSize = ModuleProject.getPrintDocumentSize(printDocumentSize)
    }

    // If cover image is specified in Module project file, use that.
    // Ensure cover image actually exists
    let moduleCoverPath = moduleData['cover'] as string
    if (moduleCoverPath) {
      let moduleDirectory = Path.dirname(projectFilePath)
      let fullImagePath = Path.join(moduleDirectory, moduleCoverPath)
      if (!FileSystem.existsSync(fullImagePath)) {
        throw Error(`Module cover image path does not exist: ${fullImagePath}`)
      }
      moduleProject.moduleCoverPath = moduleCoverPath
    }

    // If cover image is specified in Module project file, use that.
    // Ensure cover image actually exists
    let printCoverPath = (moduleData['printCover'] as string || moduleData['print-cover'])
    if (printCoverPath) {
      let moduleDirectory = Path.dirname(projectFilePath)
      let fullImagePath = Path.join(moduleDirectory, printCoverPath)
      if (!FileSystem.existsSync(fullImagePath)) {
        throw Error(`Module cover image path does not exist: ${fullImagePath}`)
      }
      moduleProject.printCoverPath = printCoverPath
    }

    // If the module has ignored paths
    let ignoredPaths = moduleData['ignore'] as string[]
    if (ignoredPaths) {
      moduleProject.ignoredPaths = ignoredPaths
      ignoredPaths.forEach(globPath => {
        let moduleDirectory = Path.dirname(projectFilePath)
        let ignorePath = Path.join(moduleDirectory, globPath)
        let ignoredFiles = Glob.globSync(ignorePath)
        moduleProject.ignoredFiles = moduleProject.ignoredFiles.concat(ignoredFiles)
      })
    }

    // If map references exist, add them to project
    let maps = moduleData['maps'] as []
    moduleProject.mapFiles = []
    if (maps) {
      maps.forEach(map => {
        let mapPath = map['path'] as string
        if (mapPath === undefined) {
          throw new Error('A map reference must have a path defined')
        }

        let moduleDirectory = Path.dirname(projectFilePath)
        let fullMapPath = Path.join(moduleDirectory, mapPath)
        if (!FileSystem.existsSync(fullMapPath)) {
          throw new Error(`Unable to locate a map file at "${mapPath}"`)
        }

        let mapSort = map['order'] as number
        let mapParent = map['parent'] as string
        let mapSlug = map['slug'] as string
        let mapFile = new MapFileReference(mapPath, mapSort, mapSlug, mapParent)
        moduleProject.mapFiles.push(mapFile)
      })
    }

    // If encounter references exist, add them to project
    let encounters = moduleData['encounters'] as []
    moduleProject.encounterFiles = []
    if (encounters) {
      encounters.forEach(encounter => {
        let encounterPath = encounter['path'] as string
        if (encounterPath === undefined) {
          throw new Error('An encounter reference must have a path defined')
        }

        let moduleDirectory = Path.dirname(projectFilePath)
        let fullEncounterPath = Path.join(moduleDirectory, encounterPath)
        if (!FileSystem.existsSync(fullEncounterPath)) {
          throw new Error(`Unable to locate an encounter file at "${encounterPath}"`)
        }

        let encounterSort = encounter['order'] as number
        let encounterParent = encounter['parent'] as string
        let encounterSlug = encounter['slug'] as string
        let encounterFile = new EncounterFileReference(encounterPath, encounterSort, encounterSlug, encounterParent)
        moduleProject.encounterFiles.push(encounterFile)
      })
    }

    let references = moduleData['references'] as []
    moduleProject.references = []
    if (references) {
      references.forEach(reference => {
        let referencePath = reference['path'] as string
        if (referencePath === undefined) {
          throw new Error('A reference must have a path defined')
        }

        let referenceName = reference['name'] as string
        if (referenceName === undefined) {
          throw new Error('A reference must have a name')
        }

        let referenceSort = reference['order'] as number
        let referenceParent = reference['parent'] as string
        let referenceSlug = reference['slug'] as string
        let referenceInfo = new ReferenceInfo(referenceName, referencePath, referenceSort, referenceSlug, referenceParent)
        moduleProject.references.push(referenceInfo)
      })
    }

    // If createRollTables is specified in Module project file, use that
    let createRollTables = (moduleData['createRollTables'] as boolean || moduleData['create-roll-tables'] as boolean)
    if (createRollTables !== undefined) {
      moduleProject.createRollTables = createRollTables
    }

    return moduleProject
  }

  /**
   * Creates an empty Module.yaml file
   * @param projectPath The path to the project
   */
  static createModuleProjectFile(projectFilePath: string) {
    if (FileSystem.existsSync(projectFilePath)) {
      throw Error(`Could not create file "${projectFilePath}". It already exists.`)
    }

    let folderName = Path.basename(Path.dirname(projectFilePath))

    // Format Module.yaml data
    let newModule = new ModuleProject()
    newModule.id = UUIDV4()
    newModule.name = folderName
    newModule.slug = Module.sanitizeSlug(folderName)
    newModule.description = 'TBD'
    newModule.category = 'adventure'
    newModule.author = 'Anonymous'
    newModule.referenceCode = ''
    newModule.version = 1
    newModule.autoIncrementVersion = true

    // Write Module.yaml
    newModule.writeModuleProjectFile(projectFilePath)
  }

  /**
   * Writes the module project information to file
   * @param projectFilePath The path of the project file
   */
  writeModuleProjectFile(projectFilePath: string) {
    let newModuleProject: any = new Object()
    if (this.version !== undefined && this.autoIncrementVersion === true) {
      this.version += 1
    }

    if (this.id) {
      newModuleProject['id'] = this.id
    }
    if (this.name) {
      newModuleProject['name'] = this.name
    }
    if (this.slug) {
      newModuleProject['slug'] = this.slug
    }
    if (this.description) {
      newModuleProject['description'] = this.description
    }
    if (this.category) {
      newModuleProject['category'] = this.category
    }
    if (this.author) {
      newModuleProject['author'] = this.author
    }
    if (this.referenceCode) {
      newModuleProject['code'] = this.referenceCode
    }
    if (this.moduleCoverPath) {
      newModuleProject['cover'] = this.moduleCoverPath
    }
    if (this.printCoverPath) {
      newModuleProject['print-cover'] = this.printCoverPath
    }
    if (this.compressImages !== undefined) {
      newModuleProject['compress-images'] = this.compressImages
    }
    if (this.deleteEmptyGroups !== undefined) {
      newModuleProject['delete-empty-groups'] = this.deleteEmptyGroups
    }
    if (this.createRollTables !== undefined) {
      newModuleProject['create-roll-tables'] = this.createRollTables
    }
    if (this.printLinkMode !== undefined) {
      newModuleProject['print-link-update'] = ModuleProject.getPrintLinkModeString(this.printLinkMode)
    }
    if (this.printDocumentSize !== undefined) {
      newModuleProject['print-document-size'] = ModuleProject.getPrintDocumentSizeString(this.printDocumentSize)
    }
    newModuleProject['version'] = this.version    
    newModuleProject['auto-increment-version'] = true
    
    if (this.ignoredPaths !== undefined) {
      newModuleProject['ignore'] = this.ignoredPaths
    }
    
    if (this.mapFiles.length > 0)
    {
      let mapObjects: any[] = []
      this.mapFiles.forEach((map) => {        
        let mapObject: any = { }
        mapObject['path'] = map.path     
        if (map.sort !== undefined) {
          mapObject['order'] = map.sort
        }
        if (map.parentSlug !== undefined) {
          mapObject['parent'] = map.parentSlug
        }           
        if (map.slug !== undefined) {
          mapObject['slug'] = map.slug
        }
        mapObjects.push(mapObject)
      })
      newModuleProject['maps'] = mapObjects
    }

    if (this.encounterFiles.length > 0)
    {
      let encounterObjects: any[] = []
      this.encounterFiles.forEach((encounter) => {        
        let encounterObject: any = { }
        encounterObject['path'] = encounter.path     
        if (encounter.sort !== undefined) {
          encounterObject['order'] = encounter.sort
        }
        if (encounter.parentSlug !== undefined) {
          encounterObject['parent'] = encounter.parentSlug
        }           
        if (encounter.slug !== undefined) {
          encounterObject['slug'] = encounter.slug
        }
        encounterObjects.push(encounterObject)
      })
      newModuleProject['encounters'] = encounterObjects
    }

    if (this.references.length > 0)
    {
      let referenceObjects: any[] = []
      this.references.forEach((reference) => {        
        let referenceObject: any = { }
        referenceObject['path'] = reference.path
        referenceObject['name'] = reference.name     
        if (reference.sort !== undefined) {
          referenceObject['order'] = reference.sort
        }
        if (reference.parentSlug !== undefined) {
          referenceObject['parent'] = reference.parentSlug
        }           
        if (reference.slug !== undefined) {
          referenceObject['slug'] = reference.slug
        }
        referenceObjects.push(referenceObject)
      })
      newModuleProject['references'] = referenceObjects
    }

    let outputYAML = YAML.stringify(newModuleProject)
    FileSystem.writeFileSync(projectFilePath, outputYAML)
  }

  /**
   * Converts the print link mode string to an enum value 
   * @param printLinkModeString print link mode string
   */
  static getPrintLinkMode(printLinkModeString: string): PrintLinkMode {
    switch (printLinkModeString.toLowerCase()) {
      case 'dnd beyond entries':
        return PrintLinkMode.DNDBeyondEntries
      case 'd&d beyond entries':
        return PrintLinkMode.DNDBeyondEntries
      case 'dnd beyond search':
        return PrintLinkMode.DNDBeyondSearch
      case 'd&d beyond search':
        return PrintLinkMode.DNDBeyondSearch
      default:
          return PrintLinkMode.None
    }
  }

   /**
   * Converts the print document size string to an enum value 
   * @param printDocumentSizeString print document size string
   */
   static getPrintDocumentSize(printDocumentSizeString: string): PrintDocumentSize {
    switch (printDocumentSizeString.toLowerCase()) {
      case 'a4':
        return PrintDocumentSize.A4
      case 'letter':
        return PrintDocumentSize.Letter
      default:
        return PrintDocumentSize.Letter
    }
  }

  /**
   * Converts the print link mode string to a 
   * @param printLinkModeString print link mode string
   */
  static getPrintLinkModeString(printLinkMode: PrintLinkMode): string {
    switch (printLinkMode) {
      case PrintLinkMode.DNDBeyondEntries:
        return 'D&D Beyond Entries'
      case PrintLinkMode.DNDBeyondSearch:
        return 'D&D Beyond Search'
      default:
          return 'none'
    }
  }

   /**
   * Converts the print document size value to a string
   * @param printDocumentSize Print document size
   */
    static getPrintDocumentSizeString(printDocumentSize: PrintDocumentSize): string {
      switch (printDocumentSize) {
        case PrintDocumentSize.A4:
          return 'A4'
        default:
          return 'Letter'
      }
    }

}

/** The link mode when exporting to PDF */
export enum PrintLinkMode {
  /** Do not modify links when  */
  None = 1,

  /** Change compendium entry links to D&D Beyond entry links */
  DNDBeyondEntries,

  /** Change compendium entry links to D&D Beyond search links */
  DNDBeyondSearch,
}

/** The document size when exporting to PDF */
export enum PrintDocumentSize {
  /** Letter Paper Size  */
  Letter = 1,

  /** A4 Paper Size */
  A4,
}