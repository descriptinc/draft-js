/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import getSampleStateForTesting from '../getSampleStateForTesting';
import {SelectionState} from '../../immutable/SelectionState';
import splitBlockInContentState from '../splitBlockInContentState';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';
import {getFirstBlock} from '../../immutable/ContentState';

jest.mock('../../keys/generateRandomKey');

const {contentState, selectionState} = getSampleStateForTesting();

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
