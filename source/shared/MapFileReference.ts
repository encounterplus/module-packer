import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as ExtractZip from 'extract-zip'
import { XMLParser } from 'fast-xml-parser'
import * as Logger from 'winston'
import { Map } from './Module Entities/Map'

/** 
 * Defines a reference to a map file.
 */
export class MapFileReference {

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The path to the map file */
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
   * Initializes an instance of `MapFileReference`
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
   * Extracts a map object from a map file
   * @param moduleBuildPath The module build path
   * @param projectPath The project file path
   * @param moduleUUID The module UUID
   */
  public extractMapObject = async (moduleBuildPath: string, projectPath: string, moduleUUID: string): Promise<Map> => {
    let pathBaseName = Path.basename(this.path)
    let mapExtractTempPath = Path.join(moduleBuildPath, pathBaseName + 'TempMap')
    let fullMapPath = Path.join(projectPath, this.path)

    Logger.info(`Processing map file "${this.path}"`)
    
    // Create temporary unzip path for map file
    FileSystem.ensureDirSync(mapExtractTempPath)

    // Unzip the map file
    await ExtractZip(fullMapPath, { dir: mapExtractTempPath })

    let mapModuleXmlFile = Path.join(mapExtractTempPath, 'module.xml')
    let mapCampaignXmlFile = Path.join(mapExtractTempPath, 'campaign.xml')

    let mapXmlFile: string | undefined = undefined
    if (FileSystem.existsSync(mapModuleXmlFile)) {
      mapXmlFile = mapModuleXmlFile
    } else if (FileSystem.existsSync(mapCampaignXmlFile)) {
      mapXmlFile = mapCampaignXmlFile
    }

    if (mapXmlFile === undefined) {
      throw Error('Map file has an invalid format. Could not locate module.xml or campaign.xml for map file.')
    }

    // Copy all files that aren't module.xml or campaign.xml to the moduleBuildPath
    let mapFiles: string[] = FileSystem.readdirSync(mapExtractTempPath).filter(function (file) {
      return Path.basename(file) !== 'module.xml' && Path.basename(file) !== 'campaign.xml'
    })

    mapFiles.forEach(fileName => {
      let tempPath = Path.join(mapExtractTempPath, fileName)
      let newPath = Path.join(moduleBuildPath, fileName)
      FileSystem.copyFileSync(tempPath, newPath)
    })

    let xmlOptions =  {
      ignoreAttributes: false,
      attributeNamePrefix : "@_"
    };
    let xmlParser = new XMLParser(xmlOptions)
    let mapModuleBuffer = FileSystem.readFileSync(mapXmlFile)
    let mapModuleString = mapModuleBuffer.toString()
    let parseResult = xmlParser.parse(mapModuleString)

    let rootElement = parseResult['module'] as any || parseResult['campaign'] as any
    if (rootElement === undefined) {
      throw Error('Map file has an invalid format. Could not locate module or campaign element.')
    }

    let mapObject = rootElement['map'] as any
    let mapName = (mapObject['name'] as string) || Path.basename(this.path)
    let map = new Map(mapName, moduleUUID, this, this.slug)
    if (this.sort !== undefined) {
      map.sort = this.sort
    }

    map.mapData = mapObject
    
    // Cleanup the temp directory
    FileSystem.rmSync(mapExtractTempPath, {recursive: true, force: true})

    return map
  }
}