/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

export default function getWindowForNode(node: Node | null): any {
  if (!node || !node.ownerDocument || !node.ownerDocument.defaultView) {
    return window;
  }
  return node.ownerDocument.defaultView;
}
