import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Unzipper from 'unzipper'
import * as XML2JS from 'xml2js'
import * as Logger from 'winston'
import { Encounter } from './Module Entities/Encounter'

/** 
 * Defines a reference to an encounter file.
 */
export class EncounterFileReference {

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The path to the encounter file */
  path: string = ''

  /** The sort order of the entity */
  sort: number | undefined = undefined

  /** The specified slug for the entity */
  slug: string | undefined = undefined

  /** The parent entity */
  parentSlug: string | undefined = undefined

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `EncounterFileReference`
   */
  constructor(path: string, sort: number | undefined, slug: string | undefined, parentSlug: string | undefined) {
    this.path = path
    this.sort = sort
    this.slug = slug
    this.parentSlug = parentSlug
  }

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Extracts an encounter object from an encounter file
   * @param moduleBuildPath The module build path
   * @param projectPath The project file path
   * @param moduleUUID The module UUID
   */
  public extractEncounterObject = async (moduleBuildPath: string, projectPath: string, moduleUUID: string): Promise<Encounter> => {
    let pathBaseName = Path.basename(this.path)
    let encounterExtractTempPath = Path.join(moduleBuildPath, pathBaseName + 'TempEncounter')
    let fullEncounterPath = Path.join(projectPath, this.path)

    Logger.info(`Processing encounter file "${this.path}"`)
    
    // Create temporary unzip path for encounter file
    FileSystem.ensureDirSync(encounterExtractTempPath)

    // Unzip the encounter file
    await FileSystem.createReadStream(fullEncounterPath).pipe(Unzipper.Extract({path: encounterExtractTempPath})).promise()

    let encounterModuleXmlFile = Path.join(encounterExtractTempPath, 'module.xml')
    if (!FileSystem.existsSync(encounterModuleXmlFile)) {
      throw Error('Encounter file has an invalid format. Could not locate module.xml for encounter file.')
    }

    // Copy all files that aren't module.XML to the moduleBuildPath
    let encounterFiles: string[] = FileSystem.readdirSync(encounterExtractTempPath).filter(function (file) {
      return Path.basename(file) !== 'module.xml'
    })

    encounterFiles.forEach(fileName => {
      let tempPath = Path.join(encounterExtractTempPath, fileName)
      let newPath = Path.join(moduleBuildPath, fileName)
      FileSystem.copyFileSync(tempPath, newPath)
    })

    let xmlParser = new XML2JS.Parser()
    let encounterModuleBuffer = FileSystem.readFileSync(encounterModuleXmlFile)
    let parseResult = await xmlParser.parseStringPromise(encounterModuleBuffer.toString())

    let module = parseResult['module'] as any
    if (module === undefined) {
      throw Error('Encounter file has an invalid format. Could not locate module element in module.xml.')
    }

    let encounters = module['encounter'] as any[]
    if (encounters === undefined || encounters.length < 1) {
      throw Error('Encounter file has an invalid format. Could not locate encounter element in module.xml.')
    }

    let encounterObject = encounters[0]
    let encounterName = (encounterObject['name'][0] as string) || Path.basename(this.path)
    let encounter = new Encounter(encounterName, moduleUUID, this, this.slug)
    if (this.sort !== undefined) {
      encounter.sort = this.sort
    }

    if (encounterObject['$'] !== undefined) {
      delete encounterObject['$']['parent']
      delete encounterObject['$']['sort']
      delete encounterObject['slug']
      delete encounterObject['name']
    }

    encounter.encounterData = encounterObject
    
    // Cleanup the temp directory
    FileSystem.rmdirSync(encounterExtractTempPath, { recursive: true })

    return encounter
  } 

}