# Claude Code Instructions for Ani Questions App

## Project Overview
This is a study aid web application for Anirudh to practice exam questions. It uses JSON-based question banks organized by subject and chapter.

## Deployment
- **Platform:** Vercel
- **Important:** After pushing to GitHub, always run `vercel --prod --yes --force` and then alias to production:
  ```bash
  vercel alias <deployment-url> ani-questions.vercel.app
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
- ❌ mcq.json (separate MCQ section)
- ❌ fill_in_blanks.json (separate fill in blanks section)
- ❌ short_answer.json (separate short answer section)
- ❌ reference_to_context.json
- ❌ make_sentences.json
- ❌ long_answer.json

### Question Types for Grammar

#### 1. textbook_qa.json
Contains exercises directly from the textbook (voice conversion exercises, etc.)

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

#### 2. previous_year_questions.json
Contains ONLY actual questions from past exam papers. Do NOT add generated questions here.

```json
{
  "subject": "English E1",
  "chapter": "{Chapter Name}",
  "type": "previous_year_questions",
  "questions": [
    {
      "id": "apv_pyq_1",
      "type": "fill_in_blanks",
      "year": "Annual Exam 2020",
      "question": "State whether the sentence is in 'active' or 'passive' voice: 'A mistake was made by me.'",
      "answer": "Passive voice",
      "acceptable_answers": ["passive", "passive voice"],
      "explanation": "The subject receives the action. Structure: was + V3 indicates passive."
    },
    {
      "id": "apv_pyq_5",
      "type": "short_answer",
      "year": "Annual Exam 2020",
      "question": "Change from active voice to passive voice: 'I am bending the branch.'",
      "answer": "The branch is being bent by me.",
      "key_points": ["Present continuous: am bending → is being bent", "Object becomes subject"]
    }
  ]
}
```

#### 3. exam_practice.json
Contains questions GENERATED in the same format as sample papers. Two main types:

**Type A: Voice Identification**
```json
{
  "id": "apv_ep_1",
  "type": "fill_in_blanks",
  "question": "State whether the sentence is in 'active' or 'passive' voice: 'The thief was caught by the police.'",
  "answer": "Passive voice",
  "acceptable_answers": ["passive", "passive voice"],
  "explanation": "The subject 'thief' receives the action. Structure: was + V3 with 'by' indicates passive."
}
```

**Type B: Voice Conversion**
```json
{
  "id": "apv_ep_9",
  "type": "short_answer",
  "question": "Change from active voice to passive voice: 'The gardener is watering the plants.'",
  "answer": "The plants are being watered by the gardener.",
  "key_points": ["Present continuous: is watering → are being watered", "Object becomes subject"]
}
```

### Sample Paper Question Format Reference
From actual ICSE sample papers, grammar questions typically appear as:

```
Question 6. (4x1)
State whether the sentences are in the 'active' or 'passive' voice.
1. A mistake was made by me.
2. Lata sang a song in English.
...

Change the following sentences from 'active voice' to 'passive voice'. (4x1)
1. I am bending the branch.
2. She sent invitation cards to her friends.
...
```

### Exam Practice Question Guidelines
When generating exam_practice.json questions:

1. **Mix of identification and conversion** - roughly 50/50 split
2. **Cover all tenses:**
   - Simple present/past/future
   - Present/past continuous
   - Present/past perfect
   - Future perfect
   - Modal verbs (can, may, must, should)
3. **Include special cases:**
   - Interrogative sentences
   - Imperative sentences (Let the door be opened)
   - Sentences with "by whom" / "who"
   - Sentences with nobody/nothing/someone
4. **Target: 100+ questions** for comprehensive practice coverage

---

## Sample Papers Location
Sample papers are stored at:
```
/Users/ramsabode/vibe-coding/edu_ani/subjects_class7c/E1/sample paper/
```

Use `pdftotext` to extract content and search for relevant questions:
```bash
pdftotext "e1_sample_paper_4.pdf" - | grep -i -A10 "active\|passive\|voice"
```

---

## Literature Chapters Format (English E2)
Literature chapters (poems, stories) use the format in QUESTION_CREATION_GUIDE.md with:
- textbook_qa.json
- reference_to_context.json
- short_answer.json
- long_answer.json
- mcq.json
- make_sentences.json
- previous_year_questions.json (if available)
