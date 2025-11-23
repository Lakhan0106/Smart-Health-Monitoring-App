import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('Missing Gemini API key. Please check your .env file.');
}

// Debug: Check if API key is loaded (remove this after testing)
console.log('Gemini API Key loaded:', apiKey ? 'YES' : 'NOT FOUND');

const genAI = new GoogleGenerativeAI(apiKey);

// Fallback model configuration in case models are not available
const FALLBACK_MODELS = [
  'gemini-2.5-flash',
  // 'gemini-1.5-pro',
  // 'gemini-pro',
  'text-bison-001',  // PaLM model as fallback
  'chat-bison-001'   // PaLM chat model as fallback
];

let currentModelIndex = 0;

const createModelWithFallback = (modelName: string, config: any) => {
  try {
    console.log(`Trying model: ${modelName}`);
    return genAI.getGenerativeModel({
      model: modelName,
      generationConfig: config,
    });
  } catch (error) {
    console.warn(`Model ${modelName} not available, trying fallback...`);
    if (currentModelIndex < FALLBACK_MODELS.length - 1) {
      currentModelIndex++;
      return createModelWithFallback(FALLBACK_MODELS[currentModelIndex], config);
    }
    console.error('All fallback models failed:', error);
    throw new Error(`All Gemini models unavailable. Available models: ${FALLBACK_MODELS.join(', ')}`);
  }
};

export const doctorBotModel = createModelWithFallback('gemini-2.5-flash', {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
});

export const symptomCheckerModel = createModelWithFallback('gemini-2.5-flash', {
  temperature: 0.5,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
});

// Function to check available models (for debugging)
export async function checkAvailableModels() {
  try {
    console.log('Current model configuration:', {
      doctorBotModel: 'gemini-2.5-flash',
      symptomCheckerModel: 'gemini-2.5-flash',
      fallbackModels: FALLBACK_MODELS
    });
    return FALLBACK_MODELS;
  } catch (error) {
    console.error('Error checking available models:', error);
    return [];
  }
}

export async function chatWithDoctor(message: string, language: 'en' | 'hi' = 'en') {
  try {
    const languagePrompt = language === 'hi'
      ? 'कृपया हिंदी में उत्तर दें।'
      : 'Please respond in English.';

    const systemPrompt = `You are a compassionate and knowledgeable medical doctor assistant.
    Provide helpful, accurate medical information while being empathetic and professional.
    Always recommend consulting with a real healthcare provider for serious concerns.
    ${languagePrompt}`;

    const chat = doctorBotModel.startChat({
      history: [],
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Handle specific model errors
    if (error.message?.includes('models/gemini-2.5-flash is not found') ||
        error.message?.includes('gemini-2.5-flash is not found') ||
        error.message?.includes('models/gemini-1.5-pro is not found') ||
        error.message?.includes('gemini-1.5-pro is not found') ||
        error.message?.includes('models/gemini-pro is not found') ||
        error.message?.includes('gemini-pro is not found') ||
        error.message?.includes('models/gemini-1.0-pro is not found') ||
        error.message?.includes('gemini-1.0-pro is not found') ||
        error.message?.includes('All Gemini models unavailable')) {
      throw new Error('Gemini models not available with your API key. Please check your API key permissions in Google AI Studio or try a different API key.');
    }

    if (error.message?.includes('API key')) {
      throw new Error('Invalid Gemini API key. Please check your .env file and get a valid key from Google AI Studio.');
    }

    if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
    }

    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection and API key validity.');
    }

    throw error;
  }
}

export interface SymptomAnalysis {
  severity: 'Mild' | 'Moderate' | 'Severe';
  matchPercentages: {
    mild: number;
    moderate: number;
    severe: number;
  };
  possibleConditions: string[];
  recommendations: string[];
  explanation: string;
}

export async function analyzeSymptoms(symptoms: string, language: 'en' | 'hi' = 'en'): Promise<SymptomAnalysis> {
  const languagePrompt = language === 'hi' 
    ? 'कृपया हिंदी में उत्तर दें।' 
    : 'Please respond in English.';
  
  const prompt = `As a medical AI assistant, analyze the following symptoms and provide a structured response.
  ${languagePrompt}

  Symptoms: ${symptoms}

  Please provide ONLY a valid JSON response with this exact structure:
  {
    "severity": "Mild|Moderate|Severe",
    "matchPercentages": {
      "mild": number,
      "moderate": number,
      "severe": number
    },
    "possibleConditions": ["condition1", "condition2", ...],
    "recommendations": ["recommendation1", "recommendation2", ...],
    "explanation": "brief explanation"
  }

  IMPORTANT: Return ONLY the JSON object, no additional text, explanations, or markdown formatting.`;

  try {
    const result = await symptomCheckerModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini response length:', text.length);
    console.log('Response preview:', text.substring(0, 200) + '...');

    // Extract JSON from response with better error handling
    const extractJSON = (text: string): any => {
      try {
        // First try to find JSON between curly braces
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          // Clean up the JSON string - remove any trailing commas or extra characters
          const cleanedJson = jsonString.replace(/,(\s*[}\]])/g, '$1');
          return JSON.parse(cleanedJson);
        }
      } catch (error) {
        console.warn('Primary JSON extraction failed:', error);
      }

      // Fallback: try to find JSON-like structure
      try {
        // Look for JSON-like patterns with proper structure
        const jsonPatterns = [
          /"severity":\s*"[^"]*"/,
          /"matchPercentages":\s*{[^}]*}/,
          /"possibleConditions":\s*\[[^\]]*\]/,
          /"recommendations":\s*\[[^\]]*\]/,
          /"explanation":\s*"[^"]*"/
        ];

        if (jsonPatterns.every(pattern => text.match(pattern))) {
          // If the text contains all required JSON fields, try to parse it as JSON
          return JSON.parse(text.trim());
        }
      } catch (error) {
        console.warn('Fallback JSON extraction failed:', error);
      }

      return null;
    };

    const extractedJSON = extractJSON(text);
    if (extractedJSON) {
      return extractedJSON;
    }

    // Fallback if JSON parsing fails
    return {
      severity: 'Moderate',
      matchPercentages: { mild: 30, moderate: 50, severe: 20 },
      possibleConditions: ['Please consult a healthcare provider for accurate diagnosis'],
      recommendations: ['Seek medical attention', 'Monitor symptoms'],
      explanation: text,
    };
  } catch (error: unknown) {
    console.error('Error calling Gemini API for symptom analysis:', error);

    // Handle specific API errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('timeout') || errorMessage.includes('Failed to fetch')) {
      throw new Error('API request timed out. Please try again.');
    }

    if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    }

    // Return fallback response for other errors
    return {
      severity: 'Moderate',
      matchPercentages: { mild: 30, moderate: 50, severe: 20 },
      possibleConditions: ['Unable to analyze symptoms due to API error'],
      recommendations: ['Please consult a healthcare provider', 'Try again later'],
      explanation: 'There was an error processing your request. Please try again.',
    };
  }
}
