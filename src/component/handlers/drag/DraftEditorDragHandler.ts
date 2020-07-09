/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import DataTransfer from 'fbjs/lib/DataTransfer';
import {
  EditorState,
  getCurrentInlineStyle,
  pushContent,
} from '../../../model/immutable/EditorState';
import {SelectionState} from '../../../model/immutable/SelectionState';
import getCorrectDocumentFromNode from '../../utils/getCorrectDocumentFromNode';
import {nullthrows} from '../../../fbjs/nullthrows';
import findAncestorOffsetKey from '../../selection/findAncestorOffsetKey';
import getUpdatedSelectionState from '../../selection/getUpdatedSelectionState';
import DraftEditor from '../../base/DraftEditor.react';
import isEventHandled from '../../utils/isEventHandled';
import {getTextContentFromFiles} from '../../utils/getTextContentFromFiles';
import getWindowForNode from '../../utils/getWindowForNode';
import DraftModifier from '../../../model/modifier/DraftModifier';

/**
 * Get a SelectionState for the supplied mouse event.
 */
function getSelectionForEvent(
  event: Record<string, any>,
  editorState: EditorState,
): SelectionState | null {
  let node: Node | null = null;
  let offset: number | null = null;

  const eventTargetDocument = getCorrectDocumentFromNode(event.currentTarget);
  /* $FlowFixMe(>=0.68.0 site=www,mobile) This comment suppresses an error
   * found when Flow v0.68 was deployed. To see the error delete this comment
   * and run Flow. */
  if (typeof eventTargetDocument.caretRangeFromPoint === 'function') {
    /* $FlowFixMe(>=0.68.0 site=www,mobile) This comment suppresses an error
     * found when Flow v0.68 was deployed. To see the error delete this comment
     * and run Flow. */
    const dropRange = eventTargetDocument.caretRangeFromPoint(event.x, event.y);
    node = dropRange.startContainer;
    offset = dropRange.startOffset;
  } else if (event.rangeParent) {
    node = event.rangeParent;
    offset = event.rangeOffset;
  } else {
    return null;
  }

  node = nullthrows(node);
  offset = nullthrows(offset);
  const offsetKey = nullthrows(findAncestorOffsetKey(node));

  return getUpdatedSelectionState(
    editorState,
    offsetKey,
    offset,
    offsetKey,
    offset,
  );
}

const DraftEditorDragHandler = {
  /**
   * Drag originating from input terminated.
   */
  onDragEnd: function(editor: DraftEditor): void {
    editor.exitCurrentMode();
    endDrag(editor);
  },

  /**
   * Handle data being dropped.
   */
  onDrop: function(editor: DraftEditor, e: Record<string, any>): void {
    const data = new DataTransfer(e.nativeEvent.dataTransfer);

    const editorState: EditorState = editor._latestEditorState;
    const dropSelection: SelectionState | null = getSelectionForEvent(
      e.nativeEvent,
      editorState,
    );

    e.preventDefault();
    editor._dragCount = 0;
    editor.exitCurrentMode();

    if (dropSelection == null) {
      return;
    }

    const files = data.getFiles();
    if (files.length > 0) {
      if (
        editor.props.handleDroppedFiles &&
        isEventHandled(editor.props.handleDroppedFiles(dropSelection, files))
      ) {
        return;
      }

      /* $FlowFixMe This comment suppresses an error found DataTransfer was
       * typed. getFiles() returns an array of <Files extends Blob>, not Blob
       */
      getTextContentFromFiles(files, fileText => {
        fileText &&
          editor.update(
            insertTextAtSelection(editorState, dropSelection, fileText),
          );
      });
      return;
    }

    const dragType = editor._internalDrag ? 'internal' : 'external';
    if (
      editor.props.handleDrop &&
      isEventHandled(editor.props.handleDrop(dropSelection, data, dragType))
    ) {
      // handled
    } else if (editor._internalDrag) {
      editor.update(moveText(editorState, dropSelection));
    } else {
      editor.update(
        insertTextAtSelection(editorState, dropSelection, data.getText() || ''),
      );
    }
    endDrag(editor);
  },
};

function endDrag(editor: DraftEditor) {
  editor._internalDrag = false;

  // Fix issue #1383
  // Prior to React v16.5.0 onDrop breaks onSelect event:
  // https://github.com/facebook/react/issues/11379.
  // Dispatching a mouseup event on DOM node will make it go back to normal.
  const editorNode = editor.editorContainer;
  if (editorNode) {
    const mouseUpEvent = new MouseEvent('mouseup', {
      view: getWindowForNode(editorNode),
      bubbles: true,
      cancelable: true,
    });
    editorNode.dispatchEvent(mouseUpEvent);
  }
}

function moveText(
  editorState: EditorState,
  targetSelection: SelectionState,
): EditorState {
  const newContentState = DraftModifier.moveText(
    editorState.currentContent,
    editorState.selection,
    targetSelection,
  );
  return pushContent(editorState, newContentState, 'insert-fragment');
}

/**
 * Insert text at a specified selection.
 */
function insertTextAtSelection(
  editorState: EditorState,
  selection: SelectionState,
  text: string,
): EditorState {
  const newContentState = DraftModifier.insertText(
    editorState.currentContent,
    selection,
    text,
    getCurrentInlineStyle(editorState),
  );
  return pushContent(editorState, newContentState, 'insert-fragment');
}

export default DraftEditorDragHandler;
