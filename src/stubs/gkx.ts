/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export function gkx(name: string): boolean {
  if (typeof window !== 'undefined' && window.__DRAFT_GKX) {
    return !!window.__DRAFT_GKX[name];
  }
  return false;
}
