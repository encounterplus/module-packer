/** 
 * Defines a reference for a module
 */
export class ReferenceInfo {

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The name of the reference */
  name: string = ''

  /** The path to the reference */
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
   * Initializes an instance of `ReferenceInfo`
   */
  constructor(name: string, path: string, sort: number | undefined, slug: string | undefined, parentSlug: string | undefined) {
    this.name = name
    this.path = path
    this.sort = sort
    this.slug = slug
    this.parentSlug = parentSlug
  }

}