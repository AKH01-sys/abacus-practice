let questions = [];
let correctAnswers = 0;
let attemptedQuestions = 0;
let timer;
let startTime;

function showPracticeMenu() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('practice-menu').classList.remove('hidden');
}

function backToMainMenu() {
    document.getElementById('main-menu').classList.remove('hidden');
    document.getElementById('practice-menu').classList.add('hidden');
    document.getElementById('practice-session').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('stats-page').classList.add('hidden');
}

function showStats() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('stats-page').classList.remove('hidden');
    updateStats();
}

function startPractice() {
    const operation = document.getElementById('operation').value;
    const digits = document.getElementById('digits').value;
    const time = document.getElementById('time').value;

    questions = generateQuestions(operation, digits);
    correctAnswers = 0;
    attemptedQuestions = 0;

    document.getElementById('practice-menu').classList.add('hidden');
    document.getElementById('practice-session').classList.remove('hidden');
    document.getElementById('countdown').textContent = 'Ready?';

    setTimeout(() => {
        document.getElementById('countdown').textContent = 'Go!';
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
    for (let i = 0; i < 100; i++) {  // Generate a large number of questions
        let num1, num2;
        if (operation === "Division") {
            num2 = getRandomInt(digits);
            num1 = num2 * getRandomInt(digits);
        } else {
            num1 = getRandomInt(digits);
            num2 = getRandomInt(digits);
            if (operation === "Subtraction" && num1 < num2) {
                [num1, num2] = [num2, num1];
            }
        }
        const question = `${num1} ${operations[operation]} ${num2}`;
        const answer = eval(question);
        questions.push({ question, answer });
    }
    return questions;
}

function getRandomInt(digits) {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startTimer(minutes) {
    const endTime = Date.now() + minutes * 60000;
    startTime = Date.now();
    timer = setInterval(() => {
        const timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timer);
            showResults();
        } else {
            const minutesLeft = Math.floor(timeLeft / 60000);
            const secondsLeft = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById('countdown').textContent = `${minutesLeft}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
        }
    }, 1000);
}

function showNextQuestion() {
    if (questions.length > 0) {
        const question = questions.shift();
        const questionContainer = document.getElementById('question-container');
        questionContainer.innerHTML = `<div>${question.question}</div>`;
        const options = generateOptions(question.answer);
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.onclick = () => checkAnswer(option, question.answer);
            questionContainer.appendChild(button);
        });
    }
}

function generateOptions(correctAnswer) {
    const options = [correctAnswer];
    while (options.length < 4) {
        const option = correctAnswer + Math.floor(Math.random() * 20) - 10;
        if (!options.includes(option)) {
            options.push(option);
        }
    }
    return options.sort(() => Math.random() - 0.5);
}

function checkAnswer(selected, correct) {
    attemptedQuestions++;
    const feedback = document.getElementById('answer-feedback');
    if (selected === correct) {
        correctAnswers++;
        feedback.textContent = 'Correct!';
        feedback.style.color = 'green';
    } else {
        feedback.textContent = 'Incorrect!';
        feedback.style.color = 'red';
    }
    setTimeout(() => {
        feedback.textContent = '';
        showNextQuestion();
    }, 500);
}

function showResults() {
    document.getElementById('practice-session').classList.add('hidden');
    document.getElementById('results').classList.remove('hidden');
    const scoreText = `You answered ${correctAnswers} out of ${attemptedQuestions} questions correctly.`;
    const accuracy = Math.round((correctAnswers / attemptedQuestions) * 100);
    const averageTime = Math.round((Date.now() - startTime) / (attemptedQuestions * 1000));
    const statsText = `Accuracy: ${accuracy}%, Average Time per Question: ${averageTime} seconds`;

    document.getElementById('score').textContent = scoreText;
    document.getElementById('stats').textContent = statsText;

    // Save stats in local storage
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
    document.getElementById('results').classList.add('hidden');
    startPractice();
}
