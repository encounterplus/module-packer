import { ModuleEntity } from './ModuleEntity'

/** 
 * Defines information about a Reference
 */
export class Reference extends ModuleEntity {

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Reference`
   * @param name The name of the reference
   * @param moduleUUID The UUID of the module
   * @param path: The path of the reference
   * @param slug A manually specified slug (optional - will be auto-generated if undefined)
   */
  constructor(name: string, moduleUUID: string, path: string, slug: string | undefined = undefined) {
    super(name, moduleUUID, slug)    
    this.path = path
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The reference's path */
  path: string

}