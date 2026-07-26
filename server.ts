import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI Client lazily or safely
  const getAi = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    return new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  };

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'FOODEXA Institution API' });
  });

  // Gemini AI Endpoints
  app.post('/api/ai/generate', async (req, res) => {
    try {
      const { feature, prompt, context } = req.body;
      const ai = getAi();

      const systemPrompt = `You are FOODEXA AI, the intelligence powering the official FOODEXA Institution Platform for higher education campuses and canteens.
You provide clear, action-oriented, professional insights based on Google Gemini models.
Feature requested: ${feature || 'General Assistant'}
Current Context: ${JSON.stringify(context || {})}
Format your output cleanly in structured Markdown with concise bullet points and direct operational recommendations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `${systemPrompt}\n\nUser Request: ${prompt}`,
      });

      res.json({
        success: true,
        text: response.text || 'Analysis completed successfully.'
      });
    } catch (error: any) {
      console.error('Gemini API error:', error);
      res.status(500).json({
        success: false,
        error: error?.message || 'Failed to generate AI response. Using fallback analytics engine.'
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FOODEXA Institution Server running on http://localhost:${PORT}`);
  });
}

startServer();
