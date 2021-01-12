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
import applyEntityToContentState, {
  applyEntitiesToContentState,
} from '../applyEntityToContentState';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';

const {contentState, selectionState} = getSampleStateForTesting();

const initialBlock = getFirstBlock(contentState);
const secondBlock = getBlockAfter(contentState, initialBlock.key)!;
const thirdBlock = getBlockAfter(contentState, secondBlock.key)!;

const selectBlock = makeSelectionState({
  anchorKey: initialBlock.key,
  anchorOffset: 0,
  focusKey: initialBlock.key,
  focusOffset: initialBlock.text.length,
});

const selectAdjacentBlocks = makeSelectionState({
  anchorKey: initialBlock.key,
  anchorOffset: 0,
  focusKey: secondBlock.key,
  focusOffset: secondBlock.text.length,
});

const assertApplyEntityToContentState = (
  entityKey: string | null,
  selection = selectionState,
  content = contentState,
) => {
  expect(
    blockMapToJsonObject(
      applyEntityToContentState(content, selection, entityKey).blockMap,
    ),
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

test('must apply multiple entities to same block', () => {
  const selectionA = makeSelectionState({
    anchorKey: initialBlock.key,
    anchorOffset: 1,
    focusKey: initialBlock.key,
    focusOffset: 2,
  });
  const selectionB = makeSelectionState({
    anchorKey: initialBlock.key,
    anchorOffset: 3,
    focusKey: initialBlock.key,
    focusOffset: 4,
  });
  const blockMap = applyEntitiesToContentState(contentState, [
    [selectionA, 'x'],
    [selectionB, 'y'],
  ]).blockMap;
  expect(blockMap.get(initialBlock.key)).toMatchSnapshot();
});

test('must apply multiple entities to different blocks', () => {
  const selectionA = makeSelectionState({
    anchorKey: initialBlock.key,
    anchorOffset: 1,
    focusKey: initialBlock.key,
    focusOffset: 2,
  });
  const selectionB = makeSelectionState({
    anchorKey: secondBlock.key,
    anchorOffset: 1,
    focusKey: secondBlock.key,
    focusOffset: 3,
  });
  const blockMap = applyEntitiesToContentState(contentState, [
    [selectionA, 'x'],
    [selectionB, 'y'],
  ]).blockMap;
  expect(blockMap.get(initialBlock.key)).toMatchSnapshot();
  expect(blockMap.get(secondBlock.key)).toMatchSnapshot();
});

test('must apply multiple entities across multiple blocks', () => {
  const selectionAcrossSecondThird = makeSelectionState({
    anchorKey: secondBlock.key,
    anchorOffset: secondBlock.text.length - 1,
    focusKey: thirdBlock.key,
    focusOffset: 1,
  });
  const blockMap = applyEntitiesToContentState(contentState, [
    [selectAdjacentBlocks, 'x'],
    [selectionAcrossSecondThird, 'y'],
  ]).blockMap;
  expect(blockMap.get(initialBlock.key)).toMatchSnapshot();
  expect(blockMap.get(secondBlock.key)).toMatchSnapshot();
  expect(blockMap.get(thirdBlock.key)).toMatchSnapshot();
});
