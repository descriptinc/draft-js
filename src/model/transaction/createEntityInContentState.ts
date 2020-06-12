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

import ContentState from 'ContentState';
import { DraftEntityMutability } from 'DraftEntityMutability';
import { DraftEntityType } from 'DraftEntityType';

const DraftEntityInstance = require('DraftEntityInstance');

const addEntityToContentState = require('addEntityToContentState');

function createEntityInContentState(
  contentState: ContentState,
  type: DraftEntityType,
  mutability: DraftEntityMutability,
  data?: Object
): ContentState {
  return addEntityToContentState(
    contentState,
    new DraftEntityInstance({type, mutability, data: data || {}}),
  );
}

module.exports = createEntityInContentState;
