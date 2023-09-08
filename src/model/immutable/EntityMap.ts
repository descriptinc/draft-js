/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {DraftEntityType} from '../entity/DraftEntityType';
import {DraftEntityMutability} from '../entity/DraftEntityMutability';
import uuid from '../../util/uuid';
import {
  DraftEntityInstance,
  makeDraftEntityInstance,
} from '../entity/DraftEntityInstance';
import invariant from '../../fbjs/invariant';

export type EntityMap = ReadonlyMap<string, DraftEntityInstance>;

export function createEntity(
  entityMap: EntityMap,
  type: DraftEntityType,
  mutability: DraftEntityMutability,
  data?: Record<string, unknown>,
): {entityKey: string; entityMap: EntityMap} {
  const entityKey = uuid();
  const newMap = new Map(entityMap);
  newMap.set(entityKey, makeDraftEntityInstance({type, mutability, data}));
  return {
    entityKey,
    entityMap: newMap,
  };
}

export function addEntity(
  entityMap: EntityMap,
  entityKey: string,
  instance: DraftEntityInstance,
): EntityMap {
  const newMap = new Map(entityMap);
  newMap.set(entityKey, instance);
  return newMap;
}

// eslint-disable-next-line prefer-const
export let getEntity = function getEntity(
  entityMap: EntityMap,
  key: string,
): DraftEntityInstance {
  const entity = entityMap.get(key);
  invariant(!!entity, 'Unknown DraftEntity key: %s.', key);
  return entity!;
};
