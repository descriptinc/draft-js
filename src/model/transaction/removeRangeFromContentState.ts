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
import {blockIsExperimentalTreeBlock} from './exploration/getNextDelimiterBlockKey';
import {ContentBlock} from '../immutable/ContentBlock';
import {mergeBlockMap} from '../immutable/BlockMap';
import {BlockNode} from '../immutable/BlockNode';
import {
  filter,
  flatten,
  map,
  skipUntil,
  takeUntil,
} from '../descript/Iterables';
import {CharacterMetadata} from '../immutable/CharacterMetadata';

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
// /**
//  * Ancestors needs to be preserved when there are non selected
//  * children to make sure we do not leave any orphans behind
//  */
// const getAncestorsKeys = (
//   blockKey: string | null,
//   blockMap: BlockMap,
// ): Array<string> => {
//   const parents = [];
//
//   if (!blockKey) {
//     return parents;
//   }
//
//   let blockNode = blockMap.get(blockKey);
//   while (blockNode && blockNode.getParentKey()) {
//     const parentKey = blockNode.getParentKey();
//     if (parentKey) {
//       parents.push(parentKey);
//     }
//     blockNode = parentKey ? blockMap.get(parentKey) : null;
//   }
//
//   return parents;
// };
//
// /**
//  * Get all next delimiter keys until we hit a root delimiter and return
//  * an array of key references
//  */
// const getNextDelimitersBlockKeys = (
//   block: ContentBlockNode,
//   blockMap: BlockMap,
// ): Array<string> => {
//   const nextDelimiters = [];
//
//   if (!block) {
//     return nextDelimiters;
//   }
//
//   let nextDelimiter = getNextDelimiterBlockKey(block, blockMap);
//   while (nextDelimiter && blockMap.get(nextDelimiter)) {
//     const block = blockMap.get(nextDelimiter);
//     nextDelimiters.push(nextDelimiter);
//
//     // we do not need to keep checking all root node siblings, just the first occurance
//     nextDelimiter = block.getParentKey()
//       ? getNextDelimiterBlockKey(block, blockMap)
//       : null;
//   }
//
//   return nextDelimiters;
// };
//
// const getNextValidSibling = (
//   block: ContentBlockNode | null,
//   blockMap: BlockMap,
//   originalBlockMap: BlockMap,
// ): string | null => {
//   if (!block) {
//     return null;
//   }
//
//   // note that we need to make sure we refer to the original block since this
//   // function is called within a withMutations
//   let nextValidSiblingKey = originalBlockMap
//     .get(block.getKey())
//     .getNextSiblingKey();
//
//   while (nextValidSiblingKey && !blockMap.get(nextValidSiblingKey)) {
//     nextValidSiblingKey =
//       originalBlockMap.get(nextValidSiblingKey).getNextSiblingKey() || null;
//   }
//
//   return nextValidSiblingKey;
// };
//
// const getPrevValidSibling = (
//   block: ContentBlockNode | null,
//   blockMap: BlockMap,
//   originalBlockMap: BlockMap,
// ): string | null => {
//   if (!block) {
//     return null;
//   }
//
//   // note that we need to make sure we refer to the original block since this
//   // function is called within a withMutations
//   let prevValidSiblingKey = originalBlockMap
//     .get(block.getKey())
//     .getPrevSiblingKey();
//
//   while (prevValidSiblingKey && !blockMap.get(prevValidSiblingKey)) {
//     prevValidSiblingKey =
//       originalBlockMap.get(prevValidSiblingKey).getPrevSiblingKey() || null;
//   }
//
//   return prevValidSiblingKey;
// };
//
// const updateBlockMapLinks = (
//   blockMap: BlockMap,
//   startBlock: ContentBlockNode,
//   endBlock: ContentBlockNode,
//   originalBlockMap: BlockMap,
// ): BlockMap => {
//   return blockMap.withMutations(blocks => {
//     // update start block if its retained
//     transformBlock(startBlock.getKey(), blocks, block =>
//       block.merge({
//         nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//         prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//       }),
//     );
//
//     // update endblock if its retained
//     transformBlock(endBlock.getKey(), blocks, block =>
//       block.merge({
//         nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//         prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//       }),
//     );
//
//     // update start block parent ancestors
//     getAncestorsKeys(startBlock.getKey(), originalBlockMap).forEach(parentKey =>
//       transformBlock(parentKey, blocks, block =>
//         block.merge({
//           children: block.getChildKeys().filter(key => blocks.get(key)),
//           nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//           prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//         }),
//       ),
//     );
//
//     // update start block next - can only happen if startBlock == endBlock
//     transformBlock(startBlock.getNextSiblingKey(), blocks, block =>
//       block.merge({
//         prevSibling: startBlock.getPrevSiblingKey(),
//       }),
//     );
//
//     // update start block prev
//     transformBlock(startBlock.getPrevSiblingKey(), blocks, block =>
//       block.merge({
//         nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//       }),
//     );
//
//     // update end block next
//     transformBlock(endBlock.getNextSiblingKey(), blocks, block =>
//       block.merge({
//         prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//       }),
//     );
//
//     // update end block prev
//     transformBlock(endBlock.getPrevSiblingKey(), blocks, block =>
//       block.merge({
//         nextSibling: endBlock.getNextSiblingKey(),
//       }),
//     );
//
//     // update end block parent ancestors
//     getAncestorsKeys(endBlock.getKey(), originalBlockMap).forEach(parentKey => {
//       transformBlock(parentKey, blocks, block =>
//         block.merge({
//           children: block.getChildKeys().filter(key => blocks.get(key)),
//           nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//           prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//         }),
//       );
//     });
//
//     // update next delimiters all the way to a root delimiter
//     getNextDelimitersBlockKeys(endBlock, originalBlockMap).forEach(
//       delimiterKey =>
//         transformBlock(delimiterKey, blocks, block =>
//           block.merge({
//             nextSibling: getNextValidSibling(block, blocks, originalBlockMap),
//             prevSibling: getPrevValidSibling(block, blocks, originalBlockMap),
//           }),
//         ),
//     );
//
//     // if parent (startBlock) was deleted
//     if (
//       blockMap.get(startBlock.getKey()) == null &&
//       blockMap.get(endBlock.getKey()) != null &&
//       endBlock.getParentKey() === startBlock.getKey() &&
//       endBlock.getPrevSiblingKey() == null
//     ) {
//       const prevSiblingKey = startBlock.getPrevSiblingKey();
//       // endBlock becomes next sibling of parent's prevSibling
//       transformBlock(endBlock.getKey(), blocks, block =>
//         block.merge({
//           prevSibling: prevSiblingKey,
//         }),
//       );
//       transformBlock(prevSiblingKey, blocks, block =>
//         block.merge({
//           nextSibling: endBlock.getKey(),
//         }),
//       );
//
//       // Update parent for previous parent's children, and children for that parent
//       const prevSibling = prevSiblingKey ? blockMap.get(prevSiblingKey) : null;
//       const newParentKey = prevSibling ? prevSibling.getParentKey() : null;
//       startBlock.getChildKeys().forEach(childKey => {
//         transformBlock(childKey, blocks, block =>
//           block.merge({
//             parent: newParentKey, // set to null if there is no parent
//           }),
//         );
//       });
//       if (newParentKey != null) {
//         const newParent = blockMap.get(newParentKey);
//         transformBlock(newParentKey, blocks, block =>
//           block.merge({
//             children: newParent
//               .getChildKeys()
//               .concat(startBlock.getChildKeys()),
//           }),
//         );
//       }
//
//       // last child of deleted parent should point to next sibling
//       transformBlock(
//         startBlock.getChildKeys().find(key => {
//           const block = blockMap.get(key) as ContentBlockNode;
//           return block.getNextSiblingKey() === null;
//         }),
//         blocks,
//         block =>
//           block.merge({
//             nextSibling: startBlock.getNextSiblingKey(),
//           }),
//       );
//     }
//   });
// };

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

  // we assume that ContentBlockNode and ContentBlocks are not mixed together
  const isExperimentalTreeBlock = blockIsExperimentalTreeBlock(startBlock);

  // used to retain blocks that should not be deleted to avoid orphan children
  const parentAncestors: string[] = [];

  if (isExperimentalTreeBlock) {
    throw new Error('experimental tree block mode not implemented');
    // const endBlockchildrenKeys = endBlock.getChildKeys();
    // const endBlockAncestors = getAncestorsKeys(endKey, blockMap);
    //
    // // endBlock has unselected siblings so we can not remove its ancestors parents
    // if (endBlock.getNextSiblingKey()) {
    //   parentAncestors = parentAncestors.concat(endBlockAncestors);
    // }
    //
    // // endBlock has children so can not remove this block or any of its ancestors
    // if (!endBlockchildrenKeys.isEmpty()) {
    //   parentAncestors = parentAncestors.concat(
    //     endBlockAncestors.concat([endKey]),
    //   );
    // }
    //
    // // we need to retain all ancestors of the next delimiter block
    // parentAncestors = parentAncestors.concat(
    //   getAncestorsKeys(getNextDelimiterBlockKey(endBlock, blockMap), blockMap),
    // );
  }

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

  // If cursor (collapsed) is at the start of the first child, delete parent
  // instead of child
  // const shouldDeleteParent =
  //   isExperimentalTreeBlock &&
  //   startOffset === 0 &&
  //   endOffset === 0 &&
  //   endBlock.getParentKey() === startKey &&
  //   endBlock.getPrevSiblingKey() == null;

  // FIXME [mvp]: experimental tree block not implemented
  // const shouldDeleteParent = false;

  // const newBlocks = shouldDeleteParent
  //   ? new Map([[startKey, null]])

  const iter: Iterable<[string, ContentBlock | null]> = map(
    flatten<[string, ContentBlock | null]>([
      filter(
        takeUntil(
          skipUntil(blockMap, ([k]) => k === startKey),
          ([k]) => k === endKey,
        ),
        ([k]) => parentAncestors.indexOf(k) === -1,
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

  const updatedBlockMap = mergeBlockMap(blockMap, newBlocks);

  // Only update tree block pointers if the range is across blocks
  if (isExperimentalTreeBlock && startBlock !== endBlock) {
    throw new Error();
    // updatedBlockMap = updateBlockMapLinks(
    //   updatedBlockMap,
    //   startBlock,
    //   endBlock,
    //   blockMap,
    // );
  }

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
