import {BlockMap} from '../model/immutable/BlockMap';
import {BlockNodeRecord} from '../model/immutable/BlockNodeRecord';

function toObject(map: Map<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of map) {
    res[k] = v;
  }
  return res;
}

export function blockNodeToJson(block: BlockNodeRecord): Record<string, any> {
  return {
    ...block,
    data: toObject(block.data),
    characterList: block.characterList.map(char => ({
      ...char,
      style: Array.from(char.style),
    })),
  };
}

export function blockMapToJsonArray(blockMap: BlockMap): any[] {
  return Array.from(blockMap.values()).map(blockNodeToJson);
}

export function blockMapToJsonObject(blockMap: BlockMap): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [key, block] of blockMap) {
    res[key] = blockNodeToJson(block);
  }
  return res;
}
