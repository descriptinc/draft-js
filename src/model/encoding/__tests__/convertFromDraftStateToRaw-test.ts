/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import getSampleStateForTesting from '../../transaction/getSampleStateForTesting';
import {repeat} from '../../descript/Iterables';
import {
  EMPTY_CHARACTER,
  makeCharacterMetadata,
} from '../../immutable/CharacterMetadata';
import {makeDraftEntityInstance} from '../../entity/DraftEntityInstance';
import {addEntity, createFromBlockArray} from '../../immutable/ContentState';
import {makeContentBlock} from '../../immutable/ContentBlock';
import convertFromDraftStateToRaw from '../convertFromDraftStateToRaw';

const {contentState} = getSampleStateForTesting();

const getMetadata = entityKey =>
  Array.from(repeat(5, makeCharacterMetadata({entity: entityKey})));
const getLink = entityKey =>
  makeDraftEntityInstance({
    type: 'LINK',
    mutability: 'IMMUTABLE',
    data: {
      url: `www.${entityKey}.com`,
    },
  });
// We start numbering our entities with '2' because getSampleStateForTesting
// already created an entity with key '1'.
const contentStateWithNonContiguousEntities = createFromBlockArray([
  makeContentBlock({
    key: 'a',
    type: 'unstyled',
    text: 'link2 link2 link3',
    characterList: [
      ...getMetadata('3'),
      EMPTY_CHARACTER,
      ...getMetadata('4'),
      EMPTY_CHARACTER,
      ...getMetadata('5'),
    ],
  }),
  makeContentBlock({
    key: 'b',
    type: 'unstyled',
    text: 'link4 link2 link5',
    characterList: [
      ...getMetadata('5'),
      EMPTY_CHARACTER,
      ...getMetadata('3'),
      EMPTY_CHARACTER,
      ...getMetadata('6'),
    ],
  }),
]);

addEntity(getLink('3'));
addEntity(getLink('4'));
addEntity(getLink('5'));
addEntity(getLink('6'));

const assertConvertFromDraftStateToRaw = content => {
  expect(convertFromDraftStateToRaw(content)).toMatchSnapshot();
};

test('must be able to convert from draft state with ContentBlock to raw', () => {
  assertConvertFromDraftStateToRaw(contentState);
});

test('must be able to convert from draft state with noncontiguous entities to raw', () => {
  assertConvertFromDraftStateToRaw(contentStateWithNonContiguousEntities);
});
