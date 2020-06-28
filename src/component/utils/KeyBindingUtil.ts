/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import UserAgent from 'fbjs/lib/UserAgent';
import isSoftNewlineEvent from './isSoftNewlineEvent';
import React from 'react';

const isOSX = UserAgent.isPlatform('Mac OS X');

const KeyBindingUtil = {
  /**
   * Check whether the ctrlKey modifier is *not* being used in conjunction with
   * the altKey modifier. If they are combined, the result is an `altGraph`
   * key modifier, which should not be handled by this set of key bindings.
   */
  isCtrlKeyCommand: function(e: React.KeyboardEvent): boolean {
    return !!e.ctrlKey && !e.altKey;
  },

  isOptionKeyCommand: function(e: React.KeyboardEvent): boolean {
    return isOSX && e.altKey;
  },

  usesMacOSHeuristics: function(): boolean {
    return isOSX;
  },

  hasCommandModifier: function(e: React.KeyboardEvent): boolean {
    return isOSX
      ? !!e.metaKey && !e.altKey
      : KeyBindingUtil.isCtrlKeyCommand(e);
  },

  isSoftNewlineEvent,
};

export default KeyBindingUtil;
