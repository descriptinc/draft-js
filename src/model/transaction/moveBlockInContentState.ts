/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {
  ContentState,
  getBlockAfter,
  getBlockBefore,
} from '../immutable/ContentState';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {DraftInsertionType} from '../constants/DraftInsertionType';
import invariant from '../../fbjs/invariant';
import {blockIsExperimentalTreeBlock} from './exploration/getNextDelimiterBlockKey';
import {
  flatMap,
  flatten,
  map,
  rest,
  skipUntil,
  takeUntil,
} from '../descript/Iterables';

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

// const updateBlockMapLinks = (
//   blockMap: BlockMap,
//   originalBlockToBeMoved: BlockNodeRecord,
//   originalTargetBlock: BlockNodeRecord,
//   insertionMode: DraftInsertionType,
//   isExperimentalTreeBlock: boolean,
// ): BlockMap => {
//   if (!isExperimentalTreeBlock) {
//     return blockMap;
//   }
//   throw new Error('not implemented');
//   //
//   // // possible values of 'insertionMode' are: 'after', 'before'
//   // const isInsertedAfterTarget = insertionMode === 'after';
//   //
//   // const originalBlockKey = originalBlockToBeMoved.getKey();
//   // const originalTargetKey = originalTargetBlock.getKey();
//   // const originalParentKey = originalBlockToBeMoved.getParentKey();
//   // const originalNextSiblingKey = originalBlockToBeMoved.getNextSiblingKey();
//   // const originalPrevSiblingKey = originalBlockToBeMoved.getPrevSiblingKey();
//   // const newParentKey = originalTargetBlock.getParentKey();
//   // const newNextSiblingKey = isInsertedAfterTarget
//   //   ? originalTargetBlock.getNextSiblingKey()
//   //   : originalTargetKey;
//   // const newPrevSiblingKey = isInsertedAfterTarget
//   //   ? originalTargetKey
//   //   : originalTargetBlock.getPrevSiblingKey();
//   //
//   // return blockMap.withMutations(blocks => {
//   //   // update old parent
//   //   transformBlock(originalParentKey, blocks, block => {
//   //     const parentChildrenList = block.getChildKeys();
//   //     return block.merge({
//   //       children: parentChildrenList.delete(
//   //         parentChildrenList.indexOf(originalBlockKey),
//   //       ),
//   //     });
//   //   });
//   //
//   //   // update old prev
//   //   transformBlock(originalPrevSiblingKey, blocks, block =>
//   //     block.merge({
//   //       nextSibling: originalNextSiblingKey,
//   //     }),
//   //   );
//   //
//   //   // update old next
//   //   transformBlock(originalNextSiblingKey, blocks, block =>
//   //     block.merge({
//   //       prevSibling: originalPrevSiblingKey,
//   //     }),
//   //   );
//   //
//   //   // update new next
//   //   transformBlock(newNextSiblingKey, blocks, block =>
//   //     block.merge({
//   //       prevSibling: originalBlockKey,
//   //     }),
//   //   );
//   //
//   //   // update new prev
//   //   transformBlock(newPrevSiblingKey, blocks, block =>
//   //     block.merge({
//   //       nextSibling: originalBlockKey,
//   //     }),
//   //   );
//   //
//   //   // update new parent
//   //   transformBlock(newParentKey, blocks, block => {
//   //     const newParentChildrenList = block.getChildKeys();
//   //     const targetBlockIndex = newParentChildrenList.indexOf(originalTargetKey);
//   //
//   //     const insertionIndex = isInsertedAfterTarget
//   //       ? targetBlockIndex + 1
//   //       : targetBlockIndex !== 0
//   //       ? targetBlockIndex - 1
//   //       : 0;
//   //
//   //     const newChildrenArray = newParentChildrenList.toArray();
//   //     newChildrenArray.splice(insertionIndex, 0, originalBlockKey);
//   //
//   //     return block.merge({
//   //       children: List(newChildrenArray),
//   //     });
//   //   });
//   //
//   //   // update block
//   //   transformBlock(originalBlockKey, blocks, block =>
//   //     block.merge({
//   //       nextSibling: newNextSiblingKey,
//   //       prevSibling: newPrevSiblingKey,
//   //       parent: newParentKey,
//   //     }),
//   //   );
//   // });
// };

