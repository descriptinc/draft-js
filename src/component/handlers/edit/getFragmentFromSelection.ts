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

import { BlockMap } from 'BlockMap';
import EditorState from 'EditorState';

const getContentStateFragment = require('getContentStateFragment');

function getFragmentFromSelection(editorState: EditorState): BlockMap | null {
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
