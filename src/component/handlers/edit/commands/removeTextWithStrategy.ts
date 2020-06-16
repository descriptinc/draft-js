/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import GKX from '../../../../stubs/gkx';
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
import {
  ContentState,
  getBlockForKey,
} from '../../../../model/immutable/ContentState';
import {ContentBlockNode} from '../../../../model/immutable/ContentBlockNode';
import DraftModifier from '../../../../model/modifier/DraftModifier';

const experimentalTreeDataSupport = GKX.gkx('draft_tree_data_support');

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
  const anchorKey = selection.anchorKey;
  const focusKey = selection.focusKey;
  const anchorBlock = getBlockForKey(content, anchorKey);
  if (experimentalTreeDataSupport) {
    if (direction === 'forward') {
      if (anchorKey !== focusKey) {
        // For now we ignore forward delete across blocks,
        // if there is demand for this we will implement it.
        return content;
      }
    }
  }
  if (isCollapsed(selection)) {
    if (direction === 'forward') {
      if (isSelectionAtEndOfContent(editorState)) {
        return content;
      }
      if (experimentalTreeDataSupport) {
        const isAtEndOfBlock =
          selection.anchorOffset ===
          getBlockForKey(content, anchorKey).text.length;
        if (isAtEndOfBlock) {
          const anchorBlockSibling = getBlockForKey(
            content,
            (anchorBlock as ContentBlockNode).nextSibling!,
          );
          if (!anchorBlockSibling || anchorBlockSibling.text.length === 0) {
            // For now we ignore forward delete at the end of a block,
            // if there is demand for this we will implement it.
            return content;
          }
        }
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
