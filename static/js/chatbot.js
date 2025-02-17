document.addEventListener('DOMContentLoaded', function() { 
    // Définir les constantes API (ajustez l'URL si nécessaire)
    const API_START_CHAT = "/start_chat";
    const API_CHAT = "/chat";



    
    // Création du conteneur principal du chatbot
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';
  
    chatbotContainer.innerHTML = `
      <div id="chatbot-header">
        <img src="https://cdn-icons-png.flaticon.com/512/2950/2950728.png" alt="Chatbot" id="chatbot-icon">
        Chatbot
        <button id="chatbot-close">−</button>
      </div>
      <div id="chatbot-body"></div>
      <div id="chatbot-footer">
        <input type="text" id="chatbot-input" placeholder="Tapez votre message...">
        <button id="chatbot-send">Envoyer</button>
      </div>
    `;
  
    document.body.appendChild(chatbotContainer);
  
    // Ajout du style CSS directement via JavaScript
    const style = document.createElement('style');
    style.innerHTML = `
      /* Styles généraux */
      #chatbot-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 380px;
        height: 550px;
        border: 1px solid #ccc;
        border-radius: 12px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
        overflow: hidden;
        background: #fff;
        display: flex;
        flex-direction: column;
        font-family: 'Arial', sans-serif;
        z-index: 1000;
      }
  
      /* En-tête */
      #chatbot-header {
        background-color: #007bff;
        color: white;
        padding: 15px;
        text-align: center;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
  
      #chatbot-icon {
        width: 24px;
        height: 24px;
        margin-right: 10px;
      }
  
      #chatbot-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      }
  
      /* Corps */
      #chatbot-body {
        flex: 1;
        padding: 10px;
        overflow-y: auto;
        background-color: #f8f9fa;
        scrollbar-width: thin;
        scrollbar-color: #007bff #f8f9fa;
      }
  
      #chatbot-body::-webkit-scrollbar {
        width: 6px;
      }
  
      #chatbot-body::-webkit-scrollbar-track {
        background: #f8f9fa;
      }
  
      #chatbot-body::-webkit-scrollbar-thumb {
        background: #007bff;
        border-radius: 10px;
      }
  
      /* Pied de page */
      #chatbot-footer {
        display: flex;
        border-top: 1px solid #ccc;
        padding: 10px;
        background: #eee;
      }
  
      #chatbot-input {
        flex: 1;
        border: 1px solid #ccc;
        border-radius: 20px;
        padding: 10px;
        font-size: 14px;
      }
  
      #chatbot-send {
        background-color: #007bff;
        color: white;
        border: none;
        padding: 10px 15px;
        margin-left: 10px;
        border-radius: 20px;
        cursor: pointer;
        transition: background 0.3s;
      }
  
      #chatbot-send:hover {
        background-color: #0056b3;
      }
  
      /* Messages */
      .message {
        margin-bottom: 10px;
        padding: 8px 12px;
        border-radius: 12px;
        max-width: 80%;
        clear: both;
      }
  
      .message.user {
        background-color: #007bff;
        color: white;
        float: right;
        text-align: right;
      }
  
      .message.bot {
        background-color: #e1e1e1;
        float: left;
        text-align: left;
      }
  
      /* Chat minimisé */
      #chatbot-container.minimized {
        height: 50px;
      }
  
      #chatbot-container.minimized #chatbot-body,
      #chatbot-container.minimized #chatbot-footer {
        display: none;
      }
    `;
  
    document.head.appendChild(style);
  
    // Sélection des éléments
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const chatBody = document.getElementById('chatbot-body');
  
    // Fonction d'affichage des messages
    function displayMessage(content, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('message', sender);
      messageDiv.textContent = content;
      chatBody.appendChild(messageDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  
    // Fonction d'envoi de message qui intègre la logique du chatbot beta
    async function sendMessage(message) {
      displayMessage(message, 'user');
  
      input.disabled = true;
      sendBtn.disabled = true;
      input.value = '';
  
      let threadId = localStorage.getItem('thread_id');
  
      // Si aucun thread_id, créer un nouveau thread via l'API
      if (!threadId) {
        try {
          const threadResponse = await fetch(API_START_CHAT, { method: 'POST' });
          const threadData = await threadResponse.json();
          if (threadResponse.ok && threadData.thread_id) {
            threadId = threadData.thread_id;
            localStorage.setItem('thread_id', threadId);
          } else {
            throw new Error('Impossible de créer un thread');
          }
        } catch (error) {
          console.error('Erreur :', error.message);
          displayMessage('Erreur : Impossible de démarrer une conversation.', 'bot');
          input.disabled = false;
          sendBtn.disabled = false;
          return;
        }
      }
  
      // Envoi du message à l'API /chat
      try {
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
      } finally {
        input.disabled = false;
        sendBtn.disabled = false;
      }
    }
  
    // Événements pour envoyer le message via le bouton et la touche Enter
    sendBtn.addEventListener('click', () => {
      const userMessage = input.value.trim();
      if (userMessage) {
        sendMessage(userMessage);
      }
    });
  
    input.addEventListener('keypress', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const userMessage = input.value.trim();
        if (userMessage) {
          sendMessage(userMessage);
        }
        event.preventDefault();
      }
    });
  
    // Gestion de la minimisation du chatbot
    const closeBtn = document.getElementById('chatbot-close');
    closeBtn.addEventListener('click', () => {
      chatbotContainer.classList.toggle('minimized');
    });
});
