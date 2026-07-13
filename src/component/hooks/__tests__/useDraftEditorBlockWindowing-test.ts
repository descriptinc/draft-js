import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {
  createWithContent,
  forceSelection,
  pushContent,
} from '../../../model/immutable/EditorState';
import {createFromText} from '../../../model/immutable/ContentState';
import {makeSelectionState} from '../../../model/immutable/SelectionState';
import DraftModifier from '../../../model/modifier/DraftModifier';
import {
  exportedForTesting,
  useDraftEditorBlockWindowing,
} from '../useDraftEditorBlockWindowing';

const {getBlockLayout, getWindowRange, haveEqualLayout} = exportedForTesting;

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
  test('preserves layout identity when ordered heights are unchanged', () => {
    expect(
      haveEqualLayout(
        new Map([['a', {height: 10}]]),
        new Map([['a', {height: 10}]]),
      ),
    ).toBe(true);
  });

  test('detects height and block order changes', () => {
    const previous = new Map([
      ['a', {height: 10}],
      ['b', {height: 20}],
    ]);
    expect(
      haveEqualLayout(
        previous,
        new Map([
          ['a', {height: 11}],
          ['b', {height: 20}],
        ]),
      ),
    ).toBe(false);
    expect(
      haveEqualLayout(
        previous,
        new Map([
          ['b', {height: 20}],
          ['a', {height: 10}],
        ]),
      ),
    ).toBe(false);
  });
});

test('estimates new block heights without discarding the measured layout', () => {
  const contentState = createFromText('zero\none\ntwo');
  const blocks = Array.from(contentState.blockMap.values());
  const layout = getBlockLayout(
    contentState.blockMap,
    new Map([
      [blocks[0]!.key, {height: 20}],
      [blocks[2]!.key, {height: 40}],
    ]),
  );

  expect(layout?.keys).toEqual(blocks.map(block => block.key));
  expect(layout?.heights.get(blocks[1]!.key)).toBe(30);
  expect(layout?.offsets).toEqual([0, 20, 50]);
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
  editorContainer.getBoundingClientRect = () =>
    ({width: 500, height: 3000} as DOMRect);
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
  let resizeCallback: ResizeObserverCallback | undefined;
  const originalResizeObserver = globalThis.ResizeObserver;
  const resizeObserver = {
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  };
  globalThis.ResizeObserver = jest.fn(callback => {
    resizeCallback = callback;
    return resizeObserver;
  }) as unknown as typeof ResizeObserver;
  const flushAnimationFrames = () => {
    const callbacks = Array.from(animationFrames.values());
    animationFrames.clear();
    for (const callback of callbacks) {
      callback(performance.now());
    }
  };

  let blockWindowing: ReturnType<typeof useDraftEditorBlockWindowing> = undefined;
  function Harness({state}: {state: typeof editorState}) {
    blockWindowing = useDraftEditorBlockWindowing({
      enabled: true,
      editorState: state,
      scrollContainerRef: {current: scrollContainer},
      editorContainerRef: {current: editorContainer},
      pinnedBlockKeys: new Set([blocks[20]!.key]),
    });
    return null;
  }

  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(React.createElement(Harness, {state: editorState})));
  await act(async () => flushAnimationFrames());
  await act(async () =>
    resizeCallback?.(
      [{contentRect: {width: 500, height: 3000}} as ResizeObserverEntry],
      resizeObserver as unknown as ResizeObserver,
    ),
  );

  expect(blockWindowing).toBeDefined();
  expect(blockWindowing?.shouldRenderBlock(blocks[20]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[28]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[29]!)).toBe(true);
  expect(blockWindowing?.shouldRenderBlock(blocks[21]!)).toBe(false);

  const splitSelection = makeSelectionState({
    anchorKey: blocks[20]!.key,
    anchorOffset: 3,
    focusKey: blocks[20]!.key,
    focusOffset: 3,
  });
  const beforeSplit = forceSelection(editorState, splitSelection);
  const afterSplit = pushContent(
    beforeSplit,
    DraftModifier.splitBlock(beforeSplit.currentContent, splitSelection),
    'split-block',
  );
  const blocksAfterSplit = Array.from(afterSplit.currentContent.blockMap.values());
  await act(async () =>
    root.render(React.createElement(Harness, {state: afterSplit})),
  );
  await act(async () =>
    resizeCallback?.(
      [{contentRect: {width: 500, height: 3100}} as ResizeObserverEntry],
      resizeObserver as unknown as ResizeObserver,
    ),
  );

  expect(blockWindowing).toBeDefined();
  expect(
    blocksAfterSplit.filter(block => blockWindowing?.shouldRenderBlock(block)),
  ).not.toHaveLength(blocksAfterSplit.length);

  await act(async () => root.unmount());
  scrollContainer.remove();
  editorContainer.remove();
  jest.restoreAllMocks();
  globalThis.ResizeObserver = originalResizeObserver;
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousReactActEnvironment;
});
