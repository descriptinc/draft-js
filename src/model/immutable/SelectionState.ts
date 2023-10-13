/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

export type SelectionState = Readonly<{
  anchorKey: string;
  anchorOffset: number;
  focusKey: string;
  focusOffset: number;
  isBackward: boolean;
  hasFocus: boolean;
}>;

export function getStartOffset({
  isBackward,
  focusOffset,
  anchorOffset,
}: SelectionState): number {
  return isBackward ? focusOffset : anchorOffset;
}

export function getEndOffset({
  isBackward,
  anchorOffset,
  focusOffset,
}: SelectionState): number {
  return isBackward ? anchorOffset : focusOffset;
}

export function isCollapsed({
  anchorKey,
  focusKey,
  anchorOffset,
  focusOffset,
}: SelectionState): boolean {
  return anchorKey === focusKey && anchorOffset === focusOffset;
}

export function getStartKey({
  isBackward,
  focusKey,
  anchorKey,
}: SelectionState): string {
  return isBackward ? focusKey : anchorKey;
}

export function getEndKey({
  isBackward,
  focusKey,
  anchorKey,
}: SelectionState): string {
  return isBackward ? anchorKey : focusKey;
}

/**
 * Return whether the specified range overlaps with an edge of the
 * SelectionState.
 */
export function hasEdgeWithin(
  sel: SelectionState,
  blockKey: string,
  start: number,
  end: number,
): boolean {
  const {anchorKey, focusKey, anchorOffset, focusOffset} = sel;
  if (anchorKey === focusKey && anchorKey === blockKey) {
    const selectionStart = getStartOffset(sel);
    const selectionEnd = getEndOffset(sel);
    return (
      (start <= selectionStart && selectionStart <= end) || // selectionStart is between start and end, or
      (start <= selectionEnd && selectionEnd <= end) // selectionEnd is between start and end
    );
  }

  if (blockKey !== anchorKey && blockKey !== focusKey) {
    return false;
  }

  const offsetToCheck = blockKey === anchorKey ? anchorOffset : focusOffset;

  return start <= offsetToCheck && end >= offsetToCheck;
}

/**
 * Returns whether the selection starts (if forward) or ends (if backward)
 * on the trailing edge of a leaf node, and if there are additional leaves
 * in the block after it.
 */
export function isOnlyOnTrailingEdgeAndIsNotLastInBlock(
  sel: SelectionState,
  blockKey: string,
  end: number,
  blockLength: number,
): boolean {
  const {isBackward, anchorOffset, focusOffset, focusKey, anchorKey} = sel;
  return (
    (isBackward && focusKey === blockKey && focusOffset === end && end < blockLength) ||
    (!isBackward && anchorKey === blockKey && anchorOffset === end && end < blockLength)
  );
}

/**
 * Returns whether the selection ends (if forward) or starts (if backward)
 * on the leading edge of a leaf node, and if there are additional leaves
 * in the block _and in the selection_ before it.
 */
export function isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(
  sel: SelectionState,
  blockKey: string,
  start: number,
): boolean {
  const {isBackward, anchorOffset, focusOffset, focusKey, anchorKey} = sel;
  if (isBackward && anchorKey === blockKey && anchorOffset === start && start > 0) {
    // are there any leaves in the selection before this one?
    return focusKey !== blockKey || focusOffset < start;
  }
  if (!isBackward && focusKey === blockKey && focusOffset === start && start > 0) {
    // are there any leaves in the selection before this one?
    return anchorKey !== blockKey || anchorOffset < start;
  }
  return false;
}

export function makeSelectionState({
  anchorKey,
  anchorOffset = 0,
  focusKey = anchorKey,
  focusOffset = 0,
  isBackward = false,
  hasFocus = false,
}: Partial<SelectionState> &
  Pick<SelectionState, 'anchorKey'>): SelectionState {
  return {
    anchorKey,
    anchorOffset,
    focusKey,
    focusOffset,
    isBackward,
    hasFocus,
  };
}

export function makeNullSelection(): SelectionState {
  return makeEmptySelection('');
}

export function makeEmptySelection(key: string): SelectionState {
  return makeSelectionState({
    anchorKey: key,
    anchorOffset: 0,
    focusKey: key,
    focusOffset: 0,
  });
}

export function setHasFocus(
  selection: SelectionState,
  hasFocus: boolean,
): SelectionState {
  if (selection.hasFocus === hasFocus) {
    return selection;
  }
  return {
    ...selection,
    hasFocus,
  };
}
