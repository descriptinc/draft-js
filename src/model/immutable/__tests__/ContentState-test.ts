/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {
  getBlockAfter,
  getBlockBefore,
  getBlockForKey,
  hasText,
  makeContentState,
} from '../ContentState';
import {createFromArray} from '../BlockMapBuilder';
import {ContentBlock, makeContentBlock} from '../ContentBlock';
import {addEntity, createEntity, EntityMap, getEntity} from '../EntityMap';

jest.mock('../SelectionState');

const SINGLE_BLOCK = [{text: 'Lorem ipsum', key: 'a'}];
const MULTI_BLOCK = [
  {text: 'Four score', key: 'b'},
  {text: 'and seven', key: 'c'},
];
const ZERO_WIDTH_CHAR_BLOCK = [{text: unescape('%u200B%u200B'), key: 'a'}];

const createLink = (entityMap: EntityMap) => {
  return createEntity(entityMap, 'LINK', 'MUTABLE', {uri: 'zombo.com'});
};

const getSample = (textBlocks: (Partial<ContentBlock> & {key: string})[]) => {
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
  const {entityMap, entityKey} = createLink(new Map());
  expect(getEntity(entityMap, entityKey)).toMatchSnapshot();
});

test('must throw when retrieving entities for an invalid key', () => {
  const {entityMap} = createLink(new Map());
  expect(() => getEntity(entityMap, 'asdfzxcvqweriuop')).toThrow();
});

test('must replace entities data', () => {
  let {entityMap, entityKey} = createLink(new Map());

  entityMap = addEntity(entityMap, entityKey, {
    type: 'LINK',
    mutability: 'MUTABLE',
    data: {
      uri: 'something.com',
      newProp: 'baz',
    }
  });

  const entityWithReplacedData = getEntity(entityMap, entityKey);

  expect(entityWithReplacedData.data).toMatchSnapshot();
});
