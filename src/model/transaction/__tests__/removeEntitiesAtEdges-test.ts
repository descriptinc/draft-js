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
import {DraftEntityMutability} from '../../entity/DraftEntityMutability';
import DraftEntity from '../../entity/DraftEntity';
import {DraftEntityInstance} from '../../entity/DraftEntityInstance';
import {SelectionState} from '../../immutable/SelectionState';
import removeEntitiesAtEdges from '../removeEntitiesAtEdges';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';
import {getBlockForKey} from '../../immutable/ContentState';
import applyEntityToContentBlock from '../applyEntityToContentBlock';
import {mergeMapUpdates} from '../../immutable/BlockMap';

const {contentState, selectionState} = getSampleStateForTesting();

const selectionOnEntity = {
  ...selectionState,
  anchorKey: 'b',
  anchorOffset: 2,
  focusKey: 'b',
  focusOffset: 2,
};

const origGet = DraftEntity.__get;
afterEach(() => {
  DraftEntity.__get = origGet;
});
const setEntityMutability = (
  mutability: DraftEntityMutability,
  _ = contentState,
) => {
  DraftEntity.__get = () =>
    ({
      mutability,
    } as DraftEntityInstance);
};

const assertRemoveEntitiesAtEdges = (
  selection: SelectionState,
  mutability: DraftEntityMutability = 'IMMUTABLE',
  content = contentState,
) => {
  setEntityMutability(mutability, content);
  expect(
    blockMapToJsonObject(removeEntitiesAtEdges(content, selection).blockMap),
  ).toMatchSnapshot();
};

test('must not affect blockMap if there are no entities', () => {
  assertRemoveEntitiesAtEdges(selectionState);
});

test('must not remove mutable entities', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'MUTABLE');
});

test('must remove immutable entities', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'IMMUTABLE');
});

test('must remove segmented entities', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity, 'SEGMENTED');
});

test('must not remove if cursor is at start of entity', () => {
  assertRemoveEntitiesAtEdges({
    ...selectionOnEntity,
    anchorOffset: 0,
    focusOffset: 0,
  });
});

test('must remove if cursor is within entity', () => {
  assertRemoveEntitiesAtEdges(selectionOnEntity);
});

test('must not remove if cursor is at end of entity', () => {
  const length = getBlockForKey(contentState, 'b').text.length;
  assertRemoveEntitiesAtEdges({
    ...selectionOnEntity,
    anchorOffset: length,
    focusOffset: length,
  });
});

test('must remove for non-collapsed cursor within a single entity', () => {
  assertRemoveEntitiesAtEdges({...selectionOnEntity, anchorOffset: 1});
});

test('must remove for non-collapsed cursor on multiple entities', () => {
  const block = getBlockForKey(contentState, 'b');
  const newBlock = applyEntityToContentBlock(block, 3, 5, '456');
  const newBlockMap = mergeMapUpdates(contentState.blockMap, {b: newBlock});
  const newContent = {...contentState, blockMap: newBlockMap};

  assertRemoveEntitiesAtEdges(
    {...selectionOnEntity, anchorOffset: 1, focusOffset: 4},
    'IMMUTABLE',
    newContent,
  );
});

test('must ignore an entity that is entirely within the selection', () => {
  const block = getBlockForKey(contentState, 'b');

  // Remove entity from beginning and end of block.
  let newBlock = applyEntityToContentBlock(block, 0, 1, null);
  newBlock = applyEntityToContentBlock(newBlock, 4, 5, null);

  const newBlockMap = mergeMapUpdates(contentState.blockMap, {b: newBlock});
  const newContent = {...contentState, blockMap: newBlockMap};

  assertRemoveEntitiesAtEdges(
    {...selectionOnEntity, anchorOffset: 0, focusOffset: 5},
    'IMMUTABLE',
    newContent,
  );
});

test('must remove entity at start of selection', () => {
  assertRemoveEntitiesAtEdges({
    ...selectionState,
    anchorKey: 'b',
    anchorOffset: 3,
    focusKey: 'c',
    focusOffset: 3,
  });
});

test('must remove entity at end of selection', () => {
  assertRemoveEntitiesAtEdges({
    ...selectionState,
    anchorKey: 'a',
    anchorOffset: 3,
    focusKey: 'b',
    focusOffset: 3,
  });
});

test('must remove entities at both ends of selection', () => {
  const cBlock = getBlockForKey(contentState, 'c');
  const len = cBlock.text.length;
  const modifiedC = applyEntityToContentBlock(cBlock, 0, len, '456');
  const newBlockMap = mergeMapUpdates(contentState.blockMap, {c: modifiedC});
  const newContent = {...contentState, blockMap: newBlockMap};

  assertRemoveEntitiesAtEdges(
    {
      ...selectionState,
      anchorKey: 'b',
      anchorOffset: 3,
      focusKey: 'c',
      focusOffset: 3,
    },
    'IMMUTABLE',
    newContent,
  );
});
