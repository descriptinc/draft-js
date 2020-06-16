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
  setEditorState,
} from '../../../../model/immutable/EditorState';
import {getEndKey} from '../../../../model/immutable/SelectionState';
import {getBlockForKey} from '../../../../model/immutable/ContentState';

/**
 * See comment for `moveSelectionToStartOfBlock`.
 */
export default function keyCommandMoveSelectionToEndOfBlock(
  editorState: EditorState,
): EditorState {
  const selection = editorState.selection;
  const endKey = getEndKey(selection);
  const content = editorState.currentContent;
  const textLength = getBlockForKey(content, endKey).text.length;
  return setEditorState(editorState, {
    selection: {
      ...selection,
      anchorKey: endKey,
      anchorOffset: textLength,
      focusKey: endKey,
      focusOffset: textLength,
      isBackward: false,
    },
    forceSelection: true,
  });
}
