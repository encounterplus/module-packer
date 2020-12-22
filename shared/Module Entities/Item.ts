import { v4 as UUIDV4 } from 'uuid'
import * as YAML from 'yaml'
import { ModuleEntity } from './ModuleEntity'
import { Module } from './Module'

/** Represents a Item in a Module */
export class Item extends ModuleEntity {
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `Item`
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

  /** The item type. Supported values are 
   * Wealth, Ammunition, Armor, Adventuring gear,
   * Heavy armor, Light armor, Melee weapon, Medium armor,
   * Potion, Ranged weapon, Rod, Ring, Shield, Scroll,
   * Staff, Wondrous item, Wand, and Weapon
  */
  type: string | undefined = undefined

  /** The rarity of the item. Supported values are
   * Common, Uncommon, Rare, Very Rare, and Legendary
  */
  rarity: string | undefined = undefined

  /** The item's value */
  value: string | undefined = undefined

  /** The item's weight */
  weight: string | undefined = undefined
  
  /** The item's heading */
  heading: string | undefined = undefined

  /** The item's attunement */
  attunement: string | undefined = undefined

  /** The property of the item. Supported values are
   * Ammunition, Finesse, Heavy, Light, Loading, Range, Reach,
   * Special, Thrown, Two-handed, and Versatile */ 
  property: string | undefined = undefined

  /** The item's primary damage value (e.g., 1H if versatile) */
  primaryDamage: string | undefined = undefined

  /** The item's secondary damage value (e.g., 2H if versatile) */
  secondaryDamage: string | undefined = undefined

  /** The damage type. Supported values are
   * Bludgeoning, Piercing, and Slashing */
  damageType: string | undefined = undefined

  /** The item's range */
  range: string | undefined = undefined

  /** The item's AC */
  ac: string | undefined = undefined

  /** The item's source */
  source: string | undefined = undefined

  /** The filename of an image of the item */
  image: string | undefined = undefined

  /** The item's description */
  text: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets a Item object instance from a YAML representation
   * @param itemYamlContent The YAML content that represents the item
   * @param module The module to which the monster belongs
   */
  static fromYAMLContent(itemYamlContent: string, module: Module | undefined = undefined) {
    // Parse Monster from YAML
    let itemData: any = undefined
    try {
      itemData = YAML.parse(itemYamlContent)
    } catch (error) {
      throw Error(`Failed to parse Item. Error: ${(error as Error).message}`)
    }

    // A name must be defined - if it isn't,
    // go with "Unnamed Item"
    let name = itemData['name'] as string
    if (!name) {
      name = 'Unnamed Item'
    }

    // Generate a slug if one isn't manually defined
    let slug = itemData['slug'] as string
    if (!slug || module === undefined) {
      slug = Module.getSlugFromValue(name)
    }

    // If the module project ID isn't defined, generate a random one. This
    // will happen when the Monster is being generated as part of a preview
    // for the VS Code extension
    let item = new Item(name, module?.moduleProjectInfo.id ?? UUIDV4(), slug)

    // Get Item type
    const type = itemData['type'] as string
    if (type) {
      item.type = type
    } else {
      throw Error('Item must have a type. Type may be: Wealth, Ammunition, Armor, Adventuring gear, Heavy armor, Light armor, Melee weapon, Medium armor, Potion, Ranged weapon, Rod, Ring, Shield, Scroll, Staff, Wondrous item, Wand, or Weapon')
    }

    const rarity = itemData['rarity'] as string
    if (rarity) {
      item.rarity = rarity
    }

    const value = itemData['value'] as string
    if (value) {
      item.value = value
    }

    const weight = itemData['weight'] as string
    if (weight) {
      item.weight = weight
    }

    const heading = itemData['heading'] as string
    if (heading) {
      item.heading = heading
    }

    const attunement = itemData['attunement'] as string
    if (attunement) {
      item.attunement = attunement
    }
    
    const property = itemData['property'] as string
    if (property) {
      item.property = property
    }

    const primaryDamage = itemData['primaryDamage'] as string
    if (primaryDamage) {
      item.primaryDamage = primaryDamage
    }

    const secondaryDamage = itemData['secondaryDamage'] as string
    if (secondaryDamage) {
      item.secondaryDamage = secondaryDamage
    }
    
    const damageType = itemData['damageType'] as string
    if (damageType) {
      item.damageType = damageType
    }

    const range = itemData['range'] as string
    if (range) {
      item.range = range
    }

    const ac = itemData['ac'] as string
    if (ac) {
      item.ac = ac
    }

    const source = itemData['source'] as string
    if (source) {
      item.source = source
    }

    const text = itemData['text'] as string
    if (text) {
      item.text = text
    }

    // Get monster image - copy image file to root
    // if we're parsing this as an individual monster YAML file.
    // If parsing in the context of markdown, this will already
    // be taken care of for us.
    const image = itemData['image'] as string
    if (image) {
      item.image = image
    }

    return item
  }

