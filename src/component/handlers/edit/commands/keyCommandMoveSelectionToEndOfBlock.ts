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

/**
 * See comment for `moveSelectionToStartOfBlock`.
 */
function keyCommandMoveSelectionToEndOfBlock(editorState: EditorState): EditorState {
  const selection = editorState.selection;
  const endKey = selection.getEndKey();
  const content = editorState.currentContent;
  const textLength = content.getBlockForKey(endKey).getLength();
  return EditorState.set(editorState, {
    selection: selection.merge({
      anchorKey: endKey,
      anchorOffset: textLength,
      focusKey: endKey,
      focusOffset: textLength,
      isBackward: false,
    }),
    forceSelection: true,
  });
}

module.exports = keyCommandMoveSelectionToEndOfBlock;
