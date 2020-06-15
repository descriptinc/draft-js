/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 * @emails oncall+draft_js
 */

import React from 'react';
import {BidiDirection} from 'fbjs/lib/UnicodeBidiDirection';
import Scroll from 'fbjs/lib/Scroll';
import cx from 'fbjs/lib/cx';
import Style from 'fbjs/lib/Style';
import UnicodeBidi from 'fbjs/lib/UnicodeBidi';
import UnicodeBidiDirection from 'fbjs/lib/UnicodeBidiDirection';
import getScrollPosition from 'fbjs/lib/getScrollPosition';
import getElementPosition from 'fbjs/lib/getElementPosition';
import getViewportDimensions from 'fbjs/lib/getViewportDimensions';
import {BlockNodeRecord} from '../../model/immutable/BlockNodeRecord';
import {ContentState} from '../../model/immutable/ContentState';
import {DraftInlineStyle} from '../../model/immutable/DraftInlineStyle';
import {DraftDecoratorType} from '../../model/decorators/DraftDecoratorType';
import {getEndKey, SelectionState} from '../../model/immutable/SelectionState';
import invariant from '../../fbjs/invariant';
import isHTMLElement from '../utils/isHTMLElement';
import {DecoratorRange} from '../../model/immutable/BlockTree';
import DraftOffsetKey from '../selection/DraftOffsetKey';
import DraftEditorLeaf from './DraftEditorLeaf.react';
import {nullthrows} from '../../fbjs/nullthrows';
import {
  getEntityAt,
  getInlineStyleAt,
} from '../../model/immutable/ContentBlockNode';
import {DraftDecoratorComponentProps} from '../../model/decorators/DraftDecorator';

const SCROLL_BUFFER = 10;

type Props = {
  block: BlockNodeRecord;
  blockProps?: Record<string, any>;
  blockStyleFn: (block: BlockNodeRecord) => string;
  contentState: ContentState;
  customStyleFn: (
    style: DraftInlineStyle,
    block: BlockNodeRecord,
  ) => Record<string, any> | null;
  customStyleMap: Record<string, any>;
  decorator: DraftDecoratorType | null;
  direction: BidiDirection;
  forceSelection: boolean;
  offsetKey: string;
  preventScroll?: boolean;
  selection: SelectionState;
  startIndent?: boolean;
  tree: readonly DecoratorRange[];
};

/**
 * Return whether a block overlaps with either edge of the `SelectionState`.
 */
const isBlockOnSelectionEdge = (
  selection: SelectionState,
  key: string,
): boolean => {
  return selection.anchorKey === key || selection.focusKey === key;
};

/**
 * The default block renderer for a `DraftEditor` component.
 *
 * A `DraftEditorBlock` is able to render a given `ContentBlock` to its
 * appropriate decorator and inline style components.
 */
export default class DraftEditorBlock extends React.Component<Props> {
  _node: HTMLDivElement | null = null;

  shouldComponentUpdate(nextProps: Props): boolean {
    return (
      this.props.block !== nextProps.block ||
      this.props.tree !== nextProps.tree ||
      this.props.direction !== nextProps.direction ||
      (isBlockOnSelectionEdge(nextProps.selection, nextProps.block.key) &&
        nextProps.forceSelection)
    );
  }

  /**
   * When a block is mounted and overlaps the selection state, we need to make
   * sure that the cursor is visible to match native behavior. This may not
   * be the case if the user has pressed `RETURN` or pasted some content, since
   * programmatically creating these new blocks and setting the DOM selection
   * will miss out on the browser natively scrolling to that position.
   *
   * To replicate native behavior, if the block overlaps the selection state
   * on mount, force the scroll position. Check the scroll state of the scroll
   * parent, and adjust it to align the entire block to the bottom of the
   * scroll parent.
   */
  componentDidMount(): void {
    if (this.props.preventScroll) {
      return;
    }
    const selection = this.props.selection;
    const endKey = getEndKey(selection);
    if (!selection.hasFocus || endKey !== this.props.block.key) {
      return;
    }

    const blockNode = this._node;
    if (blockNode == null) {
      return;
    }
    const scrollParent = Style.getScrollParent(blockNode);
    const scrollPosition = getScrollPosition(scrollParent);
    let scrollDelta;

    if (scrollParent === window) {
      const nodePosition = getElementPosition(blockNode);
      const nodeBottom = nodePosition.y + nodePosition.height;
      const viewportHeight = getViewportDimensions().height;
      scrollDelta = nodeBottom - viewportHeight;
      if (scrollDelta > 0) {
        window.scrollTo(
          scrollPosition.x,
          scrollPosition.y + scrollDelta + SCROLL_BUFFER,
        );
      }
    } else {
      invariant(isHTMLElement(blockNode), 'blockNode is not an HTMLElement');
      const blockBottom = blockNode.offsetHeight + blockNode.offsetTop;
      const pOffset = scrollParent.offsetTop + scrollParent.offsetHeight;
      const scrollBottom = pOffset + scrollPosition.y;

      scrollDelta = blockBottom - scrollBottom;
      if (scrollDelta > 0) {
        Scroll.setTop(
          scrollParent,
          Scroll.getTop(scrollParent) + scrollDelta + SCROLL_BUFFER,
        );
      }
    }
  }

