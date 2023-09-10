/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

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
import {createFromArray} from '../immutable/BlockMapBuilder';
import {BOLD, ITALIC} from '../immutable/SampleDraftInlineStyle';
import {createEntity} from '../immutable/EntityMap';

let BASE_ENTITY_MAP = createEntity(new Map(), 'TOKEN', 'IMMUTABLE').entityMap;
const entityRes = createEntity(BASE_ENTITY_MAP, 'IMAGE', 'IMMUTABLE');
BASE_ENTITY_MAP = entityRes.entityMap;
const ENTITY_KEY = entityRes.entityKey;

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
  entityMap: BASE_ENTITY_MAP,
});

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
