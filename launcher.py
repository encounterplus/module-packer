import argparse
import contextlib
import os
import shutil
import sys

def run(command):
    exitCode = os.system(command)
    if(exitCode != 0):
        exit(exitCode)

def removeIfExists(path):
    if os.path.exists(path):
        os.remove(path)

def removeDirIfExists(path):
    if os.path.exists(path):
        shutil.rmtree(path)

def copy(source, destination):
    shutil.copy(source, destination)

# Parse the arguments
parser = argparse.ArgumentParser()
parser.add_argument("target", help='The target to run')
parser.add_argument("--path", help='The path to build when running CLI')
parser.add_argument("--output", help='If specified, PDF output will be used')
args = parser.parse_args()
target = args.target
path = args.path
output = args.output

if target == 'build-extension':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    removeDirIfExists('./extension-out')
    copy('./vscode-extension/package.extension.json', './package.json')
    run('npm install')
    run('npm run compile-css')
    run('npm run compile-extension')
elif target == 'package-extension':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    removeDirIfExists('./node_modules')
    removeDirIfExists('./dist')
    removeDirIfExists('./app-out')
    removeDirIfExists('./extension-out')
    copy('./vscode-extension/package.extension.json', './package.json')
    run('npm install')
    run('npm audit fix')
    run('npm run compile-css')
    run('npm run compile-extension')
    run('vsce package')
elif target == 'build-app':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    removeDirIfExists('./app-out')
    copy('./app/package.app.json', './package.json')
    run('npm install')
    run('npm run compile-css')
    run('npm run compile-app')
elif target == 'start-app':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    copy('./app/package.app.json', './package.json')
    run('npm install')
    run('npm run compile-css')
    run('npm run compile-app')
    run('npm run start')
elif target == 'run':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    copy('./cli/package.cli.json', './package.json')
    run('npm install')
    run('npm run compile-css')
    run('npm run compile-cli')
    run('node ./cli-out/cli/main.js "{}" "{}"'.format(path or "", output or ""))
elif target == 'package-app':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    removeDirIfExists('./node_modules')
    removeDirIfExists('./dist')
    removeDirIfExists('./app-out')
    removeDirIfExists('./extension-out')
    copy('./app/package.app.json', './package.json')
    run('npm install')
    run('npm audit fix')
    run('npm run compile-css')
    run('npm run compile-app')
    run('npm run build-all')
elif target == 'clean':
    removeIfExists('./package.json')
    removeIfExists('./package-lock.json')
    removeDirIfExists('./node_modules')
    removeDirIfExists('./dist')
    removeDirIfExists('./app-out')
    removeDirIfExists('./extension-out')
    removeDirIfExists('*.vsix')
else:
    print('Error - unrecognized launch target specified: \"{}\"'.format(target))
    exit(1)