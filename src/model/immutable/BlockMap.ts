/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {flatMap, flatten} from '../descript/Iterables';
import {BlockNode} from './BlockNode';

export type BlockMap = ReadonlyMap<string, BlockNode>;

export function mergeMapUpdates<T>(
  originalMap: ReadonlyMap<string, T>,
  updates: Record<string, T | null>,
): ReadonlyMap<string, T> {
  if (Object.keys(updates).length === 0) {
    return originalMap;
  }
  let didChange = false;
  const seenKeys = new Set<string>();
  const result: ReadonlyMap<string, T> = new Map(
    flatten([
      flatMap(originalMap, (entry): [string, T] | undefined => {
        const [key, existingBlock] = entry;
        seenKeys.add(key);
        const newBlock = updates[key];
        if (newBlock === null) {
          // remove this block from the map
          didChange = true;
          return undefined;
        }
        if (!newBlock || newBlock === existingBlock) {
          return entry;
        }
        didChange = true;
        return [key, newBlock];
      }),
      flatMap(Object.entries(updates), (entry): [string, T] | undefined => {
        const [key, block] = entry;
        if (!block || seenKeys.has(key)) {
          return undefined;
        }
        didChange = true;
        return [key, block];
      }),
    ]),
  );
  return didChange ? result : originalMap;
}
