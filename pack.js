#!/usr/bin/env node
const path = require('path');
var argv = require('yargs')
    .usage('Usage: $0 <path> [options]')
    .command('path', 'Path to a directory', { alias: 'path' })
    .example('$0 /path/to/dir --name Test', 'pack content of the directory into Encounter+ .module')
    .alias('n', 'name')
    .nargs('n', 1)
    .describe('n', 'Module name')
    .demandCommand(1)
    .demandOption(['n'])
    .help('h')
    .alias('h', 'help')
    .argv;

const Module = require('./app/models/module');
const Markdown = require('./app/parsers/markdown');

Object.defineProperty(process, "resourcesPath", {
    value: path.join(process.cwd(), "resources")
});

var src = argv._[ 0 ];

// create module
let mod = new Module(undefined, argv.n)

// create data parser
var parser = new Markdown(mod)

// process
parser.process(src)



