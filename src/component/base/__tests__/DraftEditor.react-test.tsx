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

test('promotes intersecting skeleton blocks to full rendering', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  let observerCallback: IntersectionObserverCallback | undefined;
  let observerCount = 0;
  const observedElements: Element[] = [];
  const renderedSkeletonCounts: number[] = [];

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '500px 0px';
    readonly thresholds = [0];

    constructor(callback: IntersectionObserverCallback) {
      observerCount++;
      observerCallback = callback;
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
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    expect(observedElements).toHaveLength(3);
    expect(observerCount).toBe(1);
    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(2);
    expect(renderedSkeletonCounts).toEqual([2]);

    const secondBlock = observedElements[1];
    expect(secondBlock).toBeDefined();
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
    expect(observerCount).toBe(1);
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
    readonly rootMargin = '500px 0px';
    readonly thresholds = [0];

    constructor(callback: IntersectionObserverCallback) {
      intersectionCallback = callback;
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
