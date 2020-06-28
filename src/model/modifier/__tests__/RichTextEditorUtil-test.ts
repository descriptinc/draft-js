/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */
import getSampleStateForTesting from '../../transaction/getSampleStateForTesting';
import RichTextEditorUtil from '../RichTextEditorUtil';
import {
  EditorState,
  forceSelection,
  moveSelectionToEnd,
  pushContent,
} from '../../immutable/EditorState';
import AtomicBlockUtils from '../AtomicBlockUtils';
import {
  ContentState,
  createEntity,
  getBlockBefore,
  getFirstBlock,
  getLastBlock,
  getLastCreatedEntityKey,
} from '../../immutable/ContentState';
import DraftModifier from '../DraftModifier';
import {makeSelectionState} from '../../immutable/SelectionState';
import {find, some} from '../../descript/Iterables';
import {DraftBlockType} from '../../constants/DraftBlockType';
import {blockToJson} from '../../../util/blockMapToJson';

const {editorState, selectionState} = getSampleStateForTesting();
const {
  onBackspace,
  onDelete,
  onTab,
  tryToRemoveBlockStyle,
} = RichTextEditorUtil;

const insertAtomicBlock = (targetEditorState: EditorState) => {
  createEntity('TEST', 'IMMUTABLE', null);
  const entityKey = getLastCreatedEntityKey();
  const character = ' ';
  const movedSelection = moveSelectionToEnd(targetEditorState);
  return AtomicBlockUtils.insertAtomicBlock(
    movedSelection,
    entityKey,
    character,
  );
};

test('onBackspace does not handle non-zero-offset or non-collapsed selections', () => {
  const nonZero = {...selectionState, anchorOffset: 2, focusOffset: 2};
  expect(onBackspace(forceSelection(editorState, nonZero))).toMatchSnapshot();

  const nonCollapsed = {...nonZero, anchorOffset: 0};
  expect(
    onBackspace(forceSelection(editorState, nonCollapsed)),
  ).toMatchSnapshot();
});

test('onBackspace resets the current block type if empty', () => {
  const contentState = editorState.currentContent;
  const lastBlock = getLastBlock(contentState);
  const lastBlockKey = lastBlock.key;

  // Remove the current text from the blockquote.
  const resetBlockquote = DraftModifier.removeRange(
    contentState,
    makeSelectionState({
      anchorKey: lastBlockKey,
      anchorOffset: 0,
      focusKey: lastBlockKey,
      focusOffset: lastBlock.text.length,
    }),
    'backward',
  );

  const withEmptyBlockquote = pushContent(
    editorState,
    resetBlockquote,
    'remove-range',
  );

  const afterBackspace = onBackspace(withEmptyBlockquote)!;
  const lastBlockNow = getLastBlock(afterBackspace.currentContent);

  expect(blockToJson(lastBlockNow)).toMatchSnapshot();
});

test('onBackspace resets the current block type at the start of the first block', () => {
  const contentState = editorState.currentContent;

  const setListItem = DraftModifier.setBlockType(
    contentState,
    selectionState,
    'unordered-list-item',
  );

  const withListItem = pushContent(
    editorState,
    setListItem,
    'change-block-type',
  );

  const afterBackspace = onBackspace(withListItem)!;
  const firstBlockNow = getFirstBlock(afterBackspace.currentContent);

  expect(blockToJson(firstBlockNow)).toMatchSnapshot();
});

test('onBackspace removes a preceding atomic block', () => {
  const blockSizeBeforeRemove = editorState.currentContent.blockMap.size;
  const withAtomicBlock = insertAtomicBlock(editorState);
  const afterBackspace = onBackspace(withAtomicBlock)!;
  const contentState = afterBackspace.currentContent;
  const blockMap = contentState.blockMap;
  expect(blockMap.size === blockSizeBeforeRemove + 1).toMatchSnapshot();
  expect(
    some(blockMap.values(), block => block.type === 'atomic'),
  ).toMatchSnapshot();
});

