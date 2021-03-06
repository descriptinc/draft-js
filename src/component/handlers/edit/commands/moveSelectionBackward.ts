/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import warning from 'fbjs/lib/warning';
import {EditorState} from '../../../../model/immutable/EditorState';
import {
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../../../../model/immutable/SelectionState';
import {
  getBlockBefore,
  getBlockForKey,
} from '../../../../model/immutable/ContentState';

/**
 * Given a collapsed selection, move the focus `maxDistance` backward within
 * the selected block. If the selection will go beyond the start of the block,
 * move focus to the end of the previous block, but no further.
 *
 * This function is not Unicode-aware, so surrogate pairs will be treated
 * as having length 2.
 */
export default function moveSelectionBackward(
  editorState: EditorState,
  maxDistance: number,
): SelectionState {
  const selection = editorState.selection;
  // Should eventually make this an invariant
  warning(
    isCollapsed(selection),
    'moveSelectionBackward should only be called with a collapsed SelectionState',
  );
  const content = editorState.currentContent;
  const key = getStartKey(selection);
  const offset = getStartOffset(selection);

  let focusKey = key;
  let focusOffset = 0;

  if (maxDistance > offset) {
    const keyBefore = getBlockBefore(content, key)?.key;
    if (!keyBefore) {
      focusKey = key;
    } else {
      focusKey = keyBefore;
      const blockBefore = getBlockForKey(content, keyBefore);
      focusOffset = blockBefore.text.length;
    }
  } else {
    focusOffset = offset - maxDistance;
  }

  return {...selection, focusKey, focusOffset, isBackward: true};
}
