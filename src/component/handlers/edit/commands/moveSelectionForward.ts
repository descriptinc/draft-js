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

import {EditorState} from '../../../../model/immutable/EditorState';
import {
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../../../../model/immutable/SelectionState';
import warning from 'fbjs/lib/warning';
import {
  getBlockAfter,
  getBlockForKey,
} from '../../../../model/immutable/ContentState';

/**
 * Given a collapsed selection, move the focus `maxDistance` forward within
 * the selected block. If the selection will go beyond the end of the block,
 * move focus to the start of the next block, but no further.
 *
 * This function is not Unicode-aware, so surrogate pairs will be treated
 * as having length 2.
 */
export default function moveSelectionForward(
  editorState: EditorState,
  maxDistance: number,
): SelectionState {
  const selection = editorState.selection;
  // Should eventually make this an invariant
  warning(
    isCollapsed(selection),
    'moveSelectionForward should only be called with a collapsed SelectionState',
  );
  const key = getStartKey(selection);
  const offset = getStartOffset(selection);
  const content = editorState.currentContent;

  let focusKey: string | null = key;
  let focusOffset;

  const block = getBlockForKey(content, key);

  if (maxDistance > block.text.length - offset) {
    focusKey = getBlockAfter(content, key)!.key;
    focusOffset = 0;
  } else {
    focusOffset = offset + maxDistance;
  }

  return {
    ...selection,
    focusKey,
    focusOffset,
  };
}
