import * as vscode from 'vscode'
import * as Path from 'path'
import { ModuleProject } from '../../shared/ModuleProject'
import { Module, ModuleMode } from '../../shared/Module Entities/Module'
import { Page } from '../../shared/Module Entities/Page'
import { Group } from '../../shared/Module Entities/Group'
import { ModuleEntity } from '../../shared/Module Entities/ModuleEntity'

/** A TreeView proivider for module projects and their pages/groups */
export class ModuleProjectProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  // ---------------------------------------------------------------
  // Private Fields
  // ---------------------------------------------------------------

  /** An event emitter for the refresh action */
  private onDidChangeTreeDataEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>()

  // ---------------------------------------------------------------
  // Initialization and Cleanup
  // ---------------------------------------------------------------

  /**
   * Initializes an instance of `ModuleProjectProvider`
   * @param workspaceRoot The workspace root path
   */
  constructor(private workspaceRoot: string) { }

  // ---------------------------------------------------------------
  // Public Properties
  // ---------------------------------------------------------------

  /** The Did Change Tree Data event */
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this.onDidChangeTreeDataEmitter.event

  // ---------------------------------------------------------------
  // Public Methods
  // ---------------------------------------------------------------

  /** Refreshes the tree view contents */
  refresh(): void {
    // Refresh from the root
    this.onDidChangeTreeDataEmitter.fire(undefined)
  }

  /**
   * Gets a tree item
   * @param element The element to get the tree item for
   */
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element
  }

  /**
   * Gets the children of a tree item
   * @param element The tree item to get children for
   */
  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([])
    }

    if (!element) {
      let moduleTreeItemReturns: Promise<ModuleTreeItem>[] = []
      let moduleProjects = ModuleProject.findModuleProjects(this.workspaceRoot)
      moduleProjects.forEach((moduleProject) => {
        if (!moduleProject.moduleProjectDirectory) {
          return
        }

        let moduleTreeReturn = Module.createModuleFromPath(moduleProject.moduleProjectDirectory, moduleProject.name, ModuleMode.ScanModule).then((module) => {
          return new ModuleTreeItem(module)
        })        

        moduleTreeItemReturns.push(moduleTreeReturn)        
      })
      return Promise.all(moduleTreeItemReturns)
    } else if (element instanceof ModuleTreeItem) {
      return Promise.resolve(ModuleProjectProvider.getTreeItemsForChildren(element.module.children))
    } else if (element instanceof GroupTreeItem) {
      return Promise.resolve(ModuleProjectProvider.getTreeItemsForChildren(element.group.children))
    } else if (element instanceof PageTreeItem) {
      return Promise.resolve(ModuleProjectProvider.getTreeItemsForChildren(element.page.children))
    } else {
      return Promise.resolve([])
    }
  }

  // ---------------------------------------------------------------
  // Private Methods
  // ---------------------------------------------------------------

  /**
   * Gets all tree items for a given directory
   * @param directoryPath The path to the directory to get tree items for
   */
  private static getTreeItemsForChildren(moduleEntities: ModuleEntity[]): vscode.TreeItem[] {
    let treeItems: vscode.TreeItem[] = []
    moduleEntities.forEach((entity) => {
      if (entity instanceof Group) {
        treeItems.push(new GroupTreeItem(entity))
      } else if (entity instanceof Page) {
        treeItems.push(new PageTreeItem(entity))
      }
    })
    return treeItems
  }
}

/** A module group tree item */
class GroupTreeItem extends vscode.TreeItem {
  
  /**
   * Initializes an instance of a `GroupTreeItem`
   * @param group The group
   * @param groupPath The group directory path
   */
  constructor(public readonly group: Group) {
    super(group.name, vscode.TreeItemCollapsibleState.Collapsed)
    const groupFilePath = Path.join(group.groupPath, Group.groupSettingsFileName)
    this.command = {
      command: 'encounterPlusMarkdown.openGroupFile',
      title: 'Open Group',
      arguments: [groupFilePath],
    }   
    this.contextValue = 'moduleGroup'
    this.tooltip = this.group.groupPath
    this.description = ''
  }
}

/** A module page tree item */
class PageTreeItem extends vscode.TreeItem {

  /**
   * Initializes an instance of a `PageTreeItem`
   * @param page The page name
   */
  constructor(public readonly page: Page) {
    super(page.name, page.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
    this.command = {
      command: 'encounterPlusMarkdown.openPage',
      title: 'Open Page',
      arguments: [page.pagePath],
    }
    this.contextValue = 'modulePage'
    this.tooltip = this.page.pagePath
    this.description = ''
  }
}

/** A module project tree item */
class ModuleTreeItem extends vscode.TreeItem {
  /**
   * Initializes an instance of a `ModuleTreeItem`
   * @param moduleProject The module project
   */
  constructor(public readonly module: Module) {
    super(module.moduleProjectInfo.name, vscode.TreeItemCollapsibleState.Collapsed)
    this.command = {
      command: 'encounterPlusMarkdown.openModuleProjectFile',
      title: 'Open Module',
      arguments: [module.moduleProjectInfo.moduleProjectPath],
    }    
    this.contextValue = 'moduleProject'
    this.tooltip = this.module.moduleProjectInfo.description ?? ''
    this.description = ''
  }
}
