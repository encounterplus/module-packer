import argparse
import os
import sys

# Parse the arguments
parser = argparse.ArgumentParser()
parser.add_argument("target", help='The target to run')
args = parser.parse_args()
target = args.target

if target == 'build-extension':
    os.system('cp ./vscode-extension/package.extension.json ./package.json')
    os.system('npm install')
    os.system('npm run compile-extension')
elif target == 'package-extension':
    os.system('rm -rf ./node_modules')
    os.system('rm -rf ./dist')
    os.system('rm -rf ./app-out')
    os.system('rm -rf ./extension-out')
    os.system('cp ./vscode-extension/package.extension.json ./package.json')
    os.system('npm install')
    os.system('npm run compile-extension')
    os.system('vsce package')
elif target == 'build-app':
    os.system('cp ./app/package.app.json ./package.json')
    os.system('npm install')
    os.system('npm run compile-app')
elif target == 'start-app':
    os.system('cp ./app/package.app.json ./package.json')
    os.system('npm install')
    os.system('npm run compile-app')
    os.system('npm run start')
elif target == 'package-app':
    os.system('rm -rf ./node_modules')
    os.system('rm -rf ./dist')
    os.system('rm -rf ./app-out')
    os.system('rm -rf ./extension-out')
    os.system('cp ./app/package.app.json ./package.json')
    os.system('npm install')
    os.system('npm run compile-app')
    os.system('npm run build-all')
else:
    print('Error - unrecognized launch target specified: \"{}\"'.format(target))
    exit(1)