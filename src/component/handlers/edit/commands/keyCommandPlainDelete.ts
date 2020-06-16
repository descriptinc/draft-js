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

import UnicodeUtils from 'fbjs/lib/UnicodeUtils';
import {
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import removeTextWithStrategy from './removeTextWithStrategy';
import moveSelectionForward from './moveSelectionForward';
import {getBlockForKey} from '../../../../model/immutable/ContentState';
import {isCollapsed} from '../../../../model/immutable/SelectionState';

/**
 * Remove the selected range. If the cursor is collapsed, remove the following
 * character. This operation is Unicode-aware, so removing a single character
 * will remove a surrogate pair properly as well.
 */
export default function keyCommandPlainDelete(
  editorState: EditorState,
): EditorState {
  const afterRemoval = removeTextWithStrategy(
    editorState,
    strategyState => {
      const selection = strategyState.selection;
      const content = strategyState.currentContent;
      const key = selection.anchorKey;
      const offset = selection.anchorOffset;
      const charAhead = getBlockForKey(content, key).text[offset];
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

  return pushContent(
    editorState,
    {...afterRemoval, selectionBefore: selection},
    isCollapsed(selection) ? 'delete-character' : 'remove-range',
  );
}
