/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */
import {ContentState} from '../immutable/ContentState';
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  SelectionState,
} from '../immutable/SelectionState';
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import applyEntityToContentBlock from './applyEntityToContentBlock';
import {
  makeBlockMapIndex,
  BlockMapIndex,
  mergeMapUpdates,
  BlockMap,
} from '../immutable/BlockMap';
import {BlockNode} from '../immutable/BlockNode';

function updateNewBlocksWithEntity(
  blockMap: BlockMap,
  blockMapIndex: BlockMapIndex,
  newBlocks: Record<string, BlockNode>,
  selectionState: SelectionState,
  entityKey: string | null,
): void {
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  let blockKey: string | null = startKey;
  while (blockKey) {
    const block = newBlocks[blockKey] || blockMap.get(blockKey);
    const sliceStart = blockKey === startKey ? startOffset : 0;
    const sliceEnd = blockKey === endKey ? endOffset : block.text.length;
    newBlocks[blockKey] = applyEntityToContentBlock(
      block,
      sliceStart,
      sliceEnd,
      entityKey,
    );
    if (blockKey === endKey) {
      return;
    }
    blockKey = blockMapIndex[blockKey];
  }
}

export default function applyEntityToContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  entityKey: string | null,
): ContentState {
  const blockMap = contentState.blockMap;
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  const iter = map(
    flatten<[string, BlockNode]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([blockKey, block]): [string, BlockNode] => {
      const sliceStart = blockKey === startKey ? startOffset : 0;
      const sliceEnd = blockKey === endKey ? endOffset : block.text.length;
      return [
        blockKey,
        applyEntityToContentBlock(block, sliceStart, sliceEnd, entityKey),
      ];
    },
  );

  const newBlocks: Record<string, BlockNode> = {};
  for (const [key, block] of iter) {
    newBlocks[key] = block;
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, newBlocks),
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  };
}

export function applyEntitiesToContentState(
  contentState: ContentState,
  entities: Iterable<[SelectionState, string | null]>,
): ContentState {
  const blockMap = contentState.blockMap;
  const blockMapIndex = makeBlockMapIndex(blockMap);
  const newBlocks: Record<string, BlockNode> = {};
  let lastSelectionState: SelectionState | undefined;
  for (const [selectionState, entityKey] of entities) {
    updateNewBlocksWithEntity(
      blockMap,
      blockMapIndex,
      newBlocks,
      selectionState,
      entityKey,
    );
    lastSelectionState = selectionState;
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, newBlocks),
    ...(lastSelectionState
      ? {
          selectionBefore: lastSelectionState,
          selectionAfter: lastSelectionState,
        }
      : {}),
  };
}
