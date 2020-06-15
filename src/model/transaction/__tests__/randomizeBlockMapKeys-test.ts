/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @flow strict-local
 * @format
 */

import randomizeBlockMapKeys from '../randomizeBlockMapKeys';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';
import {BlockNodeRecord} from '../../immutable/BlockNodeRecord';
import {makeContentBlock} from '../../immutable/ContentBlock';
import {makeContentBlockNode} from '../../immutable/ContentBlockNode';

jest.mock('../../keys/generateRandomKey');

const assertRandomizeBlockMapKeys = (blockMapArray: BlockNodeRecord[]) => {
  expect(
    blockMapToJsonArray(randomizeBlockMapKeys(createFromArray(blockMapArray))),
  ).toMatchSnapshot();
};

beforeEach(() => {
  jest.resetModules();
});

test('must be able to randomize keys for ContentBlocks BlockMap', () => {
  assertRandomizeBlockMapKeys([
    makeContentBlock({
      key: 'A',
      text: 'Alpha',
    }),
    makeContentBlock({
      key: 'B',
      text: 'Beta',
    }),
    makeContentBlock({
      key: 'C',
      text: 'Charlie',
    }),
    makeContentBlock({
      key: 'D',
      text: 'Delta',
    }),
  ]);
});

test.skip('must be able to randomize keys for ContentBlockNodes BlockMap and update reference links to the new keys', () => {
  assertRandomizeBlockMapKeys([
    makeContentBlockNode({
      key: 'A',
      text: '',
      children: ['B', 'D'],
    }),
    makeContentBlockNode({
      key: 'B',
      parent: 'A',
      children: ['C'],
      nextSibling: 'D',
      text: '',
    }),
    makeContentBlockNode({
      key: 'C',
      parent: 'B',
      text: 'X',
    }),
    makeContentBlockNode({
      key: 'D',
      parent: 'A',
      prevSibling: 'B',
      text: 'Y',
    }),
  ]);
});

/**
 * This could occur when extracting a fragment from a partial selection
 * the bellow case could happen when selecting blocks D to G from blockMap like:
 *
 *
 * A
 *   B
 *     C
 *       D - Delta
 *   E
 *     F - Fire
 *   g - gorilla
 *
 *
 * Selected (D to G) - Expected outcome:
 *
 * => We should remove all parent links from the orphan blocks then they should be treated as root nodes
 * making sure that next/pre links are amended accordingly
 */
test.skip('must be able to randomize keys for ContentBlockNodes BlockMap and make orphan blocks become root blocks', () => {
  assertRandomizeBlockMapKeys([
    makeContentBlockNode({
      key: 'D',
      parent: 'C',
      text: 'Delta',
    }),
    makeContentBlockNode({
      key: 'E',
      parent: 'A',
      prevSibling: 'B',
      nextSibling: 'G',
      children: ['F'],
    }),
    makeContentBlockNode({
      key: 'F',
      parent: 'E',
      text: 'Fire',
    }),
    makeContentBlockNode({
      key: 'G',
      parent: 'A',
      prevSibling: 'E',
      text: 'Gorilla',
    }),
  ]);
});
