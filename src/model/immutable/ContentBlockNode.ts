/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 *
 * This file is a fork of ContentBlock adding support for nesting references by
 * providing links to children, parent, prevSibling, and nextSibling.
 *
 * This is unstable and not part of the public API and should not be used by
 * production systems. This file may be update/removed without notice.
 */

import {BlockNode, BlockNodeKey} from './BlockNode';
import {
  CharacterMetadata,
  EMPTY_CHARACTER,
  EMPTY_SET,
} from './CharacterMetadata';
import fastDeepEqual from 'fast-deep-equal/es6';
import {findRangesImmutable} from './findRangesImmutable';
import {DraftInlineStyle} from './DraftInlineStyle';

const EMPTY_ARRAY: readonly BlockNodeKey[] = [];
const EMPTY_MAP = new Map();

export type ContentBlockNode = BlockNode &
  Readonly<{
    children: readonly BlockNodeKey[];
    parent: BlockNodeKey | null;
    prevSibling: BlockNodeKey | null;
    nextSibling: BlockNodeKey | null;
  }>;

const haveEqualStyle = (
  charA: CharacterMetadata,
  charB: CharacterMetadata,
): boolean => fastDeepEqual(charA.style, charB.style);

const haveEqualEntity = (
  charA: CharacterMetadata,
  charB: CharacterMetadata,
): boolean => charA.entity === charB.entity;

export function makeContentBlockNode({
  parent = null,
  data = EMPTY_MAP,
  key = '',
  text = '',
  depth = 0,
  type = 'unstyled',
  children = EMPTY_ARRAY,
  prevSibling = null,
  nextSibling = null,
  characterList = new Array(text.length).fill(EMPTY_CHARACTER),
}: Partial<ContentBlockNode>): ContentBlockNode {
  return {
    parent,
    characterList,
    data,
    key,
    text,
    depth,
    type,
    children,
    prevSibling,
    nextSibling,
  };
}

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
