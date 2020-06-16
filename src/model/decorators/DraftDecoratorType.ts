/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {BlockNodeRecord} from '../immutable/BlockNodeRecord';
import {ContentState} from '../immutable/ContentState';

/**
 * An interface for document decorator classes, allowing the creation of
 * custom decorator classes.
 *
 * See `CompositeDraftDecorator` for the most common use case.
 */
export type DraftDecoratorType = {
  /**
   * Given a `ContentBlock`, return an immutable List of decorator keys.
   */
  getDecorations: (
    block: BlockNodeRecord,
    contentState: ContentState,
  ) => readonly (string | null)[];
  /**
   * Given a decorator key, return the component to use when rendering
   * this decorated range.
   */
  getComponentForKey: (key: string) => Function;
  /**
   * Given a decorator key, optionally return the props to use when rendering
   * this decorated range.
   */
  getPropsForKey: (key: string) => Object | null;
};
