/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+draft_js
 */

'use strict';

import {ContentState} from '../immutable/ContentState';
import DraftEntity from '../entity/DraftEntity';

export default function updateEntityDataInContentState(
  contentState: ContentState,
  key: string,
  data: {
    [K in string]: unknown;
  },
  merge: boolean,
): ContentState {
  const instance = DraftEntity.__get(key);
  const entityData = instance.data;
  const newData = merge ? {...entityData, ...data} : data;
  DraftEntity.__replaceData(key, newData);

  // FIXME [mvp]: global entity map

  // const newEntityMap =  contentState.getEntityMap().set(key, newInstance);
  // return contentState.set('entityMap', newEntityMap);
  return contentState;
}
