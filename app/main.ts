import { app, BrowserWindow, ipcMain } from 'electron'
import * as Path from 'path'
import { Module } from '../shared/Module Entities/Module'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow

function createWindow() {
  
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: true,
    backgroundColor: '#333333',
    icon: Path.join(__dirname, '../resources/img/icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })

  // If running in a development environment, customize the window size
  let dev = false
  if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
    dev = true
  }

  // and load the index.html of the app.
  mainWindow.loadFile(Path.join(__dirname, "../resources/index.html"))

  // Open the DevTools.
  if(dev) {
    mainWindow.webContents.openDevTools()
    mainWindow.setSize(800, 570, false)
    mainWindow.center()
  }
}
  

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow()

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

ipcMain.on('createModule', async (event, path, name) => {
  try {
    let module = await Module.createModuleFromPath(path, name)
    mainWindow.webContents.send('success', module.name, module.moduleArchivePath)  
  } catch (error) {
    mainWindow.webContents.send('error', error.message)
  }    
})

process.on('uncaughtException', function (error) {
  console.log(error.message)
  mainWindow.webContents.send('error', error.message)
})