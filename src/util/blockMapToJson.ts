import {BlockMap} from '../model/immutable/BlockMap';
import {BlockNode} from '../model/immutable/BlockNode';

export function blockToJson(block: BlockNode): Record<string, any> {
  return {
    ...block,
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
