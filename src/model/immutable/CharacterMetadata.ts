/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {DraftInlineStyle} from './DraftInlineStyle';
import {getKey2} from '../descript/cache';

export type CharacterMetadata = Readonly<{
  entity: string | null;
  style: DraftInlineStyle;
}>;

export function applyStyle(
  meta: CharacterMetadata,
  style: string,
): CharacterMetadata {
  if (meta.style.has(style)) {
    return meta;
  }
  return {
    ...meta,
    style: new Set([...meta.style.keys(), style]),
  };
}

export function removeStyle(
  meta: CharacterMetadata,
  style: string,
): CharacterMetadata {
  if (!meta.style.has(style)) {
    return meta;
  }
  const without = new Set(meta.style);
  without.delete(style);
  return {
    ...meta,
    style: without,
  };
}

export function applyEntity(
  meta: CharacterMetadata,
  entity: string | null,
): CharacterMetadata {
  if (meta.entity === entity) {
    return meta;
  }
  return {
    ...meta,
    entity,
  };
}

const pool: Record<string, CharacterMetadata> = {};
export const EMPTY_SET: DraftInlineStyle = new Set();
export const EMPTY_CHARACTER: CharacterMetadata = {
  entity: null,
  style: EMPTY_SET,
};

export function makeCharacterMetadata(
  config?: Partial<CharacterMetadata>,
): CharacterMetadata {
  if (!config) {
    return EMPTY_CHARACTER;
  }
  const entity = config.entity || null;
  const style = config.style || new Set();
  const styles = [...style];
  styles.sort(); // FIXME [perf]: is this sort too expensive?
  const styleStr = styles.join(',');
  const key = getKey2(entity || '', styleStr);
  const existing = pool[key];
  if (existing) {
    return existing;
  }
  const char = {entity, style};
  pool[key] = char;
  return char;
}
