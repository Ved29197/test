class QuizApp {
    constructor() {
        this.currentScreen = 'welcome-screen';
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.timer = null;
        this.timeLeft = 60;
        this.quizStartTime = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitQuiz());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartQuiz());
        document.getElementById('view-answers-btn').addEventListener('click', () => this.viewAnswers());
        document.getElementById('back-to-results').addEventListener('click', () => this.showResults());
    }

    async startQuiz() {
        const category = document.getElementById('category').value;
        const difficulty = document.getElementById('difficulty').value;
        
        try {
            // In a real app, this would fetch from your backend API
            // For demo purposes, we'll use sample questions
            this.questions = await this.fetchQuestions(category, difficulty);
            
            if (this.questions.length === 0) {
                alert('No questions available for the selected category and difficulty.');
                return;
            }
            
            this.resetQuiz();
            this.showScreen('quiz-screen');
            this.displayQuestion();
            this.startTimer();
            this.quizStartTime = new Date();
        } catch (error) {
            console.error('Error starting quiz:', error);
            alert('Failed to load questions. Please try again.');
        }
    }

    async fetchQuestions(category, difficulty) {
        // In a real implementation, this would be an API call to your backend
        // For now, we'll return sample questions
        return [
            {
                id: 1,
                question: "What does HTML stand for?",
                options: [
                    "Hyper Text Markup Language",
                    "High Tech Modern Language",
                    "Hyper Transfer Markup Language",
                    "Home Tool Markup Language"
                ],
                correct_answer: "Hyper Text Markup Language",
                category: "Computers",
                difficulty: "easy"
            },
            {
                id: 2,
                question: "Which language runs in a web browser?",
                options: [
                    "Java",
                    "C",
                    "Python",
                    "JavaScript"
                ],
                correct_answer: "JavaScript",
                category: "Computers",
                difficulty: "easy"
            },
            {
                id: 3,
                question: "What year was JavaScript launched?",
                options: [
                    "1996",
                    "1995",
                    "1994",
                    "None of the above"
                ],
                correct_answer: "1995",
                category: "Computers",
                difficulty: "medium"
            },
            {
                id: 4,
                question: "What does CSS stand for?",
                options: [
                    "Creative Style Sheets",
                    "Cascading Style Sheets",
                    "Computer Style Sheets",
                    "Colorful Style Sheets"
                ],
                correct_answer: "Cascading Style Sheets",
                category: "Computers",
                difficulty: "easy"
            },
            {
                id: 5,
                question: "Which of the following is a JavaScript framework?",
                options: [
                    "Django",
                    "Laravel",
                    "React",
                    "Spring"
                ],
                correct_answer: "React",
                category: "Computers",
                difficulty: "medium"
            }
        ];
    }

    displayQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const questionElement = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        const questionCounter = document.getElementById('question-counter');
        
        questionElement.textContent = question.question;
        questionCounter.textContent = `Question: ${this.currentQuestionIndex + 1}/${this.questions.length}`;
        
        optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            if (this.userAnswers[this.currentQuestionIndex] === option) {
                optionElement.classList.add('selected');
            }
            optionElement.textContent = option;
            optionElement.addEventListener('click', () => this.selectOption(option));
            optionsContainer.appendChild(optionElement);
        });
        
        this.updateNavigationButtons();
    }

    selectOption(selectedOption) {
        this.userAnswers[this.currentQuestionIndex] = selectedOption;
        this.displayQuestion(); // Refresh to show selection
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');
        
        prevBtn.style.display = this.currentQuestionIndex > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = this.currentQuestionIndex < this.questions.length - 1 ? 'inline-block' : 'none';
        submitBtn.style.display = this.currentQuestionIndex === this.questions.length - 1 ? 'inline-block' : 'none';
    }

    startTimer() {
        this.timeLeft = 60 * this.questions.length; // 60 seconds per question
        this.updateTimerDisplay();
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.submitQuiz();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    submitQuiz() {
        clearInterval(this.timer);
        this.calculateScore();
        this.showResults();
        
        // In a real app, you would send the results to your backend
        this.saveResultsToDatabase();
    }

    calculateScore() {
        this.score = 0;
        this.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correct_answer) {
                this.score++;
            }
        });
    }

    showResults() {
        const finalScore = document.getElementById('final-score');
        const percentage = document.getElementById('percentage');
        const correctAnswers = document.getElementById('correct-answers');
        const wrongAnswers = document.getElementById('wrong-answers');
        const timeTaken = document.getElementById('time-taken');
        
        const percentageValue = Math.round((this.score / this.questions.length) * 100);
        
        finalScore.textContent = `${this.score}/${this.questions.length}`;
        percentage.textContent = `${percentageValue}%`;
        correctAnswers.textContent = this.score;
        wrongAnswers.textContent = this.questions.length - this.score;
        
        // Calculate time taken
        const endTime = new Date();
        const timeDiff = Math.floor((endTime - this.quizStartTime) / 1000);
        const minutes = Math.floor(timeDiff / 60);
        const seconds = timeDiff % 60;
        timeTaken.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        this.showScreen('results-screen');
    }

    viewAnswers() {
        const answersContainer = document.getElementById('answers-container');
        answersContainer.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const answerItem = document.createElement('div');
            const isCorrect = this.userAnswers[index] === question.correct_answer;
            answerItem.className = `answer-item ${isCorrect ? 'correct' : 'incorrect'}`;
            
            answerItem.innerHTML = `
                <div class="answer-question">${index + 1}. ${question.question}</div>
                <div class="answer-user"><strong>Your answer:</strong> ${this.userAnswers[index] || 'Not answered'}</div>
                <div class="answer-correct"><strong>Correct answer:</strong> ${question.correct_answer}</div>
            `;
            
            answersContainer.appendChild(answerItem);
        });
        
        this.showScreen('answers-screen');
    }

    restartQuiz() {
        this.showScreen('welcome-screen');
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
    }

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.timeLeft = 60;
        document.getElementById('score').textContent = 'Score: 0';
        
        if (this.timer) {
            clearInterval(this.timer);
        }
    }

    async saveResultsToDatabase() {
        // In a real implementation, this would send data to your backend
        const quizResult = {
            score: this.score,
            totalQuestions: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            category: this.questions[0]?.category || 'General Knowledge',
            difficulty: this.questions[0]?.difficulty || 'medium',
            timestamp: new Date().toISOString()
        };
        
        try {
            // This would be a fetch call to your backend API
            console.log('Saving quiz results:', quizResult);
            // await fetch('/api/results', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(quizResult)
            // });
        } catch (error) {
            console.error('Failed to save results:', error);
        }
    }
}

// Initialize the quiz app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});