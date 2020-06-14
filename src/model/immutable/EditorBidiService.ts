/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {ContentState} from './ContentState';

let bidiService: UnicodeBidiService | undefined;

const EditorBidiService = {
  getDirectionMap: function(
    content: ContentState,
    prevBidiMap: Map<any, any> | null,
  ): Map<any, any> {
    if (!bidiService) {
      bidiService = new UnicodeBidiService();
    } else {
      bidiService.reset();
    }

    const blockMap = content.getBlockMap();
    const nextBidi = blockMap
      .valueSeq()
      .map(block => nullthrows(bidiService).getDirection(block.text));
    const bidiMap = OrderedMap(blockMap.keySeq().zip(nextBidi));

    if (prevBidiMap != null && Immutable.is(prevBidiMap, bidiMap)) {
      return prevBidiMap;
    }

    return bidiMap;
  },
};
export default EditorBidiService;
