// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import * as Electron from 'electron'

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

addButton.onclick = async () => {
  statusInfo.classList.add('invisible')
  statusLink.classList.add('invisible')
  Electron.ipcRenderer.send('openDirectory')
}

statusLink.onclick = (event) => {
  event.preventDefault()
  Electron.ipcRenderer.send('showExportItem', name)
}

createButton.onclick = (event) => {
  event.preventDefault()
  let name = nameInput.value
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Processing'
  statusLink.classList.add('invisible')
  Electron.ipcRenderer.send('createModule', name)
}

exportButton.onclick = (event) => {
  event.preventDefault()
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Processing'
  statusLink.classList.add('invisible')
  Electron.ipcRenderer.send('exportToPdf')
}

Electron.ipcRenderer.on('pathSelected', (event: Electron.IpcRendererEvent, moduleName: string | undefined, path: string) => {
  addLabel.innerText = path  
  nameInput.value = moduleName
  nameInput.disabled = true
  addModuleJson.classList.remove('invisible')
  addLabel.classList.remove('d-none')
  moduleSection.classList.remove('d-none')
  statusInfo.classList.add('invisible')
  statusLink.classList.add('invisible')
})

Electron.ipcRenderer.on('successModule', (event: Electron.IpcRendererEvent, moduleName: string) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Successfully Created Module'
  statusLink.innerHTML = moduleName
  statusLink.classList.remove('invisible')
})

Electron.ipcRenderer.on('successPdf', (event: Electron.IpcRendererEvent, fileName: string) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = 'Successfully Exported PDF'
  statusLink.innerHTML = fileName
  statusLink.classList.remove('invisible')
})

Electron.ipcRenderer.on('installProgressUpdate', (event: Electron.IpcRendererEvent, progress: number) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = `Rendering Engine Install: ${progress.toFixed(1)}%`
  statusLink.classList.add('invisible')
})

Electron.ipcRenderer.on('showStatusMessage', (event: Electron.IpcRendererEvent, message: string) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML = message
  statusLink.classList.add('invisible')
})

Electron.ipcRenderer.on('error', (event: Electron.IpcRendererEvent, message: string) => {
  statusInfo.classList.remove('invisible')
  statusInfo.innerHTML =
    '<span class="text-danger"><strong>Error</strong>: ' + message + '</span>'
  statusLink.classList.add('invisible')
  console.error(message)
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
  Electron.ipcRenderer.send('handlePathSelection', paths)
  return false
}