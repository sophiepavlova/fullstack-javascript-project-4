import fsp from 'fs/promises';

import getUrlContents from './fetch-utils.js';

export const assembleFileName = (url) => {
  const nameWithoutProtocol = url.replace(/^https?:\/\//, '');
  const nameResult = nameWithoutProtocol.split('').map(symbol => (/[^a-zA-Z0-9]/).test(symbol) ? '-' : symbol).join('');
  return `${nameResult}.html`;
};

export const savePage = (url, destination) => {
  const doesDirectoryExist = (destination) => {
    return fsp.access(destination).then(() => true).catch(() =>false);
  };

  return getUrlContents(url).
    then((fileContents) => {
      const filename = assembleFileName(url);
      const filePath = `${destination}/${filename}`;
      return doesDirectoryExist(destination)
        .then((directoryExists) => {
          if (!directoryExists) {
            return fsp.mkdir(destination, { recursive: true });
          }})
        .then(() => fsp.writeFile(filePath, fileContents))
        .then(() => filePath)
        .catch((err) => {
          console.log(`Error is ${err}`);
          return Promise.reject(err);
        });
    });
};

// https://ru.hexlet.io/courses
// ru-hexlet-io-courses.html

// ru.hexlet.io/courses
