/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {gkx} from '../../stubs/gkx';
import {EditorState} from '../immutable/EditorState';
import generateRandomKey from '../keys/generateRandomKey';

const experimentalTreeDataSupport = gkx('draft_tree_data_support');

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

    const targetSelection = afterRemoval.getSelectionAfter();
    const afterSplit = DraftModifier.splitBlock(afterRemoval, targetSelection);
    const insertionTarget = afterSplit.getSelectionAfter();

    const asAtomicBlock = DraftModifier.setBlockType(
      afterSplit,
      insertionTarget,
      'atomic',
    );

    const charData = CharacterMetadata.create({entity: entityKey});

    let atomicBlockConfig = {
      key: generateRandomKey(),
      type: 'atomic',
      text: character,
      characterList: List(Repeat(charData, character.length)),
    };

    let atomicDividerBlockConfig = {
      key: generateRandomKey(),
      type: 'unstyled',
    };

    if (experimentalTreeDataSupport) {
      atomicBlockConfig = {
        ...atomicBlockConfig,
        nextSibling: atomicDividerBlockConfig.key,
      };
      atomicDividerBlockConfig = {
        ...atomicDividerBlockConfig,
        prevSibling: atomicBlockConfig.key,
      };
    }

    const fragmentArray = [
      new ContentBlockRecord(atomicBlockConfig),
      new ContentBlockRecord(atomicDividerBlockConfig),
    ];

    const fragment = BlockMapBuilder.createFromArray(fragmentArray);

    const withAtomicBlock = DraftModifier.replaceWithFragment(
      asAtomicBlock,
      insertionTarget,
      fragment,
    );

    const newContent = withAtomicBlock.merge({
      selectionBefore: selectionState,
      selectionAfter: withAtomicBlock.getSelectionAfter().set('hasFocus', true),
    });

    return EditorState.push(editorState, newContent, 'insert-fragment');
  },

  moveAtomicBlock: function(
    editorState: EditorState,
    atomicBlock: BlockNodeRecord,
    targetRange: SelectionState,
    insertionMode?: DraftInsertionType,
  ): EditorState {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();

    let withMovedAtomicBlock;

    if (insertionMode === 'before' || insertionMode === 'after') {
      const targetBlock = contentState.getBlockForKey(
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

      const selectionAfterRemoval = afterRemoval.getSelectionAfter();
      const targetBlock = afterRemoval.getBlockForKey(
        selectionAfterRemoval.getFocusKey(),
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

        const selectionAfterSplit = afterSplit.getSelectionAfter();
        const targetBlock = afterSplit.getBlockForKey(
          selectionAfterSplit.getFocusKey(),
        );

        withMovedAtomicBlock = moveBlockInContentState(
          afterSplit,
          atomicBlock,
          targetBlock,
          'before',
        );
      }
    }

    const newContent = withMovedAtomicBlock.merge({
      selectionBefore: selectionState,
      selectionAfter: withMovedAtomicBlock
        .getSelectionAfter()
        .set('hasFocus', true),
    });

    return EditorState.push(editorState, newContent, 'move-block');
  },
};
export default AtomicBlockUtils;