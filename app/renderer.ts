// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import * as Electron from 'electron'
import * as FileSystem from 'fs-extra'
import * as Path from 'path'
import { Module } from '../shared/Module Entities/Module'

const addButton = document.getElementById('add-button')
const addLabel = document.getElementById('add-label')
const createButton = document.getElementById('build-module-button')
const exportButton = document.getElementById('export-to-pdf-button')
const moduleSection = document.getElementById('module-section')
const nameInput = document.getElementById('name-input') as HTMLInputElement
const statusInfo = document.getElementById('status-info')
const addModuleJson = document.getElementById('add-moduleJson')
const statusLink = document.getElementById('status-link')
const container = document.getElementById('container')

let basePath: string | undefined = undefined
let exportedPath: string | undefined = undefined

function handlePathSelection(paths: string[]) {
  if (paths.length === 0) {
    return
  }

  let path = paths[0]
  basePath = FileSystem.statSync(path).isDirectory() ? path : Path.dirname(path)
  addLabel.innerText = basePath
  let moduleJsonName = Module.getModuleName(basePath)
  if (moduleJsonName !== undefined) {
    nameInput.value = moduleJsonName
    nameInput.disabled = true
    addModuleJson.classList.remove('invisible')
  } else {
    nameInput.value = Path.basename(basePath)
    addModuleJson.classList.add('invisible')
  }

  addLabel.classList.remove('d-none')
  moduleSection.classList.remove('d-none')

  statusInfo.classList.add('invisible')
  statusLink.classList.add('invisible')
}

addButton.onclick = () => {
  statusInfo.classList.add('invisible')
  statusLink.classList.add('invisible')
  Electron.remote.dialog
    .showOpenDialog({ properties: ['openDirectory'] })
    .then((result) => {
      if (result.canceled) {
        return
      }

      handlePathSelection(result.filePaths)
    })
    .catch((err) => {})
}

statusLink.onclick = (event) => {
  event.preventDefault()
  Electron.shell.showItemInFolder(exportedPath)
}

createButton.onclick = (event) => {
  event.preventDefault()
  let name = nameInput.value
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Processing'
  statusLink.classList.add('invisible')
  Electron.ipcRenderer.send('createModule', basePath, name)
}

exportButton.onclick = (event) => {
  event.preventDefault()
  let name = nameInput.value
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Processing'
  statusLink.classList.add('invisible')
  Electron.ipcRenderer.send('exportToPdf', basePath, name)
}

Electron.ipcRenderer.on('successModule', (event, moduleName, path) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Successfully Created Module'
  statusLink.innerHTML = moduleName
  exportedPath = path
  statusLink.classList.remove('invisible')
})

Electron.ipcRenderer.on('successPdf', (event, path) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Successfully Exported PDF'
  statusLink.innerHTML = Path.basename(path)
  exportedPath = path
  statusLink.classList.remove('invisible')
})

Electron.ipcRenderer.on('installProgressUpdate', (event, progress: number) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = `Rendering Engine Install: ${progress.toFixed(1)}%`
  statusLink.classList.add('invisible')
})

Electron.ipcRenderer.on('error', (event, message) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML =
    '<span class="text-danger"><strong>Error</strong>: ' + message + '</span>'
  statusLink.classList.add('invisible')
})

container.ondragover = () => {
  return false
}

container.ondragleave = () => {
  return false
}

container.ondragend = () => {
  return false
}

container.ondrop = (event) => {
  event.preventDefault()
  let paths = []
  let files = event.dataTransfer.files
  for (var i = 0; i < files.length; i++) {
    paths.push(files.item(i).path)
  }
  handlePathSelection(paths)
  return false
}
