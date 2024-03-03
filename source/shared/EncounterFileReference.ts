import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as ExtractZip from 'extract-zip'
import { XMLParser } from 'fast-xml-parser'
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
    await ExtractZip(fullEncounterPath, { dir: encounterExtractTempPath })

    let encounterModuleXmlFile = Path.join(encounterExtractTempPath, 'module.xml')
    let encounterCampaignXmlFile = Path.join(encounterExtractTempPath, 'campaign.xml')

    let encounterXmlFile: string | undefined = undefined
    if (FileSystem.existsSync(encounterModuleXmlFile)) {
      encounterXmlFile = encounterModuleXmlFile
    } else if (FileSystem.existsSync(encounterCampaignXmlFile)) {
      encounterXmlFile = encounterCampaignXmlFile
    }

    if (encounterXmlFile === undefined) {
      throw Error('Encounter file has an invalid format. Could not locate module.xml or campaign.xml for encounter file.')
    }

    // Copy all files that aren't module.xml or campaign.xml to the moduleBuildPath
    let encounterFiles: string[] = FileSystem.readdirSync(encounterExtractTempPath).filter(function (file) {
      return Path.basename(file) !== 'module.xml' && Path.basename(file) !== 'campaign.xml'
    })

    encounterFiles.forEach(fileName => {
      let tempPath = Path.join(encounterExtractTempPath, fileName)
      let newPath = Path.join(moduleBuildPath, fileName)
      FileSystem.copyFileSync(tempPath, newPath)
    })

    let xmlOptions =  {
      ignoreAttributes: false,
      attributeNamePrefix : "@_"
    };
    let xmlParser = new XMLParser(xmlOptions)
    let encounterModuleBuffer = FileSystem.readFileSync(encounterXmlFile)
    let parseResult = xmlParser.parse(encounterModuleBuffer.toString())

    let rootElement = parseResult['module'] as any || parseResult['campaign'] as any
    if (rootElement === undefined) {
      throw Error('Encounter file has an invalid format. Could not locate module or campaign element.')
    }

    let encounterObject = rootElement['encounter'] as any
    let encounterName = (encounterObject['name'] as string) || Path.basename(this.path)
    let encounter = new Encounter(encounterName, moduleUUID, this, this.slug)
    if (this.sort !== undefined) {
      encounter.sort = this.sort
    }

    encounter.encounterData = encounterObject

    // Cleanup the temp directory
    FileSystem.rmSync(encounterExtractTempPath, {recursive: true, force: true})

    return encounter
  }
}