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
import {BlockMap} from './BlockMap';
import {map} from '../descript/Iterables';

export function createFromArray(blocks: Iterable<BlockNodeRecord>): BlockMap {
  return new Map(
    map(blocks, (block): [string, BlockNodeRecord] => [block.key, block]),
  );
}
