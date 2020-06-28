import {DraftDecoratorType} from '../../decorators/DraftDecoratorType';
import {makeSelectionState, SelectionState} from '../SelectionState';
import {makeContentBlock} from '../ContentBlock';
import {repeat} from '../../descript/Iterables';
import {makeCharacterMetadata} from '../CharacterMetadata';
import {BOLD, ITALIC} from '../SampleDraftInlineStyle';
import {
  acceptSelection,
  createEmpty,
  createWithContent,
  EditorState,
  getBlockTree,
  getCurrentInlineStyle,
  pushContent,
  setEditorState,
} from '../EditorState';
import {createFromBlockArray, getBlockForKey} from '../ContentState';
import RichTextEditorUtil from '../../modifier/RichTextEditorUtil';
import DraftModifier from '../../modifier/DraftModifier';

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

class Decorator implements DraftDecoratorType {
  getDecorations() {
    return [];
  }
  getComponentForKey(_: string) {
    return () => null;
  }
  getPropsForKey(_: string) {
    return null;
  }
}

const DEFAULT_SELECTION = {
  anchorKey: 'a',
  anchorOffset: 0,
  focusKey: 'a',
  focusOffset: 0,
  isBackward: false,
};

const collapsedSelection = makeSelectionState(DEFAULT_SELECTION);
const rangedSelection = makeSelectionState({
  ...DEFAULT_SELECTION,
  focusOffset: 1,
});

const plainBlock = makeContentBlock({
  key: 'a',
  text: 'Arsenal',
});
const boldBlock = makeContentBlock({
  key: 'b',
  text: 'Burnley',
  characterList: Array.from(repeat(7, makeCharacterMetadata({style: BOLD}))),
});
const boldA = Array.from(repeat(boldBlock.text.length, 'x'));
const emptyBlockA = makeContentBlock({
  key: 'emptyA',
  text: '',
});
const emptyBlockB = makeContentBlock({
  key: 'emptyB',
  text: '',
});
const italicBlock = makeContentBlock({
  key: 'c',
  text: 'Chelsea',
  characterList: Array.from(repeat(7, makeCharacterMetadata({style: ITALIC}))),
});

const getSampleEditorState = (type: string, decorator?: DraftDecoratorType) => {
  switch (type) {
    case 'DECORATED':
      return createWithContent(
        createFromBlockArray([boldBlock, italicBlock]),
        decorator,
      );
    case 'MULTI_BLOCK':
      return createWithContent(
        createFromBlockArray([emptyBlockA, emptyBlockB, boldBlock]),
      );
    case 'UNDECORATED':
    default:
      return createWithContent(
        createFromBlockArray([
          plainBlock,
          boldBlock,
          emptyBlockA,
          emptyBlockB,
          italicBlock,
        ]),
      );
  }
};

const UNDECORATED_STATE = getSampleEditorState('UNDECORATED');

const MULTI_BLOCK_STATE = getSampleEditorState('MULTI_BLOCK');

const assertGetCurrentInlineStyle = (
  selection: SelectionState,
  state: EditorState = UNDECORATED_STATE,
) => {
  const editorState = acceptSelection(state, selection);
  expect(getCurrentInlineStyle(editorState)).toMatchSnapshot();
};

beforeEach(() => {
  Decorator.prototype.getDecorations = jest.fn().mockImplementation(v => {
    return v === boldBlock
      ? boldA
      : Array.from(repeat(v.text.length, undefined));
  });
});

test('uses right of the caret at document start', () => {
  assertGetCurrentInlineStyle(collapsedSelection);
});

test('uses left of the caret, at position `1+`', () => {
  assertGetCurrentInlineStyle({
    ...collapsedSelection,
    anchorOffset: 1,
    focusOffset: 1,
  });
});

test('uses right of the caret at offset `0` within document', () => {
  assertGetCurrentInlineStyle({
    ...collapsedSelection,
    anchorKey: 'b',
    focusKey: 'b',
  });
});

test('uses previous block at offset `0` within empty block', () => {
  assertGetCurrentInlineStyle({
    ...collapsedSelection,
    anchorKey: 'emptyA',
    focusKey: 'emptyA',
  });
});

test('looks upward through empty blocks to find a character with collapsed selection', () => {
  assertGetCurrentInlineStyle({
    ...collapsedSelection,
    anchorKey: 'emptyB',
    focusKey: 'emptyB',
  });
});

test('does not discard style override when changing block type', () => {
  let editor = createEmpty();

  editor = RichTextEditorUtil.toggleInlineStyle(editor, 'BOLD');
  editor = RichTextEditorUtil.toggleBlockType(editor, 'test-block');

  expect(getCurrentInlineStyle(editor)).toMatchSnapshot();
});

