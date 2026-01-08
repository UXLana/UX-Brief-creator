import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const refineText = async (text: string, context: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Senior UX Strategist. Refine the following draft text for a "${context}" section of a UX Brief. 
      Make it professional, concise, and actionable. Do not add markdown formatting like **bold** excessively.
      
      Draft Text: "${text}"`,
    });
    return response.text || text;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return text;
  }
};

export const suggestBriefQuestions = async (): Promise<{ title: string; description: string }[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 3 unique, advanced UX brief questions/sections that would help clarify a complex product feature. 
      Return strictly a JSON array of objects with "title" and "description" keys. No markdown blocks.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini suggestion failed:", error);
    return [];
  }
};