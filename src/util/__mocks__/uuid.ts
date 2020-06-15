/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 */

let counter = 0;

export default function uuid(): string {
  return '' + ++counter;
}

export function resetUuids(): void {
  counter = 0;
}
