/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

import cx from 'fbjs/lib/cx';
import {DefaultDraftBlockRenderMap} from '../../immutable/DefaultDraftBlockRenderMap';
import getSafeBodyFromHTML from '../../paste/__mocks__/getSafeBodyFromHTML';
import NonASCIIStringSnapshotSerializer from '../../../NonASCIIStringSnapshotSerializer';
import convertFromHTMLToContentBlocks from '../convertFromHTMLToContentBlocks';
import {blockToJson} from '../../../util/blockMapToJson';
import GKX from '../../../stubs/gkx';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
expect.addSnapshotSerializer(NonASCIIStringSnapshotSerializer);

const origGkx = GKX.gkx;
beforeAll(() => {
  GKX.gkx = (name: string) => {
    if (name === 'draftjs_fix_paste_for_img') {
      return true;
    }
    return false;
  };
});
afterAll(() => {
  GKX.gkx = origGkx;
});

const DEFAULT_CONFIG = {
  DOMBuilder: getSafeBodyFromHTML,
  blockRenderMap: DefaultDraftBlockRenderMap,
};

const IMAGE_DATA_URL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///' +
  'yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const SUPPORTED_TAGS = [
  'blockquote',
  'div',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'li',
  'p',
  'pre',
];

beforeEach(() => {
  jest.resetModules();
});

const convertFromHTML = (html_string: string, config?: any) => {
  /* $FlowFixMe(>=0.122.0 site=www) This comment suppresses an error found when
   * Flow v0.122.0 was deployed. To see the error, delete this comment and run
   * Flow. */
  const options = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const {DOMBuilder, blockRenderMap} = options;

  jest.resetModules();
  return convertFromHTMLToContentBlocks(
    html_string,
    DOMBuilder,
    blockRenderMap,
  );
};

const assertConvertFromHTMLToContentBlocks = (
  html_string: string,
  config = {},
) => {
  expect(
    (convertFromHTML(html_string, config)?.contentBlocks || []).map(
      blockToJson,
    ),
  ).toMatchSnapshot();
};

const testConvertingAdjacentHtmlElementsToContentBlocks = (tag: string) => {
  test(`must not merge tags when converting adjacent <${tag} />`, () => {
    const html_string = `
      <${tag}>a</${tag}>
      <${tag}>b</${tag}>
    `;

    assertConvertFromHTMLToContentBlocks(html_string);
  });
};

SUPPORTED_TAGS.forEach(tag =>
  testConvertingAdjacentHtmlElementsToContentBlocks(tag),
);

test('img with http protocol should have camera emoji content', () => {
  const blocks = convertFromHTMLToContentBlocks(
    '<img src="http://www.facebook.com">',
  );
  expect(blocks?.contentBlocks?.[0].text).toMatchSnapshot();
  const entityMap = blocks?.entityMap;
  expect(entityMap).not.toBe(null);
  if (entityMap != null) {
    expect(
      entityMap.__get(entityMap.__getLastCreatedEntityKey()).mutability,
    ).toBe('IMMUTABLE');
  }
});

test('img with https protocol should have camera emoji content', () => {
  const blocks = convertFromHTMLToContentBlocks(
    '<img src="https://www.facebook.com">',
  );
  expect(blocks?.contentBlocks?.[0].text).toMatchSnapshot();
  const entityMap = blocks?.entityMap;
  expect(entityMap).not.toBe(null);
  if (entityMap != null) {
    expect(
      entityMap.__get(entityMap.__getLastCreatedEntityKey()).mutability,
    ).toBe('IMMUTABLE');
  }
});

test('img with data protocol should be correctly parsed', () => {
  const blocks = convertFromHTMLToContentBlocks(
    `<img src="${IMAGE_DATA_URL}">`,
  );
  expect(blocks?.contentBlocks?.[0].text).toMatchSnapshot();
});

test('img with role presentation should not be rendered', () => {
  assertConvertFromHTMLToContentBlocks(
    `<img src="${IMAGE_DATA_URL}" role="presentation">`,
  );
});

test('line break should be correctly parsed - single <br>', () => {
  assertConvertFromHTMLToContentBlocks(
    `<div>
      <b>Hello World!</b>
      <br />
      lorem ipsum
    </div>`,
  );
});

test('line break should be correctly parsed - multiple <br> in a content block', () => {
  assertConvertFromHTMLToContentBlocks(
    `<div>
      <b>Hello World!</b>
      <br />
      <br />
      lorem ipsum
    </div>`,
  );
});

test('highlighted text should be recognized and considered styled characters', () => {
  const blocks = convertFromHTMLToContentBlocks(`<mark>test</mark>`);
  expect(blocks?.contentBlocks).toMatchSnapshot();
});

test('does not convert deeply nested html blocks', () => {
  const html_string = `
    <ol>
      <li>Some quote</li>
      <li>
        <blockquote>
          <h1>Hello World!</h1>
          <p>lorem ipsum</p>
        </blockquote>
      </li>
    </ol>
  `;

  assertConvertFromHTMLToContentBlocks(html_string);
});

