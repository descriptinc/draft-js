/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

'use strict';

import {ContentState} from './ContentState';
import {BlockNodeRecord} from './BlockNodeRecord';
import {DraftDecoratorType} from '../decorators/DraftDecoratorType';
import {getRange} from '../descript/RangeCache';
import {findRangesImmutable} from './findRangesImmutable';
import {map} from '../descript/Iterables';
import {CharacterMetadata} from './CharacterMetadata';

const returnTrue = function() {
  return true;
};

type LeafRange = Readonly<{
  start: number;
  end: number;
}>;

type DecoratorRange = LeafRange &
  Readonly<{
    decoratorKey: string | null;
    leaves: readonly LeafRange[];
  }>;

function makeDecoratorRange(
  start: number,
  end: number,
  decoratorKey: string | null,
  leaves: readonly LeafRange[],
): DecoratorRange {
  return {
    start,
    end,
    decoratorKey,
    leaves,
  };
}

const BlockTree = {
  /**
   * Generate a block tree for a given ContentBlock/decorator pair.
   */
  generate: function(
    contentState: ContentState,
    block: BlockNodeRecord,
    decorator: DraftDecoratorType | null,
  ): readonly DecoratorRange[] {
    const textLength = block.text.length;
    if (!textLength) {
      return [makeDecoratorRange(0, 0, null, [getRange(0, 0)])];
    }

    const leafSets: DecoratorRange[] = [];
    const decorations = decorator
      ? decorator.getDecorations(block, contentState)
      : new Array(textLength).fill(null);

    const chars = block.characterList;

    findRangesImmutable(decorations, areEqual, returnTrue, (start, end) => {
      leafSets.push(
        makeDecoratorRange(
          start,
          end,
          decorations[start],
          generateLeaves(chars.slice(start, end), start),
        ),
      );
    });

    return leafSets;
  },
};

/**
 * Generate LeafRange records for a given character list.
 */
function generateLeaves(
  characters: readonly CharacterMetadata[],
  offset: number,
): readonly LeafRange[] {
  const leaves: LeafRange[] = [];
  findRangesImmutable(
    map(characters, ({style}) => style),
    areEqual,
    returnTrue,
    (start, end) => {
      leaves.push(getRange(start + offset, end + offset));
    },
  );
  return leaves;
}

function areEqual(a: any, b: any): boolean {
  return a === b;
}

module.exports = BlockTree;
