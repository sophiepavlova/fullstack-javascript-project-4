import fs from 'fs';
import fsp from 'fs/promises';

import axios from 'axios';
import * as cheerio from 'cheerio';

import getUrlContents from './fetch-utils.js';

export const getFileExtension = (url) => {
  const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
};

export const transformBaseName = (baseName) => {
  return baseName.split('').map((symbol) =>
    (/[^a-zA-Z0-9]/).test(symbol) ? '-' : symbol
  ).join('');
};

export const getSanitizedFileName = (url) => {
  const fileExtension = getFileExtension(url);
  const nameWithoutProtocol = url.replace(/^https?:\/\//, '');

  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(fileExtension.toLowerCase())) {
    const baseName = nameWithoutProtocol.slice(0, -fileExtension.length);
    return `${transformBaseName(baseName)}${fileExtension}`;
  }

  return transformBaseName(nameWithoutProtocol);
};

export const createHtmlFileName = (url) => {
  const sanitizedFileName = getSanitizedFileName(url);
  return `${sanitizedFileName}.html`;
};

export const ensureDirectoryExists = (outputDirectory) => fsp.mkdir(outputDirectory, { recursive: true });

export const updateHtmlLinks = (links, fileContents) => {
  const $ = cheerio.load(fileContents);
  $('img').each((index, element) => {
    const currentSrc = $(element).attr('src');
    console.log('Current src:', currentSrc);
    console.log('Links object:', links);

    if(Object.prototype.hasOwnProperty.call(links, currentSrc)) {
      $(element).attr('src', links[currentSrc]);
    }
  });

  return $.html();
};

export const normalizeHtml = (html) => {
  return html.replace(/\s+/g, ' ').trim();
};
