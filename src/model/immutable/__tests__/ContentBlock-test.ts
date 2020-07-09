/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import {makeContentBlock} from '../ContentBlock';
import {EMPTY_CHARACTER, makeCharacterMetadata} from '../CharacterMetadata';
import {BOLD} from '../SampleDraftInlineStyle';
import fastDeepEqual from 'fast-deep-equal/es6';
import {
  findEntityRanges,
  findStyleRanges,
  getEntityAt,
  getInlineStyleAt,
} from '../ContentBlock';
import {genKey} from '../../../Draft';

const ENTITY_KEY = 'x';

const getSampleBlock = () => {
  return makeContentBlock({
    key: 'a',
    type: 'unstyled',
    text: 'Alpha',
    characterList: [
      makeCharacterMetadata({style: BOLD, entity: ENTITY_KEY}),
      EMPTY_CHARACTER,
      EMPTY_CHARACTER,
      makeCharacterMetadata({style: BOLD}),
      makeCharacterMetadata({entity: ENTITY_KEY}),
    ],
  });
};

test('must have appropriate default values', () => {
  const text = 'Alpha';
  const block = makeContentBlock({
    key: 'a',
    type: 'unstyled',
    text,
  });

  expect(block.key).toMatchSnapshot();
  expect(block.text).toMatchSnapshot();
  expect(block.type).toMatchSnapshot();
  expect(block.text.length).toMatchSnapshot();
  expect(block.characterList.length).toMatchSnapshot();
  expect(block.characterList).toMatchSnapshot();
});

test('must provide default values', () => {
  const block = makeContentBlock({key: genKey()});
  expect(block.type).toMatchSnapshot();
  expect(block.text).toMatchSnapshot();
  expect(fastDeepEqual(block.characterList, [])).toMatchSnapshot();
});

test('must retrieve properties', () => {
  const block = getSampleBlock();
  expect(block.key).toMatchSnapshot();
  expect(block.text).toMatchSnapshot();
  expect(block.type).toMatchSnapshot();
  expect(block.text.length).toMatchSnapshot();
  expect(block.characterList.length).toMatchSnapshot();
});

test('must properly retrieve style at offset', () => {
  const block = getSampleBlock();

  for (let i = 0; i <= 4; i++) {
    expect(getInlineStyleAt(block, i)).toMatchSnapshot();
  }
});

test('must correctly identify ranges of styles', () => {
  const block = getSampleBlock();

  const cb = jest.fn();
  findStyleRanges(block, () => true, cb);

  expect(cb.mock.calls).toMatchSnapshot();
});

test('must properly retrieve entity at offset', () => {
  const block = getSampleBlock();

  for (let i = 0; i <= 4; i++) {
    expect(getEntityAt(block, i)).toMatchSnapshot();
  }
});

test('must correctly identify ranges of entities', () => {
  const block = getSampleBlock();
  const cb = jest.fn();
  findEntityRanges(block, () => true, cb);

  expect(cb.mock.calls).toMatchSnapshot();
});
