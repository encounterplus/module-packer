
/** An interface for a markdown toggle command */
export interface MarkdownToggle {

  /** Whether the markdown for this toggle can be multiline */
  isMultiline: boolean

  /** The regular expression to detect whether this markdown state is enabled or disabled (e.g., is it bolded already or not) */
  detectRegExp: RegExp

  /** The regular expression to capture the enabled markdown at the cursor */
  enableRegExp: RegExp

  /** The regular expression to capture the disabled markdown at the cursor */
  disableRegExp: RegExp

  /** The format to apply to the matched text to enable the markdown state from a disabled state */
  enableFormat: string

  /** The format to apply to the matched text to disable the markdown state from an enabled state */
  disableFormat: string

  /** The line offset count when the format is applied */
  lineOffset: number

  /** The character offset count when the format is applied */
  characterOffset: number

  /** Whether the command should deselect after the format is applied */
  deselectAfter: boolean

}