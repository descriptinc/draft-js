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
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import applyEntityToContentBlock from './applyEntityToContentBlock';
import {mergeMapUpdates} from '../immutable/BlockMap';

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
    flatten<[string, BlockNodeRecord]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([blockKey, block]): [string, BlockNodeRecord] => {
      const sliceStart = blockKey === startKey ? startOffset : 0;
      const sliceEnd = blockKey === endKey ? endOffset : block.text.length;
      return [
        blockKey,
        applyEntityToContentBlock(block, sliceStart, sliceEnd, entityKey),
      ];
    },
  );

  const newBlocks: Record<string, BlockNodeRecord> = {};
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

