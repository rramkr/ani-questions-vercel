// GitHub Raw URL for fetching questions
const GITHUB_USER = 'rramkr';
const GITHUB_REPO = 'ani-questions-vercel';
const GITHUB_BRANCH = 'main';
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}/questions_cache`;

// Configuration
const QUESTIONS_PER_BATCH = 10; // Changed from 20 to 10 for gamification

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
    examTypes: document.getElementById('exam-types'),
    miscTypes: document.getElementById('misc-types'),
    textbookSection: document.getElementById('textbook-section'),
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
document.getElementById('back-to-subjects').addEventListener('click', () => showView('subjects'));
document.getElementById('back-to-chapters').addEventListener('click', () => showView('chapters'));
document.getElementById('back-to-sections').addEventListener('click', () => showView('sections'));
document.getElementById('try-more-btn').addEventListener('click', loadMoreQuestions);
document.getElementById('check-answers-btn').addEventListener('click', revealAnswers);
document.getElementById('show-all-answers-btn').addEventListener('click', showAllAnswers);
elements.appTitle.addEventListener('click', () => {
    resetState();
    showView('subjects');
});

// Initialize
init();

async function init() {
    showLoading(true);
    await loadSubjects();
    showLoading(false);
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
        breadcrumb += `<a href="#" onclick="showView('subjects'); return false;">Subjects</a>`;
    }

    if ((viewName === 'sections' || viewName === 'quiz') && state.currentSubject) {
        breadcrumb += `<span>></span><a href="#" onclick="showView('chapters'); return false;">${state.currentSubject.name}</a>`;
    }

    if (viewName === 'quiz' && state.currentChapter) {
        breadcrumb += `<span>></span><a href="#" onclick="showView('sections'); return false;">${state.currentChapter.name}</a>`;
    }

    elements.breadcrumb.innerHTML = breadcrumb;
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

        renderSubjects(data.subjects);
    } catch (error) {
        console.error('Error loading subjects:', error);
        showEmptyState('Failed to load subjects. Please try again later.');
    }
}

async function loadChapters(subject) {
    showLoading(true);
    try {
        // Convert subject name to folder format (e.g., "Physics" stays as "Physics")
        const subjectFolder = subject.name.replace(/ /g, '_');
        const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/chapters.json`);
        const data = await response.json();

        state.currentSubject = subject;
        renderChapters(data.chapters);
        showView('chapters');
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
        const chapterFolder = chapter.name.replace(/ /g, '_');
        const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/sections.json`);

        if (!response.ok) {
            alert('No questions available for this chapter');
            showLoading(false);
            return;
        }

        const data = await response.json();
        state.currentChapter = chapter;
        renderSections(data.sections);
        showView('sections');
    } catch (error) {
        console.error('Error loading sections:', error);
        alert('Failed to load question types');
    }
    showLoading(false);
}

async function loadQuestions(type, offset = 0) {
    showLoading(true);
    try {
        const subjectFolder = state.currentSubject.name.replace(/ /g, '_');
        const chapterFolder = state.currentChapter.name.replace(/ /g, '_');
        const response = await fetch(`${GITHUB_BASE_URL}/${subjectFolder}/${chapterFolder}/${type.value}.json`);

        if (!response.ok) {
            alert('Failed to load questions');
            showLoading(false);
            return;
        }

        const data = await response.json();
        let allQuestions = data.questions || [];

        // Shuffle questions
        allQuestions = shuffleArray([...allQuestions]);

        // Get batch based on offset
        const batchQuestions = allQuestions.slice(offset, offset + QUESTIONS_PER_BATCH);

        // Process questions to match expected format
        const processedQuestions = batchQuestions.map(q => processQuestion(q, type.value));

        if (offset === 0) {
            state.currentType = type;
            state.questions = processedQuestions;
            state.answersRevealed = false;
            state.userAnswers = {};
            state.currentScore = 0;
            state.totalAnswered = 0;
            state.allQuestions = allQuestions; // Store all for pagination
        } else {
            state.questions = [...state.questions, ...processedQuestions];
        }

        state.currentOffset = offset + batchQuestions.length;
        state.hasMore = (offset + QUESTIONS_PER_BATCH) < allQuestions.length;

        renderQuiz();
        showView('quiz');
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Failed to load questions');
    }
    showLoading(false);
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
            processed.correct_answer = q.correct_option || '';
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
        processed.question = `Give reason: ${q.statement || ''}`;
        processed.correct_answer = q.reason || q.answer || '';
        processed.key_points = q.key_points || [];
    } else if (questionType === 'differentiate_between') {
        processed.question = `Differentiate between ${q.concept_a || ''} and ${q.concept_b || ''}`;
        processed.differences = q.differences || [];
        processed.concept_a = q.concept_a;
        processed.concept_b = q.concept_b;
    } else if (questionType === 'case_study') {
        processed.question = q.case_text || q.question || '';
        processed.sub_questions = q.questions || [];
    } else if (questionType === 'numericals') {
        processed.given_data = q.given_data || [];
        processed.formula = q.formula || '';
        processed.solution_steps = q.solution_steps || [];
    } else {
        // For short_answer, long_answer, textbook_qa, hots, name_the_following, tricky_questions
        processed.key_points = q.key_points || [];
        processed.keywords = q.keywords || [];
        processed.context = q.context || '';
        processed.why_tricky = q.why_tricky || '';
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

    if (qType === 'mcq' || qType === 'assertion_reason') {
        return userAnswer === question.correct_answer;
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

    elements.chaptersList.innerHTML = motivationalBanner + chapters.map((chapter, index) => {
        const hasQuestions = chapter.has_questions;
        const badge = hasQuestions
            ? `<span class="chapter-badge ready">Ready to Play!</span>`
            : `<span class="chapter-badge pending">Coming Soon</span>`;
        const chapterEmojis = ['📚', '⚡', '🔬', '🧪', '🌟', '💡', '🎓', '📖'];
        const emoji = chapterEmojis[index % chapterEmojis.length];

        return `
            <div class="chapter-item ${!hasQuestions ? 'disabled' : ''}"
                 onclick="${hasQuestions ? `loadSections(${JSON.stringify(chapter).replace(/"/g, '&quot;')})` : ''}">
                <div class="chapter-info">
                    <span class="chapter-emoji">${emoji}</span>
                    <span class="chapter-name">${chapter.name}</span>
                </div>
                ${badge}
            </div>
        `;
    }).join('');
}

