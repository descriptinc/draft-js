/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {DraftRange} from './DraftRange';
import {findEntityRanges} from '../immutable/ContentBlock';
import invariant from '../../fbjs/invariant';
import {BlockNode} from '../immutable/BlockNode';

/**
 * Obtain the start and end positions of the range that has the
 * specified entity applied to it.
 *
 * Entity keys are applied only to contiguous stretches of text, so this
 * method searches for the first instance of the entity key and returns
 * the subsequent range.
 */
export default function getRangesForDraftEntity(
  block: BlockNode,
  key: string,
): Array<DraftRange> {
  const ranges: DraftRange[] = [];
  findEntityRanges(
    block,
    c => c.entity === key,
    (start, end) => {
      ranges.push({start, end});
    },
  );

  invariant(!!ranges.length, 'Entity key not found in this range.');

  return ranges;
}
