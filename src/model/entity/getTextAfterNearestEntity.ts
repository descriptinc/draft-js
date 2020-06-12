/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {getEntityAt} from '../immutable/ContentBlockNode';

/**
 * Find the string of text between the previous entity and the specified
 * offset. This allows us to narrow down search areas for regex matching.
 */
export default function getTextAfterNearestEntity(
  block: BlockNodeRecord,
  offset: number,
): string {
  let start = offset;

  // Get start based on where the last entity ended.
  while (start > 0 && getEntityAt(block, start - 1) === null) {
    start--;
  }

  return block.text.slice(start, offset);
}
