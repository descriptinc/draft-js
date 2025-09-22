/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 * @format
 */

import React, {ReactInstance} from 'react';
import UserAgent from 'fbjs/lib/UserAgent';
import DraftEditorTextNode from '../DraftEditorTextNode.react';
import {createRoot, Root} from 'react-dom/client';

const BLOCK_DELIMITER_CHAR = '\n';
const TEST_A = 'Hello';
const TEST_B = ' World!';

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  jest.resetModules();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  document.body.removeChild(container);
});

const renderIntoContainer = (element: any): HTMLElement => {
  root.render(element);
  return container.firstChild as HTMLElement;
};

const isBrowserImpl = UserAgent.isBrowser;
afterAll(() => {
  UserAgent.isBrowser = isBrowserImpl;
});

// FIXME [correctness]: this mock isn't properly setting the var in the text block component
const initializeAsIE = () => {
  /* $FlowFixMe(>=0.99.0 site=www) This comment suppresses an error found when
   * Flow v0.47 was deployed. To see the error delete this comment and run
   * Flow. */
  UserAgent.isBrowser = jest.fn().mockImplementation(() => true);
};

const initializeAsNonIE = () => {
  /* $FlowFixMe(>=0.99.0 site=www) This comment suppresses an error found when
   * Flow v0.47 was deployed. To see the error delete this comment and run
   * Flow. */
  UserAgent.isBrowser = jest.fn().mockImplementation(() => false);
};

const expectPopulatedSpan = (stub: ReactInstance | HTMLElement, testString: string) => {
  const node = stub instanceof HTMLElement ? stub : container.firstChild as HTMLElement;
  expect(node.tagName).toBe('SPAN');
  expect(node.childNodes.length).toBe(1);
  expect(node.firstChild && node.firstChild.textContent).toBe(testString);
};

test('must initialize correctly with an empty string, non-IE', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{''}</DraftEditorTextNode>,
  );
  expect(stub.tagName).toBe('BR');
});

// FIXME [correctness]: IE mock is broken
test.skip('must initialize correctly with an empty string, IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{''}</DraftEditorTextNode>,
  );
  expectPopulatedSpan(stub, BLOCK_DELIMITER_CHAR);
});

test('must initialize correctly with a string, non-IE', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );
  expectPopulatedSpan(stub, TEST_A);
});

test('must initialize correctly with a string, IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );
  expectPopulatedSpan(stub, TEST_A);
});

test('must update from empty to non-empty, non-IE', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{''}</DraftEditorTextNode>,
  );

  renderIntoContainer(<DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>);
  expectPopulatedSpan(stub, TEST_A);
});

test('must update from empty to non-empty, IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{''}</DraftEditorTextNode>,
  );

  renderIntoContainer(<DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>);
  expectPopulatedSpan(stub, TEST_A);
});

test('must update from non-empty to non-empty, non-IE', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  renderIntoContainer(
    <DraftEditorTextNode>{TEST_A + TEST_B}</DraftEditorTextNode>,
  );

  expectPopulatedSpan(stub, TEST_A + TEST_B);

  renderIntoContainer(<DraftEditorTextNode>{TEST_B}</DraftEditorTextNode>);
  expectPopulatedSpan(stub, TEST_B);
});

test('must update from non-empty to non-empty, non-IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  renderIntoContainer(
    <DraftEditorTextNode>{TEST_A + TEST_B}</DraftEditorTextNode>,
  );
  expectPopulatedSpan(stub, TEST_A + TEST_B);

  renderIntoContainer(<DraftEditorTextNode>{TEST_B}</DraftEditorTextNode>);
  expectPopulatedSpan(stub, TEST_B);
});

test('must skip updates if text already matches DOM, non-IE', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  const initialText = stub.textContent;

  renderIntoContainer(<DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>);

  expect(stub.textContent).toBe(initialText);

  // Sanity check that updating is performed when appropriate.
  renderIntoContainer(<DraftEditorTextNode>{TEST_B}</DraftEditorTextNode>);

  expect(stub.textContent).toBe(TEST_B);
});

test('must skip updates if text already matches DOM, IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  const initialText = stub.textContent;

  renderIntoContainer(<DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>);

  expect(stub.textContent).toBe(initialText);

  // Sanity check that updating is performed when appropriate.
  renderIntoContainer(<DraftEditorTextNode>{TEST_B}</DraftEditorTextNode>);

  expect(stub.textContent).toBe(TEST_B);
});

test('must update from non-empty to empty, non-IE', function() {
  initializeAsNonIE();
  renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  renderIntoContainer(<DraftEditorTextNode>{''}</DraftEditorTextNode>);

  const updatedNode = container.firstChild as Element;
  expect(updatedNode.tagName).toBe('BR');
});

// FIXME [correctness]: IE mock is broken
test.skip('must update from non-empty to empty, IE', function() {
  initializeAsIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  renderIntoContainer(<DraftEditorTextNode>{''}</DraftEditorTextNode>);

  expectPopulatedSpan(stub, BLOCK_DELIMITER_CHAR);
});

test('must render properly into a parent DOM node', function() {
  initializeAsNonIE();
  renderIntoContainer(
    <div>
      <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>
    </div>,
  );
});

test('must force unchanged text back into the DOM', function() {
  initializeAsNonIE();
  const stub = renderIntoContainer(
    <DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>,
  );

  stub.textContent = TEST_B;

  renderIntoContainer(<DraftEditorTextNode>{TEST_A}</DraftEditorTextNode>);

  const updatedNode = container.firstChild as HTMLElement;
  expect(updatedNode.textContent).toBe(TEST_A);
});
