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
  undo,
} from '../../../../model/immutable/EditorState';

export default function keyCommandUndo(
  e: React.KeyboardEvent,
  editorState: EditorState,
  updateFn: (editorState: EditorState) => void,
): void {
  const undoneState = undo(editorState);

  // If the last change to occur was a spellcheck change, allow the undo
  // event to fall through to the browser. This allows the browser to record
  // the unwanted change, which should soon lead it to learn not to suggest
  // the correction again.
  if (editorState.lastChangeType === 'spellcheck-change') {
    const nativelyRenderedContent = undoneState.currentContent;
    updateFn(setEditorState(undoneState, {nativelyRenderedContent}));
    return;
  }

  // Otheriwse, manage the undo behavior manually.
  e.preventDefault();
  if (!editorState.nativelyRenderedContent) {
    updateFn(undoneState);
    return;
  }

  // Trigger a re-render with the current content state to ensure that the
  // component tree has up-to-date props for comparison.
  updateFn(setEditorState(editorState, {nativelyRenderedContent: null}));

  // Wait to ensure that the re-render has occurred before performing
  // the undo action.
  setTimeout(() => {
    updateFn(undoneState);
  }, 0);
}
