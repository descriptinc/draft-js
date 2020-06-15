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
import {EditorState, getBlockTree} from '../../model/immutable/EditorState';
import {SelectionState} from '../../model/immutable/SelectionState';
import {nullthrows} from '../../fbjs/nullthrows';
import DraftOffsetKey from './DraftOffsetKey';
import {first, skipUntil} from '../../model/descript/Iterables';

export default function getUpdatedSelectionState(
  editorState: EditorState,
  anchorKey: string,
  anchorOffset: number,
  focusKey: string,
  focusOffset: number,
): SelectionState {
  const selection: SelectionState = nullthrows(editorState.selection);
  if (!anchorKey || !focusKey) {
    // If we cannot make sense of the updated selection state, stick to the current one.
    if (global.__DEV__) {
      /* eslint-disable-next-line */
      console.warn('Invalid selection state.', arguments, editorState.toJS());
    }
    return selection;
  }

  const anchorPath = DraftOffsetKey.decode(anchorKey);
  const anchorBlockKey = anchorPath.blockKey;
  const anchorLeafBlockTree = getBlockTree(editorState, anchorBlockKey);
  const anchorLeaf =
    anchorLeafBlockTree?.[anchorPath.decoratorKey]?.leaves?.[
      anchorPath.leafKey
    ];

  const focusPath = DraftOffsetKey.decode(focusKey);
  const focusBlockKey = focusPath.blockKey;
  const focusLeafBlockTree = getBlockTree(editorState, focusBlockKey);
  const focusLeaf =
    focusLeafBlockTree?.[focusPath.decoratorKey]?.leaves?.[focusPath.leafKey];

  if (!anchorLeaf || !focusLeaf) {
    // If we cannot make sense of the updated selection state, stick to the current one.
    if (global.__DEV__) {
      /* eslint-disable-next-line */
      console.warn('Invalid selection state.', arguments, editorState);
    }
    return selection;
  }

  const anchorLeafStart: number = anchorLeaf.start;
  const focusLeafStart: number = focusLeaf.start;

  const anchorBlockOffset = anchorLeaf ? anchorLeafStart + anchorOffset : null;
  const focusBlockOffset = focusLeaf ? focusLeafStart + focusOffset : null;

  const areEqual =
    selection.anchorKey === anchorBlockKey &&
    selection.anchorOffset === anchorBlockOffset &&
    selection.focusKey === focusBlockKey &&
    selection.focusOffset === focusBlockOffset;

  if (areEqual) {
    return selection;
  }

  let isBackward = false;
  if (anchorBlockKey === focusBlockKey) {
    const anchorLeafEnd: number = anchorLeaf.end;
    const focusLeafEnd: number = focusLeaf.end;
    if (focusLeafStart === anchorLeafStart && focusLeafEnd === anchorLeafEnd) {
      isBackward = focusOffset < anchorOffset;
    } else {
      isBackward = focusLeafStart < anchorLeafStart;
    }
  } else {
    const startKey = first(
      skipUntil(
        editorState.currentContent.blockMap.keys(),
        k => k === anchorBlockKey || k === focusBlockKey,
      ),
    );
    isBackward = startKey === focusBlockKey;
  }

  return {
    ...selection,
    anchorKey: anchorBlockKey,
    anchorOffset:
      anchorBlockOffset !== null ? anchorBlockOffset : selection.anchorOffset,
    focusKey: focusBlockKey,
    focusOffset:
      focusBlockOffset !== null ? focusBlockOffset : selection.focusOffset,
    isBackward,
  };
}
