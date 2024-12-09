jest.mock('../src/fetch-utils.js', () => jest.fn());
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { assembleFileName, savePage } from '../src/page-loader';
import getUrlContents from '../src/fetch-utils.js';

const urlExpectedResult = 'ru-hexlet-io-courses.html';
const url = 'https://ru.hexlet.io/courses';
let userGivenPath;

beforeEach(async() => {
  userGivenPath = await fsp.mkdtemp(path.join(os.tmpdir(), 'path-loader-user'));
  await fsp.mkdir(userGivenPath, {recursive: true});
})

afterEach(async() => {
  await fsp.rm(userGivenPath, { recursive: true, force:true });
  jest.restoreAllMocks();
})

test('assemble file name', () => {
  const urlRealResult = assembleFileName(url);
  expect(urlRealResult).toEqual(urlExpectedResult);
});

test('Verify that savePage saves the fetched content to a specified path and returns the correct path', async () => {
  getUrlContents.mockResolvedValue('mock content');
  const resultPath = await savePage(url, userGivenPath);
  const expectedPath = path.join(userGivenPath,urlExpectedResult);
  expect(resultPath).toEqual(expectedPath);
  const content = await fsp.readFile(resultPath, 'utf-8');
  expect(content).toEqual('mock content');
})
