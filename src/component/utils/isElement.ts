/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

export default function isElement(node: Node | undefined | null): boolean {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return node.nodeType === Node.ELEMENT_NODE;
}
