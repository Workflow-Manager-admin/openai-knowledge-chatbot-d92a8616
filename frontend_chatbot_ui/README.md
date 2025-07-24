# React Markdown Knowledge Chatbot Frontend

A modern SPA frontend for an OpenAI-powered chatbot using a local markdown file as a knowledge base.

## Features

- **Chat interface** with message history, Markdown-formatted chat bubbles
- **Upload a local markdown (.md) file** as knowledge base
- **Settings panel** for chatbot configuration (OpenAI config, temperature, tokens, prompt, file upload)
- **Theming**: light/dark toggle, persistent across reloads
- **Single-page, responsive, minimal, stylish**
- Uses color scheme:
  - **Accent:** #f59e42
  - **Primary:** #2563eb
  - **Secondary:** #64748b

## Environment Variables

- `REACT_APP_OPENAI_API_KEY`: The OpenAI API key.  
  Set this in `.env` at project root, e.g.:
  ```
  REACT_APP_OPENAI_API_KEY=your-openai-api-key-here
  ```

## Development

- `npm install`
- `npm start`
- Visit [http://localhost:3000](http://localhost:3000)

---