  /**
   * Converts an item's type description to a compendium-compatible entry
   * @param item The item
   */
  static getCompendiumType(item: Item): string | undefined {
    if (item.type === undefined) {
      return undefined
    }

    switch (item.type.toLowerCase()) {
      case 'armor':
        return 'AA'
      case 'weapon':
        return 'WW'
      case 'light armor':
        return 'LA'
      case 'medium armor':
        return 'MA'
      case 'heavy armor':
        return 'HA'
      case 'shield':
        return 'S'
      case 'melee weapon':
        return 'M'
      case 'ranged weapon':
        return 'R'
      case 'ammunition':
        return 'A'
      case 'rod':
        return 'RD'
      case 'staff':
        return 'ST'
      case 'wand':
        return 'WD'
      case 'ring':
        return 'RG'
      case 'potion':
        return 'P'
      case 'scroll':
        return 'SC'
      case 'wondrous item':
        return 'W'
      case 'adventuring gear':
        return 'G'
      case 'wealth':
        return '$'
      default:
        throw Error(`Invalid item type "${item.type}". Supported values are: Wealth, Ammunition, Armor, Adventuring gear, Heavy armor, Light armor, Melee weapon, Medium armor, Potion, Ranged weapon, Rod, Ring, Shield, Scroll, Staff, Wondrous item, Wand, and Weapon`)
    }
  }

  /**
   * Converts an item's property description to a compendium-compatible entry
   * @param item The item
   */
  static getCompendiumProperty(item: Item): string | undefined {
    if (item.property === undefined) {
      return undefined
    }

    switch (item.property.toLowerCase()) {
      case 'ammunition':
        return 'A'
      case 'finesse':
        return 'F'
      case 'heavy':
        return 'H'
      case 'light':
        return 'L'
      case 'loading':
        return 'LD'
      case 'range':
        return 'RN'
      case 'reach':
        return 'R'
      case 'special':
        return 'S'
      case 'thrown':
        return 'T'
      case 'two-handed':
        return '2H'
      case 'versatile':
        return 'V'
      default:
        throw Error(`Invalid item property "${item.property}". Supported values are: Ammunition, Finesse, Heavy, Light, Loading, Range, Reach, Special, Thrown, Two-handed, and Versatile`)
    }
  }

  /**
   * Converts an item's damage type description to a compendium-compatible entry
   * @param item The item
   */
  static getCompendiumDmgType(item: Item): string | undefined {
    if (item.damageType === undefined) {
      return undefined
    }

    switch (item.damageType.toLowerCase()) {
      case 'bludgeoning':
        return 'B'
      case 'piercing':
        return 'P'
      case 'slashing':
        return 'S'
      default:
        throw Error(`Invalid item damage type "${item.damageType}". Supported values are: Bludgeoning, Piercing, Slashing`)
    }
  }

  /**
   * Gets the HTML representation of the monster
   */
  getHTML = (classes: string[] = []): string => {
    let itemHTML: string = ''
    return itemHTML
  }
}