test('onDelete does not handle non-block-end or non-collapsed selections', () => {
  const nonZero = {...selectionState, anchorOffset: 2, focusOffset: 2};
  expect(
    onDelete(forceSelection(editorState, nonZero)) === null,
  ).toMatchSnapshot();

  const nonCollapsed = {...nonZero, anchorOffset: 0};
  expect(
    onDelete(forceSelection(editorState, nonCollapsed)) === null,
  ).toMatchSnapshot();
});

test('onDelete removes a following atomic block', () => {
  const blockSizeBeforeRemove = editorState.currentContent.blockMap.size;
  const withAtomicBlock = insertAtomicBlock(editorState);
  const content = withAtomicBlock.currentContent;
  const atomicKey = find(
    content.blockMap.values(),
    block => block.type === 'atomic',
  )!.key;

  const blockBefore = getBlockBefore(content, atomicKey)!;
  const keyBefore = blockBefore.key;
  const lengthBefore = blockBefore.text.length;

  const withSelectionAboveAtomic = forceSelection(
    withAtomicBlock,
    makeSelectionState({
      anchorKey: keyBefore,
      anchorOffset: lengthBefore,
      focusKey: keyBefore,
      focusOffset: lengthBefore,
    }),
  );

  const afterDelete = onDelete(withSelectionAboveAtomic)!;
  const blockMapAfterDelete = afterDelete.currentContent.blockMap;

  expect(
    some(blockMapAfterDelete.values(), block => block.type === 'atomic'),
  ).toMatchSnapshot();

  expect(
    blockMapAfterDelete.size === blockSizeBeforeRemove + 1,
  ).toMatchSnapshot();
});

test('tryToRemoveBlockStyleonDelete breaks out of code block on enter two blank lines', () => {
  const blankLine = {...selectionState, anchorKey: 'e', focusKey: 'e'};
  const withBlankLine = forceSelection(editorState, blankLine);

  const afterEnter = tryToRemoveBlockStyle(withBlankLine)!;
  const lastBlock = getLastBlock(afterEnter);

  expect(blockToJson(lastBlock)).toMatchSnapshot();
});

describe('onTab on list block', () => {
  const setListBlock = (contentState: ContentState, type: DraftBlockType) =>
    DraftModifier.setBlockType(contentState, selectionState, type);
  const changeBlockType = (setListItem: ContentState): EditorState =>
    pushContent(editorState, setListItem, 'change-block-type');
  const getFirstBlockDepth = (edState: EditorState) =>
    getFirstBlock(edState.currentContent).depth;
  const addTab = (edState: EditorState, maxDepth = 2) =>
    onTab(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      {
        preventDefault: () => {
          //
        },
      },
      edState,
      maxDepth,
    );

  test('increases the depth of unordered-list-item', () => {
    const contentState = editorState.currentContent;
    const setListItem = setListBlock(contentState, 'unordered-list-item');
    const withListItem = changeBlockType(setListItem);

    const afterFirstTab = addTab(withListItem);
    const depthAfterFirstTab = getFirstBlockDepth(afterFirstTab);

    expect(depthAfterFirstTab).toBe(1);

    const afterSecondTab = addTab(afterFirstTab);
    const depthAfterSecondTab = getFirstBlockDepth(afterSecondTab);

    expect(depthAfterSecondTab).toBe(2);
  });

  test('increases the depth of unordered-list-item', () => {
    const contentState = editorState.currentContent;
    const setListItem = setListBlock(contentState, 'ordered-list-item');
    const withListItem = changeBlockType(setListItem);

    const afterFirstTab = addTab(withListItem);
    const depthAfterFirstTab = getFirstBlockDepth(afterFirstTab);

    expect(depthAfterFirstTab).toBe(1);

    const afterSecondTab = addTab(afterFirstTab);
    const depthAfterSecondTab = getFirstBlockDepth(afterSecondTab);

    expect(depthAfterSecondTab).toBe(2);
  });
});
