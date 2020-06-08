/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+draft_js
 */

'use strict';

import type ContentState from 'ContentState';

const UnicodeBidiService = require('UnicodeBidiService');

const Immutable = require('immutable');
const nullthrows = require('nullthrows');

const {OrderedMap} = Immutable;

let bidiService;

const EditorBidiService = {
  getDirectionMap: function(
    content: ContentState,
    prevBidiMap: ?OrderedMap<any, any>,
  ): OrderedMap<any, any> {
    if (!bidiService) {
      bidiService = new UnicodeBidiService();
    } else {
      bidiService.reset();
    }

    const blockMap = content.getBlockMap();

    let needsNewBidiMap = !prevBidiMap;
    if (!needsNewBidiMap) {
      needsNewBidiMap = blockMap.count() !== prevBidiMap.count();
    }
    if (!needsNewBidiMap) {
      needsNewBidiMap = Boolean(
        blockMap.find((block: ContentBlock, key: string) => {
          return (
            !prevBidiMap.has(key) ||
            prevBidiMap.get(key) !==
              nullthrows(bidiService).getDirection(block.getText())
          );
        }),
      );
    }
    if (!needsNewBidiMap) {
      return prevBidiMap;
    }

    const nextBidi = blockMap
      .valueSeq()
      .map(block => nullthrows(bidiService).getDirection(block.getText()));
    return OrderedMap(blockMap.keySeq().zip(nextBidi));
  },
};

module.exports = EditorBidiService;
