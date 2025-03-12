document.addEventListener('DOMContentLoaded', function() {

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';

  const dompurifyScript = document.createElement('script');
  dompurifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';
  document.head.appendChild(dompurifyScript);
    

  script.onload = () => {
    marked.use({ breaks: true, gfm: true, pedantic: false });

    const API_START_CHAT = "/start_chat";
    const API_CHAT = "/chat";
    const API_SESSION_STATUS = "/session_status";
    
    let sessionTimer;
    let charTimer;
    const WARNING_TIME = 300;

    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';

    chatbotContainer.innerHTML = `
      <div id="chatbot-header">
        <span id="chatbot-title">Bunker bot</span>
        <button id="chatbot-close">−</button>
      </div>
      <div id="chatbot-body"></div>
      <div id="chatbot-footer">
        <input type="text" id="chatbot-input" placeholder="Enter your message...">
        <button id="chatbot-send">Send</button>
      </div>
    `;

    document.body.appendChild(chatbotContainer);
    chatbotContainer.classList.add('minimized');

    const style = document.createElement('style');
    style.innerHTML = `
      #chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 550px;
        border: 1px solid #0b557755;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(11, 85, 119, 0.15);
        overflow: hidden;
        background: #fff;
        display: flex;
        flex-direction: column;
        font-family: 'Arial', sans-serif;
        z-index: 1000;
        transition: all 0.3s ease;
      }

      #chatbot-container.minimized {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        padding: 8px;
      }

      #chatbot-container.minimized #chatbot-header {
        padding: 0;
        background: transparent;
        justify-content: center;
      }

      #chatbot-container.minimized #chatbot-body,
      #chatbot-container.minimized #chatbot-footer {
        display: none;
      }

      #chatbot-header {
      background: #fff;
      color: #0b5577;
      padding: 15px 15px;
      text-align: center;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      min-height: 40px;
      width: 100%;
    }

      #chatbot-title {
        font-size: 18px;
      }

      #chatbot-icon {
        width: 40px;
        height: 40px;
        margin-right: 10px;
        flex-shrink: 0;
      }

      #chatbot-close {
        position: absolute;
        top: 20px;
        right: 40px;
        background: #0b5577;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 2px 4px rgba(0,0,0,0.3);
        font-size: 16px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      #chatbot-close:hover {
        transform: scale(1.1);
        box-shadow: 0px 4px 8px rgba(0,0,0,0.4);
      }

      #chatbot-close:hover {
        transform: scale(1.2);
      }

      #chatbot-body {
        flex: 1;
        padding: 30px;
        overflow-y: auto;
        overflow-x: hidden !important;
        word-wrap: break-word !important;
        background: #f8fbfa;
        scrollbar-width: thin;
        scrollbar-color: #0b5577 #f8fbfa;
      }

      #chatbot-footer {
        display: flex;
        border-top: 2px solid #0b557710;
        padding: 15px;
        background: #f8fbfa;
      }

      #chatbot-input {
        flex: 1;
        border: 2px solid #0b557720;
        border-radius: 25px;
        padding: 12px 20px;
        font-size: 14px;
        background: #f8fbfa;
      }

      #chatbot-send {
        background-color: #0b5577;
        color: white;
        border: none;
        padding: 12px 20px;
        margin-left: 10px;
        border-radius: 25px;
        cursor: pointer;
      }

      .message {
        margin-bottom: 35px;
        padding: 12px 18px;
        border-radius: 15px;
        max-width: 70%;
        position: relative;
        line-height: 1.4;
        display: flex;
        align-items: center;
      }

      .message.user {
        background: #d3d3d3;
        color: black;
        float: right;
        border-bottom-right-radius: 5px;
        padding-right: 60px;
        margin-right: 60px;
      }

      .message.user::before {
        content: "You";
        position: absolute;
        top: -25px;
        right: 10px;
        font-size: 0.8em;
        color: #666;
        font-weight: 500;
        width: 100px;
        text-align: right;
      }

      .message.user::after {
        content: '';
        background: url('/static/images/user.png') center/cover;
        width: 45px;
        height: 45px;
        position: absolute;
        right: -70px;
        top: 0;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }

      .message.bot {
        background: #0b5577;
        margin-left: 60px;
        color: white;
        float: left;
        border-bottom-left-radius: 5px;
        max-width: 70%;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
        display: block !important;
      }

      .message.bot::before {
        content: '';
        background: url('/static/images/bunky.png') center/cover;
        width: 45px;
        height: 45px;
        position: absolute;
        left: -70px;
        top: 0;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }

      .message.bot::after {
        content: "Bunker bot";
        position: absolute;
        top: -25px;
        left: 10px;
        font-size: 0.8em;
        color: #666;
        font-weight: 500;
        width: 140px;
      }


      #chatbot-body {
        padding: 15px 10px 15px 20px
        overflow-x: hidden
        word-wrap: break-word;
        white-space: normal;
      }

      .message.bot .bot-info {
        display: flex;
        align-items: center;
      }

      .message.bot .bot-info img {
        width: 30px;
        height: 30px;
        margin-right: 8px;
      }

      .message.bot .bot-info span {
        font-size: 16px;
        color: #0b5577;
      }

      #chatbot-container.minimized {
        width: 80px; /* Taille ajustée */
        height: 80px;
        border-radius: 50%;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white; /* Fond blanc ou transparent */
      }

      #chatbot-container.minimized #chatbot-header,
      #chatbot-container.minimized #chatbot-body,
      #chatbot-container.minimized #chatbot-footer {
        display: none;
      }

      #chatbot-container.minimized::before {
        content: "";
        background: url('/static/images/bunky.png') center/cover;
        width: 70px;  /* Ajuste la taille de l'image */
        height: 70px;
        border-radius: 50%;
      }

      .message.bot .bot-content {
          word-wrap: break-word;
          line-height: 1.6;
      }

      .message.bot .bot-content p {
          margin: 0.8em 0;
      }

      .message.bot .bot-content code {
          background-color: rgba(255, 255, 255, 0.15);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9em;
      }

      .message.bot .bot-content pre {
          background-color: rgba(255, 255, 255, 0.1);
          overflow-x: auto;
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
          margin: 1em 0;
      }

      .message.bot .bot-content pre code {
          background-color: transparent;
          padding: 0;
          font-size: 0.9em;
      }

      .message.bot .bot-content ul,
      .message.bot .bot-content ol {
          margin: 0.8em 0;
          padding-left: 1.5em;
      }

      .message.bot .bot-content li {
          margin: 0.4em 0;
      }

      .message.bot .bot-content blockquote {
          border-left: 3px solid rgba(255, 255, 255, 0.4);
          margin: 1em 0;
          padding-left: 1em;
          color: rgba(255, 255, 255, 0.8);
      }
    `;
    document.head.appendChild(style);

    function minimizeChatbot() {
      const chatbot = document.getElementById("chatbot");
      chatbot.classList.add("chatbot-minimized");
    }
    
    function maximizeChatbot() {
      const chatbot = document.getElementById("chatbot");
      chatbot.classList.remove("chatbot-minimized");
    }
    

    // Messages with images
    function addBotMessage(messageText) {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message', 'bot');

      messageElement.innerHTML = `
        <div class="bot-info">
          <img src="/static/images/bunky.png" alt="Bunky" class="bot-icon">
          <span>Bunker Bot</span>
        </div>
        <div class="bot-message">${DOMPurify.sanitize(marked.parse(messageText))}</div>
      `;

      document.querySelector('#chatbot-body').appendChild(messageElement);
    }

    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const chatBody = document.getElementById('chatbot-body');
    const closeBtn = document.getElementById('chatbot-close');
    let isWaitingForResponse = false;

    // Messages display
    function displayMessage(content, sender) {

        const cleanedContent = content.replace(/【.*?】/g, ''); 

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        
        if(sender === 'bot') {
            messageDiv.innerHTML = `
                <div class="bot-content">
                ${DOMPurify.sanitize(marked.parse(cleanedContent))}
                </div>
            `;
        } else {
            messageDiv.textContent = content;
        }
        
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function disableChatInput(message = "Session expired.") {
      input.disabled = true;
      sendBtn.disabled = true;
      input.placeholder = message;
      input.style.cursor = "not-allowed";
      sendBtn.style.backgroundColor = "#cccccc";
  }
    
    // Messages sending
    async function checkSessionLimits(threadId) {
      try {
          const response = await fetch(`${API_SESSION_STATUS}?thread_id=${threadId}`);
          if (!response.ok) throw new Error('Erreur de statut');
          
          const { remaining_time, remaining_chars, expired } = await response.json();
          
          if (expired) {
              disableChatInput("Session expirée");
              localStorage.removeItem('thread_id');
              displayMessage("Session expired.", 'bot');
              return;
          }

      } catch (error) {
          console.error('Erreur vérification session:', error);
          displayMessage('Impossible de vérifier le statut de la session', 'bot');
      }
  }

  async function sendMessage(message) {
      isWaitingForResponse = true;
      displayMessage(message, 'user');
      
      sendBtn.disabled = true;
      input.value = '';
      input.placeholder = "Waiting for answer...";

      try {
          let threadId = localStorage.getItem('thread_id');
          let isNewThread = false;

          // Session checking
          if (threadId) {
              const statusResponse = await fetch(`${API_SESSION_STATUS}?thread_id=${threadId}`);
              if (!statusResponse.ok) throw new Error('Erreur vérification session');
              
              const { remaining_time, remaining_chars } = await statusResponse.json();
              
              if (remaining_time <= 0 || remaining_chars <= 0) {
                  disableChatInput("Session expirée - Veuillez recharger");
                  localStorage.removeItem('thread_id');
                  displayMessage("Session expired.", 'bot');
                  return;
              }
          }

          if (!threadId) {
              const threadResponse = await fetch(API_START_CHAT, { method: 'POST' });
              const threadData = await threadResponse.json();
              threadId = threadData.thread_id;
              localStorage.setItem('thread_id', threadId);
              isNewThread = true;
          }

          const response = await fetch(API_CHAT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, thread_id: threadId })
          });

          // Error handler
          if (!response.ok) {
              const data = await response.json();
              
              // Too long
              if (response.status === 400 && data.type === 'message_length') {
                  displayMessage(data.error, 'bot');
                  return; 
              }
              // Global other errors
              if (response.status === 403) { 
                  disableChatInput(data.error);
                  localStorage.removeItem('thread_id');
                  displayMessage(data.error, 'bot');
                  return;
              }
              throw new Error(data.error || 'Erreur inconnue');
          }

          const data = await response.json();
          displayMessage(data.response, 'bot');
          if (!isNewThread) checkSessionLimits(threadId);

      } catch (error) {
          if (error.message.includes('expirée') || error.message.includes('dépassée')) {
              disableChatInput(error.message);
              localStorage.removeItem('thread_id');
          }
          displayMessage(`Erreur : ${error.message}`, 'bot');
      } finally {
          isWaitingForResponse = false;
          sendBtn.disabled = false;
          input.placeholder = "Enter your message...";
      }
  }

  async function loadHistory() {
    const threadId = localStorage.getItem('thread_id');
    if (!threadId) return;

    try {
        const statusResponse = await fetch(`${API_SESSION_STATUS}?thread_id=${threadId}`);
        if (!statusResponse.ok) throw new Error('Session unvalide');
        
        const { remaining_time, remaining_chars } = await statusResponse.json();
        
        if (remaining_time <= 0 || remaining_chars <= 0) {
            disableChatInput("Session expired");
            localStorage.removeItem('thread_id');
            return;
        }

        const response = await fetch(`/admin/thread/${threadId}/messages`);
        if (!response.ok) return;
        
        const messages = await response.json();
        messages.forEach(msg => displayMessage(msg.content, msg.origin));
        
        checkSessionLimits(threadId);
    } catch (error) {
        disableChatInput("Session not valide");
        localStorage.removeItem('thread_id');
    }
  }

    loadHistory();

    // Event handler
    sendBtn.addEventListener('click', () => {
      if (isWaitingForResponse) return;
      const userMessage = input.value.trim();
      if (userMessage) {
        sendMessage(userMessage);
      }
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (isWaitingForResponse) return;
        const userMessage = input.value.trim();
        if (userMessage) {
          sendMessage(userMessage);
        }
      }
    });

    // Minimize handler
    closeBtn.addEventListener('click', (event) => {
      chatbotContainer.classList.toggle('minimized');
      event.stopPropagation();
    });

    chatbotContainer.addEventListener('click', (event) => {
      if (chatbotContainer.classList.contains('minimized') && event.target !== closeBtn) {
        chatbotContainer.classList.remove('minimized');
      }
    });

    // Welcome message
    displayMessage(
      'Hello, I am **Bunky**, your personal assistant for BunkerWeb!', 
      'bot'
    );
      chatbotContainer.classList.add('minimized');

      function disableChatInput(message = "Session expired.") {
        input.disabled = true;
        sendBtn.disabled = true;
        input.placeholder = message;
        input.style.cursor = "not-allowed";
        sendBtn.style.backgroundColor = "#cccccc";
    }
  }

  document.head.appendChild(script);
});
