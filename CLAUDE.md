# Claude Code Instructions for Ani Questions App

## Project Overview
This is a study aid web application for Anirudh (class 7, Sishya School, Chennai) to practice exam questions. It uses JSON-based question banks organized by subject and chapter. Deployed on Vercel.

## Deployment
- **Platform:** Vercel
- **URL:** https://ani-questions.vercel.app
- **Important:** After changes, always run:
  ```bash
  vercel --prod --yes --force
  vercel alias <deployment-url> ani-questions.vercel.app
  ```

## Source Material Location
Textbooks and sample papers are stored at:
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/
├── E1/          # English E1 (Grammar)
├── E2/          # English E2 (Literature)
├── Physics/
├── History Civics/
├── Computer Science/
├── EVE/
├── Hindi/
├── Tamil/
├── Biology/
├── Chemistry/
├── Geography/
├── Maths/
├── GK/
└── General Knowledge/
```

Sample papers are typically in a `sample paper/` subfolder under each subject.

## Question Cache Structure
All question data lives in:
```
questions_cache/
├── subjects.json              # Master list of active + completed subjects
├── {Subject_Slug}/
│   ├── chapters.json          # List of chapters for this subject
│   └── {Chapter Name}/
│       ├── sections.json      # Section metadata (what question types exist)
│       └── *.json             # Question files (mcq.json, short_answer.json, etc.)
```

### subjects.json Format
```json
{
  "subjects": [
    {"name": "Physics", "slug": "physics", "icon": "⚛️", "chapter_count": 5}
  ],
  "completed": [
    {"name": "History Civics", "slug": "History_Civics", "icon": "🏛️", "chapter_count": 3}
  ]
}
```
- `subjects` = active (shown in main list)
- `completed` = completed exams (shown in separate section)

---

## Current Subjects

### Active Subjects
| Subject | Slug | Chapters |
|---------|------|----------|
| Physics | physics | 5 |
| Computer Science | Computer_Science | 2 |

### Completed Exams
| Subject | Slug | Chapters |
|---------|------|----------|
| English E2 | english_e2 | 4 (Daffodils, The Picture Frame, Shree Krishna Eating House, The Listeners) |
| History Civics | History_Civics | 3 (Akbar, Constitution of India, Turkish Invasion) |
| English E1 | english_e1 | 2 (Active/Passive Voice, Sentences) |
| Tamil1 | Tamil1 | 1 |
| EVE | EVE | 4 |
| Hindi | Hindi | 1 |
| General Knowledge | General Knowledge | 1 |

---

## App Architecture (app.js)

### Question Rendering Pipeline
The app has TWO rendering paths:
1. **"Show All" mode** — `renderQuiz()` → `renderQuestion()` for each question
2. **"One by One" mode** (DEFAULT) — `renderOneByOneQuiz()` → `renderOneByOneQuestion()` + `renderOneByOneAnswer()`

**CRITICAL:** When adding support for a new question type, you must add handlers to BOTH paths:
- `processQuestion()` (~line 1523) — maps raw JSON to processed format
- `renderQuestion()` (~line 2772) — renders question + answer for "Show All" mode
- `renderOneByOneQuestion()` (~line 2412) — renders question for one-by-one mode
- `renderOneByOneAnswer()` (~line 2470) — renders answer for one-by-one mode

### Answer Visibility
`shouldShowAnswer = state.answersRevealed` — answers always show when "Check Answers" is clicked, regardless of whether the user typed anything. No input is required.

### Question Type Processing (processQuestion)
Each question type has specific field mappings:
- **mcq/assertion_reason**: `options`, `correct_answer`
- **true_false**: `statement` → `question`, `answer` → True/False
- **match_the_following**: supports BOTH formats:
  - `pairs` array with `{left, right}` objects
  - `column_a`/`column_b` arrays + `correct_matches`/`answer` object
- **case_study**: `case_text` → `question`, `questions` → `sub_questions`
- **differentiate_between**: `term1`/`term2` → `concept_a`/`concept_b`, `differences` array
- **numericals**: `given_data`, `formula`, `solution_steps`
- **give_reason**: `statement` → question, `reason` → answer
- **reference_to_context**: `extract` field
- **make_sentences**: `word`, `meaning`, `sample_sentence`

### Diagram Support
Questions can include diagrams via:
```json
{
  "has_diagram": true,
  "diagram_image": "https://url-to-image",
  "diagram_description": "Fallback text if no image"
}
```
Used by Physics diagram questions and Computer Science "Name the Icons" section (uses Google favicon API: `https://www.google.com/s2/favicons?domain=DOMAIN&sz=128`).

