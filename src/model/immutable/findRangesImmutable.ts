/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

/**
 * Search through an iterable to find contiguous stretches of elements that
 * match a specified filter function.
 *
 * When ranges are found, execute a specified `found` function to supply
 * the values to the caller.
 */
export function findRangesImmutable<T>(
  haystack: Iterable<T>,
  areEqualFn: (a: T, b: T) => boolean,
  filterFn: (value: T) => boolean,
  foundFn: (start: number, end: number) => void,
): void {
  if (Array.isArray(haystack) && haystack.length === 0) {
    return;
  }

  let cursor: number = 0;
  let count = 0;
  let lastValue: T | null = null;
  let index = 0;
  for (const value of haystack) {
    if (count > 0) {
      // we know lastValue is defined because count > 0
      if (!areEqualFn(value, lastValue!)) {
        if (filterFn(lastValue!)) {
          foundFn(cursor, index);
        }
        cursor = index;
      }
    }
    count += 1;
    lastValue = value;
    index += 1;
  }

  if (count > 0 && filterFn(lastValue!)) {
    foundFn(cursor, count);
  }
}
