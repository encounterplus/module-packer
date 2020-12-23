import { app, BrowserWindow, ipcMain } from 'electron'
import * as Path from 'path'
import * as Logger from 'winston'
import * as Transport from 'winston-transport'
import { Module, ModuleMode } from '../shared/Module Entities/Module'
import { ModuleProject } from '../shared/ModuleProject'
import { PdfExporter } from '../shared/PdfExporter'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow

/**
 * Creates the apps window
 * @param isHidden If true, launches the window hidden (for CLI runs of the app)
 */
function createWindow(isHidden: boolean) {
  const modulePackerLogger = new ModulePackerLogger()
  Logger.add(modulePackerLogger)

  // Create the browser window.
  mainWindow = new BrowserWindow({
    show: !isHidden,
    width: isHidden ? 0 : 400,
    height: isHidden ? 0 : 600,
    resizable: true,
    backgroundColor: '#333333',
    icon: Path.join(__dirname, '../resources/img/icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
		if(isHidden) {
			mainWindow.hide();
		} else {
			mainWindow.show();
			mainWindow.maximize();
		}
	})

  // If running in a development environment, customize the window size
  let dev = false
  if (process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath)) {
    dev = true
  }

  // and load the index.html of the app.
  mainWindow.loadFile(Path.join(__dirname, '../resources/index.html'))

  // Open the DevTools.
  if (dev) {
    mainWindow.webContents.openDevTools()
    mainWindow.setSize(950, 600, false)
    mainWindow.center()
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  let isDebug = process.argv[1].includes('--debug-brk') || 
    process.argv[1].includes('--inspect-brk') || 
    process.argv[1].includes('--remote-debugging-port')
  let isCommandLineInterface = process.argv && process.argv.length > 1 && !isDebug
  
  createWindow(isCommandLineInterface)

  let isCommandLinePDFBuild = isCommandLineInterface && 
    process.argv.length > 2 &&
    process.argv[2].toLowerCase() === 'pdf'

  if(isCommandLineInterface) {
    let path = process.argv[1]
    if (isCommandLinePDFBuild) {
      await createPDFFromPath(path, Path.basename(path))
    } else {
      await createModuleFromPath(path, Path.basename(path))
    }    
    app.quit()
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!isCommandLineInterface && BrowserWindow.getAllWindows().length === 0) {
      createWindow(true)
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('exportToPdf', async (event, path, name) => {
  try {
    createPDFFromPath(path, name)
  } catch (error) {
    mainWindow.webContents.send('error', error.message)
  }
})

function updateChromiumInstallProgress(progress: number) {
  mainWindow.webContents.send('installProgressUpdate', progress)
}

ipcMain.on('createModule', async (event, path, name) => {
  try {
    createModuleFromPath(path, name)
  } catch (error) {
    mainWindow.webContents.send('error', error.message)
  }
})

/**
 * Creates the module from a path and name
 * @param path The path of the module
 * @param name The name of the module
 */
async function createModuleFromPath(path: string, name: string) {
  let moduleProjects = ModuleProject.findModuleProjects(path)
  if (moduleProjects.length === 0) {
    let module = await Module.createModuleFromPath(path, name, ModuleMode.ModuleExport)
    mainWindow.webContents.send('successModule', module.moduleProjectInfo.name, module.moduleArchivePath)
    Logger.info('Module created successfully')
  } else if (moduleProjects.length === 1) {
    let modulePath = Path.dirname(moduleProjects[0].moduleProjectPath)
    let module = await Module.createModuleFromPath(modulePath, name, ModuleMode.ModuleExport)
    mainWindow.webContents.send('successModule', module.moduleProjectInfo.name, module.moduleArchivePath)
    Logger.info('Module created successfully')
  } else {
    Logger.error('Error: Multiple modules at the specified path')
    mainWindow.webContents.send('error', 'There are multiple modules in the specified path.')
  }
}

/**
 * Creates the PDF from a path and name
 * @param path The path of the module
 * @param name The name of the module
 */
async function createPDFFromPath(path: string, name: string) {
  let moduleProjects = ModuleProject.findModuleProjects(path)
  if (moduleProjects.length === 0) {
    await PdfExporter.installChromiumForRendering(updateChromiumInstallProgress)
    let outputPath = await PdfExporter.exportToPdf(path)
    mainWindow.webContents.send('successPdf', outputPath)
    Logger.info('Module PDF created successfully')
  } else if (moduleProjects.length === 1) {
    let moduleFolderPath = Path.dirname(moduleProjects[0].moduleProjectPath)
    await PdfExporter.installChromiumForRendering(updateChromiumInstallProgress)
    let outputPath = await PdfExporter.exportToPdf(moduleFolderPath)
    mainWindow.webContents.send('successPdf', outputPath)
    Logger.info('Module PDF created successfully')
  } else {
    Logger.error('Error: Multiple modules at the specified path')
    mainWindow.webContents.send('error', 'There are multiple modules in the specified path.')
  }
}

process.on('uncaughtException', function (error) {
  console.error(error.message)
  mainWindow.webContents.send('error', error.message)
})

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
