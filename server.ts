import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Initialise Gemini SDK with mandatory telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialise GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiAvailable: !!aiClient,
    timestamp: new Date().toISOString(),
  });
});

// AI Request Assistant endpoint: categorise, summarise, translate & detect missing details
app.post('/api/ai/assist-request', async (req: Request, res: Response) => {
  const { title, description, sector, currentLanguage } = req.body;

  if (!description && !title) {
    return res.status(400).json({ error: 'Description or title is required.' });
  }

  if (!aiClient) {
    // Intelligent rule-based fallback when AI key is not configured
    const text = ((title || '') + ' ' + (description || '')).toLowerCase();
    let detectedCategory = 'other_request';
    if (text.includes('punch') || text.includes('clock') || text.includes('swipe') || text.includes('வருகை')) {
      detectedCategory = 'missed_clock_in_out';
    } else if (text.includes('salary') || text.includes('wage') || text.includes('pay') || text.includes('சம்பளம்')) {
      detectedCategory = 'missing_incorrect_salary';
    } else if (text.includes('overtime') || text.includes('ot') || text.includes('நேர கூடுதல்')) {
      detectedCategory = 'incorrect_overtime';
    } else if (text.includes('deduction') || text.includes('cut') || text.includes('பிடித்தம்')) {
      detectedCategory = 'incorrect_deduction_allowance';
    } else if (text.includes('hazard') || text.includes('danger') || text.includes('safety') || text.includes('பாதுகாப்பு')) {
      detectedCategory = 'workplace_safety_issue';
    }

    return res.json({
      success: true,
      mode: 'heuristic_fallback',
      category: detectedCategory,
      summary: description ? description.slice(0, 140) : title,
      missingDetails: ['Specify date, shift time and supervisor name if known.'],
      translation: '',
      urgency: text.includes('safety') || text.includes('danger') ? 'urgent' : 'normal',
      disclaimer: 'Generated via rule-based offline heuristics (AI service offline).',
    });
  }

  try {
    const prompt = `You are the FairShift AI Assistant supporting decent work (UN SDG 8) on ${sector || 'construction/manufacturing'} worksites.
A worker submitted this request:
Title: "${title || ''}"
Description: "${description || ''}"
Input Language: "${currentLanguage || 'auto'}"

Return a valid JSON object strictly matching this schema:
{
  "category": "one of: missed_clock_in_out, incorrect_attendance_hours, missing_incorrect_salary, incorrect_overtime, missing_payslip, incorrect_deduction_allowance, leave_shift_correction, profile_info_correction, missing_training_skill, workplace_safety_issue, other_request",
  "summary": "1-2 sentence neutral scannable summary",
  "missingDetails": ["list of up to 2 specific missing details that would help the manager resolve this quickly, e.g., missing time, dates, or badge number"],
  "translation": "If input is Tamil, translate to clear English. If input is English, translate to clear Tamil (தமிழ்). Otherwise provide English translation.",
  "urgency": "normal or urgent or critical"
}

Do not invent facts. The AI must never promise approval or make employment decisions.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      mode: 'gemini',
      ...parsed,
      disclaimer: 'AI-assisted analysis. Workers may review and edit before sending.',
    });
  } catch (error: any) {
    console.error('Gemini assist-request error:', error);
    return res.status(500).json({
      error: error?.message || 'AI processing failed',
      fallback: {
        category: 'other_request',
        summary: description ? description.slice(0, 120) : title,
        missingDetails: [],
        urgency: 'normal',
      },
    });
  }
});

// AI Safety Report Assistant
app.post('/api/ai/safety-assist', async (req: Request, res: Response) => {
  const { description, sector, incidentType } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  if (!aiClient) {
    return res.json({
      success: true,
      mode: 'heuristic_fallback',
      urgency: 'high',
      immediateGuidance: 'Cease work in the affected zone immediately. Report directly to site safety officer.',
      summary: description.slice(0, 140),
      translation: '',
    });
  }

  try {
    const prompt = `You are the FairShift Safety AI Assistant for industrial ${sector || 'construction/factory'} environments.
Reported incident type: "${incidentType || 'unspecified'}"
Description: "${description}"

Analyze the safety risk. Return a valid JSON object strictly matching this schema:
{
  "urgency": "immediate_danger" or "high" or "medium" or "low",
  "immediateGuidance": "1-2 sentences of immediate worker safety precautions (e.g., stop machinery, stay clear of edge, notify safety warden)",
  "summary": "Concise factual summary of the hazard",
  "suggestedHazardCategory": "scaffolding | height | electrical | machine_guarding | chemical | ppe | trip_fall | other",
  "translation": "Translate description to English if Tamil, or Tamil if English"
}
If there is imminent danger to life, set urgency to 'immediate_danger'. Never claim emergency services were automatically called.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      mode: 'gemini',
      ...parsed,
    });
  } catch (error: any) {
    console.error('Safety AI error:', error);
    return res.status(500).json({
      error: error?.message || 'Safety AI assist failed',
    });
  }
});

