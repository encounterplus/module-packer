import { Module } from "./Module"

/** Represents referencable entities in a module */
export abstract class ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `ModuleEntity`
   * @param name The name of the entity
   * @param id The UUID of the entity
   */
  constructor(
    readonly name: string,
    readonly id: string,
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

    this.slug = slug ?? Module.getSlugFromValue(name)
    Module.existingSlugs.push(this.slug)
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The parent entity */
  parent: ModuleEntity | undefined = undefined

  /** The slug for the entity */
  slug: string
}