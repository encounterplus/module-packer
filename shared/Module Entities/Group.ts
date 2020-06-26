import { Module } from './Module'
import { ModuleEntity } from './ModuleEntity'
import { v4 as UUIDV4 } from 'uuid'

/** Represents a Group in a Module */

export class Group extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initiaizes an instance of `Group`
   * @param name The name of the group
   */
  constructor(name: string = 'Unnamed Group') {
    let slug = `group-${Module.getSlugFromValue(name)}`
    super(name, UUIDV4(), slug)
  }
}
