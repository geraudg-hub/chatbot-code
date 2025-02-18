document.addEventListener('DOMContentLoaded', function() {
  const API_START_CHAT = "/start_chat";
  const API_CHAT = "/chat";

  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-container';

  chatbotContainer.innerHTML = `
    <div id="chatbot-header">
      <img src="./image/bunky.png" alt="Bunky" id="chatbot-icon">
      Chatbot
      <button id="chatbot-close">−</button>
    </div>
    <div id="chatbot-body"></div>
    <div id="chatbot-footer">
      <input type="text" id="chatbot-input" placeholder="Enter your message...">
      <button id="chatbot-send">Envoyer</button>
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
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0b5577 0%, #2eac68 100%);
    }

    #chatbot-container.minimized #chatbot-body,
    #chatbot-container.minimized #chatbot-footer {
      display: none;
    }

    #chatbot-header {
      background: linear-gradient(135deg, #0b5577 0%, #2eac68 100%);
      color: white;
      padding: 15px;
      text-align: center;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
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
      width: 24px;
      height: 24px;
      margin-right: 10px;
      filter: brightness(0) invert(1);
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
      background-color: #2eac68;
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
      background: #2eac68;
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

    .message.user::after {
      content: '';
      position: absolute;
      right: -8px;
      top: 0;
      border-width: 8px 0 8px 8px;
      border-style: solid;
      border-color: transparent transparent transparent #2eac68;
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

  // Fonction d'envoi de message
  async function sendMessage(message) {
    isWaitingForResponse = true;
    displayMessage(message, 'user');
    
    sendBtn.disabled = true;
    const originalMessage = input.value;
    input.value = '';
    input.placeholder = "Waiting for answer...";

    try {
      let threadId = localStorage.getItem('thread_id');

      if (!threadId) {
        const threadResponse = await fetch(API_START_CHAT, { method: 'POST' });
        const threadData = await threadResponse.json();
        
        if (!threadResponse.ok || !threadData.thread_id) {
          throw new Error('Impossible de créer un thread');
        }
        threadId = threadData.thread_id;
        localStorage.setItem('thread_id', threadId);
      }

      const response = await fetch(API_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message, thread_id: threadId })
      });

      const data = await response.json();
      if (response.ok) {
        displayMessage(data.response, 'bot');
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur :', error.message);
      displayMessage('Erreur : Impossible de récupérer une réponse du bot.', 'bot');
      input.value = originalMessage;
    } finally {
      isWaitingForResponse = false;
      sendBtn.disabled = false;
      input.placeholder = "Enter your message...";
      input.focus();
    }
  }

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
});
