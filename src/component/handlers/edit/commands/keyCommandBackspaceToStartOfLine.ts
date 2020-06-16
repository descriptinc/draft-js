/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import removeTextWithStrategy from './removeTextWithStrategy';
import moveSelectionBackward from './moveSelectionBackward';
import {isCollapsed} from '../../../../model/immutable/SelectionState';
import {SelectionObject} from '../../../utils/DraftDOMTypes';
import expandRangeToStartOfLine from '../../../selection/expandRangeToStartOfLine';
import getDraftEditorSelectionWithNodes from '../../../selection/getDraftEditorSelectionWithNodes';

export function keyCommandBackspaceToStartOfLine(
  editorState: EditorState,
  e: React.KeyboardEvent,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      if (isCollapsed(selection) && selection.anchorOffset === 0) {
        return moveSelectionBackward(strategyState, 1);
      }
      const {ownerDocument} = e.currentTarget;
      const domSelection = ownerDocument.defaultView!.getSelection() as SelectionObject;
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

  return pushContent(editorState, afterRemoval, 'remove-range');
}