---

## Literature Chapters Format (English E2)

### Directory Structure
```
questions_cache/English_E2/{Chapter Name}/
├── sections.json
├── summary.json              # Chapter summary
├── textbook_qa.json          # Textbook exercises
├── reference_to_context.json # RTC questions
├── short_answer.json         # 5-6 sentence answers
├── long_answer.json          # 7-8 sentence answers
├── mcq.json                  # Multiple choice
├── make_sentences.json       # Vocabulary with personalized sentences
├── finer_details.json        # Detailed chapter facts
└── teacher_notes.json        # Teaching notes
```

### E2 Chapters
1. **Daffodils** — William Wordsworth (poem)
2. **The Picture Frame** — Nicholas Horsburgh (story)
3. **Shree Krishna Eating House** — Anita Desai (story)
4. **The Listeners** — Walter de la Mare (poem)

### Answer Length Rules for E2
- **Short answers:** 5-6 sentences
- **Long answers:** 7-8 sentences (flowing paragraphs, no bullet points)
- Write in own words but strictly based on textbook content
- Paraphrase for a seventh grader
- **NEVER hallucinate** — every fact must come from the textbook

### make_sentences.json Format
Each chapter has vocabulary organized as:
- **Words to Know (first N entries)** — from textbook "Words to Know" section
- **Additional Vocabulary (remaining entries)** — extra words from the chapter

Words to Know counts:
- Daffodils: 10
- The Picture Frame: 7
- Shree Krishna Eating House: 6
- The Listeners: 14

```json
{
  "subject": "English E2",
  "chapter": "Chapter Name",
  "type": "make_sentences",
  "questions": [
    {"id": "daf_ms_1", "word": "glee", "meaning": "great joy, happiness", "sample_sentence": "Personalized sentence for Anirudh."}
  ]
}
```

**Personalization:** All sentences reference Anirudh's life — CSK cricket, mridangam, Dhrupad music, Sishya school, Chennai, Marina Beach, Greams Road, Tidel Park, cousins (Vishwak, Prahlad), friends (Yohann, Suvasana), dog (Nandi), Sastha Catering, Patri Satish Kumar, Way2top, etc.

### Generate Make Sentences .docx
Script at `create_make_sentences_docx.py` reads from JSON files and generates:
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/E2/sample paper/E2_Make_Sentences_All_Chapters.docx
```
Wine colored headings (RGB 0x72, 0x2F, 0x37). Run with:
```bash
python3 create_make_sentences_docx.py
```

### E2 Vocabulary Reference
Comprehensive vocabulary file with all personalized sentences:
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/E2/sample paper/E2_Vocabulary_and_Make_Sentences.md
```

---

## Grammar Chapters Format (English E1)

Grammar chapters (Active/Passive Voice, Sentences, etc.) follow a DIFFERENT structure than literature chapters.

### Directory Structure
```
questions_cache/English_E1/{Chapter Name}/
├── textbook_qa.json           # Exercises from textbook
├── previous_year_questions.json   # ONLY actual exam paper questions
├── exam_practice.json         # Generated questions in exam format
└── sections.json              # Section metadata
```

### sections.json Format
```json
{
  "subject": "English E1",
  "chapter": "{Chapter Name}",
  "sections": {
    "textbook": [
      {"value": "textbook_qa", "label": "Textbook Q&A", "icon": "📖"}
    ],
    "exam": [
      {"value": "previous_year_questions", "label": "Previous Year Questions", "icon": "📋"},
      {"value": "exam_practice", "label": "Exam Practice", "icon": "✍️"}
    ],
    "miscellaneous": []
  }
}
```

### DO NOT CREATE for Grammar Chapters:
- No mcq.json, fill_in_blanks.json, short_answer.json, reference_to_context.json, make_sentences.json, long_answer.json

