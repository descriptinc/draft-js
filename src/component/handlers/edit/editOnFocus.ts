/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import UserAgent from 'fbjs/lib/UserAgent';
import {
  acceptSelection,
  forceSelection,
} from '../../../model/immutable/EditorState';
import DraftEditor from '../../base/DraftEditor.react';
import {SyntheticEvent} from 'react';

export function editOnFocus(editor: DraftEditor, e: SyntheticEvent): void {
  const editorState = editor._latestEditorState;
  const currentSelection = editorState.selection;
  if (currentSelection.hasFocus) {
    return;
  }

  const selection = {...currentSelection, hasFocus: true};
  editor.props.onFocus && editor.props.onFocus(e);

  // When the tab containing this text editor is hidden and the user does a
  // find-in-page in a _different_ tab, Chrome on Mac likes to forget what the
  // selection was right after sending this focus event and (if you let it)
  // moves the cursor back to the beginning of the editor, so we force the
  // selection here instead of simply accepting it in order to preserve the
  // old cursor position. See https://crbug.com/540004.
  // But it looks like this is fixed in Chrome 60.0.3081.0.
  // Other browsers also don't have this bug, so we prefer to acceptSelection
  // when possible, to ensure that unfocusing and refocusing a Draft editor
  // doesn't preserve the selection, matching how textareas work.
  if (UserAgent.isBrowser('Chrome < 60.0.3081.0')) {
    editor.update(forceSelection(editorState, selection));
  } else {
    editor.update(acceptSelection(editorState, selection));
  }
}
