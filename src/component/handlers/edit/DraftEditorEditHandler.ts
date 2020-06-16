/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @emails oncall+draft_js
 */

'use strict';

import UserAgent from 'fbjs/lib/UserAgent';
import DraftEditor from '../../base/DraftEditor.react';
import editOnBeforeInput from './editOnBeforeInput';
import editOnBlur from './editOnBlur';
import editOnCompositionStart from './editOnCompositionStart';
import editOnCopy from './editOnCopy';
import editOnCut from './editOnCut';
import editOnDragOver from './editOnDragOver';
import editOnDragStart from './editOnDragStart';
import {editOnFocus} from './editOnFocus';
import editOnInput from './editOnInput';
import {editOnKeyDown} from './editOnKeyDown';
import editOnPaste from './editOnPaste';
import editOnSelect from './editOnSelect';

const isChrome = UserAgent.isBrowser('Chrome');
const isFirefox = UserAgent.isBrowser('Firefox');

const selectionHandler: (e: DraftEditor) => void =
  isChrome || isFirefox
    ? editOnSelect
    : _ => {
        //
      };

const DraftEditorEditHandler = {
  onBeforeInput: editOnBeforeInput,
  onBlur: editOnBlur,
  onCompositionStart: editOnCompositionStart,
  onCopy: editOnCopy,
  onCut: editOnCut,
  onDragOver: editOnDragOver,
  onDragStart: editOnDragStart,
  onFocus: editOnFocus,
  onInput: editOnInput,
  onKeyDown: editOnKeyDown,
  onPaste: editOnPaste,
  onSelect: editOnSelect,
  // In certain cases, contenteditable on chrome does not fire the onSelect
  // event, causing problems with cursor positioning. Therefore, the selection
  // state update handler is added to more events to ensure that the selection
  // state is always synced with the actual cursor positions.
  onMouseUp: selectionHandler,
  onKeyUp: selectionHandler,
};

export default DraftEditorEditHandler;
