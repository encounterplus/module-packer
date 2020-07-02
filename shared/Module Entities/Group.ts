import { Module } from './Module'
import { ModuleEntity } from './ModuleEntity'

/** Represents a Group in a Module */

export class Group extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initiaizes an instance of `Group`
   * @param name The name of the group
   * @param moduleUUID The UUID of the module
   */
  constructor(name: string = 'Unnamed Group', moduleUUID: string) {
    let slug = Module.getSlugFromValue(`group-${Module.getSlugFromValue(name)}`)
    
    super(name, moduleUUID, slug)
  }
}
