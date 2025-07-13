import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

// Load environment variables from .env.local (and .env as fallback)
console.log('🔍 Loading environment variables...');
config({ path: '.env.local' });
config({ path: '.env' });

console.log('🔍 Available environment variables:', {
  hasViteKey: !!process.env.VITE_GOOGLE_AI_API_KEY,
  keyLength: process.env.VITE_GOOGLE_AI_API_KEY?.length || 0,
  keyPreview: process.env.VITE_GOOGLE_AI_API_KEY ? 
    process.env.VITE_GOOGLE_AI_API_KEY.substring(0, 10) + '...' : 'NOT_FOUND'
});

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google AI
const apiKey = process.env.VITE_GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ VITE_GOOGLE_AI_API_KEY not found in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('API')));
  console.error('Please create a .env.local file with your Google AI API key');
  process.exit(1);
}

console.log('✅ API key found, initializing Google AI...');
const genAI = new GoogleGenerativeAI(apiKey);

// Add a simple root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Translation API Server is running',
    endpoints: {
      'POST /api/translate': 'Translate text using Google AI'
    }
  });
});

interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  model?: string;
}

// Function to detect if text contains markdown
function containsMarkdown(text: string): boolean {
  const markdownPatterns = [
    /#{1,6}\s+/, // Headers
    /\*\*.*\*\*/, // Bold
    /\*.*\*/, // Italic
    /`.*`/, // Inline code
    /```[\s\S]*```/, // Code blocks
    /\[.*\]\(.*\)/, // Links
    /!\[.*\]\(.*\)/, // Images
    /^\s*[-*+]\s+/m, // Unordered lists
    /^\s*\d+\.\s+/m, // Ordered lists
    /^\s*>\s+/m, // Blockquotes
    /\|.*\|/, // Tables
    /---+/, // Horizontal rules
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage, model = 'gemini-1.5-flash' }: TranslationRequest = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Get the generative model
    const generativeModel = genAI.getGenerativeModel({ model });

    // Check if the text contains markdown
    const hasMarkdown = containsMarkdown(text);

    // Create the translation prompt
    let prompt: string;
    if (sourceLanguage === 'auto') {
      if (hasMarkdown) {
        prompt = `Translate the following markdown text to ${getLanguageName(targetLanguage)}. IMPORTANT: Preserve all markdown formatting (headers, bold, italic, links, lists, code blocks, etc.) in the translation. Only translate the actual text content, keep all markdown syntax intact. Return only the translated text with preserved markdown formatting:\n\n${text}`;
      } else {
        prompt = `Translate the following text to ${getLanguageName(targetLanguage)}. Only return the translated text, nothing else:\n\n${text}`;
      }
    } else {
      if (hasMarkdown) {
        prompt = `Translate the following markdown text from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}. IMPORTANT: Preserve all markdown formatting (headers, bold, italic, links, lists, code blocks, etc.) in the translation. Only translate the actual text content, keep all markdown syntax intact. Return only the translated text with preserved markdown formatting:\n\n${text}`;
      } else {
        prompt = `Translate the following text from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}. Only return the translated text, nothing else:\n\n${text}`;
      }
    }

    // Generate the translation
    const result = await generativeModel.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    res.json({ 
      translatedText,
      sourceLanguage,
      targetLanguage,
      model
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed. Please check your API key and try again.' 
    });
  }
});

// Helper function to get language names
function getLanguageName(code: string): string {
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish', 
    'fr': 'French',
    'de': 'German',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ru': 'Russian',
    'ko': 'Korean',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'pa': 'Punjabi',
    'vi': 'Vietnamese',
    'tr': 'Turkish',
    'fa': 'Persian',
    'nl': 'Dutch',
    'pl': 'Polish'
  };
  
  return languageMap[code] || code;
}

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('✅ Translation API Server ready to accept requests');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});