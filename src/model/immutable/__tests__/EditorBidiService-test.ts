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
import {makeContentBlock} from '../ContentBlock';
import {makeContentState} from '../ContentState';
import {BlockNodeRecord} from '../BlockNodeRecord';
import {createFromArray} from '../BlockMapBuilder';
import EditorBidiService from '../EditorBidiService';

const ltr = makeContentBlock({
  key: 'a',
  text: 'hello',
});
const rtl = makeContentBlock({
  key: 'b',
  text: '\u05e9\u05d1\u05ea',
});
const empty = makeContentBlock({
  key: 'c',
  text: '',
});

const getContentState = (blocks: BlockNodeRecord[]) => {
  return makeContentState({blockMap: createFromArray(blocks)});
};

function toObject(map: Map<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of map) {
    res[k] = v;
  }
  return res;
}

test('must create a new map', () => {
  const state = getContentState([ltr]);
  const directions = EditorBidiService.getDirectionMap(state, null);
  expect(toObject(directions)).toMatchSnapshot();
});

test('must return the same map if no changes', () => {
  const state = getContentState([ltr]);
  const directions = EditorBidiService.getDirectionMap(state, null);

  const nextState = getContentState([ltr]);
  const nextDirections = EditorBidiService.getDirectionMap(
    nextState,
    directions,
  );

  expect(state !== nextState).toMatchSnapshot();
  expect(directions === nextDirections).toMatchSnapshot();

  expect(toObject(directions)).toMatchSnapshot();
  expect(toObject(nextDirections)).toMatchSnapshot();
});

test('must return the same map if no text changes', () => {
  const state = getContentState([ltr]);
  const directions = EditorBidiService.getDirectionMap(state, null);

  const newLTR = makeContentBlock({
    key: 'a',
    text: 'hello',
  });
  expect(newLTR !== ltr).toMatchSnapshot();

  const nextState = getContentState([newLTR]);
  const nextDirections = EditorBidiService.getDirectionMap(
    nextState,
    directions,
  );

  expect(state !== nextState).toMatchSnapshot();
  expect(directions === nextDirections).toMatchSnapshot();

  expect(toObject(directions)).toMatchSnapshot();
  expect(toObject(nextDirections)).toMatchSnapshot();
});

test('must return the same map if no directions change', () => {
  const state = getContentState([ltr]);
  const directions = EditorBidiService.getDirectionMap(state, null);

  const newLTR = makeContentBlock({
    key: 'a',
    text: 'asdf',
  });

  const nextState = getContentState([newLTR]);
  const nextDirections = EditorBidiService.getDirectionMap(
    nextState,
    directions,
  );

  expect(newLTR !== ltr).toMatchSnapshot();
  expect(state !== nextState).toMatchSnapshot();
  expect(directions === nextDirections).toMatchSnapshot();

  expect(toObject(directions)).toMatchSnapshot();
  expect(toObject(nextDirections)).toMatchSnapshot();
});

test('must return a new map if block keys change', () => {
  const state = getContentState([ltr]);
  const directions = EditorBidiService.getDirectionMap(state, null);

  const newLTR = makeContentBlock({
    key: 'asdf',
    text: 'asdf',
  });

  const nextState = getContentState([newLTR]);
  const nextDirections = EditorBidiService.getDirectionMap(
    nextState,
    directions,
  );

  expect(state !== nextState).toMatchSnapshot();
  expect(directions !== nextDirections).toMatchSnapshot();

  expect(toObject(directions)).toMatchSnapshot();
  expect(toObject(nextDirections)).toMatchSnapshot();
});

test('must return a new map if direction changes', () => {
  const state = getContentState([ltr, empty]);
  const directions = EditorBidiService.getDirectionMap(state, null);
  const nextState = getContentState([ltr, rtl]);
  const nextDirections = EditorBidiService.getDirectionMap(
    nextState,
    directions,
  );

  expect(state !== nextState).toMatchSnapshot();
  expect(directions !== nextDirections).toMatchSnapshot();

  expect(toObject(directions)).toMatchSnapshot();
  expect(toObject(nextDirections)).toMatchSnapshot();
});