### Question Types for Grammar

#### textbook_qa.json
```json
{
  "question_type": "textbook_qa",
  "questions": [
    {
      "id": "tqa001",
      "exercise": "A",
      "question": "Change from active to passive voice: 'She writes a letter.'",
      "answer": "A letter is written by her.",
      "explanation": "Simple present active becomes is/am/are + V3 in passive."
    }
  ]
}
```

#### previous_year_questions.json
ONLY actual questions from past exam papers. Never add generated questions here.

#### exam_practice.json
Generated questions in exam format. Two types:
- **Voice Identification** (fill_in_blanks type): "State whether active or passive"
- **Voice Conversion** (short_answer type): "Change from active to passive"

Target: 100+ questions covering all tenses, modals, interrogative, imperative, special cases.

### E1 Sample Papers Location
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/E1/sample paper/
```

---

## History Civics Format

### Directory Structure
```
questions_cache/History_Civics/{Chapter Name}/
├── sections.json
├── textbook_qa.json           # Textbook exercises (sections A-H)
├── previous_year_questions.json
├── mcq.json
├── fill_in_blanks.json
├── true_false.json
├── match_the_following.json
├── short_answer.json
├── long_answer.json
├── name_the_following.json
├── assertion_reason.json
├── give_reason.json
├── hots.json
└── tricky_questions.json
```

### Chapters
1. **The Mughal Empire - Akbar** (Theme 5)
2. **The Constitution of India** (Theme 1)
3. **The Turkish Invasion and the Delhi Sultanate** (Theme 3)

### Source Material
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/History Civics/
├── akbar_history.md + akbar_qna.md
├── constitution_history_civics.md
├── Turkish_invasion.md
├── history_notebook.md (Q&A for chapters 1 & 3)
└── sample_papers/ (13 PDFs)
```

---

## Physics Format

### Chapters
1. **Energy**
2. **Sound**
3. **Physical Quantities**
4. **Electricity**
5. **Electromagnetism**

### Directory Structure (typical per chapter)
```
questions_cache/Physics/{Chapter Name}/
├── sections.json
├── textbook_qa.json
├── previous_year_questions.json
├── mcq.json
├── fill_in_blanks.json
├── true_false.json
├── short_answer.json
├── long_answer.json
├── match_the_following.json
├── assertion_reason.json
├── give_reason.json
├── name_the_following.json
├── differentiate_between.json
├── hots.json
├── case_study.json            # All 5 chapters have case studies
├── numericals.json
└── tricky_questions.json
```

### Source Material
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/Physics/
├── Energy/
├── Sound/
├── Physical quantities/
├── Electricity/
├── Electromagnetism/
├── Sample papers/    # 9 sample papers (PDFs + solution MDs)
└── worksheet/
```

### Question Types in Physics Sample Papers
These are the question types that appear across the 9 Physics sample papers (80-mark and 40-mark formats):

**Section A (objective/short):**
| Type | Frequency | Typical Marks |
|------|-----------|---------------|
| MCQ | Every paper | 5-10 x 1 mark |
| Fill in the Blanks | Every paper | 5-7 x 1 mark |
| True or False | Every paper | 5-7 x 1 mark |
| Name the Following | Most papers | 5-6 x 1 mark |
| Define | Most papers | 3-5 x 1-2 marks |
| Differentiate / Distinguish Between | Most papers | 2-3 x 2 marks |
| Case Study / Passage-based | Some papers | 5 x 1 mark |
| Pick the Odd One Out (with reason) | Some papers | 3 x 1 mark |

**Section B (descriptive/application):**
| Type | Frequency | Typical Marks |
|------|-----------|---------------|
| Short Answer | Every paper | 2-3 marks each |
| Numericals | Every paper | 2-3 marks each |
| Diagram-based / Observe and Answer | Every paper | 2-5 marks each |
| Diagram Drawing (draw & label) | Some papers | 2-4 marks |
| Long Answer (multi-part) | Some papers | 10 marks each |
| Application-based Reasoning | Some papers | 2 marks each |

### Case Study JSON Format
```json
{
  "question_type": "case_study",
  "questions": [
    {
      "id": "cs001",
      "case_text": "The case/passage text here...",
      "questions": [
        {"question": "Sub-question 1?", "answer": "Answer 1"},
        {"question": "Sub-question 2?", "answer": "Answer 2"}
      ],
      "source_section": "Topic Name"
    }
  ]
}
```
**IMPORTANT:** Use `case_text` key (NOT `passage`). The app maps `case_text` → `processed.question` and `questions` → `processed.sub_questions`.

---

## Computer Science Format

### Chapters
1. **Ethics and Safety Measures** — cybersecurity, hacking, phishing, IPR, safety
2. **Python Programming** — lists, loops, conditionals, range(), operators

### Directory Structure
```
questions_cache/Computer_Science/Ethics and Safety Measures/
├── sections.json
├── textbook_qa.json
├── mcq.json
├── match_the_following.json    # Uses column_a/column_b/correct_matches format
├── name_icons.json             # Icon identification with diagram_image URLs
├── true_false.json
├── fill_in_blanks.json
├── one_word.json
├── define.json
├── do_as_directed.json
├── short_answer.json
├── name_the_following.json
├── differentiate_between.json
└── tricky_questions.json

