import React, {useState, useRef} from 'react';
import {
  Editor,
  EditorState,
  createEmpty,
  Modifier,
  CompositeDecorator,
  ContentState,
  ContentBlock,
  getEntity,
  findEntityRanges,
  isCollapsed,
  createEntity,
  pushContent,
} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './EntityEditor.css';

// Token entity component
interface TokenSpanProps {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}

const TokenSpan: React.FC<TokenSpanProps> = ({entityKey, children}) => {
  const {type} = getEntity(entityKey).data;
  const className = type === 'IMMUTABLE' ? 'token-immutable' : 'token-mutable';

  return (
    <span
      className={className}
      title={`This is a ${type.toLowerCase()} entity`}>
      {children}
    </span>
  );
};

// Strategy function to find token entities
function findTokenEntities(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
) {
  findEntityRanges(
    contentBlock,
    character => {
      const entityKey = character.entity;
      if (!entityKey) return false;

      const entity = getEntity(entityKey);
      return entity.type === 'TOKEN';
    },
    callback,
  );
}

function EntityEditor() {
  const decorator = new CompositeDecorator([
    {
      strategy: findTokenEntities,
      component: TokenSpan,
    },
  ]);

  const [editorState, setEditorState] = useState(() => createEmpty(decorator));
  const editorRef = useRef<Editor>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
  };

  const addToken = (mutability: 'IMMUTABLE' | 'MUTABLE' | 'SEGMENTED') => {
    const selection = editorState.selection;

    if (isCollapsed(selection)) {
      // If no text is selected, insert sample text
      const contentState = editorState.currentContent;
      const entityKey = createEntity('TOKEN', mutability, {
        type: mutability,
      });
      const textToInsert = `[${mutability}]`;

      const newContentState = Modifier.insertText(
        contentState,
        selection,
        textToInsert,
        undefined,
        entityKey,
      );

      const newEditorState = pushContent(
        editorState,
        newContentState,
        'insert-characters',
      );

      setEditorState(newEditorState);
    } else {
      // Apply entity to selected text
      const contentState = editorState.currentContent;
      const entityKey = createEntity('TOKEN', mutability, {type: mutability});

      const newContentState = Modifier.applyEntity(
        contentState,
        selection,
        entityKey,
      );

      const newEditorState = pushContent(
        editorState,
        newContentState,
        'apply-entity',
      );

      setEditorState(newEditorState);
    }
  };

  const removeEntity = () => {
    const selection = editorState.selection;
    const contentState = editorState.currentContent;

    const newContentState = Modifier.applyEntity(contentState, selection, null);

    const newEditorState = pushContent(
      editorState,
      newContentState,
      'apply-entity',
    );

    setEditorState(newEditorState);
  };

  const logState = () => {
    console.log(editorState.currentContent);
  };

  return (
    <div className="EntityEditor-root">
      <h2>Entity Editor</h2>
      <div className="EntityEditor-instructions">
        <p>This example demonstrates entity creation and management.</p>
        <p>Select text and apply different entity mutability types:</p>
        <ul>
          <li>
            <strong>Immutable:</strong> Cannot be modified
          </li>
          <li>
            <strong>Mutable:</strong> Can be modified
          </li>
          <li>
            <strong>Segmented:</strong> Can be partially modified
          </li>
        </ul>
      </div>

      <div className="EntityEditor-buttons">
        <button
          onClick={() => addToken('IMMUTABLE')}
          className="EntityEditor-button immutable">
          Add Immutable
        </button>
        <button
          onClick={() => addToken('MUTABLE')}
          className="EntityEditor-button mutable">
          Add Mutable
        </button>
        <button
          onClick={() => addToken('SEGMENTED')}
          className="EntityEditor-button segmented">
          Add Segmented
        </button>
        <button onClick={removeEntity} className="EntityEditor-button remove">
          Remove Entity
        </button>
        <button onClick={logState} className="EntityEditor-button log">
          Log State
        </button>
      </div>

      <div className="EntityEditor-editor" onClick={focus}>
        <Editor
          editorState={editorState}
          onChange={onChange}
          placeholder="Type some text, then select it and add entities..."
          ref={editorRef}
        />
      </div>
    </div>
  );
}

export default EntityEditor;
