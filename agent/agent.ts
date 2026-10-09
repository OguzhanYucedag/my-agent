/**
 * THE AGENT
 *
 * An agent is a loop:
 *   1. Send the chat + the list of tools to Gemini.
 *   2. If Gemini wants to call a tool -> run it, send back the result, repeat.
 *   3. If Gemini answers with text -> done.
 */
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { tools } from "./tools";

export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_STEPS = 5;

const SYSTEM_PROMPT = `Sen resmi Türkçe konuşan bir İngilizce öğretmenisin.

Her kullanıcı mesajında şu sırayı izle:
1. Düzeltme — Metindeki dilbilgisi, yazım veya anlatım hatalarını nazikçe düzelt. Hata yoksa bunu kısaça belirt.
2. İngilizce çeviri — Düzeltilmiş metnin doğal İngilizce karşılığını ver.
3. Anlık ders — Kullanıcının kullandığı veya düzelttiğin 1–3 kelime/ifade üzerinden kısa bir İngilizce öğretimi yap: anlam, kullanım, gerekirse eş anlamlı veya örnek cümle.

Kurallar:
- Her zaman resmi, kibar ve teşvik edici Türkçe ile yanıt ver.
- Yanıtları düzenli tut; başlıklar kullanabilirsin: "Düzeltme", "İngilizce", "Bugünün kelimeleri".
- Aşırı uzun olma; odaklan: düzelt → çevir → öğret.
- Kullanıcı açıkça sorarsa dilbilgisi veya kelime hakkında daha derin açıklama yap.
- Gerekirse sözlük aracını (lookup_english) kullan.
- Kullanıcı İngilizce yazarsa yine Türkçe açıkla; İngilizcesini düzelt ve öğret.`;

export type ChatMessage = { role: "user" | "agent"; text: string };
export type Step = { tool: string; args: unknown; result: unknown; error?: boolean };

export async function runAgent(history: ChatMessage[], ctx: { baseUrl: string }) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const contents: Content[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));
  const steps: Step[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [
          {
            functionDeclarations: tools.map((t) => ({
              name: t.name,
              description: t.description,
              parametersJsonSchema: t.parameters,
            })),
          },
        ],
      },
    });

    const calls = response.functionCalls ?? [];
    if (calls.length === 0) return { answer: response.text ?? "", steps };

    // Keep Gemini's turn in the history, then run every tool it asked for.
    contents.push(response.candidates![0].content!);
    const results: Part[] = [];

    for (const call of calls) {
      const tool = tools.find((t) => t.name === call.name);
      let result: unknown;
      let error = false;
      try {
        if (!tool) throw new Error(`No tool named ${call.name}`);
        result = await tool.run(call.args ?? {}, ctx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) };
        error = true;
      }
      steps.push({ tool: call.name!, args: call.args, result, error });
      results.push({ functionResponse: { id: call.id, name: call.name, response: { result } } });
    }

    contents.push({ role: "user", parts: results });
  }

  return {
    answer: "Adım sınırına ulaştım. Lütfen sorunuzu biraz sadeleştirerek yeniden deneyin.",
    steps,
  };
}
