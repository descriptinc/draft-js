/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import fastDeepEqual from 'fast-deep-equal/es6';
import {
  ContentState,
  createFromText,
  getBlockForKey,
  getFirstBlock,
  getLastBlock,
} from './ContentState';
import {
  getStartKey,
  getStartOffset,
  hasEdgeWithin,
  isCollapsed,
  makeEmptySelection,
  makeSelectionState,
  SelectionState,
  setHasFocus,
} from './SelectionState';
import {DraftDecoratorType} from '../decorators/DraftDecoratorType';
import {DraftInlineStyle} from './DraftInlineStyle';
import {EditorChangeType} from './EditorChangeType';
import {flatMap, map} from '../descript/Iterables';
import {BlockMap, mergeMapUpdates} from './BlockMap';
import EditorBidiService from './EditorBidiService';
import BlockTree, {DecoratorRange} from './BlockTree';
import {EMPTY_SET} from './CharacterMetadata';
import {getInlineStyleAt} from './ContentBlock';
import {BlockNode} from './BlockNode';

export type Stack<T> = readonly T[];

export type EditorState = Readonly<{
  currentContent: ContentState;
  decorator: DraftDecoratorType | null;
  directionMap: ReadonlyMap<string, string>;
  forceSelection: boolean;
  inCompositionMode: boolean;
  inlineStyleOverride: DraftInlineStyle | null;
  lastChangeType: EditorChangeType | null;
  nativelyRenderedContent: ContentState | null;
  selection: SelectionState;
  treeMap: ReadonlyMap<string, readonly DecoratorRange[]>;
  allowUndo: boolean;
  redoStack: Stack<ContentState>;
  undoStack: Stack<ContentState>;
}>;

const EMPTY_CONTENT_STACK: ContentState[] = [];

export function createEditorState({
  allowUndo = true,
  currentContent,
  decorator = null,
  directionMap = EditorBidiService.getDirectionMap(currentContent, null),
  forceSelection = false,
  inCompositionMode = false,
  inlineStyleOverride = null,
  lastChangeType = null,
  nativelyRenderedContent = null,
  selection,
  treeMap = generateNewTreeMap(currentContent, decorator),
  undoStack = EMPTY_CONTENT_STACK,
  redoStack = EMPTY_CONTENT_STACK,
}: Partial<EditorState> &
  Pick<EditorState, 'currentContent' | 'selection'>): EditorState {
  return {
    allowUndo,
    currentContent,
    decorator,
    directionMap,
    forceSelection,
    inCompositionMode,
    inlineStyleOverride,
    lastChangeType,
    nativelyRenderedContent,
    selection,
    treeMap,
    undoStack,
    redoStack,
  };
}

export function pushStack<T>(stack: Stack<T>, item: T): Stack<T> {
  return stack.concat([item]);
}
export function popStack<T>(stack: Stack<T>): [T | undefined, Stack<T>] {
  if (stack.length === 0) {
    return [undefined, stack];
  }
  return [stack[stack.length - 1], stack.slice(0, stack.length - 1)];
}

export function createEmpty(
  decorator?: DraftDecoratorType | null,
): EditorState {
  return createWithContent(createFromText(''), decorator);
}

export function createWithContent(
  contentState: ContentState,
  decorator?: DraftDecoratorType | null,
): EditorState {
  if (contentState.blockMap.size === 0) {
    return createEmpty(decorator);
  }
  const firstKey = getFirstBlock(contentState).key;
  return createEditorState({
    currentContent: contentState,
    decorator,
    selection: makeEmptySelection(firstKey),
  });
}

export function setEditorState(
  editorState: EditorState,
  put: Partial<EditorState>,
): EditorState {
  const existingDecorator = editorState.decorator;
  let decorator = existingDecorator;
  if (put.decorator === null) {
    decorator = null;
  } else if (put.decorator) {
    decorator = put.decorator;
  }

  const newContent = put.currentContent || editorState.currentContent;

  if (decorator !== existingDecorator) {
    const existingTreeMap = editorState.treeMap;
    let treeMap;
    if (decorator && existingDecorator) {
      treeMap = regenerateTreeForNewDecorator(
        newContent,
        newContent.blockMap,
        existingTreeMap,
        decorator,
        existingDecorator,
      );
    } else {
      treeMap = generateNewTreeMap(newContent, decorator);
    }

    // FIXME [correctness]: was this a bug? orig code doesn't use the rest of `put` here
    return {
      ...editorState,
      ...put,
      decorator,
      treeMap,
      nativelyRenderedContent: null,
    };
  } else if (editorState.currentContent !== newContent) {
    return {
      ...editorState,
      ...put,
      treeMap: regenerateTreeForNewBlocks(
        editorState,
        newContent.blockMap,
        decorator,
      ),
    };
  }
  return {
    ...editorState,
    ...put,
  };
}

