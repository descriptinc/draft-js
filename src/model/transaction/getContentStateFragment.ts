/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+draft_js
 */

'use strict';

import {ContentState} from '../immutable/ContentState';
import {BlockMap} from '../immutable/BlockMap';
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  SelectionState,
} from '../immutable/SelectionState';
import removeEntitiesAtEdges from './removeEntitiesAtEdges';
import {findIndex, map, slice} from '../descript/Iterables';
import randomizeBlockMapKeys from './randomizeBlockMapKeys';
import {createFromArray} from '../immutable/BlockMapBuilder';

const getContentStateFragment = (
  contentState: ContentState,
  selectionState: SelectionState,
): BlockMap => {
  const startKey = getStartKey(selectionState);
  const startOffset = getStartOffset(selectionState);
  const endKey = getEndKey(selectionState);
  const endOffset = getEndOffset(selectionState);

  // Edge entities should be stripped to ensure that we don't preserve
  // invalid partial entities when the fragment is reused. We do, however,
  // preserve entities that are entirely within the selection range.
  const contentWithoutEdgeEntities = removeEntitiesAtEdges(
    contentState,
    selectionState,
  );

  const blockMap = contentWithoutEdgeEntities.blockMap;
  const startIndex = findIndex(blockMap.keys(), k => k === startKey)!;
  const endIndex = findIndex(blockMap.keys(), k => k === endKey)! + 1;

  return randomizeBlockMapKeys(
    createFromArray(
      map(slice(blockMap, startIndex, endIndex), ([blockKey, block]) => {
        const text = block.text;
        const chars = block.characterList;

        if (startKey === endKey) {
          return {
            ...block,
            text: text.slice(startOffset, endOffset),
            characterList: chars.slice(startOffset, endOffset),
          };
        }

        if (blockKey === startKey) {
          return {
            ...block,
            text: text.slice(startOffset),
            characterList: chars.slice(startOffset),
          };
        }

        if (blockKey === endKey) {
          return {
            ...block,
            text: text.slice(0, endOffset),
            characterList: chars.slice(0, endOffset),
          };
        }

        return block;
      }),
    ),
  );
};
export default getContentStateFragment;
