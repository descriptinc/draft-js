const keyCache2: Record<string, Record<string, string>> = {};

export function getKey2(a: string, b: string): string {
  let bCache = keyCache2[a];
  if (!bCache) {
    bCache = {};
    keyCache2[a] = bCache;
  }

  let key = bCache[b];
  if (key === undefined) {
    key = `${a}:${b}`;
    bCache[b] = key;
  }
  return key;
}

const keyCache3: Record<string, Record<string, Record<string, string>>> = {};

export function getKey3(a: string, b: string, c: string): string {
  let bCache = keyCache3[a];
  if (!bCache) {
    bCache = {};
    keyCache3[a] = bCache;
  }

  let cCache = bCache[b];
  if (!cCache) {
    cCache = {};
    bCache[b] = cCache;
  }

  let key = cCache[c];
  if (key === undefined) {
    key = `${a}:${b}:${c}`;
    cCache[c] = key;
  }
  return key;
}
