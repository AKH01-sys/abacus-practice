let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attemptedQuestions = 0;
let timer;
let startTime;
let questionHistory = [];

const mainMenu = document.getElementById('main-menu');
const practiceMenu = document.getElementById('practice-menu');
const practiceSession = document.getElementById('practice-session');
const resultsDiv = document.getElementById('results');
const statsPage = document.getElementById('stats-page');
const countdownEl = document.getElementById('countdown');
const questionContainerEl = document.getElementById('question-container');
const answerFeedbackEl = document.getElementById('answer-feedback');
const questionHistoryEl = document.getElementById('question-history');

function showPracticeMenu() {
    hideAllSections();
    practiceMenu.classList.remove('hidden');
    clearResults();
}

function backToMainMenu() {
    hideAllSections();
    mainMenu.classList.remove('hidden');
    clearResults();
}

function hideAllSections() {
    mainMenu.classList.add('hidden');
    practiceMenu.classList.add('hidden');
    practiceSession.classList.add('hidden');
    resultsDiv.classList.add('hidden');
    statsPage.classList.add('hidden');
}

function clearResults() {
    resultsDiv.querySelector('#score').textContent = '';
    resultsDiv.querySelector('#stats').textContent = '';
}

function showStats() {
    hideAllSections();
    statsPage.classList.remove('hidden');
    updateStats();
}

function startPractice() {
    const operation = document.getElementById('operation').value;
    const digits = parseInt(document.getElementById('digits').value);
    const time = parseInt(document.getElementById('time').value);

    questions = generateQuestions(operation, digits);
    correctAnswers = 0;
    attemptedQuestions = 0;
    currentQuestionIndex = 0;
    questionHistory = [];

    hideAllSections();
    practiceSession.classList.remove('hidden');
    countdownEl.textContent = 'Ready?';
    questionContainerEl.innerHTML = '';
    questionHistoryEl.innerHTML = '';

    setTimeout(() => {
        countdownEl.textContent = 'Go!';
        setTimeout(() => {
            startTimer(time);
            showNextQuestion();
        }, 1000);
    }, 1000);
}

