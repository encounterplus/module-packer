// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron')
const electron = require('electron')
const path = require('path')
const Module = require('./app/models/module')
const Markdown = require('./app/parsers/markdown')


// Enable live reload for all the files inside your project directory
require('electron-reload')(__dirname)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let dev = false
if ( process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath) ) {
  dev = true
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 363,
    height: 570,
    resizable: true,
    backgroundColor: '#333333',
    icon: path.join(__dirname, 'assets/img/icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  })


  // and load the index.html of the app.
  mainWindow.loadFile('index.html')


  // Open the DevTools.
  if (dev ) {
    mainWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.webContents.on('new-window', function(event, url) {
    event.preventDefault()
    shell.openExternal(url)
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/** Main logic */
ipcMain.on('createModule', (event, path, name) => {
  createModule(path, name)
})

// creatue module
function createModule(path, name) {

  /** Focus window on drag */
  !mainWindow || mainWindow.focus();

  // create module
  let mod = new Module(undefined, name)

  // create markdown parser
  var parser = new Markdown(mod)

  parser.on('success', (path) => {
    mainWindow.webContents.send('success', path)
  })

  // process
  parser.process(path)
}

// handle exceptions
process.on('uncaughtException', function (error) {
  console.log(error.message)
  mainWindow.webContents.send('error', error.message)
})
