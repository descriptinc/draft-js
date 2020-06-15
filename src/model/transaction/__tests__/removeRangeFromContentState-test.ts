/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import getSampleStateForTesting from '../getSampleStateForTesting';
import {makeContentBlockNode} from '../../immutable/ContentBlockNode';
import {
  makeEmptySelection,
  SelectionState,
} from '../../immutable/SelectionState';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import removeRangeFromContentState from '../removeRangeFromContentState';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';
import {getFirstBlock} from '../../immutable/ContentState';
import {takeNth} from '../../descript/Iterables';

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
];
const treeSelectionState = makeEmptySelection('A');
const treeContentState = {
  ...contentState,
  blockMap: createFromArray(contentBlockNodes),
};

const assertRemoveRangeFromContentState = (
  selection: SelectionState,
  content = contentState,
) => {
  expect(
    blockMapToJsonObject(
      removeRangeFromContentState(content, selection).blockMap,
    ),
  ).toMatchSnapshot();
};

const initialBlock = getFirstBlock(contentState);
const secondBlock = takeNth(contentState.blockMap.values(), 1)!;
const selectionWithinA = {...selectionState, anchorOffset: 3};
const selectionFromEndOfA = {
  ...selectionState,
  anchorOffset: initialBlock.text.length,
  focusOffset: initialBlock.text.length,
};

test('must return the input ContentState if selection is collapsed', () => {
  assertRemoveRangeFromContentState(selectionState);
});

test('must remove from the beginning of the block', () => {
  // Remove from 0 to 3.
  assertRemoveRangeFromContentState({...selectionState, focusOffset: 3});
});

test('must remove from within the block', () => {
  // Remove from 2 to 4.
  assertRemoveRangeFromContentState({
    ...selectionState,
    anchorOffset: 2,
    focusOffset: 4,
  });
});

test('must remove to the end of the block', () => {
  // Remove from 3 to end.
  assertRemoveRangeFromContentState({
    ...selectionState,
    anchorOffset: 3,
    focusOffset: getFirstBlock(contentState).text.length,
  });
});

test('must remove from the start of A to the start of B', () => {
  // Block B is removed. Its contents replace the contents of block A,
  // while the `type` of block A is preserved.
  assertRemoveRangeFromContentState({...selectionState, focusKey: 'b'});
});

test('must remove from the start of A to within B', () => {
  // A slice of block B contents replace the contents of block A,
  // while the `type` of block A is preserved. Block B is removed.
  assertRemoveRangeFromContentState({
    ...selectionState,
    focusKey: 'b',
    focusOffset: 3,
  });
});

test('must remove from the start of A to the end of B', () => {
  // Block A is effectively just emptied out, while block B is removed.
  assertRemoveRangeFromContentState({
    ...selectionState,
    focusKey: 'b',
    focusOffset: secondBlock.text.length,
  });
});

test('must remove from within A to the start of B', () => {
  assertRemoveRangeFromContentState({...selectionWithinA, focusKey: 'b'});
});

test('must remove from within A to within B', () => {
  assertRemoveRangeFromContentState({
    ...selectionWithinA,
    focusKey: 'b',
    focusOffset: 3,
  });
});

test('must remove from within A to the end of B', () => {
  assertRemoveRangeFromContentState({
    ...selectionWithinA,
    focusKey: 'b',
    focusOffset: secondBlock.text.length,
  });
});

test('must remove from the end of A to the start of B', () => {
  assertRemoveRangeFromContentState({
    ...selectionFromEndOfA,
    focusKey: 'b',
    focusOffset: 0,
  });
});

test('must remove from the end of A to within B', () => {
  assertRemoveRangeFromContentState({
    ...selectionFromEndOfA,
    focusKey: 'b',
    focusOffset: 3,
  });
});

test('must remove from the end of A to the end of B', () => {
  assertRemoveRangeFromContentState({
    ...selectionFromEndOfA,
    focusKey: 'b',
    focusOffset: secondBlock.text.length,
  });
});

test('must remove blocks entirely within the selection', () => {
  assertRemoveRangeFromContentState({
    ...selectionState,
    anchorOffset: 3,
    focusKey: 'c',
    focusOffset: 3,
  });
});

test.skip('must remove E and F entirely when selection is from end of D to end of F on nested blocks', () => {
  assertRemoveRangeFromContentState(
    {
      ...treeSelectionState,
      anchorKey: 'D',
      focusKey: 'F',
      anchorOffset: contentBlockNodes[3].text.length,
      focusOffset: contentBlockNodes[5].text.length,
    },
    treeContentState,
  );
});

test.skip('must preserve B and C since E has not been removed', () => {
  assertRemoveRangeFromContentState(
    {
      ...treeSelectionState,
      anchorKey: 'A',
      focusKey: 'D',
      anchorOffset: contentBlockNodes[0].text.length,
      focusOffset: contentBlockNodes[3].text.length,
    },
    treeContentState,
  );
});

test.skip('must remove B and all its children', () => {
  assertRemoveRangeFromContentState(
    {
      ...treeSelectionState,
      anchorKey: 'A',
      focusKey: 'F',
      anchorOffset: contentBlockNodes[0].text.length,
      focusOffset: contentBlockNodes[5].text.length,
    },
    treeContentState,
  );
});

test.skip('must retain B since F has not been removed', () => {
  assertRemoveRangeFromContentState(
    {
      ...treeSelectionState,
      anchorKey: 'A',
      focusKey: 'E',
      anchorOffset: contentBlockNodes[0].text.length,
      focusOffset: contentBlockNodes[4].text.length,
    },
    treeContentState,
  );
});

// Simulates having collapsed selection at start of Elephant and hitting backspace
// We expect Elephant will be merged with previous block, Delta
test.skip('must merge D and E when deleting range from end of D to start of E', () => {
  assertRemoveRangeFromContentState(
    {
      ...treeSelectionState,
      anchorKey: 'D',
      focusKey: 'E',
      anchorOffset: contentBlockNodes[3].text.length, // end of D
      focusOffset: 0, // start of E
    },
    treeContentState,
  );
});
