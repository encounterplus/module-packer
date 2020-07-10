import argparse
import os
import sys

def run(command):
    exitCode = os.system(command)
    if(exitCode != 0):
        exit(exitCode)
    

# Parse the arguments
parser = argparse.ArgumentParser()
parser.add_argument("target", help='The target to run')
args = parser.parse_args()
target = args.target

if target == 'build-extension':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('rm -rf ./extension-out')
    run('cp ./vscode-extension/package.extension.json ./package.json')
    run('npm install')
    run('npm run compile-extension')
elif target == 'package-extension':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('rm -rf ./node_modules')
    run('rm -rf ./dist')
    run('rm -rf ./app-out')
    run('rm -rf ./extension-out')
    run('cp ./vscode-extension/package.extension.json ./package.json')
    run('npm install')
    run('npm audit fix')
    run('npm run compile-extension')
    run('vsce package')
elif target == 'build-app':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('rm -rf ./app-out')
    run('cp ./app/package.app.json ./package.json')
    run('npm install')
    run('npm run compile-app')
elif target == 'start-app':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('cp ./app/package.app.json ./package.json')
    run('npm install')
    run('npm run compile-app')
    run('npm run start')
elif target == 'package-app':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('rm -rf ./node_modules')
    run('rm -rf ./dist')
    run('rm -rf ./app-out')
    run('rm -rf ./extension-out')
    run('cp ./app/package.app.json ./package.json')
    run('npm install')
    run('npm audit fix')
    run('npm run compile-app')
    run('npm run build-all')
elif target == 'clean':
    run('rm -f ./package.json')
    run('rm -f ./package-lock.json')
    run('rm -rf ./node_modules')
    run('rm -rf ./dist')
    run('rm -rf ./app-out')
    run('rm -rf ./extension-out')
    run('rm -rf *.vsix')
else:
    print('Error - unrecognized launch target specified: \"{}\"'.format(target))
    exit(1)