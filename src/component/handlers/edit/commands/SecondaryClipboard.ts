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

import {BlockMap} from '../../../../model/immutable/BlockMap';
import {
  EditorState,
  pushContent,
} from '../../../../model/immutable/EditorState';
import {
  isCollapsed,
  SelectionState,
} from '../../../../model/immutable/SelectionState';
import {
  getBlockAfter,
  getBlockForKey,
} from '../../../../model/immutable/ContentState';
import {nullthrows} from '../../../../fbjs/nullthrows';
import getContentStateFragment from '../../../../model/transaction/getContentStateFragment';
import DraftModifier from '../../../../model/modifier/DraftModifier';

let clipboard: BlockMap | null = null;

/**
 * Some systems offer a "secondary" clipboard to allow quick internal cut
 * and paste behavior. For instance, Ctrl+K (cut) and Ctrl+Y (paste).
 */
const SecondaryClipboard = {
  cut: function(editorState: EditorState): EditorState {
    const content = editorState.currentContent;
    const selection = editorState.selection;
    let targetRange: SelectionState | null = null;

    if (isCollapsed(selection)) {
      const anchorKey = selection.anchorKey;
      const blockEnd = getBlockForKey(content, anchorKey).text.length;

      if (blockEnd === selection.anchorOffset) {
        const keyAfter = getBlockAfter(content, anchorKey)?.key;
        if (keyAfter) {
          return editorState;
        }
        targetRange = {
          ...selection,
          focusKey: keyAfter as string,
          focusOffset: 0,
        };
      } else {
        targetRange = {...selection, focusOffset: blockEnd};
      }
    } else {
      targetRange = selection;
    }

    targetRange = nullthrows(targetRange);
    // TODO: This should actually append to the current state when doing
    // successive ^K commands without any other cursor movement
    clipboard = getContentStateFragment(content, targetRange);

    const afterRemoval = DraftModifier.removeRange(
      content,
      targetRange,
      'forward',
    );

    if (afterRemoval === content) {
      return editorState;
    }

    return pushContent(editorState, afterRemoval, 'remove-range');
  },

  paste: function(editorState: EditorState): EditorState {
    if (!clipboard) {
      return editorState;
    }

    const newContent = DraftModifier.replaceWithFragment(
      editorState.currentContent,
      editorState.selection,
      clipboard,
    );

    return pushContent(editorState, newContent, 'insert-fragment');
  },
};

export default SecondaryClipboard;
