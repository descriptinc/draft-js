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
import getDraftEditorSelection from '../getDraftEditorSelection';
import {EditorState} from '../../../model/immutable/EditorState';

let editorState: EditorState;
let root: HTMLDivElement;
let contents: HTMLDivElement;
let blocks: HTMLDivElement[];
let leafs: HTMLSpanElement[];
let leafChildren: HTMLSpanElement[];
let textNodes: Text[];

const resetRootNodeMocks = () => {
  ({
    editorState,
    root,
    contents,
    blocks,
    leafs,
    leafChildren,
    textNodes,
  } = getSampleSelectionMocksForTesting());
};

const assertGetDraftEditorSelection = (getSelectionReturnValue: any) => {
  (document as any).selection = null;
  window.getSelection = jest.fn().mockReturnValueOnce(getSelectionReturnValue);
  const selection = getDraftEditorSelection(editorState, root);
  expect({
    ...selection,
    selectionState: selection.selectionState,
  }).toMatchSnapshot();
};

beforeEach(() => {
  resetRootNodeMocks();
});

/**
 * Test possible selection states for the text editor. This is based on
 * far too many hours of manual testing and bug fixes, and still may not be
 * a completely accurate representation of all subtle and bizarre differences
 * in implementations and APIs across browsers and operating systems.
 *
 * Welcome to the jungle.
 */
test('must find offsets when collapsed at start', () => {
  const textNode = textNodes[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    focusNode: textNode,
    anchorOffset: 0,
    focusOffset: 0,
  });
});

test('must find offsets when collapsed at end', () => {
  const textNode = textNodes[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    focusNode: textNode,
    anchorOffset: textNode.length,
    focusOffset: textNode.length,
  });
});

test('must find offsets for non-collapsed selection', () => {
  const textNode = textNodes[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    anchorOffset: 1,
    focusNode: textNode,
    focusOffset: 6,
  });
});

test('must find offsets for reversed selection', () => {
  const textNode = textNodes[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    anchorOffset: 6,
    focusNode: textNode,
    focusOffset: 1,
  });
});

test('must find offsets for selection on entire text node', () => {
  const textNode = textNodes[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    anchorOffset: 0,
    focusNode: textNode,
    focusOffset: textNode.length,
  });
});

test('starts at head of one node and ends at head of another', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: textNodes[4],
    focusOffset: 0,
  });
});

test('extends from head of one node to end of another', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: textNodes[2],
    focusOffset: textNodes[2].textContent!.length,
  });
});

test('starts within one text node and ends within another block', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 4,
    focusNode: textNodes[4],
    focusOffset: 6,
  });
});

test('is a reversed selection across multiple text nodes', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[4],
    anchorOffset: 4,
    focusNode: textNodes[0],
    focusOffset: 6,
  });
});

// I'm not even certain this is possible, but let's handle it anyway.
test('starts at head of text node, ends at head of leaf child', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: leafChildren[4],
    focusOffset: 0,
  });
});

test('starts at head of text node, ends at end of leaf child', () => {
  const leaf = leafChildren[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('starts within text node, ends at start of leaf child', () => {
  const leaf = leafChildren[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 4,
    focusNode: leaf,
    focusOffset: 0,
  });
});

test('starts within text node, ends at end of leaf child', () => {
  const leaf = leafChildren[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 4,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('is a reversed text-to-leaf-child selection', () => {
  const leaf = leafChildren[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: 0,
    focusNode: textNodes[0],
    focusOffset: 4,
  });
});

test('starts at head of text node, ends at head of leaf span', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: leafs[4],
    focusOffset: 0,
  });
});

test('starts at head of text node, ends at end of leaf span', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('starts within text node, ends at start of leaf span', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 4,
    focusNode: leaf,
    focusOffset: 0,
  });
});

test('starts within text node, ends at end of leaf span', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 4,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('is a reversed text-to-leaf selection', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: 0,
    focusNode: textNodes[0],
    focusOffset: 4,
  });
});

test('is collapsed at start of single span', () => {
  const leaf = leafs[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: 0,
    focusNode: leaf,
    focusOffset: 0,
  });
});

test('is collapsed at end of single span', () => {
  const leaf = leafs[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: leaf.childNodes.length,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('contains an entire leaf', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: 0,
    focusNode: leaf,
    focusOffset: leaf.childNodes.length,
  });
});

test('is reversed on entire leaf', () => {
  const leaf = leafs[4];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leaf,
    anchorOffset: leaf.childNodes.length,
    focusNode: leaf,
    focusOffset: 0,
  });
});

