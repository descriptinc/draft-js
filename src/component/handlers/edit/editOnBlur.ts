/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import containsNode from 'fbjs/lib/containsNode';
import getActiveElement from 'fbjs/lib/getActiveElement';
import DraftEditor from '../../base/DraftEditor.react';
import {SelectionObject} from '../../utils/DraftDOMTypes';
import {acceptSelection} from '../../../model/immutable/EditorState';

export default function editOnBlur(
  editor: DraftEditor,
  e: React.SyntheticEvent,
): void {
  // In a contentEditable element, when you select a range and then click
  // another active element, this does trigger a `blur` event but will not
  // remove the DOM selection from the contenteditable.
  // This is consistent across all browsers, but we prefer that the editor
  // behave like a textarea, where a `blur` event clears the DOM selection.
  // We therefore force the issue to be certain, checking whether the active
  // element is `body` to force it when blurring occurs within the window (as
  // opposed to clicking to another tab or window).
  const {ownerDocument} = e.currentTarget;
  if (
    // This ESLint rule conflicts with `sketchy-null-bool` flow check
    // eslint-disable-next-line no-extra-boolean-cast
    !Boolean(editor.props.preserveSelectionOnBlur) &&
    getActiveElement(ownerDocument) === ownerDocument.body
  ) {
    const selection = ownerDocument.defaultView!.getSelection() as SelectionObject;
    const editorNode = editor.editor;
    if (
      selection.rangeCount === 1 &&
      containsNode(editorNode, selection.anchorNode) &&
      containsNode(editorNode, selection.focusNode)
    ) {
      selection.removeAllRanges();
    }
  }

  const editorState = editor._latestEditorState;
  const currentSelection = editorState.selection;
  if (!currentSelection.hasFocus) {
    return;
  }

  const selection = {...currentSelection, hasFocus: false};
  editor.props.onBlur && editor.props.onBlur(e);
  editor.update(acceptSelection(editorState, selection));
}
