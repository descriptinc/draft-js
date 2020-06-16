/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {makeSelectionState} from '../../../../model/immutable/SelectionState';
import {
  acceptSelection,
  createWithContent,
  setEditorState,
} from '../../../../model/immutable/EditorState';
import {
  ContentState,
  createFromBlockArray,
} from '../../../../model/immutable/ContentState';
import {
  ContentBlock,
  makeContentBlock,
} from '../../../../model/immutable/ContentBlock';
import DraftEditor from '../../../base/DraftEditor.react';
import {SyntheticInputEvent} from '../../../utils/eventTypes';
import editOnBeforeInput from '../editOnBeforeInput';
import CompositeDraftDecorator from '../../../../model/decorators/CompositeDraftDecorator';

const DEFAULT_SELECTION = {
  anchorKey: 'a',
  anchorOffset: 0,
  focusKey: 'a',
  focusOffset: 0,
  isBackward: false,
};

const rangedSelection = makeSelectionState({
  ...DEFAULT_SELECTION,
  focusOffset: 1,
});

const rangedSelectionBackwards = makeSelectionState({
  ...DEFAULT_SELECTION,
  anchorOffset: 1,
  isBackward: true,
});

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

const getDraftEditor = (obj): DraftEditor => obj as any;

const getInputEvent = (data?: any): SyntheticInputEvent =>
  ({
    data,
    preventDefault: jest.fn(),
  } as any);

test('editor is not updated if no character data is provided', () => {
  const editorState = acceptSelection(getEditorState(), rangedSelection);

  const editor = getDraftEditor({
    _latestEditorState: editorState,
    props: {},
    update: jest.fn(),
  });

  editOnBeforeInput(editor, getInputEvent());

  expect(editor.update).toHaveBeenCalledTimes(0);
});

test('editor is not updated if handled by handleBeforeInput', () => {
  const editorState = acceptSelection(getEditorState(), rangedSelection);

  const editor = getDraftEditor({
    _latestEditorState: editorState,
    props: {
      handleBeforeInput: () => true,
    },
    update: jest.fn(),
  });

  editOnBeforeInput(editor, getInputEvent('O'));

  expect(editor.update).toHaveBeenCalledTimes(0);
});

test('editor is updated with new text if it does not match current selection', () => {
  const editorState = acceptSelection(getEditorState(), rangedSelection);

  const update = jest.fn();
  const editor = getDraftEditor({
    _latestEditorState: editorState,
    props: {},
    update,
  });

  editOnBeforeInput(editor, getInputEvent('O'));

  expect(update).toHaveBeenCalledTimes(1);

  const newEditorState = update.mock.calls[0][0];
  expect(newEditorState.currentContent).toMatchSnapshot();
});

test('editor selectionstate is updated if new text matches current selection', () => {
  const editorState = acceptSelection(getEditorState(), rangedSelection);

  const update = jest.fn();
  const editor = getDraftEditor({
    _latestEditorState: editorState,
    props: {},
    update,
  });

  editOnBeforeInput(editor, getInputEvent('A'));

  expect(update).toHaveBeenCalledTimes(1);

  const newEditorState = update.mock.calls[0][0];
  expect(newEditorState.selection).toMatchSnapshot();
});

test('editor selectionstate is updated if new text matches current selection and user selected backwards', () => {
  const editorState = acceptSelection(
    getEditorState(),
    rangedSelectionBackwards,
  );

  const update = jest.fn();
  const editor = getDraftEditor({
    _latestEditorState: editorState,
    props: {},
    update,
  });

  editOnBeforeInput(editor, getInputEvent('A'));

  expect(update).toHaveBeenCalledTimes(1);

  const newEditorState = update.mock.calls[0][0];
  expect(newEditorState.selection).toMatchSnapshot();
});

const HASHTAG_REGEX = /#[a-z]+/g;
function hashtagStrategy(
  contentBlock: ContentBlock,
  callback,
  _contentState: ContentState,
) {
  findWithRegex(HASHTAG_REGEX, contentBlock, callback);
}

function findWithRegex(regex: RegExp, contentBlock: ContentBlock, callback) {
  const text = contentBlock.text;
  let matchArr = regex.exec(text);
  while (matchArr !== null) {
    callback(matchArr.index, matchArr.index + matchArr[0].length);
    matchArr = regex.exec(text);
  }
}

function testDecoratorFingerprint(
  text: string,
  selection: number,
  charToInsert: string,
  shouldPrevent,
) {
  const editorState = acceptSelection(
    setEditorState(getEditorState(text), {
      decorator: new CompositeDraftDecorator([
        {
          strategy: hashtagStrategy,
          component: () => null,
        },
      ]),
    }),
    makeSelectionState({
      ...DEFAULT_SELECTION,
      anchorOffset: selection,
      focusOffset: selection,
    }),
  );

  const editor = getDraftEditor({
    _latestEditorState: editorState,
    _latestCommittedEditorState: editorState,
    props: {},
    update: jest.fn(),
  });

  const ev = getInputEvent(charToInsert);
  editOnBeforeInput(editor, ev);

  expect(ev.preventDefault.mock.calls.length).toBe(shouldPrevent ? 1 : 0);
}

test('decorator fingerprint logic bails out of native insertion', () => {
  const oldGetSelection = global.getSelection;
  try {
    global.getSelection = () => ({});

    // Make sure we prevent native insertion in the right cases
    testDecoratorFingerprint('hi #', 4, 'f', true);
    testDecoratorFingerprint('x #foo', 3, '#', true);
    testDecoratorFingerprint('#foobar', 4, ' ', true);
    testDecoratorFingerprint('#foo', 4, 'b', true);
    testDecoratorFingerprint('#foo bar #baz', 2, 'o', true);
    testDecoratorFingerprint('#foo bar #baz', 12, 'a', true);

    // but these are OK to let through
    testDecoratorFingerprint('#foo bar #baz', 7, 'o', false);
    testDecoratorFingerprint('start #foo bar #baz end', 5, 'a', false);
    testDecoratorFingerprint('start #foo bar #baz end', 20, 'a', false);
  } finally {
    global.getSelection = oldGetSelection;
  }
});
