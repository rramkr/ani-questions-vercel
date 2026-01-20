# Question Creation Guide for ICSE Quiz App

This guide provides templates and prompts for creating comprehensive question banks for any new subject or chapter.

---

## Directory Structure

For each new chapter, create the following files:
```
questions_cache/
└── {Subject_Name}/           # e.g., "English_E2", "Physics"
    ├── chapters.json         # List of all chapters in this subject
    └── {Chapter_Name}/       # e.g., "The Listeners", "Motion"
        ├── sections.json
        ├── textbook_qa.json
        ├── reference_to_context.json
        ├── short_answer.json
        ├── long_answer.json
        ├── mcq.json
        └── make_sentences.json
```

---

## File Formats

### 1. chapters.json

```json
{
  "subject": "English E2",
  "chapters": [
    {
      "name": "Chapter Name",
      "slug": "Chapter Name",
      "has_questions": true,
      "icon": "📚"
    }
  ]
}
```

### 2. sections.json

```json
{
  "subject": "English E2",
  "chapter": "Chapter Name",
  "sections": [
    {
      "title": "📖 Textbook Questions",
      "types": ["textbook_qa"]
    },
    {
      "title": "📝 Reference to Context",
      "types": ["reference_to_context"]
    },
    {
      "title": "✍️ Short Answer Questions",
      "types": ["short_answer"]
    },
    {
      "title": "📄 Long Answer Questions",
      "types": ["long_answer"]
    },
    {
      "title": "🔤 Make Sentences",
      "types": ["make_sentences"]
    },
    {
      "title": "❓ Multiple Choice Questions",
      "types": ["mcq"]
    }
  ]
}
```

---

## Question Type Formats & Prompts

