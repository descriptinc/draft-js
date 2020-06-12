/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 *
 * This is unstable and not part of the public API and should not be used by
 * production systems. This file may be update/removed without notice.
 */
import {BlockNodeRecord} from '../../immutable/BlockNodeRecord';
import {BlockMap} from '../../immutable/BlockMap';
import {ContentBlockNode} from '../../immutable/ContentBlockNode';

export function blockIsExperimentalTreeBlock(
  block: BlockNodeRecord,
): block is ContentBlockNode {
  return Boolean((block as ContentBlockNode).children);
}

export default function getNextDelimiterBlockKey(
  block: BlockNodeRecord,
  blockMap: BlockMap,
): string | null {
  if (!blockIsExperimentalTreeBlock(block)) {
    return null;
  }

  const nextSiblingKey = block.nextSibling;

  if (nextSiblingKey) {
    return nextSiblingKey;
  }

  const parent = block.parent;

  if (!parent) {
    return null;
  }

  let nextNonDescendantBlock: ContentBlockNode | null = blockMap.get(
    parent,
  ) as ContentBlockNode;
  while (nextNonDescendantBlock && !nextNonDescendantBlock.nextSibling) {
    const parentKey: string | null = nextNonDescendantBlock.parent;
    nextNonDescendantBlock = parentKey
      ? (blockMap.get(parentKey) as ContentBlockNode)
      : null;
  }

  if (!nextNonDescendantBlock) {
    return null;
  }

  return nextNonDescendantBlock.nextSibling;
}
