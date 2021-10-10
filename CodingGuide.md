# Module Packer Coding Guide

## Launching From Code

To run Module Packer or its Visual Studio Code extension from code, you will need the following prerequisites installed:
- [Python](https://python.org)
- [NodeJS](https://nodejs.org/) 
- [Node Package Manager (npm)](https://www.npmjs.com) 

To build and start the standalone module-packer, navigate to the code folder, issue the following command:
```
python3 launcher.py start-app
```

## Working with Code

### Code Layout

The project is configured with two main projects: an [Electron](https://www.electronjs.org) application that serves as the standalone Module Packer application, and a Visual Studio Code extension that enables module packing and markdown editing right from Visual Studio Code. They are each controlled as Node.js packages with NPM Modules. In additition, there is common shared code that actually contains most of the business logic for packing modules.

Included launcher scripts will take care of copying the appropriate `package.json` file from the source and placing it in the main project workspace directory.

The following folders exist in the repository 
- `app`: Contains code for the stanadlone Module Packer Electron application.
- `assets`: Contains the images, stylesheets, and scripts needed to render the markdown in the EncounterPlus style.
- `build`: The build resources for the standalone Module Packer Electron application builds.
- `documentation`: Resources for help files and documentation.
- `shared`: Contains code that is shared between the standalone application and the extension.
- `vscode-extension`: Contains the code for the Visual Studio Code extension.

In addition, the following folders may exist after various build processes are run:
- `app-out`: Contains built javascript code after the typescript compiler has been run for the `app` folder.
- `dist`: Contains compiled Windows and Mac binaries Exists after the packager/Electron-Build process has been run via the `package-app` launcher has been run.
- `extension-out`: Contains built javascript code after the typescript compiler has been run for the `vscode-extension` folder.
- `node_modules`: Contains node modules that have been installed by the build scripts.

### Compiling From Command Line

To compile the standalone application from typescript, run the following command:
```
python3 launcher.py build-app
```

To compile the Visual Studio Code extension from typescript, run the following command:
```
python3 launcher.py build-extension
```

### Packaging the Application

The standalone module packer application can be packaged with the following command. Do note, however, that the project is currently configured to look for certificates that will not exist on your system. These will need to be changed. For more information, consule the [Electron-Builder documentation](https://www.electron.build):

```
python3 launcher.py package-app
```

### Packaging the Visual Studio Code Extension
The Visual Studio Code extension can be packaged as a VSIX with the following command.
```
python3 launcher.py package-extension
```

This script will require the Visual Studio Code Extensions node module to be installed on your system:
```
npm install -g vsce
```

## Debugging

The Module Packer project is configured for use with [Visual Studio Code](https://code.visualstudio.com), though other development environments may be used. If using Visual Studio Code, you will find two launch tasks are already configured for the workspace:
- `Debug Module-Packer App`: Downloads all NPM modules, builds the typescript source for the Electron app, and launches the Module Packer application with debug hooks in Visual Studio Code.
- `Run VS Code Extension`: Downloads all NPM modules, builds the typescript source for the Visual Studio Code Extesnion, and launches the extension with debug hooks in Visual Studio Code.