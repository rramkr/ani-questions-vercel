// config.js - Configuration and constants
// Version: 4.0

const GITHUB_USER = 'rramkr';
const GITHUB_REPO = 'ani-questions-vercel';
const GITHUB_BRANCH = 'main';
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/questions_cache`;

// Users database
const USERS = {
    'ani@study.com': { password: 'ani123', name: 'Anirudh', role: 'student' },
    'admin@study.com': { password: 'admin123', name: 'Admin', role: 'admin' }
};

// Wrong answers tracking key
const WRONG_ANSWERS_KEY = 'aniQuiz_wrongAnswers';

// Subject icons mapping
const SUBJECT_ICONS = {
    'Mathematics': '🔢',
    'Science': '🔬',
    'Physics': '⚡',
    'Chemistry': '🧪',
    'Biology': '🧬',
    'English': '📚',
    'English_E1': '📖',
    'English_E2': '📕',
    'History': '🏛️',
    'Geography': '🌍',
    'Computer': '💻',
    'Hindi': '🕉️',
    'default': '📘'
};

// Question type labels
const TYPE_LABELS = {
    'mcq': 'Multiple Choice',
    'true_false': 'True or False',
    'fill_in_blanks': 'Fill in the Blanks',
    'match_the_following': 'Match the Following',
    'short_answer': 'Short Answer',
    'long_answer': 'Long Answer',
    'reference_to_context': 'Reference to Context',
    'make_sentences': 'Make Sentences',
    'textbook_qa': 'Textbook Q&A'
};
