/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {DraftDecorator} from './DraftDecorator';
import {ContentState} from '../immutable/ContentState';
import {BlockNode} from '../immutable/BlockNode';
import {ComponentType} from 'react';

const DELIMITER = '.';

/**
 * A CompositeDraftDecorator traverses through a list of DraftDecorator
 * instances to identify sections of a ContentBlock that should be rendered
 * in a "decorated" manner. For example, hashtags, mentions, and links may
 * be intended to stand out visually, be rendered as anchors, etc.
 *
 * The list of decorators supplied to the constructor will be used in the
 * order they are provided. This allows the caller to specify a priority for
 * string matching, in case of match collisions among decorators.
 *
 * For instance, I may have a link with a `#` in its text. Though this section
 * of text may match our hashtag decorator, it should not be treated as a
 * hashtag. I should therefore list my link DraftDecorator
 * before my hashtag DraftDecorator when constructing this composite
 * decorator instance.
 *
 * Thus, when a collision like this is encountered, the earlier match is
 * preserved and the new match is discarded.
 */
export default class CompositeDraftDecorator {
  _decorators: ReadonlyArray<DraftDecorator>;

  constructor(decorators: ReadonlyArray<DraftDecorator>) {
    // Copy the decorator array, since we use this array order to determine
    // precedence of decoration matching. If the array is mutated externally,
    // we don't want to be affected here.
    this._decorators = decorators.slice();
  }

  getDecorations(
    block: BlockNode,
    contentState: ContentState,
  ): readonly (string | null)[] {
    const decorations = new Array(block.text.length).fill(null);

    this._decorators.forEach((decorator, ii) => {
      let counter = 0;
      const strategy = decorator.strategy;
      const callback = (start: number, end: number) => {
        // Find out if any of our matching range is already occupied
        // by another decorator. If so, discard the match. Otherwise, store
        // the component key for rendering.
        if (canOccupySlice(decorations, start, end)) {
          occupySlice(decorations, start, end, ii + DELIMITER + counter);
          counter++;
        }
      };
      strategy(block, callback, contentState);
    });

    return decorations;
  }

  getComponentForKey(key: string): ComponentType {
    const componentKey = parseInt(key.split(DELIMITER)[0], 10);
    return this._decorators[componentKey].component;
  }

  getPropsForKey(key: string): Record<string, unknown> | null {
    const componentKey = parseInt(key.split(DELIMITER)[0], 10);
    return this._decorators[componentKey].props || null;
  }
}

/**
 * Determine whether we can occupy the specified slice of the decorations
 * array.
 */
function canOccupySlice(
  decorations: Array<string | null>,
  start: number,
  end: number,
): boolean {
  for (let ii = start; ii < end; ii++) {
    if (decorations[ii] != null) {
      return false;
    }
  }
  return true;
}

/**
 * Splice the specified component into our decoration array at the desired
 * range.
 */
function occupySlice(
  targetArr: Array<string | null>,
  start: number,
  end: number,
  componentKey: string,
): void {
  for (let ii = start; ii < end; ii++) {
    targetArr[ii] = componentKey;
  }
}
