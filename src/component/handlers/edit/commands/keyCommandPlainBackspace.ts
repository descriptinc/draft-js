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
import UnicodeUtils from 'fbjs/lib/UnicodeUtils';
import removeTextWithStrategy from './removeTextWithStrategy';
import moveSelectionBackward from './moveSelectionBackward';
import {getBlockForKey} from '../../../../model/immutable/ContentState';
import {isCollapsed} from '../../../../model/immutable/SelectionState';

/**
 * Remove the selected range. If the cursor is collapsed, remove the preceding
 * character. This operation is Unicode-aware, so removing a single character
 * will remove a surrogate pair properly as well.
 */
export default function keyCommandPlainBackspace(
  editorState: EditorState,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const content = strategyState.currentContent;
      const key = selection.anchorKey;
      const offset = selection.anchorOffset;
      const charBehind = getBlockForKey(content, key).text[offset - 1];
      return moveSelectionBackward(
        strategyState,
        charBehind ? UnicodeUtils.getUTF16Length(charBehind, 0) : 1,
      );
    },
    'backward',
  );

  if (afterRemoval === editorState.currentContent) {
    return editorState;
  }

  const selection = editorState.selection;
  return pushContent(
    editorState,
    {...afterRemoval, selectionBefore: selection},
    isCollapsed(selection) ? 'backspace-character' : 'remove-range',
  );
}
