/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import mockUUID from '../../keys/mockUUID';
import getSampleStateForTesting from '../../transaction/getSampleStateForTesting';
import {first, rest, takeNth} from '../../descript/Iterables';
import {
  createEntity,
  getFirstBlock,
  getLastBlock,
} from '../../immutable/ContentState';
import invariant from '../../../fbjs/invariant';
import {EditorState, forceSelection} from '../../immutable/EditorState';
import AtomicBlockUtils from '../AtomicBlockUtils';
import {
  makeSelectionState,
  SelectionState,
} from '../../immutable/SelectionState';
import {ContentBlock} from '../../immutable/ContentBlock';
import {DraftInsertionType} from '../../constants/DraftInsertionType';

jest.mock('../../keys/generateRandomKey');
jest.mock('../../../util/uuid', () => mockUUID);

const {editorState, contentState, selectionState} = getSampleStateForTesting();

const initialBlock = first(contentState.blockMap.values())!;
const ENTITY_KEY = createEntity('TOKEN', 'MUTABLE');
const CHARACTER = ' ';

const getInvariantViolation = (msg: string) => {
  try {
    /* eslint-disable-next-line */
    invariant(false, msg);
  } catch (e) {
    return e;
  }
};

const toggleExperimentalTreeDataSupport = (enabled: boolean) => {
  jest.doMock('../../../stubs/gkx', () => (name: string) => {
    return name === 'draft_tree_data_support' ? enabled : false;
  });
};

function toObject(map: Map<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of map) {
    res[k] = v;
  }
  return res;
}
const assertAtomic = (state: EditorState) => {
  expect(
    Array.from(state.currentContent.blockMap.values()).map(block => {
      return {
        ...block,
        data: toObject(block.data),
        characterList: block.characterList.map(char => ({
          ...char,
          style: Array.from(char.style),
        })),
      };
    }),
  ).toMatchSnapshot();
};

const assertInsertAtomicBlock = (
  state = editorState,
  entity: string = ENTITY_KEY,
  character = CHARACTER,
  experimentalTreeDataSupport = false,
) => {
  toggleExperimentalTreeDataSupport(experimentalTreeDataSupport);
  const newState = AtomicBlockUtils.insertAtomicBlock(state, entity, character);
  assertAtomic(newState);
  return newState;
};

const assertMoveAtomicBlock = (
  atomicBlock: ContentBlock,
  selection: SelectionState,
  state = editorState,
  insertionType: DraftInsertionType | null = null,
) => {
  const newState = AtomicBlockUtils.moveAtomicBlock(
    state,
    atomicBlock,
    selection,
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
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: 2,
      focusOffset: 2,
    }),
  );
});

test('must insert atomic after a block with collapsed selection', () => {
  assertInsertAtomicBlock(
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: initialBlock.text.length,
      focusOffset: initialBlock.text.length,
    }),
  );
});

test('must move atomic at start of block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.currentContent;
  const firstBlock = first(resultContent.blockMap.values())!;
  const atomicBlock = first(rest(resultContent.blockMap.values()))!;

  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
      anchorKey: firstBlock.key,
      focusKey: firstBlock.key,
    }),
    resultEditor,
  );
});

test('must move atomic at end of block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.currentContent;
  const lastBlock = getLastBlock(resultContent);
  const atomicBlock = first(rest(resultContent.blockMap.values()))!;

  // Move atomic block at end of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const thirdBlock = takeNth(resultContent.blockMap.values(), 2)!;

  // Move atomic block inbetween the split parts of the third block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const firstBlock = getFirstBlock(resultContent);
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;

  // Move atomic block before the first block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
      anchorKey: firstBlock.key,
    }),
    resultEditor,
    'before',
  );
});

test('must move atomic after block with collapsed selection', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.currentContent;
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const lastBlock = getLastBlock(resultContent);

  // Move atomic block after the last block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
      // FIXME [correctness]: changed from anchorKey
      anchorKey: lastBlock.key,
    }),
    resultEditor,
    'after',
  );
});

test("mustn't move atomic next to itself with collapsed selection", () => {
  // Insert atomic block at the second position
  const resultEditor = assertInsertAtomicBlock(
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: initialBlock.text.length,
      focusOffset: initialBlock.text.length,
    }),
  );
  const resultContent = resultEditor.currentContent;
  const beforeAtomicBlock = getFirstBlock(resultContent);
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const afterAtomicBlock = takeNth(resultContent.blockMap.values(), 2)!;

  // Move atomic block above itself by moving it after preceding block by
  // replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
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
      makeSelectionState({
        // FIXME [correctness]: changed from focusKey
        anchorKey: atomicBlock.key,
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
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: 0,
      focusOffset: 2,
    }),
  );
});

