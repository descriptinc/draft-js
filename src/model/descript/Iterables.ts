/*
 * Iterables.ts
 * descript-web-v2
 *
 * Last modified by srubin on 3/26/19 7:12 PM
 * Copyright © 2019 Descript, Inc. All rights reserved.
 */

export function first<T>(iter: Iterable<T>): T | undefined {
  for (const t of iter) {
    return t;
  }
  return undefined;
}

export function last<T>(iter: Iterable<T>): T | undefined {
  let lastElt: T | undefined = undefined;
  for (const t of iter) {
    lastElt = t;
  }
  return lastElt;
}

export function size<T>(iter: Iterable<T>): number {
  let count = 0;
  for (const _ of iter) {
    count += 1;
  }
  return count;
}

export function filter<T, U extends T>(
  iter: Iterable<T>,
  predicate: (item: T, index: number) => item is U,
): IterableIterator<U>;
export function filter<T>(
  iter: Iterable<T>,
  predicate: (item: T, index: number) => boolean,
): IterableIterator<T>;
export function* filter<T>(
  iter: Iterable<T>,
  predicate: (item: T, index: number) => boolean,
): IterableIterator<T> {
  let index = 0;
  for (const item of iter) {
    if (predicate(item, index)) {
      yield item;
    }
    index += 1;
  }
}

export function* map<T, U>(
  iter: Iterable<T>,
  mapper: (item: T, index: number) => U,
): IterableIterator<U> {
  let i = 0;
  for (const item of iter) {
    yield mapper(item, i);
    i += 1;
  }
}

export function forEach<T>(
  iter: Iterable<T>,
  callback: (item: T, index: number) => void,
): void {
  let i = 0;
  for (const item of iter) {
    callback(item, i);
    i += 1;
  }
}

export function* flatMap<T, U>(
  iter: Iterable<T>,
  mapper: (item: T, index: number) => U | undefined,
): IterableIterator<U> {
  let index = 0;
  for (const item of iter) {
    const result = mapper(item, index);
    if (result !== undefined) {
      yield result;
    }
    index += 1;
  }
}

export function contains<T>(iter: Iterable<T>, item: T): boolean {
  for (const iterItem of iter) {
    if (item === iterItem) {
      return true;
    }
  }
  return false;
}

export function find<T>(
  iter: Iterable<T>,
  predicate: (item: T) => boolean,
): T | undefined {
  return first(filter(iter, predicate));
}

export function findIndex<T>(
  iter: Iterable<T>,
  predicate: (item: T) => boolean,
): number | undefined {
  let index = 0;
  for (const item of iter) {
    if (predicate(item)) {
      return index;
    }
    index += 1;
  }
  return undefined;
}

export function* slice<T>(
  iter: Iterable<T>,
  start: number,
  end: number = Infinity,
): IterableIterator<T> {
  let i = 0;
  for (const item of iter) {
    if (i >= end) {
      return;
    }
    if (i >= start) {
      yield item;
    }
    i += 1;
  }
}

export function some<T>(
  iter: Iterable<T>,
  predicate: (item: T) => boolean,
): boolean {
  return find(iter, predicate) !== undefined;
}
export function every<T>(
  iter: Iterable<T>,
  predicate: (item: T) => boolean,
): boolean {
  return !some(iter, item => !predicate(item));
}

export function isEmpty<T>(iter: Iterable<T>): boolean {
  return first(iter) === undefined;
}

export function takeNth<T>(iter: Iterable<T>, n: number): T | undefined {
  if (n <= 0) {
    throw new RangeError('n <= 0');
  }
  for (const item of iter) {
    n -= 1;
    if (n === 0) {
      return item;
    }
  }
  if (n > 1) {
    throw new RangeError(`less than n-1 items`);
  }
  return undefined;
}

export function* flatten<T>(iters: Iterable<Iterable<T>>): Iterable<T> {
  for (const iter of iters) {
    yield* iter;
  }
}

export function* withNext<T>(
  iter: Iterable<T>,
): IterableIterator<[T, T | undefined]> {
  let prev: T | undefined = undefined;
  for (const item of iter) {
    if (prev !== undefined) {
      yield [prev, item];
    }
    prev = item;
  }
  if (prev !== undefined) {
    yield [prev, undefined];
  }
}

export function* toIterator<T>(iter: Iterable<T>): IterableIterator<T> {
  yield* iter;
}

export function zip<T, U>(
  iterA: Iterable<T>,
  iterB: Iterable<U>,
): IterableIterator<[T, U]>;
export function zip<T, U, V>(
  iterA: Iterable<T>,
  iterB: Iterable<U>,
  iterC: Iterable<V>,
): IterableIterator<[T, U, V]>;
export function zip<T, U, V, W>(
  iterA: Iterable<T>,
  iterB: Iterable<U>,
  iterC: Iterable<V>,
  iterD: Iterable<W>,
): IterableIterator<[T, U, V, W]>;
export function* zip<T>(...iters: Iterable<T>[]): IterableIterator<T[]> {
  const iterators = iters.map(toIterator);
  while (true) {
    const res = [];
    for (const iterator of iterators) {
      const next = iterator.next();
      if (next.done) {
        return;
      }
      res.push(next.value);
    }
    yield res;
  }
}

