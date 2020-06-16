/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+draft_js
 */

import {BidiDirection} from 'fbjs/lib/UnicodeBidiDirection';
import {DraftBlockRenderMap} from '../../model/immutable/DraftBlockRenderMap';
import {BlockNodeRecord} from '../../model/immutable/BlockNodeRecord';
import {DraftInlineStyle} from '../../model/immutable/DraftInlineStyle';
import {EditorState, getBlockTree} from '../../model/immutable/EditorState';
import React, {ReactNode} from 'react';
import cx from 'fbjs/lib/cx';
import joinClasses from 'fbjs/lib/joinClasses';
import {nullthrows} from '../../fbjs/nullthrows';
import DraftOffsetKey from '../selection/DraftOffsetKey';
import DraftEditorBlock from './DraftEditorBlock.react';

type Props = {
  blockRenderMap: DraftBlockRenderMap;
  blockRendererFn: (block: BlockNodeRecord) => Record<string, any> | null;
  blockStyleFn?: (block: BlockNodeRecord) => string;
  customStyleFn?: (
    style: DraftInlineStyle,
    block: BlockNodeRecord,
  ) => Record<string, any> | null;
  customStyleMap?: Record<string, any>;
  editorKey?: string;
  editorState: EditorState;
  preventScroll?: boolean;
  textDirectionality?: BidiDirection;
  scrollUpThreshold?: number;
  scrollUpHeight?: number;
  scrollDownThreshold?: number;
  scrollDownHeight?: number;
};

/**
 * Provide default styling for list items. This way, lists will be styled with
 * proper counters and indentation even if the caller does not specify
 * their own styling at all. If more than five levels of nesting are needed,
 * the necessary CSS classes can be provided via `blockStyleFn` configuration.
 */
const getListItemClasses = (
  type: string,
  depth: number,
  shouldResetCount: boolean,
  direction: BidiDirection,
): string => {
  return cx({
    'public/DraftStyleDefault/unorderedListItem':
      type === 'unordered-list-item',
    'public/DraftStyleDefault/orderedListItem': type === 'ordered-list-item',
    'public/DraftStyleDefault/reset': shouldResetCount,
    'public/DraftStyleDefault/depth0': depth === 0,
    'public/DraftStyleDefault/depth1': depth === 1,
    'public/DraftStyleDefault/depth2': depth === 2,
    'public/DraftStyleDefault/depth3': depth === 3,
    'public/DraftStyleDefault/depth4': depth >= 4,
    'public/DraftStyleDefault/listLTR': direction === 'LTR',
    'public/DraftStyleDefault/listRTL': direction === 'RTL',
  });
};

/**
 * `DraftEditorContents` is the container component for all block components
 * rendered for a `DraftEditor`. It is optimized to aggressively avoid
 * re-rendering blocks whenever possible.
 *
 * This component is separate from `DraftEditor` because certain props
 * (for instance, ARIA props) must be allowed to update without affecting
 * the contents of the editor.
 */
export default class DraftEditorContents extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props): boolean {
    const prevEditorState = this.props.editorState;
    const nextEditorState = nextProps.editorState;

    const prevDirectionMap = prevEditorState.directionMap;
    const nextDirectionMap = nextEditorState.directionMap;

    // Text direction has changed for one or more blocks. We must re-render.
    if (prevDirectionMap !== nextDirectionMap) {
      return true;
    }

    const didHaveFocus = prevEditorState.selection.hasFocus;
    const nowHasFocus = nextEditorState.selection.hasFocus;

    if (didHaveFocus !== nowHasFocus) {
      return true;
    }

    const nextNativeContent = nextEditorState.nativelyRenderedContent;

    const wasComposing = prevEditorState.inCompositionMode;
    const nowComposing = nextEditorState.inCompositionMode;

    // If the state is unchanged or we're currently rendering a natively
    // rendered state, there's nothing new to be done.
    if (
      prevEditorState === nextEditorState ||
      (nextNativeContent !== null &&
        nextEditorState.currentContent === nextNativeContent) ||
      (wasComposing && nowComposing)
    ) {
      return false;
    }

