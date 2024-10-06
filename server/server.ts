import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure to add your OpenAI API key in the .env file
});

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { source, sourceLanguage, targetLanguage } = req.body;

  if (!source || !targetLanguage) {
    return res.status(400).json({ error: 'Source text and target language are required.' });
  }

  try {
    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}: "${source}"`;

    // Make the API call to OpenAI for translation
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 100,
    });

    const translation = response.choices[0]?.text?.trim();

    if (!translation) {
      return res.status(500).json({ error: 'Failed to generate translation.' });
    }

    res.status(200).json({ translation });
  } catch (error) {
    console.error('Error during translation:', error);
    res.status(500).json({ error: 'An error occurred while processing the translation.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
