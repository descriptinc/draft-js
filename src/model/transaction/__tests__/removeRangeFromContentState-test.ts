/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import getSampleStateForTesting from '../getSampleStateForTesting';
import {SelectionState} from '../../immutable/SelectionState';
import removeRangeFromContentState from '../removeRangeFromContentState';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';
import {getFirstBlock} from '../../immutable/ContentState';
import {takeNth} from '../../descript/Iterables';

const {contentState, selectionState} = getSampleStateForTesting();

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
