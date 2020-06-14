/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {ContentState} from '../immutable/ContentState';
import {isCollapsed, SelectionState} from '../immutable/SelectionState';
import invariant from '../../fbjs/invariant';
import generateRandomKey from '../keys/generateRandomKey';
import {blockIsExperimentalTreeBlock} from './exploration/getNextDelimiterBlockKey';
import modifyBlockForContentState from './modifyBlockForContentState';
import {flatten, rest, skipUntil, takeUntil} from '../descript/Iterables';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';

// const transformBlock = (
//   key: string | null,
//   blockMap: BlockMap,
//   func: (block: ContentBlockNode) => ContentBlockNode,
// ): void => {
//   if (!key) {
//     return;
//   }
//
//   const block = blockMap.get(key);
//
//   if (!block) {
//     return;
//   }
//
//   blockMap.set(key, func(block));
// };
//
// const updateBlockMapLinks = (
//   blockMap: BlockMap,
//   originalBlock: ContentBlockNode,
//   belowBlock: ContentBlockNode,
// ): BlockMap => {
//   return blockMap.withMutations(blocks => {
//     const originalBlockKey = originalBlock.getKey();
//     const belowBlockKey = belowBlock.getKey();
//
//     // update block parent
//     transformBlock(originalBlock.getParentKey(), blocks, block => {
//       const parentChildrenList = block.getChildKeys();
//       const insertionIndex = parentChildrenList.indexOf(originalBlockKey) + 1;
//       const newChildrenArray = parentChildrenList.toArray();
//
//       newChildrenArray.splice(insertionIndex, 0, belowBlockKey);
//
//       return block.merge({
//         children: List(newChildrenArray),
//       });
//     });
//
//     // update original next block
//     transformBlock(originalBlock.getNextSiblingKey(), blocks, block =>
//       block.merge({
//         prevSibling: belowBlockKey,
//       }),
//     );
//
//     // update original block
//     transformBlock(originalBlockKey, blocks, block =>
//       block.merge({
//         nextSibling: belowBlockKey,
//       }),
//     );
//
//     // update below block
//     transformBlock(belowBlockKey, blocks, block =>
//       block.merge({
//         prevSibling: originalBlockKey,
//       }),
//     );
//   });
// };
//
const splitBlockInContentState = (
  contentState: ContentState,
  selectionState: SelectionState,
): ContentState => {
  invariant(isCollapsed(selectionState), 'Selection range must be collapsed.');

  const key = selectionState.anchorKey;
  const blockMap = contentState.blockMap;
  const blockToSplit = blockMap.get(key)!;
  const text = blockToSplit.text;

  if (!text) {
    const blockType = blockToSplit.type;
    if (
      blockType === 'unordered-list-item' ||
      blockType === 'ordered-list-item'
    ) {
      return modifyBlockForContentState(contentState, selectionState, block => {
        if (block.type !== 'unstyled' || block.depth !== 0) {
          return {
            ...block,
            type: 'unstyled',
            depth: 0,
          };
        }
        return block;
      });
    }
  }

  const offset = selectionState.anchorOffset;
  const chars = blockToSplit.characterList;
  const keyBelow = generateRandomKey();
  const isExperimentalTreeBlock = blockIsExperimentalTreeBlock(blockToSplit);
  if (isExperimentalTreeBlock) {
    throw new Error('isExperimentalTreeBlock unimplemented');
  }

  const blockAbove = {
    ...blockToSplit,
    text: text.slice(0, offset),
    characterList: chars.slice(0, offset),
  };
  const blockBelow = {
    ...blockAbove,
    key: keyBelow,
    text: text.slice(offset),
    characterList: chars.slice(offset),
    data: new Map(),
  };
  const blocksBefore = takeUntil(
    blockMap,
    ([, block]) => block === blockToSplit,
  );
  const blocksAfter = rest(
    skipUntil(blockMap, ([, block]) => block === blockToSplit),
  );

  const newBlockMap = new Map(
    flatten<[string, BlockNodeRecord]>([
      blocksBefore,
      [
        [key, blockAbove],
        [keyBelow, blockBelow],
      ],
      blocksAfter,
    ]),
  );

  // if (isExperimentalTreeBlock) {
  //   invariant(
  //     blockToSplit.getChildKeys().isEmpty(),
  //     'ContentBlockNode must not have children',
  //   );
  //
  //   newBlocks = updateBlockMapLinks(newBlocks, blockAbove, blockBelow);
  // }

  return {
    ...contentState,
    blockMap: newBlockMap,
    selectionBefore: selectionState,
    selectionAfter: {
      ...selectionState,
      anchorKey: keyBelow,
      anchorOffset: 0,
      focusKey: keyBelow,
      focusOffset: 0,
      isBackward: false,
    },
  };
};

export default splitBlockInContentState;