test('eliminates useless blocks', () => {
  const html_string = `
    <div>
      <div>
        <div>Hello</div>
      </div>
      <div>World</div>
    </div>
  `;

  assertConvertFromHTMLToContentBlocks(html_string);
});

SUPPORTED_TAGS.forEach(tag =>
  testConvertingAdjacentHtmlElementsToContentBlocks(tag),
);

test('Should not create empty container blocks around ul and their list items', () => {
  const html_string = `
    <ul>
      <li>something</li>
    </ul>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test.skip('Should not create empty container blocks around ul and their list items when nesting enabled', () => {
  const html_string = `
    <ul>
      <li>something</li>
    </ul>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should not create empty container blocks around ol and their list items', () => {
  const html_string = `
    <ol>
      <li>something</li>
    </ol>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

// Regression test for issue https://github.com/facebook/draft-js/issues/1822
test('Should convert heading block after converting new line string', () => {
  // Convert an HTML string containing a newline
  // This was previously altering the module's internal state
  convertFromHTML('a\n');
  // Convert again, and assert this is not affected by the previous conversion
  const contentBlocks = convertFromHTML('<h1>heading</h1>')?.contentBlocks;
  expect(contentBlocks?.length).toBe(1);
  const contentBlock = contentBlocks?.[0];
  // #FIXME: Flow does not yet support method or property calls in optional chains.
  if (contentBlock != null) {
    expect(contentBlock.type).toBe('header-one');
    expect(contentBlock.text).toBe('heading');
  }
});

test('Should preserve entities for whitespace-only content', () => {
  const html_string = `
    <a href="http://www.facebook.com">
      <b>before</b> <b>after</b>
    </a>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should import recognised draft li depths when nesting disabled', () => {
  const html_string = `
    <ul>
      <li class="${cx('public/DraftStyleDefault/depth0')}">depth0</li>
      <li class="${cx('public/DraftStyleDefault/depth1')}">depth1</li>
      <li class="${cx('public/DraftStyleDefault/depth2')}">depth2</li>
      <li class="${cx('public/DraftStyleDefault/depth3')}">depth3</li>
      <li class="${cx('public/DraftStyleDefault/depth4')}">depth4</li>
    </ul>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should properly handle nested attribute styles', () => {
  const html_string = [
    '<span style="font-weight: bold">',
    '<span>bold</span>',
    '<span style="font-weight: normal">not bold</span>',
    '<span>bold again</span>',
    '</span>',
  ].join('');

  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should recognized list deep nesting', () => {
  const html_string = `
    <ul>
      <li>depth0-0</li>
      <li>depth0-1</li>
      <ul>
        <li>depth1-0</li>
      </ul>
      <ol>
        <li>depth1-1</li>
        <ul>
          <li>depth2-0</li>
          <li>depth2-1</li>
        </ul>
      </ol>
      <li>depth0-2</li>
    </ul>
    <ol>
      <li>depth0-3</li>
    </ol>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should recognized and override html structure when having known draft-js classname with nesting disabled', () => {
  const html_string = `
    <ul>
      <li class="${cx('public/DraftStyleDefault/depth0')}">depth0</li>
      <ul>
        <li class="${cx('public/DraftStyleDefault/depth1')}">depth1</li>
        <li class="${cx('public/DraftStyleDefault/depth2')}">depth2</li>
      </ul>
      <li class="${cx('public/DraftStyleDefault/depth3')}">depth3</li>
    </ul>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should import line breaks without creating a leading space', () => {
  const html_string = `
    Line 1<br/>
    Line 2<br/>
    Line 3
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should import two blockquotes without extra line breaks', () => {
  const html_string = `
    <blockquote>
      <div>
        <span>First</span>
      </div>
    </blockquote>
    <blockquote>
      <div>
        <span>Second</span>
      </div>
    </blockquote>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should recognize preformatted blocks', () => {
  const html_string = `
    <meta charset='utf-8'><span style="font-family: system-ui, -apple-system, system-ui, &quot;.SFNSText-Regular&quot;, sans-serif; font-variant-ligatures: normal; white-space: pre-wrap; display: inline !important;">following some pre </span><span style="font-family: Menlo, Consolas, Monaco, monospace; white-space: pre-line;">some_code_stuff</span>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});

test('Should recognize preformatted blocks mixed other styles', () => {
  const html_string = `
    <meta charset='utf-8'><span style="font-family: system-ui, -apple-system, system-ui, &quot;.SFNSText-Regular&quot;, sans-serif; font-size: 14px; font-weight: 400; white-space: pre-wrap; display: inline !important;">example </span><span style="font-weight: 600; font-family: Menlo, Consolas, Monaco, monospace; white-space: pre-line;">bold</span><span style="font-family: Menlo, Consolas, Monaco, monospace; white-space: pre-line; font-weight: 400;"> and code</span>
  `;
  assertConvertFromHTMLToContentBlocks(html_string);
});
