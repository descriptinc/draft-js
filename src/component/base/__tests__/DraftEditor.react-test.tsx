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
import {createEmpty, EditorState} from '../../../model/immutable/EditorState';
import DraftEditor from '../DraftEditor.react';
import {createRoot, Root} from 'react-dom/client';
import {flushSync} from 'react-dom';

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
