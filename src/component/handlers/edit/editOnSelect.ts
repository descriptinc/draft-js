/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import DraftEditor from 'DraftEditor.react';
import DraftJsDebugLogging from '../../../stubs/DraftJsDebugLogging';
import getDraftEditorSelection from '../../selection/getDraftEditorSelection';
import {
  acceptSelection,
  forceSelection,
} from '../../../model/immutable/EditorState';

function editOnSelect(editor: DraftEditor): void {
  if (
    editor._blockSelectEvents ||
    editor._latestEditorState !== editor.props.editorState
  ) {
    if (editor._blockSelectEvents) {
      const editorState = editor.props.editorState;
      const selectionState = editorState.selection;
      DraftJsDebugLogging.logBlockedSelectionEvent({
        // For now I don't think we need any other info
        anonymizedDom: 'N/A',
        extraParams: JSON.stringify({stacktrace: new Error().stack}),
        selectionState: JSON.stringify(selectionState.toJS()),
      });
    }
    return;
  }

  let editorState = editor.props.editorState;
  const documentSelection = getDraftEditorSelection(
    editorState,
    getContentEditableContainer(editor),
  );
  const updatedSelectionState = documentSelection.selectionState;

  if (updatedSelectionState !== editorState.selection) {
    if (documentSelection.needsRecovery) {
      editorState = forceSelection(editorState, updatedSelectionState);
    } else {
      editorState = acceptSelection(editorState, updatedSelectionState);
    }
    editor.update(editorState);
  }
}

module.exports = editOnSelect;
