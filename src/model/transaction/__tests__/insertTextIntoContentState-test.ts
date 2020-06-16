/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */
import getSampleStateForTesting from '../getSampleStateForTesting';
import {
  CharacterMetadata,
  EMPTY_CHARACTER,
  makeCharacterMetadata,
} from '../../immutable/CharacterMetadata';
import {getFirstBlock} from '../../immutable/ContentState';
import insertTextIntoContentState from '../insertTextIntoContentState';
import {blockMapToJsonObject} from '../../../util/blockMapToJson';
import {BOLD} from '../../immutable/SampleDraftInlineStyle';

const {contentState, selectionState} = getSampleStateForTesting();

const EMPTY = EMPTY_CHARACTER;
const initialBlock = getFirstBlock(contentState);

const assertInsertTextIntoContentState = (
  text: string,
  characterMetadata: CharacterMetadata,
  selection = selectionState,
) => {
  expect(
    blockMapToJsonObject(
      insertTextIntoContentState(
        contentState,
        selection,
        text,
        characterMetadata,
      ).blockMap,
    ),
  ).toMatchSnapshot();
};

test('must throw if selection is not collapsed', () => {
  expect(() => {
    insertTextIntoContentState(
      contentState,
      {...selectionState, focusOffset: 2},
      'hey',
      EMPTY,
    );
  }).toThrow();
});

test('must return early if no text is provided', () => {
  assertInsertTextIntoContentState('', EMPTY);
});

test('must insert at the start', () => {
  assertInsertTextIntoContentState('xx', makeCharacterMetadata({style: BOLD}));
});

test('must insert within block', () => {
  assertInsertTextIntoContentState('xx', makeCharacterMetadata({style: BOLD}), {
    ...selectionState,
    focusOffset: 2,
    anchorOffset: 2,
    isBackward: false,
  });
});

test('must insert at the end', () => {
  assertInsertTextIntoContentState('xx', makeCharacterMetadata({style: BOLD}), {
    ...selectionState,
    focusOffset: initialBlock.text.length,
    anchorOffset: initialBlock.text.length,
    isBackward: false,
  });
});
