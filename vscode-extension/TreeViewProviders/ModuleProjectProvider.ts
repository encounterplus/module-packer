import * as vscode from 'vscode'
import * as Path from 'path'
import * as FileSystem from 'fs-extra'
import * as GrayMatter from 'gray-matter'
import { ModuleProject } from '../../shared/ModuleProject'
import { Module } from '../../shared/Module Entities/Module'

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
      let moduleTreeItems: ModuleTreeItem[] = []
      let moduleProjects = ModuleProject.findModuleProjects(this.workspaceRoot)
      moduleProjects.forEach((moduleProject) => {
        let moduleTreeItem = new ModuleTreeItem(moduleProject)
        moduleTreeItems.push(moduleTreeItem)
      })
      return Promise.resolve(moduleTreeItems)
    } else if (element instanceof ModuleTreeItem) {
      let projectPath = element.moduleProject.moduleProjectPath
      if (projectPath === undefined) {
        return Promise.resolve([])
      }
      let projectDirectory = Path.dirname(projectPath)
      let treeItems = this.getTreeItemsForDirectory(projectDirectory)
      return Promise.resolve(treeItems)
    } else if (element instanceof GroupTreeItem) {
      let treeItems = this.getTreeItemsForDirectory(element.groupPath)
      return Promise.resolve(treeItems)
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
  private getTreeItemsForDirectory(directoryPath: string): vscode.TreeItem[] {
    let treeItems: vscode.TreeItem[] = []

    // Get all subdirectories
    let subdirectoryNames: string[] = FileSystem.readdirSync(directoryPath).filter(function (file) {
      let childPath = Path.join(directoryPath, file)
      return FileSystem.statSync(childPath).isDirectory()
    })

    subdirectoryNames.forEach((subdirectoryName) => {
      if (subdirectoryName === Module.buildFolderName) {
        return
      }

      let subdirectoryPath = Path.join(directoryPath, subdirectoryName)
      let ignoreFilePath = Path.join(subdirectoryPath, '.ignoreGroup')
      let moduleProjectFilePath = Path.join(subdirectoryPath, 'module.json')
      if (FileSystem.existsSync(ignoreFilePath) || FileSystem.existsSync(moduleProjectFilePath)) {
        return
      }
      treeItems.push(new GroupTreeItem(subdirectoryName, subdirectoryPath))
    })

    let directoryFiles = FileSystem.readdirSync(directoryPath)
    directoryFiles.forEach((itemName) => {
      let itemPath = Path.join(directoryPath, itemName)
      let extension = Path.extname(itemPath)

      // All code below is for parsing markdown files,
      // so ignore any non-markdown files
      if (extension !== '.md') {
        return
      }

      let data = FileSystem.readFileSync(itemPath, 'utf8')
      let matter = GrayMatter(data)
      let attributes = matter.data
      let pageName = Path.basename(itemPath)
      if (attributes['name'] !== undefined) {
        pageName = attributes['name']
      }

      treeItems.push(new PageTreeItem(pageName, itemPath))
    })

    return treeItems
  }
}

/** A module group tree item */
class GroupTreeItem extends vscode.TreeItem {
  
  /**
   * Initializes an instance of a `GroupTreeItem`
   * @param groupName The group name
   * @param groupPath The group directory path
   */
  constructor(public readonly groupName: string, public readonly groupPath: string) {
    super(groupName, vscode.TreeItemCollapsibleState.Collapsed)
    this.contextValue = 'moduleGroup'
  }

  /** The tooltip for the `GroupTreeItem` */
  get tooltip(): string {
    return this.groupPath
  }

  /** The tooltip for the `GroupTreeItem` */
  get description(): string {
    return ''
  }
}

/** A module page tree item */
class PageTreeItem extends vscode.TreeItem {

  /**
   * Initializes an instance of a `PageTreeItem`
   * @param pageName The page name
   * @param pagePath The page file path
   */
  constructor(public readonly pageName: string, public readonly pagePath: string) {
    super(pageName, vscode.TreeItemCollapsibleState.None)
    this.command = {
      command: 'encounterPlusMarkdown.openPage',
      title: 'Open Page',
      arguments: [pagePath],
    }
    this.contextValue = 'modulePage'
  }

  /** The tooltip for the `PageTreeItem` */
  get tooltip(): string {
    return this.pagePath
  }

  /** The description for the `PageTreeItem` */
  get description(): string {
    return ''
  }
}

/** A module project tree item */
class ModuleTreeItem extends vscode.TreeItem {
  /**
   * Initializes an instance of a `ModuleTreeItem`
   * @param moduleProject The module project
   */
  constructor(public readonly moduleProject: ModuleProject) {
    super(moduleProject.name, vscode.TreeItemCollapsibleState.Collapsed)
    this.contextValue = 'moduleProject'
  }

  /** The tooltip for the `ModuleTreeItem` */
  get tooltip(): string {
    return this.moduleProject.description ?? ''
  }

  /** The description for the `ModuleTreeItem` */
  get description(): string {
    return ''
  }
}
