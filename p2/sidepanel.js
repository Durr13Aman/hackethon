// Side Panel JavaScript
let apiKey = '';
let conversationHistory = [];
let latestScreenshot = null;
let screenshotEnabled = true; // Always enabled
let userProfile = null;

// DOM elements
const onboardingForm = document.getElementById('onboardingForm');
const submitOnboardingBtn = document.getElementById('submitOnboarding');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user has completed onboarding
  const stored = await chrome.storage.local.get(['userProfile', 'openaiApiKey']);

  if (stored.userProfile && stored.openaiApiKey) {
    // User has completed onboarding
    userProfile = stored.userProfile;
    apiKey = stored.openaiApiKey;
    showMainInterface();
  } else {
    // Show onboarding form
    onboardingForm.style.display = 'block';
  }
});

// Handle onboarding submission
submitOnboardingBtn.addEventListener('click', async () => {
  const name = document.getElementById('onboardName').value.trim();
  const major = document.getElementById('onboardMajor').value.trim();
  const career = document.getElementById('onboardCareer').value.trim();
  const skills = document.getElementById('onboardSkills').value.trim();
  const apiKeyValue = document.getElementById('onboardApiKey').value.trim();

  // Validate
  if (!name || !major || !career || !skills || !apiKeyValue) {
    alert('Please fill in all fields');
    return;
  }

  // Save profile and API key
  userProfile = { name, major, career, skills };
  apiKey = apiKeyValue;

  await chrome.storage.local.set({
    userProfile,
    openaiApiKey: apiKeyValue
  });

  // Hide onboarding, show main interface
  onboardingForm.style.display = 'none';
  showMainInterface();
});

// Show main interface and initialize
function showMainInterface() {
  // Hide onboarding form
  onboardingForm.style.display = 'none';

  // Set up API key display
  apiKeyInput.value = '••••••••••••';
  sendBtn.disabled = false;

  // Load conversation history
  chrome.storage.local.get(['conversationHistory'], (result) => {
    if (result.conversationHistory) {
      conversationHistory = result.conversationHistory;
      restoreConversation();
    }
  });

  // Automatically start screenshot capture
  chrome.runtime.sendMessage({
    action: 'startScreenshotCapture',
    interval: 5000
  });
}

// Save API key
saveApiKeyBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (key && !key.includes('•')) {
    apiKey = key;
    await chrome.storage.local.set({ openaiApiKey: key });
    apiKeyInput.value = '••••••••••••';
    showStatus('API key saved successfully!', 'success');
    sendBtn.disabled = false;
  } else if (!key) {
    showStatus('Please enter an API key', 'error');
  }
});

// Show status message
function showStatus(message, type) {
  apiKeyStatus.textContent = message;
  apiKeyStatus.className = `status-message ${type}`;
  setTimeout(() => {
    apiKeyStatus.textContent = '';
    apiKeyStatus.className = 'status-message';
  }, 3000);
}

// Send message
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add user message to chat
  addMessageToChat('user', message);
  conversationHistory.push({ role: 'user', content: message });

  // Clear input
  userInput.value = '';

  // Show loading
  const loadingId = addLoadingMessage();

  try {
    // Capture fresh screenshot if screenshot mode is enabled
    if (screenshotEnabled) {
      const response = await chrome.runtime.sendMessage({ action: 'captureNow' });
      if (response && response.screenshot) {
        latestScreenshot = response.screenshot;
      }
    }

    // Call OpenAI API
    const response = await callOpenAI();

    // Remove loading and add response
    removeLoadingMessage(loadingId);
    addMessageToChat('assistant', response);
    conversationHistory.push({ role: 'assistant', content: response });

    // Save conversation
    await chrome.storage.local.set({ conversationHistory });
  } catch (error) {
    removeLoadingMessage(loadingId);
    addMessageToChat('assistant', `Error: ${error.message}. Please check your API key and try again.`);
  }
}

async function callOpenAI() {
  if (!apiKey) {
    throw new Error('API key not set');
  }

  // Build system message with course context
  const systemMessage = buildSystemMessage();

  // Build messages array - use slice to create a copy
  const messages = [
    { role: 'system', content: systemMessage },
    ...conversationHistory.slice(-10).map(msg => ({...msg})) // Deep copy to avoid mutating history
  ];

  // If we have a screenshot, add it to the last user message
  if (latestScreenshot && messages.length > 1) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      // Get the original text content
      const textContent = typeof lastMessage.content === 'string'
        ? lastMessage.content
        : lastMessage.content;

      // Convert to vision format
      lastMessage.content = [
        {
          type: 'text',
          text: textContent
        },
        {
          type: 'image_url',
          image_url: {
            url: latestScreenshot,
            detail: 'high'
          }
        }
      ];
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Use gpt-4o for vision support
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function buildSystemMessage() {
  let systemMsg = `You are a helpful course planning assistant for UW-Madison students. You help students understand courses, plan their schedules, and make informed decisions about their academic journey.`;

  // Add personalized user context
  if (userProfile) {
    systemMsg += `\n\nStudent Profile:`;
    systemMsg += `\n- Name: ${userProfile.name}`;
    systemMsg += `\n- Major: ${userProfile.major}`;
    systemMsg += `\n- Career Goal: ${userProfile.career}`;
    systemMsg += `\n- Skills to Develop: ${userProfile.skills}`;
    systemMsg += `\n\nUse this information to provide personalized advice that aligns with ${userProfile.name}'s goals and interests. Recommend courses and provide guidance that supports their career path and skill development objectives.`;
  }

  if (latestScreenshot) {
    systemMsg += `\n\nYou have been provided with a screenshot of the current page the student is viewing on enroll.wisc.edu. Analyze the screenshot to extract course information, schedules, requirements, or any other relevant details visible on the screen. Use this visual information to provide accurate and helpful responses.`;
  }

  systemMsg += `\n\nBe concise, friendly, and helpful. If you don't have specific information, acknowledge it and provide general guidance.`;

  return systemMsg;
}

function addMessageToChat(sender, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${sender}`;

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';

  // Convert markdown-style formatting to HTML
  const formattedContent = formatMessage(content);
  contentDiv.innerHTML = formattedContent;

  messageDiv.appendChild(contentDiv);
  chatContainer.appendChild(messageDiv);

  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function formatMessage(text) {
  // Simple formatting: convert **bold** and *italic* and newlines
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

function addLoadingMessage() {
  const id = 'loading-' + Date.now();
  const messageDiv = document.createElement('div');
  messageDiv.id = id;
  messageDiv.className = 'chat-message assistant';
  messageDiv.innerHTML = '<div class="message-content"><span class="loading">Thinking</span></div>';
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return id;
}

function removeLoadingMessage(id) {
  const loadingDiv = document.getElementById(id);
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

function restoreConversation() {
  // Skip the first welcome message and restore the rest
  conversationHistory.forEach(msg => {
    addMessageToChat(msg.role, msg.content);
  });
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'screenshotCaptured') {
    latestScreenshot = message.screenshot;
  }
});

// Clear conversation button (optional feature)
function clearConversation() {
  conversationHistory = [];
  chatContainer.innerHTML = '';
  chrome.storage.local.remove('conversationHistory');
  // Re-add welcome message
  addMessageToChat('assistant', 'Conversation cleared. How can I help you?');
}