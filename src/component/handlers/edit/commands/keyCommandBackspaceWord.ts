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

import {
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import removeTextWithStrategy from './removeTextWithStrategy';
import {
  getStartKey,
  getStartOffset,
} from '../../../../model/immutable/SelectionState';
import moveSelectionBackward from './moveSelectionBackward';
import DraftRemovableWord from '../../../../model/modifier/DraftRemovableWord';
import {getBlockForKey} from '../../../../model/immutable/ContentState';

/**
 * Delete the word that is left of the cursor, as well as any spaces or
 * punctuation after the word.
 */
export default function keyCommandBackspaceWord(
  editorState: EditorState,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const offset = getStartOffset(selection);
      // If there are no words before the cursor, remove the preceding newline.
      if (offset === 0) {
        return moveSelectionBackward(strategyState, 1);
      }
      const key = getStartKey(selection);
      const content = strategyState.currentContent;
      const text = getBlockForKey(content, key).text.slice(0, offset);
      const toRemove = DraftRemovableWord.getBackward(text);
      return moveSelectionBackward(strategyState, toRemove.length || 1);
    },
    'backward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  return pushContent(editorState, afterRemoval, 'remove-range');
}
