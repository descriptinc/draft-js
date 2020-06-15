import {BlockMap} from '../model/immutable/BlockMap';
import {BlockNodeRecord} from '../model/immutable/BlockNodeRecord';

function toObject(map: Map<string, any>): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [k, v] of map) {
    res[k] = v;
  }
  return res;
}

export function blockToJson(block: BlockNodeRecord): Record<string, any> {
  return {
    ...block,
    data: toObject(block.data),
    characterList: block.characterList.map(char => ({
      ...char,
      style: Array.from(char.style).sort(),
    })),
  };
}

export function blockMapToJsonArray(blockMap: BlockMap): any[] {
  return Array.from(blockMap.values()).map(blockToJson);
}

export function blockMapToJsonObject(blockMap: BlockMap): Record<string, any> {
  const res: Record<string, any> = {};
  for (const [key, block] of blockMap) {
    res[key] = blockToJson(block);
  }
  return res;
}
