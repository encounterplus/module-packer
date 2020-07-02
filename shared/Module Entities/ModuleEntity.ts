import { Module } from "./Module"
import { v5 as UUIDV5 } from 'uuid'

/** Represents referencable entities in a module */
export abstract class ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `ModuleEntity`
   * @param name The name of the entity
   * @param moduleUUID The UUID of the module
   */
  constructor(
    readonly name: string,
    readonly moduleUUID: string,
    slug: string | undefined = undefined
  ) {
    // If a slug is manually specified, make sure it doesn't exist.
    // Auto-generated slugs will automatically append a number if
    // they are duplicated.
    if (slug !== undefined) {
      let sanitizedSlug = Module.sanitizeSlug(slug)
      if (Module.existingSlugs.includes(sanitizedSlug)) {
        throw new Error(
          `The slug "${slug}" results in a duplicate slug for the module.`
        )
      }
    }

    // Once the slug has been determined, add to the list of existing slugs
    // so there can't be overlap
    this.slug = slug ?? Module.getSlugFromValue(name)
    Module.existingSlugs.push(this.slug)

    // Derive UUID from slug using module ID as namespace. This
    // makes IDs deterministic for a given module (so repeated
    // packing results in same IDs).
    this.id = UUIDV5(this.slug, moduleUUID) 
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The parent entity */
  parent: ModuleEntity | undefined = undefined

  /** The slug for the entity */
  slug: string

  /** The ID of the entity (UUIDV5) */
  id: string
}