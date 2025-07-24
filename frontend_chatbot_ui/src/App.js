import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Accent/Primary/Secondary colors from requirements
const ACCENT = "#f59e42";
const PRIMARY = "#2563eb";
const SECONDARY = "#64748b";

// PUBLIC_INTERFACE
/**
 * Chatbot main application for OpenAI Markdown chat.
 * Features persistent header, fixed chat window, collapsible settings sidebar,
 * message history, markdown chat bubbles, file upload for knowledge base (markdown),
 * configuration in settings, and a light/dark theme toggle.
 */
function App() {
  // State setup
  const [theme, setTheme] = useState("light");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! 👋 I'm your markdown knowledge chatbot. Upload a markdown file or start chatting.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [markdownKb, setMarkdownKb] = useState(null);
  const [chatConfig, setChatConfig] = useState({
    temperature: 0.7,
    max_tokens: 800,
    system_prompt: "",
  });
  const fileInputRef = useRef();

  // Persist theme to localStorage and apply to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  // Scroll to latest message
  const chatEndRef = useRef();
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, settingsOpen]);

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  // PUBLIC_INTERFACE
  function handleInputChange(e) {
    setInput(e.target.value);
  }

  // PUBLIC_INTERFACE
  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    handleBotReply([...messages, userMsg]);
  }

  // PUBLIC_INTERFACE
  // Simulate sending to backend & OpenAI API; in production, make API call via a backend
  async function handleBotReply(newMessages) {
    setIsLoading(true);
    // Compose history for OpenAI, using KB/system prompt if available
    const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    let prompt = chatConfig.system_prompt;
    if (markdownKb) prompt += "\nKnowledge Base:\n" + markdownKb;
    // Format conversation as history
    const userMsgs = newMessages
      .filter((msg) => msg.role !== "assistant")
      .map((msg) => msg.content)
      .join("\n");
    const finalPrompt = [prompt, userMsgs].filter(Boolean).join("\n\n");
    // Use fetch if API key exists; simulate if not
    let reply = "";
    try {
      if (openaiApiKey) {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              ...(prompt ? [{ role: "system", content: prompt }] : []),
              ...newMessages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
            ],
            temperature: chatConfig.temperature,
            max_tokens: chatConfig.max_tokens,
          }),
        });
        const data = await response.json();
        reply =
          data.choices?.[0]?.message?.content ||
          "Sorry, I could not retrieve a response from the model.";
      } else {
        // Mock fallback if no API key is present
        reply =
          "👋 This would call the OpenAI API to answer using your uploaded markdown file as a knowledge base. (No API key set: please configure it in Settings or via REACT_APP_OPENAI_API_KEY)";
      }
    } catch (e) {
      reply = "⚠️ Error talking to OpenAI API: " + e.message;
    }
    setMessages((msgs) => [
      ...msgs,
      {
        role: "assistant",
        content: reply,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setIsLoading(false);
  }

  // PUBLIC_INTERFACE
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".md")) {
      alert("Please upload a markdown (.md) file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setMarkdownKb(text);
      setMessages((msgs) => [
        ...msgs,
        {
          role: "assistant",
          content: `📂 Uploaded markdown knowledge base: **${file.name}**`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-upload
  }

  // PUBLIC_INTERFACE
  function handleConfigChange(e) {
    const { name, value } = e.target;
    setChatConfig((c) => ({
      ...c,
      [name]: name === "temperature" || name === "max_tokens" ? Number(value) : value,
    }));
  }

  // PUBLIC_INTERFACE
  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content: "Hi! 👋 I'm your markdown knowledge chatbot. Upload a markdown file or start chatting.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }

  // PUBLIC_INTERFACE
  // Very simple (safe) markdown rendering
  function renderMarkdown(md) {
    // Only bold, italics, code, and links
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, "<br/>");
    return { __html: html };
  }

  // PUBLIC_INTERFACE
  function handleSidebarToggle() {
    setSettingsOpen((v) => !v);
  }

  // --- RENDER ---
  return (
    <div className={`chatbot-ui-root${settingsOpen ? " settings-open" : ""}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-title">
            <span style={{ color: ACCENT, fontWeight: 700 }}>
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" style={{ marginRight: 8, verticalAlign: "middle" }}>
                <circle cx="50" cy="50" r="38" fill={ACCENT} opacity="0.15"/>
                <circle cx="50" cy="50" r="32" fill={PRIMARY} opacity="0.7"/>
                <text x="50%" y="55%" textAnchor="middle" fill="#fff" fontSize="24px" fontWeight="bold" fontFamily="Arial" dy=".3em">💬</text>
              </svg>
              Markdown Chatbot
            </span>
          </span>
        </div>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
            {theme === "light" ? "🌙" : "☀️"} Theme
          </button>
          <button className="settings-toggle-btn" onClick={handleSidebarToggle} aria-label="Open settings">
            <svg width="24" height="24" fill={SECONDARY}><circle cx="12" cy="12" r="10" stroke="none" fill={SECONDARY} opacity="0.1"/><path d="M12 8v4l3 2" stroke={SECONDARY} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
            Settings
          </button>
        </div>
      </header>

      {/* Settings Sidebar */}
      <aside className={`settings-sidebar${settingsOpen ? " open" : ""}`}>
        <div className="settings-header">
          <span className="settings-title">⚙️ Chatbot Settings</span>
          <button className="settings-close-btn" onClick={handleSidebarToggle} aria-label="Close settings">&times;</button>
        </div>
        <div className="settings-body">
          <div className="setting-group">
            <label>OpenAI API Key</label>
            <input
              type="password"
              name="openai_key"
              autoComplete="off"
              value={process.env.REACT_APP_OPENAI_API_KEY || ""}
              placeholder="From REACT_APP_OPENAI_API_KEY"
              disabled
              style={{ background: "#eee", color: "#888" }}
            />
            <small>Set as <code>REACT_APP_OPENAI_API_KEY</code> in your <b>.env</b></small>
          </div>
          <div className="setting-group">
            <label>System prompt</label>
            <textarea
              name="system_prompt"
              value={chatConfig.system_prompt}
              onChange={handleConfigChange}
              placeholder="Instructions for the assistant"
              rows={2}
            />
          </div>
          <div className="setting-group">
            <label>Temperature: <b>{chatConfig.temperature}</b></label>
            <input
              type="range"
              name="temperature"
              min="0"
              max="1"
              step="0.01"
              value={chatConfig.temperature}
              onChange={handleConfigChange}
            />
          </div>
          <div className="setting-group">
            <label>Max tokens: <b>{chatConfig.max_tokens}</b></label>
            <input
              type="number"
              name="max_tokens"
              min="64"
              max="2048"
              step="32"
              value={chatConfig.max_tokens}
              onChange={handleConfigChange}
            />
          </div>
          <div className="setting-group">
            <label>Knowledge base (.md):</label>
            <input
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <small>{markdownKb ? <span>✅ Knowledge loaded</span> : "Upload a local markdown file."}</small>
          </div>
          <div className="setting-group" style={{ marginTop: 32 }}>
            <button className="clear-chat-btn" onClick={clearChat}>Clear Chat</button>
          </div>
        </div>
      </aside>

      {/* Main Content: Chat Window */}
      <main className="chat-main-window">
        <div className="chat-message-list" id="chat-messages">
          {messages.map((msg, idx) => (
            <div
              className={`chat-bubble ${msg.role === "assistant" ? "assistant" : "user"}`}
              key={idx}
            >
              <div className="msg-content" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
              <div className="msg-meta">{msg.role === "assistant" ? "Bot" : "You"} · <span>{msg.timestamp}</span></div>
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble assistant loading">
              <div className="msg-content"><span className="dot"></span> <span className="dot"></span> <span className="dot"></span></div>
              <div className="msg-meta">Bot</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <form className="chat-input-form" onSubmit={handleSend} autoComplete="off">
          <textarea
            className="chat-input"
            placeholder="Type your message and hit Enter…"
            value={input}
            autoFocus
            rows={1}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSend(e);
            }}
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button className="send-btn" type="submit" disabled={!input || isLoading}>
            Send
          </button>
        </form>
      </main>
      {/* Blurred overlay when settings is open on mobile */}
      {settingsOpen && <div className="sidebar-overlay" onClick={handleSidebarToggle}></div>}
    </div>
  );
}

export default App;
