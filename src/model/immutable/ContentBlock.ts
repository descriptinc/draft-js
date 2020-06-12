/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {EMPTY_CHARACTER} from './CharacterMetadata';
import {BlockNode} from './BlockNode';

const EMPTY_MAP = new Map();

export type ContentBlock = BlockNode;

export function makeContentBlock({
  data = EMPTY_MAP,
  key = '',
  text = '',
  depth = 0,
  type = 'unstyled',
  characterList = new Array(text.length).fill(EMPTY_CHARACTER),
}: Partial<ContentBlock>): ContentBlock {
  return {
    characterList,
    data,
    key,
    text,
    depth,
    type,
  };
}
