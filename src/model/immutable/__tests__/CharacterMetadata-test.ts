/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import {
  applyEntity,
  applyStyle,
  makeCharacterMetadata,
  removeStyle,
} from '../CharacterMetadata';
import {BOLD, BOLD_ITALIC, NONE, UNDERLINE} from '../SampleDraftInlineStyle';

const plain = makeCharacterMetadata({});
const bold = makeCharacterMetadata({style: BOLD});
const fancy = makeCharacterMetadata({style: BOLD_ITALIC});

const withoutEntity = makeCharacterMetadata({});
const withEntity = makeCharacterMetadata({entity: 'a'});

const withStyleAndEntity = makeCharacterMetadata({
  entity: 'a',
  style: BOLD,
});

test('must have appropriate default values', () => {
  const character = makeCharacterMetadata({});
  expect(character).toMatchSnapshot();
  expect(character.style.size).toMatchSnapshot();
  expect(character.entity).toMatchSnapshot();
});

test('must run `hasStyle` correctly', () => {
  expect(plain.style.has('BOLD')).toMatchSnapshot();
  expect(bold.style.has('BOLD')).toMatchSnapshot();
  expect(fancy.style.has('BOLD')).toMatchSnapshot();
  expect(plain.style.has('ITALIC')).toMatchSnapshot();
  expect(bold.style.has('ITALIC')).toMatchSnapshot();
  expect(fancy.style.has('ITALIC')).toMatchSnapshot();
});

test('must apply style', () => {
  const newlyBold = applyStyle(plain, 'BOLD');
  expect(newlyBold.style.has('BOLD')).toMatchSnapshot();
  const alsoItalic = applyStyle(newlyBold, 'ITALIC');
  expect(alsoItalic.style.has('BOLD')).toMatchSnapshot();
  expect(alsoItalic.style.has('ITALIC')).toMatchSnapshot();
});

test('must remove style', () => {
  const justBold = removeStyle(fancy, 'ITALIC');
  expect(justBold.style.has('BOLD')).toMatchSnapshot();
  expect(justBold.style.has('ITALIC')).toMatchSnapshot();
  const justPlain = removeStyle(justBold, 'BOLD');
  expect(justPlain.style.has('BOLD')).toMatchSnapshot();
  expect(justPlain.style.has('ITALIC')).toMatchSnapshot();
});

test('must apply entity correctly', () => {
  const newKey = 'x';
  const modifiedA = applyEntity(withoutEntity, newKey);
  const modifiedB = applyEntity(withEntity, newKey);
  expect(modifiedA.entity).toMatchSnapshot();
  expect(modifiedB.entity).toMatchSnapshot();
});

test('must remove entity correctly', () => {
  const modifiedA = applyEntity(withoutEntity, null);
  const modifiedB = applyEntity(withEntity, null);
  expect(modifiedA.entity).toMatchSnapshot();
  expect(modifiedB.entity).toMatchSnapshot();
});

test('must reuse the same objects', () => {
  expect(makeCharacterMetadata({}) === plain).toMatchSnapshot();
  expect(makeCharacterMetadata({style: BOLD}) === bold).toMatchSnapshot();
  expect(
    makeCharacterMetadata({style: BOLD_ITALIC}) === fancy,
  ).toMatchSnapshot();
  expect(makeCharacterMetadata({entity: 'a'}) === withEntity).toMatchSnapshot();
  expect(
    makeCharacterMetadata({entity: 'a', style: BOLD}) === withStyleAndEntity,
  ).toMatchSnapshot();
});

test('must reuse objects by defaulting config properties', () => {
  expect(
    makeCharacterMetadata({style: NONE, entity: 'a'}) === withEntity,
  ).toMatchSnapshot();

  expect(
    makeCharacterMetadata({style: BOLD, entity: null}) === bold,
  ).toMatchSnapshot();

  const underlined = makeCharacterMetadata({
    style: UNDERLINE,
    entity: null,
  });

  expect(
    makeCharacterMetadata({style: UNDERLINE}) === underlined,
  ).toMatchSnapshot();
});
