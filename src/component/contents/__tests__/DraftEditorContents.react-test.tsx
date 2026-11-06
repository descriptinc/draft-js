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

import React from 'react';
import RichTextEditorUtil from '../../../model/modifier/RichTextEditorUtil';
import {createRoot, Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import DraftEditor from '../../base/DraftEditor.react';
import DraftEditorContents from '../DraftEditorContents-core.react';
import {createFromText} from '../../../model/immutable/ContentState';
import {DefaultDraftBlockRenderMap} from '../../../model/immutable/DefaultDraftBlockRenderMap';
import {DraftDecoratorType} from '../../../model/decorators/DraftDecoratorType';

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

test('renders offscreen blocks as text skeletons with persistent DOM anchors', () => {
  const decorator: DraftDecoratorType = {
    getDecorations: block =>
      block.text.split('').map((_, index) => (index < 3 ? 'linked' : null)),
    getComponentForKey: () =>
      function FullDecorator({children}) {
        return <strong data-full-decoration={true}>{children}</strong>;
      },
    getPropsForKey: () => null,
    getDOMAnchorIdsForRange: ({block}) => [`persistent-${block.key}`],
  };
  const editorState = createWithContent(
    createFromText('zero\none\ntwo'),
    decorator,
  );
  const blocks = Array.from(editorState.currentContent.blockMap.values());
  const fullBlock = blocks[0];
  const blockRendererFn = jest.fn(() => null);

  flushSync(() => {
    root.render(
      <DraftEditorContents
        editorState={editorState}
        blockRenderMap={DefaultDraftBlockRenderMap}
        blockRendererFn={blockRendererFn}
        blockStyleFn={() => ({marginBottom: '16px'})}
        blockSkeleton={{
          fullBlockKeys: new Set(fullBlock ? [fullBlock.key] : []),
        }}
      />,
    );
  });

  expect(container.textContent).toBe('zeroonetwo');
  expect(container.querySelectorAll('[data-block]')).toHaveLength(3);
  expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(2);
  expect(container.querySelectorAll('[data-full-decoration]')).toHaveLength(1);
  expect(blockRendererFn).toHaveBeenCalledTimes(1);

  for (const block of blocks) {
    const skeleton = container.querySelector(`[data-block-key="${block.key}"]`);
    expect(skeleton?.id).toBe(`block-${block.key}`);
    expect(
      skeleton?.querySelector(`#persistent-${block.key}`)?.textContent,
    ).toBe(block.text.slice(0, 3));
  }

  for (const block of blocks.slice(1)) {
    const skeleton = container.querySelector<HTMLElement>(
      `[data-block-key="${block.key}"]`,
    );
    expect(skeleton?.hasAttribute('contenteditable')).toBe(false);
    expect(skeleton?.classList.contains('public-DraftStyleDefault-block')).toBe(
      false,
    );
    expect(skeleton?.style.marginBottom).toBe('16px');
    expect(skeleton?.style.whiteSpace).toBe('pre-wrap');
  }
});

test('refreshes skeleton anchors when another block changes their document context', () => {
  const decorator: DraftDecoratorType = {
    getDecorations: block => block.text.split('').map(() => 'linked'),
    getComponentForKey: () => ({children}) => <strong>{children}</strong>,
    getPropsForKey: () => null,
    getDOMAnchorIdsForRange: ({block, contentState}) => [
      `${contentState.blockMap.values().next().value?.text}-${block.key}`,
    ],
  };
  const content = createFromText('before\nunchanged');
  const blocks = Array.from(content.blockMap.values());
  const target = blocks[1]!;
  const render = (
    currentContent: typeof content,
    fullBlockKeys = new Set<string>(),
  ) => {
    flushSync(() => {
      root.render(
        <DraftEditorContents
          editorState={createWithContent(currentContent, decorator)}
          blockRenderMap={DefaultDraftBlockRenderMap}
          blockRendererFn={() => null}
          blockSkeleton={{fullBlockKeys}}
        />,
      );
    });
  };
  render(content);
  expect(
    container.querySelector(`[id="before-${target.key}"]`)?.textContent,
  ).toBe('unchanged');

  const blockMap = new Map(content.blockMap);
  blockMap.set(blocks[0]!.key, {...blocks[0]!, text: 'after!'});
  const changedContent = {...content, blockMap};
  render(changedContent);
  expect(container.querySelector(`[id="before-${target.key}"]`)).toBeNull();
  expect(
    container.querySelector(`[id="after!-${target.key}"]`)?.textContent,
  ).toBe('unchanged');

  render(changedContent, new Set([target.key]));
  expect(
    container
      .querySelector(`[data-block-key="${target.key}"]`)
      ?.hasAttribute('data-block-skeleton'),
  ).toBe(false);
  render(changedContent);
  expect(
    container.querySelector(`[id="after!-${target.key}"]`)?.textContent,
  ).toBe('unchanged');
});

test('updates skeleton text, styles, direction and element type', () => {
  const content = createFromText('before');
  const block = Array.from(content.blockMap.values())[0]!;
  const render = ({text, marginBottom, direction, element}: {
    text: string;
    marginBottom: string;
    direction: 'LTR' | 'RTL';
    element: string;
  }) => {
    const blockMap = new Map([[block.key, {...block, text}]]);
    flushSync(() => {
      root.render(
        <DraftEditorContents
          editorState={createWithContent({...content, blockMap})}
          blockRenderMap={{...DefaultDraftBlockRenderMap, unstyled: {element}}}
          blockRendererFn={() => null}
          blockStyleFn={() => ({marginBottom})}
          textDirectionality={direction}
          blockSkeleton={{fullBlockKeys: new Set()}}
        />,
      );
    });
  };
  render({text: 'before', marginBottom: '16px', direction: 'LTR', element: 'div'});
  render({text: 'after', marginBottom: '32px', direction: 'RTL', element: 'p'});
  const skeleton = container.querySelector<HTMLElement>(
    '[data-block-skeleton]',
  );
  expect(skeleton?.tagName).toBe('P');
  expect(skeleton?.textContent).toBe('after');
  expect(skeleton?.style.marginBottom).toBe('32px');
  expect(skeleton?.style.direction).toBe('rtl');
  render({text: '', marginBottom: '0px', direction: 'LTR', element: 'div'});
  expect(container.querySelector('[data-block-skeleton] br')).not.toBeNull();
});
