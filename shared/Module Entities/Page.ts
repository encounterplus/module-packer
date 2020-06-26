import { ModuleEntity } from './ModuleEntity'
import { v4 as UUIDV4 } from "uuid"

/** Represents a Page in a Module */

export class Page extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initiaizes an instance of `Page`
   * @param name The name of the page
   */
  constructor(
    name: string = "Unnamed Page",
    slug: string | undefined = undefined
  ) {
    super(name, UUIDV4(), slug)
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The HTML Content of the page */
  content: string = ""
}
