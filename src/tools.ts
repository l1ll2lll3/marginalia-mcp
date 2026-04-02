import { McpServer } from "./mcp/server.js";
import { textResult, errorResult } from "./mcp/types.js";
import { lookupWord, searchWords, compareCharacters, getEmotionArc } from "./data.js";

export function registerTools(server: McpServer) {

  // ── 1. 문학 사전 ──
  server.tool(
    "marginalia_word_lookup",
    "Look up a word in the Marginalia Literary Dictionary. Returns definition, pronunciation, etymology, and example sentences from novels (The Moon and Sixpence, The Great Gatsby). Try: 'confess', 'saunter', 'acquaintance'",
    {
      type: "object",
      properties: {
        word: { type: "string", description: "English word to look up (lemma form preferred)" },
      },
      required: ["word"],
    },
    async (args) => {
      const word = String(args.word || "").trim();
      if (!word) return errorResult("Please provide a word");

      try {
        const entry = await lookupWord(word);
        if (!entry) {
          // 부분 검색
          const matches = await searchWords(word, 5);
          if (matches.length > 0) {
            return textResult(`"${word}" not found. Did you mean: ${matches.map(m => m.lemma).join(", ")}?`);
          }
          return textResult(`"${word}" not found in the literary dictionary.`);
        }

        let text = `**${entry.lemma}** (${entry.pos}) — ${entry.difficulty}\n`;
        if (entry.pronunciation) text += `/${entry.pronunciation}/\n`;
        text += "\n";

        // Senses
        if (entry.senses?.length) {
          text += "**Definitions:**\n";
          entry.senses.slice(0, 3).forEach((s, i) => {
            text += `${i + 1}. ${s.gloss}\n`;
            if (s.example) text += `   _${s.example}_\n`;
          });
          text += "\n";
        }

        // Etymology
        if (entry.etymology) {
          text += `**Etymology:** ${entry.etymology.slice(0, 200)}\n\n`;
        }

        // Book appearances
        if ((entry as any).per_book) {
          text += "**Appearances:**\n";
          for (const [bookId, bookData] of Object.entries((entry as any).per_book as Record<string, { frequency: number }>)) {
            text += `  ${bookId}: ${bookData.frequency}x\n`;
          }
          text += "\n";
        }

        // Literary examples
        if ((entry as any).examples?.length) {
          text += "**In Literature:**\n";
          for (const ex of (entry as any).examples.slice(0, 4)) {
            text += `  _${ex.book_title}_ Ch.${ex.chapter}:\n`;
            text += `  "${ex.text}"\n`;
            if (ex.translation_ko) text += `  → ${ex.translation_ko}\n`;
            text += "\n";
          }
        }

        return textResult(text);
      } catch (err) {
        return errorResult(String(err));
      }
    }
  );

  // ── 2. 캐릭터 비교 ──
  server.tool(
    "marginalia_character_compare",
    "Compare two literary characters across novels using embedding similarity. Characters from: The Moon and Sixpence, Wuthering Heights, The Great Gatsby, The Picture of Dorian Gray, Mujeong. Try: 'Strickland' and 'Heathcliff', or '박영채' and 'Catherine'",
    {
      type: "object",
      properties: {
        character1: { type: "string", description: "First character name" },
        character2: { type: "string", description: "Second character name" },
      },
      required: ["character1", "character2"],
    },
    async (args) => {
      const c1 = String(args.character1 || "").trim();
      const c2 = String(args.character2 || "").trim();
      if (!c1 || !c2) return errorResult("Please provide two character names");

      try {
        const result = await compareCharacters(c1, c2);
        return textResult(`**${c1} vs ${c2}**\n\n${result}`);
      } catch (err) {
        return errorResult(String(err));
      }
    }
  );

  // ── 3. 감정 아크 ──
  server.tool(
    "marginalia_emotion_arc",
    "Get the emotion arc of a novel. Shows how joy, sadness, anger, fear, love, or tension changes across chapters. Based on sentence embeddings (7,664 sentences). Books: 'Moon and Sixpence' or 'Great Gatsby'",
    {
      type: "object",
      properties: {
        book: { type: "string", description: "Book name: 'moon' or 'gatsby'" },
        emotion: { type: "string", description: "Emotion: joy, sadness, anger, fear, love, tension" },
        chapter: { type: "number", description: "Optional: specific chapter number" },
      },
      required: ["book", "emotion"],
    },
    async (args) => {
      const book = String(args.book || "moon");
      const emotion = String(args.emotion || "tension");
      const chapter = args.chapter ? Number(args.chapter) : undefined;

      try {
        const result = await getEmotionArc(book, emotion, chapter);
        return textResult(result);
      } catch (err) {
        return errorResult(String(err));
      }
    }
  );
}
