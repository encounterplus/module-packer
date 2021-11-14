import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Unzipper from 'unzipper'
import * as XML2JS from 'xml2js'
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
    await FileSystem.createReadStream(fullMapPath).pipe(Unzipper.Extract({path: mapExtractTempPath})).promise()

    let mapModuleXmlFile = Path.join(mapExtractTempPath, 'module.xml')
    let mapCampagnXmlFile = Path.join(mapExtractTempPath, 'campaign.xml')

    let mapXmlFile = undefined
    if (FileSystem.existsSync(mapModuleXmlFile)) {
      mapXmlFile = mapModuleXmlFile
    } else if (FileSystem.existsSync(mapCampagnXmlFile)) {
      mapXmlFile = mapCampagnXmlFile
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

    let xmlParser = new XML2JS.Parser()
    let mapModuleBuffer = FileSystem.readFileSync(mapXmlFile)
    let parseResult = await xmlParser.parseStringPromise(mapModuleBuffer.toString())

    let rootElement = parseResult['module'] as any || parseResult['campaign'] as any
    if (rootElement === undefined) {
      throw Error('Map file has an invalid format. Could not locate module or campaign element.')
    }

    let maps = rootElement['map'] as any[]
    if (maps === undefined || maps.length < 1) {
      throw Error('Map file has an invalid format. Could not locate map element.')
    }

    let mapObject = maps[0]
    let mapName = (mapObject['name'][0] as string) || Path.basename(this.path)
    let map = new Map(mapName, moduleUUID, this, this.slug)
    if (this.sort !== undefined) {
      map.sort = this.sort
    }

    if (mapObject['$'] !== undefined) {
      delete mapObject['$']['parent']
      delete mapObject['$']['sort']
      delete mapObject['slug']
      delete mapObject['name']
    }

    map.mapData = mapObject
    
    // Cleanup the temp directory
    FileSystem.rmdirSync(mapExtractTempPath, { recursive: true })

    return map
  } 

}