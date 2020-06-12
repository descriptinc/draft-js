/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+draft_js
 */

'use strict';

import React from 'react';
import cx from 'cx';
import {CoreDraftBlockType} from '../constants/DraftBlockType';
import {DraftBlockRenderConfig} from './DraftBlockRenderConfig';

type DefaultCoreDraftBlockRenderMap = Record<
  CoreDraftBlockType,
  DraftBlockRenderConfig
>;

const UL_WRAP = <ul className={cx('public/DraftStyleDefault/ul')} />;
const OL_WRAP = <ol className={cx('public/DraftStyleDefault/ol')} />;
const PRE_WRAP = <pre className={cx('public/DraftStyleDefault/pre')} />;

export const DefaultDraftBlockRenderMap: DefaultCoreDraftBlockRenderMap = {
  'header-one': {
    element: 'h1',
  },
  'header-two': {
    element: 'h2',
  },
  'header-three': {
    element: 'h3',
  },
  'header-four': {
    element: 'h4',
  },
  'header-five': {
    element: 'h5',
  },
  'header-six': {
    element: 'h6',
  },
  section: {
    element: 'section',
  },
  article: {
    element: 'article',
  },
  'unordered-list-item': {
    element: 'li',
    wrapper: UL_WRAP,
  },
  'ordered-list-item': {
    element: 'li',
    wrapper: OL_WRAP,
  },
  blockquote: {
    element: 'blockquote',
  },
  atomic: {
    element: 'figure',
  },
  'code-block': {
    element: 'pre',
    wrapper: PRE_WRAP,
  },
  unstyled: {
    element: 'div',
    aliasedElements: ['p'],
  },
};
