import React, {useState, useRef, useEffect} from 'react';
import {
  Editor,
  EditorState,
  createEmpty,
  CompositeDecorator,
  ContentBlock,
  getPlainText,
} from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './TweetEditor.css';

const MAX_LENGTH = 280;

// Component to render @mentions
interface MentionProps {
  children: React.ReactNode;
}

const MentionSpan: React.FC<MentionProps> = ({children}) => {
  return <span className="tweet-mention">{children}</span>;
};

// Component to render hashtags
interface HashtagProps {
  children: React.ReactNode;
}

const HashtagSpan: React.FC<HashtagProps> = ({children}) => {
  return <span className="tweet-hashtag">{children}</span>;
};

// Strategy to find @mentions
function findMentions(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
) {
  const text = contentBlock.text;
  const mentionRegex = /@[\w]+/g;
  let matchArr;
  while ((matchArr = mentionRegex.exec(text)) !== null) {
    callback(matchArr.index, matchArr.index + matchArr[0].length);
  }
}

// Strategy to find #hashtags
function findHashtags(
  contentBlock: ContentBlock,
  callback: (start: number, end: number) => void,
) {
  const text = contentBlock.text;
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  let matchArr;
  while ((matchArr = hashtagRegex.exec(text)) !== null) {
    callback(matchArr.index, matchArr.index + matchArr[0].length);
  }
}

function TweetEditor() {
  const decorator = new CompositeDecorator([
    {
      strategy: findMentions,
      component: MentionSpan,
    },
    {
      strategy: findHashtags,
      component: HashtagSpan,
    },
  ]);

  const [editorState, setEditorState] = useState(() => createEmpty(decorator));
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    const contentState = editorState.currentContent;
    const plainText = getPlainText(contentState);
    setCharCount(plainText.length);
  }, [editorState]);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const onChange = (newEditorState: EditorState) => {
    const contentState = newEditorState.currentContent;
    const plainText = getPlainText(contentState);

    // Prevent typing if over limit
    if (plainText.length <= MAX_LENGTH || plainText.length < charCount) {
      setEditorState(newEditorState);
    }
  };

  const handleTweet = () => {
    const contentState = editorState.currentContent;
    const plainText = getPlainText(contentState);

    if (plainText.trim().length > 0 && plainText.length <= MAX_LENGTH) {
      console.log('Tweet:', plainText);
      alert('Tweet posted! (Check console for content)');
      setEditorState(createEmpty(decorator));
    }
  };

  const remainingChars = MAX_LENGTH - charCount;
  const isOverLimit = remainingChars < 0;
  const isNearLimit = remainingChars <= 20 && remainingChars >= 0;

  return (
    <div className="TweetEditor-root">
      <h2>Tweet Composer</h2>
      <div className="TweetEditor-instructions">
        Compose a tweet with @mentions and #hashtags. Max {MAX_LENGTH}{' '}
        characters.
      </div>

      <div className="TweetEditor-composer">
        <div className="TweetEditor-editor" onClick={focus}>
          <Editor
            editorState={editorState}
            onChange={onChange}
            placeholder="What's happening?"
            ref={editorRef}
          />
        </div>

        <div className="TweetEditor-footer">
          <div
            className={`TweetEditor-charCount ${
              isOverLimit ? 'over' : isNearLimit ? 'warning' : ''
            }`}>
            {remainingChars}
          </div>

          <button
            className="TweetEditor-tweetButton"
            onClick={handleTweet}
            disabled={charCount === 0 || isOverLimit}>
            Tweet
          </button>
        </div>

        <div className="TweetEditor-tips">
          <p>Try typing:</p>
          <ul>
            <li>@mentions to tag users</li>
            <li>#hashtags to categorize your tweet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default TweetEditor;
