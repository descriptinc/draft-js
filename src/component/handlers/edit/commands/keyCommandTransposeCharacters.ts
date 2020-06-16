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

import {
  acceptSelection,
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import {isCollapsed} from '../../../../model/immutable/SelectionState';
import {getBlockForKey} from '../../../../model/immutable/ContentState';
import getContentStateFragment from '../../../../model/transaction/getContentStateFragment';
import DraftModifier from '../../../../model/modifier/DraftModifier';

/**
 * Transpose the characters on either side of a collapsed cursor, or
 * if the cursor is at the end of the block, transpose the last two
 * characters.
 */
export default function keyCommandTransposeCharacters(
  editorState: EditorState,
): EditorState {
  const selection = editorState.selection;
  if (!isCollapsed(selection)) {
    return editorState;
  }

  const offset = selection.anchorOffset;
  if (offset === 0) {
    return editorState;
  }

  const blockKey = selection.anchorKey;
  const content = editorState.currentContent;
  const block = getBlockForKey(content, blockKey);
  const length = block.text.length;

  // Nothing to transpose if there aren't two characters.
  if (length <= 1) {
    return editorState;
  }

  let removalRange;
  let finalSelection;

  if (offset === length) {
    // The cursor is at the end of the block. Swap the last two characters.
    removalRange = {...selection, anchorOffset: offset - 1};
    finalSelection = selection;
  } else {
    removalRange = {...selection, focusOffset: offset + 1};
    finalSelection = {...removalRange, anchorOffset: offset + 1};
  }

  // Extract the character to move as a fragment. This preserves its
  // styling and entity, if any.
  const movedFragment = getContentStateFragment(content, removalRange);
  const afterRemoval = DraftModifier.removeRange(
    content,
    removalRange,
    'backward',
  );

  // After the removal, the insertion target is one character back.
  const selectionAfter = afterRemoval.selectionAfter;
  const targetOffset = selectionAfter.anchorOffset - 1;
  const targetRange = {
    ...selectionAfter,
    anchorOffset: targetOffset,
    focusOffset: targetOffset,
  };

  const afterInsert = DraftModifier.replaceWithFragment(
    afterRemoval,
    targetRange,
    movedFragment,
  );

  const newEditorState = pushContent(
    editorState,
    afterInsert,
    'insert-fragment',
  );

  return acceptSelection(newEditorState, finalSelection);
}

module.exports = keyCommandTransposeCharacters;
