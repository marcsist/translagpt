# TranslaGPT

A modern translation interface powered by Google AI's Gemini Pro model.

## Setup

1. **Get your Google AI API key**:
   - Go to [AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Set up environment variables**:
   ```bash
   # Copy the example file to create your local environment file
   cp .env.example .env.local
   ```
   
   Then edit `.env.local` and replace `your_google_ai_api_key_here` with your actual API key.

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development environment**:
   ```bash
   npm run dev:full
   ```
   This will start both the backend server (port 3001) and the frontend (port 5173).

## Features

- **Real AI-powered translations** using Google's Gemini Pro model
- **Auto-language detection** when source language is set to "Auto-detect"
- **20+ supported languages** including English, Spanish, French, German, Chinese, Japanese, and more
- **Dark/Light mode toggle**
- **Editable translations** - click on any translation to edit it
- **Copy to clipboard** functionality
- **Responsive design** that works on desktop and mobile

## Security

- Environment variables are stored in `.env.local` which is automatically ignored by git
- API keys are never exposed to the client-side code
- All translations are processed through a secure backend server

## Development Scripts

- `npm run dev` - Start the frontend only
- `npm run dev:server` - Start the backend server only  
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/marcsist/translagpt)