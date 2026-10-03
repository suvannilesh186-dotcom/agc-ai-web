// JavaScript.js
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

// स्क्रीन पर एरर दिखाने के लिए एक फंक्शन
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

function updateUI(channel) {
  // 1. साइन-इन बटन छिपाएं
  document.getElementById('auth-section').style.display = 'none';
  
  // 2. वीडियो कंटेनर को छिपाएं (ताकि लॉगिन के बाद वीडियो बंद हो जाए)
  const videoContainer = document.querySelector('.video-container');
  if (videoContainer) {
    videoContainer.style.display = 'none';
  }

  // 3. ऊपर की हेडिंग ("AGC.AI Welcome") को छिपाएं
  const headerTitle = document.querySelector('.header-title');
  if (headerTitle) {
    headerTitle.style.display = 'none';
  }

  // 4. यूजर की चैनल प्रोफाइल और नाम स्क्रीन पर दिखाएं
  const profileSection = document.getElementById('channel-profile');
  document.getElementById('channel-name').textContent = channel.title;
  document.getElementById('channel-email').textContent = channel.customUrl || '';
  
  profileSection.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', initAuth);
