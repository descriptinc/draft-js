/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {EditorState} from '../../../model/immutable/EditorState';
import {BlockMap} from '../../../model/immutable/BlockMap';
import getContentStateFragment from '../../../model/transaction/getContentStateFragment';
import {isCollapsed} from '../../../model/immutable/SelectionState';

export default function getFragmentFromSelection(
  editorState: EditorState,
): BlockMap | null {
  const selectionState = editorState.selection;

  if (isCollapsed(selectionState)) {
    return null;
  }

  return getContentStateFragment(editorState.currentContent, selectionState);
}
