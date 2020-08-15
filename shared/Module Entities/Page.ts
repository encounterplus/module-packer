import { ModuleEntity } from './ModuleEntity'

/** Represents a Page in a Module */

export class Page extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Page`
   * @param name The name of the page
   * @param moduleUUID The UUID of the module
   * @param slug A manually specified slug (optional - will be auto-generated if undefined)
   */
  constructor(name: string, moduleUUID: string, slug: string | undefined = undefined) {
    super(name, moduleUUID, slug)
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The HTML Content of the page */
  content: string = ''

  /** The slug of a parent page (within the given group) */
  parentPageSlug: string = ''
}
