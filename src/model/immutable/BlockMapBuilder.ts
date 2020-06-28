/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {BlockMap} from './BlockMap';
import {map} from '../descript/Iterables';
import {BlockNode} from './BlockNode';

export function createFromArray(blocks: Iterable<BlockNode>): BlockMap {
  return new Map(
    map(blocks, (block): [string, BlockNode] => [block.key, block]),
  );
}
