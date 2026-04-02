# Marginalia MCP Server

[![npm](https://img.shields.io/npm/v/marginalia-mcp)](https://npmjs.com/package/marginalia-mcp)

> 소설 속 단어를 찾고, 캐릭터를 비교하고, 감정의 흐름을 탐색하는 MCP 서버

AI 어시스턴트(Claude, Codex, Gemini)에서 자연어로 문학 데이터를 조회할 수 있습니다.

---

## 지원 도서

| 책 | 저자 | 문장 수 |
|----|------|---------|
| The Moon and Sixpence | W. Somerset Maugham | 4,698 |
| The Great Gatsby | F. Scott Fitzgerald | 2,966 |

캐릭터 비교는 5권 41명 지원 (위 2권 + Wuthering Heights, Dorian Gray, 무정)

---

## 설치

### Claude Code (CLI)
```bash
claude mcp add marginalia -- npx marginalia-mcp
```

### Claude Desktop
`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 또는
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "marginalia": {
      "command": "npx",
      "args": ["marginalia-mcp"]
    }
  }
}
```

설치 후 **Claude를 재시작**하면 도구가 활성화됩니다.

### 개발자용 (소스에서 실행)
```bash
git clone https://github.com/l1ll2lll3/marginalia-mcp.git
claude mcp add marginalia -- npx tsx /path/to/marginalia-mcp/src/index.ts
```

---

## 도구 3가지

### 1. marginalia_word_lookup — 문학 사전

소설 속에서 실제로 쓰인 단어를 찾습니다. 일반 사전의 죽은 예문 대신, 소설의 살아있는 문장이 예문입니다.

**사용 예시:**
```
"confess라는 단어가 소설에서 어떻게 쓰였어?"
"saunter 뜻이 뭐야?"
"acquaintance 발음이랑 어원 알려줘"
```

**응답 내용:**
- 단어 (lemma), 품사, 난이도 (B1~C2)
- IPA 발음
- 뜻 (Wiktionary, 최대 3개)
- 어원
- 소설 속 예문 + 한국어 번역 (책별 2문장)

**팁:**
- 활용형보다 원형으로 검색하세요: "confessed" 대신 "confess"
- 정확한 단어가 없으면 비슷한 단어를 추천해줍니다

---

### 2. marginalia_character_compare — 캐릭터 비교

다른 소설의 캐릭터를 임베딩 유사도로 비교합니다. 300~400단어 영어 분석 텍스트를 nomic-embed-text (768d)로 임베딩하여 코사인 유사도를 계산한 결과입니다.

**사용 예시:**
```
"스트릭랜드와 히스클리프를 비교해줘"
"박영채와 Catherine Earnshaw의 공통점은?"
"개츠비와 스트릭랜드는 비슷해?"
```

**비교 가능한 캐릭터:**

| 소설 | 캐릭터 |
|------|--------|
| The Moon and Sixpence | Charles Strickland, Dirk Stroeve, Blanche Stroeve |
| Wuthering Heights | Heathcliff, Catherine Earnshaw |
| The Great Gatsby | Gatsby |
| The Picture of Dorian Gray | Dorian Gray, Basil Hallward, Sibyl Vane |
| 무정 | 박영채 |

**응답 내용:**
- 코사인 유사도 (0~1, 높을수록 닮음)
- 왜 닮은지 해석 (심리적 동기, 서사 패턴, 관계 구조)

---

### 3. marginalia_emotion_arc — 감정 곡선

소설의 감정 강도가 챕터별로 어떻게 변하는지 보여줍니다. 7,664개 문장의 임베딩 벡터와 감정 개념 벡터의 유사도를 측정한 결과입니다.

**6가지 감정:**
| 감정 | 키워드 예시 |
|------|-----------|
| joy | happy, laugh, smile, delight |
| sadness | grief, sorrow, weep, tears |
| anger | rage, fury, hate, cruel |
| fear | dread, terror, panic, anxious |
| love | passion, desire, tender, affection |
| tension | silence, dark, cold, strange, death |

**사용 예시:**
```
"달과 6펜스에서 tension이 가장 높은 챕터가 어디야?"
"개츠비의 sadness 곡선 보여줘"
"달과 6펜스 30장의 감정 분석해줘"
"Moon and Sixpence의 love 피크는 어디야?"
```

**응답 내용:**
- 해당 감정 Top 5 챕터 (점수 + 스토리 이벤트)
- 피크 문장 (영어 원문 + 한국어 번역)
- 특정 챕터 지정 시: 6가지 감정 점수 전부 + 스토리 이벤트

**팁:**
- book 파라미터: "moon" 또는 "gatsby"
- chapter 파라미터: 숫자 (선택 사항)

---

## 질문 예시 모음

### 단어 탐색
```
"달과 6펜스에 나오는 B2 레벨 단어 중 하나 알려줘"
"contempt이 무슨 뜻이야?"
"discern의 어원이 뭐야?"
```

### 캐릭터 분석
```
"스트릭랜드와 가장 비슷한 캐릭터가 누구야?"
"박영채와 Sibyl Vane을 비교해줘"
"Dirk Stroeve와 Basil Hallward의 공통점은?"
```

### 감정 분석
```
"달과 6펜스에서 가장 슬픈 챕터는?"
"개츠비의 joy가 가장 높은 부분은 어디야?"
"두 소설 중 anger가 더 강한 건?"
"달과 6펜스 56장의 모든 감정 점수를 보여줘"
```

### 복합 질문
```
"스트릭랜드가 가장 많이 언급되는 챕터에서의 tension 수준은?"
"confess라는 단어가 나오는 문장의 감정은?"
```

---

## 데이터 소스

모든 데이터는 [Marginalia Dashboard](https://l1ll2lll3.github.io/marginalia-dashboard/)에서 제공됩니다.

| 데이터 | 파일 | 크기 |
|--------|------|------|
| 문학 사전 | words.json + search_index.json | 12MB |
| 감정 곡선 | emotion_arc_data.json | 439KB |
| 캐릭터 유사도 | (내장 데이터) | — |

첫 호출 시 GitHub Pages에서 데이터를 다운로드하고, 이후는 메모리 캐시를 사용합니다.

---

## 참고

- **Marginalia 프로젝트**: 문학을 통한 다국어 언어 학습 플랫폼
- **대시보드**: https://l1ll2lll3.github.io/marginalia-dashboard/
- **임베딩 탐색기**: https://l1ll2lll3.github.io/marginalia-dashboard/embed_explorer.html
- **문학 사전**: https://l1ll2lll3.github.io/marginalia-dashboard/dictionary.html

---

## 제거

```bash
claude mcp remove marginalia
```
