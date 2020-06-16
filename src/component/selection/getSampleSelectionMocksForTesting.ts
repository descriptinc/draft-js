/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */
import {
  EMPTY_CHARACTER,
  makeCharacterMetadata,
} from '../../model/immutable/CharacterMetadata';
import {BOLD} from '../../model/immutable/SampleDraftInlineStyle';
import {repeat} from '../../model/descript/Iterables';
import {makeContentBlock} from '../../model/immutable/ContentBlock';
import {createFromBlockArray} from '../../model/immutable/ContentState';
import {createWithContent} from '../../model/immutable/EditorState';

export default function getSampleSelectionMocksForTesting(): Record<
  string,
  any
> {
  const root = document.createElement('div');
  const contents = document.createElement('div');

  contents.setAttribute('data-contents', 'true');
  root.appendChild(contents);

  const text = [
    'Washington',
    'Jefferson',
    'Lincoln',
    'Roosevelt',
    'Kennedy',
    'Obama',
  ];

  const textA = text[0] + text[1];
  const textB = text[2] + text[3];
  const textC = text[4] + text[5];

  const boldChar = makeCharacterMetadata({
    style: BOLD,
  });

  const aChars = [
    ...repeat(text[0].length, EMPTY_CHARACTER),
    ...repeat(text[1].length, boldChar),
  ];

  const bChars = [
    ...repeat(text[2].length, EMPTY_CHARACTER),
    ...repeat(text[3].length, boldChar),
  ];

  const cChars = [
    ...repeat(text[4].length, EMPTY_CHARACTER),
    ...repeat(text[5].length, boldChar),
  ];

  const contentBlocks = [
    makeContentBlock({
      key: 'a',
      type: 'unstyled',
      text: textA,
      characterList: aChars,
    }),
    makeContentBlock({
      key: 'b',
      type: 'unstyled',
      text: textB,
      characterList: bChars,
    }),
    makeContentBlock({
      key: 'c',
      type: 'unstyled',
      text: textC,
      characterList: cChars,
    }),
  ];

  const contentState = createFromBlockArray(contentBlocks);
  const editorState = createWithContent(contentState);

  const textNodes = text.map(text => {
    return document.createTextNode(text);
  });

  const leafChildren = textNodes.map(textNode => {
    const span = document.createElement('span');
    span.appendChild(textNode);
    return span;
  });

  const leafs = ['a-0-0', 'a-0-1', 'b-0-0', 'b-0-1', 'c-0-0', 'c-0-1'].map(
    (blockKey, index) => {
      const span = document.createElement('span');
      span.setAttribute('data-offset-key', '' + blockKey);
      span.appendChild(leafChildren[index]);
      return span;
    },
  );

  const decorators = ['a-0-0', 'b-0-0', 'c-0-0'].map((decoratorKey, index) => {
    const span = document.createElement('span');
    span.setAttribute('data-offset-key', '' + decoratorKey);
    span.appendChild(leafs[index * 2]);
    span.appendChild(leafs[index * 2 + 1]);
    return span;
  });

  const blocks = ['a-0-0', 'b-0-0', 'c-0-0'].map((blockKey, index) => {
    const outerBlockElement = document.createElement('div');
    const innerBlockElement = document.createElement('div');

    innerBlockElement.setAttribute('data-offset-key', '' + blockKey);
    innerBlockElement.appendChild(decorators[index]);

    outerBlockElement.setAttribute('data-offset-key', '' + blockKey);
    outerBlockElement.setAttribute('data-block', 'true');
    outerBlockElement.appendChild(innerBlockElement);

    return outerBlockElement;
  });

  blocks.forEach(blockElem => {
    contents.appendChild(blockElem);
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

