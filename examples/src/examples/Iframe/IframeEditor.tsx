import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Editor,
  EditorState,
  RichUtils,
  createEmpty,
  DraftHandleValue,
  DraftEditorCommand,
  getDefaultKeyBinding,
  getCurrentInlineStyle,
  getBlockForKey,
  getStartKey,
} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './IframeEditor.css';

interface FrameProps {
  children: React.ReactNode;
  head?: string;
}

class Frame extends React.Component<FrameProps> {
  private iframeRef: HTMLIFrameElement | null = null;

  componentDidMount() {
    this.updateIframeContent();
  }

  componentDidUpdate() {
    this.updateIframeContent();
  }

  updateIframeContent = () => {
    if (this.iframeRef?.contentDocument) {
      const doc = this.iframeRef.contentDocument;

      // Set up the head content
      if (!doc.head.querySelector('link[href*="Draft.css"]')) {
        const draftCSS = document.querySelector('link[href*="Draft.css"]');
        if (draftCSS) {
          const newLink = doc.createElement('link');
          newLink.rel = 'stylesheet';
          newLink.href = (draftCSS as HTMLLinkElement).href;
          doc.head.appendChild(newLink);
        }

        // Add custom styles
        const style = doc.createElement('style');
        style.textContent = `
          body {
            margin: 0;
            padding: 20px;
            font-family: 'Georgia', serif;
          }
          .RichEditor-controls {
            font-family: 'Helvetica', sans-serif;
            font-size: 14px;
            margin-bottom: 5px;
            user-select: none;
          }
          .RichEditor-styleButton {
            color: #999;
            cursor: pointer;
            margin-right: 16px;
            padding: 2px 0;
            display: inline-block;
          }
          .RichEditor-activeButton {
            color: #5890ff;
          }
          .RichEditor-editor {
            border: 1px solid #ddd;
            cursor: text;
            font-size: 16px;
            margin-top: 10px;
            padding: 15px;
            min-height: 200px;
          }
          .RichEditor-blockquote {
            border-left: 5px solid #eee;
            color: #666;
            font-family: 'Hoefler Text', 'Georgia', serif;
            font-style: italic;
            margin: 16px 0;
            padding: 10px 20px;
          }
        `;
        doc.head.appendChild(style);
      }
    }
  };

  handleRef = (ref: HTMLIFrameElement | null) => {
    this.iframeRef = ref;
    if (ref) {
      // Force update after iframe is mounted
      setTimeout(() => this.forceUpdate(), 0);
    }
  };

  render() {
    let portal = null;
    if (this.iframeRef?.contentDocument?.body) {
      portal = ReactDOM.createPortal(
        this.props.children,
        this.iframeRef.contentDocument.body
      );
    }

    return (
      <div className="iframe-container">
        <iframe
          ref={this.handleRef}
          title="Draft.js Editor"
          style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
        />
        {portal}
      </div>
    );
  }
}

interface StyleButtonProps {
  active: boolean;
  label: string;
  onToggle: (style: string) => void;
  style: string;
}

const StyleButton: React.FC<StyleButtonProps> = ({ active, label, onToggle, style }) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle(style);
  };

  let className = 'RichEditor-styleButton';
  if (active) {
    className += ' RichEditor-activeButton';
  }

  return (
    <span className={className} onMouseDown={handleToggle}>
      {label}
    </span>
  );
};

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code Block', style: 'code-block' },
];

const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
];

interface BlockStyleControlsProps {
  editorState: EditorState;
  onToggle: (style: string) => void;
}

const BlockStyleControls: React.FC<BlockStyleControlsProps> = ({ editorState, onToggle }) => {
  const selection = editorState.selection;
  const blockType = getBlockForKey(
    editorState.currentContent,
    getStartKey(selection)
  ).type;

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

interface InlineStyleControlsProps {
  editorState: EditorState;
  onToggle: (style: string) => void;
}

const InlineStyleControls: React.FC<InlineStyleControlsProps> = ({ editorState, onToggle }) => {
  const currentStyle = getCurrentInlineStyle(editorState);

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block: any) {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return '';
  }
}

function IframeEditor() {
  const [editorState, setEditorState] = useState(() => createEmpty());
  const editorRef = useRef<Editor>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleKeyCommand = (command: DraftEditorCommand, state: EditorState): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const mapKeyToEditorCommand = (e: React.KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(e, editorState, 4);
      if (newEditorState !== editorState) {
        setEditorState(newEditorState);
      }
      return null;
    }
    return getDefaultKeyBinding(e as any);
  };

  const toggleBlockType = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const contentState = editorState.currentContent;
  let className = 'RichEditor-editor';
  if (!contentState.hasText()) {
    const firstBlock = contentState.getBlockMap().first();
    if (firstBlock && firstBlock.getType() !== 'unstyled') {
      className += ' RichEditor-hidePlaceholder';
    }
  }

  return (
    <div className="IframeEditor-root">
      <h2>Iframe Editor</h2>
      <div className="IframeEditor-instructions">
        This example demonstrates Draft.js running inside an iframe, which can be useful for
        isolating the editor's styles and DOM from the parent document.
      </div>

      <Frame>
        <div className="Editor-root">
          <BlockStyleControls
            editorState={editorState}
            onToggle={toggleBlockType}
          />
          <InlineStyleControls
            editorState={editorState}
            onToggle={toggleInlineStyle}
          />
          <div className={className} onClick={focus}>
            <Editor
              blockStyleFn={getBlockStyle}
              customStyleMap={styleMap}
              editorState={editorState}
              handleKeyCommand={handleKeyCommand}
              keyBindingFn={mapKeyToEditorCommand}
              onChange={setEditorState}
              placeholder="Tell a story..."
              ref={editorRef}
              spellCheck={true}
            />
          </div>
        </div>
      </Frame>
    </div>
  );
}

export default IframeEditor;