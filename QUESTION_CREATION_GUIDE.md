# Question Creation Guide for ICSE Quiz App

This is an interactive guide for creating comprehensive question banks. Follow the steps in order.

---

## STEP 1: GATHER INFORMATION

### 1.1 Ask for Source Folder

**ASK THE USER:**
```
Please provide the folder path containing the textbook chapter and any reference documents.

Example: /Users/username/subjects/English_E2/Chapter_Name/

The folder should contain:
- Scanned textbook pages (PDF or images)
- Any additional reference materials
- Word documents with notes (if any)
```

### 1.2 Ask for Subject and Chapter Details

**ASK THE USER:**
```
Please provide:
1. Subject Name (e.g., "English E2", "Physics", "Mathematics")
2. Chapter Name (e.g., "The Listeners", "Motion and Time")
3. Chapter Icon (emoji, e.g., 📚, ⚛️, 🔢)
4. A short prefix for question IDs (2-4 letters, e.g., "tl" for The Listeners)
```

### 1.3 Ask for Question Types

**ASK THE USER:**
```
Which question types do you want to create? (Select all that apply)

1. [ ] textbook_qa - Questions directly from textbook with answers
2. [ ] reference_to_context - Passage-based questions with sub-questions
3. [ ] short_answer - 3-4 sentence answer questions
4. [ ] long_answer - 5-6 sentence answer questions
5. [ ] mcq - Multiple choice questions
6. [ ] make_sentences - Vocabulary with meanings and sentences

Type the numbers separated by commas (e.g., "1,2,3,4,5,6" for all)
```

---

## STEP 2: READ AND ANALYZE SOURCE MATERIAL

### 2.1 Read All Source Documents

**ACTION:** Read every file in the provided folder:
- PDF files (textbook pages)
- Image files (scanned pages)
- Word/text documents

**IMPORTANT:**
- Read the ENTIRE chapter from start to finish
- Note down all sections: story/poem text, About Author, Words to Know, Comprehension Questions, Reference to Context, Working with Words, Grammar sections, Composition
- Do NOT miss any part of the chapter

### 2.2 Create Chapter Summary

Before creating questions, create a mental map of:
- Main characters/concepts
- Key events/points
- Important quotes/passages
- Vocabulary words
- Themes and messages
- All textbook questions and exercises

### 2.3 IMPORTANT ACCURACY RULES

**DO NOT:**
- Use phrases or terms that are NOT from the original chapter (e.g., don't invent phrases like "beacon of hope" if it's not in the text)
- Describe workers as "unpaid help" if they are paid (even small amounts like meals + 1 rupee/day counts as payment)
- Add literary terms or analysis phrases that aren't in the textbook
- Embellish or add details that aren't in the source material

**DO:**
- Use ONLY words, phrases, and concepts that appear in the original chapter
- Quote directly from the text whenever possible
- Keep answers factually accurate to the source material
- Verify all facts (number of siblings, payment amounts, locations, etc.) against the original text

---

## STEP 3: CREATE OUTPUT DIRECTORY

**ACTION:** Create the chapter folder structure:

```
questions_cache/{Subject_Name}/{Chapter_Name}/
```

Example:
```
questions_cache/English_E2/The Listeners/
```

---

## STEP 4: CREATE EACH QUESTION FILE

**IMPORTANT:** Create each question type as a SEPARATE file to avoid token limits. Complete one file fully before moving to the next.

---

### 4.1 TEXTBOOK Q&A (textbook_qa.json)

**PURPOSE:** Extract ALL questions from the textbook exactly as written, with comprehensive answers.

