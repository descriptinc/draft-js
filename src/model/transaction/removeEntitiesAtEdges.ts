/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {ContentState} from '../immutable/ContentState';
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  SelectionState,
} from '../immutable/SelectionState';
import DraftEntity from '../entity/DraftEntity';
import {ContentBlock} from '../immutable/ContentBlock';
import {mergeMapUpdates} from '../immutable/BlockMap';
import {applyEntity, CharacterMetadata} from '../immutable/CharacterMetadata';
import {findRangesImmutable} from '../immutable/findRangesImmutable';
import invariant from '../../fbjs/invariant';
import {DraftRange} from '../modifier/DraftRange';
import {EntityMap} from '../immutable/EntityMap';
import {BlockNode} from '../immutable/BlockNode';

export default function removeEntitiesAtEdges(
  contentState: ContentState,
  selectionState: SelectionState,
): ContentState {
  const blockMap = contentState.blockMap;
  const entityMap = DraftEntity;

  const updatedBlocks: Record<string, ContentBlock> = {};

  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const startBlock = blockMap.get(startKey)!;
  const updatedStart = removeForBlock(entityMap, startBlock, startOffset);

  if (updatedStart !== startBlock) {
    updatedBlocks[startKey] = updatedStart;
  }

  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);
  let endBlock = blockMap.get(endKey)!;
  if (startKey === endKey) {
    endBlock = updatedStart;
  }

  const updatedEnd = removeForBlock(entityMap, endBlock, endOffset);

  if (updatedEnd !== endBlock) {
    updatedBlocks[endKey] = updatedEnd;
  }

  if (!Object.keys(updatedBlocks).length) {
    return {
      ...contentState,
      selectionAfter: selectionState,
    };
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, updatedBlocks),
    selectionAfter: selectionState,
  };
}

/**
 * Given a list of characters and an offset that is in the middle of an entity,
 * returns the start and end of the entity that is overlapping the offset.
 * Note: This method requires that the offset be in an entity range.
 */
function getRemovalRange(
  characters: readonly CharacterMetadata[],
  entityKey: string | null,
  offset: number,
): {
  start: number;
  end: number;
} {
  let removalRange: DraftRange | undefined;

  // Iterates through a list looking for ranges of matching items
  // based on the 'isEqual' callback.
  // Then instead of returning the result, call the 'found' callback
  // with each range.
  // Then filters those ranges based on the 'filter' callback
  //
  // Here we use it to find ranges of characters with the same entity key.
  findRangesImmutable(
    characters, // the list to iterate through
    (a, b) => a.entity === b.entity, // 'isEqual' callback
    element => element.entity === entityKey, // 'filter' callback
    (start: number, end: number) => {
      // 'found' callback
      if (start <= offset && end >= offset) {
        // this entity overlaps the offset index
        removalRange = {start, end};
      }
    },
  );
  invariant(
    typeof removalRange === 'object',
    'Removal range must exist within character list.',
  );
  return removalRange!;
}

function removeForBlock(
  entityMap: EntityMap,
  block: BlockNode,
  offset: number,
): BlockNode {
  const chars = block.characterList;
  const charBefore = offset > 0 ? chars[offset - 1] : undefined;
  const charAfter = offset < chars.length ? chars[offset] : undefined;
  const entityBeforeCursor = charBefore ? charBefore.entity : undefined;
  const entityAfterCursor = charAfter ? charAfter.entity : undefined;

  if (entityAfterCursor && entityAfterCursor === entityBeforeCursor) {
    const entity = entityMap.__get(entityAfterCursor);
    if (entity.mutability !== 'MUTABLE') {
      let {start, end} = getRemovalRange(chars, entityAfterCursor, offset);
      let current;
      if (start < end) {
        const newChars = [...chars];
        while (start < end) {
          current = chars[start];
          newChars[start] = applyEntity(current, null);
          start++;
        }
        // FIXME [perf]: only update char list if it changes?
        return {
          ...block,
          characterList: newChars,
        };
      }
    }
  }

  return block;
}
