document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jsonUpload = document.getElementById('json-upload');
    const configSection = document.getElementById('config-section');
    const numQuestionsInput = document.getElementById('num-questions');
    const startExamBtn = document.getElementById('start-exam');
    const examSection = document.getElementById('exam-section');
    const timerDisplay = document.getElementById('time-left');
    const questionNumber = document.getElementById('question-number');
    const questionText = document.getElementById('question-text');
    const optionsForm = document.getElementById('options-form');
    const nextQuestionBtn = document.getElementById('next-question');
    const flagQuestionBtn = document.getElementById('flag-question');
    const questionList = document.getElementById('question-list');
    const showPortalBtn = document.getElementById('show-portal');
    const portalModal = document.getElementById('portal-modal');
    const modalQuestionList = document.getElementById('modal-question-list');
    const closeModalBtn = document.getElementById('close-modal');
    const resultSection = document.getElementById('result-section');
    const scoreDisplay = document.getElementById('score');
    const explanationsDiv = document.getElementById('explanations');
    const restartBtn = document.getElementById('restart');
  
    let questions = [];
    let selectedQuestions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval;
    let timeLeft;
    let userAnswers = [];
  
    // Handle JSON Upload
    jsonUpload.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          questions = JSON.parse(e.target.result);
          if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid or empty JSON file.');
          }
          numQuestionsInput.disabled = false;
          numQuestionsInput.max = questions.length;
          numQuestionsInput.value = questions.length;
          startExamBtn.disabled = false;
          alert(`Loaded ${questions.length} questions.`);
        } catch (err) {
          alert(`Error: ${err.message}`);
          numQuestionsInput.disabled = true;
          startExamBtn.disabled = true;
          questions = [];
        }
      };
      reader.readAsText(file);
    });
  
    // Start Exam
    startExamBtn.addEventListener('click', () => {
      const numQuestions = parseInt(numQuestionsInput.value);
      if (numQuestions < 1 || numQuestions > questions.length) {
        alert('Invalid number of questions.');
        return;
      }
  
      selectedQuestions = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, numQuestions);
  
      currentQuestionIndex = 0;
      score = 0;
      userAnswers = Array(numQuestions).fill(null).map(() => ({
        selected: null,
        correct: null,
        question: null,
        explanation: null,
        isCorrect: false,
        flagged: false
      }));
      configSection.style.display = 'none';
      examSection.style.display = 'block';
      nextQuestionBtn.disabled = false;
      flagQuestionBtn.disabled = false;
      showPortalBtn.disabled = false;
      startTimer(numQuestions * 60);
      updateSidePortal();
      displayQuestion();
    });
  
    // Timer Function
    function startTimer(seconds) {
      timeLeft = seconds;
      updateTimerDisplay();
      timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          alert("Time's up! Exam ended.");
          endExam();
        }
      }, 1000);
    }
  
    function updateTimerDisplay() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
  
    // Display Question
    function displayQuestion() {
      const q = selectedQuestions[currentQuestionIndex];
      questionNumber.textContent = `${currentQuestionIndex + 1} of ${selectedQuestions.length}`;
      questionText.textContent = q.question;
      optionsForm.innerHTML = '';
  
      const options = Object.entries(q.options).map(([key, value]) => ({
        key,
        value
      }));
  
      options.forEach((option) => {
        const label = document.createElement('label');
        const isChecked = userAnswers[currentQuestionIndex]?.selected === option.key;
        label.innerHTML = `
          <input type="radio" name="option" value="${option.key}" ${isChecked ? 'checked' : ''}>
          ${option.key.toUpperCase()}. ${option.value}
        `;
        optionsForm.appendChild(label);
      });
  
      nextQuestionBtn.textContent =
        currentQuestionIndex === selectedQuestions.length - 1 ? 'Submit' : 'Next';
      flagQuestionBtn.textContent = userAnswers[currentQuestionIndex]?.flagged ? 'Unflag' : 'Flag';
    }
  
    // Update Side Portal (Desktop and Modal)
    function updateSidePortal() {
      // Desktop Portal
      questionList.innerHTML = '';
      selectedQuestions.forEach((_, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        if (userAnswers[index]?.selected) item.classList.add('answered');
        if (userAnswers[index]?.flagged) item.classList.add('flagged');
        item.innerHTML = `${index + 1}${userAnswers[index]?.flagged ? '<span class="flag-icon">🚩</span>' : ''}`;
        item.addEventListener('click', () => goToQuestion(index));
        questionList.appendChild(item);
      });
  
      // Mobile Modal
      modalQuestionList.innerHTML = '';
      selectedQuestions.forEach((_, index) => {
        const item = document.createElement('div');
        item.className = 'question-item';
        if (userAnswers[index]?.selected) item.classList.add('answered');
        if (userAnswers[index]?.flagged) item.classList.add('flagged');
        item.innerHTML = `${index + 1}${userAnswers[index]?.flagged ? '<span class="flag-icon">🚩</span>' : ''}`;
        item.addEventListener('click', () => {
          goToQuestion(index);
          portalModal.style.display = 'none';
        });
        modalQuestionList.appendChild(item);
      });
    }
  
    // Navigate to Question
    function goToQuestion(index) {
      if (index >= 0 && index < selectedQuestions.length) {
        currentQuestionIndex = index;
        displayQuestion();
        updateSidePortal();
      }
    }
  
    // Handle Next Question
    nextQuestionBtn.addEventListener('click', () => {
      const selectedOption = document.querySelector('input[name="option"]:checked');
      if (!selectedOption) {
        alert('Please select an answer.');
        return;
      }
  
      const selectedOptionKey = selectedOption.value;
      const q = selectedQuestions[currentQuestionIndex];
      const correctOptionText = q.options[q.correct_answer];
  
      userAnswers[currentQuestionIndex] = {
        question: q.question,
        selected: selectedOptionKey,
        correct: correctOptionText,
        explanation: q.explanation,
        isCorrect: selectedOptionKey === q.correct_answer,
        flagged: userAnswers[currentQuestionIndex]?.flagged || false
      };
  
      if (userAnswers[currentQuestionIndex].isCorrect) {
        score++;
      }
  
      currentQuestionIndex++;
      if (currentQuestionIndex < selectedQuestions.length) {
        displayQuestion();
        updateSidePortal();
      } else {
        clearInterval(timerInterval);
        endExam();
      }
    });
  
    // Handle Flag Question
    flagQuestionBtn.addEventListener('click', () => {
      userAnswers[currentQuestionIndex].flagged = !userAnswers[currentQuestionIndex].flagged;
      displayQuestion();
      updateSidePortal();
    });
  
    // Show/Hide Modal
    showPortalBtn.addEventListener('click', () => {
      portalModal.style.display = 'flex';
    });
  
    closeModalBtn.addEventListener('click', () => {
      portalModal.style.display = 'none';
    });
  
    // End Exam
    function endExam() {
      examSection.style.display = 'none';
      nextQuestionBtn.disabled = true;
      flagQuestionBtn.disabled = true;
      showPortalBtn.disabled = true;
      resultSection.style.display = 'block';
      const answeredCount = userAnswers.filter(ans => ans.selected).length;
      const percentage = answeredCount > 0 ? (score / selectedQuestions.length) * 100 : 0;
      scoreDisplay.textContent = percentage.toFixed(2);
  
      explanationsDiv.innerHTML = '';
      userAnswers.forEach((ans, index) => {
        if (ans.question) {
          const div = document.createElement('div');
          div.className = 'explanation';
          div.innerHTML = `
            <h3>Question ${index + 1}: ${ans.question}</h3>
            <p><strong>Your Answer:</strong> ${ans.selected ? ans.selected : 'Not answered'} (${ans.isCorrect ? 'Correct' : 'Incorrect'})</p>
            <p><strong>Correct Answer:</strong> ${ans.correct}</p>
            <p><strong>Explanation:</strong> ${ans.explanation}</p>
            ${ans.flagged ? '<p><strong>Flagged:</strong> Yes</p>' : ''}
          `;
          explanationsDiv.appendChild(div);
        }
      });
    }
  
    // Restart Exam
    restartBtn.addEventListener('click', () => {
      resultSection.style.display = 'none';
      configSection.style.display = 'block';
      numQuestionsInput.value = '';
      numQuestionsInput.disabled = true;
      startExamBtn.disabled = true;
      jsonUpload.value = '';
      selectedQuestions = [];
      userAnswers = [];
      questions = [];
      explanationsDiv.innerHTML = '';
    });
  });