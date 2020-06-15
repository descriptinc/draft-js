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

const EditorState = require('EditorState');
const UnicodeUtils = require('UnicodeUtils');

const moveSelectionForward = require('moveSelectionForward');
const removeTextWithStrategy = require('removeTextWithStrategy');

/**
 * Remove the selected range. If the cursor is collapsed, remove the following
 * character. This operation is Unicode-aware, so removing a single character
 * will remove a surrogate pair properly as well.
 */
function keyCommandPlainDelete(editorState: EditorState): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const content = strategyState.currentContent;
      const key = selection.anchorKey;
      const offset = selection.anchorOffset;
      const charAhead = content.getBlockForKey(key).text[offset];
      return moveSelectionForward(
        strategyState,
        charAhead ? UnicodeUtils.getUTF16Length(charAhead, 0) : 1,
      );
    },
    'forward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  const selection = editorState.selection;

  return EditorState.push(
    editorState,
    afterRemoval.set('selectionBefore', selection),
    selection.isCollapsed() ? 'delete-character' : 'remove-range',
  );
}

module.exports = keyCommandPlainDelete;
