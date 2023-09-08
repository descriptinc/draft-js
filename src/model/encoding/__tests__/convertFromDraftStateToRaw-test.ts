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
import {createFromBlockArray} from '../../immutable/ContentState';
import {makeContentBlock} from '../../immutable/ContentBlock';
import convertFromDraftStateToRaw from '../convertFromDraftStateToRaw';
import {addEntity} from '../../immutable/EntityMap';

let {contentState} = getSampleStateForTesting();

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
let contentStateWithNonContiguousEntities = createFromBlockArray([
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

let entityMap = contentState.entityMap;
entityMap = addEntity(entityMap, '3', getLink('3'));
entityMap = addEntity(entityMap, '4', getLink('4'));
entityMap = addEntity(entityMap, '5', getLink('5'));
entityMap = addEntity(entityMap, '6', getLink('6'));

contentState = {
  ...contentState,
  entityMap,
};

contentStateWithNonContiguousEntities = {
  ...contentStateWithNonContiguousEntities,
  entityMap,
};

const assertConvertFromDraftStateToRaw = content => {
  expect(convertFromDraftStateToRaw(content)).toMatchSnapshot();
};

test('must be able to convert from draft state with ContentBlock to raw', () => {
  assertConvertFromDraftStateToRaw(contentState);
});

test('must be able to convert from draft state with noncontiguous entities to raw', () => {
  assertConvertFromDraftStateToRaw(contentStateWithNonContiguousEntities);
});
