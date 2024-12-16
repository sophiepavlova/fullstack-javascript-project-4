import fs from 'fs';
import fsp from 'fs/promises';

import axios from 'axios';
import * as cheerio from 'cheerio';

import getUrlContents from './fetch-utils.js';
import {
  getSanitizedFileName, createHtmlFileName, ensureDirectoryExists, updateHtmlLinks
} from './utils.js';

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  },
});

export const createResourcesFolder = (url, outputDirectory) => {
  const baseName = getSanitizedFileName(url);
  const resourcesFolderName = `${baseName}_files`; // Appending `_files` for resources
  const resourcesDirectory = `${outputDirectory}/${resourcesFolderName}`;

  // Create the resources directory
  return ensureDirectoryExists(resourcesDirectory)
    .then(() => {
      console.log('Resources folder created at:', resourcesDirectory);
      return resourcesDirectory; // Return the path of the created directory
    })
    .catch((err) => {
      console.error(`Failed to create resources folder: ${err.message}`);
      return Promise.reject(err);
    });
};

export const savePage = (url, outputDirectory) => {
  const htmlFileName = createHtmlFileName(url);
  const htmlFilePath = `${outputDirectory}/${htmlFileName}`;

  return ensureDirectoryExists(outputDirectory)
    .then(() => createResourcesFolder(url, outputDirectory))
    .then(() => getUrlContents(url))
    .then((fileHtmlContents) => {
      return fsp.writeFile(htmlFilePath, fileHtmlContents)
        .then(() => ({ htmlFilePath, fileHtmlContents }));
    })
    .catch((err) => {
      console.log(`Failed to save page: ${err.message}`);
      return Promise.reject(err);
    });
};

const extractImagesSources = (fileHtmlContents) => {
  const $ = cheerio.load(fileHtmlContents);
  const imgSources = [];
  $('img').each((index, element) => {
    const src = $(element).attr('src');
    if (src) {
      imgSources.push(src);
    }
  });
  console.log('Found images sources:', imgSources.length);
  return imgSources;
};

export const handleImagesInHtml= (fileHtmlContents, resourcesDirectory, htmlFilePath) => {
  const imgSources = extractImagesSources(fileHtmlContents);

  return downloadImages(imgSources, resourcesDirectory)
    .then((links) => updateHtmlLinks(links, fileHtmlContents))
    .then((updatedHtml) => {
      console.log(`Saving updated HTML to: ${htmlFilePath}`);
      return fsp.writeFile(htmlFilePath, updatedHtml);
    })
    .then(() => htmlFilePath);
};

export const downloadImage = (imgUrl, resourcesDirectory) => {
  const fileName = getSanitizedFileName(imgUrl);
  const filePath = `${resourcesDirectory}/${fileName}`;
  console.log(`Preparing to download: ${imgUrl} to ${filePath}`);

  return axiosInstance({
    method: 'get',
    url: imgUrl,
    responseType: 'stream',
  })
    .then((response) => {
      console.log(`Downloading image: ${imgUrl}`);
      const writer = fs.createWriteStream(filePath);

      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => {
          console.log(`Image saved: ${filePath}`);
          resolve({ imgUrl, filePath });
        });
        writer.on('error', (err) => {
          console.error(`Error saving image to ${filePath}: ${err.message}`);
          reject(err);
        });
      });
    });
};

export const downloadImages = (imgUrls, resourcesDirectory) => {
  const imageDownloadPromises = imgUrls.map((imgUrl) =>
    downloadImage(imgUrl, resourcesDirectory)
  );

  return Promise.all(imageDownloadPromises)
    .then((results) => {
      const resourcesLinks = {};
      results.forEach(({ imgUrl, filePath }) => {
        resourcesLinks[imgUrl] = filePath;
        console.log(`Mapped ${imgUrl} -> ${filePath}`);
      });
      return resourcesLinks;
    })
    .catch((err) => {
      console.error(`Error downloading the image: ${err.message}`);
    });
};

