// /**
//  * Copyright (c) Facebook, Inc. and its affiliates.
//  *
//  * This source code is licensed under the MIT license found in the
//  * LICENSE file in the root directory of this source tree.
//  *
//  * @format
//  * @flow
//  * @emails oncall+draft_js
//  */
//
// 'use strict';
//
// import {ContentState} from '../immutable/ContentState';
// import {DraftEntityType} from '../entity/DraftEntityType';
// import {DraftEntityMutability} from '../entity/DraftEntityMutability';
//
// function createEntityInContentState(
//   contentState: ContentState,
//   type: DraftEntityType,
//   mutability: DraftEntityMutability,
//   data?: Object,
// ): ContentState {
//   return addEntityToContentState(
//     contentState,
//     new DraftEntityInstance({type, mutability, data: data || {}}),
//   );
// }
//
// module.exports = createEntityInContentState;
