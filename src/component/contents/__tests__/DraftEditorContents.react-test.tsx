/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import {
  createEmpty,
  createWithContent,
  EditorState,
} from '../../../model/immutable/EditorState';
import {createFromText} from '../../../model/immutable/ContentState';

import React from 'react';
import RichTextEditorUtil from '../../../model/modifier/RichTextEditorUtil';
import {createRoot, Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import DraftEditor from '../../base/DraftEditor.react';
import DraftEditorContents from '../DraftEditorContents-core.react';
import {DefaultDraftBlockRenderMap} from '../../../model/immutable/DefaultDraftBlockRenderMap';

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  document.body.removeChild(container);
});

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

  class Container extends React.Component<
    Record<string, any>,
    {editorState: EditorState}
  > {
    constructor(props) {
      super(props);
      this.state = {
        editorState: createEmpty(),
      };
    }
    focus = () => {
      //
    };
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
          <DraftEditor
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

  const containerRef = React.createRef<Container>();

  flushSync(() => {
    root.render(<Container ref={containerRef} />);
  });

  const editorInstance = containerRef.current;
  expect(editorInstance).toBeTruthy();

  expect(() => {
    editorInstance?.toggleCustomBlock();
  }).not.toThrow();
});

test('renders windowed blocks and replaces omitted runs with spacers', () => {
  const editorState = createWithContent(createFromText('zero\none\ntwo\nthree'));
  const blocks = Array.from(editorState.currentContent.blockMap.values());
  const blockRendererFn = jest.fn(() => null);

  flushSync(() => {
    root.render(
      <DraftEditorContents
        editorState={editorState}
        blockRenderMap={DefaultDraftBlockRenderMap}
        blockRendererFn={blockRendererFn}
        blockWindowing={{
          shouldRenderBlock: block => block === blocks[1] || block === blocks[3],
          getSpacerHeight: block => (blocks.indexOf(block) + 1) * 10,
        }}
      />,
    );
  });

  expect(Array.from(container.querySelectorAll('[data-block]'))).toHaveLength(2);
  expect(blockRendererFn).toHaveBeenCalledTimes(2);
  expect(
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-block-window-spacer]'),
    ).map(spacer => spacer.style.height),
  ).toEqual(['10px', '30px']);
  expect(
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-block-window-spacer]'),
    ).map(spacer => spacer.dataset.blockWindowSpacerTextLength),
  ).toEqual(['5', '4']);
  expect(
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-block-window-spacer]'),
    ).map(spacer => spacer.dataset.blockWindowSpacerLayout),
  ).toEqual(['[[10,4]]', '[[30,3]]']);
  expect(container.textContent).toBe('onethree');
});

test('keeps windowed spacers in the same custom block wrapper', () => {
  const editorState = createWithContent(createFromText('zero\none\ntwo'));
  const blocks = Array.from(editorState.currentContent.blockMap.values());
  const wrapper = (
    <div data-testid="fixed-height-wrapper" style={{height: 200}} />
  );

  flushSync(() => {
    root.render(
      <DraftEditorContents
        editorState={editorState}
        blockRendererFn={() => null}
        blockRenderMap={{
          unstyled: {
            element: 'div',
            wrapper,
          },
        }}
        blockWindowing={{
          shouldRenderBlock: block => block !== blocks[1],
          getSpacerHeight: () => 40,
        }}
      />,
    );
  });

  const wrappers = container.querySelectorAll('[data-testid="fixed-height-wrapper"]');
  expect(wrappers).toHaveLength(1);
  expect(wrappers[0]?.children).toHaveLength(3);
  expect(
    wrappers[0]?.querySelector<HTMLElement>('[data-block-window-spacer]')?.style.height,
  ).toBe('40px');
});
