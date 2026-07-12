import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {
  createWithContent,
  forceSelection,
} from '../../../model/immutable/EditorState';
import {createFromText} from '../../../model/immutable/ContentState';
import {makeSelectionState} from '../../../model/immutable/SelectionState';
import {
  exportedForTesting,
  useDraftEditorBlockWindowing,
} from '../useDraftEditorBlockWindowing';

const {getWindowRange, haveEqualLayout} = exportedForTesting;

describe('getWindowRange', () => {
  const blockLayout = {
    keys: ['a', 'b', 'c'],
    offsets: [0, 10, 30],
    heights: new Map([
      ['a', 10],
      ['b', 20],
      ['c', 30],
    ]),
  };

  test('returns blocks intersecting the viewport', () => {
    expect(getWindowRange(blockLayout, 11, 29)).toEqual({start: 1, end: 2});
  });

  test('includes blocks touching either viewport boundary', () => {
    expect(getWindowRange(blockLayout, 10, 30)).toEqual({start: 0, end: 3});
  });

  test('handles a viewport after the content', () => {
    expect(getWindowRange(blockLayout, 100, 120)).toEqual({start: 3, end: 3});
  });
});

describe('haveEqualLayout', () => {
  const block = {key: 'a'} as any;

  test('ignores block identity changes when ordered heights are unchanged', () => {
    expect(
      haveEqualLayout(
        new Map([['a', {block, height: 10}]]),
        new Map([['a', {block: {...block}, height: 10}]]),
      ),
    ).toBe(true);
  });

  test('detects height and block order changes', () => {
    const previous = new Map([
      ['a', {block, height: 10}],
      ['b', {block, height: 20}],
    ]);
    expect(
      haveEqualLayout(
        previous,
        new Map([
          ['a', {block, height: 11}],
          ['b', {block, height: 20}],
        ]),
      ),
    ).toBe(false);
    expect(
      haveEqualLayout(
        previous,
        new Map([
          ['b', {block, height: 20}],
          ['a', {block, height: 10}],
        ]),
      ),
    ).toBe(false);
  });
});

test('keeps selection endpoints and external pinned blocks rendered', async () => {
  const reactActEnvironment = globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  };
  const previousReactActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
  const contentState = createFromText(
    Array.from({length: 30}, (_, index) => `block ${index}`).join('\n'),
  );
  const blocks = Array.from(contentState.blockMap.values());
  const editorState = forceSelection(
    createWithContent(contentState),
    makeSelectionState({
      anchorKey: blocks[28]!.key,
      focusKey: blocks[29]!.key,
    }),
  );
  const scrollContainer = document.createElement('div');
  const editorContainer = document.createElement('div');
  const contents = document.createElement('div');
  contents.dataset.contents = 'true';
  editorContainer.append(contents);
  document.body.append(scrollContainer, editorContainer);
  Object.defineProperty(scrollContainer, 'clientHeight', {value: 100});
  scrollContainer.getBoundingClientRect = () =>
    ({top: 0, bottom: 100, height: 100} as DOMRect);
  contents.getBoundingClientRect = () =>
    ({top: 0, bottom: 3000, height: 3000} as DOMRect);
  for (const [index, block] of blocks.entries()) {
    const element = document.createElement('div');
    element.id = `block-${block.key}`;
    element.getBoundingClientRect = () =>
      ({
        top: index * 100,
        bottom: (index + 1) * 100,
        height: 100,
      }) as DOMRect;
    contents.append(element);
  }

  let animationFrameId = 0;
  const animationFrames = new Map<number, FrameRequestCallback>();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
    animationFrameId += 1;
    animationFrames.set(animationFrameId, callback);
    return animationFrameId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
    animationFrames.delete(id);
  });
  const flushAnimationFrames = () => {
    const callbacks = Array.from(animationFrames.values());
    animationFrames.clear();
    for (const callback of callbacks) {
      callback(performance.now());
    }
  };

  let blockWindowing: ReturnType<typeof useDraftEditorBlockWindowing> = undefined;
  function Harness() {
    blockWindowing = useDraftEditorBlockWindowing({
      enabled: true,
      editorState,
      scrollContainerRef: {current: scrollContainer},
      editorContainerRef: {current: editorContainer},
      pinnedBlockKeys: new Set([blocks[20]!.key]),
    });
    return null;
  }

  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(React.createElement(Harness)));
  await act(async () => flushAnimationFrames());

  expect(blockWindowing).toBeDefined();
  expect(blockWindowing?.shouldRenderBlock(blocks[20]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[28]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[29]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[21]!)).toBe(false);

  await act(async () => root.unmount());
  scrollContainer.remove();
  editorContainer.remove();
  jest.restoreAllMocks();
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousReactActEnvironment;
});
