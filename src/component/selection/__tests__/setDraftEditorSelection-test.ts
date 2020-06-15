/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import getSampleSelectionMocksForTesting from '../getSampleSelectionMocksForTesting';
import {EditorState} from '../../../model/immutable/EditorState';
import {addFocusToSelection} from '../setDraftEditorSelection';
import {SelectionObject} from '../../utils/DraftDOMTypes';

jest.disableAutomock();

// Based on https://w3c.github.io/selection-api/#selection-interface
class Selection {
  rangeCount: number;
  focusNode: Node | null;
  focusOffset: number;
  range: Range | null;
  constructor({range}: {range?: Range}) {
    this.rangeCount = range ? 1 : 0;
    this.focusNode = (range && range.node) || null;
    this.focusOffset = (range && range.startOffset) || 0;
    this.range = range || null;
  }

  getRangeAt(idx: number) {
    if (idx !== 0 || this.rangeCount <= 0) {
      throw new Error('IndexSizeError');
    }
    return this.range;
  }

  addRange(range: Range) {
    this.range = range;
    this.rangeCount = 1;
  }
}

// Based on https://dom.spec.whatwg.org/#concept-range
class Range {
  startOffset: number;
  endOffset: number;
  node: Node | null;
  constructor({
    startOffset,
    endOffset,
    node,
  }: {
    startOffset: number;
    endOffset: number;
    node: Node | null;
  }) {
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.node = node;
  }

  setEnd(node: Node | null, offset: number) {
    this.endOffset = offset;
    this.node = node;
  }

  cloneRange() {
    return new Range({
      startOffset: this.startOffset,
      endOffset: this.endOffset,
      node: this.node,
    });
  }
}

let editorState: EditorState;
let textNodes: Text[];

const resetRootNodeMocks = () => {
  ({editorState, textNodes} = getSampleSelectionMocksForTesting());
};

beforeEach(() => {
  resetRootNodeMocks();
});

describe('addFocusToSelection', () => {
  test('sets a new focus on the selection if selection.extend is unsupported', () => {
    const range = new Range({
      startOffset: 0,
      endOffset: 0,
      node: textNodes[0],
    });
    const selection = new Selection({range});
    const storedFocusNode = selection.focusNode;
    const storedFocusOffset = 3;
    addFocusToSelection(
      (selection as unknown) as SelectionObject,
      storedFocusNode,
      storedFocusOffset,
      editorState.selection,
    );
    expect(selection).toMatchSnapshot();
  });

  // If rangeCount is 0, selection.getRangeAt() will throw on various browsers
  test('the range is not updated if rangeCount is 0', () => {
    const selection = new Selection({});
    const storedFocusNode = selection.focusNode;
    const storedFocusOffset = 3;
    addFocusToSelection(
      (selection as unknown) as SelectionObject,
      storedFocusNode,
      storedFocusOffset,
      editorState.selection,
    );
    expect(selection).toMatchSnapshot();
  });
});
