import fs from 'fs';
import fsp from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import getUrlContents from './fetch-utils.js';

export const getFileExtension = (url) => {
  const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
};

const transformBaseName = (baseName) => {
  return baseName.split('').map((symbol) =>
    (/[^a-zA-Z0-9]/).test(symbol) ? '-' : symbol
  ).join('');
};
