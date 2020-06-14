/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {findRangesImmutable} from '../findRangesImmutable';

const returnTrue = () => true;

const SAMPLE_LIST = [1, 1, 1, 1, 1];

const assertFindRangesImmutable = <T>(
  list: T[],
  areEqualFn: (a: T, b: T) => boolean = returnTrue,
  filterFn = returnTrue,
  foundFn = jest.fn(),
) => {
  findRangesImmutable(list, areEqualFn, filterFn, foundFn);
  expect(foundFn.mock.calls).toMatchSnapshot();
};

test('must be a no-op for an empty list', () => {
  assertFindRangesImmutable([]);
});

test('must identify the full list as a single range', () => {
  assertFindRangesImmutable(SAMPLE_LIST);
});

test('must properly use `areEqualFn`', () => {
  // never equal
  assertFindRangesImmutable(SAMPLE_LIST, () => false);
});

test('must properly use `filterFn`', () => {
  // never an accepted filter result
  assertFindRangesImmutable(SAMPLE_LIST, returnTrue, () => false);
});

test('must identify each range', () => {
  assertFindRangesImmutable(
    [0, 0, 1, 1, 0, 0, 2, 2],
    (a: number, b: number) => a === b,
    returnTrue,
  );
});
