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
import {first, last} from '../descript/Iterables';
import {BlockNodeRecord} from './BlockNodeRecord';
import {DraftEntityType} from '../entity/DraftEntityType';
import {DraftEntityMutability} from '../entity/DraftEntityMutability';
import {createFromArray} from './BlockMapBuilder';
import {sanitizeDraftText} from '../encoding/sanitizeDraftText';
import {makeContentBlockNode} from './ContentBlockNode';
import {makeContentBlock} from './ContentBlock';
import {gkx} from '../../stubs/gkx';
import DraftEntity from '../entity/DraftEntity';

export type ContentState = Readonly<{
  blockMap: BlockMap;
  selectionBefore: SelectionState;
  selectionAfter: SelectionState;
}>;

export function makeContentState({
  blockMap,
  selectionAfter,
  selectionBefore,
}: ContentState): ContentState {
  // FIXME [perf]: force type to be exact and don't create a new object?
  return {
    blockMap,
    selectionBefore,
    selectionAfter,
  };
}

export function getLastCreatedEntityKey(): string {
  // TODO: update this when we fully remove DraftEntity
  return DraftEntity.__getLastCreatedEntityKey();
}

export function getBlockForKey(
  {blockMap}: ContentState,
  key: string,
): BlockNodeRecord {
  const block = blockMap.get(key);
  if (!block) {
    throw new Error('No block found for key');
  }
  return block;
}

export function getFirstBlock({blockMap}: ContentState): BlockNodeRecord {
  const block = first(blockMap.values());
  if (!block) {
    throw new Error('Block map is empty');
  }
  return block;
}

export function getLastBlock({blockMap}: ContentState): BlockNodeRecord {
  const block = last(blockMap.values()); // FIXME [perf]: O(n)
  if (!block) {
    throw new Error('Block map is empty');
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

export function createEntity(
  type: DraftEntityType,
  mutability: DraftEntityMutability,
  data?: Object,
): void {
  // TODO: update this when we fully remove DraftEntity
  DraftEntity.__create(type, mutability, data);
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
  blocks: BlockNodeRecord[] | {contentBlocks: BlockNodeRecord[]},
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
    if (gkx('draft_tree_data_support')) {
      return makeContentBlockNode({
        text: block,
      });
    } else {
      return makeContentBlock({
        text: block,
      });
    }
  });
  return createFromBlockArray(blocks);
}
