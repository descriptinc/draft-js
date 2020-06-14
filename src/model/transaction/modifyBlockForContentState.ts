/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {ContentState} from '../immutable/ContentState';
import {
  getEndKey,
  getStartKey,
  SelectionState,
} from '../immutable/SelectionState';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import {mergeMapUpdates} from '../immutable/BlockMap';

export default function modifyBlockForContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  operation: (block: BlockNodeRecord) => BlockNodeRecord,
): ContentState {
  const startKey = getStartKey(selectionState);
  const endKey = getEndKey(selectionState);
  const blockMap = contentState.blockMap;

  const iter: Iterable<[string, BlockNodeRecord]> = map(
    flatten<[string, BlockNodeRecord]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([k, block]: [string, BlockNodeRecord]): [string, BlockNodeRecord] => [
      k,
      operation(block),
    ],
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
