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

import type {Seq} from 'immutable';
import {List} from 'immutable';

/**
 * Search through an array to find contiguous stretches of elements that
 * match a specified filter function.
 *
 * When ranges are found, execute a specified `found` function to supply
 * the values to the caller.
 */
function findRangesImmutable<T>(
  haystack: List<T> | Seq<T>,
  areEqualFn: (a: T, b: T) => boolean,
  filterFn: (value: T) => boolean,
  foundFn: (start: number, end: number) => void,
): void {
  if (List.isList(haystack) && !haystack.size) {
    return;
  }

  let cursor: number = 0;
  let count = 0;
  let lastValue: ?T = null;
  haystack.forEach((value: T, index: number) => {
    if (count > 0) {
      if (!areEqualFn(value, lastValue)) {
        if (filterFn(lastValue)) {
          foundFn(cursor, index);
        }
        cursor = index;
      }
    }
    count += 1;
    lastValue = value;
    return true;
  });

  if (count > 0 && filterFn(lastValue)) {
    foundFn(cursor, count);
  }
}

module.exports = findRangesImmutable;
