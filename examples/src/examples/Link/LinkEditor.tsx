import React, {useState, useRef} from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  CompositeDecorator,
  ContentState,
  ContentBlock,
  getEntity,
  findEntityRanges,
  createEmpty,
  isCollapsed,
  getBlockForKey,
  getEntityAt,
  createEntity,
  setEditorState,
} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './LinkEditor.css';

// Link component to render links
interface LinkProps {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({entityKey, children}) => {
  const {url} = getEntity(entityKey).data;
  return (
    <a href={url} className="link-entity" title={url}>
      {children}
    </a>
  );
};

// Strategy function to find link entities
function findLinkEntities(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
) {
  findEntityRanges(
    contentBlock,
    character => {
      const entityKey = character.entity;
      return entityKey !== null && getEntity(entityKey).type === 'LINK';
    },
    callback,
  );
}

function LinkEditor() {
  const decorator = new CompositeDecorator([
    {
      strategy: findLinkEntities,
      component: Link,
    },
  ]);

  const [editorState, setEditorCompState] = useState(() =>
    createEmpty(decorator),
  );
  const [showURLInput, setShowURLInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const editorRef = useRef<Editor>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const onChange = (newEditorState: EditorState) => {
    setEditorCompState(newEditorState);
  };

  const logState = () => {
    const content = editorState.currentContent;
    console.log(content);
  };

  const promptForLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = editorState.selection;
    if (!isCollapsed(selection)) {
      const contentState = editorState.currentContent;
      const startKey = selection.anchorKey;
      const startOffset = selection.anchorOffset;
      const blockWithLinkAtBeginning = getBlockForKey(contentState, startKey);
      const linkKey = getEntityAt(blockWithLinkAtBeginning, startOffset);

      let url = '';
      if (linkKey) {
        const linkInstance = getEntity(linkKey);
        url = linkInstance.data.url;
      }

      setShowURLInput(true);
      setUrlValue(url);
      setTimeout(() => {
        if (urlInputRef.current) {
          urlInputRef.current.focus();
        }
      }, 0);
    }
  };

  const confirmLink = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const contentState = editorState.currentContent;
    const entityKey = createEntity('LINK', 'MUTABLE', {
      url: urlValue,
    });
    const newEditorState = setEditorState(editorState, {
      currentContent: contentState,
    });

    setEditorCompState(
      RichUtils.toggleLink(newEditorState, newEditorState.selection, entityKey),
    );
    setShowURLInput(false);
    setUrlValue('');
    setTimeout(() => focus(), 0);
  };

  const onLinkInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.which === 13) {
      confirmLink(e);
    }
  };

  const removeLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = editorState.selection;
    if (!isCollapsed(selection)) {
      setEditorCompState(RichUtils.toggleLink(editorState, selection, null));
    }
  };

  return (
    <div className="LinkEditor-root">
      <h2>Link Editor</h2>
      <div className="LinkEditor-instructions">
        Select some text and click "Add Link" to add a hyperlink.
      </div>

      <div className="LinkEditor-buttons">
        <button onMouseDown={promptForLink} className="LinkEditor-button add">
          Add Link
        </button>
        <button onClick={removeLink} className="LinkEditor-button remove">
          Remove Link
        </button>
        <button onClick={logState} className="LinkEditor-button log">
          Log State
        </button>
      </div>

      {showURLInput && (
        <div className="LinkEditor-urlInput">
          <input
            ref={urlInputRef}
            type="text"
            value={urlValue}
            onChange={e => setUrlValue(e.target.value)}
            onKeyDown={onLinkInputKeyDown}
            placeholder="Enter link URL..."
          />
          <button onMouseDown={confirmLink}>Confirm</button>
          <button onClick={() => setShowURLInput(false)}>Cancel</button>
        </div>
      )}

      <div className="LinkEditor-editor" onClick={focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          placeholder="Enter some text..."
          ref={editorRef}
        />
      </div>
    </div>
  );
}

export default LinkEditor;