test('does not discard style override when adjusting depth', () => {
  let editor = createEmpty();

  editor = RichTextEditorUtil.toggleInlineStyle(editor, 'BOLD');
  editor = RichTextEditorUtil.onTab(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    {
      preventDefault: () => {
        //
      },
    },
    editor,
    1,
  );

  expect(getCurrentInlineStyle(editor)).toMatchSnapshot();
});

test('does not discard style override when splitting block', () => {
  let editor = createEmpty();

  editor = RichTextEditorUtil.toggleInlineStyle(editor, 'BOLD');
  editor = pushContent(
    editor,
    DraftModifier.splitBlock(editor.currentContent, editor.selection),
    'split-block',
  );

  expect(getCurrentInlineStyle(editor)).toMatchSnapshot();
});

test('uses right of the start for blocks with text', () => {
  assertGetCurrentInlineStyle({
    ...rangedSelection,
    focusKey: 'b',
  });
});

test('uses left of the start if starting at end of block', () => {
  const blockB = getBlockForKey(UNDECORATED_STATE.currentContent, 'b');
  assertGetCurrentInlineStyle({
    ...collapsedSelection,
    anchorKey: 'b',
    anchorOffset: blockB.text.length,
    focusKey: 'c',
    focusOffset: 3,
  });
});

test('looks upward through empty blocks to find a character', () => {
  assertGetCurrentInlineStyle({
    ...rangedSelection,
    anchorKey: 'emptyA',
    anchorOffset: 0,
    focusKey: 'c',
    focusOffset: 3,
  });
});

test('falls back to no style if in empty block at document start', () => {
  assertGetCurrentInlineStyle(
    makeSelectionState({
      anchorKey: 'emptyA',
      anchorOffset: 0,
      focusKey: 'c',
      focusOffset: 3,
      isBackward: false,
    }),
    MULTI_BLOCK_STATE,
  );
});

test('must set a new decorator', () => {
  const decorator = new Decorator();
  const getDecorationsMock = jest.fn().mockReturnValue([]);
  decorator.getDecorations = getDecorationsMock;
  const editorState = getSampleEditorState('DECORATED', decorator);
  const boldB = Array.from(repeat(boldBlock.text.length, 'y'));

  expect(getDecorationsMock).toHaveBeenCalledTimes(2);

  getDecorationsMock.mockImplementation(v => {
    return v === boldBlock
      ? boldB
      : Array.from(repeat(v.text.length, undefined));
  });

  class NextDecorator implements DraftDecoratorType {
    getDecorations() {
      return [];
    }
    getComponentForKey(_: string) {
      return () => null;
    }
    getPropsForKey(_: string) {
      return null;
    }
  }

  const newDecorator = new NextDecorator();

  const newGetDecorationsMock = jest.fn();
  newDecorator.getDecorations = newGetDecorationsMock.mockImplementation(v => {
    return v === boldBlock ? boldB : Array.from(repeat(v.text.length, 'a'));
  });

  const withNewDecorator = setEditorState(editorState, {
    decorator: newDecorator,
  });

  expect(withNewDecorator).not.toBe(editorState);

  // Twice for the initial tree map generation, then twice more for
  // filter comparison.
  expect(getDecorationsMock).toHaveBeenCalledTimes(4);

  // Twice for filter comparison
  expect(newGetDecorationsMock).toHaveBeenCalledTimes(3);

  expect(withNewDecorator.decorator).toBe(newDecorator);

  // Preserve block trees that had the same decorator list.
  expect(getBlockTree(editorState, boldBlock.key)).toBe(
    getBlockTree(withNewDecorator, boldBlock.key),
  );

  expect(getBlockTree(editorState, italicBlock.key)).not.toBe(
    getBlockTree(withNewDecorator, italicBlock.key),
  );
});

test('must call decorator with correct argument types and order', () => {
  const decorator = new Decorator();
  const getDecorationsMock = jest.fn().mockReturnValue([]);
  decorator.getDecorations = getDecorationsMock;
  getSampleEditorState('DECORATED', decorator);
  expect(getDecorationsMock).toHaveBeenCalledTimes(2);
});

test('must correctly remove a decorator', () => {
  const decorator = new Decorator();
  const getDecorationsMock = jest.fn().mockReturnValue([]);
  decorator.getDecorations = getDecorationsMock;
  const editorState = getSampleEditorState('DECORATED', decorator);
  const withNewDecorator = setEditorState(editorState, {decorator: null});

  expect(withNewDecorator).not.toBe(editorState);
  expect(getDecorationsMock).toHaveBeenCalledTimes(2);
  expect(withNewDecorator.decorator).toBeNull();
});
