/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import DraftEditor from '../../base/DraftEditor.react';
import {SyntheticEvent} from 'react';

/**
 * Drag behavior has begun from outside the editor element.
 */
export default function editOnDragOver(
  editor: DraftEditor,
  e: SyntheticEvent,
): void {
  editor.setMode('drag');
  e.preventDefault();
}
