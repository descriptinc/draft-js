/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

'use strict';

import {ContentState} from '../immutable/ContentState';
import {
  getEndKey,
  getStartKey,
  SelectionState,
} from '../immutable/SelectionState';
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {mergeMapUpdates} from '../immutable/BlockMap';

export default function adjustBlockDepthForContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  adjustment: number,
  maxDepth: number,
): ContentState {
  const startKey = getStartKey(selectionState);
  const endKey = getEndKey(selectionState);
  let blockMap = contentState.blockMap;

  const iter = map(
    flatten<[string, BlockNodeRecord]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([blockKey, block]): [string, BlockNodeRecord] => {
      let depth = block.depth + adjustment;
      depth = Math.max(0, Math.min(depth, maxDepth));
      if (depth === block.depth) {
        return [blockKey, block];
      }
      return [
        blockKey,
        {
          ...block,
          depth,
        },
      ];
    },
  );

  const newBlocks: Record<string, BlockNodeRecord> = {};
  for (const [blockKey, block] of iter) {
    newBlocks[blockKey] = block;
  }

  blockMap = mergeMapUpdates(blockMap, newBlocks);

  return {
    ...contentState,
    blockMap,
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  };
}