### 1. TEXTBOOK Q&A (textbook_qa.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "textbook_qa",
  "questions": [
    {
      "id": "prefix_tq_1",
      "question": "The exact question from textbook",
      "answer": "Comprehensive answer covering all aspects of the question",
      "key_points": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create textbook Q&A questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Extract ALL comprehension questions from the textbook exactly as written
2. Include HOTS (Higher Order Thinking Skills) questions if present
3. Include all Reference to Context questions from the textbook
4. For each question, provide:
   - A comprehensive answer (3-6 sentences depending on question complexity)
   - Key points as bullet points for quick revision
5. Use question IDs like: {prefix}_tq_1, {prefix}_tq_2, etc.
6. Cover every question from the textbook - do not skip any

Output in this JSON format:
{
  "subject": "{Subject}",
  "chapter": "{Chapter Name}",
  "type": "textbook_qa",
  "questions": [
    {
      "id": "prefix_tq_1",
      "question": "...",
      "answer": "...",
      "key_points": ["...", "..."]
    }
  ]
}
```

---

### 2. REFERENCE TO CONTEXT (reference_to_context.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "reference_to_context",
  "questions": [
    {
      "id": "prefix_rtc_1",
      "question": "Reference to Context: 'Quote from the text'\n\n(i) First sub-question?\n(ii) Second sub-question?\n(iii) Third sub-question?",
      "answer": "(i) Answer to first question in 2-3 sentences.\n\n(ii) Answer to second question in 2-3 sentences.\n\n(iii) Answer to third question in 2-3 sentences.",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create Reference to Context questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Select 10-15 important quotes/passages from the text
2. For each quote, create 3-5 sub-questions labeled (i), (ii), (iii), etc.
3. Questions should ask about:
   - Who is speaking / Who is being described
   - Context (where, when, why)
   - Meaning of specific words or phrases
   - Significance or importance of the passage
   - What happens before/after this
4. Each sub-answer should be 2-3 sentences
5. Include key_points summarizing the main ideas

Format each question EXACTLY like this:
{
  "id": "prefix_rtc_1",
  "question": "Reference to Context: 'Exact quote from text'\n\n(i) Question one?\n(ii) Question two?\n(iii) Question three?",
  "answer": "(i) Answer one.\n\n(ii) Answer two.\n\n(iii) Answer three.",
  "key_points": ["Point 1", "Point 2"]
}

Output the complete JSON file.
```

---

### 3. SHORT ANSWER (short_answer.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "short_answer",
  "questions": [
    {
      "id": "prefix_sa_1",
      "question": "Question text?",
      "answer": "Answer in 3-4 sentences. First sentence introduces the topic. Second and third sentences provide details. Fourth sentence may conclude or add context.",
      "key_points": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create Short Answer questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Create 20-25 short answer questions covering the entire chapter
2. Questions should test understanding of:
   - Characters and their roles
   - Key events and their significance
   - Important concepts and definitions
   - Cause and effect relationships
   - Author's purpose and themes
3. Each answer MUST be exactly 3-4 sentences:
   - Sentence 1: Direct answer to the question
   - Sentence 2-3: Supporting details or explanation
   - Sentence 4: Additional context if needed
4. Include key_points for quick revision
5. Cover all important aspects of the chapter - no section should be left out

Output in JSON format with questions array.
```

---

### 4. LONG ANSWER (long_answer.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "long_answer",
  "questions": [
    {
      "id": "prefix_la_1",
      "question": "Detailed question requiring comprehensive answer?",
      "answer": "Answer in 5-6 sentences. First sentence introduces the main point. Second sentence provides context or background. Third and fourth sentences give detailed explanation with examples from the text. Fifth sentence discusses significance or implications. Sixth sentence may conclude or connect to broader themes.",
      "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"]
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create Long Answer questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Create 8-10 long answer questions that require detailed responses
2. Focus on:
   - Character analysis and development
   - Theme exploration
   - Comparative questions (contrast two elements)
   - Critical thinking (HOTS) questions
   - Significance of events or symbols
   - Author's craft and literary devices
3. Each answer MUST be exactly 5-6 sentences:
   - Sentence 1: Introduce the main point
   - Sentence 2: Provide context or background
   - Sentences 3-4: Detailed explanation with specific examples from text
   - Sentence 5: Discuss significance or implications
   - Sentence 6: Conclude or connect to broader themes
4. Include 4-5 key_points for each question
5. Questions should require deep understanding, not just surface recall

Output in JSON format.
```

---

### 5. MULTIPLE CHOICE QUESTIONS (mcq.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "mcq",
  "questions": [
    {
      "id": "prefix_mcq_1",
      "question": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct_answer": "B. Option 2",
      "explanation": "Brief explanation of why this is correct."
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create Multiple Choice Questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Create 30-40 MCQs covering the entire chapter comprehensively
2. Question types should include:
   - Factual recall (who, what, where, when)
   - Vocabulary and word meanings
   - Inference and interpretation
   - Sequence of events
   - Character identification
   - Theme and moral understanding
3. For each question:
   - Write a clear question
   - Provide 4 options (A, B, C, D)
   - All options should be plausible (no obviously wrong answers)
   - Mark the correct answer
   - Provide a brief explanation
4. Distribute questions evenly across the chapter
5. Include some challenging questions, not just easy recall

Output in JSON format with all questions.
```

---

### 6. MAKE SENTENCES / VOCABULARY (make_sentences.json)

**Format:**
```json
{
  "subject": "Subject Name",
  "chapter": "Chapter Name",
  "type": "make_sentences",
  "questions": [
    {
      "id": "prefix_ms_1",
      "word": "Word",
      "meaning": "Clear definition of the word",
      "sample_sentence": "A complete sentence using the word correctly in context."
    }
  ]
}
```

**Prompt to Generate:**
```
I need you to create Make Sentences / Vocabulary questions for the chapter "{Chapter Name}" from {Subject}.

Here is the chapter content:
[PASTE CHAPTER TEXT/PDF CONTENT HERE]

Instructions:
1. Extract 15-25 important/difficult words from the chapter
2. Include:
   - Words from "Words to Know" section if present
   - Difficult vocabulary used in the text
   - Literary terms if applicable
   - Archaic or unusual words
3. For each word provide:
   - The word exactly as it appears
   - A clear, student-friendly meaning/definition
   - A sample sentence that:
     * Uses the word correctly
     * Shows the meaning clearly
     * Is different from how it's used in the chapter
     * Is age-appropriate for the student
4. Arrange alphabetically or in order of appearance

Output in JSON format.
```

---

## Complete Workflow for New Chapter

### Step 1: Gather Source Material
- Get the textbook chapter (PDF or text)
- Identify the subject and chapter name
- Note any special sections (Words to Know, Comprehension Questions, etc.)

### Step 2: Create Directory Structure
```bash
mkdir -p questions_cache/{Subject_Name}/{Chapter_Name}
```

### Step 3: Update chapters.json
Add the new chapter to the subject's chapters.json file.

### Step 4: Create sections.json
Copy the template and update subject/chapter names.

### Step 5: Generate Questions (in this order)
1. **textbook_qa.json** - Extract all textbook questions first
2. **reference_to_context.json** - Select key passages
3. **short_answer.json** - Create 3-4 sentence answers
4. **long_answer.json** - Create 5-6 sentence answers
5. **mcq.json** - Create comprehensive MCQs
6. **make_sentences.json** - Extract vocabulary

### Step 6: Review and Validate
- Check JSON syntax is valid
- Ensure all IDs are unique
- Verify answer lengths match requirements
- Test in the app

---

## Quality Checklist

Before finalizing, verify:

- [ ] All questions from textbook are included in textbook_qa.json
- [ ] Reference to context has quote + sub-questions + combined answer format
- [ ] Short answers are exactly 3-4 sentences
- [ ] Long answers are exactly 5-6 sentences
- [ ] MCQs have plausible distractors
- [ ] All vocabulary words have clear meanings and good example sentences
- [ ] No portion of the chapter is left uncovered
- [ ] JSON files are valid (no syntax errors)
- [ ] IDs follow consistent naming convention
- [ ] key_points are included where applicable

---

## ID Naming Convention

Use this pattern for question IDs:
- `{chapter_prefix}_{type}_{number}`

Examples:
- `tl_tq_1` - The Listeners, Textbook QA, Question 1
- `skeh_rtc_5` - Shree Krishna Eating House, Reference to Context, Question 5
- `daf_mcq_12` - Daffodils, MCQ, Question 12

Type abbreviations:
- `tq` - Textbook QA
- `rtc` - Reference to Context
- `sa` - Short Answer
- `la` - Long Answer
- `mcq` - Multiple Choice Question
- `ms` - Make Sentences

---

## Example: Creating Questions for "The Road Not Taken"

### 1. Read the poem/chapter thoroughly

### 2. Use the textbook_qa prompt:
```
I need you to create textbook Q&A questions for the chapter "The Road Not Taken" from English Literature.

[Paste the poem and all textbook content here]

Instructions: [as above]
```

### 3. Use the reference_to_context prompt:
```
I need you to create Reference to Context questions for "The Road Not Taken"...

Select passages like:
- "Two roads diverged in a yellow wood"
- "I took the one less traveled by"
- etc.
```

### 4. Continue with other question types...

---

## Tips for Best Results

1. **Be specific in prompts** - Include the exact chapter content
2. **Review AI output** - Check for accuracy against source material
3. **Maintain consistency** - Use same format across all chapters
4. **Cover everything** - Don't skip any section of the chapter
5. **Age-appropriate language** - Keep answers suitable for the grade level
6. **Include examples** - Reference specific lines/events from text in answers

---

## Updating subjects.json

When adding a new subject, update `/questions_cache/subjects.json`:

```json
{
  "subjects": [
    {
      "name": "Subject Name",
      "slug": "subject_name",
      "icon": "📚",
      "chapter_count": 5
    }
  ]
}
```

Note: chapter_count is now dynamically calculated from chapters.json, but keep it updated as a fallback.
