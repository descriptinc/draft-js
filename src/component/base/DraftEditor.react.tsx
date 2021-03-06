/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @preventMunge
 * @emails oncall+draft_js
 */

import React, {Component, CSSProperties, DragEventHandler} from 'react';
import Scroll from 'fbjs/lib/Scroll';
import Style from 'fbjs/lib/Style';
import getScrollPosition from 'fbjs/lib/getScrollPosition';
import UserAgent from 'fbjs/lib/UserAgent';
import cx from 'fbjs/lib/cx';
import {EditorState, forceSelection} from '../../model/immutable/EditorState';
import {BlockMap} from '../../model/immutable/BlockMap';
import {DraftScrollPosition} from './DraftScrollPosition';
import invariant from '../../fbjs/invariant';
import isHTMLElement from '../utils/isHTMLElement';
import DraftEffects from '../../stubs/DraftEffects';
import GKX from '../../stubs/gkx';
import DraftEditorEditHandler from '../handlers/edit/DraftEditorEditHandler';
import DraftEditorCompositionHandler from '../handlers/composition/DraftEditorCompositionHandler';
import DraftEditorDragHandler from '../handlers/drag/DraftEditorDragHandler';
import {DraftEditorDefaultProps, DraftEditorProps} from './DraftEditorProps';
import {DefaultDraftBlockRenderMap} from '../../model/immutable/DefaultDraftBlockRenderMap';
import getDefaultKeyBinding from '../utils/getDefaultKeyBinding';
import {DraftEditorModes} from '../handlers/DraftEditorModes';
import generateRandomKey from '../../model/keys/generateRandomKey';
import {hasText} from '../../model/immutable/ContentState';
import {nullthrows} from '../../fbjs/nullthrows';
import DraftEditorPlaceholder from './DraftEditorPlaceholder.react';
import {DefaultDraftInlineStyle} from '../../model/immutable/DefaultDraftInlineStyle';
import DraftEditorContents from '../contents/DraftEditorContents-core.react';
import flushControlled from './DraftEditorFlushControlled';

const isIE = UserAgent.isBrowser('IE');

// IE does not support the `input` event on contentEditable, so we can't
// observe spellcheck behavior.
const allowSpellCheck = !isIE;

// Define a set of handler objects to correspond to each possible `mode`
// of editor behavior.
const handlerMap = {
  edit: DraftEditorEditHandler,
  composite: DraftEditorCompositionHandler,
  drag: DraftEditorDragHandler,
  cut: null,
  render: null,
};

type State = {
  contentsKey: number;
};

let didInitODS = false;

function orUndefined<T>(x: T | undefined | null): T | undefined {
  return x === null ? undefined : x;
}

class UpdateDraftEditorFlags extends Component<{
  editor: DraftEditor;
  editorState: EditorState;
}> {
  render(): React.ReactNode {
    return null;
  }
  componentDidMount(): void {
    this._update();
  }
  componentDidUpdate(): void {
    this._update();
  }
  _update() {
    const editor = this.props.editor;
    /**
     * Sometimes a render triggers a 'focus' or other event, and that will
     * schedule a second render pass.
     * In order to make sure the second render pass gets the latest editor
     * state, we update it here.
     * Example:
     * render #1
     * +
     * |
     * | cWU -> Nothing ... latestEditorState = STALE_STATE :(
     * |
     * | render -> this.props.editorState = FRESH_STATE
     * | +         *and* set latestEditorState = FRESH_STATE
     *   |
     * | |
     * | +--> triggers 'focus' event, calling 'handleFocus' with latestEditorState
     * |                                                +
     * |                                                |
     * +>cdU -> latestEditorState = FRESH_STATE         | the 'handleFocus' call schedules render #2
     *                                                  | with latestEditorState, which is FRESH_STATE
     *                                                  |
     * render #2 <--------------------------------------+
     * +
     * |
     * | cwU -> nothing updates
     * |
     * | render -> this.props.editorState = FRESH_STATE which was passed in above
     * |
     * +>cdU fires and resets latestEditorState = FRESH_STATE
     * ---
     * Note that if we don't set latestEditorState in 'render' in the above
     * diagram, then STALE_STATE gets passed to render #2.
     */
    editor._latestEditorState = this.props.editorState;

    /**
     * The reason we set this 'blockSelectEvents' flag is that  IE will fire a
     * 'selectionChange' event when we programmatically change the selection,
     * meaning it would trigger a new select event while we are in the middle
     * of updating.
     * We found that the 'selection.addRange' was what triggered the stray
     * selectionchange event in IE.
     * To be clear - we have not been able to reproduce specific bugs related
     * to this stray selection event, but have recorded logs that some
     * conditions do cause it to get bumped into during editOnSelect.
     */
    editor._blockSelectEvents = true;
    if (
      editor.props.enableIESupport === undefined ||
      editor.props.enableIESupport
    ) {
      editor._blockSelectEvents = true;
    }
  }
}

