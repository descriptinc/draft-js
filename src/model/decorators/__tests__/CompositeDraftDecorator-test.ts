/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {createFromText} from '../../immutable/ContentState';
import CompositeDraftDecorator from '../CompositeDraftDecorator';
import {ContentBlock, makeContentBlock} from '../../immutable/ContentBlock';

jest.mock('../../immutable/ContentState');

const searchWith = (regex: RegExp) => (
  block: ContentBlock,
  callback: (start: number, end: number) => void,
) => {
  block.text.replace(regex, (match: string, offset: number): string => {
    callback(offset, offset + match.length);
    return '';
  });
};

const BarDecorator = {
  strategy: searchWith(/bar/gi),
  component: () => null,
};

const BartDecorator = {
  strategy: searchWith(/bart/gi),
  component: () => null,
};

const FooDecorator = {
  strategy: searchWith(/foo/gi),
  component: () => null,
};

const assertCompositeDraftDecorator = (
  text: string,
  decorators = [FooDecorator, BarDecorator],
) => {
  expect(
    new CompositeDraftDecorator(decorators).getDecorations(
      makeContentBlock({text}),
      createFromText(text),
    ),
  ).toMatchSnapshot();
};

test('must behave correctly if there are no matches', () => {
  assertCompositeDraftDecorator('take a sad song and make it better');
});

test('must find decoration matches', () => {
  assertCompositeDraftDecorator('a footballing fool');
});

test('must find matches for multiple decorators', () => {
  // Match the "Foo" decorator and "Bar" decorator.
  assertCompositeDraftDecorator('a foosball bar');
});

// Reverse the order of the matches from above. "foo" comes after "bar" in
// the document text.
test('must find matches regardless of text location', () => {
  // Match the "Foo" decorator and "Bar" decorator.
  assertCompositeDraftDecorator('some bar food');
});

test('must throw out overlaps with existing decorations', () => {
  // Even though "bart" matches our "bar" strategy, "bart" comes first
  // in our decoration order and will claim those letters first.
  assertCompositeDraftDecorator('bart has a bar', [
    BartDecorator,
    BarDecorator,
  ]);
});

// Swap the order of "bar" and "bart".
test('must throw out matches if earlier match is shorter', () => {
  // There are no "bart" matches, since "bar" has claimed the relevant
  // strings.
  assertCompositeDraftDecorator('bart has a bar', [
    BarDecorator,
    BartDecorator,
  ]);
});

test('must separate adjacent ranges that have the same decorator', () => {
  assertCompositeDraftDecorator('barbarbar', [BarDecorator]);
});
