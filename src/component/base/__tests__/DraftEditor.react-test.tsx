/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import React from 'react';
import {
  createEmpty,
  createWithContent,
  EditorState,
} from '../../../model/immutable/EditorState';
import DraftEditor from '../DraftEditor.react';
import {createRoot, Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {createFromText} from '../../../model/immutable/ContentState';
import {supportsBlockSkeletonRendering} from '../../hooks/useDraftEditorBlockSkeleton';

let container: HTMLElement;
let root: Root;
let editorState: EditorState;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  editorState = createEmpty();
});

afterEach(() => {
  root.unmount();
  document.body.removeChild(container);
});

test('must has generated editorKey', () => {
  const editorRef = React.createRef<DraftEditor>();
  flushSync(() => {
    root.render(
      <DraftEditor
        ref={editorRef}
        editorState={editorState}
        onChange={() => {
          //
        }}
      />,
    );
  });

  const editorInstance = editorRef.current;
  expect(editorInstance).toBeTruthy();
  const key = editorInstance?.getEditorKey();
  expect(key).toBeTruthy();
  expect(typeof key).toBe('string');
  expect(key!.length).toBeGreaterThan(0);
});

test('must has editorKey same as props', () => {
  const editorRef = React.createRef<DraftEditor>();
  flushSync(() => {
    root.render(
      <DraftEditor
        ref={editorRef}
        editorState={editorState}
        onChange={() => {
          //
        }}
        editorKey="hash"
      />,
    );
  });

  const editorInstance = editorRef.current;
  expect(editorInstance).toBeTruthy();
  expect(editorInstance?.getEditorKey()).toBe('hash');
});

