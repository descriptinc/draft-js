/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {createEmpty, EditorState} from '../../../model/immutable/EditorState';

jest.mock('generateRandomKey');

import React from 'react';
import RichTextEditorUtil from '../../../model/modifier/RichTextEditorUtil';

test('defaults to "unstyled" block type for unknown block types', () => {
  const CUSTOM_BLOCK_TYPE = 'CUSTOM_BLOCK_TYPE';

  function CustomText(props) {
    // contrived example
    return (
      <p>
        <b>{props.children}</b>
      </p>
    );
  }

  class Container extends React.Component<{}, {editorState: EditorState}> {
    constructor(props) {
      super(props);
      this.state = {
        editorState: createEmpty(),
      };
    }
    toggleCustomBlock = () => {
      this.setState(
        {
          editorState: RichTextEditorUtil.toggleBlockType(
            this.state.editorState,
            CUSTOM_BLOCK_TYPE,
          ),
        },
        () => {
          setTimeout(() => this.focus(), 0);
        },
      );
    };
    blockRenderFn(block) {
      if (block.type === CUSTOM_BLOCK_TYPE) {
        return {
          component: CustomText,
          editable: true,
        };
      }
      return null;
    }
    render() {
      return (
        <div className="container-root">
          <div>
            <button onClick={this.toggleCustomBlock}>CenterAlign</button>
          </div>
          <Editor
            placeholder="Type away :)"
            editorState={this.state.editorState}
            blockRendererFn={this.blockRenderFn}
            onChange={this._handleChange}
          />
        </div>
      );
    }
    _handleChange = editorState => {
      this.setState({editorState});
    };
  }

  const block = ReactTestRenderer.create(<Container />);
  const editorInstace = block.getInstance();

  expect(() => {
    editorInstace.toggleCustomBlock(
      editorInstace.state.editorState,
      CUSTOM_BLOCK_TYPE,
    );
  }).not.toThrow();
});
