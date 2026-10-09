/**
 * Dil öğrenme araçları.
 * Gemini `description` ile ne zaman çağıracağına karar verir.
 */
export type Tool = {
  name: string;
  description: string;
  /** JSON Schema describing the inputs. */
  parameters: object;
  /** The code that runs when the agent calls this tool. */
  run: (args: any, ctx: { baseUrl: string }) => Promise<unknown>;
};

export const tools: Tool[] = [
  {
    name: "lookup_english",
    description:
      "Look up an English word: definitions, part of speech, phonetic, and example sentences. Use when teaching vocabulary from the user's message.",
    parameters: {
      type: "object",
      properties: {
        word: { type: "string", description: "English word to look up, e.g. improve" },
      },
      required: ["word"],
    },
    run: async ({ word }) => {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(String(word).trim())}`
      );
      if (!res.ok) {
        return { found: false, word, message: "Word not found in the dictionary." };
      }
      const data = (await res.json()) as Array<{
        word: string;
        phonetic?: string;
        phonetics?: { text?: string }[];
        meanings?: {
          partOfSpeech: string;
          definitions: { definition: string; example?: string; synonyms?: string[] }[];
          synonyms?: string[];
        }[];
      }>;
      const entry = data[0];
      if (!entry) return { found: false, word };

      return {
        found: true,
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.find((p) => p.text)?.text,
        meanings: (entry.meanings ?? []).slice(0, 3).map((m) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions.slice(0, 2).map((d) => ({
            definition: d.definition,
            example: d.example,
          })),
          synonyms: (m.synonyms ?? m.definitions[0]?.synonyms ?? []).slice(0, 5),
        })),
      };
    },
  },

  {
    name: "practice_prompt",
    description:
      "Generate a short English practice task based on words the user just used or is learning. Call when the user asks for practice or after teaching new words.",
    parameters: {
      type: "object",
      properties: {
        words: {
          type: "array",
          items: { type: "string" },
          description: "English words to practice, e.g. ['improve', 'deadline']",
        },
        level: {
          type: "string",
          description: "CEFR-ish level hint: A2, B1, B2, C1. Default B1.",
        },
      },
      required: ["words"],
    },
    run: async ({ words, level = "B1" }) => {
      const list = Array.isArray(words) ? words.filter(Boolean).slice(0, 5) : [];
      if (list.length === 0) return { error: "No words provided." };

      return {
        level,
        words: list,
        fillInBlank: `Complete in English: "I need to _____ my writing before the _____." (use: ${list.join(", ")})`,
        rewriteTask: `Rewrite this Turkish idea in English using: ${list.join(", ")}.`,
        speakTask: `Say out loud one sentence that includes: ${list[0]}.`,
        tip: "Ask the user to answer; then correct their English in formal Turkish.",
      };
    },
  },
];
