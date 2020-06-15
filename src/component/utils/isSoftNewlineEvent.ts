/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {SyntheticKeyboardEvent} from './eventTypes';
import Keys from 'fbjs/lib/Keys';

export default function isSoftNewlineEvent(e: SyntheticKeyboardEvent): boolean {
  return (
    e.which === Keys.RETURN &&
    (e.getModifierState('Shift') ||
      e.getModifierState('Alt') ||
      e.getModifierState('Control'))
  );
}
