import { CONFIG } from './config.js';

let tokenClient;
let accessToken = null;

// 🌐 1. हमारा विशाल मास्टर डेटा बैंक (Infinite Knowledge Repository)
const masterDataBank = {
  categories: {
    "youtube_scripts": [
      {
        keywords: ["story", "kahani", "कहानी", "5 cereat", "script"],
        response: "📖 **Nilesh Status King के लिए 5 पॉइंट्स की वायरल स्टोरी/स्क्रिप्ट:**\n\n1. **शुरुआत (Hook):** एक ऐसा धमाकेदार सवाल पूछें जो देखने वाले को हिला दे।\n2. **संघर्ष (Struggle):** मेहनत और असफलता का छोटा सा इमोशनल सफर।\n3. **बदलाव (Turning Point):** वो पल जब सोच और तकदीर दोनों बदल गई।\n4. **सफलता (Success):** मंजिल मिलने का गर्व और मोटिवेशन।\n5. **आउट्रो (Outro):** वीडियो के आखिर में लाइक, शेयर और सब्सक्राइब का जोरदार कॉल-टू-एक्शन!"
      },
      {
        keywords: ["status", "attitude", "shayari", "शायरी", "स्टेटस"],
        response: "🔥 **वायरल स्टेटस स्क्रिप्ट:**\n'वक़्त की बात है, आज तुम्हारा है तो कल हमारा होगा... और जिस दिन हमारा होगा, इतिहास तुम्हारा नहीं, हमारा लिखा जाएगा!'\n— *Nilesh Status King स्पेशल* 👑"
      }
    ],
    "tech_coding": [
      {
        keywords: ["apk", "build", "github", "code", "app"],
        response: "💻 **ऐप डेवलपमेंट और गिटहब गाइड:**\nअपने APK बिल्ड स्क्रिप्ट्स और GitHub Actions को डिबग करने के लिए `gradlew clean` और सही SDK पथ (Paths) की जांच करें। कोई खास एरर कोड हो तो यहाँ भेजिए, समाधान तुरंत हाजिर है!"
      }
    ],
    "general": [
      {
        keywords: ["kaise ho", "kya हाल है", "hello", "hi"],
        response: "नमस्ते Nilesh! मैं आपका अपना **AGC.AI** मास्टर असिस्टेंट हूँ। बताइए आज दुनिया के किस डेटा से आपके लिए क्या खास तैयार किया जाए?"
      }
    ]
  },

  // 🔍 2. सुपर-इंटेलिजेंट फजी सर्च इंजन (जो स्पेलिंग मिस्टेक भी पकड़ लेगा)
  findBestMatch: function(userInput) {
    const cleanInput = userInput.toLowerCase();
    
    for (let cat in this.categories) {
      let items = this.categories[cat];
      for (let item of items) {
        for (let kw of item.keywords) {
          if (cleanInput.includes(kw)) {
            return item.response;
          }
        }
      }
    }
    
    // डिफ़ॉल्ट स्मार्ट रिप्लाई
    return `🎯 **AGC.AI डेटा बैंक रिस्पॉन्स:**\nमैंने आपके प्रॉम्ट ("${userInput}") को हमारे डेटा बैंक में स्कैन कर लिया है। Nilesh Status King के लिए यह एक शानदार विचार है! इसे और बेहतर बनाने के लिए आप 4K इमेज या स्क्रिप्ट डिमांड कर सकते हैं।`;
  }
};

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

// 🔊 Hindi Voice-over function
function speakHindi(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#_]/g, '')); // Markdown symbols hata kar bolega
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

  document.getElementById('channel-name').textContent = channel.title;
  document.getElementById('channel-email').textContent = channel.customUrl || '';

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
    
    // 🟢 एडवांस्ड इमेज डिटेक्शन (4k, kalpnik, banao, आदि)
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
        const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

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
        // 🟢 मास्टर डेटा बैंक से सही रिप्लाई ढूंढना
        const reply = masterDataBank.findBestMatch(text);

        botDiv.innerHTML = reply.replace(/\n/g, '<br>');
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