function renderSections(sections) {
    elements.sectionsTitle.textContent = `${state.currentChapter.name}`;

    // Render each section
    renderSectionTypes(elements.textbookTypes, sections.textbook, 'textbook-section');
    renderSectionTypes(elements.examTypes, sections.exam, 'exam-section');
    renderSectionTypes(elements.miscTypes, sections.miscellaneous, 'misc-section');

    // Show/hide sections based on content
    elements.textbookSection.style.display = sections.textbook.length > 0 ? 'block' : 'none';
    elements.examSection.style.display = sections.exam.length > 0 ? 'block' : 'none';
    elements.miscSection.style.display = sections.miscellaneous.length > 0 ? 'block' : 'none';
}

function renderSectionTypes(container, types, sectionId) {
    if (types.length === 0) {
        container.innerHTML = '<p class="no-types">No questions available</p>';
        return;
    }

    container.innerHTML = types.map(type => `
        <div class="type-item" onclick="loadQuestions(${JSON.stringify(type).replace(/"/g, '&quot;')})">
            <span class="type-icon">${type.icon}</span>
            <span class="type-label">${type.label}</span>
        </div>
    `).join('');
}

function renderQuiz() {
    elements.quizTitle.textContent = `${state.currentType.label} - ${state.currentChapter.name}`;
    elements.questionsShown.textContent = state.questions.length;

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

    // Show/hide buttons
    // Only show "Try More" if answers revealed AND all questions were answered AND there are more questions
    elements.tryMoreBtn.style.display = (state.hasMore && state.answersRevealed && state.allQuestionsAnswered) ? 'inline-block' : 'none';
    // Always show Check Answers button (unless in showAll mode)
    elements.checkAnswersBtn.style.display = state.showAllMode ? 'none' : 'inline-block';
    // Show "show all" button if not in showAll mode (even after partial check answers)
    elements.showAllAnswersBtn.style.display = state.showAllMode ? 'none' : 'block';
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
    return `
        <div class="question-text">${q.question}</div>
        <div class="mcq-options ${showUnansweredHighlight ? 'unanswered-input' : ''}">
            ${options.map((opt, i) => `
                <label class="option-label">
                    <input type="radio" name="q-${q.id}" value="${opt}" onchange="saveAnswer('${q.id}', this.value)">
                    <span class="option-text">${opt}</span>
                </label>
            `).join('')}
        </div>
    `;
}

