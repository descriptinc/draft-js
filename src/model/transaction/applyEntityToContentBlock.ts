/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {applyEntity} from '../immutable/CharacterMetadata';
import {BlockNode} from '../immutable/BlockNode';

export default function applyEntityToContentBlock(
  contentBlock: BlockNode,
  startArg: number,
  end: number,
  entityKey: string | null,
): BlockNode {
  let start = startArg;
  if (start >= end) {
    return contentBlock;
  }
  const characterList = Array.from(contentBlock.characterList);
  let didChange = false;

  while (start < end) {
    if (!didChange && characterList[start].entity !== entityKey) {
      didChange = true;
    }
    characterList[start] = applyEntity(characterList[start], entityKey);
    start++;
  }
  return didChange
    ? {
        ...contentBlock,
        characterList,
      }
    : contentBlock;
}
