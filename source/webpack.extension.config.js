//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node',
  entry: './vscode-extension/extension.ts',
  output: {
    path: path.resolve(__dirname, 'extension-out/vscode-extension'),
    filename: 'extension-packed.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  optimization: {
    minimize: false
  },
  node: {
    __dirname: false
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: "tsconfig.extension.json"
            }
          }
        ]
      }
    ]
  }
};
module.exports = config;