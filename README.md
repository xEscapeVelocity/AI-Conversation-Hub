# Council. 

**Council.** is an open-source, serverless, multi-LLM group chat application designed to let you talk to multiple AI agents simultaneously. Have debates, get consensus, or collaborate with custom AI configurations.

![Council Interface Mockup](client/public/favicon.svg)

---

##  Features

- **Consensus Group Chat:** Talk to multiple custom AI agents at the same time in one unified chat window.
- **Privacy First (Serverless):** Your API keys, chat history, and settings are saved locally in your browser or desktop sandbox. No servers, no tracking.
- **Frutiger Aero Glass Theme:** A gorgeous glassmorphism layout with morphing background gradient orbs, alternating glossy/matte text bubbles, and 12 vibrant accent colors.
- **AI Presets Catalog:** Quickly apply templates for popular AI providers (Gemini, ChatGPT, Claude, OpenRouter, DeepSeek, Groq, Mistral, and local Ollama/LM Studio models).
- **Auto-Discovery for Ollama:** Instantly scan and import your local Ollama models.
- **Credit Saver Mode:** Automatically minifies code blocks and older texts in API prompts to save your tokens.
- **Workspace Backups:** Easily export or import your entire workspace (chats, custom configurations, and settings) in a single JSON backup.

---

## Downloads (Desktop & Mobile)

You can download the standalone applications from the **[Releases](https://github.com/xEscapeVelocity/AI-Conversation-Hub/releases)** page:

### Windows (.exe)
1. Download the latest **`Council_1.3.x_x64-setup.exe`** installer.
2. Double-click the installer and complete the setup.
3. Open **Council.** from your desktop or start menu and start chatting!

### Android (.apk)
1. Download the latest **`app-debug.apk`** package.
2. Send it to your phone and install it (make sure to allow installation from unknown sources).
3. Open **Council** from your launcher.

---

##  Local Development

If you'd like to run the code locally or modify it:

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Rust](https://rustup.rs/) (only required for local Tauri desktop builds)

### Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/xEscapeVelocity/AI-Conversation-Hub.git
   cd AI-Conversation-Hub
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development web server:
   ```bash
   npm run dev
   ```
4. Build the web app:
   ```bash
   npm run build
   ```
5. Run the Tauri desktop dev environment:
   ```bash
   npm run tauri dev
   ```
6. Build the desktop installer locally:
   ```bash
   npm run tauri build
   ```

---

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## Security & Privacy Disclaimer

**Council.** is a 100% client-side, serverless application. 
- **Your Keys are Safe:** All API keys, settings, and chat logs are stored directly inside your browser's local sandbox (`localStorage`) or the desktop/mobile equivalent.
- **Direct Connection:** The app communicates directly with the respective AI providers (Google, OpenAI, OpenRouter, etc.). Your credentials and data are never sent to, stored on, or shared with any third-party servers.
- **Unofficial Interface:** This is an independent, unofficial open-source tool. Brand names and trademarks belong to their respective owners.

---

## Development

Council was conceived, designed, specified, tested, and iteratively improved by the author.

The application was developed using AI-assisted workflows with Replit and Antigravity. AI tools were used to accelerate implementation, while product direction, feature selection, system design decisions, testing, debugging, and overall project ownership remained with the project author.

---

## Author

GitHub: https://github.com/xEscapeVelocity
