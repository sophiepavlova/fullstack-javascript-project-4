jest.mock('../src/fetch-utils.js', () => jest.fn());
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import * as cheerio from 'cheerio';

import getUrlContents from '../src/fetch-utils.js';
import { savePage, createResourcesFolder, handleImagesInHtml } from '../src/page-loader';
import { getSanitizedFileName, normalizeHtml, updateHtmlLinks } from '../src/utils.js';

const urlExpectedResult = 'ru-hexlet-io-courses.html';
const url = 'https://ru.hexlet.io/courses';
let userGivenPath;

beforeEach(async() => {
  userGivenPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'path-loader-user'));
  await fsp.mkdir(userGivenPath, {recursive: true});
});

afterEach(async() => {
  await fsp.rm(userGivenPath, { recursive: true, force:true });
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

test('handleImagesInHtml downloads images to the resources directory', async () => {
});

