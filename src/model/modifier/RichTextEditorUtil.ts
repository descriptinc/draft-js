/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {DataObjectForLink, RichTextUtils} from './RichTextUtils';
import {
  EditorState,
  forceSelection,
  getCurrentInlineStyle,
  pushContent,
  setInlineStyleOverride,
} from '../immutable/EditorState';
import {DraftBlockType} from '../constants/DraftBlockType';
import {
  ContentState,
  getBlockAfter,
  getBlockBefore,
  getBlockForKey,
  getEntityMap,
} from '../immutable/ContentState';
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import {DraftEditorCommand} from '../constants/DraftEditorCommand';
import DraftModifier from './DraftModifier';
import {mergeMapUpdates} from '../immutable/BlockMap';
import adjustBlockDepthForContentState from '../transaction/adjustBlockDepthForContentState';
import {skipUntil, some, takeUntil} from '../descript/Iterables';
import {
  inlineStyleWith,
  inlineStyleWithout,
} from '../immutable/DraftInlineStyle';

const RichTextEditorUtil: RichTextUtils = {
  currentBlockContainsLink: function(editorState: EditorState): boolean {
    const selection = editorState.selection;
    const contentState = editorState.currentContent;
    const entityMap = getEntityMap(contentState);
    return getBlockForKey(contentState, selection.anchorKey)
      .characterList.slice(getStartOffset(selection), getEndOffset(selection))
      .some(v => {
        const entity = v.entity;
        return !!entity && entityMap.__get(entity).type === 'LINK';
      });
  },

  getCurrentBlockType: function(editorState: EditorState): DraftBlockType {
    const selection = editorState.selection;
    return getBlockForKey(editorState.currentContent, getStartKey(selection))
      .type;
  },

  getDataObjectForLinkURL: function(uri: any): DataObjectForLink {
    return {url: uri.toString()};
  },

  handleKeyCommand: function(
    editorState: EditorState,
    command: DraftEditorCommand | string,
  ): EditorState | null {
    switch (command) {
      case 'bold':
        return RichTextEditorUtil.toggleInlineStyle(editorState, 'BOLD');
      case 'italic':
        return RichTextEditorUtil.toggleInlineStyle(editorState, 'ITALIC');
      case 'underline':
        return RichTextEditorUtil.toggleInlineStyle(editorState, 'UNDERLINE');
      case 'code':
        return RichTextEditorUtil.toggleCode(editorState);
      case 'backspace':
      case 'backspace-word':
      case 'backspace-to-start-of-line':
        return RichTextEditorUtil.onBackspace(editorState);
      case 'delete':
      case 'delete-word':
      case 'delete-to-end-of-block':
        return RichTextEditorUtil.onDelete(editorState);
      default:
        // they may have custom editor commands; ignore those
        return null;
    }
  },

  insertSoftNewline: function(editorState: EditorState): EditorState {
    const contentState = DraftModifier.insertText(
      editorState.currentContent,
      editorState.selection,
      '\n',
      getCurrentInlineStyle(editorState),
      null,
    );

    const newEditorState = pushContent(
      editorState,
      contentState,
      'insert-characters',
    );

    return forceSelection(newEditorState, contentState.selectionAfter);
  },

  /**
   * For collapsed selections at the start of styled blocks, backspace should
   * just remove the existing style.
   */
  onBackspace: function(editorState: EditorState): EditorState | null {
    const selection = editorState.selection;
    if (
      !isCollapsed(selection) ||
      selection.anchorOffset ||
      selection.focusOffset
    ) {
      return null;
    }

    // First, try to remove a preceding atomic block.
    const content = editorState.currentContent;
    const startKey = getStartKey(selection);
    const blockBefore = getBlockBefore(content, startKey);

    if (blockBefore && blockBefore.type === 'atomic') {
      const blockMap = mergeMapUpdates(content.blockMap, {
        [blockBefore.key]: null,
      });
      const withoutAtomicBlock = {
        ...content,
        blockMap,
        selectionAfter: selection,
      };
      // FIXME [correctness]: how could this check ever be false?
      if (withoutAtomicBlock !== content) {
        return pushContent(editorState, withoutAtomicBlock, 'remove-range');
      }
    }

    // If that doesn't succeed, try to remove the current block style.
    const withoutBlockStyle = RichTextEditorUtil.tryToRemoveBlockStyle(
      editorState,
    );

    if (withoutBlockStyle) {
      return pushContent(editorState, withoutBlockStyle, 'change-block-type');
    }

    return null;
  },

  onDelete: function(editorState: EditorState): EditorState | null {
    const selection = editorState.selection;
    if (!isCollapsed(selection)) {
      return null;
    }

    const content = editorState.currentContent;
    const startKey = getStartKey(selection);
    const block = getBlockForKey(content, startKey);
    const length = block.text.length;

    // The cursor is somewhere within the text. Behave normally.
    if (getStartOffset(selection) < length) {
      return null;
    }

    const blockAfter = getBlockAfter(content, startKey);

    if (!blockAfter || blockAfter.type !== 'atomic') {
      return null;
    }

    const atomicBlockTarget = {
      ...selection,
      focusKey: blockAfter.key,
      focusOffset: blockAfter.text.length,
    };

    const withoutAtomicBlock = DraftModifier.removeRange(
      content,
      atomicBlockTarget,
      'forward',
    );

    if (withoutAtomicBlock !== content) {
      return pushContent(editorState, withoutAtomicBlock, 'remove-range');
    }

    return null;
  },

  onTab: function(
    event: React.KeyboardEvent,
    editorState: EditorState,
    maxDepth: number,
  ): EditorState {
    const selection = editorState.selection;
    const key = selection.anchorKey;
    if (key !== selection.focusKey) {
      return editorState;
    }

    const content = editorState.currentContent;
    const block = getBlockForKey(content, key);
    const type = block.type;
    if (type !== 'unordered-list-item' && type !== 'ordered-list-item') {
      return editorState;
    }

    event.preventDefault();

    const depth = block.depth;
    if (!event.shiftKey && depth === maxDepth) {
      return editorState;
    }

    const withAdjustment = adjustBlockDepthForContentState(
      content,
      selection,
      event.shiftKey ? -1 : 1,
      maxDepth,
    );

    return pushContent(editorState, withAdjustment, 'adjust-depth');
  },

  toggleBlockType: function(
    editorState: EditorState,
    blockType: DraftBlockType,
  ): EditorState {
    const selection = editorState.selection;
    const startKey = getStartKey(selection);
    let endKey = getEndKey(selection);
    const content = editorState.currentContent;
    let target = selection;

    // Triple-click can lead to a selection that includes offset 0 of the
    // following block. The `SelectionState` for this case is accurate, but
    // we should avoid toggling block type for the trailing block because it
    // is a confusing interaction.
    if (startKey !== endKey && getEndOffset(selection) === 0) {
      const blockBefore = getBlockBefore(content, endKey)!;
      endKey = blockBefore.key;
      target = {
        ...target,
        anchorKey: startKey,
        anchorOffset: getStartOffset(selection),
        focusKey: endKey,
        focusOffset: blockBefore.text.length,
        isBackward: false,
      };
    }

    const hasAtomicBlock =
      content.blockMap.get(endKey)!.type === 'atomic' ||
      some(
        takeUntil(
          skipUntil(content.blockMap, ([k]) => k === startKey),
          ([k]) => k === endKey,
        ),
        ([, block]) => block.type === 'atomic',
      );

    if (hasAtomicBlock) {
      return editorState;
    }

    const typeToSet =
      getBlockForKey(content, startKey).type === blockType
        ? 'unstyled'
        : blockType;

    return pushContent(
      editorState,
      DraftModifier.setBlockType(content, target, typeToSet),
      'change-block-type',
    );
  },

  toggleCode: function(editorState: EditorState): EditorState {
    const selection = editorState.selection;
    const {anchorKey, focusKey} = selection;

    if (isCollapsed(selection) || anchorKey !== focusKey) {
      return RichTextEditorUtil.toggleBlockType(editorState, 'code-block');
    }

    return RichTextEditorUtil.toggleInlineStyle(editorState, 'CODE');
  },

  /**
   * Toggle the specified inline style for the selection. If the
   * user's selection is collapsed, apply or remove the style for the
   * internal state. If it is not collapsed, apply the change directly
   * to the document state.
   */
  toggleInlineStyle: function(
    editorState: EditorState,
    inlineStyle: string,
  ): EditorState {
    const selection = editorState.selection;
    const currentStyle = getCurrentInlineStyle(editorState);

    // If the selection is collapsed, toggle the specified style on or off and
    // set the result as the new inline style override. This will then be
    // used as the inline style for the next character to be inserted.
    if (isCollapsed(selection)) {
      return setInlineStyleOverride(
        editorState,
        currentStyle.has(inlineStyle)
          ? inlineStyleWithout(currentStyle, inlineStyle)
          : inlineStyleWith(currentStyle, inlineStyle),
      );
    }

    // If characters are selected, immediately apply or remove the
    // inline style on the document state itself.
    const content = editorState.currentContent;
    let newContent;

    // If the style is already present for the selection range, remove it.
    // Otherwise, apply it.
    if (currentStyle.has(inlineStyle)) {
      newContent = DraftModifier.removeInlineStyle(
        content,
        selection,
        inlineStyle,
      );
    } else {
      newContent = DraftModifier.applyInlineStyle(
        content,
        selection,
        inlineStyle,
      );
    }

    return pushContent(editorState, newContent, 'change-inline-style');
  },

  toggleLink: function(
    editorState: EditorState,
    targetSelection: SelectionState,
    entityKey: string | null,
  ): EditorState {
    const withoutLink = DraftModifier.applyEntity(
      editorState.currentContent,
      targetSelection,
      entityKey,
    );

    return pushContent(editorState, withoutLink, 'apply-entity');
  },

  /**
   * When a collapsed cursor is at the start of a styled block, changes block
   * type to 'unstyled'. Returns null if selection does not meet that criteria.
   */
  tryToRemoveBlockStyle: function(
    editorState: EditorState,
  ): ContentState | null {
    const selection = editorState.selection;
    const offset = selection.anchorOffset;
    if (isCollapsed(selection) && offset === 0) {
      const key = selection.anchorKey;
      const content = editorState.currentContent;
      const block = getBlockForKey(content, key);

      const type = block.type;
      const blockBefore = getBlockBefore(content, key);
      if (
        type === 'code-block' &&
        blockBefore &&
        blockBefore.type === 'code-block' &&
        blockBefore.text.length !== 0
      ) {
        return null;
      }

      if (type !== 'unstyled') {
        return DraftModifier.setBlockType(content, selection, 'unstyled');
      }
    }
    return null;
  },
};
export default RichTextEditorUtil;
