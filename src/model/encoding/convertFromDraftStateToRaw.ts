import {ContentState, getEntity} from '../immutable/ContentState';
import {ContentBlock} from '../immutable/ContentBlock';
import {DraftEntityType} from '../entity/DraftEntityType';
import {DraftEntityMutability} from '../entity/DraftEntityMutability';
import {findEntityRanges, getEntityAt} from '../immutable/ContentBlock';
import DraftStringKey from './DraftStringKey';
import encodeInlineStyleRanges, {
  InlineStyleRange,
} from './encodeInlineStyleRanges';
import encodeEntityRanges, {EntityRange} from './encodeEntityRanges';
import {BlockNode} from '../immutable/BlockNode';

type RawDraftEntity = {
  type: DraftEntityType;
  mutability: DraftEntityMutability;
  data?: Record<string, any>;
};

type RawDraftContentBlock = Pick<
  ContentBlock,
  'key' | 'type' | 'text' | 'depth'
> & {
  inlineStyleRanges?: InlineStyleRange[];
  entityRanges?: EntityRange[];
  children?: RawDraftContentBlock[];
  data?: Record<string, any>;
};

export type RawDraftContentState = {
  blocks: RawDraftContentBlock[];
  entityMap: Record<string, RawDraftEntity>;
};

const createRawBlock = (
  block: BlockNode,
  entityStorageMap: Record<string, string | number>,
): RawDraftContentBlock => {
  return {
    key: block.key,
    text: block.text,
    type: block.type,
    depth: block.depth,
    inlineStyleRanges: encodeInlineStyleRanges(block),
    entityRanges: encodeEntityRanges(block, entityStorageMap),
    data: block.data,
  };
};

const insertRawBlock = (
  block: BlockNode,
  entityMap: Record<string, string | number>,
  rawBlocks: Array<RawDraftContentBlock>,
) => {
  rawBlocks.push(createRawBlock(block, entityMap));
};

const encodeRawBlocks = (
  contentState: ContentState,
  rawState: RawDraftContentState,
): RawDraftContentState => {
  const entityMap = (rawState.entityMap as unknown) as Record<
    string,
    string | number
  >;

  const rawBlocks = [];

  const entityCacheRef = {};
  let entityStorageKey = 0;

  for (const block of contentState.blockMap.values()) {
    findEntityRanges(
      block,
      character => character.entity !== null,
      start => {
        const entityKey = getEntityAt(block, start);
        // Stringify to maintain order of otherwise numeric keys.
        const stringifiedEntityKey = DraftStringKey.stringify(entityKey);
        // This makes this function resilient to two entities
        // erroneously having the same key
        if (entityCacheRef[stringifiedEntityKey]) {
          return;
        }
        entityCacheRef[stringifiedEntityKey] = entityKey;
        // we need the `any` casting here since this is a temporary state
        // where we will later on flip the entity map and populate it with
        // real entity, at this stage we just need to map back the entity
        // key used by the BlockNode
        entityMap[stringifiedEntityKey] = `${entityStorageKey}` as any;
        entityStorageKey++;
      },
    );

    insertRawBlock(block, entityMap, rawBlocks);
  }

  return {
    blocks: rawBlocks,
    entityMap: (entityMap as unknown) as Record<string, RawDraftEntity>,
  };
};

// Flip storage map so that our storage keys map to global
// DraftEntity keys.
const encodeRawEntityMap = (
  rawState: RawDraftContentState,
): RawDraftContentState => {
  const {blocks, entityMap} = rawState;

  const rawEntityMap = {};

  Object.keys(entityMap).forEach((key, index) => {
    rawEntityMap[index] = getEntity(DraftStringKey.unstringify(key));
  });

  return {
    blocks,
    entityMap: rawEntityMap,
  };
};

export default function convertFromDraftStateToRaw(
  contentState: ContentState,
): RawDraftContentState {
  let rawDraftContentState: RawDraftContentState = {
    entityMap: {},
    blocks: [],
  };

  // add blocks
  rawDraftContentState = encodeRawBlocks(contentState, rawDraftContentState);

  // add entities
  rawDraftContentState = encodeRawEntityMap(rawDraftContentState);

  return rawDraftContentState;
}
