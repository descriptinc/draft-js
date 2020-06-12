/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {gkx} from './gkx';

const experimentalTreeDataSupport = gkx('draft_tree_data_support');

const component = experimentalTreeDataSupport
  ? require('DraftEditorContentsExperimental.react')
  : require('DraftEditorContents-core.react');
export default component;
