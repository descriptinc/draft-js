/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @flow strict-local
 * @format
 */

'use strict';

jest.mock('generateRandomKey');

const mockUUID = require('mockUUID');
jest.mock('uuid', () => mockUUID);
const AtomicBlockUtils = require('AtomicBlockUtils');
const BlockMapBuilder = require('BlockMapBuilder');
const ContentBlockNode = require('ContentBlockNode');
const Entity = require('DraftEntity');
const EditorState = require('EditorState');
const SelectionState = require('SelectionState');

const getSampleStateForTesting = require('getSampleStateForTesting');
const invariant = require('invariant');

const {editorState, contentState, selectionState} = getSampleStateForTesting();

const initialBlock = contentState.getBlockMap().first();
const ENTITY_KEY = Entity.create('TOKEN', 'MUTABLE');
const CHARACTER = ' ';

const getInvariantViolation = msg => {
  try {
    /* eslint-disable-next-line */
    invariant(false, msg);
  } catch (e) {
    return e;
  }
};

const toggleExperimentalTreeDataSupport = enabled => {
  jest.doMock('gkx', () => name => {
    return name === 'draft_tree_data_support' ? enabled : false;
  });
};

const assertAtomic = state => {
  expect(
    state
      .getCurrentContent()
      .getBlockMap()
      .toIndexedSeq()
      .toJS(),
  ).toMatchSnapshot();
};

const assertInsertAtomicBlock = (
  state = editorState,
  entity = ENTITY_KEY,
  character = CHARACTER,
  experimentalTreeDataSupport = false,
) => {
  toggleExperimentalTreeDataSupport(experimentalTreeDataSupport);
  const newState = AtomicBlockUtils.insertAtomicBlock(state, entity, character);
  assertAtomic(newState);
  return newState;
};

const assertMoveAtomicBlock = (
  atomicBlock,
  seletion,
  state = editorState,
  insertionType,
) => {
  const newState = AtomicBlockUtils.moveAtomicBlock(
    state,
    atomicBlock,
    seletion,
    insertionType,
  );
  assertAtomic(newState);
  return newState;
};

beforeEach(() => {
  jest.resetModules();
  jest.mock('uuid', () => mockUUID);
});

test('must insert atomic at start of block with collapsed seletion', () => {
  assertInsertAtomicBlock();
});

test('must insert atomic within a block, via split with collapsed selection', () => {
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: 2,
        focusOffset: 2,
      }),
    ),
  );
});

test('must insert atomic after a block with collapsed selection', () => {
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: initialBlock.text.length,
        focusOffset: initialBlock.text.length,
      }),
    ),
  );
});

test('must move atomic at start of block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const firstBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();

  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: firstBlock.key,
      focusKey: firstBlock.key,
    }),
    resultEditor,
  );
});

test('must move atomic at end of block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const lastBlock = resultContent.getBlockMap().last();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();

  // Move atomic block at end of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: lastBlock.key,
      anchorOffset: lastBlock.text.length,
      focusKey: lastBlock.key,
      focusOffset: lastBlock.text.length,
    }),
    resultEditor,
  );
});

test('must move atomic inbetween block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const thirdBlock = resultContent
    .getBlockMap()
    .skip(2)
    .first();

  // Move atomic block inbetween the split parts of the third block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: thirdBlock.key,
      anchorOffset: 2,
      focusKey: thirdBlock.key,
      focusOffset: 2,
    }),
    resultEditor,
  );
});

test('must move atomic before block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const firstBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();

  // Move atomic block before the first block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: firstBlock.key,
    }),
    resultEditor,
    'before',
  );
});

test('must move atomic after block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const lastBlock = resultContent.getBlockMap().last();

  // Move atomic block after the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      focusKey: lastBlock.key,
    }),
    resultEditor,
    'after',
  );
});

test("mustn't move atomic next to itself with collapsed selection", () => {
  // Insert atomic block at the second position
  const resultEditor = assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: initialBlock.text.length,
        focusOffset: initialBlock.text.length,
      }),
    ),
  );
  const resultContent = resultEditor.getCurrentContent();
  const beforeAtomicBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const afterAtomicBlock = resultContent
    .getBlockMap()
    .skip(2)
    .first();

  // Move atomic block above itself by moving it after preceding block by
  // replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: beforeAtomicBlock.key,
        anchorOffset: beforeAtomicBlock.text.length,
        focusKey: beforeAtomicBlock.key,
        focusOffset: beforeAtomicBlock.text.length,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block above itself by moving it after preceding block
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: beforeAtomicBlock.key,
        focusKey: beforeAtomicBlock.key,
      }),
      'after',
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block above itself by replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: atomicBlock.key,
        focusKey: atomicBlock.key,
        anchorOffset: atomicBlock.text.length,
        focusOffset: atomicBlock.text.length,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block above itself
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: atomicBlock.key,
      }),
      'before',
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block below itself by moving it before following block by replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: afterAtomicBlock.key,
        focusKey: afterAtomicBlock.key,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block below itself by moving it before following block
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: afterAtomicBlock.key,
        focusKey: afterAtomicBlock.key,
      }),
      'before',
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block below itself by replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: atomicBlock.key,
        anchorOffset: atomicBlock.text.length,
        focusKey: atomicBlock.key,
        focusOffset: atomicBlock.text.length,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block below itself
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        focusKey: atomicBlock.key,
      }),
      'after',
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));
});

