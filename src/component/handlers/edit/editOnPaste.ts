/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+draft_js
 */

import DraftEditor from '../../base/DraftEditor.react';
import {SyntheticClipboardEvent} from '../../utils/eventTypes';
import isEventHandled from '../../utils/isEventHandled';
import splitTextIntoTextBlocks from '../../utils/splitTextIntoTextBlocks';
import {makeCharacterMetadata} from '../../../model/immutable/CharacterMetadata';
import getEntityKeyForSelection from '../../../model/entity/getEntityKeyForSelection';
import {
  EditorState,
  getCurrentInlineStyle,
  pushContent,
} from '../../../model/immutable/EditorState';
import RichTextEditorUtil from '../../../model/modifier/RichTextEditorUtil';
import DraftPasteProcessor from '../../../model/paste/DraftPasteProcessor';
import {createFromArray} from '../../../model/immutable/BlockMapBuilder';
import DraftModifier from '../../../model/modifier/DraftModifier';
import {getTextContentFromFiles} from '../../utils/getTextContentFromFiles';
import {BlockMap} from '../../../model/immutable/BlockMap';
import {EntityMap} from '../../../model/immutable/EntityMap';
import {every, first} from '../../../model/descript/Iterables';

/**
 * Paste content.
 */
export default function editOnPaste(
  editor: DraftEditor,
  e: SyntheticClipboardEvent,
): void {
  e.preventDefault();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const data = new DataTransfer(e.clipboardData);

  // Get files, unless this is likely to be a string the user wants inline.
  if (!(data as any).isRichText()) {
    const files: Array<File> = (data as any).getFiles();
    const defaultFileText = (data as any).text;
    if (files.length > 0) {
      // Allow customized paste handling for images, etc. Otherwise, fall
      // through to insert text contents into the editor.
      if (
        editor.props.handlePastedFiles &&
        isEventHandled(editor.props.handlePastedFiles(files))
      ) {
        return;
      }

      /* $FlowFixMe This comment suppresses an error found DataTransfer was
       * typed. getFiles() returns an array of <Files extends Blob>, not Blob
       */
      getTextContentFromFiles(files, (/*string*/ fileText) => {
        fileText = fileText || defaultFileText;
        if (!fileText) {
          return;
        }

        const editorState = editor._latestEditorState;
        const blocks = splitTextIntoTextBlocks(fileText);
        const character = makeCharacterMetadata({
          style: getCurrentInlineStyle(editorState),
          entity: getEntityKeyForSelection(
            editorState.currentContent,
            editorState.selection,
          ),
        });
        const currentBlockType = RichTextEditorUtil.getCurrentBlockType(
          editorState,
        );

        const text = DraftPasteProcessor.processText(
          blocks,
          character,
          currentBlockType,
        );
        const fragment = createFromArray(text);

        const withInsertedText = DraftModifier.replaceWithFragment(
          editorState.currentContent,
          editorState.selection,
          fragment,
        );

        editor.update(
          pushContent(editorState, withInsertedText, 'insert-fragment'),
        );
      });

      return;
    }
  }

  let textBlocks: Array<string> = [];
  const text: string = (data as any).text;
  const html: string = (data as any).getHTML();
  const editorState = editor._latestEditorState;

  if (
    editor.props.handlePastedText &&
    isEventHandled(editor.props.handlePastedText(text, html, editorState))
  ) {
    return;
  }

  if (text) {
    textBlocks = splitTextIntoTextBlocks(text);
  }

  if (!editor.props.stripPastedStyles) {
    // If the text from the paste event is rich content that matches what we
    // already have on the internal clipboard, assume that we should just use
    // the clipboard fragment for the paste. This will allow us to preserve
    // styling and entities, if any are present. Note that newlines are
    // stripped during comparison -- this is because copy/paste within the
    // editor in Firefox and IE will not include empty lines. The resulting
    // paste will preserve the newlines correctly.
    const internalClipboard = editor.getClipboard();
    if ((data as any).isRichText() && internalClipboard) {
      if (
        // If the editorKey is present in the pasted HTML, it should be safe to
        // assume this is an internal paste.
        html.indexOf(editor.getEditorKey()) !== -1 ||
        // The copy may have been made within a single block, in which case the
        // editor key won't be part of the paste. In this case, just check
        // whether the pasted text matches the internal clipboard.
        (textBlocks.length === 1 &&
          internalClipboard.size === 1 &&
          first(internalClipboard.values())!.text === text)
      ) {
        editor.update(
          insertFragment(editor._latestEditorState, internalClipboard),
        );
        return;
      }
    } else if (
      internalClipboard &&
      data.types.includes('com.apple.webarchive') &&
      !data.types.includes('text/html') &&
      areTextBlocksAndClipboardEqual(textBlocks, internalClipboard)
    ) {
      // Safari does not properly store text/html in some cases.
      // Use the internalClipboard if present and equal to what is on
      // the clipboard. See https://bugs.webkit.org/show_bug.cgi?id=19893.
      editor.update(
        insertFragment(editor._latestEditorState, internalClipboard),
      );
      return;
    }

    // If there is html paste data, try to parse that.
    if (html) {
      const htmlFragment = DraftPasteProcessor.processHTML(
        html,
        editor.props.blockRenderMap,
      );
      if (htmlFragment) {
        const {contentBlocks, entityMap} = htmlFragment;
        if (contentBlocks) {
          const htmlMap = createFromArray(contentBlocks);
          editor.update(
            insertFragment(editor._latestEditorState, htmlMap, entityMap),
          );
          return;
        }
      }
    }

    // Otherwise, create a new fragment from our pasted text. Also
    // empty the internal clipboard, since it's no longer valid.
    editor.setClipboard(null);
  }

  if (textBlocks.length) {
    const character = makeCharacterMetadata({
      style: getCurrentInlineStyle(editorState),
      entity: getEntityKeyForSelection(
        editorState.currentContent,
        editorState.selection,
      ),
    });

    const currentBlockType = RichTextEditorUtil.getCurrentBlockType(
      editorState,
    );

    const textFragment = DraftPasteProcessor.processText(
      textBlocks,
      character,
      currentBlockType,
    );

    const textMap = createFromArray(textFragment);
    editor.update(insertFragment(editor._latestEditorState, textMap));
  }
}

function insertFragment(
  editorState: EditorState,
  fragment: BlockMap,
  _?: EntityMap | null,
): EditorState {
  const newContent = DraftModifier.replaceWithFragment(
    editorState.currentContent,
    editorState.selection,
    fragment,
  );
  // TODO: merge the entity map once we stop using DraftEntity
  // like this:
  // const mergedEntityMap = newContent.getEntityMap().merge(entityMap);

  return pushContent(
    editorState,
    newContent,
    // FIXME [mvp]: entity map
    // newContent.set('entityMap', entityMap),
    'insert-fragment',
  );
}

function areTextBlocksAndClipboardEqual(
  textBlocks: Array<string>,
  blockMap: BlockMap,
): boolean {
  return (
    textBlocks.length === blockMap.size &&
    every(blockMap.values(), (block, ii) => block.text === textBlocks[ii])
  );
}
