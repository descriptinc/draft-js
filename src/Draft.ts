/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import DraftEditor from './component/base/DraftEditor.react';
import DraftEditorBlock from './component/contents/DraftEditorBlock.react';
import CompositeDraftDecorator from './model/decorators/CompositeDraftDecorator';
import DraftEntity from './model/entity/DraftEntity';
import AtomicBlockUtils from './model/modifier/AtomicBlockUtils';
import KeyBindingUtil from './component/utils/KeyBindingUtil';
import DraftModifier from './model/modifier/DraftModifier';
import RichTextEditorUtil from './model/modifier/RichTextEditorUtil';
import {DefaultDraftBlockRenderMap} from './model/immutable/DefaultDraftBlockRenderMap';
import {DefaultDraftInlineStyle} from './model/immutable/DefaultDraftInlineStyle';
import generateRandomKey from './model/keys/generateRandomKey';
import convertFromHTMLToContentBlocks from './model/encoding/convertFromHTMLToContentBlocks';
import getDefaultKeyBinding from './component/utils/getDefaultKeyBinding';
import getVisibleSelectionRect from './component/selection/getVisibleSelectionRect';

const DraftPublic = {
  Editor: DraftEditor,
  EditorBlock: DraftEditorBlock,

  CompositeDecorator: CompositeDraftDecorator,
  Entity: DraftEntity,

  AtomicBlockUtils,
  KeyBindingUtil,
  Modifier: DraftModifier,
  RichUtils: RichTextEditorUtil,

  DefaultDraftBlockRenderMap,
  DefaultDraftInlineStyle,

  convertFromHTML: convertFromHTMLToContentBlocks,
  // convertFromRaw: convertFromRawToDraftState,
  // convertToRaw: convertFromDraftStateToRaw,
  genKey: generateRandomKey,
  getDefaultKeyBinding,
  getVisibleSelectionRect,
};

export * from './model/immutable/BlockMapBuilder';
export * from './model/immutable/EditorState';
export * from './model/immutable/ContentState';
export * from './model/immutable/ContentBlock';
export * from './model/immutable/SelectionState';
export * from './model/immutable/BlockMap';
export * from './model/immutable/CharacterMetadata';
export * from './model/immutable/DraftInlineStyle';
export * from './model/immutable/findRangesImmutable';
export * from './model/immutable/ContentBlockNode';
export * from './model/immutable/BlockNode';
export * from './model/immutable/BlockTree';

export default DraftPublic;
