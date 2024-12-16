#!/usr/bin/env node

import { Command } from 'commander';

import { savePage, handleImagesInHtml } from '../src/page-loader.js';
import { getSanitizedFileName } from '../src/utils.js';

const program = new Command();

program
  .version('1.0.0')
  .description('Page loader utility')
  .arguments('<url>', 'URL of the page to load')
  .option('-o, --output <dir>', 'Output directory (default: current directory)', process.cwd())
  .action((url, options) => {
    console.log(`URL: ${url}`);
    console.log(`Options: ${JSON.stringify(options)}`);

    const { output } = options;
    savePage(url, output)
      .then(({ htmlFilePath, fileHtmlContents }) => {
        console.log(`Page was saved as: ${htmlFilePath}`);
        const resourcesDirectory = `${output}/${getSanitizedFileName(url)}_files`;
        console.log(`Using resources folder path: ${resourcesDirectory}`);;
        return handleImagesInHtml(fileHtmlContents, resourcesDirectory, htmlFilePath);
      })
      .then((downloadedPaths) => {
        console.log(`Images were saved to: ${JSON.stringify(downloadedPaths)}`);
      })
      .catch((err) => {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      });
  })
  .helpOption('-h, --help', 'Output usage information');

program.parse(process.argv);
