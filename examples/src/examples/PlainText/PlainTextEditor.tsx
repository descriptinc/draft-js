import {useState, useRef} from 'react';
import {Editor, createEmpty} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './PlainTextEditor.css';

function PlainTextEditor() {
  const [editorState, setEditorState] = useState(() => createEmpty());
  const editorRef = useRef<Editor>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="PlainTextEditor-root">
      <h2>Plain Text Editor</h2>
      <div className="PlainTextEditor-editor" onClick={focus}>
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          placeholder="Enter some plain text..."
          ref={editorRef}
        />
      </div>
    </div>
  );
}

export default PlainTextEditor;
