document.addEventListener('DOMContentLoaded', function() {

  const dompurifyScript = document.createElement('script');
  dompurifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js';

  dompurifyScript.onload = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    
    script.onload = () => {
      marked.use({ breaks: true, gfm: true, pedantic: false });

      const API_START_CHAT = "/start_chat";
      const API_CHAT = "/chat";
      const API_SESSION_STATUS = "/session_status";
    

      const chatbotContainer = document.createElement('div');
      chatbotContainer.id = 'chatbot-container';

      chatbotContainer.innerHTML = `
        <div id="chatbot-header">
          <span id="chatbot-title">BunkerBot</span>
          <div>
            <button id="chatbot-expand">+</button>
            <button id="chatbot-close">−</button>
          </div>
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

        #chatbot-expand {
          position: absolute;
          top: 20px;
          right: 80px;
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
          transition: all 0.3s ease;
        }

        #chatbot-close {
          right: 40px;
        }

        #chatbot-container.enlarged .message.bot {
          float: none;
          margin-left: 45px;
          max-width: 90%;
          width: auto;
        }

        #chatbot-container.enlarged .message.user {
          float: none;
          margin-right: 45px;
          max-width: 90%;
          width: auto;
          margin-left: auto;
          padding-right: 20px;
        }

        #chatbot-container.enlarged {
          width: 600px;
          height: 800px;
          transition: all 0.3s ease;
        }

        #chatbot-container:not(.minimized):not(.enlarged) {
          width: 380px;
          height: 550px;
        }
  
        #chatbot-container.minimized {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          transform-origin: center;
        }

        #chatbot-container.minimized:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 25px rgba(11, 85, 119, 0.25);
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
          padding: 6px 18px;
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
          padding-right: 20px;
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
          margin-left: 45px;
          color: white;
          float: left;
          border-bottom-left-radius: 5px;
          max-width: 100%;
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
          content: "BunkerBot";
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
          width: 80px; 
          height: 80px;
          border-radius: 50%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white; 
        }

        #chatbot-container.minimized #chatbot-header,
        #chatbot-container.minimized #chatbot-body,
        #chatbot-container.minimized #chatbot-footer {
          display: none;
        }

        #chatbot-container.minimized::before {
          content: "";
          background: url('/static/images/bunky.png') center/cover;
          width: 70px; 
          height: 70px;
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        #chatbot-container.minimized:hover::before {
          transform: scale(1.1);
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
            position: relative;
            padding-top: 2.5em; 
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


        .message.bot .bot-content pre {
            position: relative;
            padding-top: 2.5em;
        }

        .copy-code-btn {
            position: absolute;
            top: 4px;
            right: 8px;
            width: 32px;
            height: 32px;
            background: white url("/static/images/copy.png") no-repeat center;
            background-size: 18px;
            border: 1px solid #0b5577;
            border-radius: 4px;
            cursor: pointer;
            min-width: 32px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: transparent;
        }

        .copy-code-btn:hover {
            background-color: #2eac68;
            border-color: #0b5577;
            background-image: url("/static/images/copy.png");
        }

        .copy-code-btn.copied {
            background-image: none !important;
            min-width: 80px;
            color: #0b5577;
            background-color: rgba(255, 255, 255, 0.9);
       }

        .copy-code-btn.copied::after {
              content: "✓ Copied!";
              position: static;
              transform: none;
              background: transparent;
              color: black;
              padding: 0;
              box-shadow: none;
              font-weight: bold;
          }

        .typing-indicator {
          display: inline-flex;
          align-items: center;
        }

        .dot-animation {
          display: inline-block;
          margin-left: 4px;
          animation: dot-bounce 1.4s infinite ease-in-out;
        }

        .dot-animation:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot-animation:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { 
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-5px);
            opacity: 1;
          }
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
      
      document.getElementById('chatbot-expand').addEventListener('click', (event) => {
        chatbotContainer.classList.remove('minimized');
        chatbotContainer.classList.add('enlarged');
        event.stopPropagation();
      });
      

      // Messages with images
      function addBotMessage(messageText) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot');

        messageElement.innerHTML = `
          <div class="bot-info">
            <img src="/static/images/bunky.png" alt="Bunky" class="bot-icon">
            <span>BunkerBot</span>
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
    
        if (sender === 'bot') {
            const preElements = messageDiv.querySelectorAll('pre');
            preElements.forEach(pre => {
                const copyButton = document.createElement('button');
                copyButton.className = 'copy-code-btn';
                copyButton.setAttribute('aria-label', 'Copy to clipboard');
                copyButton.setAttribute('data-clipboard-target', `#${pre.id} > code`);

                pre.appendChild(copyButton);
    
                copyButton.addEventListener('click', (e) => {
                  const codeElement = pre.querySelector('code');
                  if (!codeElement) return;
              
                  const code = codeElement.innerText;
                  const target = e.currentTarget;
              
                  navigator.clipboard.writeText(code)
                      .then(() => {
                          if (document.body.contains(target)) {
                              target.classList.add('copied');
                              setTimeout(() => {
                                  if (document.body.contains(target)) {
                                      target.classList.remove('copied');
                                  }
                              }, 2000);
                          }
                      })
                      .catch(err => {
                          console.error('Erreur de copie :', err);
                          target.classList.add('copied-error');
                          setTimeout(() => target.classList.remove('copied-error'), 2000);
                      });
              });
            });
        }
    }

    function showTypingIndicator() {
      const typingDiv = document.createElement('div');
      typingDiv.classList.add('message', 'bot', 'typing-indicator');
      typingDiv.innerHTML = `
          <div class="bot-content">
              <span class="dot-animation">•</span>
              <span class="dot-animation">•</span>
              <span class="dot-animation">•</span>
          </div>
      `;
      chatBody.appendChild(typingDiv);
      chatBody.scrollTop = chatBody.scrollHeight;
      return typingDiv;
    }

    function removeTypingIndicator(indicator) {
      if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
      }
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
            
            // Checking content-type CDF / PLF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await response.text();
                throw new Error('Internal server error');
            }
    
            if (!response.ok) throw new Error('Status error');
            
            const { remaining_time, remaining_chars, expired } = await response.json();
            
            if (expired) {
                disableChatInput("Session expired");
                localStorage.removeItem('thread_id');
                displayMessage("Session expired.", 'bot');
            }
    
        } catch (error) {
            if (error instanceof SyntaxError || error.message === 'Internal server error') {
                displayMessage('Internal server error', 'bot');
            } else {
                console.error('Session check error:', error);
                displayMessage('Unable to check session status', 'bot');
            }
        }
    }

    async function sendMessage(message) {
      isWaitingForResponse = true;
      displayMessage(message, 'user');
      
      let typingIndicator = null;
      try {
          typingIndicator = showTypingIndicator();
          sendBtn.disabled = true;
          input.value = '';
          input.placeholder = "Waiting for answer...";
  
          let threadId = localStorage.getItem('thread_id');
          let isNewThread = false;
  
          if (threadId) {
              const statusResponse = await fetch(`${API_SESSION_STATUS}?thread_id=${threadId}`);
              if (!statusResponse.ok) throw new Error('Session checking error');
              
              const { remaining_time, remaining_chars } = await statusResponse.json();
              
              if (remaining_time <= 0 || remaining_chars <= 0) {
                  disableChatInput("Session expired - Please refresh");
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

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
              const errorText = await response.text();
              throw new Error('Internal server error');
          }
  
          if (!response.ok) {
              const data = await response.json();
              
              if (response.status === 400 && data.type === 'message_length') {
                  displayMessage(data.error, 'bot');
                  return; 
              }
              
              if (response.status === 403) { 
                  disableChatInput(data.error);
                  localStorage.removeItem('thread_id');
                  displayMessage(data.error, 'bot');
                  return;
              }
              
              throw new Error(data.error || 'Unknown error');
          }
  
          const data = await response.json();
          removeTypingIndicator(typingIndicator);
          displayMessage(data.response, 'bot');
          
          if (!isNewThread) await checkSessionLimits(threadId);
  
        } catch (error) {
          if (error instanceof SyntaxError || error.message === 'Internal server error') {
              displayMessage('Internal server error', 'bot');
          } else {
              console.error('Error:', error);
              displayMessage(`Error: ${error.message}`, 'bot');
              
              if (error.message.includes('expired') || error.message.includes('exceeded')) {
                  disableChatInput(error.message);
                  localStorage.removeItem('thread_id');
              }
          }
      } finally {
          if (typingIndicator) {
              removeTypingIndicator(typingIndicator);
          }
          isWaitingForResponse = false;
          sendBtn.disabled = false;
          input.placeholder = "Enter your message...";
      }
  }

      async function loadHistory() {
        const threadId = localStorage.getItem('thread_id');
        if (!threadId) return;

        try {
            const response = await fetch(`/thread/${threadId}/messages`);           
            // Checking content-type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const errorText = await response.text();
                throw new Error('Internal server error');
            }

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('thread_id');
                    disableChatInput("Invalid session");
                }
                return;
            }
            
            const messages = await response.json();
            messages.forEach(msg => displayMessage(msg.content, msg.origin));
            
        } catch (error) {
            if (error instanceof SyntaxError || error.message === 'Internal server error') {
                displayMessage('Internal server error', 'bot');
            } else {
                console.error('History load error:', error);
                disableChatInput("Connection error");
            }
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
        if (chatbotContainer.classList.contains('enlarged')) {
          chatbotContainer.classList.remove('enlarged');
        } else if (chatbotContainer.classList.contains('minimized')) {
          chatbotContainer.classList.remove('minimized');
        } else {
          chatbotContainer.classList.add('minimized');
        }
        event.stopPropagation();
      });

      chatbotContainer.addEventListener('click', (event) => {
        if (chatbotContainer.classList.contains('minimized') && event.target !== closeBtn) {
          chatbotContainer.classList.remove('minimized');
        }
      });

      // Welcome message
      displayMessage(
        'Hello, I am **BunkerBot**, your personal assistant for BunkerWeb!', 
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
    };
    document.head.appendChild(dompurifyScript);
});
