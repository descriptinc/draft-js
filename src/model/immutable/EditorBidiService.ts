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
import fastDeepEqual from 'fast-deep-equal/es6';
import {map} from '../descript/Iterables';

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

    const bidiMap = new Map(
      map(content.blockMap, ([blockKey, block]): [string, string] => [
        blockKey,
        nullthrows(bidiService).getDirection(block.text),
      ]),
    );

    if (prevBidiMap != null && fastDeepEqual(prevBidiMap, bidiMap)) {
      return prevBidiMap;
    }

    return bidiMap;
  },
};
export default EditorBidiService;
