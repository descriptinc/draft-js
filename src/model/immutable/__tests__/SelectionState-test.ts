/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {
  getEndKey,
  getEndOffset,
  getStartKey,
  getStartOffset,
  hasEdgeWithin,
  isCollapsed,
  isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock,
  isOnlyOnTrailingEdgeAndIsNotLastInBlock,
  makeSelectionState,
  SelectionState,
} from '../SelectionState';

const DEFAULT_CONFIG = {
  anchorKey: 'a',
  anchorOffset: 0,
  focusKey: 'a',
  focusOffset: 0,
  isBackward: false,
  hasFocus: true,
};

const flip = (selectionState: SelectionState) => {
  return {
    ...selectionState,
    anchorKey: selectionState.focusKey,
    anchorOffset: selectionState.focusOffset,
    focusKey: selectionState.anchorKey,
    focusOffset: selectionState.anchorOffset,
    isBackward: !selectionState.isBackward,
  };
};

const getSample = (type: string, config = {}) => {
  let selectionState;

  switch (type) {
    case 'MULTI_BLOCK':
      selectionState = makeSelectionState({
        ...DEFAULT_CONFIG,
        anchorKey: 'b',
        focusKey: 'c',
        anchorOffset: 10,
        focusOffset: 15,
        ...config,
      });
      break;
    case 'WITHIN_BLOCK':
      selectionState = makeSelectionState({
        ...DEFAULT_CONFIG,
        anchorOffset: 10,
        focusOffset: 20,
        ...config,
      });
      break;
    case 'COLLAPSED':
    default:
      selectionState = makeSelectionState({
        ...DEFAULT_CONFIG,
        ...config,
      });
  }

  expect(selectionState).toMatchSnapshot();

  return selectionState;
};

const COLLAPSED = getSample('COLLAPSED');
const MULTI_BLOCK = getSample('MULTI_BLOCK');
const WITHIN_BLOCK = getSample('WITHIN_BLOCK');

test('must retrieve properties correctly', () => {
  const state = COLLAPSED;
  expect([
    state.anchorKey,
    state.anchorOffset,
    state.focusKey,
    state.focusOffset,
    state.isBackward,
    state.hasFocus,
  ]).toMatchSnapshot();
});

describe('hasEdgeWithin', () => {
  test('is false for non-edge block keys', () => {
    expect(hasEdgeWithin(COLLAPSED, 'b', 0, 0)).toBe(false);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'b', 0, 0)).toBe(false);
    expect(hasEdgeWithin(MULTI_BLOCK, 'd', 0, 0)).toBe(false);
  });

  test('is false if offset is outside the selection range', () => {
    expect(hasEdgeWithin(COLLAPSED, 'a', 1, 1)).toBe(false);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 1, 1)).toBe(false);
    expect(hasEdgeWithin(MULTI_BLOCK, 'b', 1, 1)).toBe(false);
  });

  test('is true if key match and offset equals selection edge', () => {
    expect(hasEdgeWithin(COLLAPSED, 'a', 0, 1)).toBe(true);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 10, 15)).toBe(true);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 15, 20)).toBe(true);
    expect(hasEdgeWithin(MULTI_BLOCK, 'b', 10, 20)).toBe(true);
    expect(hasEdgeWithin(MULTI_BLOCK, 'c', 15, 20)).toBe(true);
  });

  test('is true if selection range is entirely within test range', () => {
    expect(
      hasEdgeWithin(
        getSample('COLLAPSED', {
          anchorOffset: 5,
          focusOffset: 5,
        }),
        'a',
        0,
        10,
      ),
    ).toBe(true);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 0, 40)).toBe(true);
  });

  test('is true if selection range edge overlaps test range', () => {
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 5, 15)).toBe(true);
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 15, 25)).toBe(true);
    expect(hasEdgeWithin(MULTI_BLOCK, 'b', 5, 20)).toBe(true);
    expect(hasEdgeWithin(MULTI_BLOCK, 'c', 5, 20)).toBe(true);
  });

  test('is false if test range is entirely within selection range', () => {
    expect(hasEdgeWithin(WITHIN_BLOCK, 'a', 12, 15)).toBe(false);
    expect(hasEdgeWithin(MULTI_BLOCK, 'b', 12, 15)).toBe(false);
  });
});

test('detects collapsed selection properly', () => {
  expect(isCollapsed(COLLAPSED)).toBe(true);
  expect(isCollapsed(WITHIN_BLOCK)).toBe(false);
  expect(isCollapsed(MULTI_BLOCK)).toBe(false);
});

