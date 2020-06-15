/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import getSampleStateForTesting from '../getSampleStateForTesting';
import {getStartKey} from '../../immutable/SelectionState';
import {getBlockAfter, getBlockForKey} from '../../immutable/ContentState';
import ContentStateInlineStyle from '../ContentStateInlineStyle';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';

const {contentState, selectionState} = getSampleStateForTesting();

const initialSelection = {
  ...selectionState,
  focusOffset: getBlockForKey(contentState, getStartKey(selectionState)).text
    .length,
};

const assertAddContentStateInlineStyle = (
  inlineStyle: string,
  selection = selectionState,
  content = contentState,
) => {
  const newContentState = ContentStateInlineStyle.add(
    content,
    selection,
    inlineStyle,
  );

  expect(blockMapToJsonObject(newContentState.blockMap)).toMatchSnapshot();

  return newContentState;
};

const assertRemoveContentStateInlineStyle = (
  inlineStyle: string,
  selection = selectionState,
  content = contentState,
) => {
  const newContentState = ContentStateInlineStyle.remove(
    content,
    selection,
    inlineStyle,
  );

  expect(blockMapToJsonObject(newContentState.blockMap)).toMatchSnapshot();

  return newContentState;
};

test('must add styles', () => {
  const modified = assertAddContentStateInlineStyle('BOLD', initialSelection);

  assertAddContentStateInlineStyle(
    'ITALIC',
    {...selectionState, focusOffset: 2},
    modified,
  );
});

test('must remove styles', () => {
  // Go ahead and add some styles that we'll then remove.
  let modified = assertAddContentStateInlineStyle('BOLD', initialSelection);
  modified = assertAddContentStateInlineStyle(
    'ITALIC',
    initialSelection,
    modified,
  );

  // we then remove the added styles
  modified = assertRemoveContentStateInlineStyle(
    'BOLD',
    initialSelection,
    modified,
  );
  assertRemoveContentStateInlineStyle(
    'ITALIC',
    {...initialSelection, focusOffset: 2},
    modified,
  );
});

test('must add and remove styles accross multiple blocks', () => {
  const nextBlock = getBlockAfter(contentState, getStartKey(selectionState))!;
  const selection = {
    ...selectionState,
    focusKey: nextBlock.key,
    focusOffset: nextBlock.text.length,
  };

  const modified = assertAddContentStateInlineStyle('BOLD', selection);
  assertRemoveContentStateInlineStyle('BOLD', selection, modified);
});
