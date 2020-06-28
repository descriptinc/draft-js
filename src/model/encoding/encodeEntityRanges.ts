/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import UnicodeUtils from 'fbjs/lib/UnicodeUtils';
import {findEntityRanges, getEntityAt} from '../immutable/ContentBlock';
import DraftStringKey from './DraftStringKey';
import {BlockNode} from '../immutable/BlockNode';

const {strlen} = UnicodeUtils;

export type EntityRange = {
  key: number;
  offset: number;
  length: number;
};

/**
 * Convert to UTF-8 character counts for storage.
 */
export default function encodeEntityRanges(
  block: BlockNode,
  storageMap: Record<string, number | string>,
): EntityRange[] {
  const encoded: EntityRange[] = [];
  findEntityRanges(
    block,
    character => !!character.entity,
    (/*number*/ start, /*number*/ end) => {
      const text = block.text;
      const key = getEntityAt(block, start);
      encoded.push({
        offset: strlen(text.slice(0, start)),
        length: strlen(text.slice(start, end)),
        // Encode the key as a number for range storage.
        key: Number(storageMap[DraftStringKey.stringify(key)]),
      });
    },
  );
  return encoded;
}
