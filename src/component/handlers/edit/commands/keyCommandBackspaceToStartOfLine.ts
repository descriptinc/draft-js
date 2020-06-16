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

import {EditorState} from "../../../../model/immutable/EditorState";

export function keyCommandBackspaceToStartOfLine(
  editorState: EditorState,
  e: React.KeyboardEvent,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      if (selection.isCollapsed() && selection.anchorOffset === 0) {
        return moveSelectionBackward(strategyState, 1);
      }
      const {ownerDocument} = e.currentTarget;
      const domSelection = ownerDocument.defaultView.getSelection() as SelectionObject;
      // getRangeAt can technically throw if there's no selection, but we know
      // there is one here because text editor has focus (the cursor is a
      // selection of length 0). Therefore, we don't need to wrap this in a
      // try-catch block.
      let range = domSelection.getRangeAt(0);
      range = expandRangeToStartOfLine(range);

      return getDraftEditorSelectionWithNodes(
        strategyState,
        null,
        range.endContainer,
        range.endOffset,
        range.startContainer,
        range.startOffset,
      ).selectionState;
    },
    'backward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  return EditorState.push(editorState, afterRemoval, 'remove-range');
}
