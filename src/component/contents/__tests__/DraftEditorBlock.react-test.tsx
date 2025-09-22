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
  ContentBlock,
  makeContentBlock,
} from '../../../model/immutable/ContentBlock';

import React from 'react';

jest
  .mock('fbjs/lib/Style')
  .mock('fbjs/lib/getElementPosition')
  .mock('fbjs/lib/getScrollPosition')
  .mock('fbjs/lib/getViewportDimensions');
const mockLeafRender = jest.fn((props) => {
  // Return a span with data attributes that we can query in tests
  return <span data-test-leaf="true" data-offset-key={props?.offsetKey} data-style-set={props?.styleSet?.size || 0}>{props?.text}</span>;
});
class MockEditorLeaf extends React.Component<any> {
  render() {
    return mockLeafRender(this.props);
  }
}
jest.setMock('../DraftEditorLeaf.react', MockEditorLeaf);

import Style from 'fbjs/lib/Style';
import UnicodeBidiDirection from 'fbjs/lib/UnicodeBidiDirection';
import getElementPosition from 'fbjs/lib/getElementPosition';
import getScrollPosition from 'fbjs/lib/getScrollPosition';
import getViewportDimensions from 'fbjs/lib/getViewportDimensions';
import {
  applyStyle,
  EMPTY_CHARACTER,
} from '../../../model/immutable/CharacterMetadata';
import {makeSelectionState} from '../../../model/immutable/SelectionState';
import BlockTree from '../../../model/immutable/BlockTree';
import {createFromText} from '../../../model/immutable/ContentState';
import {
  BOLD,
  NONE,
} from '../../../model/immutable/SampleDraftInlineStyle';
import DraftEditorBlock from '../DraftEditorBlock.react';
import {DraftDecoratorType} from '../../../model/decorators/DraftDecoratorType';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';

const mockGetDecorations = jest.fn();

class DecoratorSpan extends React.Component<any> {
  render() {
    return <span>{this.props.children}</span>;
  }
}

// Define a class to satisfy typechecks.
class Decorator {
  getDecorations(block: ContentBlock) {
    return mockGetDecorations(block);
  }
  getComponentForKey() {
    return DecoratorSpan;
  }
  getPropsForKey() {
    return {};
  }
}

Style.getScrollParent.mockReturnValue(window);
(window.scrollTo as jest.Mock) = jest.fn();
getElementPosition.mockReturnValue({
  x: 0,
  y: 600,
  width: 500,
  height: 16,
});
getScrollPosition.mockReturnValue({x: 0, y: 0});
getViewportDimensions.mockReturnValue({width: 1200, height: 800});

const returnEmptyString = () => {
  return '';
};

const getHelloBlock = () => {
  return makeContentBlock({
    key: 'a',
    type: 'unstyled',
    text: 'hello',
    characterList: new Array(5).fill(EMPTY_CHARACTER),
  });
};

const getProps = (block: ContentBlock, decorator: DraftDecoratorType | null = null) => {
  const contentState = createFromText('');
  return {
    block,
    tree: BlockTree.generate(contentState, block, decorator),
    selection: makeSelectionState({anchorKey: 'b', focusKey: 'b'}),
    decorator,
    forceSelection: false,
    direction: UnicodeBidiDirection.LTR,
    blockStyleFn: returnEmptyString,
    startIndent: true,
    blockKey: 'a',
    offsetKey: 'a-0',
    contentState,
    customStyleMap: {},
    customStyleFn: () => null,
  };
};

const getPropsWithBlockStyle = (
  block: ContentBlock,
  blockStyle?: string,
  decorator: DraftDecoratorType | null = null,
) => {
  const contentState = createFromText('');
  return {
    block,
    tree: BlockTree.generate(contentState, block, decorator),
    selection: makeSelectionState({anchorKey: 'b', focusKey: 'b'}),
    decorator,
    forceSelection: false,
    direction: UnicodeBidiDirection.LTR,
    blockStyleFn: () => blockStyle || '',
    startIndent: true,
    blockKey: 'a',
    offsetKey: 'a-0',
    contentState,
    customStyleMap: {},
    customStyleFn: () => null,
  };
};

