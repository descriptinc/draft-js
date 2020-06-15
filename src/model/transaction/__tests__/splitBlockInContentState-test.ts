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

import getSampleStateForTesting from '../getSampleStateForTesting';
import {makeContentBlockNode} from '../../immutable/ContentBlockNode';
import {
  makeEmptySelection,
  SelectionState,
} from '../../immutable/SelectionState';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import splitBlockInContentState from '../splitBlockInContentState';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';
import {getFirstBlock} from '../../immutable/ContentState';

jest.mock('../../keys/generateRandomKey');

const {contentState, selectionState} = getSampleStateForTesting();

const contentBlockNodes = [
  makeContentBlockNode({
    key: 'A',
    nextSibling: 'B',
    text: 'Alpha',
  }),
  makeContentBlockNode({
    key: 'B',
    prevSibling: 'A',
    nextSibling: 'G',
    children: ['C', 'F'],
  }),
  makeContentBlockNode({
    parent: 'B',
    key: 'C',
    nextSibling: 'F',
    children: ['D', 'E'],
  }),
  makeContentBlockNode({
    parent: 'C',
    key: 'D',
    nextSibling: 'E',
    text: 'Delta',
  }),
  makeContentBlockNode({
    parent: 'C',
    key: 'E',
    prevSibling: 'D',
    text: 'Elephant',
  }),
  makeContentBlockNode({
    parent: 'B',
    key: 'F',
    prevSibling: 'C',
    text: 'Fire',
  }),
  makeContentBlockNode({
    key: 'G',
    prevSibling: 'B',
    text: 'Gorila',
  }),
  makeContentBlockNode({
    key: 'H',
    prevSibling: 'G',
    text: '',
    type: 'unordered-list-item',
  }),
];
const treeSelectionState = makeEmptySelection('A');
const treeContentState = {
  ...contentState,
  blockMap: createFromArray(contentBlockNodes),
};

const assertSplitBlockInContentState = (
  selection: SelectionState,
  content = contentState,
) => {
  expect(
    blockMapToJsonArray(splitBlockInContentState(content, selection).blockMap),
  ).toMatchSnapshot();
};

test('must be restricted to collapsed selections', () => {
  expect(() => {
    const nonCollapsed = {...selectionState, focusOffset: 1};
    return splitBlockInContentState(contentState, nonCollapsed);
  }).toThrow();

  expect(() => {
    return splitBlockInContentState(contentState, selectionState);
  }).not.toThrow();
});

test('must split at the beginning of a block', () => {
  assertSplitBlockInContentState(selectionState);
});

test('must split within a block', () => {
  const SPLIT_OFFSET = 3;

  assertSplitBlockInContentState({
    ...selectionState,
    anchorOffset: SPLIT_OFFSET,
    focusOffset: SPLIT_OFFSET,
  });
});

test('must split at the end of a block', () => {
  const SPLIT_OFFSET = getFirstBlock(contentState).text.length;

  assertSplitBlockInContentState({
    ...selectionState,
    anchorOffset: SPLIT_OFFSET,
    focusOffset: SPLIT_OFFSET,
  });
});

test.skip('must be restricted to collapsed selections for ContentBlocks', () => {
  expect(() => {
    const nonCollapsed = {...treeSelectionState, focusOffset: 1};
    return splitBlockInContentState(treeContentState, nonCollapsed);
  }).toThrow();

  expect(() => {
    return splitBlockInContentState(treeContentState, treeSelectionState);
  }).not.toThrow();
});

test.skip('must be restricted to ContentBlocks that do not have children', () => {
  expect(() => {
    const invalidSelection = {
      ...treeSelectionState,
      anchorKey: 'B',
      focusKey: 'B',
    };
    return splitBlockInContentState(treeContentState, invalidSelection);
  }).toThrow();
});

test.skip('must split at the beginning of a root ContentBlock', () => {
  assertSplitBlockInContentState(treeSelectionState, treeContentState);
});

test.skip('must split at the beginning of a nested ContentBlock', () => {
  assertSplitBlockInContentState(
    {...treeSelectionState, anchorKey: 'D', focusKey: 'D'},
    treeContentState,
  );
});

test.skip('must split within a root ContentBlock', () => {
  const SPLIT_OFFSET = 3;
  assertSplitBlockInContentState(
    {
      ...treeSelectionState,
      anchorOffset: SPLIT_OFFSET,
      focusOffset: SPLIT_OFFSET,
    },
    treeContentState,
  );
});

test.skip('must split within a nested ContentBlock', () => {
  const SPLIT_OFFSET = 3;
  assertSplitBlockInContentState(
    {
      ...treeSelectionState,
      anchorOffset: SPLIT_OFFSET,
      focusOffset: SPLIT_OFFSET,
      anchorKey: 'E',
      focusKey: 'E',
    },
    treeContentState,
  );
});

test.skip('must split at the end of a root ContentBlock', () => {
  const SPLIT_OFFSET = contentBlockNodes[0].text.length;
  assertSplitBlockInContentState(
    {
      ...treeSelectionState,
      anchorOffset: SPLIT_OFFSET,
      focusOffset: SPLIT_OFFSET,
    },
    treeContentState,
  );
});

test.skip('must split at the end of a nested ContentBlock', () => {
  const SPLIT_OFFSET = contentBlockNodes[3].text.length;
  assertSplitBlockInContentState(
    {
      ...treeSelectionState,
      anchorOffset: SPLIT_OFFSET,
      focusOffset: SPLIT_OFFSET,
      anchorKey: 'D',
      focusKey: 'D',
    },
    treeContentState,
  );
});

test.skip('must convert empty list item ContentBlock to unstyled rather than split', () => {
  assertSplitBlockInContentState(
    {
      ...treeSelectionState,
      anchorOffset: 0,
      focusOffset: 0,
      anchorKey: 'H',
      focusKey: 'H',
    },
    treeContentState,
  );
});
