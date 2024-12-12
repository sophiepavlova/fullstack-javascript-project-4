import fs from 'fs';
import fsp from 'fs/promises';

import * as utils from './utils.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

import getUrlContents from './fetch-utils.js';

// let filePath;

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  },
});

export const getBarePathName = (url) => {
  const fileExtension = extractFileExtension(url);
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  const nameWithoutProtocol = url.replace(/^https?:\/\//, '');

  if (validExtensions.includes(fileExtension.toLowerCase())) {
    const baseName = nameWithoutProtocol.slice(0, -fileExtension.length);
    const transformedBaseName = baseName.split('').map((symbol) =>
      (/[^a-zA-Z0-9]/).test(symbol) ? '-' : symbol
    ).join('');
    return `${transformedBaseName}${fileExtension}`;
  }

  return nameWithoutProtocol.split('').map((symbol) =>
    (/[^a-zA-Z0-9]/).test(symbol) ? '-' : symbol
  ).join('');
};

const extractFileExtension = (url) => {
  const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
  return match ? `.${match[1]}` : '';
};

export const assembleFileName = (url) => {
  const nameResult = getBarePathName(url);
  return `${nameResult}.html`;
};

const ensureDirectoryExist = (destination) => fsp.mkdir(destination, {recursive: true});

export const createResoursesFolder = (url, destination) => {
  const folderName = `${getBarePathName(url)}_files`;
  console.log(`Folder name: ${folderName}`);
  const pathForResourses = `${destination}/${folderName}`;
  console.log(`pathForResourses: ${pathForResourses}`);
  return ensureDirectoryExist(destination)
    .then(() => fsp.mkdir(pathForResourses, {recursive: true}))
    .then(() => {
      console.log('Creating resources folder at:', pathForResourses);
      return pathForResourses;
    })
    .catch((err) => {
      console.error(`Failed to create directory: ${err.message}`);;
      return Promise.reject(err);
    });
};

export const savePage = (url, destination) => {
  const filename = assembleFileName(url);
  const filePath = `${destination}/${filename}`;

  return ensureDirectoryExist(destination)
    .then(() => createResoursesFolder(url, destination))
    .then(() => getUrlContents(url))
    .then((fileContents) => {
      return fsp.writeFile(filePath, fileContents)
        .then(() => ({ filePath, fileContents }));
    })
    .catch((err) => {
      console.log(`Failed to save page: ${err.message}`);
      return Promise.reject(err);
    });
};

export const processImages = (fileContents, resourceFolder, filePath) => {
  const $ = cheerio.load(fileContents);
  const imgTags = [];
  $('img').each((index, element) => {
    const src = $(element).attr('src');
    if (src) {
      imgTags.push(src);
    }
  });
  // console.log(imgTags);
  console.log('found images:', imgTags.length);

  return downloadImages(imgTags, resourceFolder)
    .then((links) => updateHtmlLinks(links, fileContents))
    .then((updatedHtml) => {
      console.log(`Saving updated HTML to: ${filePath}`);
      return fsp.writeFile(filePath, updatedHtml);
    // return updateHtml;
    })
    .then(() => filePath);
};

const updateHtmlLinks = (links, fileContents) => {
  const $ = cheerio.load(fileContents);
  $('img').each((index, element) => {
    const currentSrc = $(element).attr('src');
    if(Object.prototype.hasOwnProperty.call(links, currentSrc)) {
      $(element).attr('src', links[currentSrc]);
    }
  });

  return $.html();
};

export const downloadImages = (imgUrls, resourceFolder) => {
  const links = {};
  const downloadPromises = imgUrls.map((imgUrl) => {
    const barePath = getBarePathName(imgUrl);
    const fullPath = `${resourceFolder}/${barePath}`;
    console.log(`Preparing to download: ${imgUrl} to ${fullPath}`);

    return axiosInstance({
      method: 'get',
      url: imgUrl,
      responseType: 'stream',
    })
      .then((response) => {
        console.log(`Downloading image: ${imgUrl}`);
        const writer = fs.createWriteStream(fullPath);

        // Return a new promise to handle the completion of the stream
        return new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on('finish', () => {
            console.log(`Image saved: ${fullPath}`);
            resolve({ fullPath, imgUrl });
          });
          writer.on('error', (err) => {
            console.error(`Error saving image to ${fullPath}: ${err.message}`);
            reject(err);
          });
        });
      })
      .then(({fullPath, imgUrl}) => {
        links[imgUrl] = fullPath;
        console.log(`Added to links: ${imgUrl} -> ${fullPath}`);
      })
      .catch((err) => {
        console.error(`Error downloading image ${imgUrl}: ${err.message}`);
        return Promise.reject(err);
      });
  });

  return Promise.all(downloadPromises)
    .then(() => links)
    .catch((err) => {
      console.error(`Error downloading images: ${err.message}`);
      return Promise.reject(err);
    });
};

// https://ru.hexlet.io/courses
// ru-hexlet-io-courses.html

// ru.hexlet.io/courses
