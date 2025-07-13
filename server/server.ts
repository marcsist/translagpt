import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

// Load environment variables from .env.local (and .env as fallback)
config({ path: '.env.local' });
config({ path: '.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google AI
const apiKey = process.env.VITE_GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.error('❌ VITE_GOOGLE_AI_API_KEY not found in environment variables');
  console.error('Please create a .env.local file with your Google AI API key');
  process.exit(1);
}

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
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage }: TranslationRequest = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create the translation prompt
    let prompt: string;
    if (sourceLanguage === 'auto') {
      prompt = `Translate the following text to ${getLanguageName(targetLanguage)}. Only return the translated text, nothing else:\n\n${text}`;
    } else {
      prompt = `Translate the following text from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}. Only return the translated text, nothing else:\n\n${text}`;
    }

    // Generate the translation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    res.json({ 
      translatedText,
      sourceLanguage,
      targetLanguage 
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure to set your VITE_GOOGLE_AI_API_KEY environment variable');
});