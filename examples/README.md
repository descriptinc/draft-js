# Draft.js Examples

This package contains example implementations showcasing various features of Draft.js.

## Getting Started

### Prerequisites

1. Build the main Draft.js package first:
```bash
# From the root directory
pnpm run build
```

2. Install dependencies:
```bash
pnpm install
```

### Running the Examples

From the root directory:
```bash
pnpm run examples
```

Or from the examples directory:
```bash
pnpm dev
```

Then open http://localhost:3000 in your browser.

## Available Examples

### 1. Rich Text Editor
A full-featured rich text editor with:
- Block styles (headers, quotes, lists, code blocks)
- Inline styles (bold, italic, underline, monospace)
- Keyboard shortcuts
- Custom block styling

### 2. Plain Text Editor
A simple plain text editor demonstrating:
- Basic Draft.js setup
- Minimal configuration
- Plain text editing

### 3. Media Editor
Demonstrates embedding media in the editor:
- Image insertion
- Audio embedding
- Video embedding
- Custom block rendering for atomic blocks

### 4. Link Editor
Shows how to work with entity-based links:
- Creating link entities
- Decorating link text
- Removing links
- Custom link rendering

### 5. Color Editor
Demonstrates custom inline styles:
- Text coloring with custom style map
- Multiple color options
- Combining with standard formatting

### 6. Entity Editor
Shows entity creation and management:
- Immutable entities
- Mutable entities
- Segmented entities
- Entity decorators

### 7. Tweet Editor
A Twitter-like composer demonstrating:
- Character counting
- @mention highlighting
- #hashtag highlighting
- Real-time decorators

### 8. Iframe Editor
Shows Draft.js running inside an iframe:
- Isolated DOM and styles
- Portal-based rendering
- Rich text editing in iframe context

### 9. Convert from HTML
Demonstrates HTML to Draft.js conversion:
- Converting HTML strings to editor state
- Preserving formatting and structure
- Entity preservation (links, images)
- Interactive HTML input and conversion

## Project Structure

```
examples/
├── src/
│   ├── examples/
│   │   ├── RichEditor/
│   │   ├── PlainText/
│   │   ├── Media/
│   │   ├── Link/
│   │   ├── Color/
│   │   ├── Entity/
│   │   ├── Tweet/
│   │   ├── Iframe/
│   │   └── ConvertFromHTML/
│   ├── App.tsx         # Main app with example switcher
│   └── main.tsx        # Entry point
├── package.json
└── vite.config.ts      # Vite configuration
```

## Development

### Adding a New Example

1. Create a new folder in `src/examples/YourExample/`
2. Add your example component (`YourExample.tsx`)
3. Add styles (`YourExample.css`)
4. Import and add to `App.tsx`

### TypeScript Support

All examples are written in TypeScript for better IDE support and type safety.

### Styling

Each example has its own CSS file for isolated styling. The main Draft.js CSS is imported globally.

## Technologies Used

- **Vite**: Fast build tool and dev server
- **React 19**: Latest React version
- **TypeScript**: Type-safe development
- **pnpm workspaces**: Monorepo management
- **Draft.js**: The star of the show

## Notes

- Examples import Draft.js as a package (`@descript/draft-js`) to test real-world usage
- Hot Module Replacement (HMR) is enabled for fast development
- Changes to the main Draft.js package require rebuilding before they appear in examples