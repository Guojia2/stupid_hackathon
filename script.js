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

// API Configuration
const API_BASE_URL = 'http://localhost:5001';

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
    checkAPIHealth();
}

// Check if the Flask API is running
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✓ API Health Check:', data);
        if (!data.model_loaded) {
            console.warn('⚠ Model not loaded on backend');
        }
    } catch (error) {
        console.error('✗ API not reachable. Make sure Flask server is running:', error);
        console.log('💡 Run: python app.py');
    }
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

// Run model inference via Flask API
async function runModelInference() {
    try {
        emailStatus.innerHTML = '<p>🔄 Running AI model inference...</p>';
        emailStatus.className = 'email-status sending';
        
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ responses: responses })
        });
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✓ Model Inference Result:', result);
        
        return result;
        
    } catch (error) {
        console.error('✗ Model inference failed:', error);
        return null;
    }
}

// Show results
async function showResults() {
    // Hide all question containers
    questionContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Hide progress bar
    document.querySelector('.progress-container').style.display = 'none';
    
    // Calculate traditional AQ-10 score
    const aq10Score = calculateAQ10Score();
    
    // Run model inference
    const modelResult = await runModelInference();
    
    // Generate result message
    let message, recommendation, modelInsight = '';
    
    if (aq10Score >= 6) {
        message = `Your AQ-10 score is <strong>${aq10Score}/10</strong>.`;
        recommendation = "Based on the AQ-10 scoring guidelines, a score of 6 or above suggests you may benefit from a specialist diagnostic assessment for autism spectrum condition.";
    } else {
        message = `Your AQ-10 score is <strong>${aq10Score}/10</strong>.`;
        recommendation = "Based on the AQ-10 scoring guidelines, a score below 6 suggests a lower likelihood of autism spectrum traits. However, if you have ongoing concerns, consulting with a healthcare professional can provide clarity.";
    }
    
    // Add model insights if available
    if (modelResult) {
        const autismProb = (modelResult.model_probabilities.autism * 100).toFixed(1);
        const prediction = modelResult.model_prediction === 1 ? 'Positive' : 'Negative';
        const confidence = modelResult.interpretation.confidence;
        
        modelInsight = `
            <div style="margin-top: 25px; padding: 20px; background-color: #f0f4f8; border-radius: 8px; border-left: 4px solid #4a6fa5;">
                <h3 style="color: #4a6fa5; margin-bottom: 15px;">🤖 AI Model Analysis</h3>
                <p><strong>Model Prediction:</strong> ${prediction} screening</p>
                <p><strong>Autism Probability:</strong> ${autismProb}%</p>
                <p><strong>Confidence:</strong> ${confidence}</p>
                <p><strong>Agreement:</strong> ${modelResult.interpretation.agreement}</p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #6c757d;">
                    <em>This prediction comes from a machine learning model trained on the UCI Autism Screening dataset.</em>
                </p>
            </div>
        `;
    } else {
        modelInsight = `
            <div style="margin-top: 25px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
                <p><strong>⚠ Model inference unavailable</strong></p>
                <p style="font-size: 0.9rem; margin-top: 10px;">
                    Make sure the Flask backend is running: <code>python app.py</code>
                </p>
            </div>
        `;
    }
    
    // Display result
    resultMessage.innerHTML = `
        <p>${message}</p>
        <p>${recommendation}</p>
        ${modelInsight}
    `;
    
    // Show result container
    resultContainer.classList.add('active');
    
    // Send email notification
    sendEmailNotification(aq10Score, message, recommendation, modelResult);
}

// Send email notification to RFK Jr
function sendEmailNotification(score, message, recommendation) {
    const responsesSummary = generateResponsesSummary();
    
    emailStatus.textContent = "🤖 Auto-emailing RFK Jr's campaign...";
    emailStatus.className = "email-status sending";

    const emailData = {
        to_name: "RFK Jr Campaign",
        to_email: "contact@teamkennedy.com",
        from_name: "Autism Screening Bot", 
        from_email: "noreply@autism-screening.demo", // This can be anything
        subject: `AQ-10 Autism Screening Results - Score: ${score}/10`,
        score: score,
        message: message,
        recommendation: recommendation,
        responses_summary: responsesSummary,
        timestamp: new Date().toLocaleString()
    };

    // Replace these with your actual IDs:
    const SERVICE_ID = "autism-detector-app";        // ← Paste Service ID
    const TEMPLATE_ID = "template_e98mf66";      // ← Paste Template ID

    emailjs.send(SERVICE_ID, TEMPLATE_ID, emailData)
        .then(function(response) {
            emailStatus.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
                    <p><strong>Email Automatically Sent to RFK Jr!</strong></p>
                    <p>From: ${emailData.from_email}</p>
                    <p>To: ${emailData.to_email}</p>
                    <p>Score: ${score}/10</p>
                    <p style="font-size: 0.9rem; color: #666;">Check your EmailJS logs to confirm delivery</p>
                </div>
            `;
            emailStatus.className = "email-status success";
        }, function(error) {
            emailStatus.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                    <p><strong>Email Failed to Send</strong></p>
                    <p>Error: ${error.text || 'Check console for details'}</p>
                    <p style="font-size: 0.9rem; color: #666;">Make sure your EmailJS service is connected</p>
                </div>
            `;
            emailStatus.className = "email-status error";
            console.error('EmailJS Error:', error);
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
        const responseText = responses[`q${i}`] ? responses[`q${i}`].replace(/-/g, ' ').toUpperCase() : 'Not answered';
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