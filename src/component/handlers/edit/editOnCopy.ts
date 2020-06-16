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

import DraftEditor from '../../base/DraftEditor.react';
import {SyntheticClipboardEvent} from '../../utils/eventTypes';
import getFragmentFromSelection from './getFragmentFromSelection';
import {isCollapsed} from '../../../model/immutable/SelectionState';

/**
 * If we have a selection, create a ContentState fragment and store
 * it in our internal clipboard. Subsequent paste events will use this
 * fragment if no external clipboard data is supplied.
 */
export default function editOnCopy(
  editor: DraftEditor,
  e: SyntheticClipboardEvent,
): void {
  const editorState = editor._latestEditorState;
  const selection = editorState.selection;

  // No selection, so there's nothing to copy.
  if (isCollapsed(selection)) {
    e.preventDefault();
    return;
  }

  editor.setClipboard(getFragmentFromSelection(editor._latestEditorState));
}
