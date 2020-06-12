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

export function makeSelectionState({
  anchorKey,
  anchorOffset,
  focusKey,
  focusOffset,
  isBackward = false,
  hasFocus = false,
}: Partial<SelectionState> &
  Pick<
    SelectionState,
    'anchorKey' | 'anchorOffset' | 'focusKey' | 'focusOffset'
  >): SelectionState {
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
