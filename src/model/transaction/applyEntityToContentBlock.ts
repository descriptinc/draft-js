/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {applyEntity, CharacterMetadata} from '../immutable/CharacterMetadata';
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

  const existingCharacterList = contentBlock.characterList;
  let characterList: CharacterMetadata[] | undefined;

  while (start < end) {
    if (!characterList && existingCharacterList[start].entity !== entityKey) {
      characterList = Array.from(existingCharacterList);
    }
    if (characterList) {
      characterList[start] = applyEntity(characterList[start], entityKey);
    }
    start++;
  }
  return characterList
    ? {
        ...contentBlock,
        characterList,
      }
    : contentBlock;
}
