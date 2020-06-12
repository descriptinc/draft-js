/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+draft_js
 */

'use strict';

import {DraftBlockType} from '../constants/DraftBlockType';
import {InlineStyleRange} from './InlineStyleRange';
import {EntityRange} from './EntityRange';

/**
 * A plain object representation of a ContentBlock, with all style and entity
 * attribution repackaged as range objects.
 */
export type RawDraftContentBlock = {
  key: string | null;
  type: DraftBlockType;
  text: string;
  depth: number | null;
  inlineStyleRanges: Array<InlineStyleRange> | null;
  entityRanges: Array<EntityRange> | null;
  data?: Object;
  children?: Array<RawDraftContentBlock>;
};
