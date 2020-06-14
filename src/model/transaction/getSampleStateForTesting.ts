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

import {
  createWithContent,
  EditorState,
  forceSelection,
} from '../immutable/EditorState';
import {ContentState, makeContentState} from '../immutable/ContentState';
import {makeSelectionState, SelectionState} from '../immutable/SelectionState';
import {makeContentBlock} from '../immutable/ContentBlock';
import {repeat} from '../descript/Iterables';
import {makeCharacterMetadata} from '../immutable/CharacterMetadata';
import SampleInlineStyles from '../immutable/SampleDraftInlineStyle';
import {createFromArray} from '../immutable/BlockMapBuilder';
import DraftEntity from '../entity/DraftEntity';

const {BOLD, ITALIC} = SampleInlineStyles;
const ENTITY_KEY = '2';

const BLOCKS = [
  makeContentBlock({
    key: 'a',
    type: 'unstyled',
    text: 'Alpha',
  }),
  makeContentBlock({
    key: 'b',
    type: 'unordered-list-item',
    text: 'Bravo',
    characterList: Array.from(
      repeat(
        5,
        makeCharacterMetadata({
          style: BOLD,
          entity: ENTITY_KEY,
        }),
      ),
    ),
  }),
  makeContentBlock({
    key: 'c',
    type: 'code-block',
    text: 'Test',
  }),
  makeContentBlock({
    key: 'd',
    type: 'code-block',
    text: '',
    characterList: [],
  }),
  makeContentBlock({
    key: 'e',
    type: 'code-block',
    characterList: [],
  }),
  makeContentBlock({
    key: 'f',
    type: 'blockquote',
    text: 'Charlie',
    characterList: Array.from(
      repeat(
        7,
        makeCharacterMetadata({
          style: ITALIC,
          entity: null,
        }),
      ),
    ),
  }),
];

const selectionState = makeSelectionState({
  anchorKey: 'a',
  anchorOffset: 0,
  focusKey: 'a',
  focusOffset: 0,
  isBackward: false,
  hasFocus: true,
});

const blockMap = createFromArray(BLOCKS);
const contentState = makeContentState({
  blockMap,
  selectionBefore: selectionState,
  selectionAfter: selectionState,
});

DraftEntity.__create('IMAGE', 'IMMUTABLE');

let editorState = createWithContent(contentState);
editorState = forceSelection(editorState, selectionState);

const getSampleStateForTesting = (): {
  editorState: EditorState;
  contentState: ContentState;
  selectionState: SelectionState;
} => {
  return {editorState, contentState, selectionState};
};
export default getSampleStateForTesting;
