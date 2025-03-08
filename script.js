let questions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let attemptedQuestions = 0;
let timer;
let startTime;

// PWA Installation
let deferredPrompt;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Prevent form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    return false;
  }, true);
  
  // Make sure we start at the main menu
  hideAllSections();
  mainMenu.classList.remove('hidden');
});

// DOM elements
const mainMenu = document.getElementById('main-menu');
const practiceMenu = document.getElementById('practice-menu');
const practiceSession = document.getElementById('practice-session');
const resultsDiv = document.getElementById('results');
const statsPage = document.getElementById('stats-page');
const countdownEl = document.getElementById('countdown');
const questionContainerEl = document.getElementById('question-container');
const answerFeedbackEl = document.getElementById('answer-feedback');

// Error handling helper
function handleError(errorMessage, fallbackAction) {
  console.error(errorMessage);
  try {
    fallbackAction();
  } catch (e) {
    console.error('Error in fallback action:', e);
    alert('An unexpected error occurred. Please refresh the page.');
  }
}

// Create a Back button to return to the practice settings
function createBackButton() {
  let backBtn = document.getElementById('back-button');
  if (!backBtn) {
    backBtn = document.createElement('button');
    backBtn.id = 'back-button';
    backBtn.textContent = 'Back to Settings';
    backBtn.type = 'button';
    backBtn.onclick = returnToSettings;
    practiceSession.insertBefore(backBtn, practiceSession.firstChild);
  }
}

// Simple section navigation - no delays or transitions
function hideAllSections() {
  mainMenu.classList.add('hidden');
  practiceMenu.classList.add('hidden');
  practiceSession.classList.add('hidden');
  resultsDiv.classList.add('hidden');
  statsPage.classList.add('hidden');
}

function showPracticeMenu() {
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

function backToMainMenu() {
  hideAllSections();
  mainMenu.classList.remove('hidden');
}

function showStats() {
  hideAllSections();
  statsPage.classList.remove('hidden');
  updateStats();
}

function clearResults() {
  resultsDiv.querySelector('#score').textContent = '';
  resultsDiv.querySelector('#stats').textContent = '';
}

function startPractice() {
  const operation = document.getElementById('operation').value;
  const digits = parseInt(document.getElementById('digits').value);
  const time = parseInt(document.getElementById('time').value);

  questions = generateQuestions(operation, digits);
  correctAnswers = 0;
  attemptedQuestions = 0;
  currentQuestionIndex = 0;

  // First hide all sections
  hideAllSections();
  
  // Create elements and prepare practice session
  createBackButton();
  countdownEl.textContent = 'Ready?';
  questionContainerEl.innerHTML = '';
  
  // Show practice session
  practiceSession.classList.remove('hidden');

  // Start countdown after section is visible
  setTimeout(() => {
    countdownEl.textContent = 'Go!';
    setTimeout(() => {
      startTimer(time);
      showNextQuestion();
    }, 1000);
  }, 1000);
}

function generateQuestions(operation, digits) {
  try {
    const operations = {
      "Addition": "+",
      "Subtraction": "-",
      "Multiplication": "*",
      "Division": "/"
    };

    const questions = [];
    const maxQuestions = 100;  // Set a reasonable limit
    
    for (let i = 0; i < maxQuestions; i++) {
      let num1, num2, answer;
      const operator = operations[operation];
      
      if (!operator) {
        throw new Error(`Invalid operation: ${operation}`);
      }
      
      if (operation === "Division") {
        // Generate division problems with whole number answers
        num2 = getRandomInt(1, Math.min(Math.pow(10, digits), 100));
        num1 = num2 * getRandomInt(1, Math.min(Math.pow(10, digits), 100));
        answer = Math.floor(num1 / num2);
      } else {
        num1 = getRandomInt(Math.pow(10, digits - 1), Math.min(Math.pow(10, digits) - 1, 9999));
        num2 = getRandomInt(Math.pow(10, digits - 1), Math.min(Math.pow(10, digits) - 1, 9999));
        
        // Ensure subtraction doesn't result in negative answers for beginners
        if (operation === "Subtraction" && num1 < num2) {
          [num1, num2] = [num2, num1];
        }
        
        // Calculate answer safely without eval()
        switch(operator) {
          case '+': answer = num1 + num2; break;
          case '-': answer = num1 - num2; break;
          case '*': answer = num1 * num2; break;
          case '/': answer = Math.floor(num1 / num2); break;
          default: throw new Error(`Unsupported operator: ${operator}`);
        }
      }
      
      questions.push({ 
        question: `${num1} ${operator} ${num2}`, 
        answer 
      });
    }
    return questions;
  } catch (error) {
    handleError('Error generating questions', () => {
      return [{ question: "1 + 1", answer: 2 }]; // Fallback to a simple question
    });
    return [{ question: "1 + 1", answer: 2 }]; // Default fallback
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Replace eval() with a safer calculation method
function calculateAnswer(num1, operator, num2) {
  num1 = parseFloat(num1);
  num2 = parseFloat(num2);
  
  switch(operator) {
    case '+': return num1 + num2;
    case '-': return num1 - num2;
    case '*': return num1 * num2;
    case '/': return num1 / num2;
    default: throw new Error(`Invalid operator: ${operator}`);
  }
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
    
    // Clear previous content
    while (questionContainerEl.firstChild) {
      questionContainerEl.removeChild(questionContainerEl.firstChild);
    }
    
    // Create question text
    const questionDiv = document.createElement('div');
    questionDiv.textContent = `${questionObj.question} = ?`;
    questionContainerEl.appendChild(questionDiv);
    
    // Create answer display area with a better placeholder approach
    const answerContainer = document.createElement('div');
    answerContainer.className = 'answer-container';
    
    const answerDisplay = document.createElement('div');
    answerDisplay.id = 'answer-input';
    answerDisplay.textContent = '';
    
    // Add placeholder directly
    if (!answerDisplay.textContent) {
      const placeholder = document.createElement('span');
      placeholder.className = 'placeholder';
      placeholder.textContent = 'Enter your answer';
      answerDisplay.appendChild(placeholder);
    }
    
    answerContainer.appendChild(answerDisplay);
    questionContainerEl.appendChild(answerContainer);
    
    // Create keyboard
    createVirtualKeyboard();
  } else {
    showResults();
  }
}

function createVirtualKeyboard() {
  // Clear previous keyboard
  const keyboardContainer = document.getElementById('virtual-keyboard');
  while (keyboardContainer.firstChild) {
    keyboardContainer.removeChild(keyboardContainer.firstChild);
  }
  
  // Create grid container
  const keyGrid = document.createElement('div');
  keyGrid.className = 'key-grid';
  
  // Define keys
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '←', 'Submit'];
  
  // Create key elements
  keys.forEach(key => {
    const keyElement = document.createElement('div');
    keyElement.className = 'key-button';
    keyElement.textContent = key;
    keyElement.setAttribute('data-key', key);
    keyElement.setAttribute('role', 'button');
    keyElement.setAttribute('tabindex', '0');
    
    keyGrid.appendChild(keyElement);
  });
  
  // Append to container
  keyboardContainer.appendChild(keyGrid);
  
  // Add event delegation (one listener for all keys)
  keyboardContainer.addEventListener('click', handleKeyboardClick);
  
  // Add keyboard navigation
  keyboardContainer.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const key = e.target.getAttribute('data-key');
      if (key) {
        e.preventDefault();
        processKeyInput(key);
      }
    }
  });
}

function handleKeyboardClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  // Find closest key-button if clicked on child element
  const keyButton = e.target.closest('.key-button');
  if (!keyButton) return;
  
  const key = keyButton.getAttribute('data-key');
  if (key) {
    processKeyInput(key);
  }
  
  return false;
}

function processKeyInput(key) {
  const answerDisplay = document.getElementById('answer-input');
  if (!answerDisplay) return;
  
  // Find and remove placeholder if it exists
  const placeholder = answerDisplay.querySelector('.placeholder');
  if (placeholder) {
    answerDisplay.removeChild(placeholder);
  }
  
  if (key === 'Submit') {
    const answer = answerDisplay.textContent.trim();
    if (answer) {
      submitAnswer(answer);
    } else {
      answerFeedbackEl.textContent = 'Please enter an answer';
      answerFeedbackEl.style.color = 'var(--color-error)';
      
      // Re-add placeholder if empty
      const newPlaceholder = document.createElement('span');
      newPlaceholder.className = 'placeholder';
      newPlaceholder.textContent = 'Enter your answer';
      answerDisplay.appendChild(newPlaceholder);
    }
    return;
  }
  
  if (key === '←') {
    answerDisplay.textContent = answerDisplay.textContent.slice(0, -1);
    
    // Re-add placeholder if empty
    if (!answerDisplay.textContent) {
      const newPlaceholder = document.createElement('span');
      newPlaceholder.className = 'placeholder';
      newPlaceholder.textContent = 'Enter your answer';
      answerDisplay.appendChild(newPlaceholder);
    }
    return;
  }
  
  // Only allow digits
  if (answerDisplay.textContent.length < 15) {
    answerDisplay.textContent += key;
  }
}

function submitAnswer(inputValue) {
  try {
    // Validate input
    if (!inputValue || !/^-?\d+$/.test(inputValue)) {
      answerFeedbackEl.textContent = 'Please enter a valid number';
      answerFeedbackEl.style.color = 'var(--color-error)';
      return;
    }
    
    const userAnswer = parseInt(inputValue, 10);
    
    // Validate against potential overflow
    if (!Number.isFinite(userAnswer)) {
      answerFeedbackEl.textContent = 'Please enter a smaller number';
      answerFeedbackEl.style.color = 'var(--color-error)';
      return;
    }
    
    const correctAnswer = questions[currentQuestionIndex].answer;
    checkAnswer(userAnswer, correctAnswer);
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    handleError('Error submitting answer', () => {
      backToMainMenu();
    });
  }
}