// AI Payslip Line-Item Explainer
app.post('/api/ai/explain-payslip', async (req: Request, res: Response) => {
  const { lineItem, amount, calculationBasis, language } = req.body;

  if (!lineItem) {
    return res.status(400).json({ error: 'lineItem is required' });
  }

  if (!aiClient) {
    return res.json({
      success: true,
      mode: 'heuristic_fallback',
      explanation: language === 'ta'
        ? `${lineItem}: இது உங்கள் வேலை ஒப்பந்தம் மற்றும் சட்டப்பூர்வ விதிகளின்படி கணக்கிடப்பட்ட அதிகாரப்பூர்வ தொகையாகும்.`
        : `${lineItem}: This amount is calculated based on verified shift attendance and statutory labor standards.`,
    });
  }

  try {
    const targetLang = language === 'ta' ? 'Tamil (தமிழ்)' : 'English';
    const prompt = `You are the FairShift Wage Transparency Assistant explaining a payslip item to a worker with limited financial literacy.
Line Item: "${lineItem}"
Amount: "${amount}"
Calculation Basis: "${calculationBasis || 'Standard rate'}"
Target Language: "${targetLang}"

Provide a simple, clear, 2-3 sentence explanation of what this item means, why it is included, and how the arithmetic works. Use simple words and high empathy.
Return valid JSON:
{
  "explanation": "Simple explanation in ${targetLang}"
}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      mode: 'gemini',
      explanation: parsed.explanation || 'Calculated in accordance with wage transparency standards.',
    });
  } catch (error: any) {
    console.error('Payslip AI explanation error:', error);
    return res.status(500).json({ error: error?.message || 'Explanation failed' });
  }
});

// Audio transcription endpoint using Gemini transcribe
app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType, language } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 is required' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'AI transcription unavailable. Please enter text manually.',
    });
  }

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const targetHint = language === 'ta' ? 'Spoken language is likely Tamil.' : 'Spoken language is English or Tamil.';
    const textPart = {
      text: `Transcribe this spoken audio accurately. ${targetHint} Return only the verbatim transcribed text in its original spoken language without additional commentary.`,
    };

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, textPart] },
    });

    return res.json({
      success: true,
      transcript: (response.text || '').trim(),
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    // Fallback: try flash model
    try {
      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      };
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: [audioPart, { text: 'Transcribe this worker voice note accurately.' }] },
      });
      return res.json({
        success: true,
        transcript: (response.text || '').trim(),
      });
    } catch (innerError: any) {
      return res.status(500).json({
        error: 'Failed to transcribe audio: ' + (innerError?.message || 'Service error'),
      });
    }
  }
});

// Text translation endpoint
app.post('/api/ai/translate', async (req: Request, res: Response) => {
  const { text, targetLanguage } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!aiClient) {
    return res.json({
      success: true,
      translatedText: text,
      notice: 'AI translation service unavailable; original text retained.',
    });
  }

  try {
    const langName = targetLanguage === 'ta' ? 'Tamil (தமிழ்)' : targetLanguage === 'en' ? 'English' : targetLanguage;
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Translate the following text accurately into ${langName}. Preserve technical, payroll, and safety terms accurately. Return only the translated text.\n\nText:\n${text}`,
    });

    return res.json({
      success: true,
      translatedText: (response.text || '').trim(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Translation failed' });
  }
});

// Set up Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FairShift server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
