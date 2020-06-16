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

import UserAgent from 'fbjs/lib/UserAgent';
import setImmediate from 'fbjs/lib/setImmediate';
import {
  EditorState,
  getBlockTree,
  getCurrentInlineStyle,
  pushContent,
  setEditorState,
} from '../../../model/immutable/EditorState';
import {DraftInlineStyle} from '../../../model/immutable/DraftInlineStyle';
import DraftModifier from '../../../model/modifier/DraftModifier';
import DraftEditor from '../../base/DraftEditor.react';
import isEventHandled from '../../utils/isEventHandled';
import {
  getStartOffset,
  isCollapsed,
} from '../../../model/immutable/SelectionState';
import getEntityKeyForSelection from '../../../model/entity/getEntityKeyForSelection';
import isSelectionAtLeafStart from '../../selection/isSelectionAtLeafStart';
import {some, zip} from '../../../model/descript/Iterables';
import {nullthrows} from '../../../fbjs/nullthrows';
import {SyntheticInputEvent} from '../../utils/eventTypes';

// When nothing is focused, Firefox regards two characters, `'` and `/`, as
// commands that should open and focus the "quickfind" search bar. This should
// *never* happen while a contenteditable is focused, but as of v28, it
// sometimes does, even when the keypress event target is the contenteditable.
// This breaks the input. Special case these characters to ensure that when
// they are typed, we prevent default on the event to make sure not to
// trigger quickfind.
const FF_QUICKFIND_CHAR = "'";
const FF_QUICKFIND_LINK_CHAR = '/';
const isFirefox = UserAgent.isBrowser('Firefox');

function mustPreventDefaultForCharacter(character: string): boolean {
  return (
    isFirefox &&
    (character == FF_QUICKFIND_CHAR || character == FF_QUICKFIND_LINK_CHAR)
  );
}

/**
 * Replace the current selection with the specified text string, with the
 * inline style and entity key applied to the newly inserted text.
 */
function replaceText(
  editorState: EditorState,
  text: string,
  inlineStyle: DraftInlineStyle,
  entityKey: string | null,
  forceSelection: boolean,
): EditorState {
  const contentState = DraftModifier.replaceText(
    editorState.currentContent,
    editorState.selection,
    text,
    inlineStyle,
    entityKey,
  );
  return pushContent(
    editorState,
    contentState,
    'insert-characters',
    forceSelection,
  );
}

/**
 * When `onBeforeInput` executes, the browser is attempting to insert a
 * character into the editor. Apply this character data to the document,
 * allowing native insertion if possible.
 *
 * Native insertion is encouraged in order to limit re-rendering and to
 * preserve spellcheck highlighting, which disappears or flashes if re-render
 * occurs on the relevant text nodes.
 */
