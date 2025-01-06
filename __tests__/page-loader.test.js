jest.mock('../src/fetch-utils.js', () => jest.fn());
// jest.mock('../src/page-loader', () => ({
//   extractImagesSources: jest.fn(() => ['/__fixtures__/nodejs.png']),
//   }));

import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import * as cheerio from 'cheerio';
import nock from 'nock';

import getUrlContents from '../src/fetch-utils.js';
import { savePage, createResourcesFolder, handleImagesInHtml, extractImagesSources } from '../src/page-loader';
import { getSanitizedFileName, normalizeHtml, updateHtmlLinks } from '../src/utils.js';

const urlExpectedResult = 'ru-hexlet-io-courses.html';
const url = 'https://ru.hexlet.io/courses';
let userGivenPath;

beforeEach(async () => {
  userGivenPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'path-loader-user'));
  await fsp.mkdir(userGivenPath, { recursive: true });
});

afterEach(async () => {
  await fsp.rm(userGivenPath, { recursive: true, force: true });
  nock.cleanAll(); // Clear all mocked interceptors after each test
  jest.restoreAllMocks();
});

test('getSanitizedFileName returns the correct file name', () => {
  const urlRealResult = getSanitizedFileName(url);
  expect(urlRealResult).toEqual('ru-hexlet-io-courses');
});

test('Verify that the folder for resources is created', async () => {
  const actuallyCreatedFolder = await createResourcesFolder(url, userGivenPath);
  const expectedPath = path.join(userGivenPath, 'ru-hexlet-io-courses_files');
  expect(actuallyCreatedFolder).toEqual(expectedPath);
  const folderExists = await fsp.access(expectedPath).then(() => true).catch(() => false);
  expect(folderExists).toBe(true);
});

test('Verify that savePage saves the fetched content to a specified path and returns the correct path', async () => {
  getUrlContents.mockResolvedValue('mock content');
  const { htmlFilePath, fileHtmlContents } = await savePage(url, userGivenPath);
  const expectedPath = path.join(userGivenPath, urlExpectedResult);

  expect(htmlFilePath).toEqual(expectedPath);
  const content = await fsp.readFile(htmlFilePath, 'utf-8');
  expect(content).toEqual('mock content');
  expect(fileHtmlContents).toEqual('mock content');
});

test('updateHtmlLinks replaces image URLs with correct paths', async () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ru">
      <body>
        <img src="/__fixtures__/nodejs.png" alt="Node.js icon">
      </body>
    </html>
  `;

  const links = {'/__fixtures__/nodejs.png': 'ru-hexlet-io-courses_files/nodejs.png',};

  const updatedHtml = updateHtmlLinks(links, htmlContent);

  expect(updatedHtml).toContain('src="ru-hexlet-io-courses_files/nodejs.png"');
});

test('downloads images and updates HTML', async () => {
  const testUrl = 'http://example.com';
  const baseName = getSanitizedFileName(testUrl);
  const resourcesFolderName = `${baseName}_files`;
  const resourcesDirectory = path.join(userGivenPath, resourcesFolderName);

  // Mock the image download
  nock('http://example.com')
    .get('/nodejs.png')
    .reply(200, 'image content'); // Mocking the image data

  // Create the resources directory before the test
  await fsp.mkdir(resourcesDirectory, { recursive: true });

  // Test function: replace your function call with the actual invocation
  const updatedHtml = await handleImagesInHtml(
    '<img src="http://example.com/nodejs.png" />',
    resourcesFolderName,
    userGivenPath
  );

  const downloadedFilePath = path.join(resourcesDirectory, 'nodejs.png');

  // Assert the image file exists
  const downloadedContent = await fsp.readFile(downloadedFilePath, 'utf-8');
  expect(downloadedContent).toBe('image content'); // Ensure correct file content

  // Assert the HTML has the updated link
  expect(updatedHtml).toContain(`src="${resourcesFolderName}/nodejs.png"`);
});

