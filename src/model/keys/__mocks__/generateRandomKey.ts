/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

let count = 0;
export default function generateRandomKey() {
  return `key${count++}`;
}

export function resetRandomKeys() {
  count = 0;
}
