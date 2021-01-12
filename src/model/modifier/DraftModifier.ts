/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {ContentState, getBlockForKey} from '../immutable/ContentState';
import {
  getEndOffset,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import {DraftInlineStyle} from '../immutable/DraftInlineStyle';
import modifyBlockForContentState from '../transaction/modifyBlockForContentState';
import {DraftBlockType} from '../constants/DraftBlockType';
import removeEntitiesAtEdges from '../transaction/removeEntitiesAtEdges';
import removeRangeFromContentState from '../transaction/removeRangeFromContentState';
import {makeCharacterMetadata} from '../immutable/CharacterMetadata';
import insertTextIntoContentState from '../transaction/insertTextIntoContentState';
import invariant from '../../fbjs/invariant';
import getContentStateFragment from '../transaction/getContentStateFragment';
import {BlockMap} from '../immutable/BlockMap';
import insertFragmentIntoContentState, {
  BlockDataMergeBehavior,
} from '../transaction/insertFragmentIntoContentState';
import {DraftRemovalDirection} from '../constants/DraftRemovalDirection';
import {getEntityAt} from '../immutable/ContentBlock';
import getCharacterRemovalRange from './getCharacterRemovalRange';
import DraftEntity from '../entity/DraftEntity';
import splitBlockInContentState from '../transaction/splitBlockInContentState';
import ContentStateInlineStyle from '../transaction/ContentStateInlineStyle';
import applyEntityToContentState, {
  applyEntitiesToContentState,
} from '../transaction/applyEntityToContentState';

/**
 * `DraftModifier` provides a set of convenience methods that apply
 * modifications to a `ContentState` object based on a target `SelectionState`.
 *
 * Any change to a `ContentState` should be decomposable into a series of
 * transaction functions that apply the required changes and return output
 * `ContentState` objects.
 *
 * These functions encapsulate some of the most common transaction sequences.
 */
const DraftModifier = {
  replaceText: function(
    contentState: ContentState,
    rangeToReplace: SelectionState,
    text: string,
    inlineStyle?: DraftInlineStyle,
    entityKey?: string | null,
  ): ContentState {
    const withoutEntities = removeEntitiesAtEdges(contentState, rangeToReplace);
    const withoutText = removeRangeFromContentState(
      withoutEntities,
      rangeToReplace,
    );

    const character = makeCharacterMetadata({
      style: inlineStyle,
      entity: entityKey || null,
    });

    return insertTextIntoContentState(
      withoutText,
      withoutText.selectionAfter,
      text,
      character,
    );
  },

  insertText: function(
    contentState: ContentState,
    targetRange: SelectionState,
    text: string,
    inlineStyle?: DraftInlineStyle,
    entityKey?: string | null,
  ): ContentState {
    invariant(
      isCollapsed(targetRange),
      'Target range must be collapsed for `insertText`.',
    );
    return DraftModifier.replaceText(
      contentState,
      targetRange,
      text,
      inlineStyle,
      entityKey,
    );
  },

  moveText: function(
    contentState: ContentState,
    removalRange: SelectionState,
    targetRange: SelectionState,
  ): ContentState {
    const movedFragment = getContentStateFragment(contentState, removalRange);

    const afterRemoval = DraftModifier.removeRange(
      contentState,
      removalRange,
      'backward',
    );

    return DraftModifier.replaceWithFragment(
      afterRemoval,
      targetRange,
      movedFragment,
    );
  },

  replaceWithFragment: function(
    contentState: ContentState,
    targetRange: SelectionState,
    fragment: BlockMap,
    mergeBlockData: BlockDataMergeBehavior = 'REPLACE_WITH_NEW_DATA',
  ): ContentState {
    const withoutEntities = removeEntitiesAtEdges(contentState, targetRange);
    const withoutText = removeRangeFromContentState(
      withoutEntities,
      targetRange,
    );

    return insertFragmentIntoContentState(
      withoutText,
      withoutText.selectionAfter,
      fragment,
      mergeBlockData,
    );
  },

  removeRange: function(
    contentState: ContentState,
    rangeToRemove: SelectionState,
    removalDirection: DraftRemovalDirection,
  ): ContentState {
    if (rangeToRemove.isBackward) {
      rangeToRemove = {
        ...rangeToRemove,
        anchorKey: rangeToRemove.focusKey,
        anchorOffset: rangeToRemove.focusOffset,
        focusKey: rangeToRemove.anchorKey,
        focusOffset: rangeToRemove.anchorOffset,
        isBackward: false,
      };
    }
    const startKey = rangeToRemove.anchorKey;
    const endKey = rangeToRemove.focusKey;
    const startBlock = getBlockForKey(contentState, startKey);
    const endBlock = getBlockForKey(contentState, endKey);
    const startOffset = getStartOffset(rangeToRemove);
    const endOffset = getEndOffset(rangeToRemove);

    const startEntityKey = getEntityAt(startBlock, startOffset);
    const endEntityKey = getEntityAt(endBlock, endOffset - 1);

    // Check whether the selection state overlaps with a single entity.
    // If so, try to remove the appropriate substring of the entity text.
    if (startKey === endKey) {
      if (startEntityKey && startEntityKey === endEntityKey) {
        const adjustedRemovalRange = getCharacterRemovalRange(
          DraftEntity,
          startBlock,
          endBlock,
          rangeToRemove,
          removalDirection,
        );
        return removeRangeFromContentState(contentState, adjustedRemovalRange);
      }
    }

    const withoutEntities = removeEntitiesAtEdges(contentState, rangeToRemove);
    return removeRangeFromContentState(withoutEntities, rangeToRemove);
  },

  splitBlock: function(
    contentState: ContentState,
    selectionState: SelectionState,
  ): ContentState {
    const withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    const withoutText = removeRangeFromContentState(
      withoutEntities,
      selectionState,
    );

    return splitBlockInContentState(withoutText, withoutText.selectionAfter);
  },

  applyInlineStyle: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string,
  ): ContentState {
    return ContentStateInlineStyle.add(
      contentState,
      selectionState,
      inlineStyle,
    );
  },

  removeInlineStyle: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string,
  ): ContentState {
    return ContentStateInlineStyle.remove(
      contentState,
      selectionState,
      inlineStyle,
    );
  },

  setBlockType: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockType: DraftBlockType,
  ): ContentState {
    return modifyBlockForContentState(contentState, selectionState, block => ({
      ...block,
      type: blockType,
      depth: 0,
    }));
  },

  setBlockData: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockData: Map<any, any>,
  ): ContentState {
    return modifyBlockForContentState(contentState, selectionState, block => ({
      ...block,
      data: blockData,
    }));
  },

  mergeBlockData: function(
    contentState: ContentState,
    selectionState: SelectionState,
    blockData: Map<any, any>,
  ): ContentState {
    return modifyBlockForContentState(contentState, selectionState, block => ({
      ...block,
      data: {...block.data, ...blockData},
    }));
  },

  applyEntity: function(
    contentState: ContentState,
    selectionState: SelectionState,
    entityKey: string | null,
  ): ContentState {
    const withoutEntities = removeEntitiesAtEdges(contentState, selectionState);
    return applyEntityToContentState(
      withoutEntities,
      selectionState,
      entityKey,
    );
  },

  applyEntities: function(
    contentState: ContentState,
    entities: Iterable<[SelectionState, string | null]>,
  ): ContentState {
    return applyEntitiesToContentState(contentState, entities);
  },
};

export default DraftModifier;
