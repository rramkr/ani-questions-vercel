// Version: 6.2 - Added Rules to Follow section for Direct and Indirect Speech
// Use local deployment URL for fetching questions (faster than GitHub raw)
const GITHUB_BASE_URL = './questions_cache';

// Configuration
const QUESTIONS_PER_BATCH = 10; // Changed from 20 to 10 for gamification

// ============== AUTHENTICATION ==============
// Simple hash function for client-side password verification
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// User database (hashed passwords for basic security)
const USERS = {
    'rramkr@gmail.com': {
        passwordHash: simpleHash('Ani1@unni2'),
        name: 'Admin',
        role: 'admin'
    },
    'anirudh.ramkr@gmail.com': {
        passwordHash: simpleHash('Sishya@1234'),
        name: 'Anirudh',
        role: 'student'
    }
};

// Current logged in user
let currentUser = null;

// Wrong answers tracking - stored in localStorage (per user)
const WRONG_ANSWERS_KEY_PREFIX = 'aniQuiz_wrongAnswers_';

// Get user-specific storage key
function getWrongAnswersKey() {
    const userEmail = currentUser?.email || 'anonymous';
    return WRONG_ANSWERS_KEY_PREFIX + userEmail.replace(/[^a-zA-Z0-9]/g, '_');
}

function getWrongAnswers() {
    try {
        return JSON.parse(localStorage.getItem(getWrongAnswersKey())) || {};
    } catch {
        return {};
    }
}

function saveWrongAnswers(data) {
    localStorage.setItem(getWrongAnswersKey(), JSON.stringify(data));
}

function addWrongAnswer(subject, chapter, questionType, question) {
    const wrongAnswers = getWrongAnswers();
    const key = `${subject}|${chapter}|${questionType}`;

    if (!wrongAnswers[key]) {
        wrongAnswers[key] = [];
    }

    // Check if question already exists (by ID)
    const exists = wrongAnswers[key].some(q => q.id === question.id);
    if (!exists) {
        wrongAnswers[key].push({
            id: question.id,
            question: question.question || question.statement,
            correct_answer: question.correct_answer || question.answer,
            explanation: question.explanation,
            type: questionType,
            addedAt: new Date().toISOString()
        });
        saveWrongAnswers(wrongAnswers);
    }
}

function removeWrongAnswer(subject, chapter, questionType, questionId) {
    const wrongAnswers = getWrongAnswers();
    const key = `${subject}|${chapter}|${questionType}`;

    if (wrongAnswers[key]) {
        wrongAnswers[key] = wrongAnswers[key].filter(q => q.id !== questionId);
        if (wrongAnswers[key].length === 0) {
            delete wrongAnswers[key];
        }
        saveWrongAnswers(wrongAnswers);
    }
}

function getWrongAnswersForChapter(subject, chapter) {
    const wrongAnswers = getWrongAnswers();
    const result = {};

    Object.keys(wrongAnswers).forEach(key => {
        const [s, c, type] = key.split('|');
        if (s === subject && c === chapter) {
            result[type] = wrongAnswers[key];
        }
    });

    return result;
}

function getAllWrongAnswers() {
    return getWrongAnswers();
}

function clearAllWrongAnswers() {
    localStorage.removeItem(getWrongAnswersKey());
    console.log('All wrong answers cleared for current user!');
}

// Clear wrong answers and refresh the sections view
function clearWrongAnswersAndRefresh() {
    if (confirm('Clear all wrong answers? This cannot be undone.')) {
        clearAllWrongAnswers();
        // Refresh the sections view to remove the wrong answers section
        if (state.currentSubject && state.currentChapter) {
            loadSections(state.currentChapter);
        }
    }
}

// Clear old global wrong answers (migration from old system)
function migrateOldWrongAnswers() {
    const oldKey = 'aniQuiz_wrongAnswers';
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
        // Remove old global data - each user starts fresh
        localStorage.removeItem(oldKey);
        console.log('Old global wrong answers data removed. Each user now has their own tracking.');
    }
}

// Check if user is logged in
function checkAuth() {
    const savedUser = localStorage.getItem('aniQuiz_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            return true;
        } catch {
            return false;
        }
    }
    return false;
}

// Login function
function login(email, password) {
    const user = USERS[email.toLowerCase()];
    if (user && user.passwordHash === simpleHash(password)) {
        currentUser = {
            email: email.toLowerCase(),
            name: user.name,
            role: user.role
        };
        localStorage.setItem('aniQuiz_user', JSON.stringify(currentUser));
        return true;
    }
    return false;
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('aniQuiz_user');
    showLoginView();
}

// Show login view
function showLoginView() {
    document.getElementById('login-view').classList.add('active');
    document.getElementById('main-app').style.display = 'none';
}

// Show main app
function showMainApp() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('main-app').style.display = 'flex';

    // Update welcome message with user's name
    const welcomeBanner = document.querySelector('.welcome-banner h1');
    if (welcomeBanner && currentUser) {
        welcomeBanner.textContent = `Hey ${currentUser.name}! Ready to be awesome? 🚀`;
    }
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (login(email, password)) {
        errorDiv.style.display = 'none';
        showMainApp();
        // Reload subjects after login
        loadSubjects();
    } else {
        errorDiv.style.display = 'block';
    }
}

// State
const state = {
    currentSubject: null,
    currentChapter: null,
    currentType: null,
    questions: [],
    currentOffset: 0,
    hasMore: false,
    answersRevealed: false,
    userAnswers: {},  // Store user's answers
    currentScore: 0,
    totalAnswered: 0,
    allQuestionsAnswered: false,
    showAllMode: false,  // Track if "show all answers" was clicked
    // New state for one-by-one question view
    oneByOneMode: false,  // Whether to show questions one by one
    currentQuestionIndex: 0,  // Current question index in one-by-one mode
    currentAnswerRevealed: false,  // Whether current question's answer is shown
    currentEvaluation: null,  // AI evaluation result for current answer
    isEvaluating: false,  // Loading state for evaluation
};

// DOM Elements
const views = {
    subjects: document.getElementById('subjects-view'),
    chapters: document.getElementById('chapters-view'),
    sections: document.getElementById('sections-view'),
    quiz: document.getElementById('quiz-view'),
};

const elements = {
    appTitle: document.getElementById('app-title'),
    breadcrumb: document.getElementById('breadcrumb'),
    subjectsGrid: document.getElementById('subjects-grid'),
    chaptersList: document.getElementById('chapters-list'),
    chaptersTitle: document.getElementById('chapters-title'),
    sectionsTitle: document.getElementById('sections-title'),
    textbookTypes: document.getElementById('textbook-types'),
    previousYearTypes: document.getElementById('previous-year-types'),
    examTypes: document.getElementById('exam-types'),
    miscTypes: document.getElementById('misc-types'),
    textbookSection: document.getElementById('textbook-section'),
    previousYearSection: document.getElementById('previous-year-section'),
    examSection: document.getElementById('exam-section'),
    miscSection: document.getElementById('misc-section'),
    quizTitle: document.getElementById('quiz-title'),
    questionsShown: document.getElementById('questions-shown'),
    questionsContainer: document.getElementById('questions-container'),
    tryMoreBtn: document.getElementById('try-more-btn'),
    checkAnswersBtn: document.getElementById('check-answers-btn'),
    loadingOverlay: document.getElementById('loading-overlay'),
    emptyState: document.getElementById('empty-state'),
    emptyMessage: document.getElementById('empty-message'),
    challengeBanner: document.getElementById('challenge-banner'),
    resultsBanner: document.getElementById('results-banner'),
    resultsIcon: document.getElementById('results-icon'),
    resultsTitle: document.getElementById('results-title'),
    resultsMessage: document.getElementById('results-message'),
    scoreDisplay: document.getElementById('score-display'),
    currentScore: document.getElementById('current-score'),
    encouragementBanner: document.getElementById('encouragement-banner'),
    showAllAnswersBtn: document.getElementById('show-all-answers-btn'),
};

// Navigation buttons
document.getElementById('back-to-subjects').addEventListener('click', () => {
    resetState();
    showView('subjects');
    updateHash();
});
document.getElementById('back-to-chapters').addEventListener('click', () => {
    state.currentChapter = null;
    state.currentType = null;
    showView('chapters');
    updateHash();
});
document.getElementById('back-to-sections').addEventListener('click', () => {
    state.currentType = null;
    showView('sections');
    updateHash();
});
document.getElementById('try-more-btn').addEventListener('click', loadMoreQuestions);
document.getElementById('check-answers-btn').addEventListener('click', revealAnswers);
document.getElementById('show-all-answers-btn').addEventListener('click', showAllAnswers);
elements.appTitle.addEventListener('click', () => {
    resetState();
    showView('subjects');
    updateHash();
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    // Setup login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Check if user is already logged in
    if (!checkAuth()) {
        showLoginView();
        return;
    }

    // User is logged in, show main app
    showMainApp();
    showLoading(true);

    // Migrate from old global wrong answers to per-user system
    migrateOldWrongAnswers();

    // Load subjects first
    await loadSubjects();

    // Check if there's a hash to restore (or fallback to sessionStorage)
    let hash = window.location.hash.slice(1);

    // If no hash, check sessionStorage backup
    if (!hash) {
        const savedNav = sessionStorage.getItem('quizAppNav');
        if (savedNav) {
            hash = savedNav;
            // Restore the hash in URL
            history.replaceState(null, '', `#${hash}`);
        }
    }

    if (hash) {
        // Try to restore state from hash
        await handleHashChange();
    }

    showLoading(false);

    // Listen for hash changes (back/forward buttons)
    window.addEventListener('hashchange', handleHashChange);
}

// URL Hash Routing
function updateHash() {
    let hash = '';

    if (state.currentSubject && state.currentChapter && state.currentType) {
        // Quiz view: #subject/chapter/type
        hash = `${encodeURIComponent(state.currentSubject.name)}/${encodeURIComponent(state.currentChapter.name)}/${state.currentType.value}`;
    } else if (state.currentSubject && state.currentChapter) {
        // Sections view: #subject/chapter
        hash = `${encodeURIComponent(state.currentSubject.name)}/${encodeURIComponent(state.currentChapter.name)}`;
    } else if (state.currentSubject) {
        // Chapters view: #subject
        hash = encodeURIComponent(state.currentSubject.name);
    }
    // else: subjects view (no hash)

    // Update URL without triggering hashchange event
    const newUrl = hash ? `#${hash}` : window.location.pathname;
    if (window.location.hash !== `#${hash}` && window.location.hash !== (hash ? `#${hash}` : '')) {
        history.replaceState(null, '', newUrl);
    }

    // Also save to sessionStorage as backup
    if (hash) {
        sessionStorage.setItem('quizAppNav', hash);
    } else {
        sessionStorage.removeItem('quizAppNav');
    }
}

async function handleHashChange() {
    const hash = window.location.hash.slice(1); // Remove #

    if (!hash) {
        // No hash - show subjects
        resetState();
        showView('subjects');
        return;
    }

    try {
        const parts = hash.split('/').map(p => decodeURIComponent(p));

        if (parts.length >= 1 && parts[0]) {
            // Find subject
            const subjectName = parts[0];
            const subjectsResponse = await fetch(`${GITHUB_BASE_URL}/subjects.json`);
            if (!subjectsResponse.ok) throw new Error('Failed to load subjects');
            const subjectsData = await subjectsResponse.json();
            const subject = subjectsData.subjects.find(s => s.name === subjectName);

            if (!subject) {
                resetState();
                showView('subjects');
                return;
            }

            // Load chapters for this subject (folders use underscores)
            const subjectFolder = subject.name.replace(/ /g, '_');
            const chaptersResponse = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/chapters.json`);
            if (!chaptersResponse.ok) throw new Error('Failed to load chapters');
            const chaptersData = await chaptersResponse.json();
            state.currentSubject = subject;

            if (parts.length >= 2 && parts[1]) {
                // Find chapter
                const chapterName = parts[1];
                const chapter = chaptersData.chapters.find(c => c.name === chapterName);

                if (!chapter || !chapter.has_questions) {
                    renderChapters(chaptersData.chapters);
                    showView('chapters');
                    updateHash();
                    return;
                }

                state.currentChapter = chapter;

                // Load sections (chapter folders may have spaces, need URL encoding)
                const chapterFolder = encodeURIComponent(chapter.name);
                const sectionsResponse = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/sections.json`);

                if (!sectionsResponse.ok) {
                    renderChapters(chaptersData.chapters);
                    showView('chapters');
                    updateHash();
                    return;
                }

                const sectionsData = await sectionsResponse.json();

                if (parts.length >= 3 && parts[2]) {
                    // Find question type and load quiz
                    const typeValue = parts[2];
                    const allTypes = [
                        ...(sectionsData.sections.textbook || []),
                        ...(sectionsData.sections.exam || []),
                        ...(sectionsData.sections.miscellaneous || [])
                    ];
                    const questionType = allTypes.find(t => t.value === typeValue);

                    if (questionType) {
                        await loadQuestions(questionType, 0);
                        return;
                    }
                }

                // Show sections view
                renderSections(sectionsData.sections);
                showView('sections');
            } else {
                // Show chapters view
                renderChapters(chaptersData.chapters);
                showView('chapters');
            }
        }
    } catch (error) {
        console.error('Error in hash navigation:', error);
        // Fall back to subjects view on error
        resetState();
        showView('subjects');
        updateHash();
    }
}

