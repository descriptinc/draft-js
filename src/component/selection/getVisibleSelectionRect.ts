/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import getRangeBoundingClientRect, {
  FakeClientRect,
} from './getRangeBoundingClientRect';

/**
 * Return the bounding ClientRect for the visible DOM selection, if any.
 * In cases where there are no selected ranges or the bounding rect is
 * temporarily invalid, return null.
 *
 * When using from an iframe, you should pass the iframe window object
 */
export default function getVisibleSelectionRect(
  global: any,
): FakeClientRect | null {
  const selection = global.selection;
  if (!selection.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const boundingRect = getRangeBoundingClientRect(range);
  const {top, right, bottom, left} = boundingRect;

  // When a re-render leads to a node being removed, the DOM selection will
  // temporarily be placed on an ancestor node, which leads to an invalid
  // bounding rect. Discard this state.
  if (top === 0 && right === 0 && bottom === 0 && left === 0) {
    return null;
  }

  return boundingRect;
}