export function setInlineStyleOverride(
  editorState: EditorState,
  inlineStyleOverride: DraftInlineStyle,
): EditorState {
  return {
    ...editorState,
    inlineStyleOverride,
  };
}

export function getCurrentInlineStyle(
  editorState: EditorState,
): DraftInlineStyle {
  const override = editorState.inlineStyleOverride;
  if (override !== null) {
    return override;
  }
  const {currentContent, selection} = editorState;
  if (isCollapsed(selection)) {
    return getInlineStyleForCollapsedSelection(currentContent, selection);
  }
  return getInlineStyleForNonCollapsedSelection(currentContent, selection);
}

export function getBlockTree(
  {treeMap}: EditorState,
  blockKey: string,
): readonly DecoratorRange[] {
  const res = treeMap.get(blockKey);
  if (!res) {
    throw new Error('Invalid block key');
  }
  return res;
}

export function getBlockTreeMaybe(
  {treeMap}: EditorState,
  blockKey: string,
): readonly DecoratorRange[] | undefined {
  return treeMap.get(blockKey);
}

export function isSelectionAtStartOfContent({
  currentContent,
  selection,
}: EditorState): boolean {
  const firstKey = getFirstBlock(currentContent).key;
  return hasEdgeWithin(selection, firstKey, 0, 0);
}

export function isSelectionAtEndOfContent({
  currentContent,
  selection,
}: EditorState): boolean {
  const lastBlock = getLastBlock(currentContent);
  const end = lastBlock.text.length;
  return hasEdgeWithin(selection, lastBlock.key, end, end);
}

/**
 * Incorporate native DOM selection changes into the EditorState. This
 * method can be used when we simply want to accept whatever the DOM
 * has given us to represent selection, and we do not need to re-render
 * the editor.
 *
 * To forcibly move the DOM selection, see `EditorState.forceSelection`.
 */
export function acceptSelection(
  editorState: EditorState,
  selection: SelectionState,
): EditorState {
  return updateSelection(editorState, selection, false);
}

/**
 * At times, we need to force the DOM selection to be where we
 * need it to be. This can occur when the anchor or focus nodes
 * are non-text nodes, for instance. In this case, we want to trigger
 * a re-render of the editor, which in turn forces selection into
 * the correct place in the DOM. The `forceSelection` method
 * accomplishes this.
 *
 * This method should be used in cases where you need to explicitly
 * move the DOM selection from one place to another without a change
 * in ContentState.
 */
export function forceSelection(
  editorState: EditorState,
  selection: SelectionState,
): EditorState {
  return updateSelection(editorState, setHasFocus(selection, true), true);
}

/**
 * Move selection to the end of the editor without forcing focus.
 */
export function moveSelectionToEnd(editorState: EditorState): EditorState {
  const content = editorState.currentContent;
  const lastBlock = getLastBlock(content);
  const lastKey = lastBlock.key;
  const length = lastBlock.text.length;

  return acceptSelection(
    editorState,
    makeSelectionState({
      anchorKey: lastKey,
      anchorOffset: length,
      focusKey: lastKey,
      focusOffset: length,
      isBackward: false,
    }),
  );
}

/**
 * Force focus to the end of the editor. This is useful in scenarios
 * where we want to programmatically focus the input and it makes sense
 * to allow the user to continue working seamlessly.
 */
export function moveFocusToEnd(editorState: EditorState): EditorState {
  const afterSelectionMove = moveSelectionToEnd(editorState);
  return forceSelection(afterSelectionMove, afterSelectionMove.selection);
}

/**
 * Push the current ContentState onto the undo stack if it should be
 * considered a boundary state, and set the provided ContentState as the
 * new current content.
 */
