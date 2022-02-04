import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import * as Logger from 'winston'
import * as Transport from 'winston-transport'
import { Module, ModuleMode } from '../shared/Module Entities/Module'
import { ModuleProject } from '../shared/ModuleProject'
import { PdfExporter } from '../shared/PdfExporter'

/** 
 * The Main Window 
 * 
 * Keep a global reference of the window object, if you don't, the window will
 * be closed automatically when the JavaScript object is garbage collected.
 */
let mainWindow: BrowserWindow

/** The base path for processing one or more modules */
let basePath: string | undefined = undefined

/** The path at which a module or PDF was exported */
let exportedPath: string | undefined = undefined

// ---------------------------------------------------------------
// Main Window Creation & App Messages
// ---------------------------------------------------------------

/**
 * Creates the app's window
 */
 function createWindow() {
  const modulePackerLogger = new ModulePackerLogger()
  Logger.add(modulePackerLogger)

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: true,
    backgroundColor: '#333333',
    icon: Path.join(__dirname, '../resources/img/icon.png'),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: Path.join(__dirname, 'preload.js')
    },
  })

  // If running in a development environment, customize the window size
  let dev = false
  if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
    dev = true
  }

  // and load the index.html of the app.
  mainWindow.loadFile(Path.join(__dirname, '../index.html'))

  // Open the DevTools.
  if (dev) {
    mainWindow.webContents.openDevTools()
    mainWindow.setSize(950, 600, false)
    mainWindow.center()
  }
} 

/**
 * Quit when all windows are closed, except on macOS. There, it's common
 * for applications and their menu bar to stay active until the user quits
 * explicitly with Cmd + Q.
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/** 
 * Handles an uncaught exception 
 */
process.on('uncaughtException', function (error) {
  console.error((error as Error).message)
  mainWindow.webContents.send('error', (error as Error).message)
})

// ---------------------------------------------------------------
// IPC Main Message Handlers:
// These messages come from the Renderer and should be handled
// with Application Logic
// ---------------------------------------------------------------

ipcMain.on('exportToPdf', async (event: Electron.IpcMainInvokeEvent) => {
  exportToPdf()
})

ipcMain.on('createModule', async (event: Electron.IpcMainInvokeEvent, name: string) => {
  createModule(name)
})

ipcMain.on('openDirectory', async (event: Electron.IpcMainInvokeEvent) => {
  openDirectory()
})

ipcMain.on('handlePathsSelection', async (event: Electron.IpcMainInvokeEvent, paths: string[]) => {
  handlePathsSelection(paths)
})

ipcMain.on('showExportItem', async (event: Electron.IpcMainInvokeEvent) => {
  showExportItem()
})

// ---------------------------------------------------------------
// App Functionality
// ---------------------------------------------------------------

/**
 * Shows the export item in the system's file explorer
 */
function showExportItem() {
  shell.showItemInFolder(exportedPath)
}

/**
 * Creates a module from the specified path with the specified name
 * @param name The name of the module
 */
function createModule(name: string) {
  if (basePath === undefined) {
    return
  }

  try {
    createModuleFromPath(basePath, name)
  } catch (error: any) {
    mainWindow.webContents.send('error', (error as Error).message)
  }
}

/**
 * Triggers an Open Directory prompt
 */
function openDirectory() {
  try {
    dialog.showOpenDialog(({ properties: ['openDirectory'] })).then((result) => {
      let paths: string[] = []
      if (!result.canceled) {
        paths = result.filePaths
      }
      
      handlePathsSelection(paths)
    })
  } catch (error: any) {
    mainWindow.webContents.send('error', (error as Error).message)
  }
} 

/**
 * Handles one or more paths being selected for module packing
 */
function handlePathsSelection(paths: string[]) {
  if (paths.length === 0) {
    return
  }

  let path = paths[0]
  basePath = FileSystem.statSync(path).isDirectory() ? path : Path.dirname(path)
  let moduleJsonName = Module.getModuleName(basePath)
  let moduleName = ""
  if (moduleJsonName !== undefined) {
    moduleName = moduleJsonName
  } else {
    moduleName = Path.basename(path)
  }

  mainWindow.webContents.send('pathSelected', moduleName, basePath)
}

/**
 * Updates the chromium install progress 
 * @param progress The progress of the chromium install
 */
function updateChromiumInstallProgress(progress: number) {
  mainWindow.webContents.send('installProgressUpdate', progress)
}

/**
 * Creates the module from a path and name
 * @param path The path of the module
 * @param name The name of the module
 */
async function createModuleFromPath(path: string, name: string) {
  try {
    let moduleProjects = ModuleProject.findModuleProjects(path)
    let appRootPath = Path.join(__dirname, '..')

    if (moduleProjects.length > 1) {
      Logger.error('Error: Multiple modules at the specified path')
      mainWindow.webContents.send('error', 'There are multiple modules in the specified path.')
      return
    }

    let pathToExport = moduleProjects.length === 1 ? Path.dirname(moduleProjects[0].moduleProjectPath) : path
    let module = await Module.createModuleFromPath(pathToExport, appRootPath, name, ModuleMode.ModuleExport)
    exportedPath = module.moduleArchivePath
    mainWindow.webContents.send('successModule', module.moduleProjectInfo.name)      
    Logger.info('Module created successfully')
  } catch(error) {
    mainWindow.webContents.send('error', (error as Error).message)
  }
}

/**
 * Creates the PDF from a path and name
 * @param path The path of the module
 * @param name The name of the module
 */
async function createPDFFromPath(path: string) {
  try {
    let moduleProjects = ModuleProject.findModuleProjects(path)
    let appRootPath = Path.join(__dirname, '..')

    if (moduleProjects.length > 1) {
      Logger.error('Error: Multiple modules at the specified path')
      mainWindow.webContents.send('error', 'There are multiple modules in the specified path.')
      return
    }

    let pathToExport = moduleProjects.length === 1 ? Path.dirname(moduleProjects[0].moduleProjectPath) : path
    const chromiumPath = Path.join(app.getPath("userData"), "chromium")
    PdfExporter.downloadFolder = chromiumPath
    await PdfExporter.installChromiumForRendering(updateChromiumInstallProgress)
    mainWindow.webContents.send('showStatusMessage', 'Exporting to PDF...')
    let outputPath = await PdfExporter.exportToPdf(pathToExport, appRootPath)
    exportedPath = outputPath
    let fileName = Path.basename(outputPath)
    mainWindow.webContents.send('successPdf', fileName)
    Logger.info('Module PDF created successfully')
  } catch(error) {
    mainWindow.webContents.send('error', (error as Error).message)
  }  
}

/**
 * Triggers an export to PDF
 */
 function exportToPdf() {
  if (basePath === undefined) {
    return
  }

  try {
    createPDFFromPath(basePath)
  } catch (error: any) {
    mainWindow.webContents.send('error', (error as Error).message)
  }
}

// ---------------------------------------------------------------
// ModulePackerLogger class
// ---------------------------------------------------------------

/**
 * A simple logger transport for directing
 * Winston logs to Module Packer console output.
 */
export class ModulePackerLogger extends Transport {
  /**
   * Processes a log message
   * @param info The log info
   * @param callback The log callback
   */
  log(info: any, callback: any) {
    setImmediate(() => {
      setImmediate(() => this.emit('logged', info))
    })

    switch (info['level']) {
      case 'warn':
        console.warn(info['message'])
        break
      case 'error':
        console.error(info['message'])
        break
      default:
        console.log(info['message'])
        break
    }

    if (callback) {
      callback()
    }
  }
}