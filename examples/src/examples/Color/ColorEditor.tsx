import React, { useState, useRef, useMemo } from 'react';
import {
  Editor,
  EditorState,
  createEmpty,
  RichUtils,
  Modifier,
  pushContent,
  getCurrentInlineStyle,
} from '@descript/draft-js';
import type { DraftEditorCommand, DraftHandleValue } from '@descript/draft-js';
import '@descript/draft-js/dist/Draft.css';
import './ColorEditor.css';

const COLORS = [
  { label: 'Red', style: 'red', color: '#ff0000' },
  { label: 'Orange', style: 'orange', color: '#ff8c00' },
  { label: 'Yellow', style: 'yellow', color: '#ffd700' },
  { label: 'Green', style: 'green', color: '#008000' },
  { label: 'Blue', style: 'blue', color: '#0000ff' },
  { label: 'Indigo', style: 'indigo', color: '#4b0082' },
  { label: 'Violet', style: 'violet', color: '#9400d3' },
];

interface ColorButtonProps {
  active: boolean;
  label: string;
  style: string;
  color: string;
  onToggle: (style: string) => void;
}

const ColorButton: React.FC<ColorButtonProps> = ({ active, label, style, color, onToggle }) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle(style);
  };

  return (
    <button
      className={`ColorEditor-colorButton ${active ? 'active' : ''}`}
      style={{ backgroundColor: color }}
      onMouseDown={handleToggle}
      title={label}
    />
  );
};

function ColorEditor() {
  const [editorState, setEditorState] = useState(() => createEmpty());
  const editorRef = useRef<Editor>(null);

  const focus = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
  };

  const handleKeyCommand = (command: DraftEditorCommand | string, state: EditorState): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(state, command);
    if (newState) {
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleColor = (colorStyle: string) => {
    const selection = editorState.selection;

    // Remove all color styles first
    let nextContentState = editorState.currentContent;
    COLORS.forEach(({ style }) => {
      nextContentState = Modifier.removeInlineStyle(
        nextContentState,
        selection,
        style
      );
    });

    // Apply the new color style
    const nextEditorState = pushContent(editorState,
      Modifier.applyInlineStyle(
        nextContentState,
        selection,
        colorStyle
      ),
      'change-inline-style'
    );

    onChange(nextEditorState);
  };

  const removeColor = () => {
    const selection = editorState.selection;
    let nextContentState = editorState.currentContent;

    // Remove all color styles
    COLORS.forEach(({ style }) => {
      nextContentState = Modifier.removeInlineStyle(
        nextContentState,
        selection,
        style
      );
    });

    const nextEditorState = pushContent(
      editorState,
      nextContentState,
      'change-inline-style'
    );

    onChange(nextEditorState);
  };

  const styleMap = useMemo(() => {
    const map: { [key: string]: React.CSSProperties } = {};
    COLORS.forEach(({ style, color }) => {
      map[style] = { color };
    });
    return map;
  }, []);

  const currentStyle = getCurrentInlineStyle(editorState);

  return (
    <div className="ColorEditor-root">
      <h2>Color Editor</h2>
      <div className="ColorEditor-instructions">
        Select text and click a color to apply it. You can also use standard formatting shortcuts.
      </div>

      <div className="ColorEditor-controls">
        <div className="ColorEditor-colorPalette">
          {COLORS.map((colorData) => (
            <ColorButton
              key={colorData.style}
              active={currentStyle.has(colorData.style)}
              label={colorData.label}
              style={colorData.style}
              color={colorData.color}
              onToggle={toggleColor}
            />
          ))}
          <button
            className="ColorEditor-removeButton"
            onMouseDown={(e) => {
              e.preventDefault();
              removeColor();
            }}
            title="Remove color"
          >
            ✕
          </button>
        </div>
        <div className="ColorEditor-formatButtons">
          <button
            className={`ColorEditor-formatButton ${currentStyle.has('BOLD') ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
            }}
          >
            <strong>B</strong>
          </button>
          <button
            className={`ColorEditor-formatButton ${currentStyle.has('ITALIC') ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(RichUtils.toggleInlineStyle(editorState, 'ITALIC'));
            }}
          >
            <em>I</em>
          </button>
          <button
            className={`ColorEditor-formatButton ${currentStyle.has('UNDERLINE') ? 'active' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
            }}
          >
            <u>U</u>
          </button>
        </div>
      </div>

      <div className="ColorEditor-editor" onClick={focus}>
        <Editor
          customStyleMap={styleMap}
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          onChange={onChange}
          placeholder="Enter some text and color it..."
          ref={editorRef}
          spellCheck={true}
        />
      </div>
    </div>
  );
}

export default ColorEditor;
