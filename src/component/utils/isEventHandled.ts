/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {DraftHandleValue} from '../../model/constants/DraftHandleValue';

/**
 * Utility method for determining whether or not the value returned
 * from a handler indicates that it was handled.
 */
export default function isEventHandled(value: DraftHandleValue): boolean {
  return value === 'handled' || value === true;
}
