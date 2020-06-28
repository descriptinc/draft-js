/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import randomizeBlockMapKeys from '../randomizeBlockMapKeys';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';
import {makeContentBlock} from '../../immutable/ContentBlock';
import {BlockNode} from '../../immutable/BlockNode';

jest.mock('../../keys/generateRandomKey');

const assertRandomizeBlockMapKeys = (blockMapArray: BlockNode[]) => {
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
