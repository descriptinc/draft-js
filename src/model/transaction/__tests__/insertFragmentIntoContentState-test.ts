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
import {getFirstBlock} from '../../immutable/ContentState';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import {makeContentBlock} from '../../immutable/ContentBlock';
import insertFragmentIntoContentState from '../insertFragmentIntoContentState';
import {BlockMap} from '../../immutable/BlockMap';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';

jest.mock('../../keys/generateRandomKey');

const {contentState, selectionState} = getSampleStateForTesting();

const DEFAULT_BLOCK_CONFIG = {
  key: 'j',
  type: 'unstyled',
  text: 'xx',
  data: new Map([['a', 1]]),
};

const initialBlock = getFirstBlock(contentState);

const createFragment = (fragment = {}) => {
  const newFragment = Array.isArray(fragment) ? fragment : [fragment];

  return createFromArray(
    newFragment.map(config =>
      makeContentBlock({
        ...DEFAULT_BLOCK_CONFIG,
        ...config,
      }),
    ),
  );
};

const assertInsertFragmentIntoContentState = (
  fragment: BlockMap,
  selection = selectionState,
  content = contentState,
) => {
  expect(
    blockMapToJsonArray(
      insertFragmentIntoContentState(content, selection, fragment).blockMap,
    ),
  ).toMatchSnapshot();
};

test('must throw if no fragment is provided', () => {
  const fragment = createFromArray([]);
  expect(() => {
    insertFragmentIntoContentState(contentState, selectionState, fragment);
  }).toThrow();
});

test('must apply fragment to the start', () => {
  assertInsertFragmentIntoContentState(createFragment());
});

test('must apply fragment to within block', () => {
  assertInsertFragmentIntoContentState(createFragment(), {
    ...selectionState,
    focusOffset: 2,
    anchorOffset: 2,
    isBackward: false,
  });
});

test('must apply fragment at the end', () => {
  assertInsertFragmentIntoContentState(createFragment(), {
    ...selectionState,
    focusOffset: initialBlock.text.length,
    anchorOffset: initialBlock.text.length,
    isBackward: false,
  });
});

test('must apply multiblock fragments', () => {
  assertInsertFragmentIntoContentState(
    createFragment([
      DEFAULT_BLOCK_CONFIG,
      {
        key: 'k',
        text: 'yy',
        data: new Map([['b', 2]]),
      },
    ]),
  );
});
