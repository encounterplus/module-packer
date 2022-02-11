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
  alignment: string | undefined = undefined

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

  /** The monster's bonus actions */
  bonusActions: BonusAction[] = []

  /** The monster's reactions */
  reactions: Reaction[] = []

  /** The monster's legendary actions */
  legendaryActions: LegendaryAction[] = []

  /** The monster's mythic actions */
  mythicActions: MythicAction[] = []

  /** The filename of an image of the monster */
  image: string | undefined = undefined

  /** The filename of an image of the monster's token */
  token: string | undefined = undefined

  /** Where the column split occurs in a two-column stat block */
  columnAfter: ColumnAfter = ColumnAfter.Traits

  /** A particular property to split the column after */
  columnAfterProperty: string | undefined = undefined

  /** Whether the monster stat block should show the image of the monster */
  showImage: boolean = true

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
    } catch (error: any) {
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
      monster.ac = ac.toString()
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

    // Get monster's bonus actions
    const bonusActions = (monsterData['bonus-actions'] as BonusAction[] || monsterData['bonusActions'] as BonusAction[])
    if (bonusActions) {
      monster.bonusActions = bonusActions
    }

    // Get monster's reactions
    const reactions = monsterData['reactions'] as Reaction[]
    if (reactions) {
      monster.reactions = reactions
    }

    // Get monster's legendary actions
    const legendaryActions = (monsterData['legendary-actions'] as LegendaryAction[] || monsterData['legendaryActions'] as LegendaryAction[])
    if (legendaryActions) {
      monster.legendaryActions = legendaryActions
    }

    // Get monster's mythic actions
    const mythicActions = (monsterData['mythic-actions'] as MythicAction[] || monsterData['mythicActions'] as MythicAction[])
    if (mythicActions) {
      monster.mythicActions = mythicActions
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

    // Get a monster's column after value
    const columnAfterString = monsterData['column-after'] as string
    if (columnAfterString) {
      monster.columnAfter = Monster.getColumnAfter(columnAfterString)
    }

    // Get a monster's column after property
    const columnAfterProperty = monsterData['column-after-property'] as string
    if (columnAfterProperty) {
      monster.columnAfterProperty = columnAfterProperty
    }

    // Gets whether monster images should be shown
    const showImage = monsterData['show-image'] as boolean
    if (showImage !== undefined) {
      monster.showImage = showImage
    }

    return monster
  }

  static getColumnAfter(columnAfterString: string): ColumnAfter {
    switch (columnAfterString.toLowerCase()) {
      case 'stats':
        return ColumnAfter.Stats
      case 'traits':
        return ColumnAfter.Traits
      case 'actions':
        return ColumnAfter.Actions
      case 'bonus-actions':
          return ColumnAfter.BonusActions
      case 'bonusActions':
        return ColumnAfter.BonusActions
      case 'reactions':
        return ColumnAfter.Reactions
      case 'legendary-actions':
        return ColumnAfter.LegendaryActions
      case 'legendaryActions':
        return ColumnAfter.LegendaryActions
    }
    return ColumnAfter.Traits
  }

  /**
   * Converts a monster's size description to a compendium-compatible entry
   * @param monster The monster
   */
  static getCompendiumSize(monster: Monster): string {
    switch (monster.size.toLowerCase()) {
      case 'tiny':
        return 'T'
      case 'small':
        return 'S'
      case 'medium':
        return 'M'
      case 'large':
        return 'L'
      case 'huge':
        return 'H'
      case 'gargantuan':
        return 'G'
      case 'colossal':
        return 'C'
    }
    return 'M'
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

    function formatACDescription(acDescription: string): string {
      let newDescription = acDescription
      newDescription = newDescription.replace(/with mage armor/i, 'with <i>mage armor</i>')
      return newDescription
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

    /**
     * Gets the proficiency bonus for the challenge rating
     * @param challenge The challenge rating
     * @returns The proficiency bonus for the challenge rating
     */
    function getProficiencyForChallenge(challenge: string): number {
      switch (challenge) {
        case '0':
          return 2
        case '1/8':
          return 2
        case '1/4':
          return 2
        case '1/2':
          return 2
        case '1':
          return 2
        case '2':
          return 2
        case '3':
          return 2
        case '4':
          return 2
        case '5':
          return 3
        case '6':
          return 3
        case '7':
          return 3
        case '8':
          return 3
        case '9':
          return 4
        case '10':
          return 4
        case '11':
          return 4
        case '12':
          return 4
        case '13':
          return 5
        case '14':
          return 5
        case '15':
          return 5
        case '16':
          return 5
        case '17':
          return 6
        case '18':
          return 6
        case '19':
          return 6
        case '20':
          return 6
        case '21':
          return 7
        case '22':
          return 7
        case '23':
          return 7
        case '24':
          return 7
        case '25':
          return 8
        case '26':
          return 8
        case '27':
          return 8
        case '28':
          return 8
        case '29':
          return 9
        case '30':
          return 9
      }
      return 2
    }

    /**
     * Gets the XP for a challenge rating
     * @param challenge The challenge rating
     * @returns The XP for a challenge rating
     */
    function getChallengeXP(challenge: string): string {
      switch (challenge) {
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
    properties.push({ name: 'Proficiency Bonus', description: `+${getProficiencyForChallenge(this.challenge)}` })

    let allClasses = Array.from(classes)
    allClasses.splice(0, 0, 'statblock')
    let classesString = allClasses.join(' ')
    let monsterHTML = `<div class="${classesString}">`
    monsterHTML += '<hr class="statblock-border" />'
    monsterHTML += '<div class="statblock-section-left">'
    monsterHTML += '<div class="statblock-creature-heading">'
    monsterHTML += `<p class="statblock-title">${this.name}</p>`
    
    let subtitle = `${this.size} ${this.type}`
    if (this.alignment !== undefined) {
      subtitle += `, ${this.alignment}`
    }
    monsterHTML += `<p class="statblock-subtitle">${subtitle}</p>`
    
    monsterHTML += '</div>' // statblock-creature-heading
    monsterHTML += drawTaperRule()
    monsterHTML += '<div class="statblock-top-stats">'
    monsterHTML += `<div class="statblock-property-line first"><p class="statblock-topstat-name">Armor Class</p> <p class="statblock-topstat-value">${formatACDescription(this.ac)}</p></div>`
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
    let hasHadColumnBreak: Boolean = false
    properties.forEach((property, index) => {
      if (index === 0) {
        monsterHTML += '<div class="statblock-property-line first">'
      } else if (property.name === 'Challenge') {
        monsterHTML += '<div class="statblock-property-line last">'        
      } else if (property.name === 'Proficiency Bonus') {
        // Allow proficiency bonus to be displayed on the same line as Challenge
        monsterHTML += '<span class="statblock-spacer"></span>'        
      } else {
        monsterHTML += '<div class="statblock-property-line">'
      }
      
      monsterHTML += `<span class="statblock-property-name">${property.name}</span> <span class="statblock-property-value">${property.description}</span>`
      if (property.name !== 'Challenge') {
        // Don't close the div after challenge, allow that to be after the proficiency bonus
        monsterHTML += '</div>'
      }
    })
    monsterHTML += drawTaperRule()
    if (this.columnAfter === ColumnAfter.Stats && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }
    this.traits.forEach((trait, index) => {
      monsterHTML += '<div class="statblock-property-block">'
      if (trait.name) {
        monsterHTML += `<p class="statblock-trait-name">${trait.name}.</p> `
      }
      monsterHTML += `<p class="statblock-trait-description">${formatDescription(trait.description)}</p>`
      monsterHTML += '</div>' // statblock-property-block
      if (this.columnAfter === ColumnAfter.Traits && !hasHadColumnBreak && this.columnAfterProperty !== undefined && this.columnAfterProperty.toLowerCase() === trait.name.toLowerCase()) {
        monsterHTML += '</div>' // statblock-section-left
        monsterHTML += '<div class="statblock-section-right">'
        hasHadColumnBreak = true
      }
    })
    if (this.columnAfter === ColumnAfter.Traits && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Actions
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
        if (this.columnAfter === ColumnAfter.Actions && !hasHadColumnBreak && this.columnAfterProperty !== undefined && this.columnAfterProperty.toLowerCase() === action.name.toLowerCase()) {
          monsterHTML += '</div>' // statblock-actions
          monsterHTML += '</div>' // statblock-section-left
          monsterHTML += '<div class="statblock-section-right">'
          monsterHTML += '<div class="statblock-actions">'
          hasHadColumnBreak = true
        }
      })
      monsterHTML += '</div>' // statblock-actions
    }

    // Break Column After Actions
    if (this.columnAfter === ColumnAfter.Actions && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Bonus Actions
    if (this.bonusActions.length > 0) {
      monsterHTML += '<div class="statblock-bonus-actions">'
      monsterHTML += '<p class="statblock-section-title">Bonus Actions</p>'
      this.bonusActions.forEach((bonusAction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (bonusAction.name) {
          monsterHTML += `<p class="statblock-bonus-action-name">${bonusAction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-bonus-action-description">${formatDescription(bonusAction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
        if (this.columnAfter === ColumnAfter.BonusActions && !hasHadColumnBreak && this.columnAfterProperty !== undefined && this.columnAfterProperty.toLowerCase() === bonusAction.name.toLowerCase()) {
          monsterHTML += '</div>' // statblock-bonus-actions
          monsterHTML += '</div>' // statblock-section-left
          monsterHTML += '<div class="statblock-section-right">'
          monsterHTML += '<div class="statblock-bonus-actions">'
          hasHadColumnBreak = true
        }
      })
      monsterHTML += '</div>' // statblock-bonus-actions
    }

    // Break Column After Bonus Actions
    if (this.columnAfter === ColumnAfter.BonusActions && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Reactions
    if (this.reactions.length > 0) {
      monsterHTML += '<div class="statblock-reactions">'
      monsterHTML += '<p class="statblock-section-title">Reactions</p>'
      this.reactions.forEach((reaction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (reaction.name) {
          monsterHTML += `<p class="statblock-reaction-name">${reaction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-reaction-description">${formatDescription(reaction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
        if (this.columnAfter === ColumnAfter.Reactions && !hasHadColumnBreak && this.columnAfterProperty !== undefined && this.columnAfterProperty.toLowerCase() === reaction.name.toLowerCase()) {
          monsterHTML += '</div>' // statblock-reactions
          monsterHTML += '</div>' // statblock-section-left
          monsterHTML += '<div class="statblock-section-right">'
          monsterHTML += '<div class="statblock-reactions">'
          hasHadColumnBreak = true
        }
      })
      monsterHTML += '</div>' // statblock-reactions
    }

    // Break Column After Reactions
    if (this.columnAfter === ColumnAfter.Reactions && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Legendary Actions
    if (this.legendaryActions.length > 0) {
      monsterHTML += '<div class="statblock-legendary-actions">'
      monsterHTML += '<p class="statblock-section-title">Legendary Actions</p>'
      this.legendaryActions.forEach((legendaryAction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (legendaryAction.name) {
          monsterHTML += `<p class="statblock-legendary-action-name">${legendaryAction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-legendary-action-description">${formatDescription(legendaryAction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
        if (this.columnAfter === ColumnAfter.LegendaryActions && !hasHadColumnBreak && this.columnAfterProperty !== undefined && this.columnAfterProperty.toLowerCase() === legendaryAction.name.toLowerCase()) {
          monsterHTML += '</div>' // statblock-reactions
          monsterHTML += '</div>' // statblock-section-left
          monsterHTML += '<div class="statblock-section-right">'
          monsterHTML += '<div class="statblock-reactions">'
          hasHadColumnBreak = true
        }
      })
      monsterHTML += '</div>' // statblock-reactions
    }

    // Break Column After Legendary Actions
    if (this.columnAfter === ColumnAfter.LegendaryActions && !hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Mythic Actions
    if (this.mythicActions.length > 0) {
      monsterHTML += '<div class="statblock-mythic-actions">'
      monsterHTML += '<p class="statblock-section-title">Mythic Actions</p>'
      this.mythicActions.forEach((mythicAction, index) => {
        monsterHTML += '<div class="statblock-property-block">'
        if (mythicAction.name) {
          monsterHTML += `<p class="statblock-mythic-action-name">${mythicAction.name}.</p> `
        }
        monsterHTML += `<p class="statblock-mythic-action-description">${formatDescription(mythicAction.description)}</p>`
        monsterHTML += '</div>' // statblock-property-block
      })
      monsterHTML += '</div>' // statblock-mythicActions
    }

    // Break Column After Mythic Actions
    if (!hasHadColumnBreak) {
      monsterHTML += '</div>' // statblock-section-left
      monsterHTML += '<div class="statblock-section-right">'
      hasHadColumnBreak = true
    }

    // Monster Image
    if (this.showImage && this.image !== undefined) {
      monsterHTML += '<div class="statblock-image-block">'
      monsterHTML += `<img src=${this.image} class="statblock-image">`
      monsterHTML += '</div>' // statblock-image-block
    }
    monsterHTML += '</div>' // statblock-section-right
    monsterHTML += '<hr class="statblock-border bottom" />'
    monsterHTML += '</div>' // statblock

    return monsterHTML
  }
}

/** The module include mode */
enum ColumnAfter {
  /** In a two-column statblock, place the column split after the Stats */
  Stats = 1,

  /** In a two-column statblock, place the column split after the Traits */
  Traits,

  /** In a two-column statblock, place the column split after the Actions */
  Actions,

  /** In a two-column statblock, place the column split after the Bonus Actions */
  BonusActions,

  /** In a two-column statblock, place the column split after the Reactions */
  Reactions,

  /** In a two-column statblock, place the column split after the Legendary ACtions */
  LegendaryActions
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

/** Describes a Bonus Action */
interface BonusAction {
  /** The bonus action's name */
  name: string

  /** The bonus action's description */
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

/** Describes a Mythic Action */
interface MythicAction {
  /** The mythic action's name */
  name: string

  /** The mythic action's description */
  description: string
}