const moveBlockInContentState = (
  contentState: ContentState,
  blockToBeMoved: BlockNodeRecord,
  targetBlock: BlockNodeRecord,
  insertionMode: DraftInsertionType,
): ContentState => {
  invariant(insertionMode !== 'replace', 'Replacing blocks is not supported.');

  const targetKey = targetBlock.key;
  const blockKey = blockToBeMoved.key;

  invariant(blockKey !== targetKey, 'Block cannot be moved next to itself.');

  const blockMap = contentState.blockMap;
  const isExperimentalTreeBlock = blockIsExperimentalTreeBlock(blockToBeMoved);
  if (isExperimentalTreeBlock) {
    throw new Error('not implemented');
  }

  const blocksToBeMoved = [blockToBeMoved];
  const blockMapWithoutBlocksToBeMoved = new Map(
    flatMap(blockMap, ([k, block]): [string, BlockNodeRecord] | undefined =>
      k === blockKey ? undefined : [k, block],
    ),
  );

  // if (isExperimentalTreeBlock) {
  //   blocksToBeMoved = [];
  //   blockMapWithoutBlocksToBeMoved = blockMap.withMutations(blocks => {
  //     const nextSiblingKey = blockToBeMoved.getNextSiblingKey();
  //     const nextDelimiterBlockKey = getNextDelimiterBlockKey(
  //       blockToBeMoved,
  //       blocks,
  //     );
  //
  //     blocks
  //       .toSeq()
  //       .skipUntil(block => block.getKey() === blockKey)
  //       .takeWhile(block => {
  //         const key = block.getKey();
  //         const isBlockToBeMoved = key === blockKey;
  //         const hasNextSiblingAndIsNotNextSibling =
  //           nextSiblingKey && key !== nextSiblingKey;
  //         const doesNotHaveNextSiblingAndIsNotDelimiter =
  //           !nextSiblingKey &&
  //           block.getParentKey() &&
  //           (!nextDelimiterBlockKey || key !== nextDelimiterBlockKey);
  //
  //         return !!(
  //           isBlockToBeMoved ||
  //           hasNextSiblingAndIsNotNextSibling ||
  //           doesNotHaveNextSiblingAndIsNotDelimiter
  //         );
  //       })
  //       .forEach(block => {
  //         blocksToBeMoved.push(block);
  //         blocks.delete(block.getKey());
  //       });
  //   });
  // }

  const blocksBefore = takeUntil(
    blockMapWithoutBlocksToBeMoved,
    ([, v]) => v === targetBlock,
  );

  const blocksAfter = rest(
    skipUntil(blockMapWithoutBlocksToBeMoved, ([, v]) => v === targetBlock),
  );

  const slicedBlocks = map(blocksToBeMoved, (block): [
    string,
    BlockNodeRecord,
  ] => [block.key, block]);

  let newBlockMap = new Map();

  if (insertionMode === 'before') {
    const blockBefore = getBlockBefore(contentState, targetKey);

    invariant(
      !blockBefore || blockBefore.key !== blockToBeMoved.key,
      'Block cannot be moved next to itself.',
    );

    newBlockMap = new Map(
      flatten<[string, BlockNodeRecord]>([
        blocksBefore,
        slicedBlocks,
        [[targetKey, targetBlock]],
        blocksAfter,
      ]),
    );
  } else if (insertionMode === 'after') {
    const blockAfter = getBlockAfter(contentState, targetKey);

    invariant(
      !blockAfter || blockAfter.key !== blockKey,
      'Block cannot be moved next to itself.',
    );

    newBlockMap = new Map(
      flatten([
        blocksBefore,
        [[targetKey, targetBlock]],
        slicedBlocks,
        blocksAfter,
      ]),
    );
  }

  return {
    ...contentState,
    blockMap: newBlockMap,
    // blockMap: updateBlockMapLinks(
    //   newBlocks,
    //   blockToBeMoved,
    //   targetBlock,
    //   insertionMode,
    //   isExperimentalTreeBlock,
    // ),
    selectionBefore: contentState.selectionAfter,
    selectionAfter: {
      ...contentState.selectionAfter,
      anchorKey: blockKey,
      focusKey: blockKey,
    },
  };
};

export default moveBlockInContentState;