function checkAnswer(selected, correct) {
  try {
    attemptedQuestions++;
    const answerInput = document.getElementById('answer-input');
    const isCorrect = selected === correct;
    if (isCorrect) {
      correctAnswers++;
      answerFeedbackEl.textContent = 'Correct!';
      answerFeedbackEl.style.color = 'var(--color-success)';
      answerInput.classList.add('input-correct');
    } else {
      answerFeedbackEl.textContent = `Incorrect! The correct answer was ${correct}.`;
      answerFeedbackEl.style.color = 'var(--color-error)';
      answerInput.classList.add('input-incorrect');
    }
    currentQuestionIndex++;
    setTimeout(() => {
      answerFeedbackEl.textContent = '';
      answerInput.classList.remove('input-correct', 'input-incorrect');
      showNextQuestion();
    }, 1000);
  } catch (error) {
    handleError('Error checking answer', () => {
      showNextQuestion();
    });
  }
}

function showResults() {
  // First hide all sections
  hideAllSections();
  
  // Prepare result content
  const scoreText = `You answered ${correctAnswers} out of ${attemptedQuestions} questions correctly.`;
  const accuracy = attemptedQuestions > 0 ? Math.round((correctAnswers / attemptedQuestions) * 100) : 0;
  const averageTime = attemptedQuestions > 0 ? Math.round((Date.now() - startTime) / (attemptedQuestions * 1000)) : 0;
  
  // Update result elements
  resultsDiv.querySelector('#score').textContent = scoreText;
  resultsDiv.querySelector('#stats').textContent = `Accuracy: ${accuracy}%, Average Time per Question: ${averageTime} seconds`;
  
  // Save stats
  saveStats(accuracy, averageTime);
  
  // Show results section
  resultsDiv.classList.remove('hidden');
}

function saveStats(accuracy, averageTime) {
  try {
    let stats = JSON.parse(localStorage.getItem('abacusStats')) || { 
      totalPractices: 0, 
      practices: [] 
    };
    
    if (!stats.practices || !Array.isArray(stats.practices)) {
      stats.practices = [];
    }
    
    stats.totalPractices = (stats.totalPractices || 0) + 1;
    
    const operation = document.getElementById('operation')?.value || 'Unknown';
    const digits = document.getElementById('digits')?.value || '1';
    const time = parseInt(document.getElementById('time')?.value || '1');
    
    const newPractice = {
      operation,
      digits,
      time,
      score: `${correctAnswers}/${attemptedQuestions}`,
      accuracy: accuracy || 0,
      timestamp: Date.now()
    };
    
    stats.practices.unshift(newPractice);
    
    // Limit stored practice history to prevent localStorage overflow
    const maxPractices = 100;
    if (stats.practices.length > maxPractices) {
      stats.practices = stats.practices.slice(0, maxPractices);
    }
    
    localStorage.setItem('abacusStats', JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
    // Continue without saving stats - non-critical error
  }
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

function returnToSettings() {
  clearTimeout(timer);
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

function restartPractice() {
  hideAllSections();
  practiceMenu.classList.remove('hidden');
}

window.addEventListener('error', (event) => {
  console.error('An error occurred:', event.error);
  alert('An error occurred. Please refresh the page and try again.');
});

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button 
  showInstallPromotion();
});

// Function to show install promotion (after first practice session)
function showInstallPromotion() {
  // Only show if we've stored the install prompt and user has completed at least one practice
  if (!deferredPrompt || !localStorage.getItem('practiceStats')) return;
  
  // Check if user has already dismissed or installed
  if (localStorage.getItem('pwaInstallDismissed')) return;
  
  // Create install banner
  const installBanner = document.createElement('div');
  installBanner.className = 'install-banner';
  installBanner.innerHTML = `
    <div class="install-message">
      <p>Install Abacus Practice on your device for offline use!</p>
      <div class="install-actions">
        <button id="install-button" class="primary-btn">Install</button>
        <button id="dismiss-install" class="secondary-btn">Not Now</button>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(installBanner);
  
  // Add event listeners
  document.getElementById('install-button').addEventListener('click', async () => {
    // Hide install promotion
    installBanner.style.display = 'none';
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the saved prompt
    deferredPrompt = null;
    
    // Record successful installation
    if (outcome === 'accepted') {
      localStorage.setItem('pwaInstalled', 'true');
    }
  });
  
  document.getElementById('dismiss-install').addEventListener('click', () => {
    // Hide install promotion
    installBanner.style.display = 'none';
    
    // Mark as dismissed for a week
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem('pwaInstallDismissed', expiryDate.toISOString());
  });
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  // Log install and hide promotion
  console.log('PWA was installed');
  const installBanner = document.querySelector('.install-banner');
  if (installBanner) installBanner.style.display = 'none';
  
  // Record installation
  localStorage.setItem('pwaInstalled', 'true');
});

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}