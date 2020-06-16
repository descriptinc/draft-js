/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import invariant from '../../fbjs/invariant';
import isHTMLElement from './isHTMLElement';
import DraftEditor from '../base/DraftEditor.react';

export default function getContentEditableContainer(
  editor: DraftEditor,
): HTMLElement {
  const editorNode = editor.editorContainer;
  invariant(editorNode, 'Missing editorNode');
  invariant(
    isHTMLElement(editorNode.firstChild),
    'editorNode.firstChild is not an HTMLElement',
  );
  return editorNode.firstChild;
}
