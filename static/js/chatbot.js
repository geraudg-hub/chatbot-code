document.addEventListener('DOMContentLoaded', function() {
  const API_START_CHAT = "/start_chat";
  const API_CHAT = "/chat";
  const API_SESSION_STATUS = "/session_status";
  
  let sessionTimer;
  let charTimer;
  const WARNING_TIME = 300; // 5 minutes en secondes

  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-container';

  chatbotContainer.innerHTML = `
    <div id="chatbot-header">
      <img src="/static/images/bunky.png" alt="Bunky" id="chatbot-icon" class="chatbot-minimized-icon">
      <span id="chatbot-title">Bunky Chatbot</span>
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
      background: linear-gradient(135deg, #0b5577 0%, #2eac68 100%);
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

    #chatbot-container.minimized #chatbot-icon {
      width: 80px;
      height: 80px;
      margin: 0;
      filter: none;
      transition: all 0.3s ease;
    }

    #chatbot-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #chatbot-container.minimized:hover #chatbot-icon {
      transform: scale(1.1);
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    #chatbot-header {
      background: linear-gradient(135deg, #0b5577 0%, #2eac68 100%);
      color: white;
      padding: 25px 15px 40px;
      text-align: center;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      min-height: 50px
    }

    #chatbot-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #0b5577 0%, #2eac68 100%);
    }

    #chatbot-icon {
      width: 40px;
      height: 40px;
      margin-right: 10px;
      flex-shrink: 0;
    }

    #chatbot-close {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      transition: transform 0.2s;
    }

    #chatbot-close:hover {
      transform: scale(1.2);
    }

    #chatbot-body {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      background: #f8fbfa;
      scrollbar-width: thin;
      scrollbar-color: #0b5577 #f8fbfa;
    }

    #chatbot-body::-webkit-scrollbar {
      width: 6px;
    }

    #chatbot-body::-webkit-scrollbar-track {
      background: #f8fbfa;
    }

    #chatbot-body::-webkit-scrollbar-thumb {
      background: #0b5577;
      border-radius: 10px;
    }

    #chatbot-footer {
      display: flex;
      border-top: 2px solid #0b557710;
      padding: 15px;
      background: #ffffff;
    }

    #chatbot-input {
      flex: 1;
      border: 2px solid #0b557720;
      border-radius: 25px;
      padding: 12px 20px;
      font-size: 14px;
      transition: all 0.3s;
      background: #f8fbfa;
    }

    #chatbot-input:focus {
      outline: none;
      border-color: #2eac68;
      box-shadow: 0 0 8px #2eac6830;
    }

    #chatbot-send {
      background-color: #0b5577;
      color: white;
      border: none;
      padding: 12px 20px;
      margin-left: 10px;
      border-radius: 25px;
      cursor: pointer;
      transition: all 0.3s;
      font-weight: 600;
    }

    #chatbot-send:hover {
      background-color: #248c51;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(46, 172, 104, 0.3);
    }

    .message {
      margin-bottom: 15px;
      padding: 12px 18px;
      border-radius: 15px;
      max-width: 80%;
      clear: both;
      position: relative;
      line-height: 1.4;
    }

    .message.user {
      background: #0b5577;
      color: white;
      float: right;
      border-bottom-right-radius: 5px;
    }

    .message.bot {
      background: #f0f7f4;
      color: #0b5577;
      float: left;
      border-bottom-left-radius: 5px;
    }

    .message.bot::before {
      content: '';
      position: absolute;
      left: -8px;
      top: 0;
      border-width: 8px 8px 8px 0;
      border-style: solid;
      border-color: transparent #f0f7f4 transparent transparent;
    }

  `;
  document.head.appendChild(style);

  // Sélection des éléments
  const input = document.getElementById('chatbot-input');
  const sendBtn = document.getElementById('chatbot-send');
  const chatBody = document.getElementById('chatbot-body');
  const closeBtn = document.getElementById('chatbot-close');
  let isWaitingForResponse = false;

  // Fonction d'affichage des messages
  function displayMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = content;
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function disableChatInput(message = "Session terminée") {
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = message;
    input.style.cursor = "not-allowed";
    sendBtn.style.backgroundColor = "#cccccc";
}
  
  // Fonction d'envoi de message
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

        // Vérification initiale de la session
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

        // Gestion des réponses d'erreur
        if (!response.ok) {
            const data = await response.json();
            if (response.status === 403) { // Session expirée
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
      if (!statusResponse.ok) throw new Error('Session invalide');
      
      const { remaining_time, remaining_chars } = await statusResponse.json();
      
      if (remaining_time <= 0 || remaining_chars <= 0) {
          disableChatInput("Session expirée");
          localStorage.removeItem('thread_id');
          return;
      }

      const response = await fetch(`/admin/thread/${threadId}/messages`);
      if (!response.ok) return;
      
      const messages = await response.json();
      messages.forEach(msg => displayMessage(msg.content, msg.origin));
      
      checkSessionLimits(threadId);
  } catch (error) {
      disableChatInput("Session invalide");
      localStorage.removeItem('thread_id');
  }
}

  loadHistory();

  // Gestionnaires d'événements
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

  // Gestion de la minimisation
  closeBtn.addEventListener('click', (event) => {
    chatbotContainer.classList.toggle('minimized');
    event.stopPropagation();
  });

  chatbotContainer.addEventListener('click', (event) => {
    if (chatbotContainer.classList.contains('minimized') && event.target !== closeBtn) {
      chatbotContainer.classList.remove('minimized');
    }
  });

  // Message de bienvenue
  displayMessage('Hello, I am Bunky, your personal assistant for BunkerWeb ! How can i help you today?', 'bot');
  chatbotContainer.classList.add('minimized');

  function disableChatInput(message = "Session terminée") {
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = message;
    input.style.cursor = "not-allowed";
    sendBtn.style.backgroundColor = "#cccccc";
}
});
