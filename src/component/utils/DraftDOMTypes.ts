/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * Types for things in the DOM used in Draft.js. These should eventaully be
 * added to the flow DOM lib itself.
 *
 * @emails oncall+draft_js
 */

// https://developer.mozilla.org/en-US/docs/Web/API/Selection
export type SelectionObject = {
  /**
   * Returns the Node in which the selection begins. Can return null if
   * selection never existed in the document (e.g., an iframe that was
   * never clicked on). */
  anchorNode: Node | null;
  anchorOffset: number;
  focusNode: Node | null;
  focusOffset: number;
  isCollapsed: boolean;
  rangeCount: number;
  type: string;

  removeAllRanges(): void;
  getRangeAt: (index: number) => Range;
  extend?: (node: Node, offset?: number) => void;
  addRange: (range: Range) => void;
  // ...etc. This is a non-exhaustive definition.
};
