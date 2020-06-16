/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {makeContentBlock} from '../../immutable/ContentBlock';
import applyEntityToContentBlock from '../applyEntityToContentBlock';
import {blockToJson} from '../../../util/blockMapToJson';

const sampleBlock = makeContentBlock({
  key: 'a',
  text: 'Hello',
});

const assertApplyEntityToContentBlock = (
  start: number,
  end: number,
  entityKey = 'x',
  contentBlock = sampleBlock,
) => {
  expect(
    blockToJson(applyEntityToContentBlock(contentBlock, start, end, entityKey)),
  ).toMatchSnapshot();
};

test('must apply from the start', () => {
  assertApplyEntityToContentBlock(0, 2);
});

test('must apply within', () => {
  assertApplyEntityToContentBlock(1, 4);
});

test('must apply at the end', () => {
  assertApplyEntityToContentBlock(3, 5);
});

test('must apply to the entire text', () => {
  assertApplyEntityToContentBlock(0, 5);
});
