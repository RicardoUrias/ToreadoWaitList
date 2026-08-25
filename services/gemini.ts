import { GoogleGenAI } from "@google/genai";

const apiKey =
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateWelcomeMessage = async (customerName: string, waitTimeMinutes: number): Promise<string> => {
  if (!ai) {
    return `Hola ${customerName}, tu mesa en la Taquería está lista. ¡Gracias por esperar!`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe un mensaje de texto (SMS) corto, divertido y muy mexicano para avisar a un cliente llamado "${customerName}" que su mesa en la taquería ya está lista. Han esperado ${waitTimeMinutes} minutos. Usa emojis de tacos. Máximo 160 caracteres.`,
    });
    return (response.text ?? '').trim();
  } catch (error) {
    console.error("Error generating AI message:", error);
    return `Hola ${customerName}, tu mesa está lista. ¡Gracias por tu paciencia! 🌮`;
  }
};
