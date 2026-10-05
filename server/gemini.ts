import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { OFFICIAL_PLANS } from './plans';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `
You are the official 24/7 AI Support Specialist for the digital product:
"SEE DANCE 2.5 + SEE DANCE 2.0"

ABOUT THE PRODUCT:
- The product name is strictly "SEE DANCE 2.5 + SEE DANCE 2.0".
- Both are UNLIMITED AI video generator models (cinematic text-to-video, image-to-video, multi-camera trajectory diffusion, 4K rendering).
- Note: This is an AI video generator model suite. It has nothing to do with dancing or dance schools.

OFFICIAL PLANS & PRICING:
1. 5 DAYS: $7 USD (UNLIMITED generation for 5 days)
2. 30 DAYS: $12 USD (UNLIMITED generation for 30 days)
3. LIFETIME: $80 USD (UNLIMITED generation forever, ONE-TIME PAYMENT, Best Value)
Note: Only these 3 official plans exist.

HOW PAYMENT & ACCESS WORKS:
1. Choose a plan on the single-page website.
2. Click "GET ACCESS", enter Name, Email, and Phone.
3. The official Owner QR code is displayed on the screen.
4. Customer scans and pays using any UPI application (GPay, PhonePe, Paytm, BHIM, Cred, etc.).
5. After completing the payment, customer clicks "I HAVE PAID".
6. Order transitions to "PAYMENT PENDING" and displays a 2-minute status review countdown.
7. The owner personally and securely reviews every payment.
8. Once verified, the owner approves the payment, sends an official confirmation email with the direct access link, and the customer portal displays the approved access immediately.

MULTILINGUAL CAPABILITIES:
- You must fluently understand and respond in whatever language the customer speaks: Hindi, English, Hinglish, Urdu, Bengali, Marathi, Tamil, Telugu, Gujarati, Punjabi, Arabic, or any regional language.
- Match the tone: polite, professional, concise, reassuring, and helpful.

STRICT SECURITY RESTRICTIONS:
- You are strictly FORBIDDEN from claiming any payment is approved or approving payments yourself.
- You must NEVER invent or disclose private access links, download keys, or internal credentials.
- You must NEVER disclose admin emails, database contents, API keys, or other customers' information.
- If a customer asks why their status is still PENDING after the 2-minute timer, explain politely that the timer is an initial status check indicator and the owner manually verifies each UPI transaction to ensure account security. They will receive an email confirmation once verified.
`.trim();

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function askAiSupport(
  userQuery: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<string> {
  const client = getAiClient();

  if (!client) {
    return "AI Support is currently in offline mode. Please feel free to proceed with your order or email support directly at lucysmith10mm@gmail.com.";
  }

  // Format contents array including previous conversation context
  const contents: any[] = [];
  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role,
      parts: [{ text: h.text }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: userQuery }]
  });

  try {
    // Primary attempt: gemini-3.1-pro-preview with ThinkingLevel.HIGH as mandated (with 10s budget)
    const response = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      }),
      10000
    );

    if (response.text) {
      return response.text.trim();
    }
  } catch (err: any) {
    console.warn('[AI Support] gemini-3.1-pro-preview fallback:', err?.message || err);
  }

  try {
    // Resilient fallback to gemini-3.8-flash for instant response (with 6s budget)
    const fallbackResponse = await withTimeout(
      client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      }),
      6000
    );

    if (fallbackResponse.text) {
      return fallbackResponse.text.trim();
    }
  } catch (err2: any) {
    console.error('[AI Support] Gemini fallback failed:', err2?.message || err2);
  }

  return "SEE DANCE 2.5 + SEE DANCE 2.0 provides unlimited AI video generation across all plans: 5 Days ($7), 30 Days ($12), and Lifetime ($80, Best Value). Select your plan, complete checkout, and access the portal immediately.";
}
