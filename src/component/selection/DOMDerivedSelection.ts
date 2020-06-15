/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {SelectionState} from '../../model/immutable/SelectionState';

export type DOMDerivedSelection = {
  selectionState: SelectionState;
  needsRecovery: boolean;
};
