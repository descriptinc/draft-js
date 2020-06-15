/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+draft_js
 */

'use strict';

const DraftRemovableWord = require('DraftRemovableWord');
const EditorState = require('EditorState');

const moveSelectionBackward = require('moveSelectionBackward');
const removeTextWithStrategy = require('removeTextWithStrategy');

/**
 * Delete the word that is left of the cursor, as well as any spaces or
 * punctuation after the word.
 */
function keyCommandBackspaceWord(editorState: EditorState): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const offset = getStartOffset(selection);
      // If there are no words before the cursor, remove the preceding newline.
      if (offset === 0) {
        return moveSelectionBackward(strategyState, 1);
      }
      const key = selection.getStartKey();
      const content = strategyState.currentContent;
      const text = content
        .getBlockForKey(key)
        .text
        .slice(0, offset);
      const toRemove = DraftRemovableWord.getBackward(text);
      return moveSelectionBackward(strategyState, toRemove.length || 1);
    },
    'backward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  return EditorState.push(editorState, afterRemoval, 'remove-range');
}

module.exports = keyCommandBackspaceWord;
