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
import modifyBlockForContentState from './modifyBlockForContentState';
import {flatten, rest, skipUntil, takeUntil} from '../descript/Iterables';
import {ContentBlock} from '../immutable/ContentBlock';

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
    flatten<[string, ContentBlock]>([
      blocksBefore,
      [
        [key, blockAbove],
        [keyBelow, blockBelow],
      ],
      blocksAfter,
    ]),
  );

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