    const prevContent = prevEditorState.currentContent;
    const nextContent = nextEditorState.currentContent;
    const prevDecorator = prevEditorState.decorator;
    const nextDecorator = nextEditorState.decorator;
    return (
      wasComposing !== nowComposing ||
      prevContent !== nextContent ||
      prevDecorator !== nextDecorator ||
      nextEditorState.forceSelection
    );
  }

  render(): React.ReactNode {
    const {
      blockRenderMap,
      blockRendererFn,
      blockStyleFn,
      customStyleMap,
      customStyleFn,
      editorState,
      editorKey,
      preventScroll,
      textDirectionality,
      scrollUpThreshold,
      scrollUpHeight,
      scrollDownThreshold,
      scrollDownHeight,
    } = this.props;

    const content = editorState.currentContent;
    const selection = editorState.selection;
    const forceSelection = editorState.forceSelection;
    const decorator = editorState.decorator;
    const directionMap = nullthrows(editorState.directionMap);

    const processedBlocks: {
      block: ReactNode;
      wrapperTemplate: (() => ReactNode) | ReactNode | undefined;
      key: string;
      offsetKey: string;
    }[] = [];

    let currentDepth: number | null = null;
    let lastWrapperTemplate:
      | (() => ReactNode)
      | ReactNode
      | undefined = undefined;

    for (const block of content.blockMap.values()) {
      const key = block.key;
      const blockType = block.type;

      const customRenderer = blockRendererFn(block);
      let CustomComponent, customProps, customEditable;
      if (customRenderer) {
        CustomComponent = customRenderer.component;
        customProps = customRenderer.props;
        customEditable = customRenderer.editable;
      }

      const direction = textDirectionality
        ? textDirectionality
        : directionMap.get(key);
      const offsetKey = DraftOffsetKey.encode(key, 0, 0);
      const componentProps = {
        contentState: content,
        block,
        blockProps: customProps,
        blockStyleFn,
        customStyleMap,
        customStyleFn,
        decorator,
        direction,
        forceSelection,
        offsetKey,
        preventScroll,
        selection,
        tree: getBlockTree(editorState, key),
        scrollUpThreshold,
        scrollUpHeight,
        scrollDownThreshold,
        scrollDownHeight,
      };

      const configForType =
        blockRenderMap[blockType] || blockRenderMap['unstyled'];
      const wrapperTemplate: (() => ReactNode) | ReactNode | undefined =
        configForType.wrapper;

      const Element =
        configForType.element || blockRenderMap['unstyled'].element;

      const depth = block.depth;
      let className = '';
      if (blockStyleFn) {
        className = blockStyleFn(block);
      }

      // List items are special snowflakes, since we handle nesting and
      // counters manually.
      if (Element === 'li') {
        const shouldResetCount =
          lastWrapperTemplate !== wrapperTemplate ||
          currentDepth === null ||
          depth > currentDepth;
        className = joinClasses(
          className,
          getListItemClasses(blockType, depth, shouldResetCount, direction),
        );
      }

      const Component = CustomComponent || DraftEditorBlock;
      let childProps: Record<string, any> = {
        className,
        'data-block': true,
        'data-editor': editorKey,
        'data-offset-key': offsetKey,
        id: `block-${key}`,
        key,
      };
      if (customEditable !== undefined) {
        childProps = {
          ...childProps,
          contentEditable: customEditable,
          suppressContentEditableWarning: true,
        };
      }

      const child = React.createElement(
        Element,
        childProps,
        /* $FlowFixMe(>=0.112.0 site=www,mobile) This comment suppresses an
         * error found when Flow v0.112 was deployed. To see the error delete
         * this comment and run Flow. */
        <Component {...componentProps} key={key} />,
      );

      processedBlocks.push({
        block: child,
        wrapperTemplate,
        key,
        offsetKey,
      });

      if (wrapperTemplate) {
        currentDepth = block.depth;
      } else {
        currentDepth = null;
      }
      lastWrapperTemplate = wrapperTemplate;
    }

    // Group contiguous runs of blocks that have the same wrapperTemplate
    const outputBlocks: ReactNode[] = [];
    for (let ii = 0; ii < processedBlocks.length; ) {
      const info: any = processedBlocks[ii];
      if (info.wrapperTemplate) {
        const blocks: ReactNode[] = [];
        do {
          blocks.push(processedBlocks[ii].block);
          ii++;
        } while (
          ii < processedBlocks.length &&
          processedBlocks[ii].wrapperTemplate === info.wrapperTemplate
        );
        const wrapperElement = React.cloneElement(
          info.wrapperTemplate,
          {
            key: info.key + '-wrap',
            'data-offset-key': info.offsetKey,
          },
          blocks,
        );
        outputBlocks.push(wrapperElement);
      } else {
        outputBlocks.push(info.block);
        ii++;
      }
    }

    return <div data-contents="true">{outputBlocks}</div>;
  }
}
