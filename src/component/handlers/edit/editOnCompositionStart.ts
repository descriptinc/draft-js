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
import {setEditorState} from '../../../model/immutable/EditorState';

/**
 * The user has begun using an IME input system. Switching to `composite` mode
 * allows handling composition input and disables other edit behavior.
 */
export default function editOnCompositionStart(
  editor: DraftEditor,
  e: React.SyntheticEvent,
): void {
  editor.setMode('composite');
  editor.update(
    setEditorState(editor._latestEditorState, {inCompositionMode: true}),
  );
  // Allow composition handler to interpret the compositionstart event
  editor._onCompositionStart(e);
}