/**
 * `DraftEditor` is the root editor component. It composes a `contentEditable`
 * div, and provides a wide variety of useful function props for managing the
 * state of the editor. See `DraftEditorProps` for details.
 */
export default class DraftEditor extends React.Component<
  DraftEditorProps,
  State
> {
  static defaultProps: DraftEditorDefaultProps = {
    ariaDescribedBy: '{{editor_id_placeholder}}',
    blockRenderMap: DefaultDraftBlockRenderMap,
    blockRendererFn: function() {
      return null;
    },
    blockStyleFn: function() {
      return '';
    },
    keyBindingFn: getDefaultKeyBinding,
    readOnly: false,
    spellCheck: false,
    stripPastedStyles: false,
  };

  _blockSelectEvents: boolean;
  _clipboard: BlockMap | null;
  _handler: any | null;
  _dragEventMap = new Map<EventTarget, number>();
  _internalDrag: boolean = false;
  _editorKey: string;
  _placeholderAccessibilityID: string;
  _latestEditorState: EditorState;
  _latestCommittedEditorState: EditorState;
  _pendingStateFromBeforeInput: EditorState | undefined;

  /**
   * Define proxies that can route events to the current handler.
   */
  _onBeforeInput: any;
  _onBlur: any;
  _onCharacterData: any;
  _onCompositionEnd: any;
  _onCompositionStart: any;
  _onCopy: any;
  _onCut: any;
  _onDragEnd: any;
  _onDragOver: any;
  _onDragStart: any;
  _onDrop: any;
  _onInput: any;
  _onFocus: any;
  _onKeyDown: any;
  _onKeyPress: any;
  _onKeyUp: any;
  _onMouseDown: any;
  _onMouseUp: any;
  _onPaste: any;
  _onSelect: any;

  editor: HTMLElement | null = null;
  editorContainer: HTMLElement | null = null;
  getEditorKey: () => string;

  constructor(props: DraftEditorProps) {
    super(props);

    this._blockSelectEvents = false;
    this._clipboard = null;
    this._handler = null;
    this._editorKey = props.editorKey || generateRandomKey();
    this._placeholderAccessibilityID = 'placeholder-' + this._editorKey;
    this._latestEditorState = props.editorState;
    this._latestCommittedEditorState = props.editorState;

    this._onBeforeInput = this._buildHandler('onBeforeInput');
    this._onBlur = this._buildHandler('onBlur');
    this._onCharacterData = this._buildHandler('onCharacterData');
    this._onCompositionEnd = this._buildHandler('onCompositionEnd');
    this._onCompositionStart = this._buildHandler('onCompositionStart');
    this._onCopy = this._buildHandler('onCopy');
    this._onCut = this._buildHandler('onCut');
    this._onDragEnd = this._buildHandler('onDragEnd');
    this._onDragOver = this._buildHandler('onDragOver');
    this._onDragStart = this._buildHandler('onDragStart');
    this._onDrop = this._buildHandler('onDrop');
    this._onInput = this._buildHandler('onInput');
    this._onFocus = this._buildHandler('onFocus');
    this._onKeyDown = this._buildHandler('onKeyDown');
    this._onKeyPress = this._buildHandler('onKeyPress');
    this._onKeyUp = this._buildHandler('onKeyUp');
    this._onMouseDown = this._buildHandler('onMouseDown');
    this._onMouseUp = this._buildHandler('onMouseUp');
    this._onPaste = this._buildHandler('onPaste');
    this._onSelect = this._buildHandler('onSelect');

    this.getEditorKey = () => this._editorKey;

    if (global.__DEV__) {
      [
        'onDownArrow',
        'onEscape',
        'onLeftArrow',
        'onRightArrow',
        'onTab',
        'onUpArrow',
      ].forEach(propName => {
        if (props.hasOwnProperty(propName)) {
          // eslint-disable-next-line no-console
          console.warn(
            `Supplying an \`${propName}\` prop to \`DraftEditor\` has ` +
              'been deprecated. If your handler needs access to the keyboard ' +
              'event, supply a custom `keyBindingFn` prop that falls back to ' +
              'the default one (eg. https://is.gd/wHKQ3W).',
          );
        }
      });
    }

    // See `restoreEditorDOM()`.
    this.state = {contentsKey: 0};
  }

  /**
   * Build a method that will pass the event to the specified handler method.
   * This allows us to look up the correct handler function for the current
   * editor mode, if any has been specified.
   */
  _buildHandler(eventName: string): (e: any) => void {
    // Wrap event handlers in `flushControlled`. In sync mode, this is
    // effectively a no-op. In async mode, this ensures all updates scheduled
    // inside the handler are flushed before React yields to the browser.
    return e => {
      if (!this.props.readOnly) {
        const method = this._handler && this._handler[eventName];
        if (method) {
          if (flushControlled) {
            flushControlled(() => method(this, e));
          } else {
            method(this, e);
          }
        }
      }
    };
  }

  _handleEditorContainerRef: (arg0: HTMLElement | null) => void = (
    node: HTMLElement | null,
  ): void => {
    this.editorContainer = node;
    // Instead of having a direct ref on the child, we'll grab it here.
    // This is safe as long as the rendered structure is static (which it is).
    // This lets the child support ref={props.editorRef} without merging refs.
    this.editor = node !== null ? (node.firstChild as HTMLElement) : null;
  };

  _showPlaceholder(): boolean {
    return (
      !!this.props.placeholder &&
      !this.props.editorState.inCompositionMode &&
      !hasText(this.props.editorState.currentContent)
    );
  }

  _renderPlaceholder(): React.ReactNode {
    if (this._showPlaceholder()) {
      const placeHolderProps = {
        text: nullthrows(this.props.placeholder),
        editorState: this.props.editorState,
        textAlignment: this.props.textAlignment,
        accessibilityID: this._placeholderAccessibilityID,
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return <DraftEditorPlaceholder {...placeHolderProps} />;
    }
    return null;
  }

  /**
   * returns ariaDescribedBy prop with '{{editor_id_placeholder}}' replaced with
   * the DOM id of the placeholder (if it exists)
   * @returns aria-describedby attribute value
   */
  _renderARIADescribedBy(): string | undefined {
    const describedBy = this.props.ariaDescribedBy || '';
    const placeholderID = this._showPlaceholder()
      ? this._placeholderAccessibilityID
      : '';
    return (
      describedBy.replace('{{editor_id_placeholder}}', placeholderID) ||
      undefined
    );
  }

  render(): React.ReactNode {
    const {
      blockRenderMap,
      blockRendererFn,
      blockStyleFn,
      customStyleFn,
      customStyleMap,
      editorState,
      preventScroll,
      readOnly,
      textAlignment,
      textDirectionality,
      scrollUpThreshold,
      scrollUpHeight,
      scrollDownHeight,
      scrollDownThreshold,
    } = this.props;

    const rootClass = cx({
      'DraftEditor/root': true,
      'DraftEditor/alignLeft': textAlignment === 'left',
      'DraftEditor/alignRight': textAlignment === 'right',
      'DraftEditor/alignCenter': textAlignment === 'center',
    });

    const contentStyle: CSSProperties = {
      outline: 'none',
      // fix parent-draggable Safari bug. #1326
      userSelect: 'text',
      WebkitUserSelect: 'text',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
    };

    // The aria-expanded and aria-haspopup properties should only be rendered
    // for a combobox.
    const ariaRole = (this.props as any).role || 'textbox';
    const ariaExpanded =
      ariaRole === 'combobox' ? !!this.props.ariaExpanded : null;

    const editorContentsProps = {
      blockRenderMap,
      blockRendererFn,
      blockStyleFn,
      customStyleMap: {
        ...DefaultDraftInlineStyle,
        ...customStyleMap,
      },
      customStyleFn,
      editorKey: this._editorKey,
      editorState,
      preventScroll,
      textDirectionality,
      scrollUpThreshold,
      scrollUpHeight,
      scrollDownThreshold,
      scrollDownHeight,
    };

    return (
      <div className={rootClass}>
        {this._renderPlaceholder()}
        <div
          className={cx('DraftEditor/editorContainer')}
          ref={this._handleEditorContainerRef}>
          {/* Note: _handleEditorContainerRef assumes this div won't move: */}
          <div
            aria-activedescendant={
              readOnly
                ? undefined
                : orUndefined(this.props.ariaActiveDescendantID)
            }
            aria-autocomplete={
              readOnly
                ? undefined
                : (this.props.ariaAutoComplete as
                    | 'both'
                    | 'none'
                    | 'inline'
                    | 'list'
                    | undefined)
            }
            aria-controls={
              readOnly ? undefined : orUndefined(this.props.ariaControls)
            }
            aria-describedby={this._renderARIADescribedBy()}
            aria-expanded={readOnly ? undefined : orUndefined(ariaExpanded)}
            aria-label={this.props.ariaLabel}
            aria-labelledby={this.props.ariaLabelledBy}
            aria-multiline={this.props.ariaMultiline}
            aria-owns={readOnly ? undefined : this.props.ariaOwneeID}
            autoCapitalize={this.props.autoCapitalize}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            autoComplete={this.props.autoComplete}
            autoCorrect={this.props.autoCorrect}
            className={cx({
              // Chrome's built-in translation feature mutates the DOM in ways
              // that Draft doesn't expect (ex: adding <font> tags inside
              // DraftEditorLeaf spans) and causes problems. We add notranslate
              // here which makes its autotranslation skip over this subtree.
              notranslate: !readOnly,
              'public/DraftEditor/content': true,
            })}
            contentEditable={!readOnly}
            data-testid={this.props.webDriverTestID}
            onBeforeInput={this._onBeforeInput}
            onBlur={this._onBlur}
            onCompositionEnd={this._onCompositionEnd}
            onCompositionStart={this._onCompositionStart}
            onCopy={this._onCopy}
            onCut={this._onCut}
            onDragEnd={this._onDragEnd}
            onDragEnter={this.onDragEnter}
            onDragLeave={this.onDragLeave}
            onDragOver={this._onDragOver}
            onDragStart={this._onDragStart}
            onDrop={this._onDrop}
            onFocus={this._onFocus}
            onInput={this._onInput}
            onKeyDown={this._onKeyDown}
            onKeyPress={this._onKeyPress}
            onKeyUp={this._onKeyUp}
            onMouseUp={this._onMouseUp}
            onPaste={this._onPaste}
            onSelect={this._onSelect}
            ref={this.props.editorRef}
            role={readOnly ? null : ariaRole}
            spellCheck={allowSpellCheck && this.props.spellCheck}
            style={contentStyle}
            suppressContentEditableWarning
            tabIndex={this.props.tabIndex}>
            {/*
              Needs to come earlier in the tree as a sibling (not ancestor) of
              all DraftEditorLeaf nodes so it's first in postorder traversal.
            */}
            <UpdateDraftEditorFlags editor={this} editorState={editorState} />
            <DraftEditorContents
              {...editorContentsProps}
              key={'contents' + this.state.contentsKey}
            />
          </div>
        </div>
      </div>
    );
  }

  componentDidMount(): void {
    this._blockSelectEvents = false;
    if (!didInitODS && GKX.gkx('draft_ods_enabled')) {
      didInitODS = true;
      DraftEffects.initODS();
    }
    this.setMode('edit');

    /**
     * IE has a hardcoded "feature" that attempts to convert link text into
     * anchors in contentEditable DOM. This breaks the editor's expectations of
     * the DOM, and control is lost. Disable it to make IE behave.
     * See: http://blogs.msdn.com/b/ieinternals/archive/2010/09/15/
     * ie9-beta-minor-change-list.aspx
     */
    if (isIE) {
      // editor can be null after mounting
      // https://stackoverflow.com/questions/44074747/componentdidmount-called-before-ref-callback
      if (!this.editor) {
        global.execCommand('AutoUrlDetect', false, false);
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.editor.ownerDocument.execCommand('AutoUrlDetect', false, false);
      }
    }
  }

  componentDidUpdate(): void {
    this._blockSelectEvents = false;
    this._latestEditorState = this.props.editorState;
    this._latestCommittedEditorState = this.props.editorState;
  }

  /**
   * Used via `this.focus()`.
   *
   * Force focus back onto the editor node.
   *
   * We attempt to preserve scroll position when focusing. You can also pass
   * a specified scroll position (for cases like `cut` behavior where it should
   * be restored to a known position).
   */
  focus: (scrollPosition?: DraftScrollPosition) => void = (
    scrollPosition?: DraftScrollPosition,
  ): void => {
    const {editorState} = this.props;
    const alreadyHasFocus = editorState.selection.hasFocus;
    const editorNode = this.editor;

    if (!editorNode) {
      // once in a while people call 'focus' in a setTimeout, and the node has
      // been deleted, so it can be null in that case.
      return;
    }

    const scrollParent = Style.getScrollParent(editorNode);
    const {x, y} = scrollPosition || getScrollPosition(scrollParent);

    invariant(isHTMLElement(editorNode), 'editorNode is not an HTMLElement');

    editorNode.focus();

    // Restore scroll position
    if (scrollParent === window) {
      window.scrollTo(x, y);
    } else {
      Scroll.setTop(scrollParent, y);
    }

    // On Chrome and Safari, calling focus on contenteditable focuses the
    // cursor at the first character. This is something you don't expect when
    // you're clicking on an input element but not directly on a character.
    // Put the cursor back where it was before the blur.
    if (!alreadyHasFocus) {
      this.update(forceSelection(editorState, editorState.selection));
    }
  };

  blur: () => void = (): void => {
    const editorNode = this.editor;
    if (!editorNode) {
      return;
    }
    invariant(isHTMLElement(editorNode), 'editorNode is not an HTMLElement');
    editorNode.blur();
  };

  mode: DraftEditorModes = 'edit';

  /**
   * Used via `this.setMode(...)`.
   *
   * Set the behavior mode for the editor component. This switches the current
   * handler module to ensure that DOM events are managed appropriately for
   * the active mode.
   */
  setMode: (draftEditorModes: DraftEditorModes) => void = (
    mode: DraftEditorModes,
  ): void => {
    const {onPaste, onCut, onCopy} = this.props;
    const editHandler = {...handlerMap.edit};

    if (onPaste) {
      /* $FlowFixMe(>=0.117.0 site=www,mobile) This comment suppresses an error found
       * when Flow v0.117 was deployed. To see the error delete this comment
       * and run Flow. */
      editHandler.onPaste = onPaste;
    }

    if (onCut) {
      editHandler.onCut = onCut;
    }

    if (onCopy) {
      editHandler.onCopy = onCopy;
    }

    const handler = {
      ...handlerMap,
      edit: editHandler,
    };
    this._handler = handler[mode];
    this.mode = mode;

    if (mode !== 'drag') {
      // reset drag event counters
      this._dragEventMap = new Map();
    }
  };

  exitCurrentMode: () => void = (): void => {
    this.setMode('edit');
  };

  /**
   * Used via `this.restoreEditorDOM()`.
   *
   * Force a complete re-render of the DraftEditorContents based on the current
   * EditorState. This is useful when we know we are going to lose control of
   * the DOM state (cut command, IME) and we want to make sure that
   * reconciliation occurs on a version of the DOM that is synchronized with
   * our EditorState.
   */
  restoreEditorDOM: (scrollPosition?: DraftScrollPosition) => void = (
    scrollPosition?: DraftScrollPosition,
  ): void => {
    this.setState({contentsKey: this.state.contentsKey + 1}, () => {
      this.focus(scrollPosition);
    });
  };

  /**
   * Used via `this.setClipboard(...)`.
   *
   * Set the clipboard state for a cut/copy event.
   */
  setClipboard: (arg0: BlockMap | null) => void = (
    clipboard: BlockMap | null,
  ): void => {
    this._clipboard = clipboard;
  };

  /**
   * Used via `this.getClipboard()`.
   *
   * Retrieve the clipboard state for a cut/copy event.
   */
  getClipboard: () => BlockMap | null = (): BlockMap | null => {
    return this._clipboard;
  };

  /**
   * Used via `this.update(...)`.
   *
   * Propagate a new `EditorState` object to higher-level components. This is
   * the method by which event handlers inform the `DraftEditor` component of
   * state changes. A component that composes a `DraftEditor` **must** provide
   * an `onChange` prop to receive state updates passed along from this
   * function.
   */
  update: (editorState: EditorState) => void = (
    editorState: EditorState,
  ): void => {
    this._latestEditorState = editorState;
    this.props.onChange(editorState);
  };

  /**
   * Used in conjunction with `onDragLeave()`, by counting the number of times
   * a dragged element enters and leaves the editor (or any of its children),
   * to determine when the dragged element absolutely leaves the editor.
   */
  onDragEnter: DragEventHandler = (e): void => {
    // Increment count for event target
    this._dragEventMap.set(
      e.target,
      (this._dragEventMap.get(e.target) || 0) + 1,
    );
  };

  /**
   * See `onDragEnter()`.
   */
  onDragLeave: DragEventHandler = (e): void => {
    // Decrement count for event target, removing it if the count is 0
    const eventTargetCount = this._dragEventMap.get(e.target);
    if (eventTargetCount !== undefined) {
      if (eventTargetCount <= 1) {
        this._dragEventMap.delete(e.target);
      } else {
        this._dragEventMap.set(e.target, eventTargetCount - 1);
      }
    }

    // Remove event targets that are no longer in the DOM
    for (const eventTarget of this._dragEventMap.keys()) {
      if (eventTarget instanceof Element && !eventTarget.isConnected) {
        this._dragEventMap.delete(eventTarget);
      }
    }

    const isDragging = this._dragEventMap.size > 0;

    if (!isDragging) {
      this.exitCurrentMode();
    }
  };
}