export function* range(a: number, b?: number): IterableIterator<number> {
  let start = 0;
  let end = a;
  if (b !== undefined) {
    start = a;
    end = b;
  }
  for (let i = start; i < end; i++) {
    yield i;
  }
}

export function times<T>(
  count: number,
  callback: (i: number) => T,
): IterableIterator<T> {
  return map(range(count), callback);
}

export function join(iter: Iterable<string>, separator: string): string {
  let isFirst = true;
  let str = '';
  for (const item of iter) {
    if (isFirst) {
      str = item;
      isFirst = false;
    } else {
      str += separator + item;
    }
  }
  return str;
}

/**
 * Returns the equivalent of calling `Array.from(iterable)` but returns the
 * previous array if the elements are equal according to `isElementEqual`.
 *
 * Also preserves reference equality for matching elements
 * (i.e., previousArray[i] and incoming[i]) even if other
 * elements are changing.
 *
 * If you want to check reference equality of elements, do not pass
 * a value for `isElementEqual` - the function will be more efficient
 * than if you passed `(x, y) => x === y`
 */
export function toArrayOrPrevious<T>(
  incoming: Iterable<T>,
  previousArray: readonly T[],
  isElementEqual?: (a: T, b: T) => boolean,
): readonly T[] {
  if (incoming === previousArray) {
    return previousArray;
  }
  let res: T[] | undefined;
  let i = 0;
  const previousLength = previousArray.length;
  for (const item of incoming) {
    if (res) {
      let toPush = item;
      if (i < previousLength) {
        const prevItem = previousArray[i];
        if (item === prevItem || isElementEqual?.(item, prevItem)) {
          toPush = prevItem;
        }
      }
      res.push(toPush);
    } else if (
      i === previousLength ||
      !(isElementEqual
        ? isElementEqual(previousArray[i], item)
        : previousArray[i] === item)
    ) {
      if (Array.isArray(incoming) && !isElementEqual) {
        return incoming;
      }
      res = previousArray.slice(0, i);
      res.push(item);
    }
    i += 1;
  }
  if (!res) {
    if (i < previousArray.length) {
      if (Array.isArray(incoming) && !isElementEqual) {
        return incoming;
      }
      return previousArray.slice(0, i);
    }
    return previousArray;
  }
  return res;
}

/**
 * Returns a function that gets the latest result of the passed-in
 * iterable-returning function, using `toArrayOrPrevious` to memoize the result.
 */
export function makeMemoizedToArray<T, Arg0>(
  getIterable: (arg0: Arg0) => Iterable<T>,
  isElementEqual?: (a: T, b: T) => boolean,
): (arg0: Arg0) => readonly T[];
export function makeMemoizedToArray<T, Arg0, Arg1>(
  getIterable: (arg0: Arg0, arg1: Arg1) => Iterable<T>,
  isElementEqual?: (a: T, b: T) => boolean,
): (arg0: Arg0, arg1: Arg1) => readonly T[];
export function makeMemoizedToArray<T, Arg0, Arg1, Arg2>(
  getIterable: (arg0: Arg0, arg1: Arg1, arg2: Arg2) => Iterable<T>,
  isElementEqual?: (a: T, b: T) => boolean,
): (arg0: Arg0, arg1: Arg1, arg2: Arg2) => readonly T[];
export function makeMemoizedToArray<T, Arg0, Arg1, Arg2>(
  getIterable: (arg0: Arg0, arg1: Arg1, arg2: Arg2) => Iterable<T>,
  // defaults to reference equality
  isElementEqual?: (a: T, b: T) => boolean,
): (arg0: Arg0, arg1: Arg1, arg2: Arg2) => readonly T[] {
  let lastArray: readonly T[] | undefined;
  let lastArg0: Arg0 | undefined;
  let lastArg1: Arg1 | undefined;
  let lastArg2: Arg2 | undefined;
  return (arg0, arg1, arg2): readonly T[] => {
    // If inputs haven't changed, return the previous value
    if (
      lastArray &&
      arg0 === lastArg0 &&
      arg1 === lastArg1 &&
      arg2 === lastArg2
    ) {
      return lastArray;
    }
    const iter = getIterable(arg0, arg1, arg2);
    lastArg0 = arg0;
    lastArg1 = arg1;
    lastArg2 = arg2;
    if (!lastArray) {
      lastArray = Array.from(iter);
    } else {
      lastArray = toArrayOrPrevious(iter, lastArray, isElementEqual);
    }
    return lastArray;
  };
}
