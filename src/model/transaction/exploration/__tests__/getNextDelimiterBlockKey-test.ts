/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {makeContentBlock} from '../../../immutable/ContentBlock';
import {makeContentBlockNode} from '../../../immutable/ContentBlockNode';
import {createWithContent} from '../../../immutable/EditorState';
import {
  createFromBlockArray,
  getBlockForKey,
} from '../../../immutable/ContentState';
import getNextDelimiterBlockKey from '../getNextDelimiterBlockKey';
import {BlockNodeRecord} from '../../../immutable/BlockNodeRecord';

jest.mock('generateRandomKey');

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
    children: ['E', 'F'],
  }),
  makeContentBlockNode({
    key: 'E',
    parent: 'D',
    nextSibling: 'F',
    text: 'Elephant',
  }),
  makeContentBlockNode({
    key: 'F',
    parent: 'D',
    prevSibling: 'E',
    text: 'Fire',
  }),
];

const assertGetNextDelimiterBlockKey = (
  targetBlockKey: string,
  blocksArray: BlockNodeRecord[] = contentBlockNodes,
) => {
  const editor = createWithContent(createFromBlockArray(blocksArray));
  const contentState = editor.currentContent;
  const targetBlock = getBlockForKey(contentState, targetBlockKey);

  expect(
    getNextDelimiterBlockKey(targetBlock, contentState.blockMap),
  ).toMatchSnapshot();
};

test('must return null when block is ContentBlock', () => {
  assertGetNextDelimiterBlockKey('A', contentBlocks);
});

test('must return null when only blocks after it are its own descendants', () => {
  assertGetNextDelimiterBlockKey('D');
});

test('must return null when block is the last block', () => {
  assertGetNextDelimiterBlockKey('F');
});

test('must find its next sibling when has siblings', () => {
  assertGetNextDelimiterBlockKey('E');
});

test('must find its next delimiter when block does not have siblings', () => {
  assertGetNextDelimiterBlockKey('C');
});