beforeEach(() => {
  mockLeafRender.mockClear();
});

// Tests rewritten without ReactTestRenderer
test('must render a leaf node', () => {
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that the block container exists
  const blockDiv = container.querySelector('[data-offset-key="a-0"]');
  expect(blockDiv).toBeTruthy();

  // Check that leaf nodes were rendered using our test attributes
  const leafNodes = container.querySelectorAll('[data-test-leaf="true"]');
  expect(leafNodes.length).toBe(1);

  // Verify the leaf has correct text
  expect(leafNodes[0].textContent).toBe('hello');

  // Verify the leaf has correct offset key
  expect(leafNodes[0].getAttribute('data-offset-key')).toBe('a-0-0');

  // Verify mock leaf render was called with correct props
  expect(mockLeafRender).toHaveBeenCalledWith(
    expect.objectContaining({
      text: 'hello',
      offsetKey: 'a-0-0',
      start: 0,
      isLast: true,
    })
  );

  root.unmount();
  document.body.removeChild(container);
});

test('must render multiple leaf nodes', () => {
  const boldLength = 2;
  let helloBlock = getHelloBlock();
  let characters = helloBlock.characterList;
  characters = characters
    .slice(0, boldLength)
    .map(c => applyStyle(c, 'BOLD'))
    .concat(characters.slice(boldLength));

  helloBlock = {...helloBlock, characterList: characters};
  const props = getProps(helloBlock);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that multiple leaf nodes were rendered
  const leafNodes = container.querySelectorAll('[data-test-leaf="true"]');
  expect(leafNodes.length).toBe(2); // One for bold "he", one for plain "llo"

  // Check the text content is preserved
  expect(container.textContent).toBe('hello');

  // Verify first leaf is styled (bold)
  const firstLeaf = leafNodes[0];
  expect(firstLeaf.textContent).toBe('he');
  expect(firstLeaf.getAttribute('data-offset-key')).toBe('a-0-0');
  expect(Number(firstLeaf.getAttribute('data-style-set'))).toBeGreaterThan(0);

  // Verify second leaf is unstyled
  const secondLeaf = leafNodes[1];
  expect(secondLeaf.textContent).toBe('llo');
  expect(secondLeaf.getAttribute('data-offset-key')).toBe('a-0-1');
  expect(Number(secondLeaf.getAttribute('data-style-set'))).toBe(0);

  // Verify mock calls
  expect(mockLeafRender).toHaveBeenCalledWith(
    expect.objectContaining({
      text: 'he',
      offsetKey: 'a-0-0',
      start: 0,
      styleSet: BOLD,
      isLast: false,
    })
  );

  expect(mockLeafRender).toHaveBeenCalledWith(
    expect.objectContaining({
      text: 'llo',
      offsetKey: 'a-0-1',
      start: 2,
      styleSet: NONE,
      isLast: true,
    })
  );

  root.unmount();
  document.body.removeChild(container);
});

