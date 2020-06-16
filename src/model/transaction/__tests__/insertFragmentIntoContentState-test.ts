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
import invariant from '../../../fbjs/invariant';
import {createFromArray} from '../../immutable/BlockMapBuilder';
import {makeContentBlock} from '../../immutable/ContentBlock';
import insertFragmentIntoContentState from '../insertFragmentIntoContentState';
import {BlockMap} from '../../immutable/BlockMap';
import {blockMapToJsonArray} from '../../../util/blockMapToJson';
import {makeEmptySelection} from '../../immutable/SelectionState';
import {BlockNodeRecord} from '../../immutable/BlockNodeRecord';

jest.mock('../../keys/generateRandomKey');

const {contentState, selectionState} = getSampleStateForTesting();

const DEFAULT_BLOCK_CONFIG = {
  key: 'j',
  type: 'unstyled',
  text: 'xx',
  data: new Map([['a', 1]]),
};

const initialBlock = getFirstBlock(contentState);

const getInvariantViolation = (msg: string) => {
  try {
    /* eslint-disable-next-line */
    invariant(false, msg);
  } catch (e) {
    return e;
  }
};

const createFragment = (fragment = {}, experimentalTreeDataSupport = false) => {
  if (experimentalTreeDataSupport) {
    throw new Error('not implemented');
  }
  // const ContentBlockNodeRecord = experimentalTreeDataSupport
  //   ? ContentBlockNode
  //   : ContentBlock;
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

const createContentBlockNodeFragment = (
  fragment: Partial<BlockNodeRecord> | Partial<BlockNodeRecord>[],
) => {
  return createFragment(fragment, true);
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

test.skip('must be able to insert a fragment with a single ContentBlockNode', () => {
  const initialSelection = makeEmptySelection('A');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'A',
        text: '',
      },
    ]),
  };

  assertInsertFragmentIntoContentState(
    createContentBlockNodeFragment([
      {
        key: 'B',
        text: 'some text',
      },
    ]),
    initialSelection,
    initialContent,
  );
});

test.skip('must be able to insert fragment of ContentBlockNodes', () => {
  const initialSelection = makeEmptySelection('first');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'first',
        text: '',
        nextSibling: 'second',
      },
      {
        key: 'second',
        text: '',
        prevSibling: 'first',
      },
    ]),
  };

  assertInsertFragmentIntoContentState(
    createContentBlockNodeFragment([
      {
        key: 'B',
        text: '',
        children: ['C'],
        nextSibling: 'E',
      },
      {
        key: 'C',
        parent: 'B',
        text: '',
        children: ['D'],
      },
      {
        key: 'D',
        parent: 'C',
        text: 'Delta',
      },
      {
        key: 'E',
        text: 'Elephant',
        prevSibling: 'B',
      },
    ]),
    initialSelection,
    initialContent,
  );
});

test.skip('must be able to insert fragment of ContentBlockNodes after nested block', () => {
  const initialSelection = makeEmptySelection('firstChild');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'root',
        text: '',
        children: ['firstChild', 'lastChild'],
      },
      {
        key: 'firstChild',
        parent: 'root',
        text: '',
        nextSibling: 'lastChild',
      },
      {
        key: 'lastChild',
        parent: 'root',
        text: '',
        prevSibling: 'firstChild',
      },
    ]),
  };

  assertInsertFragmentIntoContentState(
    createContentBlockNodeFragment([
      {
        key: 'B',
        text: '',
        children: ['C'],
        nextSibling: 'E',
      },
      {
        key: 'C',
        parent: 'B',
        text: '',
        children: ['D'],
      },
      {
        key: 'D',
        parent: 'C',
        text: 'Delta',
      },
      {
        key: 'E',
        text: 'Elephant',
        prevSibling: 'B',
      },
    ]),
    initialSelection,
    initialContent,
  );
});

test.skip('must be able to insert a fragment of ContentBlockNodes while updating the target block with the first fragment block properties', () => {
  const initialSelection = makeEmptySelection('first');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'first',
        text: '',
        nextSibling: 'second',
      },
      {
        key: 'second',
        text: '',
        prevSibling: 'first',
      },
    ]),
  };

  assertInsertFragmentIntoContentState(
    createContentBlockNodeFragment([
      {
        key: 'A',
        text: 'Alpha',
        nextSibling: 'B',
      },
      {
        key: 'B',
        text: '',
        children: ['C'],
        prevSibling: 'A',
      },
      {
        key: 'C',
        parent: 'B',
        text: '',
        children: ['D'],
      },
      {
        key: 'D',
        parent: 'C',
        text: 'Delta',
      },
    ]),
    initialSelection,
    initialContent,
  );
});

test.skip('must be able to insert a fragment of ContentBlockNodes while updating the target block with the first fragment block properties after nested block', () => {
  const initialSelection = makeEmptySelection('firstChild');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'root',
        text: '',
        children: ['firstChild', 'lastChild'],
      },
      {
        key: 'firstChild',
        parent: 'root',
        text: '',
        nextSibling: 'lastChild',
      },
      {
        key: 'lastChild',
        parent: 'root',
        text: '',
        prevSibling: 'firstChild',
      },
    ]),
  };

  assertInsertFragmentIntoContentState(
    createContentBlockNodeFragment([
      {
        key: 'A',
        text: 'Alpha',
        nextSibling: 'B',
      },
      {
        key: 'B',
        text: '',
        children: ['C'],
        prevSibling: 'A',
        nextSibling: 'E',
      },
      {
        key: 'C',
        parent: 'B',
        text: '',
        children: ['D'],
      },
      {
        key: 'D',
        parent: 'C',
        text: 'Delta',
      },
      {
        key: 'E',
        text: 'Elephant',
        prevSibling: 'B',
      },
    ]),
    initialSelection,
    initialContent,
  );
});

test.skip('must throw an error when trying to apply ContentBlockNode fragments when selection is on a block that has children', () => {
  const initialSelection = makeEmptySelection('A');
  const initialContent = {
    ...contentState,
    blockMap: createContentBlockNodeFragment([
      {
        key: 'A',
        text: '',
        children: ['B'],
      },
      {
        key: 'B',
        text: 'child',
        parent: 'A',
      },
    ]),
  };

  expect(() =>
    insertFragmentIntoContentState(
      initialContent,
      initialSelection,
      createContentBlockNodeFragment([
        {
          key: 'C',
          text: 'some text',
        },
      ]),
    ),
  ).toThrow(
    getInvariantViolation(
      '`insertFragment` should not be called when a container node is selected.',
    ),
  );
});
