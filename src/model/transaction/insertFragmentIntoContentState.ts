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
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import {BlockMap, mergeMapUpdates} from '../immutable/BlockMap';
import {first, last, slice} from '../descript/Iterables';
import {createFromArray} from '../immutable/BlockMapBuilder';
import invariant from '../../fbjs/invariant';
import randomizeBlockMapKeys from './randomizeBlockMapKeys';
import {BlockNode} from '../immutable/BlockNode';

export type BlockDataMergeBehavior =
  | 'REPLACE_WITH_NEW_DATA'
  | 'MERGE_OLD_DATA_TO_NEW_DATA';

const updateExistingBlock = (
  contentState: ContentState,
  selectionState: SelectionState,
  blockMap: BlockMap,
  fragmentBlock: BlockNode,
  targetKey: string,
  targetOffset: number,
  mergeBlockData: BlockDataMergeBehavior = 'REPLACE_WITH_NEW_DATA',
): ContentState => {
  const targetBlock = blockMap.get(targetKey)!;
  const text = targetBlock.text;
  const chars = targetBlock.characterList;
  const finalKey = targetKey;
  const finalOffset = targetOffset + fragmentBlock.text.length;

  let data: Readonly<Record<string, any>> | null = null;

  switch (mergeBlockData) {
    case 'MERGE_OLD_DATA_TO_NEW_DATA':
      data = {
        ...fragmentBlock,
        ...targetBlock.data,
      };
      break;
    case 'REPLACE_WITH_NEW_DATA':
      data = fragmentBlock.data;
      break;
  }

  let type = targetBlock.type;
  if (text && type === 'unstyled') {
    type = fragmentBlock.type;
  }

  const newBlock = {
    ...targetBlock,
    text:
      text.slice(0, targetOffset) +
      fragmentBlock.text +
      text.slice(targetOffset),
    characterList: [
      ...chars.slice(0, targetOffset),
      ...fragmentBlock.characterList,
      ...chars.slice(targetOffset),
    ],
    type,
    data,
  };

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, {[targetKey]: newBlock}),
    selectionBefore: selectionState,
    selectionAfter: {
      ...selectionState,
      anchorKey: finalKey,
      anchorOffset: finalOffset,
      focusKey: finalKey,
      focusOffset: finalOffset,
      isBackward: false,
    },
  };
};

/**
 * Appends text/characterList from the fragment first block to
 * target block.
 */
const updateHead = (
  block: BlockNode,
  targetOffset: number,
  fragment: BlockMap,
): BlockNode => {
  const text = block.text;
  const chars = block.characterList;

  // Modify head portion of block.
  const headText = text.slice(0, targetOffset);
  const headCharacters = chars.slice(0, targetOffset);
  const appendToHead = first(fragment.values())!;

  return {
    ...block,
    text: headText + appendToHead.text,
    characterList: headCharacters.concat(appendToHead.characterList),
    type: headText ? block.type : appendToHead.type,
    data: appendToHead.data,
  };
};

/**
 * Appends offset text/characterList from the target block to the last
 * fragment block.
 */
const updateTail = (
  block: BlockNode,
  targetOffset: number,
  fragment: BlockMap,
): BlockNode => {
  // Modify tail portion of block.
  const text = block.text;
  const chars = block.characterList;

  // Modify head portion of block.
  const blockSize = text.length;
  const tailText = text.slice(targetOffset, blockSize);
  const tailCharacters = chars.slice(targetOffset, blockSize);
  const prependToTail = last(fragment.values())!;

  return {
    ...prependToTail,
    text: prependToTail.text + tailText,
    characterList: prependToTail.characterList.concat(tailCharacters),
    data: prependToTail.data,
  };
};

const insertFragment = (
  contentState: ContentState,
  selectionState: SelectionState,
  blockMap: BlockMap,
  fragment: BlockMap,
  targetKey: string,
  targetOffset: number,
): ContentState => {
  const newBlockArr: BlockNode[] = [];
  const fragmentSize = fragment.size;
  const tail = last(fragment.values())!;
  const finalOffset = tail.text.length;
  const finalKey = tail.key;
  const shouldNotUpdateFromFragmentBlock = false;

  blockMap.forEach((block, blockKey) => {
    if (blockKey !== targetKey) {
      newBlockArr.push(block);
      return;
    }

    if (shouldNotUpdateFromFragmentBlock) {
      newBlockArr.push(block);
    } else {
      newBlockArr.push(updateHead(block, targetOffset, fragment));
    }

    // Insert fragment blocks after the head and before the tail.

    // when we are updating the target block with the head fragment block we skip the first fragment
    // head since its contents have already been merged with the target block otherwise we include
    // the whole fragment
    for (const fragmentBlock of slice(
      fragment.values(),
      shouldNotUpdateFromFragmentBlock ? 0 : 1,
      fragmentSize - 1,
    )) {
      newBlockArr.push(fragmentBlock);
    }

    // update tail
    newBlockArr.push(updateTail(block, targetOffset, fragment));
  });

  const updatedBlockMap = createFromArray(newBlockArr);

  return {
    ...contentState,
    blockMap: updatedBlockMap,
    selectionBefore: selectionState,
    selectionAfter: {
      ...selectionState,
      anchorKey: finalKey,
      anchorOffset: finalOffset,
      focusKey: finalKey,
      focusOffset: finalOffset,
      isBackward: false,
    },
  };
};

const insertFragmentIntoContentState = (
  contentState: ContentState,
  selectionState: SelectionState,
  fragmentBlockMap: BlockMap,
  mergeBlockData: BlockDataMergeBehavior = 'REPLACE_WITH_NEW_DATA',
): ContentState => {
  invariant(
    isCollapsed(selectionState),
    '`insertFragment` should only be called with a collapsed selection state.',
  );

  const blockMap = contentState.blockMap;
  const fragment = randomizeBlockMapKeys(fragmentBlockMap);
  const targetKey = getStartKey(selectionState);
  const targetOffset = getStartOffset(selectionState);

  // When we insert a fragment with a single block we simply update the target block
  // with the contents of the inserted fragment block
  if (fragment.size === 1) {
    return updateExistingBlock(
      contentState,
      selectionState,
      blockMap,
      first(fragment.values())!,
      targetKey,
      targetOffset,
      mergeBlockData,
    );
  }

  return insertFragment(
    contentState,
    selectionState,
    blockMap,
    fragment,
    targetKey,
    targetOffset,
  );
};
export default insertFragmentIntoContentState;
