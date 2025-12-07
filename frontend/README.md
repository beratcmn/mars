# Mars Frontend

React frontend for the Mars desktop application, providing a modern chat interface for AI-powered coding assistance.

## Overview

The frontend is a sophisticated React application that serves as the user interface for the Mars coding agent. It communicates with the Python backend via PyWebView's JavaScript API to provide real-time AI interactions.

## Technology Stack

- **React 19**: Latest React with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── popover.tsx
│   │   ├── scroll-area.tsx
│   │   └── tabs.tsx
│   ├── ChatArea.tsx     # Message display component
│   ├── ChatTabs.tsx     # Session tab management
│   ├── Header.tsx       # Application header
│   ├── InputBar.tsx     # Message input component
│   ├── ModelSelector.tsx # AI model selection dropdown
│   └── Footer.tsx       # Application footer
├── lib/
│   ├── api.ts          # PyWebView API bridge
│   └── utils.ts        # Utility functions
├── App.tsx             # Main application component
├── main.tsx            # React entry point
└── index.css           # Global styles and theme
```

## Core Components

### App.tsx
The main application component that manages:
- **Session State**: Multiple chat sessions with tabbed interface
- **Message Handling**: Real-time message streaming and display
- **Event Processing**: Handles backend events for streaming responses
- **Model Management**: Provider and model selection
- **Settings Persistence**: Saves user preferences

### ChatArea.tsx
Message display component featuring:
- **Message Types**: User and assistant message rendering
- **Part System**: Support for text, reasoning, and tool parts
- **Tool Visualization**: Interactive tool call displays with status indicators
- **Reasoning Display**: Collapsible reasoning sections
- **Metadata**: Token usage, cost, and timing information

### ModelSelector.tsx
Advanced model selection interface:
- **Provider Filtering**: Shows only connected providers
- **Search Functionality**: Real-time model search
- **Grouped Display**: Models organized by provider
- **Selection Persistence**: Saves chosen model to settings

### API Bridge (lib/api.ts)
Type-safe interface to the Python backend:
- **PyWebView Detection**: Automatically detects desktop vs browser mode
- **Event Handling**: Real-time event streaming from backend
- **Mock Support**: Browser development with mock data
- **Error Handling**: Comprehensive error management

## Features

### Real-time Streaming
- Live message updates as they're generated
- Tool call status updates (pending → running → completed/error)
- Reasoning step display
- Token count and cost tracking

### Multi-Session Support
- Tabbed interface for multiple conversations
- Session persistence and management
- Quick switching between sessions

### Interactive Tool Display
- Expandable tool call sections
- Input/output visualization
- Error display and status indicators
- Timing information

### Modern UI/UX
- Dark/light theme support
- Responsive design
- Smooth animations and transitions
- Accessible components

## Development

### Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Build for production**:
```bash
npm run build
```

4. **Preview production build**:
```bash
npm run preview
```

### Available Scripts

- `npm run dev`: Start Vite development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Configuration

### Vite Configuration
- React plugin for JSX support
- Path aliases (`@/` for `src/`)
- Tailwind CSS integration

### Tailwind CSS
- Custom theme with CSS variables
- Dark mode support
- Responsive utilities
- Custom color palette

### TypeScript
- Strict type checking
- Path mapping for clean imports
- Comprehensive type definitions

## Component Architecture

### Message Part System
The application uses a flexible part system for message content:

```typescript
type MessagePart = TextPart | ReasoningPart | ToolPart;

interface TextPart {
  id: string;
  type: "text";
  text: string;
}

interface ReasoningPart {
  id: string;
  type: "reasoning";
  text: string;
}

interface ToolPart {
  id: string;
  type: "tool";
  tool: string;
  state: {
    status: "pending" | "running" | "completed" | "error";
    input?: Record<string, unknown>;
    output?: string;
    error?: string;
    time?: { start: number; end?: number };
  };
}
```

### Event System
Real-time updates via CustomEvents:
- `mars:event`: Main event channel from backend
- Event types: `message.part.updated`, `message.updated`, `session.updated`

### State Management
React state with hooks:
- Local component state for UI interactions
- Global state managed in App.tsx
- Event-driven updates from backend

## Styling

### Theme System
- CSS custom properties for consistent theming
- Light/dark mode variants
- Semantic color naming
- Responsive design tokens

### Component Styling
- Tailwind utility classes
- Component-specific variants
- Consistent spacing and typography
- Hover and focus states

## Browser Support

The application supports modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance Optimizations

- React.memo for component memoization
- Efficient event handling
- Optimized re-renders
- Lazy loading where appropriate
- Efficient scrolling with virtualization (ScrollArea)

## Development Tools

### ESLint Configuration
- React hooks rules
- TypeScript checking
- Import organization
- Code quality standards

### Build Process
- Fast Vite bundler
- TypeScript compilation
- Asset optimization
- Source map generation

## Integration

### Backend Communication
- PyWebView API bridge
- Type-safe interfaces
- Error handling
- Event streaming

### OpenCode Integration
- Provider and model discovery
- Session management
- Message handling
- Tool execution display

## Future Enhancements

Potential improvements:
- File upload and attachment support
- Code syntax highlighting
- Export functionality
- Plugin system
- Advanced search
- Custom themes
- Keyboard shortcuts
- Voice input support
