/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {ContentState} from './ContentState';
import UnicodeBidiService from 'fbjs/lib/UnicodeBidiService';
import {nullthrows} from '../../fbjs/nullthrows';
import {map, some} from '../descript/Iterables';

let bidiService: UnicodeBidiService | undefined;

const EditorBidiService = {
  getDirectionMap: function(
    content: ContentState,
    prevBidiMap: ReadonlyMap<any, any> | null,
  ): ReadonlyMap<any, any> {
    if (!bidiService) {
      bidiService = new UnicodeBidiService();
    } else {
      bidiService.reset();
    }

    const blockMap = content.blockMap;

    let needsNewBidiMap = !prevBidiMap;
    if (!needsNewBidiMap) {
      needsNewBidiMap = blockMap.size !== prevBidiMap?.size;
    }
    if (!needsNewBidiMap) {
      needsNewBidiMap = some(blockMap, ([key, block]) => {
        return (
          !prevBidiMap!.has(key) ||
          prevBidiMap!.get(key) !==
            nullthrows(bidiService).getDirection(block.text)
        );
      });
    }
    if (!needsNewBidiMap && prevBidiMap) {
      return prevBidiMap;
    }

    return new Map(
      map(content.blockMap, ([blockKey, block]): [string, string] => [
        blockKey,
        nullthrows(bidiService).getDirection(block.text),
      ]),
    );
  },
};
export default EditorBidiService;
