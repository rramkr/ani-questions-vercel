// state.js - Application state management

// Current logged in user
let currentUser = null;

// Application state
const state = {
    subjects: [],
    currentSubject: null,
    currentChapter: null,
    currentType: null,
    questions: [],
    userAnswers: {},
    answersRevealed: false,
    showAllMode: false,
    allQuestionsAnswered: false,
    hasMore: false,
    currentOffset: 0,
    // One-by-one mode state
    oneByOneMode: false,
    currentQuestionIndex: 0,
    currentAnswerRevealed: false,
    currentEvaluation: null,
    isEvaluating: false,
};

// DOM Elements cache
let elements = {};
let views = {};

// Initialize DOM elements (called after DOM is loaded)
function initElements() {
    elements = {
        subjectsGrid: document.getElementById('subjects-grid'),
        chaptersList: document.getElementById('chapters-list'),
        chaptersTitle: document.getElementById('chapters-title'),
        sectionsTitle: document.getElementById('sections-title'),
        textbookTypes: document.getElementById('textbook-types'),
        examTypes: document.getElementById('exam-types'),
        miscTypes: document.getElementById('misc-types'),
        textbookSection: document.getElementById('textbook-section'),
        examSection: document.getElementById('exam-section'),
        miscSection: document.getElementById('misc-section'),
        questionsContainer: document.getElementById('questions-container'),
        quizTitle: document.getElementById('quiz-title'),
        loadingOverlay: document.getElementById('loading-overlay'),
        breadcrumb: document.getElementById('breadcrumb'),
        emptyState: document.getElementById('empty-state'),
        emptyMessage: document.getElementById('empty-message'),
        tryMoreBtn: document.getElementById('try-more-btn'),
        checkAnswersBtn: document.getElementById('check-answers-btn'),
        showAllAnswersBtn: document.getElementById('show-all-answers-btn'),
        challengeBanner: document.getElementById('challenge-banner'),
        resultsBanner: document.getElementById('results-banner'),
        resultsIcon: document.getElementById('results-icon'),
        resultsTitle: document.getElementById('results-title'),
        resultsMessage: document.getElementById('results-message'),
        scoreDisplay: document.getElementById('score-display'),
        currentScore: document.getElementById('current-score'),
        questionsShown: document.getElementById('questions-shown'),
        encouragementBanner: document.getElementById('encouragement-banner'),
        sectionsContainer: document.getElementById('sections-container'),
    };

    views = {
        login: document.getElementById('login-view'),
        mainApp: document.getElementById('main-app'),
        subjects: document.getElementById('subjects-view'),
        chapters: document.getElementById('chapters-view'),
        sections: document.getElementById('sections-view'),
        quiz: document.getElementById('quiz-view'),
    };
}
