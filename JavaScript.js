import { CONFIG } from './config.js';

let tokenClient;
let accessToken = null;
let globalKnowledgeBase = null;

// 🌐 JSON डेटा बैंक को लोड करने का सुरक्षित फंक्शन
async function loadDatabase() {
  try {
    const response = await fetch('database.json');
    if (!response.ok) throw new Error("Network response was not ok");
    globalKnowledgeBase = await response.json();
    console.log("✅ JSON Database Loaded Successfully!");
  } catch (error) {
    console.error("Database load error:", error);
  }
}

// 🔍 JSON डेटा बैंक से स्मार्ट सर्च इंजन (एरर-फ्री लॉजिक)
function searchInJSON(userInput) {
  if (!globalKnowledgeBase) {
    return "⏳ डेटा बैंक लोड हो रहा है, कृपया एक सेकंड बाद दोबारा प्रयास करें।";
  }

  const cleanInput = userInput.toLowerCase();

  for (let category in globalKnowledgeBase) {
    let items = globalKnowledgeBase[category];
    if (Array.isArray(items)) {
      for (let item of items) {
        if (item.keywords && Array.isArray(item.keywords)) {
          for (let kw of item.keywords) {
            if (cleanInput.includes(kw.toLowerCase())) {
              return item.response;
            }
          }
        }
      }
    }
  }

  return `🎯 **AGC.AI JSON डेटा बैंक रिस्पॉन्स:**\nमैंने आपके प्रॉम्ट ("${userInput}") को डेटाबेस में जांच लिया है। Nilesh Status King के लिए यह एक बढ़िया टॉपिक है। आप चाहें तो इसकी 4K इमेज या स्क्रिप्ट बनवा सकते हैं!`;
}

function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function showScreenError(message) {
  let errDiv = document.getElementById('error-display');
  if (!errDiv) {
    errDiv = document.createElement('div');
    errDiv.id = 'error-display';
    errDiv.style.color = '#ef4444';
    errDiv.style.padding = '10px';
    errDiv.style.textAlign = 'center';
    document.body.appendChild(errDiv);
  }
  errDiv.textContent = "Error: " + message;
}

async function initAuth() {
  try {
    await loadGsiScript();

    if (!CONFIG.clientId || CONFIG.clientId.includes("YOUR_REAL_CLIENT_ID")) {
      showScreenError("Please update your clientId in config.js!");
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CONFIG.clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      callback: async (response) => {
        if (response.error) {
          showScreenError("Auth Error: " + JSON.stringify(response));
          return;
        }
        accessToken = response.access_token;
        await fetchYouTubeChannel(accessToken);
      },
    });

    const loginBtn = document.getElementById('google-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        try {
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } catch (e) {
          showScreenError("Popup Exception: " + e.message);
        }
      });
    }

  } catch (error) {
    showScreenError("Failed to load GIS script: " + error.message);
  }
}

async function fetchYouTubeChannel(token) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const targetChannel = data.items.find(item => 
        item.snippet.title.toLowerCase().includes("nilesh status king")
      ) || data.items[0];

      const channel = targetChannel.snippet;
      
      localStorage.setItem('agc_logged_in', 'true');
      localStorage.setItem('channel_data', JSON.stringify(channel));

      updateUI(channel);
    } else {
      showScreenError("No YouTube channel found for this account.");
    }
  } catch (error) {
    showScreenError("API Fetch Error: " + error.message);
  }
}

function speakHindi(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function updateUI(channel) {
  const authSection = document.getElementById('auth-section');
  if (authSection) authSection.style.display = 'none';

  const mainDashboard = document.getElementById('main-ai-dashboard');
  if (mainDashboard) mainDashboard.style.display = 'flex';

  const topContainer = document.getElementById('top-profile-container');
  if (topContainer) topContainer.style.display = 'flex';

  const popupLogo = document.getElementById('popup-profile-img');
  const thumbnail = channel.thumbnails?.default?.url || '';
  if (thumbnail && popupLogo) popupLogo.src = thumbnail;

  const channelNameElem = document.getElementById('channel-name');
  if (channelNameElem) channelNameElem.textContent = channel.title;

  const channelEmailElem = document.getElementById('channel-email');
  if (channelEmailElem) channelEmailElem.textContent = channel.customUrl || '';

  const profileSection = document.getElementById('channel-profile');
  if (topContainer && profileSection) {
    topContainer.onclick = (e) => {
      e.stopPropagation();
      profileSection.classList.toggle('open');
    };

    document.addEventListener('click', (e) => {
      if (!profileSection.contains(e.target) && !topContainer.contains(e.target)) {
        profileSection.classList.remove('open');
      }
    });
  }

  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const sendBtn = document.getElementById('send-chat-btn');

  if (!chatInput || !chatMessages) return;

  const handleSendMessage = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const lowerText = text.toLowerCase();
    
    const isImageRequest = 
      lowerText.includes("banao") || 
      lowerText.includes("banvo") || 
      lowerText.includes("photo") || 
      lowerText.includes("image") || 
      lowerText.includes("picture") || 
      lowerText.includes("chahiye") || 
      lowerText.includes("kalpnik") || 
      lowerText.includes("create") || 
      lowerText.includes("4k") ||
      lowerText.includes("drawing") ||
      lowerText.includes("tasveer");

    setTimeout(() => {
      const botDiv = document.createElement('div');
      botDiv.className = 'bot-msg';

      if (isImageRequest) {
        botDiv.innerHTML = `यह लीजिए आपकी 4K काल्पनिक तस्वीर तैयार है:`;
        chatMessages.appendChild(botDiv);

        const imgLoading = document.createElement('div');
        imgLoading.className = 'bot-msg';
        imgLoading.innerHTML = `🖼️ AI 4K तस्वीर बना रहा है, कृपया इंतज़ार करें...`;
        chatMessages.appendChild(imgLoading);

        const enhancedPrompt = text + ", highly detailed, cinematic lighting, 8k resolution, photorealistic, masterwork";
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

        const img = document.createElement('img');
        img.className = 'chat-generated-img';
        img.src = imageUrl;

        img.onload = () => {
          imgLoading.remove();
          chatMessages.appendChild(img);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          speakHindi("तस्वीर तैयार है!");
        };

        img.onerror = () => {
          imgLoading.textContent = "तस्वीर लोड करने में समस्या आई। कृपया पुनः प्रयास करें।";
          chatMessages.scrollTop = chatMessages.scrollHeight;
        };

      } else {
        const reply = searchInJSON(text);

        botDiv.innerHTML = reply.replace(/\n/g, '<br>');
        chatMessages.appendChild(botDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        speakHindi(reply);
      }
    }, 600);
  };

  if (sendBtn) sendBtn.onclick = handleSendMessage;
  chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      window.speechSynthesis.cancel();
      localStorage.removeItem('agc_logged_in');
      localStorage.removeItem('channel_data');
      window.location.reload();
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDatabase();
  initAuth();

  const isLoggedIn = localStorage.getItem('agc_logged_in');
  if (isLoggedIn === 'true') {
    const savedChannelData = localStorage.getItem('channel_data');
    if (savedChannelData) {
      try {
        const channel = JSON.parse(savedChannelData);
        updateUI(channel);
      } catch (e) {
        console.error("Channel data parse error:", e);
      }
    }
  }
});
