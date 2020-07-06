import * as Path from 'path'
import * as FileSystem from 'fs-extra'
import { v4 as UUIDV4 } from 'uuid'
import { Module } from './Module Entities/Module'

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
  imagePath: string | undefined = undefined

  /** The module version */
  version: number | undefined = undefined

  /** The path for the module archive (after it is created) */
  moduleArchivePath: string | undefined = undefined

  /** The path for the module project definition file */
  moduleProjectPath: string | undefined = undefined

  /** Whether the module project auto-increments its version */
  autoIncrementVersion: boolean | undefined = undefined

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

    let moduleProjectPath = Path.join(rootDirectory, 'module.json')
    if(FileSystem.existsSync(moduleProjectPath)) {
      let moduleProject = ModuleProject.parseModuleProject(moduleProjectPath)
      if(moduleProject !== undefined) {
        moduleProjects.push(moduleProject)
      }
    }

    return moduleProjects
  }

  /**
   * Parses a Module.json as a ModuleProject
   * @param projectFilePath The path to the module.json file
   */
  static parseModuleProject(projectFilePath: string): ModuleProject | undefined {
    // Simply return if module doesn't exist - default
    // module naming and handling will apply.
    if (!FileSystem.existsSync(projectFilePath)) {
      return undefined
    }

    let moduleProject = new ModuleProject()
    let moduleDataBuffer = FileSystem.readFileSync(projectFilePath)
    let moduleData = JSON.parse(moduleDataBuffer.toString())
    moduleProject.moduleProjectPath = projectFilePath

    // If ID is specified in module.json, ensure it is a UUID and use that
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
        throw Error(`Invalid UUID specified in ${projectFilePath}`)
      }
    }

    // If name is specified in module.json, use that
    let name = moduleData['name'] as string
    if (name) {
      moduleProject.name = name
    }

    // If name is specified in module.json, use that, otherwise
    // use the slug based on the name
    let slug = moduleData['slug'] as string
    if (slug) {
      moduleProject.slug = Module.sanitizeSlug(slug)
    } else {
      moduleProject.slug = Module.getSlugFromValue(this.name)
    }

    // If description is specified in module.json, use that.
    let description = moduleData['description'] as string
    if (description) {
      moduleProject.description = description
    }

    // If category is specified in module.json, use that.
    // Ensure values are 'adevnture' or 'other'
    let category = moduleData['category'] as string
    if (category === 'adventure' || category === 'other') {
      moduleProject.category = category
    }

    // If author is specified in module.json, use that
    let author = moduleData['author'] as string
    if (author) {
      moduleProject.author = author
    }

    // If reference code is specified in module.json, use that
    let code = moduleData['code'] as string
    if (code) {
      moduleProject.referenceCode = code
    }

    // If version is specified in module.json, use that
    let version = moduleData['version'] as number
    if (version) {
      moduleProject.version = version
    }

    // If cover image is specified in module.json, use that.
    // Ensure cover image actually exists
    let imagePath = moduleData['cover'] as string
    if (imagePath) {
      let moduleDirectory = Path.dirname(projectFilePath)
      let fullImagePath = Path.join(moduleDirectory, imagePath)
      if (!FileSystem.existsSync(fullImagePath)) {
        throw Error(`Module cover image path does not exist: ${fullImagePath}`)
      }
      moduleProject.imagePath = imagePath
    }
    return moduleProject
  }

  /**
   * Creates an empty module.json file
   * @param projectPath The path to the project
   */
  static createModuleProjectFile(projectFilePath: string) {
    if (FileSystem.existsSync(projectFilePath)) {
      throw Error('Module.json already exists.')
    }

    let folderName = Path.basename(Path.dirname(projectFilePath))

    // Format module.json data
    let newModule = new ModuleProject()
    newModule.id = UUIDV4()
    newModule.name = folderName
    newModule.slug = Module.sanitizeSlug(folderName)
    newModule.description = 'TBD'
    newModule.category = 'adventure'
    newModule.author = 'Anonymous'
    newModule.referenceCode = ''
    newModule.imagePath = 'cover.jpg'
    newModule.version = 1
    newModule.autoIncrementVersion = true

    // Write module.json
    newModule.writeModuleProjectFile(projectFilePath)
  }

  /**
   * Writes the module project information to file
   * @param projectFilePath The path of the project file
   */
  writeModuleProjectFile(projectFilePath: string) {
    let newModuleJson: any = new Object()
    if (this.version !== undefined && this.autoIncrementVersion === true) {
      this.version += 1
    }

    if (this.id) {
      newModuleJson['id'] = this.id
    }
    if (this.name) {
      newModuleJson['name'] = this.name
    }
    if (this.slug) {
      newModuleJson['slug'] = this.slug
    }
    if (this.description) {
      newModuleJson['description'] = this.description
    }
    if (this.category) {
      newModuleJson['category'] = this.category
    }
    if (this.author) {
      newModuleJson['author'] = this.author
    }
    if (this.referenceCode) {
      newModuleJson['code'] = this.referenceCode
    }
    if (this.imagePath) {
      newModuleJson['cover'] = this.imagePath
    }
    newModuleJson['version'] = this.version
    newModuleJson['autoIncrementVersion'] = true

    let outputJson = JSON.stringify(newModuleJson, null, 2)
    FileSystem.writeFileSync(projectFilePath, outputJson)
  }

}