export default function editOnBeforeInput(
  editor: DraftEditor,
  e: SyntheticInputEvent,
): void {
  if (editor._pendingStateFromBeforeInput !== undefined) {
    editor.update(editor._pendingStateFromBeforeInput);
    editor._pendingStateFromBeforeInput = undefined;
  }

  const editorState = editor._latestEditorState;

  const chars: string | null | undefined = (e as any).data;

  // In some cases (ex: IE ideographic space insertion) no character data
  // is provided. There's nothing to do when this happens.
  if (!chars) {
    return;
  }

  // Allow the top-level component to handle the insertion manually. This is
  // useful when triggering interesting behaviors for a character insertion,
  // Simple examples: replacing a raw text ':)' with a smile emoji or image
  // decorator, or setting a block to be a list item after typing '- ' at the
  // start of the block.
  if (
    editor.props.handleBeforeInput &&
    isEventHandled(
      editor.props.handleBeforeInput(chars, editorState, e.timeStamp),
    )
  ) {
    e.preventDefault();
    return;
  }

  // If selection is collapsed, conditionally allow native behavior. This
  // reduces re-renders and preserves spellcheck highlighting. If the selection
  // is not collapsed, we will re-render.
  const selection = editorState.selection;
  const selectionStart = getStartOffset(selection);
  const anchorKey = selection.anchorKey;

  if (!isCollapsed(selection)) {
    e.preventDefault();
    editor.update(
      replaceText(
        editorState,
        chars,
        getCurrentInlineStyle(editorState),
        getEntityKeyForSelection(
          editorState.currentContent,
          editorState.selection,
        ),
        true,
      ),
    );
    return;
  }

  let newEditorState = replaceText(
    editorState,
    chars,
    getCurrentInlineStyle(editorState),
    getEntityKeyForSelection(editorState.currentContent, editorState.selection),
    false,
  );

  // Bunch of different cases follow where we need to prevent native insertion.
  let mustPreventNative = false;
  if (!mustPreventNative) {
    // Browsers tend to insert text in weird places in the DOM when typing at
    // the start of a leaf, so we'll handle it ourselves.
    mustPreventNative = isSelectionAtLeafStart(
      editor._latestCommittedEditorState,
    );
  }
  if (!mustPreventNative) {
    // Let's say we have a decorator that highlights hashtags. In many cases
    // we need to prevent native behavior and rerender ourselves --
    // particularly, any case *except* where the inserted characters end up
    // anywhere except exactly where you put them.
    //
    // Using [] to denote a decorated leaf, some examples:
    //
    // 1. 'hi #' and append 'f'
    // desired rendering: 'hi [#f]'
    // native rendering would be: 'hi #f' (incorrect)
    //
    // 2. 'x [#foo]' and insert '#' before 'f'
    // desired rendering: 'x #[#foo]'
    // native rendering would be: 'x [##foo]' (incorrect)
    //
    // 3. '[#foobar]' and insert ' ' between 'foo' and 'bar'
    // desired rendering: '[#foo] bar'
    // native rendering would be: '[#foo bar]' (incorrect)
    //
    // 4. '[#foo]' and delete '#' [won't use this beforeinput codepath though]
    // desired rendering: 'foo'
    // native rendering would be: '[foo]' (incorrect)
    //
    // 5. '[#foo]' and append 'b'
    // desired rendering: '[#foob]'
    // native rendering would be: '[#foob]'
    // (native insertion here would be ok for decorators like simple spans,
    // but not more complex decorators. To be safe, we need to prevent it.)
    //
    // It is safe to allow native insertion if and only if the full list of
    // decorator ranges matches what we expect native insertion to give, and
    // the range lengths have not changed. We don't need to compare the content
    // because the only possible mutation to consider here is inserting plain
    // text and decorators can't affect text content.
    const oldBlockTree = getBlockTree(editorState, anchorKey);
    const newBlockTree = getBlockTree(newEditorState, anchorKey);
    mustPreventNative =
      oldBlockTree.length !== newBlockTree.length ||
      some(zip(oldBlockTree, newBlockTree), ([oldLeafSet, newLeafSet]) => {
        // selectionStart is guaranteed to be selectionEnd here
        const oldStart = oldLeafSet.start;
        const adjustedStart =
          oldStart + (oldStart >= selectionStart ? chars.length : 0);
        const oldEnd = oldLeafSet.end;
        const adjustedEnd =
          oldEnd + (oldEnd >= selectionStart ? chars.length : 0);
        const newStart = newLeafSet.start;
        const newEnd = newLeafSet.end;
        const newDecoratorKey = newLeafSet.decoratorKey;
        return (
          // Different decorators
          oldLeafSet.decoratorKey !== newDecoratorKey ||
          // Different number of inline styles
          oldLeafSet.leaves.length !== newLeafSet.leaves.length ||
          // Different effective decorator position
          adjustedStart !== newStart ||
          adjustedEnd !== newEnd ||
          // Decorator already existed and its length changed
          (newDecoratorKey != null && newEnd - newStart !== oldEnd - oldStart)
        );
      });
  }
  if (!mustPreventNative) {
    mustPreventNative = mustPreventDefaultForCharacter(chars);
  }
  if (!mustPreventNative) {
    mustPreventNative =
      nullthrows(newEditorState.directionMap).get(anchorKey) !==
      nullthrows(editorState.directionMap).get(anchorKey);
  }

  if (mustPreventNative) {
    e.preventDefault();
    newEditorState = setEditorState(newEditorState, {
      forceSelection: true,
    });
    editor.update(newEditorState);
    return;
  }

  // We made it all the way! Let the browser do its thing and insert the char.
  newEditorState = setEditorState(newEditorState, {
    nativelyRenderedContent: newEditorState.currentContent,
  });
  // The native event is allowed to occur. To allow user onChange handlers to
  // change the inserted text, we wait until the text is actually inserted
  // before we actually update our state. That way when we rerender, the text
  // we see in the DOM will already have been inserted properly.
  editor._pendingStateFromBeforeInput = newEditorState;
  setImmediate(() => {
    if (editor._pendingStateFromBeforeInput !== undefined) {
      editor.update(editor._pendingStateFromBeforeInput);
      editor._pendingStateFromBeforeInput = undefined;
    }
  });
}
