/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {EditorState} from '../../model/immutable/EditorState';
import {DOMDerivedSelection} from './DOMDerivedSelection';
import {SelectionObject} from '../utils/DraftDOMTypes';
import getDraftEditorSelectionWithNodes from './getDraftEditorSelectionWithNodes';

/**
 * Convert the current selection range to an anchor/focus pair of offset keys
 * and values that can be interpreted by components.
 */
export default function getDraftEditorSelection(
  editorState: EditorState,
  root: HTMLElement,
): DOMDerivedSelection {
  const selection = root.ownerDocument.defaultView!.getSelection() as SelectionObject;
  const {
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset,
    rangeCount,
  } = selection;

  if (
    // No active selection.
    rangeCount === 0 ||
    // No selection, ever. As in, the user hasn't selected anything since
    // opening the document.
    anchorNode == null ||
    focusNode == null
  ) {
    return {
      selectionState: {...editorState.selection, hasFocus: false},
      needsRecovery: false,
    };
  }

  return getDraftEditorSelectionWithNodes(
    editorState,
    root,
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset,
  );
}