test('properly identifies start and end keys', () => {
  expect(getStartKey(COLLAPSED)).toMatchSnapshot();
  expect(getStartKey(WITHIN_BLOCK)).toMatchSnapshot();
  expect(getStartKey(MULTI_BLOCK)).toMatchSnapshot();
  expect(getEndKey(COLLAPSED)).toMatchSnapshot();
  expect(getEndKey(WITHIN_BLOCK)).toMatchSnapshot();
  expect(getEndKey(MULTI_BLOCK)).toMatchSnapshot();
});

test('properly identifies start and end offsets', () => {
  expect(getStartOffset(COLLAPSED)).toMatchSnapshot();
  expect(getStartOffset(WITHIN_BLOCK)).toMatchSnapshot();
  expect(getStartOffset(MULTI_BLOCK)).toMatchSnapshot();
  expect(getEndOffset(COLLAPSED)).toMatchSnapshot();
  expect(getEndOffset(WITHIN_BLOCK)).toMatchSnapshot();
  expect(getEndOffset(MULTI_BLOCK)).toMatchSnapshot();
});

test('properly identifies start and end keys when backward', () => {
  const withinBlock = flip(WITHIN_BLOCK);
  const MULTI_BLOCK = getSample('MULTI_BLOCK', {
    isBackward: true,
  });

  expect(getStartKey(withinBlock)).toMatchSnapshot();
  expect(getStartKey(MULTI_BLOCK)).toMatchSnapshot();
  expect(getEndKey(withinBlock)).toMatchSnapshot();
  expect(getEndKey(MULTI_BLOCK)).toMatchSnapshot();
});

test('properly identifies start and end offsets when backward', () => {
  const withinBlock = flip(WITHIN_BLOCK);
  const MULTI_BLOCK = getSample('MULTI_BLOCK', {
    isBackward: true,
  });

  expect(getStartOffset(withinBlock)).toMatchSnapshot();
  expect(getStartOffset(MULTI_BLOCK)).toMatchSnapshot();
  expect(getEndOffset(withinBlock)).toMatchSnapshot();
  expect(getEndOffset(MULTI_BLOCK)).toMatchSnapshot();
});

describe('isOnlyOnTrailingEdgeAndIsNotLastInBlock', () => {
  it('is false if selection intersects block', () => {
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 0,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 3, 10)).toBe(false);
  });
  it('is false if selection is not in block', () => {
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'c',
      anchorOffset: 0,
      focusKey: 'c',
      focusOffset: 5,
    }), 'b', 3, 10)).toBe(false);
  });
  it('is true if selection is on the trailing edge and extends beyond the current leaf', () => {
    // forward
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 8,
    }), 'b', 5, 10)).toBe(true);
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 5, 10)).toBe(true);

    // backward
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 8,
      focusKey: 'b',
      focusOffset: 5,
      isBackward: true,
    }), 'b', 5, 10)).toBe(true);
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
      isBackward: true,
    }), 'b', 5, 10)).toBe(true);
  });
  it('is false if selection is on the trailing edge and does not extend beyond the current leaf in the current block', () => {
    // forward
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 5, 5)).toBe(false);

    // backward
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
      isBackward: true,
    }), 'b', 5, 5)).toBe(false);

    // multi-block
    expect(isOnlyOnTrailingEdgeAndIsNotLastInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'c',
      focusOffset: 1,
    }), 'b', 5, 5)).toBe(false);
  });
})

describe('isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock', () => {
  it('is false if selection intersects block', () => {
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 0,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 3)).toBe(false);
  });
  it('is false if selection is not in block', () => {
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'c',
      anchorOffset: 0,
      focusKey: 'c',
      focusOffset: 5,
    }), 'b', 3)).toBe(false);
  });
  it('is false if selection is on the leading edge but there is not a leaf in the same block in the selection before it', () => {
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 5)).toBe(false);
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 5,
      isBackward: true,
    }), 'b', 5)).toBe(false);
  });
  it('is true if selection is on the leading edge and extends before the current leaf', () => {
    // forward
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 4,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 5)).toBe(true);

    // backward
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 5,
      focusKey: 'b',
      focusOffset: 4,
      isBackward: true,
    }), 'b', 5)).toBe(true);
  });
  it('is false if selection is first in block', () => {
    // multi-block
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'a',
      anchorOffset: 0,
      focusKey: 'b',
      focusOffset: 5,
    }), 'b', 0)).toBe(false);

    // same block
    expect(isOnlyOnLeadingEdgeAndIsNotFirstSelectionInBlock(makeSelectionState({
      anchorKey: 'b',
      anchorOffset: 0,
      focusKey: 'b',
      focusOffset: 0,
    }), 'b', 0)).toBe(false);
  });
});
