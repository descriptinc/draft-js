/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */
import isElement from './isElement';

export default function isHTMLImageElement(
  node?: Node,
): node is HTMLImageElement {
  if (!node || !node.ownerDocument) {
    return false;
  }
  return isElement(node) && node.nodeName === 'IMG';
}
