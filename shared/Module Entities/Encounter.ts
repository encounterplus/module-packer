import { ModuleEntity } from './ModuleEntity'
import { EncounterFileReference } from '../EncounterFileReference'

/** 
 * Defines information about an Encounter
 */
export class Encounter extends ModuleEntity {

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Encounter`
   * @param name The name of the encounter
   * @param moduleUUID The UUID of the module
   * @param fileReference The encounter's file reference
   * @param slug A manually specified slug (optional - will be auto-generated if undefined)
   */
  constructor(name: string, moduleUUID: string, fileReference: EncounterFileReference, slug: string | undefined = undefined) {
    super(name, moduleUUID, slug)
    this.fileReference = fileReference
    this.parentSlug = fileReference.parentSlug
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The encounter object data */
  encounterData: Object = {}

  /** The encounter's file reference */
  fileReference: EncounterFileReference

}