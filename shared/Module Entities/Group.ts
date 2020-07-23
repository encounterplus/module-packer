import * as YAML from 'yaml'
import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import { Module } from './Module'
import { ModuleEntity } from './ModuleEntity'

/** Represents a Group in a Module */
export class Group extends ModuleEntity {
  
  // ---------------------------------------------------------------
  // Initialization & Cleanup
  // ---------------------------------------------------------------

  /**
   * Initiaizes an instance of `Group`
   * @param name The name of the group
   * @param moduleUUID The UUID of the module
   * @param groupPath The path of the group
   */
  constructor(name: string = 'Unnamed Group', moduleUUID: string, groupPath: string) {
    let effectiveName = name
    let slug: string | undefined = undefined
    let order: number | undefined = undefined

    let groupSettingsPath = Path.join(groupPath, Group.groupSettingsFileName)
    if (FileSystem.existsSync(groupSettingsPath)) {
      let groupDataBuffer = FileSystem.readFileSync(groupSettingsPath)
      let groupData = YAML.parse(groupDataBuffer.toString())
      let groupName = groupData['name'] as string
      if (groupName) {
        effectiveName = groupName
      }
      
      let slugFromSettings = groupData['slug']
      if (slugFromSettings) {
        slug = slugFromSettings
      }

      order = groupData['order'] as number
    }

    if (!slug) {
      slug = Module.getSlugFromValue(`group-${Module.getSlugFromValue(effectiveName)}`)
    }
    super(effectiveName, moduleUUID, slug)
    this.groupPath = groupPath

    if(order) {
      this.sort = order
    }
  }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The group settings file name */
  static groupSettingsFileName = 'Group.yaml'

  /** The path of the group */
  groupPath: string
  
}