export function pushContent(
  editorState: EditorState,
  contentState: ContentState,
  changeType: EditorChangeType,
  forceSelection: boolean = true,
): EditorState {
  if (editorState.currentContent === contentState) {
    return editorState;
  }

  const directionMap = EditorBidiService.getDirectionMap(
    contentState,
    editorState.directionMap,
  );

  if (!editorState.allowUndo) {
    return setEditorState(editorState, {
      currentContent: contentState,
      directionMap,
      lastChangeType: changeType,
      selection: contentState.selectionAfter,
      forceSelection,
      inlineStyleOverride: null,
    });
  }

  const selection = editorState.selection;
  const currentContent = editorState.currentContent;
  let undoStack = editorState.undoStack;
  let newContent = contentState;

  if (
    selection !== currentContent.selectionAfter ||
    mustBecomeBoundary(editorState, changeType)
  ) {
    undoStack = pushStack(undoStack, currentContent);
    newContent = {
      ...newContent,
      selectionBefore: selection,
    };
  } else if (
    changeType === 'insert-characters' ||
    changeType === 'backspace-character' ||
    changeType === 'delete-character'
  ) {
    // Preserve the previous selection.
    newContent = {
      ...newContent,
      selectionBefore: currentContent.selectionBefore,
    };
  }

  let inlineStyleOverride = editorState.inlineStyleOverride;

  // Don't discard inline style overrides for the following change types:
  const overrideChangeTypes = [
    'adjust-depth',
    'change-block-type',
    'split-block',
  ];

  if (overrideChangeTypes.indexOf(changeType) === -1) {
    inlineStyleOverride = null;
  }

  const editorStateChanges = {
    currentContent: newContent,
    directionMap,
    undoStack,
    redoStack: EMPTY_CONTENT_STACK,
    lastChangeType: changeType,
    selection: contentState.selectionAfter,
    forceSelection,
    inlineStyleOverride,
  };

  return setEditorState(editorState, editorStateChanges);
}

function peek<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) {
    return undefined;
  }
  return arr[arr.length - 1];
}

function shift<T>(arr: readonly T[]): readonly T[] {
  return arr.slice(0, arr.length - 1);
}
function push<T>(arr: readonly T[], item: T): readonly T[] {
  return arr.concat([item]);
}

/**
 * Make the top ContentState in the undo stack the new current content and
 * push the current content onto the redo stack.
 */
export function undo(editorState: EditorState): EditorState {
  if (!editorState.allowUndo) {
    return editorState;
  }

  const {undoStack, redoStack, currentContent} = editorState;
  const newCurrentContent = peek(undoStack);
  if (!newCurrentContent) {
    return editorState;
  }

  const directionMap = EditorBidiService.getDirectionMap(
    newCurrentContent,
    editorState.directionMap,
  );

  return setEditorState(editorState, {
    currentContent: newCurrentContent,
    directionMap,
    undoStack: shift(undoStack),
    redoStack: push(redoStack, currentContent),
    forceSelection: true,
    inlineStyleOverride: null,
    lastChangeType: 'undo',
    nativelyRenderedContent: null,
    selection: currentContent.selectionBefore,
  });
}

/**
 * Make the top ContentState in the redo stack the new current content and
 * push the current content onto the undo stack.
 */
export function redo(editorState: EditorState): EditorState {
  if (!editorState.allowUndo) {
    return editorState;
  }

  const {redoStack, undoStack, currentContent} = editorState;
  const newCurrentContent = peek(redoStack);
  if (!newCurrentContent) {
    return editorState;
  }

  const directionMap = EditorBidiService.getDirectionMap(
    newCurrentContent,
    editorState.directionMap,
  );

  return setEditorState(editorState, {
    currentContent: newCurrentContent,
    directionMap,
    undoStack: push(undoStack, currentContent),
    redoStack: shift(redoStack),
    forceSelection: true,
    inlineStyleOverride: null,
    lastChangeType: 'redo',
    nativelyRenderedContent: null,
    selection: newCurrentContent.selectionAfter,
  });
}

/**
 * Set the supplied SelectionState as the new current selection, and set
 * the `force` flag to trigger manual selection placement by the view.
 */
export function updateSelection(
  editorState: EditorState,
  selection: SelectionState,
  forceSelection: boolean,
): EditorState {
  return setEditorState(editorState, {
    selection,
    forceSelection,
    nativelyRenderedContent: null,
    inlineStyleOverride: null,
  });
}

/**
 * Regenerate the entire tree map for a given ContentState and decorator.
 * Returns an OrderedMap that maps all available ContentBlock objects.
 */
function generateNewTreeMap(
  contentState: ContentState,
  decorator?: DraftDecoratorType | null,
): Map<string, readonly any[]> {
  return new Map(
    map(contentState.blockMap, ([key, block]): [string, readonly any[]] => [
      key,
      BlockTree.generate(contentState, block, decorator || null),
    ]),
  );
}

/**
 * Regenerate tree map objects for all ContentBlocks that have changed
 * between the current editorState and newContent. Returns an OrderedMap
 * with only changed regenerated tree map objects.
 */
