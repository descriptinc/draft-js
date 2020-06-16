/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {makeContentBlock} from '../../immutable/ContentBlock';
import {makeContentBlockNode} from '../../immutable/ContentBlockNode';
import {acceptSelection, createWithContent} from '../../immutable/EditorState';
import {BlockNodeRecord} from '../../immutable/BlockNodeRecord';
import {createFromBlockArray} from '../../immutable/ContentState';
import {makeSelectionState} from '../../immutable/SelectionState';
import getContentStateFragment from '../getContentStateFragment';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';

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
  makeContentBlock({
    key: 'D',
    text: 'Delta',
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
    text: 'Delta',
    prevSibling: 'B',
  }),
];

const DEFAULT_SELECTION = {
  anchorKey: 'A',
  anchorOffset: 0,
  focusKey: 'D',
  focusOffset: 0,
  isBackward: false,
};

const assertGetContentStateFragment = (
  blocksArray: BlockNodeRecord[],
  selection = {},
) => {
  const editor = acceptSelection(
    createWithContent(createFromBlockArray([...blocksArray])),
    makeSelectionState({
      ...DEFAULT_SELECTION,
      ...selection,
    }),
  );

  expect(
    blockMapToJsonObject(
      getContentStateFragment(editor.currentContent, editor.selection),
    ),
  ).toMatchSnapshot();
};

test('must be able to return all selected contentBlocks', () => {
  assertGetContentStateFragment(contentBlocks, {
    focusOffset: contentBlocks[3].text.length,
  });
});

test.skip('must be able to return all selected contentBlockNodes', () => {
  assertGetContentStateFragment(contentBlockNodes, {
    focusOffset: contentBlockNodes[3].text.length,
  });
});

test('must be able to return contentBlocks selected within', () => {
  assertGetContentStateFragment(contentBlocks, {
    anchorKey: 'B',
    focusKey: 'C',
    focusOffset: contentBlockNodes[2].text.length,
  });
});

test.skip('must be able to return contentBlockNodes selected within', () => {
  assertGetContentStateFragment(contentBlockNodes, {
    anchorKey: 'B',
    focusKey: 'C',
    focusOffset: contentBlockNodes[2].text.length,
  });
});

test('must be able to return first ContentBlock selected', () => {
  assertGetContentStateFragment(contentBlocks, {
    anchorKey: 'A',
    focusKey: 'A',
    focusOffset: contentBlocks[0].text.length,
  });
});

test.skip('must be able to return first ContentBlockNode selected', () => {
  assertGetContentStateFragment(contentBlockNodes, {
    anchorKey: 'A',
    focusKey: 'A',
    focusOffset: contentBlockNodes[0].text.length,
  });
});

test('must be able to return last ContentBlock selected', () => {
  assertGetContentStateFragment(contentBlocks, {
    anchorKey: 'D',
    focusKey: 'D',
    focusOffset: contentBlocks[3].text.length,
  });
});

test.skip('must be able to return last ContentBlockNode selected', () => {
  assertGetContentStateFragment(contentBlockNodes, {
    anchorKey: 'D',
    focusKey: 'D',
    focusOffset: contentBlockNodes[3].text.length,
  });
});
