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

import type {BlockMap} from 'BlockMap';
import type EditorState from 'EditorState';

const getContentStateFragment = require('getContentStateFragment');

function getFragmentFromSelection(editorState: EditorState): ?BlockMap {
  const selectionState = editorState.selection;

  if (selectionState.isCollapsed()) {
    return null;
  }

  return getContentStateFragment(
    editorState.currentContent,
    selectionState,
  );
}

module.exports = getFragmentFromSelection;
