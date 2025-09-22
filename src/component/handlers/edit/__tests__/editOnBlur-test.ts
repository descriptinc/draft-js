/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import editOnBlur from '../editOnBlur';
import {createWithContent} from '../../../../model/immutable/EditorState';
import {createFromBlockArray} from '../../../../model/immutable/ContentState';
import {makeContentBlock} from '../../../../model/immutable/ContentBlock';

const onBlur = editOnBlur;

const getEditorState = (text: string = 'Arsenal') => {
  return createWithContent(
    createFromBlockArray([
      makeContentBlock({
        key: 'a',
        text,
      }),
    ]),
  );
};

const getBlurEvent = (currentTarget: any) => ({
  currentTarget,
});

function withGlobalGetSelectionAs(getSelectionValue = {}, callback) {
  const oldGetSelection = globalThis.getSelection;
  try {
    globalThis.getSelection = () => {
      return getSelectionValue as any;
    };
    callback();
  } finally {
    globalThis.getSelection = oldGetSelection;
  }
}

test('editor removes selection on blur (default behaviour)', () => {
  const anchorNodeText = 'react draftjs';
  const anchorNode = document.createTextNode(anchorNodeText);
  const globalSelection = {
    anchorNode,
    focusNode: anchorNode,
    removeAllRanges: jest.fn(),
    rangeCount: 1,
  };

  const editorNode = document.createElement('div');
  editorNode.appendChild(anchorNode);

  withGlobalGetSelectionAs(globalSelection, () => {
    const editorState = getEditorState(anchorNodeText);
    const editor = {
      _latestEditorState: editorState,
      props: {
        preserveSelectionOnBlur: false,
      },
      editor: editorNode,
    };

    // @ts-expect-error - testing with partial editor object
    onBlur(editor as any, getBlurEvent(editorNode));

    expect(globalSelection.removeAllRanges).toHaveBeenCalledTimes(1);
  });
});

test('editor preserves selection on blur', () => {
  const anchorNodeText = 'react draftjs';
  const anchorNode = document.createTextNode(anchorNodeText);
  const globalSelection = {
    anchorNode,
    focusNode: anchorNode,
    removeAllRanges: jest.fn(),
    rangeCount: 1,
  };

  const editorNode = document.createElement('div');
  editorNode.appendChild(anchorNode);

  withGlobalGetSelectionAs(globalSelection, () => {
    const editorState = getEditorState(anchorNodeText);
    const editor = {
      _latestEditorState: editorState,
      props: {
        preserveSelectionOnBlur: true,
      },
      editor: editorNode,
    };

    // @ts-expect-error - testing with partial editor object
    onBlur(editor as any, getBlurEvent(editorNode));

    expect(globalSelection.removeAllRanges).toHaveBeenCalledTimes(0);
  });
});