/**
 * Non collapsed
 */
test('must insert atomic at start of block', () => {
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: 0,
        focusOffset: 2,
      }),
    ),
  );
});

test('must insert atomic within a block', () => {
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: 1,
        focusOffset: 2,
      }),
    ),
  );
});

test('must insert atomic at end of block', () => {
  const origLength = initialBlock.text.length;
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: origLength - 2,
        focusOffset: origLength,
      }),
    ),
  );
});

test('must insert atomic for cross-block selection', () => {
  const originalThirdBlock = contentState
    .getBlockMap()
    .skip(2)
    .first();
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: 2,
        focusKey: originalThirdBlock.key,
        focusOffset: 2,
      }),
    ),
  );
});

test('must move atomic at start of block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const lastBlock = resultContent.getBlockMap().last();

  // Move atomic block at start of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: lastBlock.key,
      anchorOffset: 0,
      focusKey: lastBlock.key,
      focusOffset: 2,
    }),
    resultEditor,
  );
});

test('must move atomic at end of block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const lastBlock = resultContent.getBlockMap().last();

  // Move atomic block at end of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: lastBlock.key,
      anchorOffset: lastBlock.text.length - 2,
      focusKey: lastBlock.key,
      focusOffset: lastBlock.text.length,
    }),
    resultEditor,
  );
});

test('must move atomic inbetween block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const thirdBlock = resultContent
    .getBlockMap()
    .skip(2)
    .first();

  // Move atomic block inbetween the split parts of the third block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: thirdBlock.key,
      anchorOffset: 1,
      focusKey: thirdBlock.key,
      focusOffset: 2,
    }),
    resultEditor,
  );
});

test('must move atomic before block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const firstBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const lastBlock = resultContent.getBlockMap().last();

  // Move atomic block before the first block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: firstBlock.key,
      anchorOffset: 2,
      focusKey: lastBlock.key,
      focusOffset: 2,
    }),
    resultEditor,
    'before',
  );
});

test('must move atomic after block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.getCurrentContent();
  const firstBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const lastBlock = resultContent.getBlockMap().last();

  // Move atomic block after the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: firstBlock.key,
      anchorOffset: 2,
      focusKey: lastBlock.key,
      focusOffset: 2,
    }),
    resultEditor,
    'after',
  );
});

test("mustn't move atomic next to itself", () => {
  // Insert atomic block at the second position
  const resultEditor = assertInsertAtomicBlock(
    EditorState.forceSelection(
      editorState,
      selectionState.merge({
        anchorOffset: initialBlock.text.length,
        focusOffset: initialBlock.text.length,
      }),
    ),
  );
  const resultContent = resultEditor.getCurrentContent();
  const beforeAtomicBlock = resultContent.getBlockMap().first();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();
  const afterAtomicBlock = resultContent
    .getBlockMap()
    .skip(2)
    .first();

  // Move atomic block above itself by moving it after preceding block by
  // replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: beforeAtomicBlock.key,
        anchorOffset: beforeAtomicBlock.text.length - 2,
        focusKey: beforeAtomicBlock.key,
        focusOffset: beforeAtomicBlock.text.length,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));

  // Move atomic block below itself by moving it before following block by
  // replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      new SelectionState({
        anchorKey: afterAtomicBlock.key,
        anchorOffset: 0,
        focusKey: afterAtomicBlock.key,
        focusOffset: 2,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));
});

test('must be able to insert atomic block when experimentalTreeDataSupport is enabled', () => {
  // Insert atomic block at the first position
  assertInsertAtomicBlock(
    EditorState.forceSelection(
      EditorState.createWithContent(
        contentState.set(
          'blockMap',
          BlockMapBuilder.createFromArray([
            new ContentBlockNode({
              text: 'first block',
              key: 'A',
            }),
          ]),
        ),
      ),
      SelectionState.createEmpty('A'),
    ),
    ENTITY_KEY,
    CHARACTER,
    true,
  );
});

test('must be able to move atomic block when experimentalTreeDataSupport is enabled', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock(
    EditorState.forceSelection(
      EditorState.createWithContent(
        contentState.set(
          'blockMap',
          BlockMapBuilder.createFromArray([
            new ContentBlockNode({
              text: 'first block',
              key: 'A',
            }),
          ]),
        ),
      ),
      SelectionState.createEmpty('A'),
    ),
    ENTITY_KEY,
    CHARACTER,
    true,
  );

  const resultContent = resultEditor.getCurrentContent();
  const lastBlock = resultContent.getBlockMap().last();
  const atomicBlock = resultContent
    .getBlockMap()
    .skip(1)
    .first();

  // Move atomic block at end of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    new SelectionState({
      anchorKey: lastBlock.key,
      anchorOffset: lastBlock.text.length,
      focusKey: lastBlock.key,
      focusOffset: lastBlock.text.length,
      isBackward: false,
      hasFocus: false,
    }),
    resultEditor,
    'after',
  );
});
