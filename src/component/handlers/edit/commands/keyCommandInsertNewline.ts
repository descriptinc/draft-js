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

import {
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import DraftModifier from '../../../../model/modifier/DraftModifier';

export default function keyCommandInsertNewline(
  editorState: EditorState,
): EditorState {
  const contentState = DraftModifier.splitBlock(
    editorState.currentContent,
    editorState.selection,
  );
  return pushContent(editorState, contentState, 'split-block');
}
