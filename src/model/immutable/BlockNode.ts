/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {DraftBlockType} from '../constants/DraftBlockType';
import {CharacterMetadata} from './CharacterMetadata';

export type BlockNodeKey = string;

export type BlockNode = Readonly<{
  characterList: readonly CharacterMetadata[];
  data: Readonly<Record<string, any>>;
  depth: number;
  key: BlockNodeKey;
  text: string;
  type: DraftBlockType;
}>;
