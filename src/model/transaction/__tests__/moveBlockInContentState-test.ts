/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {makeContentBlock} from '../../immutable/ContentBlock';
import {makeContentBlockNode} from '../../immutable/ContentBlockNode';
import {DraftInsertionType} from '../../constants/DraftInsertionType';
import {createWithContent} from '../../immutable/EditorState';
import {
  createFromBlockArray,
  getBlockForKey,
} from '../../immutable/ContentState';
import moveBlockInContentState from '../moveBlockInContentState';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';

jest.mock('../../keys/generateRandomKey');

const contentBlocks = [
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
];

const contentBlockNodes = [
  makeContentBlockNode({
    key: 'A',
    text: 'Alpha',
    nextSibling: 'B',
  }),
  makeContentBlockNode({
    key: 'B',
    text: '',
    children: ['C'],
    nextSibling: 'D',
    prevSibling: 'A',
  }),
  makeContentBlockNode({
    key: 'C',
    parent: 'B',
    text: 'Charlie',
  }),
  makeContentBlockNode({
    key: 'D',
    text: '',
    prevSibling: 'B',
    children: ['E'],
  }),
  makeContentBlockNode({
    key: 'E',
    parent: 'D',
    text: 'Elephant',
  }),
];

// doing this filtering to make the snapshot more precise/concise in what we test
const BLOCK_PROPS_BLACKLIST = [
  'characterList',
  'data',
  'depth',
  'text',
  'type',
];

const assertMoveBlockInContentState = (
  blockToBeMovedKey: string,
  targetBlockKey: string,
  insertionMode: DraftInsertionType,
  blocksArray = contentBlocks,
) => {
  const editor = createWithContent(createFromBlockArray(blocksArray));
  const contentState = editor.currentContent;
  const blockToBeMoved = getBlockForKey(contentState, blockToBeMovedKey);
  const targetBlock = getBlockForKey(contentState, targetBlockKey);

  expect(
    blockMapToJsonArray(
      moveBlockInContentState(
        contentState,
        blockToBeMoved,
        targetBlock,
        insertionMode,
      ).blockMap,
    ).map(block =>
      Object.keys(block)
        .filter(prop => BLOCK_PROPS_BLACKLIST.indexOf(prop) === -1)
        .reduce((acc: Record<string, any>, prop) => {
          acc[prop] = block[prop];
          return acc;
        }, {}),
    ),
  ).toMatchSnapshot();
};

test('must be able to move block before other block', () => {
  assertMoveBlockInContentState('C', 'A', 'before');
});

test('must be able to move block after other block', () => {
  assertMoveBlockInContentState('A', 'C', 'after');
});

test.skip('must be able to move nested block before other block', () => {
  assertMoveBlockInContentState('C', 'A', 'before', contentBlockNodes);
});

test.skip('must be able to move block before other nested block', () => {
  assertMoveBlockInContentState('A', 'C', 'before', contentBlockNodes);
});

test.skip('must be able to move nested block after other block', () => {
  assertMoveBlockInContentState('C', 'A', 'after', contentBlockNodes);
});

test.skip('must be able to move block after other nested block', () => {
  assertMoveBlockInContentState('A', 'C', 'after', contentBlockNodes);
});

test.skip('must be able to move block and its children before other block', () => {
  assertMoveBlockInContentState('B', 'A', 'before', contentBlockNodes);
});

test.skip('must be able to move block and its children after other block', () => {
  assertMoveBlockInContentState('D', 'A', 'after', contentBlockNodes);
});

test.skip('must be able to move block and its children before other nested block', () => {
  assertMoveBlockInContentState('D', 'C', 'before', contentBlockNodes);
});

test.skip('must be able to move block and its children after other nested block', () => {
  assertMoveBlockInContentState('B', 'E', 'after', contentBlockNodes);
});
