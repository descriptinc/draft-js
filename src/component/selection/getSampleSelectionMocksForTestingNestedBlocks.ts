/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {makeContentBlockNode} from '../../model/immutable/ContentBlockNode';
import {createFromBlockArray} from '../../model/immutable/ContentState';
import {createWithContent} from '../../model/immutable/EditorState';

export default function getSampleSelectionMocksForTestingNestedBlocks(): Record<
  string,
  any
> {
  const root = document.createElement('div');
  const contents = document.createElement('div');

  contents.setAttribute('data-contents', 'true');
  root.appendChild(contents);

  const text = [null, 'beta', null, 'delta'] as const;
  const offsetKeys = ['a-0-0', 'b-0-0', 'c-0-0', 'd-0-0'];

  const contentBlocks = [
    makeContentBlockNode({
      key: 'a',
      nextSibling: 'c',
      children: ['b'],
    }),
    makeContentBlockNode({
      key: 'b',
      parent: 'a',
      text: text[1],
    }),
    makeContentBlockNode({
      key: 'c',
      prevSibling: 'a',
      children: ['d'],
    }),
    makeContentBlockNode({
      key: 'd',
      parent: 'c',
      text: text[3],
    }),
  ];

  const contentState = createFromBlockArray(contentBlocks);
  const editorState = createWithContent(contentState);

  const textNodes = text.map(text => {
    if (!text) {
      return null;
    }
    return document.createTextNode(text);
  });

  const leafChildren = textNodes.map(textNode => {
    if (!textNode) {
      return null;
    }
    const span = document.createElement('span');
    span.appendChild(textNode);
    return span;
  });

  const leafs = leafChildren.map((leafChild, index) => {
    if (!leafChild) {
      return null;
    }
    const blockKey = offsetKeys[index];
    const span = document.createElement('span');
    span.setAttribute('data-offset-key', blockKey);
    span.appendChild(leafChild);
    return span;
  });

  const decorators = leafs.map((leaf, index) => {
    if (!leaf) {
      return null;
    }
    const blockKey = offsetKeys[index];
    const span = document.createElement('span');
    span.setAttribute('data-offset-key', blockKey);
    span.appendChild(leaf);
    return span;
  });

  const blocks = offsetKeys.map((blockKey, index) => {
    const outerBlockElement = document.createElement('div');
    const innerBlockElement = document.createElement('div');

    innerBlockElement.setAttribute('data-offset-key', blockKey);
    outerBlockElement.setAttribute('data-offset-key', blockKey);
    outerBlockElement.setAttribute('data-block', 'true');

    const decorator = decorators[index];

    // only leaf nodes can have text
    if (decorator) {
      innerBlockElement.appendChild(decorator);
    }

    outerBlockElement.appendChild(innerBlockElement);

    return outerBlockElement;
  });

  const blockCacheRef: Record<string, HTMLDivElement> = {};
  blocks.forEach((blockElem, index) => {
    const currentBlock = contentBlocks[index];
    const parentKey = currentBlock.parent;

    // add this block reference to the cache lookup ref
    blockCacheRef[currentBlock.key] = blockElem;

    // root nodes get appended directly to the contents block
    if (!parentKey) {
      contents.appendChild(blockElem);
      return;
    }

    // append to to the innerBlockElement of the parent block
    blockCacheRef[parentKey].firstChild!.appendChild(blockElem);
  });

  return {
    editorState,
    root,
    contents,
    blocks,
    decorators,
    leafs,
    leafChildren,
    textNodes,
  };
}

module.exports = getSampleSelectionMocksForTestingNestedBlocks;
