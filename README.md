# ✨ Clarity

**Turn ChatGPT conversations into structured insights and interactive mind maps.**

---

## 📺 Product Demo

> [!IMPORTANT]
> **Check out the live demo and walkthrough on X:**
> ### [🚀 Watch Clarity in Action](https://x.com/ankitzm/status/2013125015970173385?s=20)
> *Follow the link above to see the full video demonstration of the mind map generation and AI analysis.*

---

Clarity is a high-performance analyzer that fetches data from ChatGPT share links, processes it through advanced LLMs via OpenRouter, and generates interactive visual representations of your discussions.

---

## 🏗️ Architecture

Clarity is built with a decoupled **Client-Server-Agent** architecture:

- **Intelligence Layer**: Leverages OpenRouter (Xiaomi Mimo/Flash) to perform multi-stage analysis and structural JSON generation for visualizations.
- **Scraping Engine**: A headless Puppeteer instance that bypasses complex web barriers to extract clean conversation data from ChatGPT share links.
- **Frontend Core**: A Vite-powered React application using **React Flow** for dynamic mind mapping and **Tailwind CSS** for a premium glassmorphic UI.
- **Backend API**: An Express.js server that orchestrates the flow between the scraper, the AI, and the frontend.

---

## 🚀 Key Features

- **🔗 Share Link Fetching**: Instant extraction of ChatGPT conversations via URL.
- **🧠 AI Multi-Analysis**: Generate Summaries, Insights, Action Items, Sentiment Analysis, and Q&A from raw chats.
- **🗺️ Interactive Mind Maps**: Visual hierarchical maps of your conversations with auto-layouting (Dagre).
- **🎨 Premium UI**: Modern glassmorphic design system with dark/light mode support.
- **⚡ Real-time Streaming**: AI analysis is streamed to the UI for immediate feedback.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite** (Build Tool)
- **React Flow** (Visualization)
- **Tailwind CSS** (Styling)
- **Framer Motion** (Animations)

### Backend
- **Node.js** + **Express**
- **Puppeteer** (Headless Scraping)
- **OpenRouter SDK** (AI Orchestration)

---

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v20+)
- OpenRouter API Key

### 2. Environment Setup
Create a `.env.local` file in the root:
```env
OPENROUTER_API_KEY=your_key_here
```

### 3. Installation & Development
```bash
# Install dependencies
npm install

# Start both Frontend and Backend concurrently
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧩 How It Works

1. **Input**: User provides a ChatGPT share link.
2. **Fetch**: Puppeteer launches headlessly, extracts message content, and handles hydration.
3. **Analyze**: The server sends the text to OpenRouter with specialized prompts for different analysis types.
4. **Visualize**: A final pass synthesizes all analysis into a hierarchical JSON structure.
5. **Render**: React Flow consumes the JSON and renders an interactive, auto-layouted mind map.

---

Built with ❤️ for clarity of thought.
