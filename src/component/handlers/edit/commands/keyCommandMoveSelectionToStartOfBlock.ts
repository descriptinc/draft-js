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
  setEditorState,
} from '../../../../model/immutable/EditorState';
import {getStartKey} from '../../../../model/immutable/SelectionState';

/**
 * Collapse selection at the start of the first selected block. This is used
 * for Firefox versions that attempt to navigate forward/backward instead of
 * moving the cursor. Other browsers are able to move the cursor natively.
 */
export default function keyCommandMoveSelectionToStartOfBlock(
  editorState: EditorState,
): EditorState {
  const selection = editorState.selection;
  const startKey = getStartKey(selection);
  return setEditorState(editorState, {
    selection: {
      ...selection,
      anchorKey: startKey,
      anchorOffset: 0,
      focusKey: startKey,
      focusOffset: 0,
      isBackward: false,
    },
    forceSelection: true,
  });
}
