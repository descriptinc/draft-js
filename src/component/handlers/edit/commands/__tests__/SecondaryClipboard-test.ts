/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import GKX from '../../../../../stubs/gkx';
import getSampleStateForTesting from '../../../../../model/transaction/getSampleStateForTesting';
import {makeContentBlockNode} from '../../../../../model/immutable/ContentBlockNode';
import {
  createWithContent,
  EditorState,
  forceSelection,
} from '../../../../../model/immutable/EditorState';
import {createFromArray} from '../../../../../model/immutable/BlockMapBuilder';
import {makeEmptySelection} from '../../../../../model/immutable/SelectionState';
import SecondaryClipboard from '../SecondaryClipboard';

const origGkx = GKX.gkx;
afterEach(() => {
  GKX.gkx = origGkx;
});
const toggleExperimentalTreeDataSupport = (enabled: boolean) => {
  GKX.gkx = (name: string) => {
    if (name === 'draft_tree_data_support') {
      return enabled;
    }
    return false;
  };
};

// Seems to be important to put this at the top
toggleExperimentalTreeDataSupport(true);

const {contentState} = getSampleStateForTesting();

const contentBlockNodes = [
  makeContentBlockNode({
    key: 'A',
    nextSibling: 'B',
    text: 'Alpha',
    type: 'blockquote',
  }),
  makeContentBlockNode({
    key: 'B',
    prevSibling: 'A',
    nextSibling: 'G',
    type: 'ordered-list-item',
    children: ['C', 'F'],
  }),
  makeContentBlockNode({
    parent: 'B',
    key: 'C',
    nextSibling: 'F',
    type: 'blockquote',
    children: ['D', 'E'],
  }),
  makeContentBlockNode({
    parent: 'C',
    key: 'D',
    nextSibling: 'E',
    type: 'header-two',
    text: 'Delta',
  }),
  makeContentBlockNode({
    parent: 'C',
    key: 'E',
    prevSibling: 'D',
    type: 'unstyled',
    text: 'Elephant',
  }),
  makeContentBlockNode({
    parent: 'B',
    key: 'F',
    prevSibling: 'C',
    type: 'code-block',
    text: 'Fire',
  }),
  makeContentBlockNode({
    key: 'G',
    prevSibling: 'B',
    nextSibling: 'H',
    type: 'ordered-list-item',
    text: 'Gorila',
  }),
  makeContentBlockNode({
    key: 'H',
    prevSibling: 'G',
    nextSibling: 'I',
    text: ' ',
    type: 'atomic',
  }),
  makeContentBlockNode({
    key: 'I',
    prevSibling: 'H',
    text: 'last',
    type: 'unstyled',
  }),
];

const assertCutOperation = (
  operation,
  selection = {},
  content = contentBlockNodes,
) => {
  const result = operation(
    forceSelection(
      createWithContent({...contentState, blockMap: createFromArray(content)}),
      {...makeEmptySelection(content[0].key), ...selection},
    ),
  );
  const expected = result.currentContent.getBlockMap().toJS();

  expect(expected).toMatchSnapshot();
};

test.skip(`in the middle of a block, cut removes the remainder of the block`, () => {
  assertCutOperation(editorState => SecondaryClipboard.cut(editorState), {
    anchorKey: 'E',
    anchorOffset: contentBlockNodes[4].text.length - 2,
    focusKey: 'E',
    focusOffset: contentBlockNodes[4].text.length - 2,
  });
});

test.skip(`at the end of an intermediate block, cut merges with the adjacent content block`, () => {
  assertCutOperation(editorState => SecondaryClipboard.cut(editorState), {
    anchorKey: 'H',
    anchorOffset: contentBlockNodes[7].text.length,
    focusKey: 'H',
    focusOffset: contentBlockNodes[7].text.length,
  });
});

test.skip(`at the end of the last block, cut is a no-op`, () => {
  assertCutOperation(
    (editorState: EditorState) => SecondaryClipboard.cut(editorState),
    {
      anchorKey: 'I',
      anchorOffset: contentBlockNodes[8].text.length,
      focusKey: 'I',
      focusOffset: contentBlockNodes[8].text.length,
    },
  );
});
