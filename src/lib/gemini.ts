import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getAIInsight(userData: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        أنت مساعد حياة ذكي يسمى "وقت AI". بناءً على البيانات التالية للمستخدم:
        ${JSON.stringify(userData)}
        قمت بتحليل حالته اليوم. أعط نصيحة واحدة وموجزة جداً (بحدود 20 كلمة) للمستخدم باللغة العربية تشجعه أو تنبهه لشيء مهم في حياته (صحة، مال، دين، أو وقت).
        النصيحة يجب أن تكون بلهجة محفزة وذكية.
      `,
    });

    return response.text || "واصل إنجازاتك اليوم! تذكر أن كل دقيقة محسوبة في رحلة نجاحك.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "واصل إنجازاتك اليوم! تذكر أن كل دقيقة محسوبة في رحلة نجاحك.";
  }
}
