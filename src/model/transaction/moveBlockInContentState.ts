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
import {DraftInsertionType} from '../constants/DraftInsertionType';
import invariant from '../../fbjs/invariant';
import {
  flatMap,
  flatten,
  map,
  rest,
  skipUntil,
  takeUntil,
} from '../descript/Iterables';
import {BlockNode} from '../immutable/BlockNode';

const moveBlockInContentState = (
  contentState: ContentState,
  blockToBeMoved: BlockNode,
  targetBlock: BlockNode,
  insertionMode: DraftInsertionType,
): ContentState => {
  invariant(insertionMode !== 'replace', 'Replacing blocks is not supported.');

  const targetKey = targetBlock.key;
  const blockKey = blockToBeMoved.key;

  invariant(blockKey !== targetKey, 'Block cannot be moved next to itself.');

  const blockMap = contentState.blockMap;

  const blocksToBeMoved = [blockToBeMoved];
  const blockMapWithoutBlocksToBeMoved = new Map(
    flatMap(blockMap, ([k, block]): [string, BlockNode] | undefined =>
      k === blockKey ? undefined : [k, block],
    ),
  );

  const blocksBefore = takeUntil(
    blockMapWithoutBlocksToBeMoved,
    ([, v]) => v === targetBlock,
  );

  const blocksAfter = rest(
    skipUntil(blockMapWithoutBlocksToBeMoved, ([, v]) => v === targetBlock),
  );

  const slicedBlocks = map(blocksToBeMoved, (block): [string, BlockNode] => [
    block.key,
    block,
  ]);

  let newBlockMap = new Map();

  if (insertionMode === 'before') {
    const blockBefore = getBlockBefore(contentState, targetKey);

    invariant(
      !blockBefore || blockBefore.key !== blockToBeMoved.key,
      'Block cannot be moved next to itself.',
    );

    newBlockMap = new Map(
      flatten<[string, BlockNode]>([
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
    selectionBefore: contentState.selectionAfter,
    selectionAfter: {
      ...contentState.selectionAfter,
      anchorKey: blockKey,
      focusKey: blockKey,
    },
  };
};

export default moveBlockInContentState;
