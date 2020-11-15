import { v5 as UUIDV5 } from 'uuid'
import { Module } from "./Module"

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

  /** The parent slug for the entity - to be resolved to a parent object later */
  parentSlug: string | undefined = undefined

  /** The slug for the entity */
  slug: string

  /** The ID of the entity (UUIDV5) */
  id: string

  /** The sort order of the entity */
  sort: number | undefined = undefined

  /** The children of this module */
  children: ModuleEntity[] = []

  /** Which build targets to include in */
  includeIn: IncludeMode = IncludeMode.All

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /** Gets the include mode from a string */
  static getIncludeModeFromString(includeString: string): IncludeMode {
    switch(includeString) {
      case 'print':
        return IncludeMode.Print
      case 'module':
        return IncludeMode.Module
      default:
        return IncludeMode.All
    }
  }
}

/** The module include mode */
export enum IncludeMode {
  /** All module targets include the entity */
  All = 1,

  /** Only print targets include the entity */
  Print,

  /** Only Encounter+ module targets include the entity */
  Module,
}