questions_cache/Computer_Science/Python Programming/
├── sections.json
├── textbook_qa.json
├── mcq.json
├── match_the_following.json    # Uses column_a/column_b/answer format
├── true_false.json
├── fill_in_blanks.json
├── one_word.json
├── define.json
├── do_as_directed.json
├── predict_output.json
├── short_answer.json
├── write_code.json
└── find_error.json
```

### Match the Following — Two JSON Formats
The app supports both formats:

**Format 1 (Physics/History):** Uses `pairs` array
```json
{
  "id": "mtf001",
  "instruction": "Match the following:",
  "pairs": [{"left": "Term A", "right": "Definition A"}],
  "left_items": ["Term A"],
  "right_items": ["Definition A (jumbled)"]
}
```

**Format 2 (Computer Science):** Uses `column_a`/`column_b`
```json
{
  "id": "mtf001",
  "instruction": "Match the terms:",
  "column_a": ["Term A", "Term B"],
  "column_b": ["Definition B (jumbled)", "Definition A (jumbled)"],
  "correct_matches": {"Term A": "Definition A", "Term B": "Definition B"}
}
```
Or with `question` instead of `instruction` and `answer` object instead of `correct_matches`.

### Name the Icons Format
Uses `has_diagram` + `diagram_image` with Google's favicon API:
```json
{
  "id": 1,
  "question": "Identify the icon shown below:",
  "answer": "Google Chrome",
  "has_diagram": true,
  "diagram_image": "https://www.google.com/s2/favicons?domain=chrome.google.com&sz=128"
}
```

### Differentiate Between Format
```json
{
  "id": "db001",
  "term1": "Concept A",
  "term2": "Concept B",
  "differences": [
    {"aspect": "Purpose", "term1_point": "Point for A", "term2_point": "Point for B"}
  ]
}
```
Should have at least 2 points of difference with examples.

---

## Important Rules

### Content Accuracy
- **NEVER hallucinate** — every answer must be verifiable against the textbook
- Always read the textbook PDF before writing/editing answers
- Use `pdftotext` to extract content from PDFs
- Common past issues: fabricated character descriptions, wrong prices/numbers, invented quotes

### Answer Quality
- Short answers: 5-6 sentences (E2), appropriate length for other subjects
- Long answers: 7-8 sentences as flowing paragraphs (no bullets/numbered lists)
- Write in own words, paraphrased for a seventh grader
- Base everything strictly on textbook content

### previous_year_questions.json
- Contains ONLY actual questions from past exam papers
- NEVER add generated/made-up questions to this file
- Always include the `year` field identifying the source paper

### Known Bugs Fixed (Reference)
- Case study must use `case_text` key, not `passage`
- `renderOneByOneAnswer()` needs explicit handlers for: case_study, differentiate_between, numericals, match_the_following (these don't fall through to the default text handler correctly)
- `processQuestion()` for match_the_following must handle both `pairs` format and `column_a`/`column_b` format
- Answer visibility: `shouldShowAnswer = state.answersRevealed` (no input required)
- MCQ questions in textbook_qa need proper `options` arrays (not inline in question text)
