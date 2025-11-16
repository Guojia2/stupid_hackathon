// Store user responses
const responses = {
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5: '',
    q6: '',
    q7: '',
    q8: '',
    q9: '',
    q10: ''
};

// DOM elements
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const nextButtons = [
    document.getElementById('next-btn-1'),
    document.getElementById('next-btn-2'),
    document.getElementById('next-btn-3'),
    document.getElementById('next-btn-4'),
    document.getElementById('next-btn-5'),
    document.getElementById('next-btn-6'),
    document.getElementById('next-btn-7'),
    document.getElementById('next-btn-8'),
    document.getElementById('next-btn-9'),
    document.getElementById('next-btn-10')
];
const restartBtn = document.getElementById('restart-btn');
const resultContainer = document.getElementById('result-container');
const resultMessage = document.getElementById('result-message');
const emailStatus = document.getElementById('email-status');

// Question containers
const questionContainers = [
    document.getElementById('question-1'),
    document.getElementById('question-2'),
    document.getElementById('question-3'),
    document.getElementById('question-4'),
    document.getElementById('question-5'),
    document.getElementById('question-6'),
    document.getElementById('question-7'),
    document.getElementById('question-8'),
    document.getElementById('question-9'),
    document.getElementById('question-10')
];

// Current question index
let currentQuestion = 0;

// Initialize the application
function init() {
    updateProgress();
    setupEventListeners();
}

// Update progress bar
function updateProgress() {
    const progressPercentage = ((currentQuestion) / questionContainers.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressText.textContent = `Question ${currentQuestion + 1} of ${questionContainers.length}`;
}

// Show a specific question
function showQuestion(index) {
    questionContainers.forEach((container, i) => {
        if (i === index) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });
    currentQuestion = index;
    updateProgress();
}

// Set up all event listeners
function setupEventListeners() {
    // Handle option selection for all questions
    for (let i = 0; i < questionContainers.length; i++) {
        const options = questionContainers[i].querySelectorAll('.option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                // Remove selected class from all options in this question
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                this.classList.add('selected');
                
                // Store response
                responses[`q${i+1}`] = this.getAttribute('data-value');
                
                // Enable next button
                nextButtons[i].disabled = false;
            });
        });
    }

    // Handle next button clicks
    for (let i = 0; i < nextButtons.length; i++) {
        nextButtons[i].addEventListener('click', function() {
            if (i < questionContainers.length - 1) {
                showQuestion(i + 1);
            } else {
                // Show results
                showResults();
            }
        });
    }

    // Handle restart button
    restartBtn.addEventListener('click', function() {
        resetQuestionnaire();
    });
}

// Calculate AQ-10 score according to official guidelines
function calculateAQ10Score() {
    let score = 0;
    
    // Questions where Definitely/Slightly Agree scores 1 point
    const agreeQuestions = [1, 7, 8, 10];
    agreeQuestions.forEach(q => {
        if (responses[`q${q}`] === 'definitely-agree' || responses[`q${q}`] === 'slightly-agree') {
            score += 1;
        }
    });
    
    // Questions where Definitely/Slightly Disagree scores 1 point
    const disagreeQuestions = [2, 3, 4, 5, 6, 9];
    disagreeQuestions.forEach(q => {
        if (responses[`q${q}`] === 'definitely-disagree' || responses[`q${q}`] === 'slightly-disagree') {
            score += 1;
        }
    });
    
    return score;
}

// Show results
function showResults() {
    // Hide all question containers
    questionContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Hide progress bar
    document.querySelector('.progress-container').style.display = 'none';
    
    // Calculate score
    const score = calculateAQ10Score();
    
    // Generate result message based on score
    let message, recommendation;
    if (score >= 6) {
        message = `Your AQ-10 score is <strong>${score}/10</strong>.`;
        recommendation = "Based on the AQ-10 scoring guidelines, a score of 6 or above suggests you may benefit from a specialist diagnostic assessment for autism spectrum condition.";
    } else {
        message = `Your AQ-10 score is <strong>${score}/10</strong>.`;
        recommendation = "Based on the AQ-10 scoring guidelines, a score below 6 suggests a lower likelihood of autism spectrum traits. However, if you have ongoing concerns, consulting with a healthcare professional can provide clarity.";
    }
    
    // Display result
    resultMessage.innerHTML = `
        <p>${message}</p>
        <p>${recommendation}</p>
    `;
    
    // Show result container
    resultContainer.classList.add('active');
    
    // Send email notification
    sendEmailNotification(score, message, recommendation);
}

