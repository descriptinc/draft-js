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
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import {ContentBlock} from '../immutable/ContentBlock';
import {mergeMapUpdates} from '../immutable/BlockMap';
import {BlockNode} from '../immutable/BlockNode';
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import {CharacterMetadata} from '../immutable/CharacterMetadata';

const removeRangeFromContentState = (
  contentState: ContentState,
  selectionState: SelectionState,
): ContentState => {
  if (isCollapsed(selectionState)) {
    return contentState;
  }

  const blockMap = contentState.blockMap;
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  const startBlock = blockMap.get(startKey)!;
  const endBlock = blockMap.get(endKey)!;

  let characterList;

  if (startBlock === endBlock) {
    characterList = removeFromList(
      startBlock.characterList,
      startOffset,
      endOffset,
    );
  } else {
    characterList = startBlock.characterList
      .slice(0, startOffset)
      .concat(endBlock.characterList.slice(endOffset));
  }

  const modifiedStart = {
    ...startBlock,
    text:
      startBlock.text.slice(0, startOffset) + endBlock.text.slice(endOffset),
    characterList,
  } as ContentBlock;

  const iter: Iterable<[string, ContentBlock | null]> = map(
    flatten<[string, ContentBlock | null]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, null]],
    ]),
    ([k]): [string, ContentBlock | null] =>
      k === startKey ? [k, modifiedStart] : [k, null],
  );

  const newBlocks: Record<string, BlockNode | null> = {};
  for (const [key, block] of iter) {
    newBlocks[key] = block;
  }

  const updatedBlockMap = mergeMapUpdates(blockMap, newBlocks);

  return {
    ...contentState,
    blockMap: updatedBlockMap,
    selectionBefore: selectionState,
    selectionAfter: {
      ...selectionState,
      anchorKey: startKey,
      anchorOffset: startOffset,
      focusKey: startKey,
      focusOffset: startOffset,
      isBackward: false,
    },
  };
};

/**
 * Maintain persistence for target list when removing characters on the
 * head and tail of the character list.
 */
const removeFromList = (
  targetList: readonly CharacterMetadata[],
  startOffset: number,
  endOffset: number,
): readonly CharacterMetadata[] => {
  if (startOffset === 0) {
    while (startOffset < endOffset) {
      targetList = targetList.slice(1);
      startOffset++;
    }
  } else if (endOffset === targetList.length) {
    while (endOffset > startOffset) {
      targetList = targetList.slice(0, targetList.length - 1);
      endOffset--;
    }
  } else {
    const head = targetList.slice(0, startOffset);
    const tail = targetList.slice(endOffset);
    targetList = head.concat(tail);
  }
  return targetList;
};

export default removeRangeFromContentState;