function renderTrueFalseQuestion(q, index, showUnansweredHighlight = false) {
    return `
        <div class="question-text">${q.question}</div>
        <div class="tf-options ${showUnansweredHighlight ? 'unanswered-input' : ''}">
            <label class="tf-label">
                <input type="radio" name="q-${q.id}" value="True" onchange="saveAnswer('${q.id}', 'True')">
                <span>True</span>
            </label>
            <label class="tf-label">
                <input type="radio" name="q-${q.id}" value="False" onchange="saveAnswer('${q.id}', 'False')">
                <span>False</span>
            </label>
        </div>
    `;
}

function renderTextInputQuestion(q, index, showUnansweredHighlight = false) {
    return `
        <div class="question-text">${q.question}</div>
        <input type="text" class="text-input ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Type your answer..."
               onchange="saveAnswer('${q.id}', this.value)" id="input-${q.id}">
    `;
}

function renderTextQuestion(q, index, showUnansweredHighlight = false) {
    const hasContext = q.context && q.context.trim();

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
                    ${options.map((opt) => `
                        <label class="option-label">
                            <input type="radio" name="q-${q.id}" value="${opt}" onchange="saveAnswer('${q.id}', this.value)">
                            <span class="option-text">${opt}</span>
                        </label>
                    `).join('')}
                </div>
            `;
        }
    }

    // Default text area for regular questions
    return `
        ${hasContext ? `<div class="question-context">${q.context}</div>` : ''}
        <div class="question-text">${q.question}</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Type your answer..."
                  onchange="saveAnswer('${q.id}', this.value)" id="input-${q.id}"></textarea>
    `;
}

function renderMatchQuestion(q, index, showUnansweredHighlight = false) {
    const leftItems = q.left_items || [];
    const rightItems = q.right_items || [];
    return `
        <div class="question-text">${q.question}</div>
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
                   onchange="saveAnswer('${q.id}', this.value)">
        </div>
    `;
}

function renderDifferentiateQuestion(q, index, showUnansweredHighlight = false) {
    return `
        <div class="question-text">${q.question}</div>
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Write the differences..."
                  onchange="saveAnswer('${q.id}', this.value)"></textarea>
    `;
}

function renderNumericalQuestion(q, index, showUnansweredHighlight = false) {
    const givenData = q.given_data || [];
    return `
        <div class="question-text">${q.question}</div>
        ${givenData.length > 0 ? `
            <div class="given-data">
                <strong>Given:</strong> ${givenData.join(', ')}
            </div>
        ` : ''}
        ${q.formula ? `<div class="formula"><strong>Formula:</strong> ${q.formula}</div>` : ''}
        <textarea class="text-area ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Show your working and answer..."
                  onchange="saveAnswer('${q.id}', this.value)"></textarea>
    `;
}

function renderCaseStudyQuestion(q, index, showUnansweredHighlight = false) {
    const subQuestions = q.sub_questions || [];
    return `
        <div class="case-text">${q.question}</div>
        <div class="sub-questions">
            ${subQuestions.map((sq, i) => `
                <div class="sub-question">
                    <span class="sub-q-num">(${String.fromCharCode(97 + i)})</span> ${sq.question}
                    <textarea class="text-area small ${showUnansweredHighlight ? 'unanswered-input' : ''}" placeholder="Your answer..."
                              onchange="saveSubAnswer('${q.id}', ${i}, this.value)"></textarea>
                </div>
            `).join('')}
        </div>
    `;
}

// Answer renderers - Always show justification from text
function renderMCQAnswer(q) {
    const userAnswer = state.userAnswers[q.id] || '';
    const isCorrect = userAnswer === q.correct_answer;
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

function renderTextAnswer(q) {
    const keyPoints = q.key_points || [];
    const justification = q.explanation || (q.source_section ? `Source: "${q.source_section}"` : '');

    // Check if this was an MCQ-style question (embedded options)
    const mcqPattern = /\n?[a-d]\.\s+.+/gi;
    const questionText = q.question || '';
    const userAnswer = state.userAnswers[q.id] || '';

    if (mcqPattern.test(questionText) && userAnswer) {
        // For MCQ-style textbook questions, show correct/incorrect status
        const correctAnswer = q.correct_answer || q.answer || '';
        // Extract the option letter from both answers for comparison
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

    // Default for text questions
    return `
        ${userAnswer ? `
            <div class="user-answer">
                <strong>Your answer:</strong>
                <p>${userAnswer}</p>
            </div>
        ` : ''}
        <div class="correct-answer">
            <strong>Model Answer:</strong>
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

function renderMatchAnswer(q) {
    const pairs = q.pairs || [];
    const correctMatches = q.correct_matches || {};
    const justification = q.source_section ? `Source: "${q.source_section}"` : '';

    // Handle both formats: pairs array or correct_matches object
    let matchesHtml = '';
    if (pairs.length > 0) {
        matchesHtml = pairs.map((p, i) => `<div>${i + 1}. ${p.left} → ${p.right}</div>`).join('');
    } else if (Object.keys(correctMatches).length > 0) {
        matchesHtml = Object.entries(correctMatches).map(([left, right], i) =>
            `<div>${i + 1}. ${left} → ${right}</div>`
        ).join('');
    }

    return `
        <div class="correct-answer">
            <strong>Correct Matches:</strong>
            <div class="match-answers">
                ${matchesHtml}
            </div>
        </div>
        <div class="explanation"><strong>Source:</strong> ${justification}</div>
    `;
}

function renderDifferentiateAnswer(q) {
    const differences = q.differences || [];
    const justification = q.source_section ? `Source: "${q.source_section}"` : '';
    return `
        <div class="correct-answer">
            <strong>Differences:</strong>
            <table class="diff-table">
                <tr>
                    <th>Aspect</th>
                    <th>${q.concept_a || 'Concept A'}</th>
                    <th>${q.concept_b || 'Concept B'}</th>
                </tr>
                ${differences.map(d => `
                    <tr>
                        <td>${d.aspect}</td>
                        <td>${d.concept_a_point}</td>
                        <td>${d.concept_b_point}</td>
                    </tr>
                `).join('')}
            </table>
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
function saveAnswer(questionId, answer) {
    state.userAnswers[questionId] = answer;
}

function saveSubAnswer(questionId, subIndex, answer) {
    if (!state.userAnswers[questionId]) {
        state.userAnswers[questionId] = {};
    }
    state.userAnswers[questionId][subIndex] = answer;
}

function showEmptyState(message) {
    elements.emptyState.style.display = 'block';
    elements.emptyMessage.textContent = message;
    views.subjects.querySelector('.grid').style.display = 'none';
}

// Make functions globally available
window.loadChapters = loadChapters;
window.loadSections = loadSections;
window.loadQuestions = loadQuestions;
window.showView = showView;
window.saveAnswer = saveAnswer;
window.saveSubAnswer = saveSubAnswer;
