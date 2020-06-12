/*
 * ObjectCache.ts
 * descript-web-v2
 *
 * Last modified by srubin on 7/21/19 9:48 PM
 * Copyright © 2019 Descript, Inc. All rights reserved.
 */

type CacheResult<Name extends string, Value> = Readonly<Record<Name, Value>>;
type ClearCache = () => void;

// Booleans and numbers can be used; they'll be converted to strings internally by JS.
type ObjectKey = string | number | boolean | undefined;

const UNDEFINED_KEY = `undefined-${Math.random()}`;

export function makeObjectCache<N0 extends string, V0 extends ObjectKey>(
  ...names: [N0]
): [(arg0: V0) => CacheResult<N0, V0>, ClearCache];
export function makeObjectCache<
  N0 extends string,
  V0 extends ObjectKey,
  N1 extends string,
  V1 extends ObjectKey
>(
  ...names: [N0, N1]
): [
  (arg0: V0, arg1: V1) => CacheResult<N0, V0> & CacheResult<N1, V1>,
  ClearCache,
];
export function makeObjectCache<
  N0 extends string,
  V0 extends ObjectKey,
  N1 extends string,
  V1 extends ObjectKey,
  N2 extends string,
  V2 extends ObjectKey
>(
  ...names: [N0, N1, N2]
): [
  (
    arg0: V0,
    arg1: V1,
    arg2: V2,
  ) => CacheResult<N0, V0> & CacheResult<N1, V1> & CacheResult<N2, V2>,
  ClearCache,
];
export function makeObjectCache<
  N0 extends string,
  V0 extends ObjectKey,
  N1 extends string,
  V1 extends ObjectKey,
  N2 extends string,
  V2 extends ObjectKey,
  N3 extends string,
  V3 extends ObjectKey
>(
  ...names: [N0, N1, N2, N3]
): [
  (
    arg0: V0,
    arg1: V1,
    arg2: V2,
    arg3: V3,
  ) => CacheResult<N0, V0> &
    CacheResult<N1, V1> &
    CacheResult<N2, V2> &
    CacheResult<N3, V3>,
  ClearCache,
];
export function makeObjectCache(
  ...names: string[]
): // eslint-disable-next-line @typescript-eslint/no-explicit-any
[(...args: ObjectKey[]) => any, ClearCache] {
  const len = names.length;

  if (len === 0) {
    throw new Error('cannot create zero-argument pool');
  }

  let cache = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getObject(arg0: any, arg1: any, arg2: any, arg3: any) {
    let currentCache = cache;

    for (let i = 0; i < len; i++) {
      // Why this instead of interpreting the params as an array?
      // We don't want to create that junk array on a typical cache call...
      // That would partially defeat the purpose of the object cache
      let arg = arg0;
      switch (i) {
        case 0:
          arg = arg0;
          break;
        case 1:
          arg = arg1;
          break;
        case 2:
          arg = arg2;
          break;
        case 3:
        default:
          arg = arg3;
          break;
      }
      const argKey = arg ?? UNDEFINED_KEY;

      let res = currentCache[argKey];
      if (res === undefined) {
        if (i === len - 1) {
          // It's a cache miss, so now we can afford to create
          // some temporary objects.
          const args = [arg0, arg1, arg2, arg3];
          res = {};
          for (let argIndex = 0; argIndex < names.length; argIndex++) {
            res[names[argIndex]] = args[argIndex];
          }
        } else {
          res = {};
        }
        currentCache[argKey] = res;
      }

      currentCache = res;
    }

    return currentCache;
  }

  function clearCache() {
    cache = {};
  }

  return [getObject, clearCache];
}

/**
 * Object cache where the parameters can be any (interned)
 * data type, not just valid object property types.
 *
 * Uses at Map instead of a plain object internally, so it
 * is slightly less efficient.
 * @param names
 */
export function makeObjectMapCache<N0 extends string, V0>(
  ...names: [N0]
): [(arg0: V0) => CacheResult<N0, V0>, ClearCache];
export function makeObjectMapCache<
  N0 extends string,
  V0,
  N1 extends string,
  V1
>(
  ...names: [N0, N1]
): [
  (arg0: V0, arg1: V1) => CacheResult<N0, V0> & CacheResult<N1, V1>,
  ClearCache,
];
export function makeObjectMapCache<
  N0 extends string,
  V0,
  N1 extends string,
  V1,
  N2 extends string,
  V2
>(
  ...names: [N0, N1, N2]
): [
  (
    arg0: V0,
    arg1: V1,
    arg2: V2,
  ) => CacheResult<N0, V0> & CacheResult<N1, V1> & CacheResult<N2, V2>,
  ClearCache,
];
export function makeObjectMapCache<
  N0 extends string,
  V0,
  N1 extends string,
  V1,
  N2 extends string,
  V2,
  N3 extends string,
  V3
>(
  ...names: [N0, N1, N2, N3]
): [
  (
    arg0: V0,
    arg1: V1,
    arg2: V2,
    arg3: V3,
  ) => CacheResult<N0, V0> &
    CacheResult<N1, V1> &
    CacheResult<N2, V2> &
    CacheResult<N3, V3>,
  ClearCache,
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeObjectMapCache(
  ...names: string[]
): [(...args: any[]) => any, ClearCache] {
  const len = names.length;

  if (len === 0) {
    throw new Error('cannot create zero-argument pool');
  }

  const cache = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getObject(arg0: any, arg1: any, arg2: any, arg3: any) {
    let currentCache = cache;
    if (arg0 === undefined) {
      throw new Error();
    }

    for (let i = 0; i < len; i++) {
      // Why this instead of interpreting the params as an array?
      // We don't want to create that junk array on a typical cache call...
      // That would partially defeat the purpose of the object cache
      let arg = arg0;
      switch (i) {
        case 0:
          arg = arg0;
          break;
        case 1:
          arg = arg1;
          break;
        case 2:
          arg = arg2;
          break;
        case 3:
        default:
          arg = arg3;
          break;
      }

      let res = currentCache.get(arg);
      if (res === undefined) {
        if (i === len - 1) {
          // It's a cache miss, so now we can afford to create
          // some temporary objects.
          const args = [arg0, arg1, arg2, arg3];
          res = {};
          for (let argIndex = 0; argIndex < names.length; argIndex++) {
            res[names[argIndex]] = args[argIndex];
          }
        } else {
          res = new Map();
        }
        currentCache.set(arg, res);
      }

      currentCache = res;
    }

    return currentCache;
  }

  function clearCache() {
    cache.clear();
  }

  return [getObject, clearCache];
}
