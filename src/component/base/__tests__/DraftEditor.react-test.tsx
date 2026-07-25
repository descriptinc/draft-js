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
  const observedElements: Element[] = [];

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '1200px 0px';
    readonly thresholds = [0];

    constructor(callback: IntersectionObserverCallback) {
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
            scrollContainerRef: {current: container},
          }}
        />,
      );
    });

    expect(observedElements).toHaveLength(3);
    expect(container.querySelectorAll('[data-block-skeleton]')).toHaveLength(2);

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
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  }
});

test('renders newly introduced block keys as skeletons immediately', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = container;
    readonly rootMargin = '1200px 0px';
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
  } finally {
    globalThis.IntersectionObserver = originalIntersectionObserver;
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
