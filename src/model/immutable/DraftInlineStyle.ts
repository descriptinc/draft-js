/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

export type DraftInlineStyle = ReadonlySet<string>;

export function inlineStyleWith(
  style: DraftInlineStyle,
  item: string,
): DraftInlineStyle {
  if (style.has(item)) {
    return style;
  }
  return new Set([...style, item]);
}

export function inlineStyleWithout(
  style: DraftInlineStyle,
  item: string,
): DraftInlineStyle {
  if (!style.has(item)) {
    return style;
  }
  const result = new Set<string>(style);
  result.delete(item);
  return result;
}
