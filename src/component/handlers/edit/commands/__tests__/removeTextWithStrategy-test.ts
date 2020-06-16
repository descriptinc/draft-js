/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 * @flow strict-local
 */

'use strict';

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
import removeTextWithStrategy from '../removeTextWithStrategy';
import moveSelectionForward from '../moveSelectionForward';
import UnicodeUtils from 'fbjs/lib/UnicodeUtils';
import {getBlockForKey} from '../../../../../model/immutable/ContentState';

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

const assertRemoveTextOperation = (
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
  const expected = result.getBlockMap().toJS();

  expect(expected).toMatchSnapshot();
};

test.skip(`at end of a leaf block and sibling is another leaf block forward delete concatenates`, () => {
  assertRemoveTextOperation(
    (editorState: EditorState) =>
      removeTextWithStrategy(
        editorState,
        strategyState => {
          const selection = strategyState.selection;
          const content = strategyState.currentContent;
          const key = selection.anchorKey;
          const offset = selection.anchorOffset;
          const charAhead = getBlockForKey(content, key).text[offset];
          return moveSelectionForward(
            strategyState,
            charAhead ? UnicodeUtils.getUTF16Length(charAhead, 0) : 1,
          );
        },
        'forward',
      ),
    {
      anchorKey: 'D',
      anchorOffset: contentBlockNodes[3].text.length,
      focusKey: 'D',
      focusOffset: contentBlockNodes[3].text.length,
    },
  );
});

test.skip(`at end of a leaf block and sibling is not another leaf block forward delete is no-op`, () => {
  // no next sibling
  assertRemoveTextOperation(
    (editorState: EditorState) =>
      removeTextWithStrategy(
        editorState,
        strategyState => {
          const selection = strategyState.selection;
          const content = strategyState.currentContent;
          const key = selection.anchorKey;
          const offset = selection.anchorOffset;
          const charAhead = getBlockForKey(content, key).text[offset];
          return moveSelectionForward(
            strategyState,
            charAhead ? UnicodeUtils.getUTF16Length(charAhead, 0) : 1,
          );
        },
        'forward',
      ),
    {
      anchorKey: 'E',
      anchorOffset: contentBlockNodes[4].text.length,
      focusKey: 'E',
      focusOffset: contentBlockNodes[4].text.length,
    },
  );
  // next sibling is not a leaf
  assertRemoveTextOperation(
    (editorState: EditorState) =>
      removeTextWithStrategy(
        editorState,
        strategyState => {
          const selection = strategyState.selection;
          const content = strategyState.currentContent;
          const key = selection.anchorKey;
          const offset = selection.anchorOffset;
          const charAhead = getBlockForKey(content, key).text[offset];
          return moveSelectionForward(
            strategyState,
            charAhead ? UnicodeUtils.getUTF16Length(charAhead, 0) : 1,
          );
        },
        'forward',
      ),
    {
      anchorKey: 'E',
      anchorOffset: contentBlockNodes[4].text.length,
      focusKey: 'E',
      focusOffset: contentBlockNodes[4].text.length,
    },
  );
});

test.skip(`across blocks with forward delete is a no-op`, () => {
  assertRemoveTextOperation(
    (editorState: EditorState) =>
      removeTextWithStrategy(
        editorState,
        strategyState => {
          const selection = strategyState.selection;
          const content = strategyState.currentContent;
          const key = selection.anchorKey;
          const offset = selection.anchorOffset;
          const charAhead = getBlockForKey(content, key).text[offset];
          return moveSelectionForward(
            strategyState,
            charAhead ? UnicodeUtils.getUTF16Length(charAhead, 0) : 1,
          );
        },
        'forward',
      ),
    {
      anchorKey: 'D',
      anchorOffset: contentBlockNodes[3].text.length,
      focusKey: 'E',
      focusOffset: contentBlockNodes[4].text.length,
    },
  );
});
