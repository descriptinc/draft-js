/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {ContentState} from '../immutable/ContentState';
import {getEntity} from '../immutable/EntityMap';

export default function updateEntityDataInContentState(
  contentState: ContentState,
  key: string,
  data: {[K in string]: unknown},
  merge: boolean,
): ContentState {
  const instance = getEntity(contentState.entityMap, key);
  const entityData = instance.data;
  const newData = merge ? {...entityData, ...data} : data;
  const newInstance = {...instance, data: newData};

  const newEntityMap = new Map(contentState.entityMap);
  newEntityMap.set(key, newInstance);

  return {
    ...contentState,
    entityMap: newEntityMap,
  };
}
