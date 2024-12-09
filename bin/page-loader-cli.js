#!/usr/bin/env node

import { Command } from 'commander';

import { assembleFileName, savePage } from '../src/page-loader.js';

const program = new Command();

program
  .version('1.0.0')
  .description('Page loader utility')
  .arguments('<url>', 'URL of the page to load')
  .option('-o, --output <dir>', 'Output directory (default: current directory)', process.cwd())
  .action((url, options) => {
    console.log(`URL: ${url}`);
    console.log(`Options: ${JSON.stringify(options)}`);
    savePage(url, options.output)
      .then((filePath) => {
        console.log(`Page was saved as: ${filePath}`); // Log success
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`); // Log error and exit with code 1
        process.exit(1);
      });
  })
  .helpOption('-h, --help', 'Output usage information');

program.parse(process.argv);