  _renderChildren(): Array<React.ReactNode> {
    const block = this.props.block;
    const blockKey = block.key;
    const text = block.text;
    const lastLeafSet = this.props.tree.length - 1;
    const hasSelection = isBlockOnSelectionEdge(this.props.selection, blockKey);

    return this.props.tree.map((leafSet, ii) => {
      const leavesForLeafSet = leafSet.leaves;
      // T44088704
      if (leavesForLeafSet.length === 0) {
        return null;
      }
      const lastLeaf = leavesForLeafSet.length - 1;
      const leaves = leavesForLeafSet.map((leaf, jj) => {
        const offsetKey = DraftOffsetKey.encode(blockKey, ii, jj);
        const {start, end} = leaf;
        return (
          <DraftEditorLeaf
            key={offsetKey}
            offsetKey={offsetKey}
            block={block}
            start={start}
            selection={hasSelection ? this.props.selection : null}
            forceSelection={this.props.forceSelection}
            text={text.slice(start, end)}
            styleSet={getInlineStyleAt(block, start)}
            customStyleMap={this.props.customStyleMap}
            customStyleFn={this.props.customStyleFn}
            isLast={ii === lastLeafSet && jj === lastLeaf}
          />
        );
      });

      const decoratorKey = leafSet.decoratorKey;
      if (decoratorKey == null) {
        return leaves;
      }

      if (!this.props.decorator) {
        return leaves;
      }

      const decorator = nullthrows(this.props.decorator);

      const DecoratorComponent = decorator.getComponentForKey(decoratorKey);
      if (!DecoratorComponent) {
        return leaves;
      }

      const decoratorProps = decorator.getPropsForKey(decoratorKey);
      const decoratorOffsetKey = DraftOffsetKey.encode(blockKey, ii, 0);
      const start = leavesForLeafSet[0].start;
      const end = leavesForLeafSet[leavesForLeafSet.length - 1].end;
      const decoratedText = text.slice(start, end);
      const entityKey = getEntityAt(block, leafSet.start);

      // Resetting dir to the same value on a child node makes Chrome/Firefox
      // confused on cursor movement. See http://jsfiddle.net/d157kLck/3/
      const dir = UnicodeBidiDirection.getHTMLDirIfDifferent(
        UnicodeBidi.getDirection(decoratedText),
        this.props.direction,
      );

      const commonProps: DraftDecoratorComponentProps = {
        contentState: this.props.contentState,
        decoratedText,
        dir: dir,
        start,
        end,
        blockKey,
        entityKey,
        offsetKey: decoratorOffsetKey,
      };

      return (
        <DecoratorComponent
          {...decoratorProps}
          {...commonProps}
          key={decoratorOffsetKey}>
          {leaves}
        </DecoratorComponent>
      );
    });
  }

  render(): React.ReactNode {
    const {direction, offsetKey} = this.props;
    const className = cx({
      'public/DraftStyleDefault/block': true,
      'public/DraftStyleDefault/ltr': direction === 'LTR',
      'public/DraftStyleDefault/rtl': direction === 'RTL',
    });

    return (
      <div
        data-offset-key={offsetKey}
        className={className}
        ref={ref => (this._node = ref)}>
        {this._renderChildren()}
      </div>
    );
  }
}

module.exports = DraftEditorBlock;
