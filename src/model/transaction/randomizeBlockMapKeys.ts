/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {BlockMap} from '../immutable/BlockMap';
import {map} from '../descript/Iterables';
import generateRandomKey from '../keys/generateRandomKey';
import {BlockNode} from '../immutable/BlockNode';

export default function randomizeBlockMapKeys(blockMap: BlockMap): BlockMap {
  return new Map(
    map(blockMap, ([, block]): [string, BlockNode] => {
      const key = generateRandomKey();
      return [key, {...block, key}];
    }),
  );
}