test('from start of one block to start of another', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leafs[0],
    anchorOffset: 0,
    focusNode: leafs[4],
    focusOffset: 0,
  });
});

test('from start of one block to end of other block', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leafs[0],
    anchorOffset: 0,
    focusNode: leafs[4],
    focusOffset: leafs[4].childNodes.length,
  });
});

test('reversed leaf to leaf', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: leafs[4],
    anchorOffset: leafs[4].childNodes.length,
    focusNode: leafs[0],
    focusOffset: 0,
  });
});

test('is collapsed at start at single block', () => {
  const block = blocks[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: block,
    anchorOffset: 0,
    focusNode: block,
    focusOffset: 0,
  });
});

test('is collapsed at end at single block', () => {
  const block = blocks[0];
  const decorators = block.childNodes;
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: block,
    anchorOffset: decorators.length,
    focusNode: block,
    focusOffset: decorators.length,
  });
});

test('is entirely selected', () => {
  const block = blocks[0];
  const decorators = block.childNodes;
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: block,
    anchorOffset: 0,
    focusNode: block,
    focusOffset: decorators.length,
  });
});

/**
 * FF: Triple-clicking a block leads to an entire block being selected,
 * with the first text node as the anchor (0 offset) and the block element
 * as the focus (childNodes.length offset)
 */
test('begins at text node zero, ends at end of block', () => {
  const textNode = textNodes[0];
  const block = blocks[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    anchorOffset: 0,
    focusNode: block,
    focusOffset: block.childNodes.length,
  });
});

// No idea if this is possible.
test('begins within text node, ends at end of block', () => {
  const textNode = textNodes[0];
  const block = blocks[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNode,
    anchorOffset: 5,
    focusNode: block,
    focusOffset: block.childNodes.length,
  });
});

// No idea if this is possible.
test('is reversed from the first case', () => {
  const textNode = textNodes[0];
  const block = blocks[0];
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: block,
    anchorOffset: block.childNodes.length,
    focusNode: textNode,
    focusOffset: 0,
  });
});

test('goes from start of one block to end of other block', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: blocks[0],
    anchorOffset: 0,
    focusNode: blocks[2],
    focusOffset: blocks[2].childNodes.length,
  });
});

test('goes from start of one block to start of other', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: blocks[0],
    anchorOffset: 0,
    focusNode: blocks[2],
    focusOffset: 0,
  });
});

test('goes from end of one to end of other block', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: blocks[0],
    anchorOffset: blocks[0].childNodes.length,
    focusNode: blocks[2],
    focusOffset: blocks[2].childNodes.length,
  });
});

test('goes from within one block to within another block', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: blocks[0],
    anchorOffset: 1,
    focusNode: blocks[2].firstChild!.firstChild,
    focusOffset: 1,
  });
});

test('is the same as above but reversed', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: blocks[2].firstChild!.firstChild,
    anchorOffset: 1,
    focusNode: blocks[0],
    focusOffset: 1,
  });
});

test('is collapsed at the start of the contents', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: contents,
    anchorOffset: 0,
    focusNode: contents,
    focusOffset: 0,
  });
});

test('occupies a single child of the contents', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: contents,
    anchorOffset: 0,
    focusNode: contents,
    focusOffset: 1,
  });
});

test('is collapsed at the end of a child', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: contents,
    anchorOffset: 1,
    focusNode: contents,
    focusOffset: 1,
  });
});

test('is contains multiple children', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: contents,
    anchorOffset: 0,
    focusNode: contents,
    focusOffset: 3,
  });
});

/**
 * In some scenarios, the entire editor may be selected by command-A.
 */
test('is collapsed at start with full selection', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: root,
    anchorOffset: 0,
    focusNode: root,
    focusOffset: 0,
  });
});

test('is collapsed at end with full selection', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: root,
    anchorOffset: root.childNodes.length,
    focusNode: root,
    focusOffset: root.childNodes.length,
  });
});

test('is completely selected', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: root,
    anchorOffset: 0,
    focusNode: root,
    focusOffset: root.childNodes.length,
  });
});

test('is reversed from above', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: root,
    anchorOffset: root.childNodes.length,
    focusNode: root,
    focusOffset: 0,
  });
});

/**
 * A selection possibility that defies logic. In IE11, triple clicking a
 * block leads to the text node being selected as the anchor, and the
 * **entire editor** being selected as the focus. Ludicrous.
 */
test('does the crazy stuff described above', () => {
  assertGetDraftEditorSelection({
    rangeCount: 1,
    anchorNode: textNodes[0],
    anchorOffset: 0,
    focusNode: root,
    focusOffset: root.childNodes.length,
  });
});
