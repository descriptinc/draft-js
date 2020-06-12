/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+draft_js
 */

'use strict';

import {BlockNodeRecord} from './BlockNodeRecord';
import {flatMap, flatten} from '../descript/Iterables';

export type BlockMap = ReadonlyMap<string, BlockNodeRecord>;

// FIXME [mvp]: dealing with order of `updates`

export function mergeBlockMap(
  blockMap: BlockMap,
  updates: Record<string, BlockNodeRecord | null>,
): BlockMap {
  let didChange = false;
  const seenKeys = new Set<string>();
  const result: BlockMap = new Map(
    flatten([
      flatMap(blockMap.entries(), (entry):
        | [string, BlockNodeRecord]
        | undefined => {
        const [key, existingBlock] = entry;
        seenKeys.add(key);
        const newBlock = updates[key];
        if (newBlock === null) {
          // remove this block from the map
          return undefined;
        }
        if (!newBlock || newBlock === existingBlock) {
          return entry;
        }
        didChange = true;
        return [key, newBlock];
      }),
      flatMap(Object.entries(updates), (entry):
        | [string, BlockNodeRecord]
        | undefined => {
        const [key, block] = entry;
        if (!block || seenKeys.has(key)) {
          return undefined;
        }
        didChange = true;
        return [key, block];
      }),
    ]),
  );
  return didChange ? result : blockMap;
}
