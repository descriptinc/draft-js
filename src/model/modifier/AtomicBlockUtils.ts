/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {EditorState, pushContent} from '../immutable/EditorState';
import generateRandomKey from '../keys/generateRandomKey';
import DraftModifier from './DraftModifier';
import {makeCharacterMetadata} from '../immutable/CharacterMetadata';
import {repeat} from '../descript/Iterables';
import {createFromArray} from '../immutable/BlockMapBuilder';
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  SelectionState,
  setHasFocus,
} from '../immutable/SelectionState';
import {DraftInsertionType} from '../constants/DraftInsertionType';
import {getBlockForKey} from '../immutable/ContentState';
import moveBlockInContentState from '../transaction/moveBlockInContentState';
import {makeContentBlock} from '../immutable/ContentBlock';
import {BlockNode} from '../immutable/BlockNode';

const AtomicBlockUtils = {
  insertAtomicBlock: function(
    editorState: EditorState,
    entityKey: string,
    character: string,
  ): EditorState {
    const contentState = editorState.currentContent;
    const selectionState = editorState.selection;

    const afterRemoval = DraftModifier.removeRange(
      contentState,
      selectionState,
      'backward',
    );

    const targetSelection = afterRemoval.selectionAfter;
    const afterSplit = DraftModifier.splitBlock(afterRemoval, targetSelection);
    const insertionTarget = afterSplit.selectionAfter;

    const asAtomicBlock = DraftModifier.setBlockType(
      afterSplit,
      insertionTarget,
      'atomic',
    );

    const charData = makeCharacterMetadata({entity: entityKey});

    const atomicBlockConfig = {
      key: generateRandomKey(),
      type: 'atomic',
      text: character,
      characterList: Array.from(repeat(character.length, charData)),
    };

    const atomicDividerBlockConfig = {
      key: generateRandomKey(),
      type: 'unstyled',
    };

    const fragmentArray = [
      makeContentBlock(atomicBlockConfig),
      makeContentBlock(atomicDividerBlockConfig),
    ];

    const fragment = createFromArray(fragmentArray);

    const withAtomicBlock = DraftModifier.replaceWithFragment(
      asAtomicBlock,
      insertionTarget,
      fragment,
    );

    const newContent = {
      ...withAtomicBlock,
      selectionBefore: selectionState,
      selectionAfter: setHasFocus(withAtomicBlock.selectionAfter, true),
    };

    return pushContent(editorState, newContent, 'insert-fragment');
  },

  moveAtomicBlock: function(
    editorState: EditorState,
    atomicBlock: BlockNode,
    targetRange: SelectionState,
    insertionMode: DraftInsertionType | null = null,
  ): EditorState {
    const contentState = editorState.currentContent;
    const selectionState = editorState.selection;

    let withMovedAtomicBlock;

    if (insertionMode === 'before' || insertionMode === 'after') {
      const targetBlock = getBlockForKey(
        contentState,
        insertionMode === 'before'
          ? getStartKey(targetRange)
          : getEndKey(targetRange),
      );

      withMovedAtomicBlock = moveBlockInContentState(
        contentState,
        atomicBlock,
        targetBlock,
        insertionMode,
      );
    } else {
      const afterRemoval = DraftModifier.removeRange(
        contentState,
        targetRange,
        'backward',
      );

      const selectionAfterRemoval = afterRemoval.selectionAfter;
      const targetBlock = getBlockForKey(
        afterRemoval,
        selectionAfterRemoval.focusKey,
      );

      if (getStartOffset(selectionAfterRemoval) === 0) {
        withMovedAtomicBlock = moveBlockInContentState(
          afterRemoval,
          atomicBlock,
          targetBlock,
          'before',
        );
      } else if (
        getEndOffset(selectionAfterRemoval) === targetBlock.text.length
      ) {
        withMovedAtomicBlock = moveBlockInContentState(
          afterRemoval,
          atomicBlock,
          targetBlock,
          'after',
        );
      } else {
        const afterSplit = DraftModifier.splitBlock(
          afterRemoval,
          selectionAfterRemoval,
        );

        const selectionAfterSplit = afterSplit.selectionAfter;
        const targetBlock = getBlockForKey(
          afterSplit,
          selectionAfterSplit.focusKey,
        );

        withMovedAtomicBlock = moveBlockInContentState(
          afterSplit,
          atomicBlock,
          targetBlock,
          'before',
        );
      }
    }

    const newContent = {
      ...withMovedAtomicBlock,
      selectionBefore: selectionState,
      selectionAfter: setHasFocus(withMovedAtomicBlock.selectionAfter, true),
    };

    return pushContent(editorState, newContent, 'move-block');
  },
};
export default AtomicBlockUtils;
