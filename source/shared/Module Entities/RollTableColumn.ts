/** Represents a Roll Table Column in a Module */
export class RollTableColumn {

  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `RollTable`
   * @param name The name of the roll table column
   * @param alignment The alignment of the roll table column
   */
  constructor(name: string, alignment: RollTableColumnAlignment) {
    this.name = name
    this.alignment = alignment
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The roll table column's name */
  name: string

  /** The roll table column's alignment */
  alignment: RollTableColumnAlignment

}

/** The module include mode */
export enum RollTableColumnAlignment {
  /** Left column alignment */
  Left = 'left',

  /** Right column alignment */
  Right = 'right',

  /** Center column alignment */
  Center = 'center',
}