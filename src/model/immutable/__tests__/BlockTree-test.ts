/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {repeat, flatten} from '../../descript/Iterables';
import {EMPTY_CHARACTER, makeCharacterMetadata} from '../CharacterMetadata';
import {ContentBlock, makeContentBlock} from '../ContentBlock';
import {createFromText} from '../ContentState';
import BlockTree from '../BlockTree';
import {BOLD} from '../SampleDraftInlineStyle';
import {DraftDecoratorType} from '../../decorators/DraftDecoratorType';

const PLAIN_BLOCK = {
  key: 'a',
  text: 'Lincoln',
  characterList: Array.from(repeat(7, EMPTY_CHARACTER)),
};

const STYLED_BLOCK: Partial<ContentBlock> = {
  key: 'b',
  text: 'Washington',
  characterList: Array.from(
    flatten([
      repeat(4, EMPTY_CHARACTER),
      repeat(4, makeCharacterMetadata({style: BOLD})),
      repeat(2, EMPTY_CHARACTER),
    ]),
  ),
};

class Decorator implements DraftDecoratorType {
  getDecorations() {
    return [];
  }
  getComponentForKey(_: string) {
    return () => null;
  }
  getPropsForKey(_: string) {
    return null;
  }
}

beforeEach(() => {
  jest.resetModules();
});

// empty decorator
const emptyDecoratorFactory = (length: number) => {
  Decorator.prototype.getDecorations = jest
    .fn()
    .mockImplementation(() => Array.from(repeat(length, null)));
  return new Decorator();
};

// single decorator
const singleDecoratorFactory = (length: number) => {
  const DECORATOR_KEY = 'x';
  const RANGE_LENGTH = 3;

  Decorator.prototype.getDecorations = jest.fn().mockImplementation(() => {
    return Array.from(
      flatten([
        repeat(RANGE_LENGTH, null),
        repeat(RANGE_LENGTH, DECORATOR_KEY),
        repeat(length - 2 * RANGE_LENGTH, null),
      ]),
    );
  });
  return new Decorator();
};

const multiDecoratorFactory = (length: number) => {
  const DECORATOR_KEY_A = 'y';
  const DECORATOR_KEY_B = 'z';
  const RANGE_LENGTH = 3;

  Decorator.prototype.getDecorations = jest.fn().mockImplementation(() => {
    return Array.from(
      flatten([
        repeat(RANGE_LENGTH, DECORATOR_KEY_A),
        repeat(RANGE_LENGTH, null),
        repeat(length - 2 * RANGE_LENGTH, DECORATOR_KEY_B),
      ]),
    );
  });
  return new Decorator();
};

const assertBlockTreeGenerate = (
  config: Partial<ContentBlock> & {key: string},
  getDecorator = emptyDecoratorFactory,
) => {
  const block = makeContentBlock(config);
  const content = createFromText(config.text || '');
  const decorator = getDecorator((config.text || '').length);
  const tree = BlockTree.generate(content, block, decorator);

  expect(tree).toMatchSnapshot();

  // to remove
  return tree;
};

it('must generate for unstyled block with empty decorator', () => {
  assertBlockTreeGenerate(PLAIN_BLOCK);
});

it('must generate for styled block with empty decorator', () => {
  assertBlockTreeGenerate(STYLED_BLOCK);
});

it('must generate for unstyled block with single decorator', () => {
  assertBlockTreeGenerate(PLAIN_BLOCK, singleDecoratorFactory);
});

it('must generate for styled block with single decorator', () => {
  assertBlockTreeGenerate(STYLED_BLOCK, singleDecoratorFactory);
});

it('must generate for unstyled block with multiple decorators', () => {
  assertBlockTreeGenerate(PLAIN_BLOCK, multiDecoratorFactory);
});

it('must generate for styled block with multiple decorators', () => {
  assertBlockTreeGenerate(STYLED_BLOCK, multiDecoratorFactory);
});