test('must insert atomic within a block', () => {
  assertInsertAtomicBlock(
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: 1,
      focusOffset: 2,
    }),
  );
});

test('must insert atomic at end of block', () => {
  const origLength = initialBlock.text.length;
  assertInsertAtomicBlock(
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: origLength - 2,
      focusOffset: origLength,
    }),
  );
});

test('must insert atomic for cross-block selection', () => {
  const originalThirdBlock = takeNth(contentState.blockMap.values(), 2)!;
  assertInsertAtomicBlock(
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: 2,
      focusKey: originalThirdBlock.key,
      focusOffset: 2,
    }),
  );
});

test('must move atomic at start of block', () => {
  // Insert atomic block at the first position
  const resultEditor = assertInsertAtomicBlock();
  const resultContent = resultEditor.currentContent;
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const lastBlock = getLastBlock(resultContent);

  // Move atomic block at start of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const lastBlock = getLastBlock(resultContent);

  // Move atomic block at end of the last block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const thirdBlock = takeNth(resultContent.blockMap.values(), 2)!;

  // Move atomic block inbetween the split parts of the third block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const firstBlock = getFirstBlock(resultContent);
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const lastBlock = getLastBlock(resultContent);

  // Move atomic block before the first block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
  const resultContent = resultEditor.currentContent;
  const firstBlock = getFirstBlock(resultContent);
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const lastBlock = getLastBlock(resultContent);

  // Move atomic block after the last block
  assertMoveAtomicBlock(
    atomicBlock,
    makeSelectionState({
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
    forceSelection(editorState, {
      ...selectionState,
      anchorOffset: initialBlock.text.length,
      focusOffset: initialBlock.text.length,
    }),
  );
  const resultContent = resultEditor.currentContent;
  const beforeAtomicBlock = getFirstBlock(resultContent);
  const atomicBlock = takeNth(resultContent.blockMap.values(), 1)!;
  const afterAtomicBlock = takeNth(resultContent.blockMap.values(), 2)!;

  // Move atomic block above itself by moving it after preceding block by
  // replacement
  expect(() => {
    AtomicBlockUtils.moveAtomicBlock(
      resultEditor,
      atomicBlock,
      makeSelectionState({
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
      makeSelectionState({
        anchorKey: afterAtomicBlock.key,
        anchorOffset: 0,
        focusKey: afterAtomicBlock.key,
        focusOffset: 2,
      }),
    );
  }).toThrow(getInvariantViolation('Block cannot be moved next to itself.'));
});

// test('must be able to insert atomic block when experimentalTreeDataSupport is enabled', () => {
//   // Insert atomic block at the first position
//   assertInsertAtomicBlock(
//     forceSelection(
//       createWithContent({
//         ...contentState,
//         blockMap: createFromArray([
//           makeContentBlockNode({
//             text: 'first block',
//             key: 'A',
//           }),
//         ]),
//       }),
//       makeEmptySelection('A'),
//     ),
//     ENTITY_KEY,
//     CHARACTER,
//     true,
//   );
// });
//
// test('must be able to move atomic block when experimentalTreeDataSupport is enabled', () => {
//   // Insert atomic block at the first position
//   const resultEditor = assertInsertAtomicBlock(
//     EditorState.forceSelection(
//       EditorState.createWithContent(
//         contentState.set(
//           'blockMap',
//           BlockMapBuilder.createFromArray([
//             makeContentBlockNode({
//               text: 'first block',
//               key: 'A',
//             }),
//           ]),
//         ),
//       ),
//       makeEmptySelection('A'),
//     ),
//     ENTITY_KEY,
//     CHARACTER,
//     true,
//   );
//
//   const resultContent = resultEditor.currentContent;
//   const lastBlock = resultContent.getBlockMap().last();
//   const atomicBlock = resultContent
//     .getBlockMap()
//     .skip(1)
//     .first();
//
//   // Move atomic block at end of the last block
//   assertMoveAtomicBlock(
//     atomicBlock,
//     makeSelectionState({
//       anchorKey: lastBlock.key,
//       anchorOffset: lastBlock.text.length,
//       focusKey: lastBlock.key,
//       focusOffset: lastBlock.text.length,
//       isBackward: false,
//       hasFocus: false,
//     }),
//     resultEditor,
//     'after',
//   );
// });
