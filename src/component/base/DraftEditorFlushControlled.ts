/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 * @emails oncall+draft_js
 */

import ReactDOMComet from 'react-dom';

const flushControlled:
  | void
  | ((fn: () => void) => void) = (ReactDOMComet as any)
  .unstable_flushControlled;

export default flushControlled;
