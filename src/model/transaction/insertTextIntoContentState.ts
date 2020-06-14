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
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import invariant from '../../fbjs/invariant';
import {CharacterMetadata} from '../immutable/CharacterMetadata';
import {times} from '../descript/Iterables';
import {mergeMapUpdates} from '../immutable/BlockMap';

function insertTextIntoContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  text: string,
  characterMetadata: CharacterMetadata,
): ContentState {
  invariant(
    isCollapsed(selectionState),
    '`insertText` should only be called with a collapsed range.',
  );

  let len: number | null = null;
  if (text != null) {
    len = text.length;
  }

  if (len == null || len === 0) {
    return contentState;
  }

  const blockMap = contentState.blockMap;
  const key = getStartKey(selectionState);
  const offset = getStartOffset(selectionState);
  const block = blockMap.get(key)!;
  const blockText = block.text;

  const newBlock = {
    ...block,
    text: blockText.slice(0, offset) + text + blockText.slice(offset),
    characterList: [
      ...block.characterList.slice(0, offset),
      ...times(len, () => characterMetadata),
      ...block.characterList.slice(offset),
    ],
  };

  const newOffset = offset + len;

  return {
    ...contentState,
    blockMap: mergeMapUpdates(blockMap, {[key]: newBlock}),
    selectionAfter: {
      ...selectionState,
      anchorOffset: newOffset,
      focusOffset: newOffset,
    },
  };
}

export default insertTextIntoContentState;
