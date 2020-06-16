/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @flow strict-local
 * @format
 */

'use strict';

import editOnInput from '../editOnInput';
import {createWithContent} from '../../../../model/immutable/EditorState';
import {createFromBlockArray} from '../../../../model/immutable/ContentState';
import {makeContentBlock} from '../../../../model/immutable/ContentBlock';

const onInput = editOnInput;

jest.mock('../../../selection/findAncestorOffsetKey', () =>
  jest.fn(() => 'blockkey-0-0'),
);

jest.mock('../commands/keyCommandPlainBackspace', () => jest.fn(() => ({})));

const getEditorState = (text: string = '') => {
  return createWithContent(
    createFromBlockArray([
      makeContentBlock({
        key: 'blockkey',
        text,
      }),
    ]),
  );
};

function withGlobalGetSelectionAs(getSelectionValue = {}, callback) {
  const oldGetSelection = global.getSelection;
  try {
    global.getSelection = () => getSelectionValue;
    callback();
  } finally {
    global.getSelection = oldGetSelection;
  }
}

test('restoreEditorDOM and keyCommandPlainBackspace are NOT called when the `inputType` is not from a backspace press', () => {
  const anchorNodeText = 'react draftjs';
  const globalSelection = {
    anchorNode: document.createTextNode(anchorNodeText),
  };
  withGlobalGetSelectionAs(globalSelection, () => {
    const editorState = getEditorState(anchorNodeText);
    const editorNode = document.createElement('div');
    const editor = {
      _latestEditorState: editorState,
      props: {},
      update: jest.fn(),
      restoreEditorDOM: jest.fn(),
      editor: editorNode,
    };

    const inputEvent = {
      nativeEvent: {inputType: 'insetText'},
      currentTarget: editorNode,
    };

    // $FlowExpectedError
    onInput(editor, inputEvent);

    expect(
      require('../commands/keyCommandPlainBackspace'),
    ).toHaveBeenCalledTimes(0);
    expect(editor.restoreEditorDOM).toHaveBeenCalledTimes(0);
    expect(editor.update).toHaveBeenCalledTimes(0);
  });
});

test('restoreEditorDOM and keyCommandPlainBackspace are called when backspace is pressed', () => {
  const anchorNodeText = 'react draftjs';
  const globalSelection = {
    anchorNode: document.createTextNode(anchorNodeText),
  };
  withGlobalGetSelectionAs(globalSelection, () => {
    const editorState = getEditorState(anchorNodeText);
    const editorNode = document.createElement('div');
    const editor = {
      _latestEditorState: editorState,
      props: {},
      update: jest.fn(),
      restoreEditorDOM: jest.fn(),
      editor: editorNode,
    };

    const inputEvent = {
      // When Backspace is pressed and input-type is supported, an event with
      // inputType === 'deleteContentBackward' is triggered by the browser.
      nativeEvent: {inputType: 'deleteContentBackward'},
      currentTarget: editorNode,
    };

    // $FlowExpectedError
    onInput(editor, inputEvent);

    // $FlowExpectedError
    const newEditorState = require('../commands/keyCommandPlainBackspace').mock
      .results[0].value;
    expect(
      require('../commands/keyCommandPlainBackspace'),
    ).toHaveBeenCalledWith(editorState);
    expect(editor.restoreEditorDOM).toHaveBeenCalledTimes(1);
    expect(editor.update).toHaveBeenCalledWith(newEditorState);
  });
});