function showLoading(show) {
    elements.loadingOverlay.classList.toggle('visible', show);
}

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
    updateBreadcrumb(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBreadcrumb(viewName) {
    let breadcrumb = '';

    if (viewName === 'chapters' || viewName === 'sections' || viewName === 'quiz') {
        breadcrumb += `<a href="#" onclick="navigateTo('subjects'); return false;">Subjects</a>`;
    }

    if ((viewName === 'sections' || viewName === 'quiz') && state.currentSubject) {
        breadcrumb += `<span>></span><a href="#" onclick="navigateTo('chapters'); return false;">${state.currentSubject.name}</a>`;
    }

    if (viewName === 'quiz' && state.currentChapter) {
        breadcrumb += `<span>></span><a href="#" onclick="navigateTo('sections'); return false;">${state.currentChapter.name}</a>`;
    }

    elements.breadcrumb.innerHTML = breadcrumb;
}

// Proper navigation function for breadcrumbs that updates state and hash
function navigateTo(viewName) {
    if (viewName === 'subjects') {
        resetState();
        showView('subjects');
        updateHash();
    } else if (viewName === 'chapters') {
        state.currentChapter = null;
        state.currentType = null;
        state.questions = [];
        state.answersRevealed = false;
        state.userAnswers = {};
        showView('chapters');
        updateHash();
    } else if (viewName === 'sections') {
        state.currentType = null;
        state.questions = [];
        state.answersRevealed = false;
        state.userAnswers = {};
        showView('sections');
        updateHash();
    }
}

function resetState() {
    state.currentSubject = null;
    state.currentChapter = null;
    state.currentType = null;
    state.questions = [];
    state.currentOffset = 0;
    state.hasMore = false;
    state.answersRevealed = false;
    state.userAnswers = {};
    state.currentScore = 0;
    state.totalAnswered = 0;
    state.allQuestionsAnswered = false;
    state.showAllMode = false;
    state.oneByOneMode = false;
    state.currentQuestionIndex = 0;
    state.currentAnswerRevealed = false;
}

// API Calls - Fetching from GitHub
async function loadSubjects() {
    try {
        const response = await fetch(`${GITHUB_BASE_URL}/subjects.json`);
        const data = await response.json();

        if (data.subjects.length === 0) {
            showEmptyState('No subjects found.');
            return;
        }

        // Dynamically fetch chapter counts for each subject
        const subjectsWithCounts = await Promise.all(data.subjects.map(async (subject) => {
            try {
                const subjectFolder = subject.name.replace(/ /g, '_');
                const chaptersResponse = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/chapters.json`);
                if (chaptersResponse.ok) {
                    const chaptersData = await chaptersResponse.json();
                    // Count only chapters that have questions
                    const availableChapters = chaptersData.chapters.filter(ch => ch.has_questions);
                    return { ...subject, chapter_count: availableChapters.length };
                }
            } catch (e) {
                console.warn(`Could not fetch chapters for ${subject.name}`);
            }
            return subject; // Return original if fetch fails
        }));

        renderSubjects(subjectsWithCounts);
    } catch (error) {
        console.error('Error loading subjects:', error);
        showEmptyState('Failed to load subjects. Please try again later.');
    }
}

async function loadChapters(subject) {
    showLoading(true);
    try {
        // Convert subject name to folder format (underscores)
        const subjectFolder = subject.name.replace(/ /g, '_');
        const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/chapters.json`);
        const data = await response.json();

        state.currentSubject = subject;
        state.currentChapter = null;
        state.currentType = null;
        renderChapters(data.chapters);
        showView('chapters');
        updateHash();
    } catch (error) {
        console.error('Error loading chapters:', error);
        alert('Failed to load chapters');
    }
    showLoading(false);
}

async function loadSections(chapter) {
    showLoading(true);
    try {
        const subjectFolder = state.currentSubject.name.replace(/ /g, '_');
        const chapterFolder = encodeURIComponent(chapter.name);
        const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/sections.json`);

        if (!response.ok) {
            alert('No questions available for this chapter');
            showLoading(false);
            return;
        }

        const data = await response.json();
        state.currentChapter = chapter;
        state.currentType = null;
        renderSections(data.sections);
        showView('sections');
        updateHash();
    } catch (error) {
        console.error('Error loading sections:', error);
        alert('Failed to load question types');
    }
    showLoading(false);
}

async function loadQuestions(type, offset = 0, isTextbookSection = false) {
    showLoading(true);

    // Handle rules type separately
    if (type.value === 'rules') {
        await loadRules(type);
        showLoading(false);
        return;
    }

    try {
        let allQuestions;

        // Check if this is from textbook section - show all at once, no shuffling
        const isTextbook = isTextbookSection || type.value === 'textbook_qa';

        // For offset > 0, use already stored shuffled questions
        if (offset > 0 && state.allQuestions && state.allQuestions.length > 0) {
            allQuestions = state.allQuestions;
        } else {
            // Fetch fresh questions for offset 0
            const subjectFolder = state.currentSubject.name.replace(/ /g, '_');
            const chapterFolder = encodeURIComponent(state.currentChapter.name);
            const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/${type.value}.json`);

            if (!response.ok) {
                alert('Failed to load questions');
                showLoading(false);
                return;
            }

            const data = await response.json();
            allQuestions = data.questions || [];

            // For textbook Q&A: keep original order. For others: shuffle
            if (!isTextbook) {
                allQuestions = shuffleArray([...allQuestions]);
            }
        }

        // Since we're in one-by-one mode, load ALL questions at once
        let batchQuestions = allQuestions;

        // Process questions to match expected format
        const processedQuestions = batchQuestions.map(q => processQuestion(q, type.value));

        if (offset === 0) {
            state.currentType = type;
            state.questions = processedQuestions;
            state.answersRevealed = false;
            state.userAnswers = {};
            state.currentScore = 0;
            state.totalAnswered = 0;
            state.allQuestionsAnswered = false;
            state.showAllMode = false; // Reset show all mode
            state.allQuestions = allQuestions; // Store all for pagination
            state.isTextbookMode = isTextbook; // Store textbook flag
            // Enable one-by-one mode for all questions
            state.oneByOneMode = true;
            state.currentQuestionIndex = 0;
            state.currentAnswerRevealed = false;
        } else {
            // For "Try More", replace questions with new batch (not append)
            state.questions = processedQuestions;
            state.answersRevealed = false;
            state.userAnswers = {};
            state.currentScore = 0;
            state.totalAnswered = 0;
            state.allQuestionsAnswered = false;
            state.showAllMode = false;
            // Reset one-by-one mode state
            state.currentQuestionIndex = 0;
            state.currentAnswerRevealed = false;
        }

        state.currentOffset = allQuestions.length;
        state.hasMore = false; // No pagination in one-by-one mode

        renderQuiz();
        showView('quiz');
        if (offset === 0) {
            updateHash(); // Only update hash on initial load, not on "Try More"
        }
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions');
    }
    showLoading(false);
}

// Load and render rules content
async function loadRules(type) {
    try {
        const subjectFolder = state.currentSubject.name.replace(/ /g, '_');
        const chapterFolder = encodeURIComponent(state.currentChapter.name);
        const url = `${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/rules.json`;
        console.log('Fetching rules from:', url);
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Failed to fetch rules, status:', response.status);
            alert('Failed to load rules');
            return;
        }

        const rulesData = await response.json();
        console.log('Rules data loaded:', rulesData);
        state.currentType = type;
        renderRules(rulesData);
        showView('quiz');
    } catch (error) {
        console.error('Error loading rules:', error);
        alert('Failed to load rules: ' + error.message);
    }
}

// Render rules content
function renderRules(rulesData) {
    console.log('Rendering rules...');
    if (elements.quizTitle) elements.quizTitle.textContent = `${rulesData.title} - ${state.currentChapter.name}`;
    if (elements.questionsShown) elements.questionsShown.textContent = rulesData.steps.length + ' steps';

    // Hide quiz-specific elements
    if (elements.challengeBanner) elements.challengeBanner.style.display = 'none';
    if (elements.resultsBanner) elements.resultsBanner.style.display = 'none';
    if (elements.scoreDisplay) elements.scoreDisplay.style.display = 'none';
    if (elements.tryMoreBtn) elements.tryMoreBtn.style.display = 'none';
    if (elements.checkAnswersBtn) elements.checkAnswersBtn.style.display = 'none';
    if (elements.showAllAnswersBtn) elements.showAllAnswersBtn.style.display = 'none';

    let html = '<div class="rules-container">';

    rulesData.steps.forEach(step => {
        html += `
            <div class="rule-step">
                <div class="rule-step-header">
                    <span class="step-number">Step ${step.step_number}</span>
                    <span class="step-title">${step.title}</span>
                </div>
                <div class="rule-step-content">
        `;

        if (step.description) {
            html += `<p class="rule-description">${step.description}</p>`;
        }

        if (step.note) {
            html += `<p class="rule-note"><strong>Note:</strong> ${step.note}</p>`;
        }

        // Render rules table if exists
        if (step.rules && step.rules.length > 0) {
            html += '<div class="rules-table-container"><table class="rules-table"><thead><tr>';

            // Determine table headers based on step type
            if (step.step_number === 1) {
                html += '<th>If you see...</th><th>Sentence Type</th><th>Example</th>';
            } else if (step.step_number === 2) {
                html += '<th>Type</th><th>Change to</th><th>Example (Direct)</th><th>Example (Indirect)</th>';
            } else if (step.step_number === 3 || step.step_number === 4 || step.step_number === 5) {
                html += '<th>Direct Speech</th><th>Indirect Speech</th><th>Example (Direct)</th><th>Example (Indirect)</th>';
            }

            html += '</tr></thead><tbody>';

            step.rules.forEach(rule => {
                html += '<tr>';
                if (step.step_number === 1) {
                    html += `<td>${rule.condition}</td><td>${rule.type}</td><td class="example-cell">${rule.example}</td>`;
                } else if (step.step_number === 2) {
                    html += `<td>${rule.type}</td><td>${rule.change_to}</td><td class="example-cell">${rule.example_direct}</td><td class="example-cell">${rule.example_indirect}</td>`;
                } else {
                    html += `<td><strong>${rule.direct}</strong></td><td><strong>${rule.indirect}</strong></td><td class="example-cell">${rule.example_direct}</td><td class="example-cell">${rule.example_indirect}</td>`;
                }
                html += '</tr>';
            });

            html += '</tbody></table></div>';
        }

        // Render subsections if exists (for steps 6 and 7)
        if (step.subsections && step.subsections.length > 0) {
            step.subsections.forEach(subsection => {
                html += `<div class="rule-subsection">`;
                html += `<h4 class="subsection-title">${subsection.name}</h4>`;

                if (subsection.instructions && subsection.instructions.length > 0) {
                    html += '<ul class="subsection-instructions">';
                    subsection.instructions.forEach(inst => {
                        html += `<li>${inst}</li>`;
                    });
                    html += '</ul>';
                }

                if (subsection.examples && subsection.examples.length > 0) {
                    html += '<div class="rules-table-container"><table class="rules-table"><thead><tr><th>Direct</th><th>Indirect</th></tr></thead><tbody>';
                    subsection.examples.forEach(ex => {
                        html += `<tr><td class="example-cell">${ex.direct}</td><td class="example-cell">${ex.indirect}</td></tr>`;
                    });
                    html += '</tbody></table></div>';
                }

                html += '</div>';
            });
        }

        html += '</div></div>';
    });

    html += '</div>';

    elements.questionsContainer.innerHTML = html;
}

// Shuffle array helper
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Process question to match frontend format
function processQuestion(q, questionType) {
    const processed = {
        id: q.id || Math.random().toString(36).substr(2, 9),
        type: questionType,
        question: q.question || q.statement || '',
        correct_answer: q.correct_answer || q.answer || '',
        explanation: q.explanation || '',
        source_section: q.source_section || '',
    };

    if (questionType === 'mcq' || questionType === 'assertion_reason') {
        processed.options = q.options || [];
        if (questionType === 'assertion_reason') {
            processed.question = `Assertion (A): ${q.assertion || ''}\nReason (R): ${q.reason || ''}`;
            // correct_answer in JSON is just the letter (A, B, C, D), find the full option text
            const correctLetter = (q.correct_answer || q.correct_option || '').trim().toUpperCase();
            const fullOption = processed.options.find(opt => {
                const trimmedOpt = opt.trim();
                return trimmedOpt.startsWith(correctLetter + '.') ||
                       trimmedOpt.startsWith(correctLetter + ' ') ||
                       trimmedOpt.charAt(0).toUpperCase() === correctLetter;
            });
            processed.correct_answer = fullOption || q.correct_answer || '';
        }
    } else if (questionType === 'true_false') {
        processed.question = q.statement || q.question || '';
        processed.correct_answer = q.answer === true || q.answer === 'True' ? 'True' : 'False';
    } else if (questionType === 'match_the_following') {
        const pairs = q.pairs || [];
        processed.question = q.instruction || 'Match the following:';
        processed.left_items = pairs.map(p => p.left);
        processed.right_items = shuffleArray(pairs.map(p => p.right));
        processed.pairs = pairs;
    } else if (questionType === 'give_reason') {
        // Handle both naming conventions: statement/question
        const statement = q.statement || q.question || '';
        processed.question = `Give reason: ${statement}`;
        processed.correct_answer = q.reason || q.answer || '';
        processed.key_points = q.key_points || [];
    } else if (questionType === 'differentiate_between') {
        // Handle both naming conventions: term1/term2 and concept_a/concept_b
        const conceptA = q.term1 || q.concept_a || '';
        const conceptB = q.term2 || q.concept_b || '';
        processed.question = `Differentiate between ${conceptA} and ${conceptB}`;
        // Map differences to use consistent naming
        processed.differences = (q.differences || []).map(d => ({
            aspect: d.aspect || '',
            concept_a_point: d.term1_point || d.concept_a_point || '',
            concept_b_point: d.term2_point || d.concept_b_point || ''
        }));
        processed.concept_a = conceptA;
        processed.concept_b = conceptB;
    } else if (questionType === 'case_study') {
        processed.question = q.case_text || q.question || '';
        processed.sub_questions = q.questions || [];
    } else if (questionType === 'numericals') {
        processed.given_data = q.given_data || [];
        processed.formula = q.formula || '';
        processed.solution_steps = q.solution_steps || [];
    } else if (questionType === 'reference_to_context') {
        // Copy extract field for reference to context questions
        processed.extract = q.extract || '';
        processed.justification = q.justification || '';
    } else if (questionType === 'make_sentences') {
        // Copy word, meaning, sample_sentence for make sentences questions
        processed.word = q.word || '';
        processed.meaning = q.meaning || '';
        processed.sample_sentence = q.sample_sentence || '';
    } else {
        // For short_answer, long_answer, textbook_qa, hots, name_the_following, tricky_questions
        processed.key_points = q.key_points || [];
        processed.keywords = q.keywords || [];
        processed.context = q.context || '';
        processed.why_tricky = q.why_tricky || '';
        processed.justification = q.justification || '';
    }

    return processed;
}

async function loadMoreQuestions() {
    // Reset for new batch
    state.answersRevealed = false;
    state.userAnswers = {};
    state.currentScore = 0;
    state.totalAnswered = 0;
    state.allQuestionsAnswered = false;
    state.showAllMode = false;

    await loadQuestions(state.currentType, state.currentOffset);
}

// Load previously wrong questions for review
async function loadWrongQuestions(questionType) {
    showLoading(true);

    const wrongAnswers = getWrongAnswersForChapter(
        state.currentSubject.name,
        state.currentChapter.name
    );

    const questions = wrongAnswers[questionType] || [];

    if (questions.length === 0) {
        alert('No wrong questions to review!');
        showLoading(false);
        return;
    }

    // Set up state for wrong questions review
    const typeLabel = questionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    state.currentType = {
        value: questionType,
        label: `Review: ${typeLabel}`,
        icon: '🔄'
    };

    // Process questions to match expected format
    const processedQuestions = questions.map(q => processQuestion(q, questionType));

    state.questions = processedQuestions;
    state.answersRevealed = false;
    state.userAnswers = {};
    state.currentScore = 0;
    state.totalAnswered = 0;
    state.allQuestionsAnswered = false;
    state.showAllMode = false;
    state.currentOffset = questions.length;
    state.hasMore = false; // No more for wrong questions
    state.allQuestions = processedQuestions;

    renderQuiz();
    showView('quiz');
    showLoading(false);
}

function calculateScore() {
    let score = 0;
    let total = state.questions.length;

    state.questions.forEach(q => {
        const userAnswer = state.userAnswers[q.id];
        if (userAnswer !== undefined && userAnswer !== '') {
            if (isAnswerCorrect(q, userAnswer)) {
                score++;
            }
        }
    });

    state.currentScore = score;
    state.totalAnswered = total;

    return { score, total };
}

function isAnswerCorrect(question, userAnswer) {
    const qType = question.type;

    if (qType === 'mcq') {
        return userAnswer === question.correct_answer;
    } else if (qType === 'assertion_reason') {
        // For assertion-reason, compare by the letter prefix (A, B, C, D)
        const userLetter = (userAnswer || '').trim().charAt(0).toUpperCase();
        const correctLetter = (question.correct_answer || '').trim().charAt(0).toUpperCase();
        return userLetter === correctLetter && userLetter !== '';
    } else if (qType === 'true_false') {
        const correctBool = question.correct_answer === true || question.correct_answer === 'True' || question.correct_answer === 'true';
        return (userAnswer === 'True' && correctBool) || (userAnswer === 'False' && !correctBool);
    } else if (qType === 'fill_in_blanks' || qType === 'name_the_following') {
        // Flexible matching for fill in blanks
        const correct = (question.correct_answer || question.answer || '').toLowerCase().trim();
        const user = (userAnswer || '').toLowerCase().trim();
        // Check if user answer matches any of the acceptable answers (separated by "or")
        const acceptableAnswers = correct.split(/\s*\(or\s*|\s*or\s*|\)\s*/i).map(a => a.trim()).filter(a => a);
        return acceptableAnswers.some(ans => user === ans || user.includes(ans) || ans.includes(user));
    }

    // For other types, we can't auto-check
    return false;
}

function getResultMessage(score, total) {
    const percentage = (score / total) * 100;

    if (percentage === 100) {
        return {
            icon: '🏆',
            title: 'WOW! Perfect Score!',
            message: `You're a SUPERSTAR! All ${total} correct! 🌟`,
            class: 'perfect'
        };
    } else if (percentage >= 80) {
        return {
            icon: '🌟',
            title: 'Amazing Job!',
            message: `Fantastic! You got ${score} out of ${total}! So close to perfect!`,
            class: 'excellent'
        };
    } else if (percentage >= 60) {
        return {
            icon: '👍',
            title: 'Great Work!',
            message: `Nice! You scored ${score} out of ${total}. You're getting better!`,
            class: 'good'
        };
    } else if (percentage >= 40) {
        return {
            icon: '💪',
            title: 'Good Effort!',
            message: `You got ${score} out of ${total}. Practice more and you'll ace it!`,
            class: 'average'
        };
    } else {
        return {
            icon: '📚',
            title: 'Keep Trying!',
            message: `You got ${score} out of ${total}. Read the chapter again - you've got this!`,
            class: 'needs-work'
        };
    }
}

function revealAnswers() {
    state.answersRevealed = true;

    // Check how many questions are answered
    const answeredCount = state.questions.filter(q => {
        const userAnswer = state.userAnswers[q.id];
        return userAnswer !== undefined && userAnswer !== '' &&
               (typeof userAnswer !== 'object' || Object.values(userAnswer).some(v => v && v !== ''));
    }).length;

    const allAnswered = answeredCount === state.questions.length;

    // Calculate score
    const { score, total } = calculateScore();
    const result = getResultMessage(score, total);

    // Track wrong answers for students (not for admin)
    if (currentUser && currentUser.role === 'student') {
        state.questions.forEach(q => {
            const userAnswer = state.userAnswers[q.id];
            const isAnswered = userAnswer !== undefined && userAnswer !== '' &&
                (typeof userAnswer !== 'object' || Object.values(userAnswer).some(v => v && v !== ''));

            if (isAnswered) {
                const correct = isAnswerCorrect(q, userAnswer);
                if (!correct) {
                    // Add to wrong answers
                    addWrongAnswer(
                        state.currentSubject.name,
                        state.currentChapter.name,
                        state.currentType.value,
                        q
                    );
                } else {
                    // If answered correctly, remove from wrong answers (if present)
                    removeWrongAnswer(
                        state.currentSubject.name,
                        state.currentChapter.name,
                        state.currentType.value,
                        q.id
                    );
                }
            }
        });
    }

    // Update results banner
    elements.resultsIcon.textContent = result.icon;
    elements.resultsTitle.textContent = result.title;

    if (!allAnswered) {
        // Show message about unanswered questions
        elements.resultsMessage.textContent = `You answered ${answeredCount} of ${total} questions. Answer all to see "Try More"!`;
        elements.resultsBanner.className = 'results-banner average';
    } else {
        elements.resultsMessage.textContent = result.message;
        elements.resultsBanner.className = `results-banner ${result.class}`;
    }
    elements.resultsBanner.style.display = 'flex';

    // Update score display (only count answered questions)
    elements.currentScore.textContent = `${score}/${answeredCount}`;
    elements.scoreDisplay.style.display = 'block';

    // Hide challenge banner
    elements.challengeBanner.style.display = 'none';

    // Show encouragement banner
    elements.encouragementBanner.style.display = 'block';

    // Store whether all answered for button display
    state.allQuestionsAnswered = allAnswered;

    // Re-render to show answers
    renderQuiz();

    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showAllAnswers() {
    state.answersRevealed = true;
    state.showAllMode = true; // Special flag to show all answers regardless of user input
    state.allQuestionsAnswered = true; // Allow "Try More" button

    // Update results banner for "show all" mode
    elements.resultsIcon.textContent = '📖';
    elements.resultsTitle.textContent = 'Study Mode - Learn & Grow!';
    elements.resultsMessage.textContent = 'Here are all the answers! Read them carefully and become smarter! 🧠✨';
    elements.resultsBanner.className = 'results-banner study';
    elements.resultsBanner.style.display = 'flex';

    // Hide score display since user didn't answer
    elements.scoreDisplay.style.display = 'none';

    // Hide challenge banner
    elements.challengeBanner.style.display = 'none';

    // Show encouragement banner
    elements.encouragementBanner.style.display = 'block';

    // Re-render to show all answers
    renderQuizShowAll();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuizShowAll() {
    elements.quizTitle.textContent = `${state.currentType.label} - ${state.currentChapter.name}`;
    elements.questionsShown.textContent = state.questions.length;

    elements.questionsContainer.innerHTML = state.questions.map((q, index) =>
        renderQuestionShowAll(q, index)
    ).join('');

    // Show buttons
    elements.tryMoreBtn.style.display = state.hasMore ? 'inline-block' : 'none';
    elements.checkAnswersBtn.style.display = 'none'; // Hide check answers since all are shown
    elements.showAllAnswersBtn.style.display = 'none'; // Hide since already clicked
}

function renderQuestionShowAll(question, index) {
    const qType = question.type;
    let questionContent = '';
    let answerContent = '';

    // Build question content based on type (no highlighting needed)
    if (qType === 'mcq' || qType === 'assertion_reason') {
        questionContent = renderMCQQuestion(question, index, false);
        answerContent = renderMCQAnswerShowAll(question);
    } else if (qType === 'true_false') {
        questionContent = renderTrueFalseQuestion(question, index, false);
        answerContent = renderSimpleAnswerShowAll(question);
    } else if (qType === 'fill_in_blanks' || qType === 'name_the_following') {
        questionContent = renderTextInputQuestion(question, index, false);
        answerContent = renderSimpleAnswerShowAll(question);
    } else if (qType === 'match_the_following') {
        questionContent = renderMatchQuestion(question, index, false);
        answerContent = renderMatchAnswer(question);
    } else if (qType === 'differentiate_between') {
        questionContent = renderDifferentiateQuestion(question, index, false);
        answerContent = renderDifferentiateAnswer(question);
    } else if (qType === 'numericals') {
        questionContent = renderNumericalQuestion(question, index, false);
        answerContent = renderNumericalAnswer(question);
    } else if (qType === 'case_study') {
        questionContent = renderCaseStudyQuestion(question, index, false);
        answerContent = renderCaseStudyAnswer(question);
    } else {
        questionContent = renderTextQuestion(question, index, false);
        answerContent = renderTextAnswerShowAll(question);
    }

    return `
        <div class="question-row" id="question-${question.id}">
            <div class="question-side">
                <div class="question-number">Q${index + 1}</div>
                <div class="question-content">
                    ${questionContent}
                </div>
            </div>
            <div class="answer-side revealed">
                ${answerContent}
            </div>
        </div>
    `;
}

// Answer renderers for "Show All" mode (no correct/incorrect status)
function renderMCQAnswerShowAll(q) {
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');
    return `
        <div class="correct-answer">
            <strong>Answer:</strong> ${q.correct_answer}
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
    `;
}

function renderSimpleAnswerShowAll(q) {
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');
    return `
        <div class="correct-answer">
            <strong>Answer:</strong> ${q.correct_answer || q.answer}
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
    `;
}

function renderTextAnswerShowAll(q) {
    const keyPoints = q.key_points || [];
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');

    return `
        <div class="correct-answer">
            <strong>Answer:</strong>
            <p>${q.correct_answer || q.answer}</p>
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
        ${keyPoints.length > 0 ? `
            <div class="key-points">
                <strong>Key Points:</strong>
                <ul>${keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
        ` : ''}
        ${q.why_tricky ? `<div class="tricky-note"><strong>Note:</strong> ${q.why_tricky}</div>` : ''}
    `;
}

// Renderers
function renderSubjects(subjects) {
    elements.subjectsGrid.innerHTML = subjects.map(subject => `
        <div class="card" onclick="loadChapters(${JSON.stringify(subject).replace(/"/g, '&quot;')})">
            <div class="card-icon">${subject.icon}</div>
            <div class="card-title">${subject.name}</div>
            <div class="card-subtitle">${subject.chapter_count} chapter${subject.chapter_count !== 1 ? 's' : ''}</div>
        </div>
    `).join('');
}

function renderChapters(chapters) {
    elements.chaptersTitle.innerHTML = `
        <div class="chapters-header-fun">
            <span class="subject-icon">${state.currentSubject.icon}</span>
            <span>${state.currentSubject.name}</span>
        </div>
    `;

    // Add motivational banner before chapters
    const motivationalBanner = `
        <div class="motivation-banner">
            <div class="motivation-icon">🎯</div>
            <div class="motivation-text">
                <strong>Pick a chapter and start your learning adventure!</strong>
                <span>Each chapter has fun quizzes waiting for you!</span>
            </div>
        </div>
    `;

    // Show all chapters (not just those with questions)
    if (chapters.length === 0) {
        elements.chaptersList.innerHTML = `
            <div class="no-chapters-message">
                <div class="no-chapters-icon">📚</div>
                <p>Questions coming soon for this subject!</p>
            </div>
        `;
        return;
    }

    // Group chapters by category
    const categoryMap = new Map();
    const uncategorized = [];

    chapters.forEach(chapter => {
        if (chapter.category) {
            if (!categoryMap.has(chapter.category)) {
                categoryMap.set(chapter.category, {
                    name: chapter.category,
                    icon: chapter.category_icon || '📁',
                    chapters: []
                });
            }
            categoryMap.get(chapter.category).chapters.push(chapter);
        } else {
            uncategorized.push(chapter);
        }
    });

    let html = motivationalBanner;

    // Render categorized chapters as collapsible folders
    categoryMap.forEach((category, categoryName) => {
        const folderId = `folder-${categoryName.replace(/\s+/g, '-').toLowerCase()}`;
        html += `
            <div class="chapter-folder">
                <div class="folder-header" onclick="toggleFolder('${folderId}')">
                    <span class="folder-arrow" id="${folderId}-arrow">▼</span>
                    <span class="folder-icon">${category.icon}</span>
                    <span class="folder-name">${category.name}</span>
                    <span class="folder-count">${category.chapters.length} topics</span>
                </div>
                <div class="folder-contents" id="${folderId}" style="display: block;">
                    ${category.chapters.map(chapter => renderChapterItem(chapter)).join('')}
                </div>
            </div>
        `;
    });

    // Render uncategorized chapters directly (not in folders)
    if (uncategorized.length > 0) {
        html += uncategorized.map(chapter => renderChapterItem(chapter)).join('');
    }

    elements.chaptersList.innerHTML = html;
}

// Toggle folder open/close
function toggleFolder(folderId) {
    const contents = document.getElementById(folderId);
    const arrow = document.getElementById(folderId + '-arrow');
    if (contents.style.display === 'none') {
        contents.style.display = 'block';
        arrow.textContent = '▼';
    } else {
        contents.style.display = 'none';
        arrow.textContent = '▶';
    }
}

function renderChapterItem(chapter) {
    const emoji = chapter.icon || '📚';
    const hasQuestions = chapter.has_questions;
    const badgeClass = hasQuestions ? 'ready' : 'coming-soon';
    const badgeText = hasQuestions ? 'Ready to Play!' : 'Coming Soon';
    const clickHandler = hasQuestions
        ? `onclick="loadSections(${JSON.stringify(chapter).replace(/"/g, '&quot;')})"`
        : '';
    const itemClass = hasQuestions ? 'chapter-item' : 'chapter-item disabled';

    return `
        <div class="${itemClass}" ${clickHandler}>
            <div class="chapter-info">
                <span class="chapter-emoji">${emoji}</span>
                <span class="chapter-name">${chapter.name}</span>
            </div>
            <span class="chapter-badge ${badgeClass}">${badgeText}</span>
        </div>
    `;
}

function renderSections(sections) {
    elements.sectionsTitle.textContent = `${state.currentChapter.name}`;

    // Get the sections container
    const sectionsContainer = document.getElementById('sections-container');

    // Remove any existing wrong-answers or admin sections
    const existingWrongSection = document.getElementById('wrong-answers-section');
    if (existingWrongSection) existingWrongSection.remove();
    const existingAdminSection = document.getElementById('admin-section');
    if (existingAdminSection) existingAdminSection.remove();

    // Render each section
    renderSectionTypes(elements.textbookTypes, sections.textbook, 'textbook-section');
    renderSectionTypes(elements.previousYearTypes, sections.previous_year || [], 'previous-year-section');
    renderSectionTypes(elements.examTypes, sections.exam, 'exam-section');
    renderSectionTypes(elements.miscTypes, sections.miscellaneous, 'misc-section');

    // Show/hide sections based on content
    elements.textbookSection.style.display = sections.textbook.length > 0 ? 'block' : 'none';
    elements.previousYearSection.style.display = (sections.previous_year && sections.previous_year.length > 0) ? 'block' : 'none';
    elements.examSection.style.display = sections.exam.length > 0 ? 'block' : 'none';
    elements.miscSection.style.display = sections.miscellaneous.length > 0 ? 'block' : 'none';

    // For students: Show "Previously Wrong" section
    if (currentUser && currentUser.role === 'student') {
        const wrongAnswers = getWrongAnswersForChapter(
            state.currentSubject.name,
            state.currentChapter.name
        );

        const wrongTypes = Object.keys(wrongAnswers);
        if (wrongTypes.length > 0) {
            const totalWrongCount = wrongTypes.reduce((sum, type) => sum + wrongAnswers[type].length, 0);
            const wrongSection = document.createElement('div');
            wrongSection.id = 'wrong-answers-section';
            wrongSection.className = 'section-block wrong-answers-section';
            wrongSection.innerHTML = `
                <div class="section-header-row">
                    <h3 class="section-header">Practice Again (${totalWrongCount} questions you got wrong)</h3>
                    <button class="clear-wrong-btn" onclick="clearWrongAnswersAndRefresh()">🗑️ Clear All</button>
                </div>
                <div class="section-types">
                    ${wrongTypes.map(type => {
                        const count = wrongAnswers[type].length;
                        const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return `
                            <div class="type-item wrong-type" onclick="loadWrongQuestions('${type}')">
                                <span class="type-icon">🔄</span>
                                <span class="type-label">${typeLabel} (${count})</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            sectionsContainer.appendChild(wrongSection);
        }
    }

    // For admin: Show admin panel with wrong answers summary
    if (currentUser && currentUser.role === 'admin') {
        const allWrong = getAllWrongAnswers();
        const chapterKey = `${state.currentSubject.name}|${state.currentChapter.name}`;
        const chapterWrongAnswers = Object.entries(allWrong)
            .filter(([key]) => key.startsWith(chapterKey))
            .map(([key, questions]) => {
                const [, , type] = key.split('|');
                return { type, questions };
            });

        if (chapterWrongAnswers.length > 0) {
            const totalWrong = chapterWrongAnswers.reduce((sum, item) => sum + item.questions.length, 0);
            const adminSection = document.createElement('div');
            adminSection.id = 'admin-section';
            adminSection.className = 'section-block admin-section';
            adminSection.innerHTML = `
                <h3 class="section-header">Admin: Student's Wrong Answers (${totalWrong})</h3>
                <div class="wrong-questions-list">
                    ${chapterWrongAnswers.map(item => `
                        <div style="margin-bottom: 16px;">
                            <strong>${item.type.replace(/_/g, ' ').toUpperCase()}</strong>
                            ${item.questions.map(q => `
                                <div class="wrong-question-item">
                                    <div>${q.question}</div>
                                    <div class="wrong-question-meta">
                                        Correct answer: <strong>${q.correct_answer}</strong>
                                        ${q.addedAt ? `<br>Added: ${new Date(q.addedAt).toLocaleDateString()}` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            `;
            sectionsContainer.appendChild(adminSection);
        }
    }
}

function renderSectionTypes(container, types, sectionId) {
    if (types.length === 0) {
        container.innerHTML = '<p class="no-types">No questions available</p>';
        return;
    }

    // Check if this is the textbook section - show all questions at once
    const isTextbookSection = sectionId === 'textbook-section';

    container.innerHTML = types.map(type => `
        <div class="type-item" onclick="loadQuestions(${JSON.stringify(type).replace(/"/g, '&quot;')}, 0, ${isTextbookSection})">
            <span class="type-icon">${type.icon}</span>
            <span class="type-label">${type.label}</span>
        </div>
    `).join('');
}

function renderQuiz() {
    elements.quizTitle.textContent = `${state.currentType.label} - ${state.currentChapter.name}`;
    elements.questionsShown.textContent = state.questions.length;

    // Check if we're in one-by-one mode
    if (state.oneByOneMode) {
        renderOneByOneQuiz();
        return;
    }

    // Show/hide banners based on state
    if (!state.answersRevealed) {
        elements.challengeBanner.style.display = 'flex';
        elements.resultsBanner.style.display = 'none';
        elements.scoreDisplay.style.display = 'none';
        elements.encouragementBanner.style.display = 'none';
    }

    elements.questionsContainer.innerHTML = state.questions.map((q, index) =>
        renderQuestion(q, index)
    ).join('');

    // Show/hide buttons - ALWAYS show check answers and show all buttons unless in showAll mode
    // Only show "Try More" if answers revealed AND all questions were answered AND there are more questions
    if (state.showAllMode) {
        elements.tryMoreBtn.style.display = state.hasMore ? 'inline-block' : 'none';
        elements.checkAnswersBtn.style.display = 'none';
        elements.showAllAnswersBtn.style.display = 'none';
    } else {
        elements.tryMoreBtn.style.display = (state.hasMore && state.answersRevealed && state.allQuestionsAnswered) ? 'inline-block' : 'none';
        elements.checkAnswersBtn.style.display = 'inline-block'; // Always show
        elements.showAllAnswersBtn.style.display = 'block'; // Always show
    }
}

// Render quiz in one-by-one question mode
function renderOneByOneQuiz() {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const totalQuestions = state.questions.length;
    const currentNum = state.currentQuestionIndex + 1;

    // Add compact-mode class to quiz view for tighter layout
    views.quiz.classList.add('compact-mode');

    // Hide the standard banners and buttons in one-by-one mode
    elements.challengeBanner.style.display = 'none';
    elements.resultsBanner.style.display = 'none';
    elements.scoreDisplay.style.display = 'none';
    elements.encouragementBanner.style.display = 'none';
    elements.tryMoreBtn.style.display = 'none';
    elements.checkAnswersBtn.style.display = 'none';
    elements.showAllAnswersBtn.style.display = 'none';

    // Update question count display
    elements.questionsShown.textContent = `${currentNum} of ${totalQuestions}`;

    // Build the one-by-one question UI
    const questionContent = renderOneByOneQuestion(currentQuestion, state.currentQuestionIndex);
    const answerContent = state.currentAnswerRevealed ? renderOneByOneAnswer(currentQuestion) : '';

    // Navigation buttons
    const isFirst = state.currentQuestionIndex === 0;
    const isLast = state.currentQuestionIndex === totalQuestions - 1;

    // Check if user can proceed: must have answered OR revealed the answer
    const hasAnswered = state.userAnswers[currentQuestion.id] !== undefined && state.userAnswers[currentQuestion.id] !== '';
    const canProceed = hasAnswered || state.currentAnswerRevealed;

    elements.questionsContainer.innerHTML = `
        <div class="one-by-one-container compact">
            <div class="question-progress-compact">
                <span class="progress-text">Q${currentNum} of ${totalQuestions}</span>
                <div class="progress-bar-mini">
                    <div class="progress-fill" style="width: ${(currentNum / totalQuestions) * 100}%"></div>
                </div>
            </div>

            <div class="single-question-card compact">
                <div class="question-body compact">
                    ${questionContent}
                    ${!state.currentAnswerRevealed ? `
                        <div class="action-buttons-inline">
                            <button class="see-answer-btn inline" onclick="revealCurrentAnswer()">
                                👁️ See Answer
                            </button>
                        </div>
                    ` : `
                        <div class="answer-inline">
                            <span class="answer-label-inline">📖 Reference Answer:</span> ${answerContent}
                        </div>
                    `}
                </div>
            </div>

            <div class="navigation-buttons compact">
                <button class="nav-btn back-btn ${isFirst ? 'disabled' : ''}"
                        onclick="goToPreviousQuestion()"
                        ${isFirst ? 'disabled' : ''}>
                    ← Back
                </button>

                ${isLast ? `
                    <button class="nav-btn finish-btn ${!canProceed ? 'disabled' : ''}"
                            onclick="finishOneByOneQuiz()"
                            ${!canProceed ? 'disabled' : ''}>
                        Finish 🏁
                    </button>
                ` : `
                    <button class="nav-btn next-btn ${!canProceed ? 'disabled' : ''}"
                            onclick="goToNextQuestion()"
                            ${!canProceed ? 'disabled' : ''}>
                        Next →
                    </button>
                `}
            </div>
        </div>
    `;
}

// Render single question content for one-by-one mode
function renderOneByOneQuestion(question, index) {
    const qType = question.type;

    if (qType === 'mcq' || qType === 'assertion_reason') {
        return renderMCQQuestion(question, index, false);
    } else if (qType === 'true_false') {
        return renderTrueFalseQuestion(question, index, false);
    } else if (qType === 'fill_in_blanks' || qType === 'name_the_following') {
        return renderTextInputQuestion(question, index, false);
    } else if (qType === 'match_the_following') {
        return renderMatchQuestion(question, index, false);
    } else if (qType === 'differentiate_between') {
        return renderDifferentiateQuestion(question, index, false);
    } else if (qType === 'numericals') {
        return renderNumericalQuestion(question, index, false);
    } else if (qType === 'case_study') {
        return renderCaseStudyQuestion(question, index, false);
    } else if (qType === 'reference_to_context') {
        return renderReferenceToContextQuestion(question, index, false);
    } else if (qType === 'make_sentences') {
        return renderMakeSentencesQuestion(question, index, false);
    } else {
        return renderTextQuestion(question, index, false);
    }
}

// Render reference to context question
function renderReferenceToContextQuestion(q, index, showUnansweredHighlight = false) {
    const userAnswer = state.userAnswers[q.id] || '';
    return `
        ${q.extract ? `<div class="extract-box">"${q.extract}"</div>` : ''}
        <div class="question-text">${q.question}</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}"
                  placeholder="Type your answer..."
                  oninput="handleAnswerChange('${q.id}', this.value)"
                  id="input-${q.id}">${escapeHtml(userAnswer)}</textarea>
    `;
}

// Render make sentences question
function renderMakeSentencesQuestion(q, index, showUnansweredHighlight = false) {
    const userAnswer = state.userAnswers[q.id] || '';
    return `
        <div class="word-box">
            <div class="word-label">Word:</div>
            <div class="word-value">${q.word || ''}</div>
            <div class="meaning-label">Meaning:</div>
            <div class="meaning-value">${q.meaning || ''}</div>
        </div>
        <div class="question-text">Make a sentence using the word above (minimum 10 words):</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}"
                  placeholder="Type your sentence here..."
                  oninput="handleAnswerChange('${q.id}', this.value)"
                  id="input-${q.id}">${escapeHtml(userAnswer)}</textarea>
    `;
}

// Render answer for one-by-one mode
function renderOneByOneAnswer(question) {
    const qType = question.type;
    const userAnswer = state.userAnswers[question.id] || '';

    // For reference_to_context type
    if (qType === 'reference_to_context') {
        const justification = question.justification || question.explanation || '';
        return `
            <div class="correct-answer">
                <strong>Answer:</strong>
                <p>${question.answer || question.correct_answer || ''}</p>
            </div>
            ${justification ? `<div class="explanation"><strong>Justification:</strong> ${justification}</div>` : ''}
        `;
    }

    // For make_sentences type
    if (qType === 'make_sentences') {
        return `
            <div class="correct-answer">
                <strong>Sample Sentence:</strong>
                <p>${question.sample_sentence || ''}</p>
            </div>
            ${userAnswer ? `
                <div class="user-answer-note">
                    <strong>Your sentence:</strong> ${escapeHtml(userAnswer)}
                </div>
            ` : ''}
        `;
    }

    // For MCQ type
    if (qType === 'mcq' || qType === 'assertion_reason') {
        const isCorrect = isAnswerCorrect(question, userAnswer);
        const justification = question.explanation || '';
        return `
            ${userAnswer ? `
                <div class="answer-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </div>
            ` : ''}
            <div class="correct-answer">
                <strong>Correct Answer:</strong> ${question.correct_answer}
            </div>
            ${justification ? `<div class="explanation"><strong>Justification:</strong> ${justification}</div>` : ''}
        `;
    }

    // For true/false type
    if (qType === 'true_false') {
        const isCorrect = isAnswerCorrect(question, userAnswer);
        const justification = question.explanation || '';
        return `
            ${userAnswer ? `
                <div class="answer-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </div>
            ` : ''}
            <div class="correct-answer">
                <strong>Correct Answer:</strong> ${question.correct_answer}
            </div>
            ${justification ? `<div class="explanation"><strong>Justification:</strong> ${justification}</div>` : ''}
        `;
    }

    // For fill in blanks and name the following
    if (qType === 'fill_in_blanks' || qType === 'name_the_following') {
        const isCorrect = isAnswerCorrect(question, userAnswer);
        const justification = question.explanation || '';
        return `
            ${userAnswer ? `
                <div class="answer-status ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                </div>
                <div class="user-answer-note">
                    <strong>Your answer:</strong> ${escapeHtml(userAnswer)}
                </div>
            ` : ''}
            <div class="correct-answer">
                <strong>Correct Answer:</strong> ${question.correct_answer || question.answer}
            </div>
            ${justification ? `<div class="explanation"><strong>Justification:</strong> ${justification}</div>` : ''}
        `;
    }

    // Default for text-based questions (short_answer, long_answer, textbook_qa, etc.)
    const justification = question.justification || question.explanation || '';
    const keyPoints = question.key_points || [];

    return `
        ${userAnswer ? `
            <div class="user-answer-note">
                <strong>Your answer:</strong>
                <p>${escapeHtml(userAnswer)}</p>
            </div>
        ` : ''}
        <div class="correct-answer">
            <strong>Model Answer:</strong>
            <div class="formatted-answer">${formatAnswerText(question.answer || question.correct_answer || '')}</div>
        </div>
        ${justification ? `<div class="explanation"><strong>Justification:</strong> ${justification}</div>` : ''}
        ${keyPoints.length > 0 ? `
            <div class="key-points">
                <strong>Key Points:</strong>
                <ul>${keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
        ` : ''}
    `;
}

// Navigation functions for one-by-one mode
function revealCurrentAnswer() {
    state.currentAnswerRevealed = true;

    // Track wrong answers for students
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const userAnswer = state.userAnswers[currentQuestion.id];
    const isAnswered = userAnswer !== undefined && userAnswer !== '';

    if (currentUser && currentUser.role === 'student' && isAnswered) {
        const correct = isAnswerCorrect(currentQuestion, userAnswer);
        if (!correct) {
            addWrongAnswer(
                state.currentSubject.name,
                state.currentChapter.name,
                state.currentType.value,
                currentQuestion
            );
        } else {
            removeWrongAnswer(
                state.currentSubject.name,
                state.currentChapter.name,
                state.currentType.value,
                currentQuestion.id
            );
        }
    }

    renderQuiz();
}

// Evaluate current answer by comparing with reference
function evaluateCurrentAnswer() {
    const currentQuestion = state.questions[state.currentQuestionIndex];
    const userAnswer = (state.userAnswers[currentQuestion.id] || '').trim().toLowerCase();
    const referenceAnswer = (currentQuestion.answer || currentQuestion.correct_answer || '').toLowerCase();

    if (!userAnswer || userAnswer.length === 0) {
        alert('Please write an answer first');
        return;
    }

    let evaluation = {};

    if (currentQuestion.type === 'make_sentences') {
        // For make_sentences: check word count, word usage, basic evaluation
        const wordCount = userAnswer.split(/\s+/).filter(w => w.length > 0).length;
        const targetWord = (currentQuestion.word || '').toLowerCase();
        const usesWord = userAnswer.includes(targetWord);
        const hasMinWords = wordCount >= 10;

        let score = 'Needs Improvement';
        if (usesWord && hasMinWords) score = 'Good';
        if (usesWord && wordCount >= 12) score = 'Excellent';

        evaluation = {
            overallScore: score,
            wordCount: wordCount,
            usesWordCorrectly: usesWord,
            hasMinWords: hasMinWords,
            feedback: usesWord
                ? (hasMinWords ? `Good sentence with ${wordCount} words!` : `Sentence is too short (${wordCount} words). Need at least 10 words.`)
                : `Make sure to use the word "${currentQuestion.word}" in your sentence.`
        };
    } else {
        // For other question types: compare key words
        const refWords = referenceAnswer.split(/\s+/).filter(w => w.length > 3);
        const userWords = userAnswer.split(/\s+/).filter(w => w.length > 3);

        let matchCount = 0;
        for (const word of refWords) {
            if (userAnswer.includes(word)) matchCount++;
        }

        const matchPercent = refWords.length > 0 ? Math.round((matchCount / refWords.length) * 100) : 0;

        let score = 'Needs Improvement';
        if (matchPercent >= 30) score = 'Partial';
        if (matchPercent >= 50) score = 'Good';
        if (matchPercent >= 70) score = 'Excellent';

        evaluation = {
            score: score,
            keyPointsCovered: `${matchPercent}%`,
            feedback: matchPercent >= 50
                ? `Good answer! You covered ${matchPercent}% of the key points.`
                : `Your answer covers ${matchPercent}% of key points. Compare with the reference answer below.`
        };
    }

    state.currentEvaluation = evaluation;
    state.currentAnswerRevealed = true;
    renderQuiz();
}

function goToNextQuestion() {
    if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex++;
        state.currentAnswerRevealed = false;
        state.currentEvaluation = null; // Reset evaluation for new question
        renderQuiz();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPreviousQuestion() {
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        state.currentAnswerRevealed = false;
        state.currentEvaluation = null; // Reset evaluation for new question
        renderQuiz();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToQuestion(index) {
    if (index >= 0 && index < state.questions.length) {
        state.currentQuestionIndex = index;
        state.currentAnswerRevealed = false;
        renderQuiz();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function finishOneByOneQuiz() {
    // Calculate final score
    const { score, total } = calculateScore();
    const result = getResultMessage(score, total);

    // Count how many were answered
    const answeredCount = state.questions.filter(q => {
        const userAnswer = state.userAnswers[q.id];
        return userAnswer !== undefined && userAnswer !== '';
    }).length;

    // Switch to results view
    state.oneByOneMode = false;

    // Show results banner
    elements.resultsIcon.textContent = result.icon;
    elements.resultsTitle.textContent = result.title;
    elements.resultsMessage.textContent = result.message;
    elements.resultsBanner.className = `results-banner ${result.class}`;
    elements.resultsBanner.style.display = 'flex';

    // Update score display
    elements.currentScore.textContent = `${score}/${answeredCount}`;
    elements.scoreDisplay.style.display = 'block';

    // Hide challenge banner
    elements.challengeBanner.style.display = 'none';

    // Show encouragement
    elements.encouragementBanner.style.display = 'block';

    // Show "Try More" if available
    elements.tryMoreBtn.style.display = state.hasMore ? 'inline-block' : 'none';
    elements.checkAnswersBtn.style.display = 'none';
    elements.showAllAnswersBtn.style.display = 'none';

    // Show all questions with answers
    state.answersRevealed = true;
    state.allQuestionsAnswered = true;

    elements.questionsContainer.innerHTML = state.questions.map((q, index) =>
        renderQuestion(q, index)
    ).join('');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderQuestion(question, index) {
    const qType = question.type;
    let questionContent = '';
    let answerContent = '';

    // Check if this question has been answered
    const userAnswer = state.userAnswers[question.id];
    const isAnswered = userAnswer !== undefined && userAnswer !== '' &&
                       (typeof userAnswer !== 'object' || Object.values(userAnswer).some(v => v && v !== ''));
    const showUnansweredHighlight = state.answersRevealed && !isAnswered;

    // Build question content based on type
    if (qType === 'mcq' || qType === 'assertion_reason') {
        questionContent = renderMCQQuestion(question, index, showUnansweredHighlight);
        answerContent = renderMCQAnswer(question);
    } else if (qType === 'true_false') {
        questionContent = renderTrueFalseQuestion(question, index, showUnansweredHighlight);
        answerContent = renderSimpleAnswer(question);
    } else if (qType === 'fill_in_blanks' || qType === 'name_the_following') {
        questionContent = renderTextInputQuestion(question, index, showUnansweredHighlight);
        answerContent = renderSimpleAnswer(question);
    } else if (qType === 'match_the_following') {
        questionContent = renderMatchQuestion(question, index, showUnansweredHighlight);
        answerContent = renderMatchAnswer(question);
    } else if (qType === 'differentiate_between') {
        questionContent = renderDifferentiateQuestion(question, index, showUnansweredHighlight);
        answerContent = renderDifferentiateAnswer(question);
    } else if (qType === 'numericals') {
        questionContent = renderNumericalQuestion(question, index, showUnansweredHighlight);
        answerContent = renderNumericalAnswer(question);
    } else if (qType === 'case_study') {
        questionContent = renderCaseStudyQuestion(question, index, showUnansweredHighlight);
        answerContent = renderCaseStudyAnswer(question);
    } else {
        // Default for text-based questions
        questionContent = renderTextQuestion(question, index, showUnansweredHighlight);
        answerContent = renderTextAnswer(question);
    }

    // Only show answer if question was answered
    const shouldShowAnswer = state.answersRevealed && isAnswered;
    const answerSideContent = shouldShowAnswer
        ? answerContent
        : (state.answersRevealed
            ? '<div class="answer-placeholder unanswered-message">🙈 Answer this question first!</div>'
            : '<div class="answer-placeholder">Answer will appear here</div>');

    return `
        <div class="question-row ${showUnansweredHighlight ? 'unanswered' : ''}" id="question-${question.id}">
            <div class="question-side">
                <div class="question-number">Q${index + 1}</div>
                <div class="question-content">
                    ${questionContent}
                </div>
            </div>
            <div class="answer-side ${shouldShowAnswer ? 'revealed' : 'hidden'}">
                ${answerSideContent}
            </div>
        </div>
    `;
}

// Question renderers
function renderMCQQuestion(q, index, showUnansweredHighlight = false) {
    const options = q.options || [];
    const userAnswer = state.userAnswers[q.id] || '';
    const isRevealed = state.answersRevealed;
    const qType = q.type || 'mcq';

    return `
        <div class="question-text">${q.question}</div>
        <div class="mcq-options ${showUnansweredHighlight ? 'unanswered-input' : ''}">
            ${options.map((opt, i) => {
                const isSelected = userAnswer === opt;
                // For assertion-reason, compare by first letter
                const isCorrectOption = qType === 'assertion_reason'
                    ? opt.trim().charAt(0).toUpperCase() === (q.correct_answer || '').trim().charAt(0).toUpperCase()
                    : opt === q.correct_answer;
                let optionClass = '';
                if (isRevealed && isSelected) {
                    optionClass = isCorrectOption ? 'selected-correct' : 'selected-incorrect';
                }
                return `
                <label class="option-label ${optionClass}">
                    <input type="radio" name="q-${q.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="handleAnswerChange('${q.id}', this.value)">
                    <span class="option-text">${opt}</span>
                    ${isRevealed && isSelected ? `<span class="your-choice-marker">← Your answer</span>` : ''}
                </label>
            `}).join('')}
        </div>
    `;
}

function renderTrueFalseQuestion(q, index, showUnansweredHighlight = false) {
    const userAnswer = state.userAnswers[q.id] || '';
    const isRevealed = state.answersRevealed;
    const correctAnswer = q.correct_answer;

    const getTFClass = (option) => {
        if (!isRevealed || userAnswer !== option) return '';
        const correctBool = correctAnswer === true || correctAnswer === 'True' || correctAnswer === 'true';
        const isCorrect = (option === 'True' && correctBool) || (option === 'False' && !correctBool);
        return isCorrect ? 'selected-correct' : 'selected-incorrect';
    };

    return `
        <div class="question-text">${q.question}</div>
        <div class="tf-options ${showUnansweredHighlight ? 'unanswered-input' : ''}">
            <label class="tf-label ${getTFClass('True')}">
                <input type="radio" name="q-${q.id}" value="True" ${userAnswer === 'True' ? 'checked' : ''} onchange="handleAnswerChange('${q.id}', 'True')">
                <span>True</span>
                ${isRevealed && userAnswer === 'True' ? `<span class="your-choice-marker">← Your answer</span>` : ''}
            </label>
            <label class="tf-label ${getTFClass('False')}">
                <input type="radio" name="q-${q.id}" value="False" ${userAnswer === 'False' ? 'checked' : ''} onchange="handleAnswerChange('${q.id}', 'False')">
                <span>False</span>
                ${isRevealed && userAnswer === 'False' ? `<span class="your-choice-marker">← Your answer</span>` : ''}
            </label>
        </div>
    `;
}

function renderTextInputQuestion(q, index, showUnansweredHighlight = false) {
    const userAnswer = state.userAnswers[q.id] || '';
    const isRevealed = state.answersRevealed;

    return `
        <div class="question-text">${q.question}</div>
        <input type="text" class="text-input ${showUnansweredHighlight ? 'unanswered-input' : ''}"
               placeholder="Type your answer..."
               value="${escapeHtml(userAnswer)}"
               oninput="handleAnswerChange('${q.id}', this.value)"
               id="input-${q.id}">
        ${isRevealed && userAnswer ? `<div class="your-typed-answer">Your answer: <strong>${escapeHtml(userAnswer)}</strong></div>` : ''}
    `;
}

function renderTextQuestion(q, index, showUnansweredHighlight = false) {
    const hasContext = q.context && q.context.trim();
    const userAnswer = state.userAnswers[q.id] || '';
    const isRevealed = state.answersRevealed;

    // Check if this is an MCQ-style question with embedded options (a. b. c. d. pattern)
    const mcqPattern = /\n?[a-d]\.\s+.+/gi;
    const questionText = q.question || '';

    if (mcqPattern.test(questionText)) {
        // Parse out embedded MCQ options
        const parts = questionText.split(/(?=\n?[a-d]\.\s)/i);
        const mainQuestion = parts[0].trim();
        const options = parts.slice(1).map(opt => opt.trim()).filter(opt => opt);

        if (options.length >= 2) {
            return `
                ${hasContext ? `<div class="question-context">${q.context}</div>` : ''}
                <div class="question-text">${mainQuestion}</div>
                <div class="mcq-options ${showUnansweredHighlight ? 'unanswered-input' : ''}">
                    ${options.map((opt) => {
                        const isSelected = userAnswer === opt;
                        const isCorrect = opt === q.correct_answer;
                        let optionClass = '';
                        if (isRevealed && isSelected) {
                            optionClass = isCorrect ? 'selected-correct' : 'selected-incorrect';
                        }
                        return `
                        <label class="option-label ${optionClass}">
                            <input type="radio" name="q-${q.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="handleAnswerChange('${q.id}', this.value)">
                            <span class="option-text">${opt}</span>
                            ${isRevealed && isSelected ? `<span class="your-choice-marker">← Your answer</span>` : ''}
                        </label>
                    `}).join('')}
                </div>
            `;
        }
    }

    // Default text area for regular questions
    return `
        ${hasContext ? `<div class="question-context">${q.context}</div>` : ''}
        <div class="question-text">${q.question}</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}"
                  placeholder="Type your answer..."
                  oninput="handleAnswerChange('${q.id}', this.value)"
                  id="input-${q.id}">${escapeHtml(userAnswer)}</textarea>
        ${isRevealed && userAnswer ? `<div class="your-typed-answer">Your answer: <strong>${escapeHtml(userAnswer)}</strong></div>` : ''}
    `;
}

function renderMatchQuestion(q, index, showUnansweredHighlight = false) {
    // Support both formats: pairs array or left_items/right_items arrays
    const pairs = q.pairs || [];
    let leftItems = q.left_items || [];
    let rightItems = q.right_items || [];

    // If pairs exist, extract left and right items from them
    if (pairs.length > 0 && leftItems.length === 0) {
        leftItems = pairs.map(p => p.left);
        // Shuffle right items for the question display
        rightItems = [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5);
    }

    const userAnswer = state.userAnswers[q.id] || '';
    const questionText = q.question || q.instruction || 'Match the following:';

    return `
        <div class="question-text">${questionText}</div>
        <div class="match-grid">
            <div class="match-column">
                <h4>Column A</h4>
                ${leftItems.map((item, i) => `
                    <div class="match-item">${i + 1}. ${item}</div>
                `).join('')}
            </div>
            <div class="match-column">
                <h4>Column B</h4>
                ${rightItems.map((item, i) => `
                    <div class="match-item">${String.fromCharCode(65 + i)}. ${item}</div>
                `).join('')}
            </div>
        </div>
        <div class="match-input">
            <label>Enter matches (e.g., 1-A, 2-B, 3-C...):</label>
            <input type="text" class="text-input ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="1-A, 2-B, 3-C, 4-D, 5-E"
                   value="${escapeHtml(userAnswer)}"
                   oninput="handleAnswerChange('${q.id}', this.value)">
        </div>
    `;
}

function renderDifferentiateQuestion(q, index, showUnansweredHighlight = false) {
    const userAnswer = state.userAnswers[q.id] || '';
    return `
        <div class="question-text">${q.question}</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Write the differences..."
                  oninput="handleAnswerChange('${q.id}', this.value)">${escapeHtml(userAnswer)}</textarea>
    `;
}

function renderNumericalQuestion(q, index, showUnansweredHighlight = false) {
    const givenData = q.given_data || [];
    const userAnswer = state.userAnswers[q.id] || '';
    return `
        <div class="question-text">${q.question}</div>
        ${givenData.length > 0 ? `
            <div class="given-data">
                <strong>Given:</strong> ${givenData.join(', ')}
            </div>
        ` : ''}
        ${q.formula ? `<div class="formula"><strong>Formula:</strong> ${q.formula}</div>` : ''}
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Show your working and answer..."
                  oninput="handleAnswerChange('${q.id}', this.value)">${escapeHtml(userAnswer)}</textarea>
    `;
}

function renderCaseStudyQuestion(q, index, showUnansweredHighlight = false) {
    const subQuestions = q.sub_questions || [];
    const userAnswers = state.userAnswers[q.id] || {};
    return `
        <div class="case-text">${q.question}</div>
        <div class="sub-questions">
            ${subQuestions.map((sq, i) => `
                <div class="sub-question">
                    <span class="sub-q-num">(${String.fromCharCode(97 + i)})</span> ${sq.question}
                    <textarea class="text-area small ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Your answer..."
                              oninput="handleSubAnswerChange('${q.id}', ${i}, this.value)">${escapeHtml(userAnswers[i] || '')}</textarea>
                </div>
            `).join('')}
        </div>
    `;
}

// Answer renderers - Always show justification from text
function renderMCQAnswer(q) {
    const userAnswer = state.userAnswers[q.id] || '';
    const isCorrect = isAnswerCorrect(q, userAnswer);
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');
    return `
        <div class="answer-status ${userAnswer ? (isCorrect ? 'correct' : 'incorrect') : ''}">
            ${userAnswer ? (isCorrect ? '✓ Correct!' : '✗ Incorrect') : 'Not answered'}
        </div>
        ${userAnswer ? `
            <div class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Your answer:</strong> ${userAnswer}
            </div>
        ` : ''}
        <div class="correct-answer">
            <strong>Correct answer:</strong> ${q.correct_answer}
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
    `;
}

function renderSimpleAnswer(q) {
    const userAnswerRaw = state.userAnswers[q.id] || '';
    const userAnswer = userAnswerRaw.toLowerCase().trim();
    const isCorrect = isAnswerCorrect(q, userAnswerRaw);
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');
    return `
        <div class="answer-status ${userAnswer ? (isCorrect ? 'correct' : 'incorrect') : ''}">
            ${userAnswer ? (isCorrect ? '✓ Correct!' : '✗ Incorrect') : 'Not answered'}
        </div>
        ${userAnswer ? `
            <div class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Your answer:</strong> ${userAnswerRaw}
            </div>
        ` : ''}
        <div class="correct-answer">
            <strong>Correct answer:</strong> ${q.correct_answer || q.answer}
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
    `;
}

// Helper function to format answer text with proper lists and line breaks
function formatAnswerText(text) {
    if (!text) return '';

    // Convert text to string if not already
    text = String(text);

    // Check if it looks like a numbered list or bullet list
    const hasNumberedList = /^\s*\d+[\.\)]\s+/m.test(text);
    const hasBulletList = /^\s*[\-\•\*]\s+/m.test(text);
    const hasRomanNumerals = /^\s*[ivxIVX]+[\.\)]\s+/m.test(text);

    if (hasNumberedList || hasBulletList || hasRomanNumerals) {
        // Split by line breaks or list patterns
        let lines = text.split(/\n/);
        let formattedLines = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Check if line starts with number, bullet, or roman numeral
            if (/^\d+[\.\)]\s+/.test(line)) {
                // Numbered list item
                formattedLines.push(`<li>${line.replace(/^\d+[\.\)]\s+/, '')}</li>`);
            } else if (/^[ivxIVX]+[\.\)]\s+/.test(line)) {
                // Roman numeral list item
                formattedLines.push(`<li>${line.replace(/^[ivxIVX]+[\.\)]\s+/, '')}</li>`);
            } else if (/^[\-\•\*]\s+/.test(line)) {
                // Bullet list item
                formattedLines.push(`<li>${line.replace(/^[\-\•\*]\s+/, '')}</li>`);
            } else {
                // Regular line - close any open list and add as paragraph
                formattedLines.push(`<p>${line}</p>`);
            }
        }

        // Wrap list items in ul/ol
        let result = '';
        let inList = false;
        for (let item of formattedLines) {
            if (item.startsWith('<li>')) {
                if (!inList) {
                    result += '<ul class="formatted-list">';
                    inList = true;
                }
                result += item;
            } else {
                if (inList) {
                    result += '</ul>';
                    inList = false;
                }
                result += item;
            }
        }
        if (inList) result += '</ul>';

        return result;
    }

    // No lists detected - just handle line breaks
    return text.split(/\n/).filter(line => line.trim()).map(line => `<p>${line.trim()}</p>`).join('');
}

// Check if question is a "differentiate between" type
function isDifferentiateQuestion(question) {
    const q = (question || '').toLowerCase();
    return q.includes('differentiate between') ||
           q.includes('difference between') ||
           q.includes('distinguish between') ||
           q.includes('compare and contrast');
}

// Parse differentiate answer into structured format
function parseDifferentiateAnswer(answer, question) {
    // Try to extract concepts from question
    const match = question.match(/(?:differentiate|difference|distinguish|compare).*?between\s+(.+?)\s+and\s+(.+?)[\.\?]?$/i);
    let conceptA = 'Concept A';
    let conceptB = 'Concept B';

    if (match) {
        conceptA = match[1].trim();
        conceptB = match[2].trim();
    }

    // Try to parse the answer into differences
    const lines = answer.split(/\n/).filter(line => line.trim());
    const differences = [];

    for (let line of lines) {
        line = line.trim();
        // Skip empty lines
        if (!line) continue;

        // Try to split by common separators like "while", "whereas", "but", ":"
        let parts = null;

        // Check for "Concept A: X, Concept B: Y" pattern
        if (line.includes(':')) {
            const colonParts = line.split(/[,;]/);
            if (colonParts.length >= 2) {
                parts = colonParts.map(p => p.replace(/^[^:]+:\s*/, '').trim());
            }
        }

        // Check for "X while Y" or "X whereas Y" pattern
        if (!parts) {
            const splitMatch = line.match(/(.+?)\s+(?:while|whereas|but|however)\s+(.+)/i);
            if (splitMatch) {
                parts = [splitMatch[1].trim(), splitMatch[2].trim()];
            }
        }

        if (parts && parts.length >= 2) {
            differences.push({
                aspect: `Point ${differences.length + 1}`,
                concept_a_point: parts[0].replace(/^\d+[\.\)]\s*/, ''),
                concept_b_point: parts[1].replace(/^\d+[\.\)]\s*/, '')
            });
        }
    }

    return {
        concept_a: conceptA,
        concept_b: conceptB,
        differences: differences
    };
}

function renderTextAnswer(q) {
    const keyPoints = q.key_points || [];
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');
    const questionText = q.question || '';
    const userAnswer = state.userAnswers[q.id] || '';
    const correctAnswer = q.correct_answer || q.answer || '';

    // Check if this is a differentiate between question
    if (isDifferentiateQuestion(questionText) && correctAnswer) {
        // Check if we have structured differences data
        if (q.differences && q.differences.length > 0) {
            return renderDifferentiateAnswer(q);
        }

        // Try to parse the answer into a comparison format
        const parsed = parseDifferentiateAnswer(correctAnswer, questionText);
        if (parsed.differences.length > 0) {
            return `
                <div class="correct-answer">
                    <div class="diff-comparison">
                        <div class="diff-header">
                            <div class="diff-concept-header left">${parsed.concept_a}</div>
                            <div class="diff-vs">VS</div>
                            <div class="diff-concept-header right">${parsed.concept_b}</div>
                        </div>
                        ${parsed.differences.map(d => `
                            <div class="diff-row">
                                <div class="diff-aspect">${d.aspect}</div>
                                <div class="diff-points">
                                    <div class="diff-point left">${d.concept_a_point}</div>
                                    <div class="diff-point right">${d.concept_b_point}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="explanation"><strong>Justification:</strong> ${justification}</div>
            `;
        }
    }

    // Check if this was an MCQ-style question (embedded options)
    const mcqPattern = /\n?[a-d]\.\s+.+/gi;

    if (mcqPattern.test(questionText) && userAnswer) {
        // For MCQ-style textbook questions, show correct/incorrect status
        const userOptionMatch = userAnswer.match(/^[a-d]/i);
        const correctOptionMatch = correctAnswer.match(/^[a-d]/i);

        const isCorrect = userOptionMatch && correctOptionMatch &&
                         userOptionMatch[0].toLowerCase() === correctOptionMatch[0].toLowerCase();

        return `
            <div class="answer-status ${isCorrect ? 'correct' : 'incorrect'}">
                ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
                <strong>Your answer:</strong> ${userAnswer}
            </div>
            <div class="correct-answer">
                <strong>Correct answer:</strong>
                <p>${correctAnswer}</p>
            </div>
            <div class="explanation"><strong>Justification:</strong> ${justification}</div>
        `;
    }

    // Default for text questions - format the answer properly
    const formattedAnswer = formatAnswerText(correctAnswer);

    return `
        ${userAnswer ? `
            <div class="user-answer">
                <strong>Your answer:</strong>
                <div class="user-answer-text">${formatAnswerText(userAnswer)}</div>
            </div>
        ` : ''}
        <div class="correct-answer">
            <strong>Model Answer:</strong>
            <div class="formatted-answer">${formattedAnswer}</div>
        </div>
        <div class="explanation"><strong>Justification:</strong> ${justification}</div>
        ${keyPoints.length > 0 ? `
            <div class="key-points">
                <strong>Key Points:</strong>
                <ul>${keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
            </div>
        ` : ''}
        ${q.why_tricky ? `<div class="tricky-note"><strong>Note:</strong> ${q.why_tricky}</div>` : ''}
    `;
}

function renderMatchAnswer(q) {
    const pairs = q.pairs || [];
    const correctMatches = q.correct_matches || {};

    // Handle both formats: pairs array or correct_matches object
    let matchesHtml = '';
    if (pairs.length > 0) {
        matchesHtml = pairs.map((p, i) => `<div>${i + 1}. ${p.left} → ${p.right}</div>`).join('');
    } else if (Object.keys(correctMatches).length > 0) {
        matchesHtml = Object.entries(correctMatches).map(([left, right], i) =>
            `<div>${i + 1}. ${left} → ${right}</div>`
        ).join('');
    }

    // Only show source section if it exists
    const sourceHtml = q.source_section
        ? `<div class="explanation"><strong>Section:</strong> ${q.source_section}</div>`
        : '';

    return `
        <div class="correct-answer">
            <strong>Correct Matches:</strong>
            <div class="match-answers">
                ${matchesHtml}
            </div>
        </div>
        ${sourceHtml}
    `;
}

function renderDifferentiateAnswer(q) {
    const differences = q.differences || [];
    const justification = q.source_section ? `Source: "${q.source_section}"` : '';
    return `
        <div class="correct-answer">
            <div class="diff-comparison">
                <div class="diff-header">
                    <div class="diff-concept-header left">${q.concept_a || 'Concept A'}</div>
                    <div class="diff-vs">VS</div>
                    <div class="diff-concept-header right">${q.concept_b || 'Concept B'}</div>
                </div>
                ${differences.map(d => `
                    <div class="diff-row">
                        <div class="diff-aspect">${d.aspect}</div>
                        <div class="diff-points">
                            <div class="diff-point left">${d.concept_a_point}</div>
                            <div class="diff-point right">${d.concept_b_point}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="explanation"><strong>Source:</strong> ${justification}</div>
    `;
}

function renderNumericalAnswer(q) {
    const steps = q.solution_steps || [];
    const justification = q.source_section ? `Source: "${q.source_section}"` : '';
    return `
        <div class="correct-answer">
            <strong>Solution:</strong>
            ${steps.length > 0 ? `
                <ol class="solution-steps">
                    ${steps.map(s => `<li>${s}</li>`).join('')}
                </ol>
            ` : ''}
            <div class="final-answer"><strong>Answer:</strong> ${q.correct_answer}</div>
        </div>
        <div class="explanation"><strong>Source:</strong> ${justification}</div>
    `;
}

function renderCaseStudyAnswer(q) {
    const subQuestions = q.sub_questions || q.questions || [];
    const justification = q.source_section ? `Source: "${q.source_section}"` : '';
    return `
        <div class="correct-answer">
            <strong>Answers:</strong>
            ${subQuestions.map((sq, i) => `
                <div class="sub-answer">
                    <span>(${String.fromCharCode(97 + i)})</span> ${sq.answer}
                </div>
            `).join('')}
        </div>
        <div class="explanation"><strong>Source:</strong> ${justification}</div>
    `;
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function saveAnswer(questionId, answer) {
    state.userAnswers[questionId] = answer;
}

function saveSubAnswer(questionId, subIndex, answer) {
    if (!state.userAnswers[questionId]) {
        state.userAnswers[questionId] = {};
    }
    state.userAnswers[questionId][subIndex] = answer;
}

// Handlers for answer changes - save the answer and re-render to update button states
function handleAnswerChange(questionId, answer) {
    state.userAnswers[questionId] = answer;
}

function handleSubAnswerChange(questionId, subIndex, answer) {
    if (!state.userAnswers[questionId]) {
        state.userAnswers[questionId] = {};
    }
    state.userAnswers[questionId][subIndex] = answer;
    // Don't auto-reveal - user must click "Check Answers" again to see answers
}

function showEmptyState(message) {
    elements.emptyState.style.display = 'block';
    elements.emptyMessage.textContent = message;
    views.subjects.querySelector('.grid').style.display = 'none';
}

// Helper to get CSS class for evaluation score
function getScoreClass(score) {
    if (!score) return '';
    const scoreLower = score.toLowerCase();
    if (scoreLower === 'excellent') return 'excellent';
    if (scoreLower === 'good') return 'good';
    if (scoreLower === 'partial') return 'partial';
    if (scoreLower === 'needs improvement' || scoreLower === 'needs_improvement') return 'needs-improvement';
    return '';
}

// Make functions globally available
window.loadChapters = loadChapters;
window.loadSections = loadSections;
window.loadQuestions = loadQuestions;
window.loadWrongQuestions = loadWrongQuestions;
window.clearAllWrongAnswers = clearAllWrongAnswers;
window.clearWrongAnswersAndRefresh = clearWrongAnswersAndRefresh;
window.showView = showView;
window.navigateTo = navigateTo;
window.saveAnswer = saveAnswer;
window.saveSubAnswer = saveSubAnswer;
window.handleAnswerChange = handleAnswerChange;
window.handleSubAnswerChange = handleSubAnswerChange;
window.logout = logout;
// One-by-one mode navigation
window.revealCurrentAnswer = revealCurrentAnswer;
window.goToNextQuestion = goToNextQuestion;
window.goToPreviousQuestion = goToPreviousQuestion;
window.goToQuestion = goToQuestion;
window.finishOneByOneQuiz = finishOneByOneQuiz;
window.evaluateCurrentAnswer = evaluateCurrentAnswer;
