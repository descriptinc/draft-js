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
import {flatten, map, skipUntil, takeUntil} from '../descript/Iterables';
import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {applyStyle, removeStyle} from '../immutable/CharacterMetadata';
import {mergeMapUpdates} from '../immutable/BlockMap';

const ContentStateInlineStyle = {
  add: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string,
  ): ContentState {
    return modifyInlineStyle(contentState, selectionState, inlineStyle, true);
  },

  remove: function(
    contentState: ContentState,
    selectionState: SelectionState,
    inlineStyle: string,
  ): ContentState {
    return modifyInlineStyle(contentState, selectionState, inlineStyle, false);
  },
};

function modifyInlineStyle(
  contentState: ContentState,
  selectionState: SelectionState,
  inlineStyle: string,
  addOrRemove: boolean,
): ContentState {
  const blockMap = contentState.blockMap;
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  const iter = map(
    flatten<[string, BlockNodeRecord]>([
      takeUntil(
        skipUntil(blockMap, ([k]) => k === startKey),
        ([k]) => k === endKey,
      ),
      [[endKey, blockMap.get(endKey)!]],
    ]),
    ([blockKey, block]): [string, BlockNodeRecord] => {
      let sliceStart;
      let sliceEnd;

      if (startKey === endKey) {
        sliceStart = startOffset;
        sliceEnd = endOffset;
      } else {
        sliceStart = blockKey === startKey ? startOffset : 0;
        sliceEnd = blockKey === endKey ? endOffset : block.text.length;
      }

      if (sliceStart >= sliceEnd) {
        return [blockKey, block];
      }

      const chars = [...block.characterList];
      while (sliceStart < sliceEnd) {
        const current = chars[sliceStart];
        chars[sliceStart] = addOrRemove
          ? applyStyle(current, inlineStyle)
          : removeStyle(current, inlineStyle);
        sliceStart++;
      }

      return [
        blockKey,
        {
          ...block,
          characterList: chars,
        },
      ];
    },
  );

  const newBlocks: Record<string, BlockNodeRecord> = {};
  for (const [blockKey, block] of iter) {
    newBlocks[blockKey] = block;
  }

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, newBlocks),
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  };
}
export default ContentStateInlineStyle;