test.each([true, false])('promotes blocks; null ref: %s', nullRef => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerCount = 0;
  const observedElements: Element[] = [];
  const renderedSkeletonCounts: number[] = [];
  const scrollContainerRef: React.RefObject<HTMLElement | null> = {
    current: nullRef ? null : container,
  };

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin: string;
    readonly thresholds = [0];

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      observerCount++;
      this.rootMargin = options?.rootMargin ?? '0px';
      if (this.rootMargin === '500px 0px') {
        observerCallback = callback;
      }
    }

    disconnect(): void {}
    observe(target: Element): void {
      observedElements.push(target);
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
  try {
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            onBlockSkeletonsRendered: () => {
              renderedSkeletonCounts.push(
                container.querySelectorAll('[data-block-skeleton]').length,
              );
            },
            scrollContainerRef,
          }}
        />,
      );
    });

    expect(new Set(observedElements).size).toBe(3);
    expect(observerCount).toBe(2);
    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(2);
    expect(renderedSkeletonCounts).toEqual([2]);

    const secondBlock = container.querySelectorAll('[data-block-key]')[1];
    expect(observedElements).toContain(secondBlock);
    flushSync(() => {
      observerCallback?.(
        [
          {
            isIntersecting: true,
            target: secondBlock,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(1);
    expect(renderedSkeletonCounts).toEqual([2, 1]);
    expect(observerCount).toBe(2);
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  }
});

test('promotes viewport skeleton blocks synchronously while scrolling', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '500px 0px';
    readonly thresholds = [0];

    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
  try {
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    container.getBoundingClientRect = () =>
      ({top: 0, bottom: 100} as DOMRect);
    const blocks = Array.from(
      container.querySelectorAll<HTMLElement>('[data-block-key]'),
    );
    blocks[0]!.getBoundingClientRect = () =>
      ({top: -40, bottom: -20} as DOMRect);
    blocks[1]!.getBoundingClientRect = () =>
      ({top: 20, bottom: 40} as DOMRect);
    blocks[2]!.getBoundingClientRect = () =>
      ({top: 120, bottom: 140} as DOMRect);

    container.dispatchEvent(new Event('scroll'));

    expect(blocks[1]!.hasAttribute('data-block-skeleton')).toBe(false);
    expect(blocks[2]!.hasAttribute('data-block-skeleton')).toBe(true);
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  }
});

test('renders newly introduced block keys as skeletons immediately', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalMutationObserver = globalThis.MutationObserver;
  const observedElements: Element[] = [];
  let mutationCallback: MutationCallback | undefined;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '500px 0px';
    readonly thresholds = [0];

    disconnect(): void {}
    observe(target: Element): void {
      observedElements.push(target);
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  class MockMutationObserver implements MutationObserver {
    constructor(callback: MutationCallback) {
      mutationCallback = callback;
    }

    disconnect(): void {}
    observe(): void {}
    takeRecords(): MutationRecord[] {
      return [];
    }
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
  globalThis.MutationObserver = MockMutationObserver;
  try {
    const blockRendererFn = jest.fn(() => null);
    editorState = createWithContent(createFromText('zero\none'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockRendererFn={blockRendererFn}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });
    expect(blockRendererFn).toHaveBeenCalledTimes(1);

    blockRendererFn.mockClear();
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockRendererFn={blockRendererFn}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(2);
    expect(blockRendererFn).toHaveBeenCalledTimes(1);

    const newBlock = container.querySelectorAll('[data-block-key]')[2];
    mutationCallback?.(
      [
        ({
          addedNodes: [newBlock],
          removedNodes: [],
        } as unknown) as MutationRecord,
      ],
      {} as MutationObserver,
    );
    expect(observedElements).toContain(newBlock);
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    globalThis.MutationObserver = originalMutationObserver;
  }
});

test('keeps a promoted block full when its DOM node is moved', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const originalMutationObserver = globalThis.MutationObserver;
  let intersectionCallback: IntersectionObserverCallback | undefined;
  let mutationCallback: MutationCallback | undefined;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin: string;
    readonly thresholds = [0];

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? '0px';
      if (this.rootMargin === '500px 0px') {
        intersectionCallback = callback;
      }
    }

    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  class MockMutationObserver implements MutationObserver {
    constructor(callback: MutationCallback) {
      mutationCallback = callback;
    }

    disconnect(): void {}
    observe(): void {}
    takeRecords(): MutationRecord[] {
      return [];
    }
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
  globalThis.MutationObserver = MockMutationObserver;
  try {
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    const secondBlock = container.querySelectorAll('[data-block-key]')[1]!;
    flushSync(() => {
      intersectionCallback?.(
        [
          {
            isIntersecting: true,
            target: secondBlock,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(secondBlock.hasAttribute('data-block-skeleton')).toBe(false);

    flushSync(() => {
      mutationCallback?.(
        [
          ({
            addedNodes: [secondBlock],
            removedNodes: [secondBlock],
          } as unknown) as MutationRecord,
        ],
        {} as MutationObserver,
      );
    });

    expect(
      container.querySelectorAll('[data-block-key]')[1]!.hasAttribute(
        'data-block-skeleton',
      ),
    ).toBe(false);
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    globalThis.MutationObserver = originalMutationObserver;
  }
});

test('renders full blocks when native scroll anchoring is unsupported', () => {
  const originalCSS = globalThis.CSS;
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '500px 0px';
    readonly thresholds = [0];

    disconnect(): void {}
    observe(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(): void {}
  }

  globalThis.IntersectionObserver = MockIntersectionObserver;
  Object.defineProperty(globalThis, 'CSS', {
    configurable: true,
    value: {supports: () => false},
  });
  try {
    expect(supportsBlockSkeletonRendering()).toBe(false);
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(0);
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: originalCSS,
    });
  }
});

type MockBlockHeights = Readonly<{full: number; skeleton: number}>;

/**
 * Replaces `IntersectionObserver` with one that stacks blocks top to bottom and
 * intersects them with a fixed viewport, like a browser without scroll
 * anchoring. Each observer uses its own `rootMargin`. `runFrames` delivers
 * changed entries once per frame and returns whether the observers went quiet.
 */
function installLayoutIntersectionObserver({
  heights,
  viewportHeight,
  getScrollTop,
}: {
  heights: readonly MockBlockHeights[];
  viewportHeight: number;
  getScrollTop: () => number;
}) {
  type Rect = Readonly<{top: number; bottom: number; height: number}>;
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  const observers: LayoutIntersectionObserver[] = [];

  const layOutBlocks = (): Map<Element, Rect> => {
    const rects = new Map<Element, Rect>();
    let top = -getScrollTop();
    container
      .querySelectorAll<HTMLElement>('[data-block-key]')
      .forEach((block, index) => {
        const blockHeights = heights[index]!;
        const height = block.hasAttribute('data-block-skeleton')
          ? blockHeights.skeleton
          : blockHeights.full;
        rects.set(block, {top, bottom: top + height, height});
        top += height;
      });
    return rects;
  };

  class LayoutIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin: string;
    readonly thresholds = [0];
    private readonly wasIntersecting = new Map<Element, boolean | undefined>();

    constructor(
      private readonly callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? '0px';
      observers.push(this);
    }

    disconnect(): void {
      this.wasIntersecting.clear();
    }
    observe(target: Element): void {
      this.wasIntersecting.set(target, undefined);
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(target: Element): void {
      this.wasIntersecting.delete(target);
    }

    deliver(rects: ReadonlyMap<Element, Rect>): boolean {
      const margin = parseFloat(this.rootMargin);
      const entries: IntersectionObserverEntry[] = [];
      for (const [target, wasIntersecting] of this.wasIntersecting) {
        const rect = rects.get(target);
        if (!rect) {
          continue;
        }
        const isIntersecting =
          rect.bottom >= -margin && rect.top <= viewportHeight + margin;
        if (isIntersecting !== wasIntersecting) {
          this.wasIntersecting.set(target, isIntersecting);
          entries.push(({
            boundingClientRect: rect,
            isIntersecting,
            target,
          } as unknown) as IntersectionObserverEntry);
        }
      }
      if (entries.length > 0) {
        flushSync(() => this.callback(entries, this));
      }
      return entries.length > 0;
    }
  }

  globalThis.IntersectionObserver = LayoutIntersectionObserver;
  return {
    runFrames(maxFrames: number): boolean {
      for (let frame = 0; frame < maxFrames; frame += 1) {
        const rects = layOutBlocks();
        let delivered = false;
        for (const observer of observers) {
          delivered = observer.deliver(rects) || delivered;
        }
        if (!delivered) {
          return true;
        }
      }
      return false;
    },
    restore() {
      globalThis.IntersectionObserver = originalIntersectionObserver;
    },
  };
}

test('settles a block whose skeleton is taller than its full render', () => {
  // The selection pins block 0, so block 1 is the one under test.
  const blockTexts = Array.from({length: 12}, (_, index) => `block ${index}`);
  const heights = blockTexts.map((_, index) =>
    index === 1 ? {full: 224, skeleton: 256} : {full: 100, skeleton: 100},
  );
  // Block 1 starts at 100. With one 500px margin, a scrollTop in
  // (100 + 224 + 500, 100 + 256 + 500) demotes it when full and promotes it
  // when a skeleton.
  const layout = installLayoutIntersectionObserver({
    heights,
    viewportHeight: 400,
    getScrollTop: () => 840,
  });
  try {
    editorState = createWithContent(createFromText(blockTexts.join('\n')));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    expect(layout.runFrames(20)).toBe(true);
    expect(
      container
        .querySelectorAll('[data-block-key]')[1]!
        .hasAttribute('data-block-skeleton'),
    ).toBe(false);
  } finally {
    layout.restore();
  }
});

test('keeps a block between the two margins in its current state', () => {
  // Block 1 spans 100 to 200, so at scrollTop 950 its bottom is 750px above
  // the viewport: outside the 500px promote margin, inside the 1000px demote
  // margin.
  let scrollTop = 0;
  const layout = installLayoutIntersectionObserver({
    heights: Array.from({length: 3}, () => ({full: 100, skeleton: 100})),
    viewportHeight: 400,
    getScrollTop: () => scrollTop,
  });
  try {
    editorState = createWithContent(createFromText('zero\none\ntwo'));
    flushSync(() => {
      root.render(
        <DraftEditor
          editorState={editorState}
          onChange={() => {}}
          blockSkeleton={{
            enabled: true,
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });
    const block = container.querySelectorAll('[data-block-key]')[1]!;
    const scrollTo = (nextScrollTop: number) => {
      scrollTop = nextScrollTop;
      expect(layout.runFrames(20)).toBe(true);
    };

    scrollTo(0);
    expect(block.hasAttribute('data-block-skeleton')).toBe(false);
    scrollTo(950);
    expect(block.hasAttribute('data-block-skeleton')).toBe(false);

    scrollTo(2000);
    expect(block.hasAttribute('data-block-skeleton')).toBe(true);
    scrollTo(950);
    expect(block.hasAttribute('data-block-skeleton')).toBe(true);
  } finally {
    layout.restore();
  }
});

describe('ariaDescribedBy', () => {
  function getProps(elem: React.ReactElement): Element {
    flushSync(() => {
      root.render(elem);
    });
    // Find the contenteditable div which has the aria-describedby attribute
    const contentEditable = container.querySelector('[contenteditable]');
    if (!contentEditable) {
      throw new Error('Could not find contenteditable element');
    }
    return contentEditable;
  }

  describe('without placeholder', () => {
    test('undefined by default', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
        />,
      );
      expect(props.getAttribute('aria-describedby')).toBeNull();
    });

    test('can be set to something arbitrary', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
          ariaDescribedBy="abc"
        />,
      );
      expect(props.getAttribute('aria-describedby')).toBe('abc');
    });

    test('can use special token', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
          ariaDescribedBy="abc {{editor_id_placeholder}} xyz"
        />,
      );
      expect(props.getAttribute('aria-describedby')).toMatch(/^abc\s+xyz$/);
    });
  });

  describe('with placeholder', () => {
    test('has placeholder id by default', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
          editorKey="X"
          placeholder="place"
        />,
      );
      expect(props.getAttribute('aria-describedby')).toBe('placeholder-X');
    });

    test('can be set to something arbitrary', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
          editorKey="X"
          placeholder="place"
          ariaDescribedBy="abc"
        />,
      );
      expect(props.getAttribute('aria-describedby')).toBe('abc');
    });

    test('can use special token', () => {
      const props = getProps(
        <DraftEditor
          editorState={editorState}
          onChange={() => {
            //
          }}
          editorKey="X"
          placeholder="place"
          ariaDescribedBy="abc {{editor_id_placeholder}} xyz"
        />,
      );
      expect(props.getAttribute('aria-describedby')).toBe(
        'abc placeholder-X xyz',
      );
    });
  });
});
