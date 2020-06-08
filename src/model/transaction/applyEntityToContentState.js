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

import type ContentState from 'ContentState';
import type SelectionState from 'SelectionState';

const applyEntityToContentBlock = require('applyEntityToContentBlock');

function applyEntityToContentState(
  contentState: ContentState,
  selectionState: SelectionState,
  entityKey: ?string,
): ContentState {
  const blockMap = contentState.getBlockMap();
  const startKey = selectionState.getStartKey();
  const startOffset = selectionState.getStartOffset();
  const endKey = selectionState.getEndKey();
  const endOffset = selectionState.getEndOffset();

  let newBlocks: ?Seq.Keyed<ContentBlock>;
  if (startKey !== endKey) {
    newBlocks = blockMap
      .toSeq()
      .skipUntil((_, k) => k === startKey)
      .takeUntil((_, k) => k === endKey)
      .map((block: ContentBlock, blockKey: string) => {
        const sliceStart = blockKey === startKey ? startOffset : 0;
        const sliceEnd = block.getLength();
        return applyEntityToContentBlock(
          block,
          sliceStart,
          sliceEnd,
          entityKey,
        );
      });
  }

  return contentState.merge({
    blockMap: blockMap.merge(newBlocks, {
      [endKey]: applyEntityToContentBlock(
        blockMap.get(endKey),
        endKey === startKey ? startOffset : 0,
        endOffset,
        entityKey,
      ),
    }),
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  });
}

module.exports = applyEntityToContentState;
