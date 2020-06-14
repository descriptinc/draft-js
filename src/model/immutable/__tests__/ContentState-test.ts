/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {
  createEntity,
  getBlockAfter,
  getBlockBefore,
  getBlockForKey,
  getEntity,
  getLastCreatedEntityKey,
  hasText,
  makeContentState,
  mergeEntityData,
  replaceEntityData,
} from '../ContentState';
import {createFromArray} from '../BlockMapBuilder';
import {ContentBlock, makeContentBlock} from '../ContentBlock';

jest.mock('../SelectionState');

const SINGLE_BLOCK = [{text: 'Lorem ipsum', key: 'a'}];
const MULTI_BLOCK = [
  {text: 'Four score', key: 'b'},
  {text: 'and seven', key: 'c'},
];
const ZERO_WIDTH_CHAR_BLOCK = [{text: unescape('%u200B%u200B'), key: 'a'}];

const createLink = () => {
  return createEntity('LINK', 'MUTABLE', {uri: 'zombo.com'});
};

const getSample = (textBlocks: Partial<ContentBlock>[]) => {
  const contentBlocks = textBlocks.map(block => makeContentBlock(block));
  const blockMap = createFromArray(contentBlocks);
  return makeContentState({
    blockMap,
  });
};

beforeEach(() => {
  jest.resetModules();
});

test('key fetching must succeed or fail properly', () => {
  const singleBlock = getSample(SINGLE_BLOCK);
  const key = SINGLE_BLOCK[0].key;
  const multiBlock = getSample(MULTI_BLOCK);
  const firstKey = MULTI_BLOCK[0].key;
  const secondKey = MULTI_BLOCK[1].key;

  expect(getBlockAfter(singleBlock, key)?.key).toMatchSnapshot();
  expect(getBlockBefore(singleBlock, key)?.key).toMatchSnapshot();
  expect(getBlockAfter(singleBlock, key)?.key).toMatchSnapshot();

  expect(getBlockBefore(multiBlock, firstKey)?.key).toMatchSnapshot();
  expect(getBlockAfter(multiBlock, firstKey)?.key).toMatchSnapshot();
  expect(getBlockBefore(multiBlock, secondKey)?.key).toMatchSnapshot();
  expect(getBlockAfter(multiBlock, secondKey)?.key).toMatchSnapshot();
});

test('block fetching must retrieve or fail fetching block for key', () => {
  const state = getSample(SINGLE_BLOCK);
  const block = getBlockForKey(state, 'a');

  expect(block !== undefined).toMatchSnapshot();
  expect(block.text).toMatchSnapshot();
  expect(() => getBlockForKey(state, 'x')).toThrowError();
});

test('must not include zero width chars for has text', () => {
  expect(hasText(getSample(ZERO_WIDTH_CHAR_BLOCK))).toMatchSnapshot();
  expect(hasText(getSample(SINGLE_BLOCK))).toMatchSnapshot();
  expect(hasText(getSample(MULTI_BLOCK))).toMatchSnapshot();
});

test('must create entities instances', () => {
  createLink();
  expect(typeof getLastCreatedEntityKey()).toMatchSnapshot();
});

test('must retrieve an entities instance given a key', () => {
  const retrieved = getEntity(getLastCreatedEntityKey());
  expect(retrieved).toMatchSnapshot();
});

test('must throw when retrieving entities for an invalid key', () => {
  createLink();
  expect(() => getEntity('asdfzxcvqweriuop')).toThrow();
});

test('must merge entities data', () => {
  createLink();
  const key = getLastCreatedEntityKey();

  // Merge new property.
  mergeEntityData(key, {foo: 'bar'});
  const updatedEntity = getEntity(key);

  // Replace existing property.
  mergeEntityData(key, {uri: 'homestarrunner.com'});
  const entityWithNewURI = getEntity(key);

  expect(updatedEntity.data).toMatchSnapshot();
  expect(entityWithNewURI.data).toMatchSnapshot();
});

test('must replace entities data', () => {
  createLink();
  const key = getLastCreatedEntityKey();

  replaceEntityData(key, {
    uri: 'something.com',
    newProp: 'baz',
  });
  const entityWithReplacedData = getEntity(key);

  expect(entityWithReplacedData.data).toMatchSnapshot();
});
