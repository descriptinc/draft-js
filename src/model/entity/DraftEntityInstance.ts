/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @legacyServerCallableInstance
 * @format
 * @emails oncall+draft_js
 */

import {DraftEntityType} from './DraftEntityType';
import {DraftEntityMutability} from './DraftEntityMutability';

/**
 * An instance of a document entity, consisting of a `type` and relevant
 * `data`, metadata about the entity.
 *
 * For instance, a "link" entity might provide a URI, and a "mention"
 * entity might provide the mentioned user's ID. These pieces of data
 * may be used when rendering the entity as part of a ContentBlock DOM
 * representation. For a link, the data would be used as an href for
 * the rendered anchor. For a mention, the ID could be used to retrieve
 * a hovercard.
 */
export type DraftEntityInstance = Readonly<{
  type: DraftEntityType;
  mutability: DraftEntityMutability;
  data: Readonly<Record<string, any>>;
}>;

const EMPTY_OBJECT = {};

export function makeDraftEntityInstance({
  type = 'TOKEN',
  mutability = 'IMMUTABLE',
  data = EMPTY_OBJECT,
}: Partial<DraftEntityInstance>): DraftEntityInstance {
  return {
    type,
    mutability,
    data,
  };
}
