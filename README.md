# Mars

A minimal desktop coding agent powered by OpenCode, built with Python (PyWebView) backend and React frontend.

## Overview

Mars is a desktop application that provides an AI-powered coding assistant interface. It wraps the OpenCode CLI tool in a user-friendly GUI, allowing you to have conversational coding sessions with various AI models and providers.

## Architecture

The application consists of two main components:

### Backend (Python)
- **PyWebView**: Creates a native desktop window that hosts the web frontend
- **OpenCode Integration**: Manages the OpenCode server process and communicates via HTTP API
- **Event Streaming**: Handles real-time streaming of AI responses, tool calls, and reasoning
- **Settings Management**: Persists user preferences and model selections

### Frontend (React/TypeScript)
- **Modern UI**: Built with React 19, TypeScript, and Tailwind CSS
- **shadcn/ui Components**: Clean, accessible UI components
- **Real-time Chat**: Multi-session chat interface with streaming responses
- **Model Selection**: Dynamic provider and model selection with search
- **Tool Visualization**: Interactive display of AI tool calls and reasoning steps

## Features

- 🖥️ Native desktop application using PyWebView
- 💬 Multi-session chat interface with tabbed conversations
- 🤝 Support for multiple AI providers (OpenAI, Anthropic, etc.)
- 🔄 Real-time streaming of responses, tool calls, and reasoning
- 🛠️ Interactive tool call visualization with expandable details
- 📊 Message metadata (tokens, cost, timing)
- ⚙️ Persistent settings and model preferences
- 🎨 Modern dark/light theme support

## Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- OpenCode CLI tool installed and in PATH
- At least one AI provider configured in OpenCode

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies using uv:
```bash
uv sync
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## Development

### Running the Application

1. **Start the frontend development server** (for development):
```bash
cd frontend
npm run dev
```

2. **Run the backend application**:
```bash
cd backend
python main.py
```

The PyWebView window will open and automatically connect to the frontend. In development mode, it will connect to the Vite dev server (localhost:5173). In production, it will load the built frontend files.

### Building for Production

1. **Build the frontend**:
```bash
cd frontend
npm run build
```

2. **Run the backend**:
```bash
cd backend
python main.py
```

The application will now load the production build from `frontend/dist/`.

### Build desktop app (macOS, PyInstaller)

From the repo root:

```bash
./scripts/build.sh
```

What it does:
- Installs/builds the frontend with Vite
- Copies the built `dist/` into `backend/dist/`
- Packages the app with PyInstaller (icon from `backend/assets/logo.png`)

Prerequisites:
- macOS, Python 3.10+, Node.js 18+
- OpenCode CLI available on PATH (the packaged app will run it)
- [uv](https://github.com/astral-sh/uv) installed (build script runs PyInstaller via `uv run`)

Output binary:
- `backend/build/mars`

## Project Structure

```
mars/
├── backend/
│   ├── main.py              # PyWebView entry point and MarsAPI
│   ├── opencode_client.py   # OpenCode HTTP client wrapper
│   ├── pyproject.toml       # Python project configuration
│   ├── settings.json        # User settings storage
│   └── README.md           # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatTabs.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── InputBar.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── Footer.tsx
│   │   ├── lib/           # Utilities and API
│   │   │   ├── api.ts     # PyWebView API bridge
│   │   │   └── utils.ts   # Utility functions
│   │   ├── App.tsx        # Main application component
│   │   ├── main.tsx       # React entry point
│   │   └── index.css      # Tailwind CSS styles
│   ├── package.json       # Node.js dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── components.json    # shadcn/ui configuration
└── README.md              # This file
```

## Configuration

### OpenCode Setup

Make sure you have OpenCode installed and configured with your preferred AI providers:

```bash
# Install OpenCode (if not already installed)
pip install opencode

# Configure providers (example for OpenAI)
opencode config set openai.api_key YOUR_API_KEY
```

### Application Settings

The application stores settings in `backend/settings.json`, including:
- Selected AI model and provider
- User preferences
- Session configurations

## Usage

1. **Launch the application** by running `python main.py` in the backend directory
2. **Select a model** using the dropdown in the footer
3. **Start a new chat** by clicking the "+" button or using the welcome prompt
4. **Send messages** by typing in the input bar and pressing Enter
5. **View tool calls** and reasoning by expanding the respective sections
6. **Manage sessions** using the tab interface

## API Integration

The application communicates with OpenCode through its HTTP API:

- **Server Management**: Start/stop the OpenCode server
- **Session Management**: Create, list, and delete chat sessions
- **Messaging**: Send messages and receive streaming responses
- **Events**: Real-time updates for message parts, tool calls, and metadata
- **Configuration**: Access providers, models, and project information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues related to:
- **OpenCode functionality**: Check the [OpenCode documentation](https://opencode.ai)
- **Mars application**: Create an issue in this repository
- **AI provider issues**: Check the respective provider's documentation
