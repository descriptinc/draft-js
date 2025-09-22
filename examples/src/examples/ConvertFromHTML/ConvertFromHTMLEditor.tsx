import React, {useState, useRef} from 'react';
import {
  Editor,
  CompositeDecorator,
  ContentState,
  ContentBlock,
  convertFromHTML,
  createWithContent,
  getEntity,
  findEntityRanges,
  createFromBlockArray,
} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './ConvertFromHTMLEditor.css';

// Component to render links
interface LinkProps {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}

const Link: React.FC<LinkProps> = ({entityKey, children}) => {
  const {url} = getEntity(entityKey).data;
  return (
    <a href={url} className="converted-link">
      {children}
    </a>
  );
};

// Component to render images
interface ImageProps {
  contentState: ContentState;
  entityKey: string;
  children: React.ReactNode;
}

const Image: React.FC<ImageProps> = ({entityKey}) => {
  const {height, src, width} = getEntity(entityKey).data;
  return <img src={src} height={height} width={width} alt="" />;
};

// Strategy to find link entities
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

// Strategy to find image entities
function findImageEntities(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
) {
  findEntityRanges(
    contentBlock,
    character => {
      const entityKey = character.entity;
      return entityKey !== null && getEntity(entityKey).type === 'IMAGE';
    },
    callback,
  );
}

function ConvertFromHTMLEditor() {
  const [htmlInput, setHtmlInput] = useState(
    '<b>Bold text</b>, <i>Italic text</i><br/><br/>' +
      '<a href="http://www.facebook.com">Example link</a><br/><br/>' +
      '<h2>Heading 2</h2>' +
      '<ul><li>List item 1</li><li>List item 2</li></ul>' +
      '<blockquote>This is a blockquote</blockquote>' +
      '<p>Regular paragraph with <code>inline code</code></p>',
  );

  const decorator = new CompositeDecorator([
    {
      strategy: findLinkEntities,
      component: Link,
    },
    {
      strategy: findImageEntities,
      component: Image,
    },
  ]);

  const [editorState, setEditorState] = useState(() => {
    const blocksFromHTML = convertFromHTML(htmlInput);
    const state = createFromBlockArray(blocksFromHTML!.contentBlocks!);
    return createWithContent(state, decorator);
  });

  const editorRef = useRef<Editor>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const logState = () => {
    const content = editorState.currentContent;
    console.log('Content state:', content);
    alert('Content state logged to console!');
  };

  const convertHTML = () => {
    try {
      const blocksFromHTML = convertFromHTML(htmlInput);
      const state = createFromBlockArray(blocksFromHTML!.contentBlocks!);
      setEditorState(createWithContent(state, decorator));
    } catch (error) {
      alert('Error converting HTML. Please check the format.');
      console.error(error);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHtmlInput(e.target.value);
  };

  return (
    <div className="ConvertFromHTMLEditor-root">
      <h2>Convert from HTML</h2>
      <div className="ConvertFromHTMLEditor-instructions">
        This example demonstrates converting HTML content into Draft.js editor
        state. Edit the HTML below and click "Convert HTML" to see it rendered
        in the editor.
      </div>

      <div className="ConvertFromHTMLEditor-inputSection">
        <h3>HTML Input</h3>
        <textarea
          className="ConvertFromHTMLEditor-textarea"
          value={htmlInput}
          onChange={handleTextareaChange}
          rows={8}
        />
        <button
          className="ConvertFromHTMLEditor-button convert"
          onClick={convertHTML}>
          Convert HTML
        </button>
      </div>

      <div className="ConvertFromHTMLEditor-editorSection">
        <h3>Draft.js Editor Output</h3>
        <div className="ConvertFromHTMLEditor-editor" onClick={focus}>
          <Editor
            editorState={editorState}
            onChange={setEditorState}
            ref={editorRef}
            placeholder="Converted content will appear here..."
          />
        </div>
        <button className="ConvertFromHTMLEditor-button log" onClick={logState}>
          Log State to Console
        </button>
      </div>

      <div className="ConvertFromHTMLEditor-tips">
        <h3>Supported HTML Tags</h3>
        <ul>
          <li>
            <code>&lt;b&gt;</code>, <code>&lt;strong&gt;</code> - Bold text
          </li>
          <li>
            <code>&lt;i&gt;</code>, <code>&lt;em&gt;</code> - Italic text
          </li>
          <li>
            <code>&lt;u&gt;</code> - Underlined text
          </li>
          <li>
            <code>&lt;code&gt;</code> - Inline code
          </li>
          <li>
            <code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code> - Headers
          </li>
          <li>
            <code>&lt;blockquote&gt;</code> - Blockquotes
          </li>
          <li>
            <code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code>,{' '}
            <code>&lt;li&gt;</code> - Lists
          </li>
          <li>
            <code>&lt;a&gt;</code> - Links (preserved as entities)
          </li>
          <li>
            <code>&lt;img&gt;</code> - Images (preserved as entities)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default ConvertFromHTMLEditor;
