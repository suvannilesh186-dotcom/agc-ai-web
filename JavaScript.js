import { CONFIG } from './config.js';

let tokenClient;
let accessToken = null;

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
    errDiv.style.color = 'red';
    errDiv.style.padding = '10px';
    errDiv.style.marginTop = '10px';
    errDiv.style.wordBreak = 'break-all';
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
      updateUI(channel);
    } else {
      showScreenError("No YouTube channel found for this account.");
    }
  } catch (error) {
    showScreenError("API Fetch Error: " + error.message);
  }
}

// 🔊 Hindi Text-to-Speech Voice Over
function speakHindi(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

function updateUI(channel) {
  // Hide login & welcome header
  const authSection = document.getElementById('auth-section');
  if (authSection) authSection.style.display = 'none';
  
  const headerTitle = document.querySelector('.header-title');
  if (headerTitle) headerTitle.style.display = 'none';

  // Show Main AI Dashboard directly on screen
  const mainDashboard = document.getElementById('main-ai-dashboard');
  if (mainDashboard) mainDashboard.style.display = 'flex';

  // Show Hamburger Menu
  const topContainer = document.getElementById('top-profile-container');
  if (topContainer) topContainer.style.display = 'flex';

  // Set Profile info in sidebar
  const popupLogo = document.getElementById('popup-profile-img');
  const thumbnail = channel.thumbnails?.default?.url || '';
  if (thumbnail && popupLogo) popupLogo.src = thumbnail;

  document.getElementById('channel-name').textContent = channel.title;
  document.getElementById('channel-email').textContent = channel.customUrl || '';

  // Sidebar Toggle Logic
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

  // --- AI CHAT LOGIC WITH HINDI VOICE ---
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  document.getElementById('send-chat-btn').onclick = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatInput.value = '';

    setTimeout(() => {
      const botDiv = document.createElement('div');
      botDiv.className = 'bot-msg';
      
      let reply = "Namaste! Aapka sawal bahut accha hai. AGC AI ispar kaam kar raha hai.";
      if (text.toLowerCase().includes("kaise ho") || text.toLowerCase().includes("कैसे हो")) {
        reply = "Main bilkul thik hu! Bataiye, aaj status ke liye kya banayein?";
      } else if (text.toLowerCase().includes("status") || text.toLowerCase().includes("स्टेटस")) {
        reply = "Nilesh Status King ke liye naye viral ideas taiyar hain!";
      }

      botDiv.textContent = reply;
      chatMessages.appendChild(botDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Speak in Hindi voice
      speakHindi(reply);
    }, 500);
  };

  // --- AI IMAGE GENERATOR LOGIC ---
  document.getElementById('generate-img-btn').onclick = () => {
    const promptText = document.getElementById('img-prompt-input').value.trim();
    const resultContainer = document.getElementById('image-result-container');
    
    if (!promptText) {
      alert("Kripya kuch prompt likhein!");
      return;
    }

    resultContainer.innerHTML = `<p class="placeholder-text">AI tasveer bana raha hai...</p>`;
    
    const encodedPrompt = encodeURIComponent(promptText + ", highly detailed, cinematic, fantasy concept art");
    const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=512&height=512&nologo=true`;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      resultContainer.innerHTML = '';
      resultContainer.appendChild(img);
    };
    img.onerror = () => {
      resultContainer.innerHTML = `<p class="placeholder-text" style="color:red;">Image load nahi ho saki.</p>`;
    };
  };

  // Logout Logic
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      window.speechSynthesis.cancel();
      window.location.reload();
    };
  }
}

document.addEventListener('DOMContentLoaded', initAuth);
