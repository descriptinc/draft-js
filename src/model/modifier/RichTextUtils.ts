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

import ContentState from 'ContentState';
import { DraftBlockType } from 'DraftBlockType';
import { DraftEditorCommand } from 'DraftEditorCommand';
import EditorState from 'EditorState';
import SelectionState from 'SelectionState';
import URI from 'URI';

export type DataObjectForLink = {
  url: string
};

export type RichTextUtils = {
  currentBlockContainsLink: ((editorState: EditorState) => boolean),
  getCurrentBlockType: ((editorState: EditorState) => DraftBlockType),
  getDataObjectForLinkURL: ((uri: URI) => DataObjectForLink),
  handleKeyCommand: ((editorState: EditorState, command: DraftEditorCommand | string) => EditorState | null),
  insertSoftNewline: ((editorState: EditorState) => EditorState),
  onBackspace: ((editorState: EditorState) => EditorState | null),
  onDelete: ((editorState: EditorState) => EditorState | null),
  onTab: ((event: React.KeyboardEvent, editorState: EditorState, maxDepth: number) => EditorState),
  toggleBlockType: ((editorState: EditorState, blockType: DraftBlockType) => EditorState),
  toggleCode: ((editorState: EditorState) => EditorState),
  toggleInlineStyle: ((editorState: EditorState, inlineStyle: string) => EditorState),
  toggleLink: ((
    editorState: EditorState,
    targetSelection: SelectionState,
    entityKey: string | null
  ) => EditorState),
  tryToRemoveBlockStyle: ((editorState: EditorState) => ContentState | null)
};
