import { ModuleEntity } from './ModuleEntity'
import {MapFileReference} from '../MapFileReference'

/** 
 * Defines information about a Map
 */
export class Map extends ModuleEntity {

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Map`
   * @param name The name of the map
   * @param moduleUUID The UUID of the module
   * @param fileReference The map's file reference
   * @param slug A manually specified slug (optional - will be auto-generated if undefined)
   */
  constructor(name: string, moduleUUID: string, fileReference: MapFileReference, slug: string | undefined = undefined) {
    super(name, moduleUUID, slug)
    this.fileReference = fileReference
    this.parentSlug = fileReference.parentSlug
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The map object data */
  mapData: Object = {}

  /** The map's file reference */
  fileReference: MapFileReference

}