// Send email notification to RFK Jr
function sendEmailNotification(score, message, recommendation) {
    const responsesSummary = generateResponsesSummary();
    
    // Prepare email content
    const subject = `AQ-10 Autism Screening Results - Score: ${score}/10`;
    const body = `
AQ-10 Autism Spectrum Quotient Screening Completed:

Score: ${score}/10
Result: ${message}
Recommendation: ${recommendation}
Timestamp: ${new Date().toLocaleString()}

Responses Summary:
${responsesSummary}

---
This email was generated by the AQ-10 Autism Screening Questionnaire application.
Based on: Allison C, Auyeung B, and Baron-Cohen S, (2012) Journal of the American Academy of Child and Adolescent Psychiatry 51(2):202-12.
    `.trim();

    // Encode the subject and body for mailto link
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    // Show email instructions with clickable link
    emailStatus.innerHTML = `
        <p><strong>Step 1:</strong> Click the button below to open your email client</p>
        <p><strong>Step 2:</strong> Review the pre-filled email and click send</p>
        <p><strong>Recipient:</strong> contact@teamkennedy.com</p>
        <div style="margin: 20px 0;">
            <a href="mailto:contact@teamkennedy.com?subject=${encodedSubject}&body=${encodedBody}" 
               class="btn" 
               style="display: inline-block; text-decoration: none; text-align: center;">
                📧 Open Email to RFK Jr
            </a>
        </div>
        <p><em>If the button doesn't work, copy the information below and email it to: <strong>contact@teamkennedy.com</strong></em></p>
    `;
    emailStatus.className = "email-status success";
    
    // Also show the plain text version for copying
    const copySection = document.createElement('div');
    copySection.style.marginTop = '20px';
    copySection.style.padding = '15px';
    copySection.style.backgroundColor = '#f8f9fa';
    copySection.style.borderRadius = '5px';
    copySection.style.border = '1px solid #dee2e6';
    copySection.innerHTML = `
        <h4 style="margin-bottom: 10px;">Copy & Paste Version:</h4>
        <div style="background: white; padding: 15px; border-radius: 3px; border: 1px solid #ccc; font-family: monospace; font-size: 0.9rem; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
${body}
        </div>
        <button id="copy-btn" class="btn" style="margin-top: 10px; background-color: #6c757d;">
            📋 Copy to Clipboard
        </button>
    `;
    emailStatus.appendChild(copySection);
    
    // Add copy to clipboard functionality
    document.getElementById('copy-btn').addEventListener('click', function() {
        navigator.clipboard.writeText(body).then(function() {
            const originalText = this.textContent;
            this.textContent = '✓ Copied!';
            this.style.backgroundColor = '#28a745';
            setTimeout(() => {
                this.textContent = originalText;
                this.style.backgroundColor = '#6c757d';
            }, 2000);
        }.bind(this));
    });
}

// Generate responses summary for email
function generateResponsesSummary() {
    let summary = '';
    const questionTexts = [
        "I often notice small sounds when others do not",
        "I usually concentrate more on the whole picture, rather than the small details",
        "I find it easy to do more than one thing at once",
        "If there is an interruption, I can switch back to what I was doing very quickly",
        "I find it easy to 'read between the lines' when someone is talking to me",
        "I know how to tell if someone listening to me is getting bored",
        "When I'm reading a story I find it difficult to work out the characters' intentions",
        "I like to collect information about categories of things",
        "I find it easy to work out what someone is thinking or feeling just by looking at their face",
        "I find it difficult to work out people's intentions"
    ];
    
    for (let i = 1; i <= 10; i++) {
        const responseText = responses[`q${i}`] ? responses[`q${i}`].replace('-', ' ').toUpperCase() : 'Not answered';
        summary += `Q${i}: ${questionTexts[i-1]}\nAnswer: ${responseText}\n\n`;
    }
    return summary;
}

// Reset the questionnaire
function resetQuestionnaire() {
    // Reset responses
    for (let key in responses) {
        responses[key] = '';
    }
    
    // Reset UI
    emailStatus.textContent = '';
    emailStatus.className = '';
    
    // Clear all selected options
    document.querySelectorAll('.option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Disable all next buttons
    nextButtons.forEach(button => {
        button.disabled = true;
    });
    
    // Hide result container
    resultContainer.classList.remove('active');
    
    // Show progress bar
    document.querySelector('.progress-container').style.display = 'block';
    
    // Show first question
    showQuestion(0);
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init);