/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import React from 'react';

export type DraftBlockRenderConfig = Readonly<{
  element: string;
  wrapper?: React.ReactNode;
  aliasedElements?: readonly string[];
}>;
