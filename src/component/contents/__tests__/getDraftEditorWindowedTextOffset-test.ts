/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {createFromText} from '../../../model/immutable/ContentState';
import {getDraftEditorWindowedTextOffset} from '../getDraftEditorWindowedTextOffset';

function createRect({y, height}: {y: number; height: number}): DOMRect {
  return {
    x: 0,
    y,
    width: 0,
    height,
    top: y,
    right: 0,
    bottom: y + height,
    left: 0,
    toJSON: () => ({}),
  };
}

describe('getDraftEditorWindowedTextOffset', () => {
  test('includes text represented by block window spacers', () => {
    const contentState = createFromText('zero\none\ntwo');
    const [, secondBlock, thirdBlock] = Array.from(contentState.blockMap.values());
    const contentsElement = document.createElement('div');
    const spacer = document.createElement('div');
    spacer.dataset.blockWindowSpacer = 'true';
    spacer.dataset.blockWindowSpacerLayout = '[[100,4]]';
    spacer.dataset.blockWindowSpacerTextLength = '5';
    const secondElement = document.createElement('div');
    secondElement.dataset.block = 'true';
    secondElement.id = `block-${secondBlock?.key}`;
    const thirdElement = document.createElement('div');
    thirdElement.dataset.block = 'true';
    thirdElement.id = `block-${thirdBlock?.key}`;
    contentsElement.append(spacer, secondElement, thirdElement);

    jest
      .spyOn(spacer, 'getBoundingClientRect')
      .mockReturnValue(createRect({y: -100, height: 100}));
    jest
      .spyOn(secondElement, 'getBoundingClientRect')
      .mockReturnValue(createRect({y: 0, height: 50}));
    jest
      .spyOn(thirdElement, 'getBoundingClientRect')
      .mockReturnValue(createRect({y: 50, height: 50}));

    expect(
      getDraftEditorWindowedTextOffset(contentState, contentsElement, 0, 75),
    ).toBe(11);
  });

  test('uses individual block heights within a window spacer', () => {
    const contentState = createFromText(`${'x'.repeat(100)}\nyyyy\ntwo`);
    const contentsElement = document.createElement('div');
    const spacer = document.createElement('div');
    spacer.dataset.blockWindowSpacer = 'true';
    spacer.dataset.blockWindowSpacerLayout = '[[90,100],[10,4]]';
    spacer.dataset.blockWindowSpacerTextLength = '106';
    contentsElement.append(spacer);
    jest
      .spyOn(spacer, 'getBoundingClientRect')
      .mockReturnValue(createRect({y: -100, height: 100}));

    expect(
      getDraftEditorWindowedTextOffset(contentState, contentsElement, -55, 50),
    ).toBe(103);
  });

  test('returns undefined when the editor is not windowed', () => {
    expect(
      getDraftEditorWindowedTextOffset(
        createFromText('zero'),
        document.createElement('div'),
        0,
        100,
      ),
    ).toBeUndefined();
  });
});
