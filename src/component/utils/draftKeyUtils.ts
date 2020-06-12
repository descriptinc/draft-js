/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Provides utilities for handling draftjs keys.
 *
 * @emails oncall+draft_js
 */

export function notEmptyKey(key: string | undefined | null): key is string {
  return key != null && key != '';
}