**WHAT TO INCLUDE:**
- All Comprehension questions (a, b, c, d...)
- All HOTS (Higher Order Thinking Skills) questions
- All Reference to Context questions from textbook
- Any other exercise questions

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "textbook_qa",
  "questions": [
    {
      "id": "{prefix}_tq_1",
      "question": "Exact question from textbook",
      "answer": "Comprehensive answer. For simple questions: 3-4 sentences. For HOTS/complex questions: 5-6 sentences. Cover all aspects the question asks about.",
      "key_points": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}
```

**CHECKLIST:**
- [ ] Every comprehension question included
- [ ] Every HOTS question included
- [ ] Every Reference to Context question from textbook included
- [ ] Answers are comprehensive and accurate
- [ ] Key points summarize the main ideas

---

### 4.2 REFERENCE TO CONTEXT (reference_to_context.json)

**PURPOSE:** Create passage-based questions where students read a quote and answer sub-questions.

**WHAT TO INCLUDE:**
- 10-15 important passages/quotes from the chapter
- Each passage should have 3-5 sub-questions
- Cover different parts of the chapter evenly

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "reference_to_context",
  "questions": [
    {
      "id": "{prefix}_rtc_1",
      "question": "Reference to Context: 'Exact quote from the text here.'\n\n(i) First question about the passage?\n(ii) Second question about the passage?\n(iii) Third question about the passage?\n(iv) Fourth question if needed?",
      "answer": "(i) Answer to first question in 2-3 sentences. Provide complete explanation.\n\n(ii) Answer to second question in 2-3 sentences. Be specific and accurate.\n\n(iii) Answer to third question in 2-3 sentences. Reference the text where helpful.\n\n(iv) Answer to fourth question if applicable.",
      "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"]
    }
  ]
}
```

**IMPORTANT FORMATTING RULE:**
- Each numbered sub-answer (i), (ii), (iii), (iv) MUST start on a new line
- Use `\n\n` between each numbered point to create proper line breaks
- DO NOT crowd multiple answers on the same line

**SUB-QUESTION TYPES TO USE:**
- Who is speaking / Who is being described?
- What is the context of this passage?
- What does [specific word/phrase] mean?
- Why did [character] do/say this?
- What happens before/after this?
- What is the significance of this passage?
- What mood/atmosphere is created?
- What literary device is used?

**CHECKLIST:**
- [ ] 10-15 passages selected from different parts of chapter
- [ ] Each passage has 3-5 sub-questions
- [ ] Questions cover who, what, where, when, why, how
- [ ] Answers are in (i), (ii), (iii) format
- [ ] Key points included

---

### 4.3 SHORT ANSWER (short_answer.json)

**PURPOSE:** Questions requiring 3-4 sentence answers for quick recall and understanding.

**WHAT TO INCLUDE:**
- 20-25 questions covering the entire chapter
- Questions on characters, events, concepts, meanings
- No part of the chapter should be left uncovered

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "short_answer",
  "questions": [
    {
      "id": "{prefix}_sa_1",
      "question": "Clear, specific question?",
      "answer": "First sentence directly answers the question. Second sentence provides supporting detail or explanation. Third sentence adds more context or examples. Fourth sentence concludes if needed.",
      "key_points": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}
```

**ANSWER LENGTH RULE:**
- EXACTLY 3-4 sentences
- Not 2 sentences, not 5 sentences
- 3-4 sentences only

**TOPICS TO COVER:**
- Character descriptions and roles
- Key events and their causes
- Important concepts and definitions
- Settings and atmosphere
- Relationships between characters/concepts
- Vocabulary meanings in context
- Author's purpose
- Themes and messages

**CHECKLIST:**
- [ ] 20-25 questions created
- [ ] All sections of chapter covered
- [ ] Each answer is exactly 3-4 sentences
- [ ] Key points included for each question

---

### 4.4 LONG ANSWER (long_answer.json)

**PURPOSE:** Questions requiring detailed 5-6 sentence answers for deeper understanding.

**WHAT TO INCLUDE:**
- 8-10 comprehensive questions
- Focus on analysis, comparison, and critical thinking
- Questions that require synthesis of multiple parts of the chapter

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "long_answer",
  "questions": [
    {
      "id": "{prefix}_la_1",
      "question": "Detailed question requiring comprehensive analysis?",
      "answer": "First sentence introduces the main point or thesis. Second sentence provides context or background information. Third sentence gives detailed explanation with specific examples from the text. Fourth sentence continues the explanation or provides additional examples. Fifth sentence discusses the significance, implications, or deeper meaning. Sixth sentence concludes or connects to broader themes.",
      "key_points": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"]
    }
  ]
}
```

**ANSWER LENGTH RULE:**
- EXACTLY 5-6 sentences
- Not 4 sentences, not 7 sentences
- 5-6 sentences only

**QUESTION TYPES TO INCLUDE:**
- Character analysis (describe character, their development)
- Theme exploration (what themes, how are they shown)
- Comparative questions (contrast two things)
- Significance questions (why is X important)
- Literary device analysis (how does author create effect)
- HOTS questions (what if, why do you think, evaluate)
- Summary questions (describe the main events/ideas)

**CHECKLIST:**
- [ ] 8-10 questions created
- [ ] Questions require deep thinking, not just recall
- [ ] Each answer is exactly 5-6 sentences
- [ ] Specific examples from text included in answers
- [ ] Key points (4-5) included for each question

---

### 4.5 MULTIPLE CHOICE QUESTIONS (mcq.json)

**PURPOSE:** Objective questions for quick assessment of knowledge.

**WHAT TO INCLUDE:**
- 30-40 MCQs covering the entire chapter
- Mix of easy, medium, and challenging questions
- Questions on facts, vocabulary, inference, and understanding

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "mcq",
  "questions": [
    {
      "id": "{prefix}_mcq_1",
      "question": "Clear question text?",
      "options": ["A. First option", "B. Second option", "C. Third option", "D. Fourth option"],
      "correct_answer": "B. Second option",
      "explanation": "Brief explanation of why B is correct and/or why others are wrong."
    }
  ]
}
```

**QUESTION DISTRIBUTION:**
- 10 questions: Factual recall (who, what, where, when)
- 8 questions: Vocabulary and word meanings
- 8 questions: Understanding and comprehension
- 8 questions: Inference and interpretation
- 6 questions: Sequence, cause-effect, or analysis

**RULES FOR OPTIONS:**
- All 4 options must be plausible
- No obviously wrong answers
- Options should be similar in length
- Avoid "all of the above" or "none of the above"

**CHECKLIST:**
- [ ] 30-40 MCQs created
- [ ] Questions cover entire chapter
- [ ] All options are plausible distractors
- [ ] Correct answer is marked
- [ ] Explanation provided for each

---

### 4.6 MAKE SENTENCES / VOCABULARY (make_sentences.json)

**PURPOSE:** Build vocabulary with meanings and usage examples.

**WHAT TO INCLUDE:**
- All words from "Words to Know" section
- Difficult/important vocabulary from the text
- Literary terms used in the chapter
- 15-25 words total

**FORMAT:**
```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
  "type": "make_sentences",
  "questions": [
    {
      "id": "{prefix}_ms_1",
      "word": "Word",
      "meaning": "Clear, student-friendly definition of the word",
      "sample_sentence": "A complete, meaningful sentence using the word correctly that clearly demonstrates its meaning."
    }
  ]
}
```

**RULES FOR SAMPLE SENTENCES:**
- Must be different from how the word is used in the chapter
- Must clearly show the meaning of the word
- Should be age-appropriate
- Should be interesting and relatable

**CHECKLIST:**
- [ ] All "Words to Know" included
- [ ] Other difficult words from chapter included
- [ ] Meanings are clear and simple
- [ ] Sample sentences demonstrate meaning well
- [ ] 15-25 words total

---

## STEP 5: CREATE SECTIONS.JSON

After creating all question files, create sections.json:

```json
{
  "subject": "{Subject Name}",
  "chapter": "{Chapter Name}",
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
      "title": "🔤 Vocabulary & Sentences",
      "types": ["make_sentences"]
    },
    {
      "title": "❓ Multiple Choice Questions",
      "types": ["mcq"]
    }
  ]
}
```

**NOTE:** Only include sections for question types that were created.

---

## STEP 6: UPDATE CHAPTERS.JSON

Add the new chapter to the subject's chapters.json file:

```json
{
  "subject": "{Subject Name}",
  "chapters": [
    {
      "name": "{Chapter Name}",
      "slug": "{Chapter Name}",
      "has_questions": true,
      "icon": "{emoji}"
    }
  ]
}
```

---

## STEP 7: FINAL VERIFICATION

### Quality Checklist

**Content Coverage:**
- [ ] Every section of the chapter is covered in questions
- [ ] No important character, event, or concept is missed
- [ ] Questions progress from simple to complex

**Format Compliance:**
- [ ] All JSON files are valid (no syntax errors)
- [ ] All IDs are unique and follow naming convention
- [ ] Short answers are exactly 3-4 sentences
- [ ] Long answers are exactly 5-6 sentences
- [ ] Reference to context has quote + (i), (ii), (iii) format

**Answer Quality:**
- [ ] Answers are accurate based on the text
- [ ] Answers are comprehensive
- [ ] Key points summarize main ideas well
- [ ] MCQ explanations are helpful

---

## EXECUTION SUMMARY

When a user asks to create questions for a new chapter:

1. **ASK** for source folder path
2. **ASK** for subject name, chapter name, icon, and ID prefix
3. **ASK** which question types to create
4. **READ** all source documents completely
5. **CREATE** each question file one at a time:
   - textbook_qa.json (if selected)
   - reference_to_context.json (if selected)
   - short_answer.json (if selected)
   - long_answer.json (if selected)
   - mcq.json (if selected)
   - make_sentences.json (if selected)
6. **CREATE** sections.json
7. **UPDATE** chapters.json
8. **VERIFY** all files are complete and correct

**IMPORTANT RULES:**
- Create ONE file at a time to avoid token limits
- Complete each file fully before moving to next
- Cover the ENTIRE chapter - no missing sections
- Follow the exact formats specified
- Maintain answer length requirements strictly

---

## ID NAMING CONVENTION

Pattern: `{prefix}_{type}_{number}`

Type codes:
- `tq` = Textbook QA
- `rtc` = Reference to Context
- `sa` = Short Answer
- `la` = Long Answer
- `mcq` = Multiple Choice Question
- `ms` = Make Sentences

Examples:
- `tl_tq_1` = The Listeners, Textbook QA, #1
- `skeh_rtc_5` = Shree Krishna Eating House, Reference to Context, #5
- `mot_mcq_23` = Motion, MCQ, #23

---

## SAMPLE EXECUTION

**User:** Create questions for the chapter in /Users/john/textbooks/English/Daffodils/

**Assistant:**
1. Reads all files in the folder
2. Asks: "I found the chapter 'Daffodils'. Please confirm:
   - Subject: English E2
   - Chapter: Daffodils
   - Icon suggestion: 🌼
   - ID prefix suggestion: daf

   Which question types do you want? (1-6)"

3. User selects types

4. Assistant creates each file one by one:
   - "Creating textbook_qa.json... Done. (15 questions)"
   - "Creating reference_to_context.json... Done. (12 passages)"
   - "Creating short_answer.json... Done. (22 questions)"
   - etc.

5. Creates sections.json and updates chapters.json

6. Reports: "All files created successfully. Please verify and deploy."
