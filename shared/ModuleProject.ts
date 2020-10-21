import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import { v4 as UUIDV4 } from 'uuid'
import * as YAML from 'yaml'
import { Module } from './Module Entities/Module'
import { MapFileReference } from './MapFileReference'
import { EncounterFileReference } from './EncounterFileReference'

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

  /** The module map references for the project */
  mapFiles: MapFileReference[] = []

  /** The module encounter references for the project */
  encounterFiles: EncounterFileReference[] = []

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
      return FileSystem.statSync(childPath).isDirectory()
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
    } catch (error) {
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
    let autoIncrementVersion = moduleData['autoIncrementVersion'] as boolean
    if (autoIncrementVersion) {
      moduleProject.autoIncrementVersion = autoIncrementVersion
    }

    // If compressImages is specified in Module project file, use that
    let compressImages = moduleData['compressImages'] as boolean
    if (compressImages) {
      moduleProject.compressImages = compressImages
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
    let printCoverPath = moduleData['printCover'] as string
    if (printCoverPath) {
      let moduleDirectory = Path.dirname(projectFilePath)
      let fullImagePath = Path.join(moduleDirectory, printCoverPath)
      if (!FileSystem.existsSync(fullImagePath)) {
        throw Error(`Module cover image path does not exist: ${fullImagePath}`)
      }
      moduleProject.printCoverPath = printCoverPath
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
      });
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
      });
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
      newModuleProject['printCover'] = this.printCoverPath
    }
    if (this.compressImages !== undefined) {
      newModuleProject['compressImages'] = this.compressImages
    }
    newModuleProject['version'] = this.version    
    newModuleProject['autoIncrementVersion'] = true
    
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

    let outputYAML = YAML.stringify(newModuleProject)
    FileSystem.writeFileSync(projectFilePath, outputYAML)
  }

}