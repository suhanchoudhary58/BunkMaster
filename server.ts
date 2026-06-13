import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Timetable Scanner Route
app.post('/api/scan-timetable', async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'No image or PDF data provided.' });
    }

    const systemPrompt = `You are BunkMaster's AI Timetable Scanner. Analyzes the provided screenshot/image of an academic timetable or calendar.
Extract the schedule details: Subjects, Days, Time Slots, Rooms, and Faculty Teachers.

You MUST respond strictly with a valid JSON object matching this structure:
{
  "subjects": [
    { "name": "Physics", "code": "PHY-101" },
    { "name": "Mathematics", "code": "MTH-201" }
  ],
  "timetable": [
    {
      "subjectName": "Physics",
      "day": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "room": "Room 303",
      "teacher": "Dr. Smith"
    }
  ]
}

Guidance:
1. Ensure the "day" field is one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
2. Ensure startTime and endTime are in HH:MM format (24-hour style if possible, e.g., 09:00, 14:15, or standard 12-hour AM/PM normalized to 24h, like 1:30 PM is 13:30).
3. If code, room, or teacher is not readable, choose a reasonable clean mock/fallback or leave it blank.
4. Respond with ONLY the clean JSON block. Do not include markdown wraps or explanations.`;

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    let jsonResultText = '';
    let successProvider = '';

    if (openRouterKey && openRouterKey !== 'MY_OPENROUTER_API_KEY' && openRouterKey.trim() !== '') {
      console.log('Attempting OpenRouter extraction...');
      try {
        // Prepare OpenRouter content payload
        // OpenRouter accepts base64 images in OpenAI format
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash', // Using a powerful, fast, Free OpenRouter model
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: systemPrompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${mimeType || 'image/jpeg'};base64,${fileData}`
                    }
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter HTTP status ${response.status}: ${errText}`);
        }

        const resData = await response.json();
        jsonResultText = resData?.choices?.[0]?.message?.content || '';
        successProvider = 'openrouter';
      } catch (orError: any) {
        console.warn('OpenRouter failed, attempting fallback to local Gemini client...', orError?.message);
      }
    }

    // Fallback to local Gemini client if OpenRouter is not set or fails
    if (!jsonResultText) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error('No API Keys available (both OPENROUTER_API_KEY and GEMINI_API_KEY are missing).');
      }

      console.log('Running fallback Gemini extraction via @google/genai...');
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: fileData,
        },
      };

      const textPart = {
        text: systemPrompt,
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: 'application/json'
        }
      });

      jsonResultText = response.text || '';
      successProvider = 'gemini-fallback';
    }

    // Clean JSON wraps if model returned markdown
    let cleanJson = jsonResultText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    const parsedData = JSON.parse(cleanJson);
    return res.json({
      success: true,
      provider: successProvider,
      data: parsedData
    });

  } catch (error: any) {
    console.error('Scan Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Timetable extraction failed. Please try a clearer screenshot or enter manually.'
    });
  }
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Mounted Vite developer middleware.');
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving Compiled Production assets from dist/.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BunkMaster full-stack server listening on http://localhost:${PORT}`);
  });
}

startServer();
