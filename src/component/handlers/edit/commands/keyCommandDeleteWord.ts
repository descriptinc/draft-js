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
import {
  getStartKey,
  getStartOffset,
} from '../../../../model/immutable/SelectionState';
import DraftRemovableWord from '../../../../model/modifier/DraftRemovableWord';
import moveSelectionForward from './moveSelectionForward';
import {getBlockForKey} from '../../../../model/immutable/ContentState';

/**
 * Delete the word that is right of the cursor, as well as any spaces or
 * punctuation before the word.
 */
export default function keyCommandDeleteWord(
  editorState: EditorState,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const offset = getStartOffset(selection);
      const key = getStartKey(selection);
      const content = strategyState.currentContent;
      const text = getBlockForKey(content, key).text.slice(offset);
      const toRemove = DraftRemovableWord.getForward(text);

      // If there are no words in front of the cursor, remove the newline.
      return moveSelectionForward(strategyState, toRemove.length || 1);
    },
    'forward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  return pushContent(editorState, afterRemoval, 'remove-range');
}
