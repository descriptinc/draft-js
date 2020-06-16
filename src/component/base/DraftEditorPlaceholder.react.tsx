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

import React from 'react';
import cx from 'fbjs/lib/cx';
import {EditorState} from '../../model/immutable/EditorState';
import {DraftTextAlignment} from './DraftTextAlignment';

type Props = {
  accessibilityID: string;
  editorState: EditorState;
  text: string;
  textAlignment: DraftTextAlignment;
};

/**
 * This component is responsible for rendering placeholder text for the
 * `DraftEditor` component.
 *
 * Override placeholder style via CSS.
 */
export default class DraftEditorPlaceholder extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    return (
      this.props.text !== nextProps.text ||
      this.props.editorState.selection.hasFocus !==
        nextProps.editorState.selection.hasFocus
    );
  }

  render(): React.ReactNode {
    const hasFocus = this.props.editorState.selection.hasFocus;

    const className = cx({
      'public/DraftEditorPlaceholder/root': true,
      'public/DraftEditorPlaceholder/hasFocus': hasFocus,
    });

    const contentStyle: React.CSSProperties = {
      whiteSpace: 'pre-wrap',
    };

    return (
      <div className={className}>
        <div
          className={cx('public/DraftEditorPlaceholder/inner')}
          id={this.props.accessibilityID}
          style={contentStyle}>
          {this.props.text}
        </div>
      </div>
    );
  }
}
