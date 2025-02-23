let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attemptedQuestions = 0;
let timer;
let startTime;

// DOM elements
const mainMenu = document.getElementById('main-menu');
const practiceMenu = document.getElementById('practice-menu');
const practiceSession = document.getElementById('practice-session');
const resultsDiv = document.getElementById('results');
const statsPage = document.getElementById('stats-page');
const countdownEl = document.getElementById('countdown');
const questionContainerEl = document.getElementById('question-container');
const answerFeedbackEl = document.getElementById('answer-feedback');

// Create a Back button to return to the practice settings
function createBackButton() {
  let backBtn = document.getElementById('back-button');
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'back-button';
    backBtn.textContent = 'Back to Settings';
    backBtn.onclick = returnToSettings;
    practiceSession.insertBefore(backBtn, practiceSession.firstChild);
  }
}

function returnToSettings() {
  clearTimeout(timer);
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

function showPracticeMenu() {
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

function backToMainMenu() {
  hideAllSections();
  mainMenu.classList.remove('hidden');
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

  hideAllSections();
  practiceSession.classList.remove('hidden');
  createBackButton();
  
  countdownEl.textContent = 'Ready?';
  questionContainerEl.innerHTML = '';

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
      answer = Math.floor(answer);
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
    const questionObj = questions[currentQuestionIndex];
    questionContainerEl.innerHTML = '';
    const questionDiv = document.createElement('div');
    questionDiv.innerHTML = `<div>${questionObj.question} = ?</div>`;
    questionContainerEl.appendChild(questionDiv);
    
    const answerInput = document.createElement('input');
    answerInput.type = 'text';
    answerInput.id = 'answer-input';
    answerInput.placeholder = 'Enter your answer';
    answerInput.readOnly = true;
    questionContainerEl.appendChild(answerInput);
    answerInput.focus();

    createVirtualKeyboard();
  } else {
    showResults();
  }
}

function createVirtualKeyboard() {
  const keyboardContainer = document.getElementById('virtual-keyboard');
  keyboardContainer.innerHTML = '';
  const keys = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    '0', '←', 'Submit'
  ];
  keys.forEach(key => {
    const keyButton = document.createElement('button');
    keyButton.textContent = key;
    keyButton.className = 'key-button';
    keyButton.onclick = () => handleVirtualKeyPress(key);
    keyboardContainer.appendChild(keyButton);
  });
}

function handleVirtualKeyPress(key) {
  const answerInput = document.getElementById('answer-input');
  if (!answerInput) return;
  if (key === 'Submit') {
    submitAnswer();
    return;
  }
  if (key === '←') {
    answerInput.value = answerInput.value.slice(0, -1);
    return;
  }
  answerInput.value += key;
}

function submitAnswer() {
  const answerInput = document.getElementById('answer-input');
  if (!answerInput) return;
  let userAnswer = parseFloat(answerInput.value);
  const correctAnswer = questions[currentQuestionIndex].answer;
  checkAnswer(userAnswer, correctAnswer);
}

function checkAnswer(selected, correct) {
  attemptedQuestions++;
  const answerInput = document.getElementById('answer-input');
  const isCorrect = selected === correct;
  if (isCorrect) {
    correctAnswers++;
    answerFeedbackEl.textContent = 'Correct!';
    answerFeedbackEl.style.color = 'green';
    answerInput.classList.add('input-correct');
  } else {
    answerFeedbackEl.textContent = `Incorrect! The correct answer was ${correct}.`;
    answerFeedbackEl.style.color = 'red';
    answerInput.classList.add('input-incorrect');
  }
  currentQuestionIndex++;
  setTimeout(() => {
    answerFeedbackEl.textContent = '';
    answerInput.classList.remove('input-correct', 'input-incorrect');
    showNextQuestion();
  }, 1000);
}

function showResults() {
  hideAllSections();
  resultsDiv.classList.remove('hidden');
  const scoreText = `You answered ${correctAnswers} out of ${attemptedQuestions} questions correctly.`;
  const accuracy = attemptedQuestions > 0 ? Math.round((correctAnswers / attemptedQuestions) * 100) : 0;
  const averageTime = attemptedQuestions > 0 ? Math.round((Date.now() - startTime) / (attemptedQuestions * 1000)) : 0;
  resultsDiv.querySelector('#score').textContent = scoreText;
  resultsDiv.querySelector('#stats').textContent = `Accuracy: ${accuracy}%, Average Time per Question: ${averageTime} seconds`;
  saveStats(accuracy, averageTime);
}