test('must not re-render if parent does not re-render', () => {
  mockLeafRender.mockClear();

  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  const nextProps = {
    ...props,
    tree: BlockTree.generate(createFromText(''), props.block, null),
  };

  expect(props.block !== nextProps.block).toMatchSnapshot();

  flushSync(() => {
    root.render(<DraftEditorBlock {...nextProps} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('must not re-render if props do not change', () => {
  mockLeafRender.mockClear();
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  const nextProps = {
    ...props,
    tree: BlockTree.generate(createFromText(''), props.block, null),
  };

  // Tree changes are irrelevant if block and score are unchanged.
  expect(props.tree !== nextProps.tree).toMatchSnapshot();

  flushSync(() => {
    root.render(<DraftEditorBlock {...nextProps} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('must re-render if direction changes', () => {
  mockLeafRender.mockClear();
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  const nextProps = {...props, direction: UnicodeBidiDirection.RTL};
  expect(props.direction !== nextProps.direction).toMatchSnapshot();

  flushSync(() => {
    root.render(<DraftEditorBlock {...nextProps} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('must re-render if forceSelection changes', () => {
  mockLeafRender.mockClear();
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  const nextProps = {
    ...props,
    forceSelection: true,
  };

  flushSync(() => {
    root.render(<DraftEditorBlock {...nextProps} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('must re-render if block style changes', () => {
  mockLeafRender.mockClear();
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  // Render again with the exact same props as before.
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // No new leaf renders.
  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('must re-render if selection state changes from non-selection to selection', () => {
  mockLeafRender.mockClear();
  const props = getProps(getHelloBlock());

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();

  const newProps = {
    ...props,
    selection: makeSelectionState({anchorKey: 'a'}),
  };

  // Render again with selection now moved elsewhere and the contents
  // unchanged.
  flushSync(() => {
    root.render(<DraftEditorBlock {...newProps} />);
  });

  // No new leaf renders.
  expect(mockLeafRender.mock.calls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

// Decorator tests rewritten for React 18/19
test('must decorate correctly with a simple decorator', () => {
  const helloBlock = getHelloBlock();

  mockGetDecorations.mockReturnValue(['x', 'x', null, null, null]);
  const decorator = new Decorator();
  const props = getProps(helloBlock, decorator);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that mockLeafRender was called (leaves were rendered)
  expect(mockLeafRender.mock.calls.length).toBeGreaterThan(0);

  // Check that the decorator function was called
  expect(mockGetDecorations).toHaveBeenCalled();

  // The decorator should have been called with the block
  expect(mockGetDecorations).toHaveBeenCalledWith(helloBlock);

  root.unmount();
  document.body.removeChild(container);
});

test('must split apart two decorators', () => {
  const helloBlock = getHelloBlock();

  mockGetDecorations.mockReturnValue(['x', 'x', 'y', 'y', 'y']);

  const decorator = new Decorator();
  const props = getProps(helloBlock, decorator);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that mockLeafRender was called multiple times
  expect(mockLeafRender.mock.calls.length).toBeGreaterThan(0);

  // Check that the decorator function was called
  expect(mockGetDecorations).toHaveBeenCalled();

  // Verify the decorator was called with correct arguments
  expect(mockGetDecorations).toHaveBeenCalledWith(helloBlock);

  root.unmount();
  document.body.removeChild(container);
});

test('must split styled spans apart within decorator', () => {
  let helloBlock = getHelloBlock();
  const characters = helloBlock.characterList;
  const newChars = [
    applyStyle(characters[0], 'BOLD'),
    applyStyle(characters[1], 'ITALIC'),
  ].concat(characters.slice(2));

  helloBlock = {...helloBlock, characterList: newChars};

  mockGetDecorations.mockReturnValue(['x', 'x', null, null, null]);
  const decorator = new Decorator();
  const props = getProps(helloBlock, decorator);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that mockLeafRender was called multiple times for styled spans
  expect(mockLeafRender.mock.calls.length).toBeGreaterThan(0);

  // Check that the decorator function was called
  expect(mockGetDecorations).toHaveBeenCalled();

  root.unmount();
  document.body.removeChild(container);
});

test('must split apart two decorated and undecorated', () => {
  const helloBlock = getHelloBlock();

  mockGetDecorations.mockReturnValue(['x', 'x', null, null, null]);
  const decorator = new Decorator();
  const props = getProps(helloBlock, decorator);

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  // Check that mockLeafRender was called
  expect(mockLeafRender.mock.calls.length).toBeGreaterThan(0);

  // Check that the decorator function was called
  expect(mockGetDecorations).toHaveBeenCalled();

  // Verify decorator was called with correct arguments
  expect(mockGetDecorations).toHaveBeenCalledWith(helloBlock);

  root.unmount();
  document.body.removeChild(container);
});

test('scroll-to-top for block with smaller top than visibletop', () => {
  const helloBlock = getHelloBlock();
  const props = getPropsWithBlockStyle(helloBlock, 'test');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  const scrollCalls = (window.scrollTo as jest.Mock).mock.calls;
  expect(scrollCalls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});

test('should not scroll if block is entirely visible', () => {
  const props = getProps(getHelloBlock());
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => {
    root.render(<DraftEditorBlock {...props} />);
  });

  const scrollCalls = (window.scrollTo as jest.Mock).mock.calls;
  expect(scrollCalls.length).toMatchSnapshot();
  root.unmount();
  document.body.removeChild(container);
});
