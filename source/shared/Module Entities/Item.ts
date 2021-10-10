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

  /** The properties of the item. Supported values are
   * Ammunition, Finesse, Heavy, Light, Loading, Range, Reach,
   * Special, Thrown, Two-handed, and Versatile */
  properties: string[] | undefined = undefined

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
  description: string | undefined = undefined

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /**
   * Gets a Item object instance from a YAML representation
   * @param itemYamlContent The YAML content that represents the item
   * @param module The module to which the item belongs
   */
  static fromYAMLContent(itemYamlContent: string, module: Module | undefined = undefined) {
    // Parse item from YAML
    let itemData: any = undefined
    try {
      itemData = YAML.parse(itemYamlContent)
    } catch (error: any) {
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
    // will happen when the item is being generated as part of a preview
    // for the VS Code extension
    let item = new Item(name, module?.moduleProjectInfo.id ?? UUIDV4(), slug)

    // Get Item type
    const type = itemData['type'] as string
    if (type) {
      item.type = type
    } else {
      throw Error(
        'Item must have a type. Type may be: Wealth, Ammunition, Armor, Adventuring gear, Heavy armor, Light armor, Melee weapon, Medium armor, Potion, Ranged weapon, Rod, Ring, Shield, Scroll, Staff, Wondrous item, Wand, or Weapon'
      )
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

    const properties = itemData['properties'] as string[]
    if (properties) {
      item.properties = properties
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

    const description = itemData['description'] as string
    if (description) {
      item.description = description
    }

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
        throw Error(
          `Invalid item type "${item.type}". Supported values are: Wealth, Ammunition, Armor, Adventuring gear, Heavy armor, Light armor, Melee weapon, Medium armor, Potion, Ranged weapon, Rod, Ring, Shield, Scroll, Staff, Wondrous item, Wand, and Weapon`
        )
    }
  }

  /**
   * Converts an item's property description to a compendium-compatible entry
   * @param item The item
   */
  static getCompendiumProperty(item: Item): string | undefined {
    if (item.properties === undefined) {
      return undefined
    }

    let propertyValues: string[] = []
    item.properties.forEach((property) => {
      if(property === undefined || property === null) {
        return
      }

      switch (property.toLowerCase()) {
        case 'ammunition':
          propertyValues.push('A')
          break
        case 'finesse':
          propertyValues.push('F')
          break
        case 'heavy':
          propertyValues.push('H')
          break
        case 'light':
          propertyValues.push('L')
          break
        case 'loading':
          propertyValues.push('LD')
          break
        case 'range':
          propertyValues.push('RN')
          break
        case 'reach':
          propertyValues.push('R')
          break
        case 'special':
          propertyValues.push('S')
          break
        case 'thrown':
          propertyValues.push('T')
          break
        case 'two-handed':
          propertyValues.push('2H')
          break
        case 'versatile':
          propertyValues.push('V')
          break
        default:
          throw Error(
            `Invalid item property "${property}". Supported values are: Ammunition, Finesse, Heavy, Light, Loading, Range, Reach, Special, Thrown, Two-handed, and Versatile`
          )
      }
    })

    return propertyValues.join(',')
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
   * Gets the HTML representation of the item
   */
  getHTML = (classes: string[] = []): string => {
    let attributeDescriptions: string[] = []
    if (this.type) {
      attributeDescriptions.push(this.type)
    }
    if (this.rarity) {
      attributeDescriptions.push(this.rarity)
    }
    if (this.properties) {
      attributeDescriptions.push(this.properties.join(', '))
    }

    let headingText = attributeDescriptions.join(', ')
    if (this.attunement) {
      headingText += ` (${this.attunement})`
    }

    function formatDescription(description: string): string {
      let newDescription = description
      newDescription = newDescription.replace(/[\r\n]/g, '<br />')
      return newDescription
    }

    let allClasses = Array.from(classes)
    allClasses.splice(0, 0, 'item-block')
    let classesString = allClasses.join(' ')
    let itemHTML = `<div class="${classesString}">`
    itemHTML += `<p class="item-block-title">${this.name}</p>`
    itemHTML += `<div class="item-block-top-border"></div>`
    itemHTML += `<div class="item-block-body">`
    itemHTML += `<p class="item-block-heading">${headingText}</p>`
    itemHTML += `<div class="item-block-heading-border"></div>`
    if(this.description !== undefined) {
      itemHTML += `<p class="item-block-description">${formatDescription(this.description)}</p>`
    }    
    itemHTML += '<p>'
    if (this.primaryDamage) {
      itemHTML += `<strong>Damage: </strong>${this.primaryDamage}`
      if (this.secondaryDamage) {
        itemHTML += ` (${this.secondaryDamage} 2H)`
      }
      itemHTML += `<br />`
    }
    if (this.value) {
      itemHTML += `<strong>Value: </strong>${this.value}<br />`
    }
    itemHTML += '</p>'
    itemHTML += `<div class="item-block-bottom-border"></div>`
    itemHTML += `</div>` // item-block-body
    itemHTML += `</div>` // item-block
    return itemHTML
  }
}