function generateQuestions(operation, digits) {
    const operations = {
        "Addition": "+",
        "Subtraction": "-",
        "Multiplication": "*",
        "Division": "/"
    };

    const questions = [];
    for (let i = 0; i < 100; i++) {
        let num1, num2;
        if (operation === "Division") {
            num2 = getRandomInt(1, Math.pow(10, digits));
            num1 = num2 * getRandomInt(1, Math.pow(10, digits));
        } else {
            num1 = getRandomInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
            num2 = getRandomInt(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
            if (operation === "Subtraction" && num1 < num2) {
                [num1, num2] = [num2, num1];
            }
        }
        const question = `${num1} ${operations[operation]} ${num2}`;
        let answer = eval(question);
        if (operation === "Division") {
            answer = Math.floor(answer); // Ensure integer result for division
        }
        questions.push({ question, answer });
    }
    return questions;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startTimer(minutes) {
    const endTime = Date.now() + minutes * 60000;
    startTime = Date.now();
    updateTimer(endTime);
}

function updateTimer(endTime) {
    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0 || currentQuestionIndex >= questions.length) {
        clearTimeout(timer);
        showResults();
    } else {
        const minutesLeft = Math.floor(timeLeft / 60000);
        const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
        countdownEl.textContent = `${minutesLeft}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
        timer = setTimeout(() => updateTimer(endTime), 1000);
    }
}

function showNextQuestion() {
    if (currentQuestionIndex < questions.length) {
        const question = questions[currentQuestionIndex];
        questionContainerEl.innerHTML = `<div>${question.question} = ?</div>`;
        const options = generateOptions(question.answer);
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.onclick = () => checkAnswer(option, question.answer);
            button.setAttribute('data-key', index + 1);
            questionContainerEl.appendChild(button);
        });
        updateQuestionHistory();
    } else {
        showResults();
    }
}

function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const option = correctAnswer + (Math.random() < 0.5 ? 1 : -1) * Math.floor(Math.random() * 10) + 1;
        if (!options.includes(option) && option > 0) {
            options.push(option);
        }
    }
    return options.sort((a, b) => a - b);
}

function checkAnswer(selected, correct) {
    attemptedQuestions++;
    const isCorrect = selected === correct;
    if (isCorrect) {
        correctAnswers++;
        answerFeedbackEl.textContent = 'Correct!';
        answerFeedbackEl.style.color = 'green';
    } else {
        answerFeedbackEl.textContent = `Incorrect! The correct answer was ${correct}.`;
        answerFeedbackEl.style.color = 'red';
    }
    questionHistory.push(isCorrect);
    updateQuestionHistory();
    currentQuestionIndex++;
    setTimeout(() => {
        answerFeedbackEl.textContent = '';
        showNextQuestion();
    }, 500);
}

function updateQuestionHistory() {
    questionHistoryEl.innerHTML = questionHistory.map((isCorrect, index) => 
        `<span class="${isCorrect ? 'correct' : 'incorrect'}" data-question="${index + 1}">
            ${isCorrect ? '✓' : '✗'}
        </span>`
    ).join('');
}

function showResults() {
    hideAllSections();
    resultsDiv.classList.remove('hidden');
    const scoreText = `You answered ${correctAnswers} out of ${attemptedQuestions} questions correctly.`;
    const accuracy = attemptedQuestions > 0 ? Math.round((correctAnswers / attemptedQuestions) * 100) : 0;
    const averageTime = attemptedQuestions > 0 ? Math.round((Date.now() - startTime) / (attemptedQuestions * 1000)) : 0;
    const statsText = `Accuracy: ${accuracy}%, Average Time per Question: ${averageTime} seconds`;

    document.getElementById('score').textContent = scoreText;
    document.getElementById('stats').textContent = statsText;

    saveStats(accuracy, averageTime);
}

function saveStats(accuracy, averageTime) {
    const stats = JSON.parse(localStorage.getItem('abacusStats')) || { totalTime: 0, totalAccuracy: 0, totalPractices: 0, lastThreePractices: [] };
    stats.totalTime += Math.round((Date.now() - startTime) / 60000);
    stats.totalAccuracy = ((stats.totalAccuracy * stats.totalPractices) + accuracy) / (stats.totalPractices + 1);
    stats.totalPractices++;

    const newPractice = {
        operation: document.getElementById('operation').value,
        digits: document.getElementById('digits').value,
        time: document.getElementById('time').value,
        score: `${correctAnswers}/${attemptedQuestions}`,
        accuracy: `${accuracy}%`
    };
    stats.lastThreePractices.unshift(newPractice);
    if (stats.lastThreePractices.length > 3) {
        stats.lastThreePractices.pop();
    }

    localStorage.setItem('abacusStats', JSON.stringify(stats));
}

function updateStats() {
    const stats = JSON.parse(localStorage.getItem('abacusStats')) || { totalTime: 0, totalAccuracy: 0, totalPractices: 0, lastThreePractices: [] };
    document.getElementById('total-time').textContent = `Total Time Practiced: ${stats.totalTime} minutes`;
    document.getElementById('average-accuracy').textContent = `Average Accuracy: ${stats.totalAccuracy.toFixed(2)}%`;

    const historyDiv = document.getElementById('last-three-practices');
    historyDiv.innerHTML = '<h3>Last 3 Practices</h3>';
    stats.lastThreePractices.forEach(practice => {
        const practiceDiv = document.createElement('div');
        practiceDiv.textContent = `${practice.digits} digit ${practice.operation} | ${practice.time} minutes | ${practice.score} - ${practice.accuracy}`;
        historyDiv.appendChild(practiceDiv);
    });
}

function restartPractice() {
    hideAllSections();
    startPractice();
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (['1', '2', '3', '4'].includes(event.key)) {
        const button = questionContainerEl.querySelector(`button[data-key="${event.key}"]`);
        if (button) button.click();
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('An error occurred:', event.error);
    alert('An error occurred. Please refresh the page and try again.');
});
