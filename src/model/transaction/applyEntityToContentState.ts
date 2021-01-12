/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import applyEntityToContentBlock, {
  applyEntityToMutableCharacterList,
} from './applyEntityToContentBlock';
import {
  makeBlockMapIndex,
  BlockMapIndex,
  mergeMapUpdates,
  BlockMap,
} from '../immutable/BlockMap';
import {BlockNode} from '../immutable/BlockNode';
import {CharacterMetadata} from '../immutable/CharacterMetadata';

function updateNewBlocksWithEntity(
  blockMap: BlockMap,
  blockMapIndex: BlockMapIndex,
  newCharacterLists: Map<string, CharacterMetadata[]>,
  selectionState: SelectionState,
  entityKey: string | null,
): void {
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  let blockKey: string | null = startKey;
  while (blockKey) {
    let characterList = newCharacterLists.get(blockKey);
    if (!characterList) {
      const existingBlock = blockMap.get(blockKey);
      if (!existingBlock) {
        throw new Error('Could not get block for key');
      }
      characterList = Array.from(existingBlock.characterList);
      newCharacterLists.set(blockKey, characterList);
    }

    const sliceStart = blockKey === startKey ? startOffset : 0;
    const sliceEnd = blockKey === endKey ? endOffset : characterList.length;
    applyEntityToMutableCharacterList(
      characterList,
      sliceStart,
      sliceEnd,
      entityKey,
    );
    if (blockKey === endKey) {
      return;
    }
    blockKey = blockMapIndex[blockKey];
  }
}

export default function applyEntityToContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  entityKey: string | null,
): ContentState {
  const blockMap = contentState.blockMap;
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  const iter = map(
    flatten<[string, BlockNode]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([blockKey, block]): [string, BlockNode] => {
      const sliceStart = blockKey === startKey ? startOffset : 0;
      const sliceEnd = blockKey === endKey ? endOffset : block.text.length;
      return [
        blockKey,
        applyEntityToContentBlock(block, sliceStart, sliceEnd, entityKey),
      ];
    },
  );

  const newBlocks: Record<string, BlockNode> = {};
  for (const [key, block] of iter) {
    newBlocks[key] = block;
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, newBlocks),
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  };
}

export function applyEntitiesToContentState(
  contentState: ContentState,
  entities: Iterable<[SelectionState, string | null]>,
): ContentState {
  const blockMap = contentState.blockMap;
  const blockMapIndex = makeBlockMapIndex(blockMap);
  const newCharacterLists = new Map<string, CharacterMetadata[]>();
  for (const [selectionState, entityKey] of entities) {
    updateNewBlocksWithEntity(
      blockMap,
      blockMapIndex,
      newCharacterLists,
      selectionState,
      entityKey,
    );
  }

  const newBlocks: Record<string, BlockNode> = {};
  for (const [key, list] of newCharacterLists) {
    const block = blockMap.get(key);
    if (!block) {
      throw new Error('Could not get block for key');
    }
    newBlocks[key] = {...block, characterList: list};
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, newBlocks),
  };
}
