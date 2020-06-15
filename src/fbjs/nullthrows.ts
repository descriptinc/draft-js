/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
export function nullthrows<T>(x: T | null | undefined): T {
  if (x != null) {
    return x;
  }

  throw new Error('Got unexpected null or undefined');
}
