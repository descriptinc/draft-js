/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import getSampleStateForTesting from '../getSampleStateForTesting';
import {makeSelectionState} from '../../immutable/SelectionState';
import {getBlockAfter, getFirstBlock} from '../../immutable/ContentState';
import applyEntityToContentState from '../applyEntityToContentState';

const {contentState, selectionState} = getSampleStateForTesting();

const initialBlock = getFirstBlock(contentState);
const secondBlock = getBlockAfter(contentState, initialBlock.key);

const selectBlock = makeSelectionState({
  anchorKey: initialBlock.key,
  anchorOffset: 0,
  focusKey: initialBlock.key,
  focusOffset: initialBlock.text.length,
});

const selectAdjacentBlocks = makeSelectionState({
  anchorKey: initialBlock.key,
  anchorOffset: 0,
  focusKey: secondBlock?.key,
  focusOffset: secondBlock?.text.length,
});

const assertApplyEntityToContentState = (
  entityKey: string | null,
  selection = selectionState,
  content = contentState,
) => {
  expect(
    applyEntityToContentState(content, selection, entityKey).blockMap,
  ).toMatchSnapshot();
};

test('must apply entity key', () => {
  assertApplyEntityToContentState('x', selectBlock);
});

test('must apply null entity', () => {
  assertApplyEntityToContentState(null, selectBlock);
});

test('must apply entity key accross multiple blocks', () => {
  assertApplyEntityToContentState('x', selectAdjacentBlocks);
});

test('must apply null entity key accross multiple blocks', () => {
  assertApplyEntityToContentState(null, selectAdjacentBlocks);
});
