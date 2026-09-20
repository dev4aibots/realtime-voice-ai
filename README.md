# Realtime Voice AI

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

![Terminal Demo](demo.gif)

> **A low-latency, conversational voice AI system leveraging WebSockets for instant ASR to LLM to TTS streaming.**

## 🌟 Key Features
- ✅ **WebSocket-based duplex communication**
- ✅ **Sub-500ms voice-to-voice latency**
- ✅ **Interruption and vad (voice activity detection) handling**

## 🏗️ Architecture

```mermaid
flowchart LR
    A[Microphone WebSockets] -->|Audio Stream| B[ASR Engine]
    B -->|Transcript| C[LLM Reasoning]
    C -->|Response Text| D[TTS Engine]
    D -->|Audio Stream| A
```

## 🚀 Live API Endpoint (Vercel)

This project is deployed serverless via Vercel Edge Functions. You can test the interaction directly from your terminal.

```bash
# Example Request
curl -X GET https://realtime-voice-2b7vo4vtx-dev4aibots.vercel.app/api/health
```

## 💻 Developer Quickstart

### Prerequisites
- Python 3.11+
- Node.js (for Vercel CLI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dev4aibots/realtime-voice-ai.git
   cd realtime-voice-ai
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Add your API keys to .env
   ```

4. **Run Locally**
   ```bash
   npm run dev
   ```

## 📁 Project Structure
```
.
├── api/                  # Vercel serverless endpoints
├── src/                  # Core Python modules & agent logic
├── tests/                # Unit and integration tests
├── public/               # Static assets
├── requirements.txt      # Python dependencies
└── vercel.json           # Vercel routing configuration
```

## 📄 License
This project is licensed under the MIT License.
