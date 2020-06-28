/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import UnicodeUtils from 'fbjs/lib/UnicodeUtils';
import {DraftInlineStyle} from '../immutable/DraftInlineStyle';
import {findRangesImmutable} from '../immutable/findRangesImmutable';
import {flatten, map} from '../descript/Iterables';
import {BlockNode} from '../immutable/BlockNode';

const areEqual = (a, b) => a === b;
const isTruthy = a => !!a;
const EMPTY_ARRAY = [];

export type InlineStyleRange = {
  style: string;
  offset: number;
  length: number;
};

/**
 * Helper function for getting encoded styles for each inline style. Convert
 * to UTF-8 character counts for storage.
 */
function getEncodedInlinesForType(
  block: BlockNode,
  styleList: DraftInlineStyle[],
  styleToEncode: string,
): InlineStyleRange[] {
  const ranges: InlineStyleRange[] = [];

  // Obtain an array with ranges for only the specified style.
  const filteredInlines = styleList.map(style => style.has(styleToEncode));

  findRangesImmutable(
    filteredInlines,
    areEqual,
    // We only want to keep ranges with nonzero style values.
    isTruthy,
    (start, end) => {
      const text = block.text;
      ranges.push({
        offset: UnicodeUtils.strlen(text.slice(0, start)),
        length: UnicodeUtils.strlen(text.slice(start, end)),
        style: styleToEncode,
      });
    },
  );

  return ranges;
}

/*
 * Retrieve the encoded arrays of inline styles, with each individual style
 * treated separately.
 */
export default function encodeInlineStyleRanges(
  block: BlockNode,
): InlineStyleRange[] {
  const styleList = block.characterList.map(c => c.style);
  const ranges = Array.from(
    map(new Set<string>(flatten(styleList)), style =>
      getEncodedInlinesForType(block, styleList, style),
    ),
  );

  return Array.prototype.concat.apply(EMPTY_ARRAY, ranges);
}
