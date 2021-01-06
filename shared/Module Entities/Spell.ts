import { v4 as UUIDV4 } from 'uuid'
import * as YAML from 'yaml'
import { ModuleEntity } from './ModuleEntity'
import { Module } from './Module'

/** Represents a Spell in a Module */
export class Spell extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Spell`
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

  /** The spell's level */
  level: number | undefined = undefined

  /** The spell's school */
  school: string | undefined = undefined

  /** Whether the spell is a ritual */
  ritual: boolean = false

  /** The spell's time to cast */
  time: string | undefined = undefined

  /** The spell's range */
  range: string | undefined = undefined

  /** The spell's components */
  components: string | undefined = undefined

  /** The spell's duration */
  duration: string | undefined = undefined

  /** The spell's classes */
  classes: string | undefined = undefined

  /** The spell's source */
  source: string | undefined = undefined

  /** The filename of an image of the spell */
  image: string | undefined = undefined

  /** The spell's description */
  description: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets a Spell object instance from a YAML representation
   * @param spellYamlContent The YAML content that represents the spell
   * @param module The module to which the spell belongs
   */
  static fromYAMLContent(spellYamlContent: string, module: Module | undefined = undefined) {
    // Parse spell from YAML
    let spellData: any = undefined
    try {
      spellData = YAML.parse(spellYamlContent)
    } catch (error) {
      throw Error(`Failed to parse Spell. Error: ${(error as Error).message}`)
    }

    // A name must be defined - if it isn't,
    // go with "Unnamed Spell"
    let name = spellData['name'] as string
    if (!name) {
      name = 'Unnamed Spell'
    }

    // Generate a slug if one isn't manually defined
    let slug = spellData['slug'] as string
    if (!slug || module === undefined) {
      slug = Module.getSlugFromValue(name)
    }

    // If the module project ID isn't defined, generate a random one. This
    // will happen when the Spell is being generated as part of a preview
    // for the VS Code extension
    let spell = new Spell(name, module?.moduleProjectInfo.id ?? UUIDV4(), slug)

    const level = spellData['level'] as number
    if (level !== undefined) {
      spell.level = level
    } else {
      throw Error('Spell must have a level')
    }

    const school = spellData['school'] as string
    if (school) {
      spell.school = school
    } else {
      throw Error('Spell must have a school')
    }

    const ritual = spellData['ritual'] as boolean
    if (ritual !== undefined) {
      spell.ritual = ritual
    }

    const time = spellData['time'] as string
    if (time) {
      spell.time = time
    }

    const range = spellData['range'] as string
    if (range) {
      spell.range = range
    }

    const components = spellData['components'] as string
    if (components) {
      spell.components = components
    }

    const duration = spellData['duration'] as string
    if (duration) {
      spell.duration = duration
    }

    const classes = spellData['classes'] as string
    if (classes) {
      spell.classes = classes
    }

    const source = spellData['source'] as string
    if (source) {
      spell.source = source
    }

    const description = spellData['description'] as string
    if (description) {
      spell.description = description
    }

    const image = spellData['image'] as string
    if (image) {
      spell.image = image
    }

    return spell
  }

  /**
   * Converts a spell's school description to a compendium-compatible entry
   * @param item The item
   */
  static getCompendiumSchool(spell: Spell): string | undefined {
    if (spell.school === undefined) {
      return undefined
    }

    switch (spell.school.toLowerCase()) {
      case 'abjuration':
        return 'A'
      case 'conjuration':
        return 'C'
      case 'divination':
        return 'D'
      case 'enchantment':
        return 'EN'
      case 'evocation':
        return 'EV'
      case 'illusion':
        return "I"
      case 'necromancy':
        return 'N'
      case 'transmutation':
        return 'T'
      default:
        throw Error(`Invalid spell school "${spell.school}". Supported values are: Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation`)
    }
  }

  /**
   * Gets the HTML representation of the spell
   */
  getHTML = (classes: string[] = []): string => {
    let levelText = 'Unknown'
    switch(this.level) {
      case 0:
        levelText = 'Cantrip'
        break
      case 1:
        levelText = 'First'
        break
      case 2:
        levelText = 'Second'
        break
      case 3:
        levelText = 'Third'
        break
      case 4:
        levelText = 'Fourth'
        break
      case 5:
        levelText = 'Fifth'
        break
      case 6:
        levelText = 'Sixth'
        break
      case 7:
        levelText = 'Seventh'
        break
      case 8:
        levelText = 'Eighth'
        break
      case 9:
        levelText = 'Ninth'
        break
      case 10:
        levelText = 'Tenth'
        break
      default:
        levelText = `${this.level}`
        break
    }

    function formatDescription(description: string): string {
      let newDescription = description
      newDescription = newDescription.replace(/[\r\n]/g, '<br />')
      return newDescription
    }

    let allClasses = Array.from(classes)
    allClasses.splice(0, 0, 'spell-block')
    let classesString = allClasses.join(' ')
    let spellHTML = `<div class="${classesString}">`
    spellHTML += `<p class="spell-block-title">${this.name}</p>`
    spellHTML += `<div class="spell-block-top-border"></div>`
    spellHTML += `<div class="spell-block-body">`
    if(this.description !== undefined) {
      spellHTML += `<p class="spell-block-description">${formatDescription(this.description)}</p>`
    }    
    spellHTML += `<div class="spell-block-heading-border"></div>`
    spellHTML += '<p>'
    if (this.level) {
      spellHTML += `<strong>Level: </strong>${levelText}<br />`
    }
    if (this.school) {
      spellHTML += `<strong>School: </strong>${this.school}<br />`
    }    
    if (this.time) {
      spellHTML += `<strong>Casting Time: </strong>${this.time}<br />`
    }
    if (this.range) {
      spellHTML += `<strong>Range/Area: </strong>${this.range}<br />`
    } 
    if (this.components) {
      spellHTML += `<strong>Components: </strong>${this.components}<br />`
    }
    if (this.duration) {
      spellHTML += `<strong>Duration: </strong>${this.duration}<br />`
    }  
    if (this.classes) {
      spellHTML += `<strong>Classes: </strong>${this.classes}<br />`
    }  
    spellHTML += `<strong>Ritual: </strong>${this.ritual ? 'Yes' : 'No'}<br />`    
    spellHTML += '</p>'
    spellHTML += `<div class="spell-block-bottom-border"></div>`
    spellHTML += `</div>` // spell-block-body
    spellHTML += `</div>` // spell-block
    return spellHTML
  }

  
}
