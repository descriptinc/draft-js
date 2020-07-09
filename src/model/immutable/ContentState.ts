/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {BlockMap} from './BlockMap';
import {
  SelectionState,
  makeEmptySelection,
  makeNullSelection,
} from './SelectionState';
import {first, join, makeMemoizedToArray, map} from '../descript/Iterables';
import {DraftEntityType} from '../entity/DraftEntityType';
import {DraftEntityMutability} from '../entity/DraftEntityMutability';
import {createFromArray} from './BlockMapBuilder';
import {makeContentBlock} from './ContentBlock';
import DraftEntity, {DraftEntityMapObject} from '../entity/DraftEntity';
import {DraftEntityInstance} from '../entity/DraftEntityInstance';
import sanitizeDraftText from '../encoding/sanitizeDraftText';
import {BlockNode} from './BlockNode';
import memoizeOne from 'memoize-one';
import {genKey} from '../../Draft';

export type ContentState = Readonly<{
  blockMap: BlockMap;
  selectionBefore: SelectionState;
  selectionAfter: SelectionState;
}>;

export function makeContentState({
  blockMap,
  selectionAfter = makeEmptySelection(first(blockMap.keys())!),
  selectionBefore = makeEmptySelection(first(blockMap.keys())!),
}: Partial<ContentState> & Pick<ContentState, 'blockMap'>): ContentState {
  return {
    blockMap,
    selectionBefore,
    selectionAfter,
  };
}

const keyForIndex = makeMemoizedToArray((blockMap: BlockMap) =>
  blockMap.keys(),
);
const indexForKey = memoizeOne((blockMapKeyForIndex: readonly string[]) => {
  const _indexForKey: Record<string, number> = {};
  const len = blockMapKeyForIndex.length;
  for (let i = 0; i < len; i++) {
    const key = blockMapKeyForIndex[i];
    _indexForKey[key] = i;
  }
  return _indexForKey;
});
function getBlockKeyForIndex(blockMap: BlockMap, index: number): string {
  const key = keyForIndex(blockMap)[index];
  if (key === undefined) {
    throw new Error('No block key for index');
  }
  return key;
}
function getIndexForBlockKey(blockMap: BlockMap, blockKey: string): number {
  const index = indexForKey(keyForIndex(blockMap))[blockKey];
  if (index === undefined) {
    throw new Error('No index for block key');
  }
  return index;
}

export function getLastCreatedEntityKey(): string {
  // TODO: update this when we fully remove DraftEntity
  return DraftEntity.__getLastCreatedEntityKey();
}

export function getBlockForKey(
  {blockMap}: ContentState,
  key: string,
): BlockNode {
  const block = blockMap.get(key);
  if (!block) {
    throw new Error('No block found for key');
  }
  return block;
}

export function getFirstBlock({blockMap}: ContentState): BlockNode {
  const block = first(blockMap.values());
  if (!block) {
    throw new Error('Block map is empty');
  }
  return block;
}

export function getLastBlock({blockMap}: ContentState): BlockNode {
  const size = blockMap.size;
  if (size === 0) {
    throw new Error('Block map is empty');
  }
  const key = getBlockKeyForIndex(blockMap, size - 1);
  const block = blockMap.get(key);
  if (!block) {
    throw new Error('No block for key');
  }
  return block;
}

export function hasText(content: ContentState): boolean {
  const {blockMap} = content;
  if (blockMap.size > 1) {
    return true;
  }
  return (
    blockMap.size > 1 ||
    (blockMap.size > 0 &&
      escape(getFirstBlock(content).text).replace(/%u200B/g, '').length > 0)
  );
}

export function getPlainText(content: ContentState, separator = '\n'): string {
  return join(
    map(content.blockMap.values(), b => b.text),
    separator,
  );
}

export function createEntity(
  type: DraftEntityType,
  mutability: DraftEntityMutability,
  data?: Record<string, unknown> | null,
): string {
  // TODO: update this when we fully remove DraftEntity
  return DraftEntity.__create(type, mutability, data);
}

export function mergeEntityData(
  key: string,
  toMerge: Record<string, any>,
): void {
  // TODO: update this when we fully remove DraftEntity
  DraftEntity.__mergeData(key, toMerge);
}

export function replaceEntityData(
  key: string,
  newData: Record<string, any>,
): void {
  // TODO: update this when we fully remove DraftEntity
  DraftEntity.__replaceData(key, newData);
}

export function addEntity(instance: DraftEntityInstance): void {
  // TODO: update this when we fully remove DraftEntity
  DraftEntity.__add(instance);
}

export function getEntity(key: string): DraftEntityInstance {
  // TODO: update this when we fully remove DraftEntity
  return DraftEntity.__get(key);
}

export function createFromBlockArray(
  blocks: BlockNode[] | {contentBlocks: BlockNode[]},
): ContentState {
  // TODO: remove this when we completely deprecate the old entity API
  const theBlocks = Array.isArray(blocks) ? blocks : blocks.contentBlocks;

  const blockMap = createFromArray(theBlocks);
  const firstBlock = first(blockMap.values());
  const selectionState = !firstBlock
    ? makeNullSelection()
    : makeEmptySelection(firstBlock.key);

  return makeContentState({
    blockMap,
    selectionBefore: selectionState,
    selectionAfter: selectionState,
  });
}

export function createFromText(
  text: string,
  delimiter: string | RegExp = /\r\n?|\n/g,
): ContentState {
  const strings = text.split(delimiter);
  const blocks = strings.map(block => {
    block = sanitizeDraftText(block);

    return makeContentBlock({
      key: genKey(),
      text: block,
    });
  });
  return createFromBlockArray(blocks);
}

export function getBlockBefore(
  {blockMap}: ContentState,
  blockKey: string,
): BlockNode | undefined {
  const index = getIndexForBlockKey(blockMap, blockKey);
  if (index === 0) {
    return undefined;
  }
  const key = getBlockKeyForIndex(blockMap, index - 1);
  const block = blockMap.get(key);
  if (!block) {
    throw new Error('No block for key');
  }
  return block;
}

export function getBlockAfter(
  {blockMap}: ContentState,
  blockKey: string,
): BlockNode | undefined {
  const index = getIndexForBlockKey(blockMap, blockKey);
  if (index === blockMap.size - 1) {
    return undefined;
  }
  const key = getBlockKeyForIndex(blockMap, index + 1);
  const block = blockMap.get(key);
  if (!block) {
    throw new Error('No block for key');
  }
  return block;
}

export function getEntityMap(_: ContentState): DraftEntityMapObject {
  return DraftEntity;
}
