import * as Path from 'path'
import * as Logger from 'winston'
import * as Transport from 'winston-transport'
import { Module, ModuleMode } from '../shared/Module Entities/Module'
import { ModuleProject } from '../shared/ModuleProject'
import { PdfExporter } from '../shared/PdfExporter'

async function main()
{
  const modulePackerLogger = new ModulePackerLogger()
  Logger.add(modulePackerLogger)
  let args = process.argv

  if (args.length < 3) {
    console.error('A Module path must be specified')
    return
  }
  let isPdfOutput = args.length > 3 && process.argv[3].toLowerCase() === 'pdf'
  let path = process.argv[2]
  if (isPdfOutput) {
    await createPDFFromPath(path, Path.basename(path))
  } else {
    await createModuleFromPath(path, Path.basename(path))
  }
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
    if (moduleProjects.length === 0) {
      await Module.createModuleFromPath(path, appRootPath, name, ModuleMode.ModuleExport)
      Logger.info('Module created successfully')
    } else if (moduleProjects.length === 1) {
      let modulePath = Path.dirname(moduleProjects[0].moduleProjectPath)
      await Module.createModuleFromPath(modulePath, appRootPath, name, ModuleMode.ModuleExport)
      Logger.info('Module created successfully')
    } else {
      Logger.error('Error: Multiple modules at the specified path')
    }
  } catch(error) {
    Logger.error((error as Error).message)
  }
}

/**
 * Creates the PDF from a path and name
 * @param path The path of the module
 * @param name The name of the module
 */
async function createPDFFromPath(path: string, name: string) {
  try {
    let moduleProjects = ModuleProject.findModuleProjects(path)
    let appRootPath = Path.join(__dirname, '..')
    if (moduleProjects.length === 0) {    
      await PdfExporter.installChromiumForRendering(updateChromiumInstallProgress)
      await PdfExporter.exportToPdf(path, appRootPath)
      Logger.info('Module PDF created successfully')
    } else if (moduleProjects.length === 1) {
      let moduleFolderPath = Path.dirname(moduleProjects[0].moduleProjectPath)
      await PdfExporter.installChromiumForRendering(updateChromiumInstallProgress)
      await PdfExporter.exportToPdf(moduleFolderPath,  appRootPath)
      Logger.info('Module PDF created successfully')
    } else {
      Logger.error('Error: Multiple modules at the specified path')
    }
  } catch(error) {
    Logger.error((error as Error).message)
  }  
}

function updateChromiumInstallProgress(progress: number) {
  Logger.info(`Installing chromium renderer: ${progress}%`)
}

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

main()