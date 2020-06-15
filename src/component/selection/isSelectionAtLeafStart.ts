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

import {EditorState, getBlockTree} from '../../model/immutable/EditorState';
import {getStartOffset} from '../../model/immutable/SelectionState';

export default function isSelectionAtLeafStart(
  editorState: EditorState,
): boolean {
  const selection = editorState.selection;
  const anchorKey = selection.anchorKey;
  const blockTree = getBlockTree(editorState, anchorKey);
  const offset = getStartOffset(selection);

  let isAtStart = false;

  blockTree.some(leafSet => {
    if (offset === leafSet.start) {
      isAtStart = true;
      return true;
    }

    if (offset < leafSet.end) {
      return leafSet.leaves.some(leaf => {
        const leafStart = leaf.start;
        if (offset === leafStart) {
          isAtStart = true;
          return true;
        }

        return false;
      });
    }

    return false;
  });

  return isAtStart;
}
