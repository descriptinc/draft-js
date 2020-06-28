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
  isSelectionAtEndOfContent,
  isSelectionAtStartOfContent,
} from '../../../../model/immutable/EditorState';
import {
  isCollapsed,
  SelectionState,
} from '../../../../model/immutable/SelectionState';
import {DraftRemovalDirection} from '../../../../model/constants/DraftRemovalDirection';
import {ContentState} from '../../../../model/immutable/ContentState';
import DraftModifier from '../../../../model/modifier/DraftModifier';

/**
 * For a collapsed selection state, remove text based on the specified strategy.
 * If the selection state is not collapsed, remove the entire selected range.
 */
export default function removeTextWithStrategy(
  editorState: EditorState,
  strategy: (editorState: EditorState) => SelectionState,
  direction: DraftRemovalDirection,
): ContentState {
  const selection = editorState.selection;
  const content = editorState.currentContent;
  let target = selection;
  if (isCollapsed(selection)) {
    if (direction === 'forward') {
      if (isSelectionAtEndOfContent(editorState)) {
        return content;
      }
    } else if (isSelectionAtStartOfContent(editorState)) {
      return content;
    }

    target = strategy(editorState);
    if (target === selection) {
      return content;
    }
  }
  return DraftModifier.removeRange(content, target, direction);
}
