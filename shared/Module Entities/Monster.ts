import { v4 as UUIDV4 } from 'uuid'
import * as YAML from 'yaml'
import { ModuleEntity } from './ModuleEntity'
import { Module } from './Module'

/** Represents a Monster in a Module */
export class Monster extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Monster`
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

  /** The monster size. Valid values are: T (Tiny),
   * S (Small), M (Medium), L (Large), H (Huge),
   * G (Gargantuan), and C (Colossal)  */
  size: string = 'M'

  /** The type of monster */
  type: string = 'humanoid'

  /** The monster's alignment */
  alignment: string = 'neutral'

  /** The monster's Armor Class */
  ac: string = '10'

  /** The monster's Hit Points */
  hp: string = '10 (2d8 + 4)'

  /** The monster's Speed */
  speed: string = '30 ft.'

  /** The monster's Strength */
  str: number = 8

  /** The monster's Dexterity */
  dex: number = 8

  /** The monster's Constitution */
  con: number = 8

  /** The monster's Intelligence */
  int: number = 8

  /** The monster's Wisdom */
  wis: number = 8

  /** The monster's Charisma */
  cha: number = 8

  /** The monster's skills */
  skills: string | undefined = undefined

  /** The monster's passive perception */
  passivePerception: number = 9

  /** The monster's damage immunities */
  damageImmunities: string | undefined = undefined

  /** The monster's vulnerabilities */
  vulnerabilities: string | undefined = undefined

  /** The monster's resistances */
  resistances: string | undefined = undefined

  /** The monster's condition immunities */
  conditionImmunities: string | undefined = undefined

  /** The monster's challenge rating */
  challenge: string = '0'

  /** The monster's saving throws */
  saves: string | undefined = undefined

  /** The monster's senses */
  senses: string | undefined = undefined

  /** The monster's languages */
  languages: string = '—'

  /** The monster's description */
  description: string | undefined = undefined

  /** The source of the monster */
  source: string | undefined = undefined

  /** The monster's environments */
  environments: string | undefined = undefined

  /** The monster's traits */
  traits: Trait[] = []

  /** The monster's actions */
  actions: Action[] = []

  /** The monster's reactions */
  reactions: Reaction[] = []

  /** The monster's legendary actions */
  legendaryActions: LegendaryAction[] = []

  /** The filename of an image of the monster */
  image: string | undefined = undefined

  /** The filename of an image of the monster's token */
  token: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets a Monster object instance from a YAML representation
   * @param monsterYamlContent The YAML content that represents the monster
   * @param module The module to which the monster belongs
   */
  static fromYAMLContent(monsterYamlContent: string, module: Module | undefined = undefined) {
    // Parse Monster from YAML
    let monsterData: any = undefined
    try {
      monsterData = YAML.parse(monsterYamlContent)
    } catch (error) {
      throw Error(`Failed to parse Monster. Error: ${(error as Error).message}`)
    }

    // A name must be defined - if it isn't,
    // go with "Unnamed Monster"
    let name = monsterData['name'] as string
    if (!name) {
      name = 'Unnamed Monster'
    }

    // Generate a slug if one isn't manually defined
    let slug = monsterData['slug'] as string
    if (!slug || module === undefined) {
      slug = Module.getSlugFromValue(name)
    }

    // If the module project ID isn't defined, generate a random one. This
    // will happen when the Monster is being generated as part of a preview
    // for the VS Code extension
    let monster = new Monster(name, module?.moduleProjectInfo.id ?? UUIDV4(), slug)

    // Get monster size
    const size = monsterData['size'] as string
    if (size) {
      monster.size = size
    }

    // Get monster type
    const type = monsterData['type'] as string
    if (type) {
      monster.type = type
    }

    // Get monster alignment
    const alignment = monsterData['alignment'] as string
    if (alignment) {
      monster.alignment = alignment
    }

    // Get monster challenge rating
    const challenge = monsterData['challenge'] as string
    if (challenge) {
      monster.challenge = challenge.toString()
    }

    // Get monster Armor Class
    const ac = monsterData['ac'] as string
    if (ac) {
      monster.ac = ac
    }

    // Get monster Hit Points
    const hp = monsterData['hp'] as string
    if (hp) {
      monster.hp = hp
    }

    // Get monster speed
    const speed = monsterData['speed'] as string
    if (speed) {
      monster.speed = speed
    }

    // Get monster strength
    const str = monsterData['str'] as number
    if (str) {
      monster.str = str
    }

    // Get monster dexterity
    const dex = monsterData['dex'] as number
    if (dex) {
      monster.dex = dex
    }

    // Get monster constitution
    const con = monsterData['con'] as number
    if (con) {
      monster.con = con
    }

    // Get monster intelligence
    const int = monsterData['int'] as number
    if (int) {
      monster.int = int
    }

    // Get monster wisdom
    const wis = monsterData['wis'] as number
    if (wis) {
      monster.wis = wis
    }

    // Get monster charisma
    const cha = monsterData['cha'] as number
    if (cha) {
      monster.cha = cha
    }

    // Get monster's skills
    const skills = monsterData['skills'] as string
    if (skills) {
      monster.skills = skills
    }

    // Get monster's passive perception
    const passivePerception = monsterData['passivePerception'] as number
    if (passivePerception) {
      monster.passivePerception = passivePerception
    }

    // Get monster's senses
    const senses = monsterData['senses'] as string
    if (senses) {
      monster.senses = senses
    }

    // Get monster's damage immunities
    const damageImmunities = monsterData['damageImmunities'] as string
    if (damageImmunities) {
      monster.damageImmunities = damageImmunities
    }

    // Get monster's vulnerabilities
    const vulnerabilities = monsterData['vulnerabilities'] as string
    if (vulnerabilities) {
      monster.vulnerabilities = vulnerabilities
    }

    // Get monster's resistances
    const resistances = monsterData['resistances'] as string
    if (resistances) {
      monster.resistances = resistances
    }

    // Get monster's condition immunities
    const conditionImmunities = monsterData['conditionImmunities'] as string
    if (conditionImmunities) {
      monster.conditionImmunities = conditionImmunities
    }

    // Get monster's saving throws
    const saves = monsterData['saves'] as string
    if (saves) {
      monster.saves = saves
    }

    // Get monster's languages
    const languages = monsterData['languages'] as string
    if (languages) {
      monster.languages = languages
    }

    // Get monster's description
    const description = monsterData['description'] as string
    if (description) {
      monster.description = description
    }

    // Get monster's source
    const source = monsterData['source'] as string
    if (source) {
      monster.source = source
    }

    // Get monster's environments
    const environments = monsterData['environments'] as string
    if (environments) {
      monster.environments = environments
    }

    // Get monster's traits
    const traits = monsterData['traits'] as Trait[]
    if (traits) {
      monster.traits = traits
    }

    // Get monster's actions
    const actions = monsterData['actions'] as Action[]
    if (actions) {
      monster.actions = actions
    }

    // Get monster's reactions
    const reactions = monsterData['reactions'] as Reaction[]
    if (reactions) {
      monster.reactions = reactions
    }

    // Get monster's legendary actions
    const legendaryActions = monsterData['legendaryActions'] as LegendaryAction[]
    if (legendaryActions) {
      monster.legendaryActions = legendaryActions
    }

    // Get monster image - copy image file to root
    // if we're parsing this as an individual monster YAML file.
    // If parsing in the context of markdown, this will already
    // be taken care of for us.
    const image = monsterData['image'] as string
    if (image) {
      monster.image = image
    }

    // Get monster token image - copy image file to root
    // if we're parsing this as an individual monster YAML file.
    // If parsing in the context of markdown, this will already
    // be taken care of for us.
    const token = monsterData['token'] as string
    if (token) {
      monster.token = token
    }

    return monster
  }

  /**
   * Gets the HTML representation of the monster
   */
  getHTML = (classes: string[] = []): string => {
    function drawTaperRule(): string {
      return '<svg height="5" width="100%" class="statblock-tapered-rule" preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 4"><polyline points="0,0 400,2 0,4"></polyline></svg>'
    }

    function getAbilityMod(ability: number): string {
      let abilityMod = Math.floor((ability - 10) / 2)
      return abilityMod >= 0 ? `+${abilityMod}` : `${abilityMod}`
    }

    function formatDescription(description: string): string {
      let newDescription = description
      newDescription = newDescription.replace(/Melee or Ranged Weapon Attack: /i, '<i>Melee or Ranged Weapon Attack:</i> ')
      newDescription = newDescription.replace(/Melee Weapon Attack: /i, '<i>Melee Weapon Attack:</i> ')
      newDescription = newDescription.replace(/Ranged Weapon Attack: /i, '<i>Ranged Weapon Attack:</i> ')
      newDescription = newDescription.replace(/Melee or Ranged Spell Attack: /i, '<i>Melee or Ranged Spell Attack:</i> ')
      newDescription = newDescription.replace(/Melee Spell Attack: /i, '<i>Melee Spell Attack:</i> ')
      newDescription = newDescription.replace(/Ranged Spell Attack: /i, '<i>Ranged Spell Attack:</i> ')
      newDescription = newDescription.replace(/Hit: /i, '<i>Hit:</i> ')
      newDescription = newDescription.replace(/[\r\n]/g, '<br />')
      return newDescription
    }

    function getChallengeXP(xp: string): string {
      switch (xp) {
        case '0':
          return '0 XP'
        case '1/8':
          return '25 XP'
        case '1/4':
          return '50 XP'
        case '1/2':
          return '100 XP'
        case '1':
          return '200 XP'
        case '2':
          return '450 XP'
        case '3':
          return '700 XP'
        case '4':
          return '1,100 XP'
        case '5':
          return '1,800 XP'
        case '6':
          return '2,300 XP'
        case '7':
          return '2,900 XP'
        case '8':
          return '3,900 XP'
        case '9':
          return '5,000 XP'
        case '10':
          return '5,900 XP'
        case '11':
          return '7,200 XP'
        case '12':
          return '8,400 XP'
        case '13':
          return '10,000 XP'
        case '14':
          return '11,500 XP'
        case '15':
          return '13,000 XP'
        case '16':
          return '15,000 XP'
        case '17':
          return '18,000 XP'
        case '18':
          return '20,000 XP'
        case '19':
          return '22,000 XP'
        case '20':
          return '25,000 XP'
        case '21':
          return '33,000 XP'
        case '22':
          return '41,000 XP'
        case '23':
          return '50,000 XP'
        case '24':
          return '62,000 XP'
        case '25':
          return '75,000 XP'
        case '26':
          return '90,000 XP'
        case '27':
          return '105,000 XP'
        case '28':
          return '120,000 XP'
        case '29':
          return '135,000 XP'
        case '30':
          return '155,000 XP'
      }
      return '?? XP'
    }

    // Create the property block in order
    let properties: Property[] = []
    if (this.saves !== undefined) {
      properties.push({ name: 'Saving Throws', description: this.saves })
    }
    if (this.skills !== undefined) {
      properties.push({ name: 'Skills', description: this.skills })
    }
    if (this.vulnerabilities !== undefined) {
      properties.push({ name: 'Damage Vulnerabilities', description: this.vulnerabilities })
    }
    if (this.resistances !== undefined) {
      properties.push({ name: 'Damage Resistances', description: this.resistances })
    }
    if (this.damageImmunities !== undefined) {
      properties.push({ name: 'Damage Immunities', description: this.damageImmunities })
    }
    if (this.conditionImmunities !== undefined) {
      properties.push({ name: 'Condition Immunities', description: this.conditionImmunities })
    }
    if (this.senses !== undefined) {
      properties.push({ name: 'Senses', description: this.senses })
    }
    properties.push({ name: 'Languages', description: this.languages })
    properties.push({ name: 'Challenge', description: `${this.challenge} (${getChallengeXP(this.challenge)})` })

    let allClasses = Array.from(classes)
    allClasses.splice(0, 0, 'statblock')
    let classesString = allClasses.join(' ')
    let monsterHTML = `<div class="${classesString}">`
    monsterHTML += '<hr class="statblock-border" />'
    monsterHTML += '<div class="statblock-section-left">'
    monsterHTML += '<div class="statblock-creature-heading">'
    monsterHTML += `<p class="statblock-title">${this.name}</p>`
    monsterHTML += `<p class="statblock-subtitle">${this.size} ${this.type}, ${this.alignment}</p>`
    monsterHTML += '</div>' // statblock-creature-heading
    monsterHTML += drawTaperRule()
    monsterHTML += '<div class="statblock-top-stats">'
    monsterHTML += `<div class="statblock-property-line first"><p class="statblock-topstat-name">Armor Class</p> <p class="statblock-topstat-value">${this.ac}</p></div>`
    monsterHTML += `<div class="statblock-property-line"><p class="statblock-topstat-name">Hit Points</p> <p class="statblock-topstat-value">${this.hp}</p></div>`
    monsterHTML += `<div class="statblock-property-line last"><p class="statblock-topstat-name">Speed</p> <p class="statblock-topstat-value">${this.speed}</p></div>`
    monsterHTML += '</div>' // statblock-top-stats
    monsterHTML += drawTaperRule()
    monsterHTML += '<div class="statblock-abilities">'
    monsterHTML += `<div class="statblock-ability-strength"><p class="statblock-ability-abbrev">STR</p> <p class="statblock-ability-value">${
      this.str
    } (${getAbilityMod(this.str)})</p></div>`
    monsterHTML += `<div class="statblock-ability-dexterity"><p class="statblock-ability-abbrev">DEX</p> <p class="statblock-ability-value">${
      this.dex
    } (${getAbilityMod(this.dex)})</p></div>`
    monsterHTML += `<div class="statblock-ability-constitution"><p class="statblock-ability-abbrev">CON</p> <p class="statblock-ability-value">${
      this.con
    } (${getAbilityMod(this.con)})</p></div>`
    monsterHTML += `<div class="statblock-ability-intelligence"><p class="statblock-ability-abbrev">INT</p> <p class="statblock-ability-value">${
      this.int
    } (${getAbilityMod(this.int)})</p></div>`
    monsterHTML += `<div class="statblock-ability-wisdom"><p class="statblock-ability-abbrev">WIS</p> <p class="statblock-ability-value">${
      this.wis
    } (${getAbilityMod(this.wis)})</p></div>`
    monsterHTML += `<div class="statblock-ability-charisma"><p class="statblock-ability-abbrev">CHA</p> <p class="statblock-ability-value">${
      this.cha
    } (${getAbilityMod(this.cha)})</p></div>`
    monsterHTML += '</div>' // statblock-abilities
    monsterHTML += drawTaperRule()
    properties.forEach((property, index) => {
      if (index === 0) {
        monsterHTML += '<div class="statblock-property-line first">'
      } else if (index === properties.length - 1) {
        monsterHTML += '<div class="statblock-property-line last">'
      } else {
        monsterHTML += '<div class="statblock-property-line">'
      }
      monsterHTML += `<p class="statblock-property-name">${property.name}</p> <p class="statblock-property-value">${property.description}</p></div>`
    })
    monsterHTML += drawTaperRule()
    this.traits.forEach((trait, index) => {
      monsterHTML += '<div class="statblock-property-block">'
      if (trait.name) {
        monsterHTML += `<p class="statblock-trait-name">${trait.name}.</p> `
      }
      monsterHTML += `<p class="statblock-trait-description">${formatDescription(trait.description)}</p>`
      monsterHTML += '</div>' // statblock-property-block
    })
    monsterHTML += '</div>' // statblock-section-left
    monsterHTML += '<div class="statblock-section-right">'
    if (this.actions.length > 0) {
      monsterHTML += '<div class="statblock-actions">'
      monsterHTML += '<p class="statblock-section-title">Actions</p>'
      this.actions.forEach((action, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (action.name) {
          monsterHTML += `<p class="statblock-action-name">${action.name}.</p> `
        }
        monsterHTML += `<p class="statblock-action-description">${formatDescription(action.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
      })
      monsterHTML += '</div>' // statblock-actions
    }
    if (this.reactions.length > 0) {
      monsterHTML += '<div class="statblock-reactions">'
      monsterHTML += '<p class="statblock-section-title">Reactions</p>'
      this.reactions.forEach((reaction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (reaction.name) {
          monsterHTML += `<p class="statblock-action-name">${reaction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-action-description">${formatDescription(reaction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
      })
      monsterHTML += '</div>' // statblock-reactions
    }
    if (this.legendaryActions.length > 0) {
      monsterHTML += '<div class="statblock-legendary-actions">'
      monsterHTML += '<p class="statblock-section-title">Legendary Actions</p>'
      this.legendaryActions.forEach((legendaryAction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (legendaryAction.name) {
          monsterHTML += `<p class="statblock-action-name">${legendaryAction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-action-description">${formatDescription(legendaryAction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
      })
      monsterHTML += '</div>' // statblock-legendaryActions
    }
    monsterHTML += '</div>' // statblock-section-right
    monsterHTML += '<hr class="statblock-border bottom" />'
    monsterHTML += '</div>' // statblock

    return monsterHTML
  }
}

/** Describes a Property */
interface Property {
  /** The trait's name */
  name: string

  /** The trait's description */
  description: string
}

/** Describes a Trait */
interface Trait {
  /** The trait's name */
  name: string

  /** The trait's description */
  description: string
}

/** Describes an Action */
interface Action {
  /** The action's name */
  name: string

  /** The action's description */
  description: string
}

/** Describes a Reaction */
interface Reaction {
  /** The reaction's name */
  name: string

  /** The reaction's description */
  description: string
}

/** Describes a Legendary Action */
interface LegendaryAction {
  /** The legendary action's name */
  name: string

  /** The legendary action's description */
  description: string
}
