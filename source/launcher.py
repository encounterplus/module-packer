import argparse
import contextlib
import os
import shutil
import subprocess
import sys


# Defines common parameters for running shell script
def run(cmd, capture_output=False, print_command=True, print_output=True, return_must_be_zero=True):
    if print_command:
        print('Running Process: ' + cmd, flush=True)
    run_complete = subprocess.run(cmd, shell=True, cwd=os.getcwd(), capture_output=capture_output)
    output_string = run_complete.stdout if run_complete.returncode == 0 else run_complete.stderr
    if capture_output == True and print_output == True:
        print(output_string, flush=True)
    if run_complete.returncode != 0 and return_must_be_zero:
        sys.exit(run_complete.returncode)
    return output_string

def removeIfExists(path):
    if os.path.exists(path):
        print('Deleting file {}'.format(path), flush=True)
        os.remove(path)

def removeDirIfExists(path):
    if os.path.exists(path):
        print('Deleting folder {}'.format(path), flush=True)
        shutil.rmtree(path)

def copy(source, destination):
    print('Copying from {} to {}'.format(source, destination), flush=True)
    shutil.copy(source, destination)

def copyDir(source, destination):
    print('Copying from {} to {}'.format(source, destination), flush=True)
    shutil.copytree(source, destination)

def createFolder(folder):
    if not os.path.exists(folder):
        print('Creating folder {}'.format(folder), flush=True)
        os.mkdir(folder)
    # Mark this folder to be ignored on Dropbox on macOS
    if sys.platform == 'darwin':
        run('xattr -w com.dropbox.ignored 1 {}'.format(folder), False, False) 
    elif sys.platform == 'win32':
        run('powershell.exe Set-Content -Path "{}" -Stream com.dropbox.ignored -Value 1'.format(folder), False, False)

def processTarget(target):
    if target == 'makeFolders':
        createFolder('./node_modules')
        createFolder('./dist')
        createFolder('./app-out')
        createFolder('./cli-out')
        createFolder('./extension-out')
        createFolder('./.local-chromium')
    elif target == 'clean':
        removeIfExists('./package.json')
        removeIfExists('./package-lock.json')
        removeDirIfExists('./node_modules')
        removeDirIfExists('./dist')
        removeDirIfExists('./app-out')
        removeDirIfExists('./extension-out')
        removeDirIfExists('./Documentation')
        removeDirIfExists('./.local-chromium')
        removeIfExists('./README.md')
        removeIfExists('./Advanced.md')
        processTarget('makeFolders')
    elif target == 'build-extension':
        removeIfExists('./package.json')
        removeIfExists('./package-lock.json')
        removeDirIfExists('./extension-out')
        processTarget('makeFolders')
        copy('./vscode-extension/package.extension.json', './package.json')
        run('npm install')
        run('npm run compile-css')
        run('npm run compile-extension')
    elif target == 'build-app':
        removeIfExists('./package.json')
        removeIfExists('./package-lock.json')
        removeDirIfExists('./app-out')
        processTarget('makeFolders')
        copy('./app/package.app.json', './package.json')
        run('npm install')
        run('npm run compile-css')
        run('npm run compile-app')
    elif target == 'start-app':
        processTarget('build-app')
        run('npm run start')
    elif target == 'run':
        removeIfExists('./package.json')
        removeIfExists('./package-lock.json')
        removeDirIfExists('./cli-out')
        processTarget('makeFolders')
        copy('./cli/package.cli.json', './package.json')
        run('npm install')
        run('npm run compile-css')
        run('npm run compile-cli')
        run('node ./cli-out/cli/main.js "{}" "{}"'.format(path or "", output or ""))
    elif target == 'package-extension':
        processTarget('clean')
        copyDir('../Documentation', './Documentation')
        copy('../README.md', './README.md')
        copy('../Advanced.md', './Advanced.md')
        processTarget('build-extension')        
        run('vsce package')
    elif target == 'package-app':
        processTarget('clean')
        processTarget('build-app')
        run('npm run build-all')
    else:
        print('Error - unrecognized launch target specified: \"{}\"'.format(target))
        exit(1)

# Parse the arguments
parser = argparse.ArgumentParser()
parser.add_argument("target", help='The target to run')
parser.add_argument("--path", help='The path to build when running CLI')
parser.add_argument("--output", help='If specified, PDF output will be used')
args = parser.parse_args()
target = args.target
path = args.path
output = args.output

processTarget(target)