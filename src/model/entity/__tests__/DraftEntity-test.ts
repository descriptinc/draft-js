/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import DraftEntity from '../DraftEntity';

beforeEach(() => {
  jest.resetModules();
});

const createLink = () => {
  return DraftEntity.__create('LINK', 'MUTABLE', {uri: 'zombo.com'});
};

test('must create instances', () => {
  const key = createLink();
  expect(typeof key).toMatchSnapshot();
});

test('must retrieve an instance given a key', () => {
  const key = createLink();
  const retrieved = DraftEntity.__get(key);
  expect(retrieved.type).toMatchSnapshot();
  expect(retrieved.mutability).toMatchSnapshot();
  expect(retrieved.data).toMatchSnapshot();
});

test('must throw when retrieving for an invalid key', () => {
  createLink();
  expect(() => DraftEntity.__get('asdfzxcvqweriuop')).toThrow();
});

test('must merge data', () => {
  const key = createLink();

  // Merge new property.
  const newData = {foo: 'bar'};
  DraftEntity.__mergeData(key, newData);
  const newEntity = DraftEntity.__get(key);

  // Replace existing property.
  const withNewURI = {uri: 'homestarrunner.com'};
  DraftEntity.__mergeData(key, withNewURI);
  const entityWithNewURI = DraftEntity.__get(key);

  expect(newEntity.data).toMatchSnapshot();
  expect(entityWithNewURI.data).toMatchSnapshot();
});
