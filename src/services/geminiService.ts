import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
}

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<TranslationResult> {
  if (!text.trim()) return { translatedText: "" };

  const systemInstruction = `You are a professional translator. 
Translate the provided text into ${targetLanguage}. 
${sourceLanguage === "auto" ? "Detect the source language automatically." : `The source language is ${sourceLanguage}.`}
Maintain the original tone, style, and formatting. 
If the text is already in the target language, return it as is.
Provide ONLY the translated text, no explanations or extra comments.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: text,
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temperature for more accurate translation
      },
    });

    return {
      translatedText: response.text || "Translation failed.",
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text. Please try again.");
  }
}
