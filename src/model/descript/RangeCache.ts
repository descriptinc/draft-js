/*
 * RangeCache.ts
 * descript-web-v2
 *
 * Last modified by srubin on 6/18/18 3:44 PM
 * Copyright © 2018 Descript, Inc. All rights reserved.
 */

import {makeObjectCache} from './ObjectCache';

const [cache] = makeObjectCache<'start', number, 'end', number>('start', 'end');

type StartEndRange = Readonly<{start: number; end: number}>;

export function getRange(start: number, end: number): StartEndRange {
  // eslint-disable-next-line no-bitwise
  start |= 0;
  // eslint-disable-next-line no-bitwise
  end |= 0;

  return cache(start, end);
}
