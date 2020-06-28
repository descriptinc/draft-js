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
import {acceptSelection, createWithContent} from '../../immutable/EditorState';
import {createFromBlockArray} from '../../immutable/ContentState';
import {makeSelectionState} from '../../immutable/SelectionState';
import getContentStateFragment from '../getContentStateFragment';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';
import {BlockNode} from '../../immutable/BlockNode';

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

const DEFAULT_SELECTION = {
  anchorKey: 'A',
  anchorOffset: 0,
  focusKey: 'D',
  focusOffset: 0,
  isBackward: false,
};

const assertGetContentStateFragment = (
  blocksArray: BlockNode[],
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

test('must be able to return first ContentBlock selected', () => {
  assertGetContentStateFragment(contentBlocks, {
    anchorKey: 'A',
    focusKey: 'A',
    focusOffset: contentBlocks[0].text.length,
  });
});

test('must be able to return last ContentBlock selected', () => {
  assertGetContentStateFragment(contentBlocks, {
    anchorKey: 'D',
    focusKey: 'D',
    focusOffset: contentBlocks[3].text.length,
  });
});
