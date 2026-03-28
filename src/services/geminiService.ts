import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const geminiService = {
  async generateCaption(animalType: string, tags: string[]) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `ペットの写真のための、短くて可愛らしく、魅力的なSNSキャプションを生成してください。
        動物の種類: ${animalType}。タグ: ${tags.join(', ')}。
        15語（日本語なら30文字程度）以内で、1〜2個の絵文字を含めてください。`,
      });
      return response.text?.trim() || "この子を見て！ 🐾";
    } catch (error) {
      console.error("Error generating caption:", error);
      return "私の可愛いペット！ 🐾";
    }
  },

  async getFunFact(animalType: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${animalType}に関する、楽しくて驚くような短い「知っていましたか？」という豆知識を教えてください。
        1〜2文で、親しみやすく教育的な内容にしてください。`,
      });
      return response.text?.trim() || "ペットは私たちの生活にたくさんの喜びをもたらしてくれます！";
    } catch (error) {
      console.error("Error getting fun fact:", error);
      return "ペットは人間のストレスレベルを下げることができるって知っていましたか？";
    }
  },

  async askPetQuestion(question: string) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `あなたはPetMogコミュニティの、親切でフレンドリーなペットケアアシスタントです。
        この質問に簡潔に、温かく答えてください: ${question}。
        もし医療上の緊急事態であれば、必ず獣医師に相談するようアドバイスしてください。`,
      });
      return response.text?.trim() || "よくわかりませんが、具体的なアドバイスについては常に獣医師に相談することをお勧めします！";
    } catch (error) {
      console.error("Error asking AI:", error);
      return "現在接続に問題があります。後でもう一度お試しください！";
    }
  }
};
