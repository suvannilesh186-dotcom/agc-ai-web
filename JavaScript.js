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
      
      // 🟢 Login state aur channel data localStorage me save kar rahe hain
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

// 🔊 Hindi Voice-over function
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
  // Hide login screen
  const authSection = document.getElementById('auth-section');
  if (authSection) authSection.style.display = 'none';

  // Show Chat Dashboard
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

  // --- CHAT & IMAGE GENERATOR LOGIC ---
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');

  const handleSendMessage = () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'user-msg';
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const lowerText = text.toLowerCase();
    const isImageRequest = lowerText.includes("banao") || lowerText.includes("photo") || lowerText.includes("image") || lowerText.includes("picture") || lowerText.includes("chahiye");

    setTimeout(() => {
      const botDiv = document.createElement('div');
      botDiv.className = 'bot-msg';

      if (isImageRequest) {
        botDiv.innerHTML = `Yeh lijiye aapki kalpana ke anusaar tasveer:`;
        chatMessages.appendChild(botDiv);

        const imgLoading = document.createElement('div');
        imgLoading.className = 'bot-msg';
        imgLoading.innerHTML = `🖼️ AI tasveer bana raha hai...`;
        chatMessages.appendChild(imgLoading);

        const encodedPrompt = encodeURIComponent(text + ", highly detailed, cinematic, 4k resolution");
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=512&height=512&nologo=true`;

        const img = document.createElement('img');
        img.className = 'chat-generated-img';
        img.src = imageUrl;

        img.onload = () => {
          imgLoading.remove();
          chatMessages.appendChild(img);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          speakHindi("Tasveer taiyar hai!");
        };

        img.onerror = () => {
          imgLoading.textContent = "Tasveer load karne me samasya aayi. Kripya punah prayas karein.";
          chatMessages.scrollTop = chatMessages.scrollHeight;
        };

      } else {
        let reply = "Maine aapki baat samajh li hai. Nilesh Status King ke liye yeh bahut badhiya vichar hai!";
        if (lowerText.includes("kaise ho") || lowerText.includes("कैसे हो")) {
          reply = "Main ekdum badhiya hoon Nilesh! Bataiye aaj kya naya project shuru kiya jaaye?";
        } else if (lowerText.includes("status") || lowerText.includes("स्टेटस")) {
          reply = "Aapke YouTube channel ke liye naye viral status ideas aur scripts taiyar hain.";
        }

        botDiv.textContent = reply;
        chatMessages.appendChild(botDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        speakHindi(reply);
      }
    }, 600);
  };

  document.getElementById('send-chat-btn').onclick = handleSendMessage;
  chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  // Logout Logic
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      window.speechSynthesis.cancel();
      // 🟢 Logout par saved data hata denge
      localStorage.removeItem('agc_logged_in');
      localStorage.removeItem('channel_data');
      window.location.reload();
    };
  }
}

// 🟢 Page load hone par check karein ki user pehle se logged in hai ya nahi
document.addEventListener('DOMContentLoaded', () => {
  initAuth();

  const isLoggedIn = localStorage.getItem('agc_logged_in');
  if (isLoggedIn === 'true') {
    const savedChannelData = localStorage.getItem('channel_data');
    if (savedChannelData) {
      const channel = JSON.parse(savedChannelData);
      updateUI(channel);
    }
  }
});
