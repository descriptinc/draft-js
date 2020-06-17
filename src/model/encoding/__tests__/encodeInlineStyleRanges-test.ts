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

'use strict';

import {makeContentBlock} from '../../immutable/ContentBlock';
import {DraftInlineStyle} from '../../immutable/DraftInlineStyle';
import {makeCharacterMetadata} from '../../immutable/CharacterMetadata';
import encodeInlineStyleRanges from '../encodeInlineStyleRanges';
import {
  BOLD,
  BOLD_ITALIC,
  BOLD_ITALIC_UNDERLINE,
  BOLD_UNDERLINE,
  ITALIC,
  ITALIC_UNDERLINE,
  NONE,
} from '../../immutable/SampleDraftInlineStyle';

const FOO = new Set(['foo']);
const FOO_BAR = new Set(['foo', 'bar']);

const createBlock = (text, inlineStyles: DraftInlineStyle[]) => {
  return makeContentBlock({
    key: 'a',
    text,
    type: 'unstyled',
    characterList: inlineStyles.map(style => makeCharacterMetadata({style})),
  });
};

test('must encode for an unstyled document', () => {
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(2), new Array(2).fill(NONE)),
    ),
  ).toMatchSnapshot();
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(20), new Array(20).fill(NONE)),
    ),
  ).toMatchSnapshot();
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(200), new Array(200).fill(NONE)),
    ),
  ).toMatchSnapshot();
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(2000), new Array(2000).fill(NONE)),
    ),
  ).toMatchSnapshot();
});

test('must encode for a flat styled document', () => {
  const all = BOLD_ITALIC_UNDERLINE;
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(20), new Array(20).fill(BOLD)),
    ),
  ).toMatchSnapshot();
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(20), new Array(20).fill(BOLD_ITALIC)),
    ),
  ).toMatchSnapshot();
  expect(
    encodeInlineStyleRanges(
      createBlock(' '.repeat(20), new Array(20).fill(all)),
    ),
  ).toMatchSnapshot();
});

test('must encode custom styles', () => {
  const custom = [FOO, FOO, FOO_BAR, FOO_BAR, BOLD, BOLD];
  expect(
    encodeInlineStyleRanges(createBlock(' '.repeat(6), custom)),
  ).toMatchSnapshot();
});

test('must encode for a complex styled document', () => {
  // prettier-ignore
  const complex = ([
        BOLD, BOLD, BOLD, BOLD, NONE,     // "four "
        BOLD_ITALIC, BOLD_ITALIC,         // "sc"
        ITALIC_UNDERLINE, BOLD_UNDERLINE, // "or"
        BOLD_ITALIC_UNDERLINE,            // "e"
    ]);

  expect(
    encodeInlineStyleRanges(createBlock(' '.repeat(10), complex)),
  ).toMatchSnapshot();
});

test('must encode for strings with surrogate pairs', () => {
  const str = 'Take a \uD83D\uDCF7 #selfie';
  // prettier-ignore
  const styles = [
        NONE, NONE, NONE, NONE,                            // `Take`
        BOLD, BOLD, BOLD_ITALIC, BOLD_ITALIC, BOLD_ITALIC, // ` a [camera]`
        ITALIC, ITALIC, ITALIC, ITALIC, ITALIC, ITALIC,    // ` #self`
        NONE, NONE,                                        // `ie`
    ];

  expect(encodeInlineStyleRanges(createBlock(str, styles))).toMatchSnapshot();
});