function regenerateTreeForNewBlocks(
  editorState: EditorState,
  newBlockMap: BlockMap,
  decorator?: DraftDecoratorType | null,
): ReadonlyMap<string, readonly DecoratorRange[]> {
  const contentState = editorState.currentContent;
  const prevBlockMap = contentState.blockMap;
  const prevTreeMap = editorState.treeMap;

  return new Map(
    map(newBlockMap, (entry): [string, readonly DecoratorRange[]] => {
      const [key, block] = entry;
      const prevTree = prevTreeMap.get(key);
      if (prevTree && prevBlockMap.get(key) === block) {
        return [key, prevTree];
      }
      return [key, BlockTree.generate(contentState, block, decorator || null)];
    }),
  );
}

/**
 * Generate tree map objects for a new decorator object, preserving any
 * decorations that are unchanged from the previous decorator.
 *
 * Note that in order for this to perform optimally, decoration Lists for
 * decorators should be preserved when possible to allow for direct immutable
 * List comparison.
 */
function regenerateTreeForNewDecorator(
  content: ContentState,
  blockMap: BlockMap,
  previousTreeMap: ReadonlyMap<string, readonly any[]>,
  decorator: DraftDecoratorType,
  existingDecorator: DraftDecoratorType,
): ReadonlyMap<string, readonly DecoratorRange[]> {
  const iter = flatMap(previousTreeMap, (entry):
    | [string, readonly any[]]
    | undefined => {
    const [key] = entry;
    const block = blockMap.get(key)!;
    if (
      fastDeepEqual(
        decorator.getDecorations(block, content),
        existingDecorator.getDecorations(block, content),
      )
    ) {
      return undefined;
    }
    return [key, BlockTree.generate(content, block, decorator)];
  });
  const updates: Record<string, readonly any[]> = {};
  for (const [key, value] of iter) {
    updates[key] = value;
  }
  return mergeMapUpdates(previousTreeMap, updates);
}

/**
 * Return whether a change should be considered a boundary state, given
 * the previous change type. Allows us to discard potential boundary states
 * during standard typing or deletion behavior.
 */
function mustBecomeBoundary(
  editorState: EditorState,
  changeType: EditorChangeType,
): boolean {
  const lastChangeType = editorState.lastChangeType;
  return (
    changeType !== lastChangeType ||
    (changeType !== 'insert-characters' &&
      changeType !== 'backspace-character' &&
      changeType !== 'delete-character')
  );
}

function getInlineStyleForCollapsedSelection(
  content: ContentState,
  selection: SelectionState,
): DraftInlineStyle {
  const startKey = getStartKey(selection);
  const startOffset = getStartOffset(selection);
  const startBlock = getBlockForKey(content, startKey);

  // If the cursor is not at the start of the block, look backward to
  // preserve the style of the preceding character.
  if (startOffset > 0) {
    return getInlineStyleAt(startBlock, startOffset - 1);
  }

  // The caret is at position zero in this block. If the block has any
  // text at all, use the style of the first character.
  if (startBlock.text.length > 0) {
    return getInlineStyleAt(startBlock, 0);
  }

  // Otherwise, look upward in the document to find the closest character.
  return lookUpwardForInlineStyle(content, startKey);
}

function getInlineStyleForNonCollapsedSelection(
  content: ContentState,
  selection: SelectionState,
): DraftInlineStyle {
  const startKey = getStartKey(selection);
  const startOffset = getStartOffset(selection);
  const startBlock = getBlockForKey(content, startKey);

  // If there is a character just inside the selection, use its style.
  if (startOffset < startBlock.text.length) {
    return getInlineStyleAt(startBlock, startOffset);
  }

  // Check if the selection at the end of a non-empty block. Use the last
  // style in the block.
  if (startOffset > 0) {
    return getInlineStyleAt(startBlock, startOffset - 1);
  }

  // Otherwise, look upward in the document to find the closest character.
  return lookUpwardForInlineStyle(content, startKey);
}

function lookUpwardForInlineStyle(
  content: ContentState,
  fromKey: string,
): DraftInlineStyle {
  let lastNonEmpty: BlockNode | undefined;
  for (const [key, block] of content.blockMap) {
    if (key === fromKey) {
      break;
    }
    if (block.text.length > 0) {
      lastNonEmpty = block;
    }
  }

  if (lastNonEmpty) {
    return getInlineStyleAt(lastNonEmpty, lastNonEmpty.text.length - 1);
  }
  return EMPTY_SET;
}
