import { RollTableColumn } from './RollTableColumn'
import { ModuleEntity } from './ModuleEntity'

/** Represents a Roll Table in a Module */
export class RollTable extends ModuleEntity {

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `RollTable`
   * @param name The name of the roll table
   * @param moduleUUID The UUID of the module
   * @param slug A manually specified slug (optional - will be auto-generated if undefined)
   */
  constructor(name: string, moduleUUID: string, slug: string | undefined = undefined) {
    super(name, moduleUUID, slug)
    this.source = moduleUUID
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The roll table's source */
  source: string | undefined = undefined

  /** The roll table's description */
  description: string | undefined = undefined

  /** The roll table's rows */
  rows: string[][] = []

  /** The roll table's columns */
  columns: RollTableColumn[] = []
}