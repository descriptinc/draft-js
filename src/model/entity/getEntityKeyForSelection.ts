/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import {EntityMap} from '../immutable/EntityMap';
import {ContentState} from '../immutable/ContentState';
import {
  getStartKey,
  getStartOffset,
  isCollapsed,
  SelectionState,
} from '../immutable/SelectionState';
import {getEntityAt} from '../immutable/ContentBlockNode';
import DraftEntity from './DraftEntity';
import {notEmptyKey} from '../../component/utils/draftKeyUtils';

/**
 * Return the entity key that should be used when inserting text for the
 * specified target selection, only if the entity is `MUTABLE`. `IMMUTABLE`
 * and `SEGMENTED` entities should not be used for insertion behavior.
 */
export default function getEntityKeyForSelection(
  contentState: ContentState,
  targetSelection: SelectionState,
): string | null {
  let entityKey;

  if (isCollapsed(targetSelection)) {
    const key = targetSelection.anchorKey;
    const offset = targetSelection.anchorOffset;
    if (offset > 0) {
      entityKey = getEntityAt(contentState.blockMap.get(key)!, offset - 1);

      if (entityKey !== getEntityAt(contentState.blockMap.get(key)!, offset)) {
        return null;
      }
      return filterKey(DraftEntity, entityKey);
    }
    return null;
  }

  const startKey = getStartKey(targetSelection);
  const startOffset = getStartOffset(targetSelection);
  const startBlock = contentState.blockMap.get(startKey)!;

  entityKey =
    startOffset === startBlock.text.length
      ? null
      : getEntityAt(startBlock, startOffset);

  return filterKey(DraftEntity, entityKey);
}

/**
 * Determine whether an entity key corresponds to a `MUTABLE` entity. If so,
 * return it. If not, return null.
 */
function filterKey(
  entityMap: EntityMap,
  entityKey: string | null,
): string | null {
  if (notEmptyKey(entityKey)) {
    const entity = entityMap.__get(entityKey);
    return entity.mutability === 'MUTABLE' ? entityKey : null;
  }
  return null;
}
