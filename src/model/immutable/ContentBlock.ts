/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {
  CharacterMetadata,
  EMPTY_CHARACTER,
  EMPTY_SET,
} from './CharacterMetadata';
import {BlockNode} from './BlockNode';
import {repeat} from '../descript/Iterables';
import {findRangesImmutable} from './findRangesImmutable';
import {DraftInlineStyle} from './DraftInlineStyle';
import fastDeepEqual from 'fast-deep-equal/es6';

const EMPTY_DATA = {};

export type ContentBlock = BlockNode;

export function makeContentBlock({
  data = EMPTY_DATA,
  key,
  text = '',
  depth = 0,
  type = 'unstyled',
  characterList = Array.from(repeat(text.length, EMPTY_CHARACTER)),
}: Partial<ContentBlock> & {key: string}): ContentBlock {
  return {
    characterList,
    data,
    key,
    text,
    depth,
    type,
  };
}

const haveEqualStyle = (
  charA: CharacterMetadata,
  charB: CharacterMetadata,
): boolean => fastDeepEqual(charA.style, charB.style);

const haveEqualEntity = (
  charA: CharacterMetadata,
  charB: CharacterMetadata,
): boolean => charA.entity === charB.entity;

export function findStyleRanges(
  block: BlockNode,
  filterFn: (value: CharacterMetadata) => boolean,
  callback: (start: number, end: number) => void,
): void {
  findRangesImmutable(block.characterList, haveEqualStyle, filterFn, callback);
}

export function findEntityRanges(
  block: BlockNode,
  filterFn: (value: CharacterMetadata) => boolean,
  callback: (start: number, end: number) => void,
): void {
  findRangesImmutable(block.characterList, haveEqualEntity, filterFn, callback);
}

export function getInlineStyleAt(
  block: BlockNode,
  index: number,
): DraftInlineStyle {
  return block.characterList[index]?.style || EMPTY_SET;
}

export function getEntityAt(block: BlockNode, index: number): string | null {
  return block.characterList[index]?.entity || null;
}
