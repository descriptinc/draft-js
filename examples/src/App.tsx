import {useState} from 'react';
import RichEditor from './examples/RichEditor/RichEditor';
import PlainTextEditor from './examples/PlainText/PlainTextEditor';
import LinkEditor from './examples/Link/LinkEditor';
import ColorEditor from './examples/Color/ColorEditor';
import EntityEditor from './examples/Entity/EntityEditor';
import TweetEditor from './examples/Tweet/TweetEditor';
import IframeEditor from './examples/Iframe/IframeEditor';
import ConvertFromHTMLEditor from './examples/ConvertFromHTML/ConvertFromHTMLEditor';
import './App.css';

type ExampleType =
  | 'rich'
  | 'plain'
  | 'link'
  | 'color'
  | 'entity'
  | 'tweet'
  | 'iframe'
  | 'convertFromHTML';

const EXAMPLES: {value: ExampleType; label: string}[] = [
  {value: 'rich', label: 'Rich Text'},
  {value: 'plain', label: 'Plain Text'},
  {value: 'link', label: 'Links'},
  {value: 'color', label: 'Colors'},
  {value: 'entity', label: 'Entities'},
  {value: 'tweet', label: 'Tweet'},
  {value: 'iframe', label: 'Iframe'},
  {value: 'convertFromHTML', label: 'HTML Import'},
];

function App() {
  const [currentExample, setCurrentExample] = useState<ExampleType>('rich');

  const renderExample = () => {
    switch (currentExample) {
      case 'rich':
        return <RichEditor />;
      case 'plain':
        return <PlainTextEditor />;
      case 'link':
        return <LinkEditor />;
      case 'color':
        return <ColorEditor />;
      case 'entity':
        return <EntityEditor />;
      case 'tweet':
        return <TweetEditor />;
      case 'iframe':
        return <IframeEditor />;
      case 'convertFromHTML':
        return <ConvertFromHTMLEditor />;
      default:
        return <RichEditor />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Draft.js Examples</h1>
        <nav className="example-nav">
          {EXAMPLES.map(({value, label}) => (
            <button
              key={value}
              className={currentExample === value ? 'active' : ''}
              onClick={() => setCurrentExample(value)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">{renderExample()}</main>
    </div>
  );
}

export default App;
