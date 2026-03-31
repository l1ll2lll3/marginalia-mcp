// GitHub Pages에서 데이터를 fetch하고 캐시
const BASE_URL = "https://l1ll2lll3.github.io/marginalia-dashboard";

const cache = new Map<string, unknown>();

async function fetchJson<T>(filename: string): Promise<T> {
  if (cache.has(filename)) return cache.get(filename) as T;

  const url = `${BASE_URL}/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  cache.set(filename, data);
  return data as T;
}

// ── 문학 사전 ──
export interface WordEntry {
  lemma: string;
  pos: string;
  difficulty: string;
  pronunciation: string;
  etymology: string;
  senses: Array<{ gloss: string; example?: string }>;
  books: Record<string, { frequency: number; sentences: Array<{ text: string; ko: string; chapter: number }> }>;
}

export async function lookupWord(word: string): Promise<WordEntry | null> {
  const index = await fetchJson<Record<string, number>>("search_index.json");
  const key = word.toLowerCase();

  // 정확한 매칭 또는 부분 매칭
  let idx = index[key];
  if (idx === undefined) {
    // 부분 매칭
    const match = Object.keys(index).find(k => k.startsWith(key));
    if (match) idx = index[match];
  }
  if (idx === undefined) return null;

  const words = await fetchJson<WordEntry[]>("words.json");
  return words[idx] || null;
}

export async function searchWords(query: string, limit = 10): Promise<WordEntry[]> {
  const index = await fetchJson<Record<string, number>>("search_index.json");
  const words = await fetchJson<WordEntry[]>("words.json");
  const q = query.toLowerCase();

  const matches = Object.entries(index)
    .filter(([k]) => k.includes(q))
    .sort((a, b) => a[0].length - b[0].length)
    .slice(0, limit)
    .map(([, idx]) => words[idx]);

  return matches;
}

// ── 캐릭터 유사도 ──
export interface CharacterPair {
  char1_name: string;
  char1_book: string;
  char2_name: string;
  char2_book: string;
  similarity: number;
}

let charPairsCache: CharacterPair[] | null = null;

async function loadCharacterPairs(): Promise<CharacterPair[]> {
  if (charPairsCache) return charPairsCache;

  // character_similarity_analysis.json을 GitHub Pages에 올려야 함
  // 현재는 embed_dashboard_data.json의 top_cross_pairs를 활용
  const data = await fetchJson<{
    sentences: Array<{ text: string; ch: number; book: string; ko: string }>;
    top_cross_pairs: Array<{ sim: number; mi: number; gi: number }>;
    moon_count: number;
  }>("embed_dashboard_data.json");

  // top_cross_pairs → 문장 쌍 (캐릭터는 아니지만 유사 구조)
  // TODO: character_similarity_analysis.json 배포 후 교체
  charPairsCache = [];
  return charPairsCache;
}

// 직접 캐릭터 데이터 사용 (별도 JSON 필요)
export async function compareCharacters(char1: string, char2: string): Promise<string> {
  // character_similarity_analysis.json이 배포되면 여기서 fetch
  // 지금은 하드코딩된 주요 쌍 데이터
  const knownPairs: Record<string, { sim: number; insight: string }> = {
    "catherine_earnshaw/박영채": { sim: 0.902, insight: "Both are tragic women caught between passion and duty. Catherine between Heathcliff and Edgar; Yeongchae between love for Hyeongshik and her fate as a gisaeng." },
    "charles_strickland/heathcliff": { sim: 0.883, insight: "Both destroy relationships in pursuit of an obsession — Strickland for art, Heathcliff for revenge. Neither shows remorse." },
    "charles_strickland/dorian_gray": { sim: 0.870, insight: "Both are consumed by aesthetics at the cost of morality. Strickland through creation, Dorian through preservation of beauty." },
    "dirk_stroeve/basil_hallward": { sim: 0.893, insight: "Both are devoted artists who worship a more powerful figure and are destroyed by that devotion." },
    "blanche_stroeve/catherine_earnshaw": { sim: 0.892, insight: "Both women transfer their passion from a devoted husband to a dangerous man, with fatal consequences." },
    "박영채/sibyl_vane": { sim: 0.894, insight: "Both are young women whose identity is bound to performance — Yeongchae as gisaeng, Sibyl as actress. Both attempt suicide when their constructed world collapses." },
    "gatsby/charles_strickland": { sim: 0.851, insight: "Both reinvent themselves completely. Gatsby transforms from Gatz to pursue Daisy; Strickland abandons everything to pursue art." },
  };

  const q1 = char1.toLowerCase();
  const q2 = char2.toLowerCase();

  for (const [key, data] of Object.entries(knownPairs)) {
    const [a, b] = key.split("/");
    if ((a.includes(q1) && b.includes(q2)) || (a.includes(q2) && b.includes(q1))) {
      return `Similarity: ${data.sim}\n\n${data.insight}`;
    }
  }

  return `No pre-computed comparison found for "${char1}" and "${char2}". Available characters: Catherine Earnshaw, 박영채, Charles Strickland, Heathcliff, Dorian Gray, Dirk Stroeve, Basil Hallward, Blanche Stroeve, Sibyl Vane, Gatsby.`;
}

// ── 감정 아크 ──
export interface EmotionData {
  emotions: string[];
  moon: BookEmotion;
  gatsby: BookEmotion;
  story_events: Record<string, Record<number, string>>;
  annotations: Record<string, Record<string, Array<{ idx: number; val: number; ch: number; text: string; ko: string }>>>;
}

interface BookEmotion {
  sentence_count: number;
  chapter_avg: Record<number, Record<string, number>>;
  chapters: number[];
}

export async function getEmotionArc(book: string, emotion: string, chapter?: number): Promise<string> {
  const data = await fetchJson<EmotionData>("emotion_arc_data.json");
  const bookKey = book.toLowerCase().includes("gatsby") ? "gatsby" : "moon";
  const bookData = bookKey === "moon" ? data.moon : data.gatsby;
  const bookTitle = bookKey === "moon" ? "The Moon and Sixpence" : "The Great Gatsby";
  const emotions = data.emotions;

  if (!emotions.includes(emotion)) {
    return `Unknown emotion "${emotion}". Available: ${emotions.join(", ")}`;
  }

  // 챕터별 평균
  const chAvg = bookData.chapter_avg;
  const chapters = chapter ? [chapter] : bookData.chapters;

  let result = `${bookTitle} — ${emotion} arc\n\n`;

  if (chapter) {
    const scores = chAvg[chapter];
    if (!scores) return `Chapter ${chapter} not found in ${bookTitle}`;
    result += `Chapter ${chapter}: ${emotion} = ${scores[emotion]?.toFixed(4) || "N/A"}\n`;
    // 모든 감정 점수
    result += `All emotions: ${Object.entries(scores).map(([e, v]) => `${e}=${(v as number).toFixed(3)}`).join(", ")}\n`;
    // 스토리 이벤트
    const evt = data.story_events?.[bookKey]?.[chapter];
    if (evt) result += `\nStory: ${evt}\n`;
  } else {
    // 전체 챕터 요약: 피크 3개
    const peaks = Object.entries(chAvg)
      .map(([ch, scores]) => ({ ch: Number(ch), val: (scores as Record<string, number>)[emotion] || 0 }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    result += `Top 5 chapters by ${emotion}:\n`;
    for (const p of peaks) {
      const evt = data.story_events?.[bookKey]?.[p.ch] || "";
      result += `  Ch.${p.ch}: ${p.val.toFixed(4)} ${evt ? `— ${evt}` : ""}\n`;
    }
  }

  // 어노테이션 (피크 문장)
  const annots = data.annotations?.[bookKey]?.[emotion] || [];
  if (annots.length > 0) {
    result += `\nPeak sentences:\n`;
    for (const a of annots) {
      result += `  Ch.${a.ch} (${a.val.toFixed(3)}): "${a.text}"\n`;
      if (a.ko) result += `    → ${a.ko}\n`;
    }
  }

  return result;
}