function saveStats(accuracy, averageTime) {
  let stats = JSON.parse(localStorage.getItem('abacusStats')) || { 
    totalPractices: 0, 
    practices: [] 
  };
  if (!stats.practices || !Array.isArray(stats.practices)) {
    stats.practices = [];
  }
  stats.totalPractices++;
  const newPractice = {
    operation: document.getElementById('operation').value,
    digits: document.getElementById('digits').value,
    time: parseInt(document.getElementById('time').value),
    score: `${correctAnswers}/${attemptedQuestions}`,
    accuracy: accuracy,
    timestamp: Date.now()
  };
  stats.practices.unshift(newPractice);
  const oneDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  stats.practices = stats.practices.filter(practice => practice.timestamp >= now - (30 * oneDay));
  localStorage.setItem('abacusStats', JSON.stringify(stats));
}

function updateStats() {
  const stats = JSON.parse(localStorage.getItem('abacusStats')) || { 
    totalPractices: 0, 
    practices: [] 
  };
  if (!stats.practices || !Array.isArray(stats.practices)) {
    stats.practices = [];
  }
  const filter = document.getElementById('stats-filter').value;
  let filteredPractices = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  
  if (filter === 'last3') {
    filteredPractices = stats.practices.slice(0, 3);
  } else if (filter === 'today') {
    let todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    filteredPractices = stats.practices.filter(practice => practice.timestamp >= todayStart.getTime());
  } else if (filter === 'yesterday') {
    let todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    let yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    let yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);
    filteredPractices = stats.practices.filter(practice => 
      practice.timestamp >= yesterdayStart.getTime() && practice.timestamp <= yesterdayEnd.getTime()
    );
  } else if (filter === 'thisweek') {
    let nowDate = new Date(now);
    let firstDayOfWeek = new Date(nowDate);
    firstDayOfWeek.setDate(nowDate.getDate() - nowDate.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);
    filteredPractices = stats.practices.filter(practice => practice.timestamp >= firstDayOfWeek.getTime());
  } else if (filter === 'lastweek') {
    let nowDate = new Date(now);
    let firstDayOfThisWeek = new Date(nowDate);
    firstDayOfThisWeek.setDate(nowDate.getDate() - nowDate.getDay());
    firstDayOfThisWeek.setHours(0, 0, 0, 0);
    let lastWeekEnd = new Date(firstDayOfThisWeek);
    lastWeekEnd.setMilliseconds(-1);
    let lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
    lastWeekStart.setHours(0, 0, 0, 0);
    filteredPractices = stats.practices.filter(practice => 
      practice.timestamp >= lastWeekStart.getTime() && practice.timestamp <= lastWeekEnd.getTime()
    );
  } else if (filter === 'last30') {
    filteredPractices = stats.practices.filter(practice => practice.timestamp >= now - (30 * oneDay));
  }
  
  // Compute filtered total time and average accuracy
  let sumTime = 0;
  let sumAccuracy = 0;
  filteredPractices.forEach(practice => {
    sumTime += practice.time;
    sumAccuracy += practice.accuracy;
  });
  const filteredTotalTime = filteredPractices.length ? sumTime : 0;
  const filteredAvgAccuracy = filteredPractices.length ? (sumAccuracy / filteredPractices.length) : 0;
  
  document.getElementById('total-time').textContent = `Total Time Practiced: ${filteredTotalTime} minutes`;
  document.getElementById('average-accuracy').textContent = `Average Accuracy: ${filteredAvgAccuracy.toFixed(2)}%`;
  
  const historyDiv = document.getElementById('practice-history');
  historyDiv.innerHTML = '';
  if (filteredPractices.length === 0) {
    historyDiv.innerHTML = '<p>No practices found for this period.</p>';
  } else {
    filteredPractices.forEach(practice => {
      const practiceDiv = document.createElement('div');
      const date = new Date(practice.timestamp).toLocaleDateString();
      practiceDiv.textContent = `${practice.digits} digit ${practice.operation} | ${practice.time} min | Score: ${practice.score} - Accuracy: ${practice.accuracy}% | Date: ${date}`;
      historyDiv.appendChild(practiceDiv);
    });
  }
}

function clearStats() {
  if (confirm("Are you sure you want to clear all stats? This action cannot be undone.")) {
    localStorage.removeItem('abacusStats');
    updateStats();
  }
}

function restartPractice() {
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

window.addEventListener('error', (event) => {
  console.error('An error occurred:', event.error);
  alert('An error occurred. Please refresh the page and try again.');
});