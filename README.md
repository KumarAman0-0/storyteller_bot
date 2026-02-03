# Storyteller Bot 📚✨

A premium, interactive web application that reads your PDF files aloud using realistic AI voices. It features a "Smart Mode" that uses Google Gemini to identify characters (Men, Women, Children, Old People) and dynamically switches ElevenLabs voices to match the speaker!

**Now featuring Version 2.0: The Immersion Update!** 🌟

![Storyteller Bot Interface](https://via.placeholder.com/800x450?text=Storyteller+Bot+Preview)
*(Replace with actual screenshot if available)*

## Features

### 🧠 Smart & AI-Powered
- **Smart Character Recognition (Beta)**:
  - Uses **Google Gemini AI** to analyze the story text.
  - Identifies who is speaking: `Narrator`, `Man`, `Woman`, `Child`, `Old Man`.
  - Automatically switches voices to match the character!
- **✨ AI Text Cleaning**:
  - Automatically fixes broken words, OCR errors, and format issues.

### 🌟 Immersion (New in v2.0)
- **🎵 Immersive Soundscapes**: 
  - The bot detects the **Mood** (Scary, Happy, Nature) and automatically plays ambient background sounds (Rain, Birds, Wind, Drones).
- **🖼️ AI Scene Illustrations**:
  - Real-time generated art (using Pollinations.ai) that visualizes the current scene as you listen.

### 🎧 Playback & Export
- **🎙️ Dual Speech Engines**:
  - **Browser Native**: Free, offline text-to-speech.
  - **ElevenLabs API**: Premium, ultra-realistic human voices.
- **💾 Audiobook Export**:
  - Download your generated narration as an **MP3 file** to listen on the go!

### 🎨 Design
- **Premium UI**: Deep space mesh gradients, glassmorphism panels, and smooth animations.

## Prerequisites

To use the full features of this bot, you will need:
1.  **Node.js** (v18 or higher) installed on your machine.
2.  **ElevenLabs API Key** (for premium voices) - [Get it here](https://elevenlabs.io/).
3.  **Google Gemini API Key** (for smart character & mood recognition) - [Get it here](https://aistudio.google.com/).

> *Note: You can still use the bot with just the Free Browser Native voices if you don't have API keys!*

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/KumarAman0-0/storyteller_bot.git
    cd storyteller_bot
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser to the local URL (usually `http://localhost:5173`).

## Configuration

To enable the AI features:

1.  Click the **Settings (Gear Icon)** in the top right corner of the app.
2.  **Enable ElevenLabs**:
    - Check "Use Premium Voices".
    - Paste your ElevenLabs API Key (`xi-...`).
3.  **Enable Smart Voices**:
    - Check "Smart Character Voices (Beta)".
    - Paste your Google Gemini API Key (`AIza...`).
4.  Click **Save**.

## Usage

1.  **Upload**: Drag and drop a PDF file (e.g., a novel or storybook) onto the upload zone.
2.  **Wait for Analysis**: If Smart Mode is on, the bot will briefly analyze the text to find characters.
3.  **Listen**: Click Play!
    - Use the **Globe Icon** to switch languages (English/Hindi) if using standard mode.
    - Use the **Restart Icon** to start over.
4.  **Save**: Click the **Download Icon** (Floppy Disk) to save the audio output (Export works best with ElevenLabs mode).

## Tech Stack

- **Frontend**: React, Vite
- **Styling**: Vanilla CSS (CSS Variables, Glassmorphism, Animations)
- **PDF Processing**: `pdfjs-dist`
- **AI/LLM**: Google Gemini API
- **TTS**: Web Speech API & ElevenLabs API
- **Image Gen**: Pollinations.ai (Free API)
- **Icons**: Lucide React

## License

MIT License. Feel free to fork and modify!
