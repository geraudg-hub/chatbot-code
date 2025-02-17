document.addEventListener("DOMContentLoaded", () => {
    const threadId = document.getElementById("chatbox").dataset.threadId;

    // Charger les messages depuis l'API
    async function fetchMessages() {
        try {
            const response = await fetch(`/admin/thread/${threadId}/messages`);
            const messages = await response.json();

            messages.forEach((message) => {
                displayMessage(message.content, message.origin);
            });

            // Faire défiler vers le bas
            const chatbox = document.getElementById('chatbox');
            chatbox.scrollTop = chatbox.scrollHeight;
        } catch (error) {
            console.error("Erreur : ", error);
        }
    }

    function displayMessage(content, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");

        if (sender === 'user') {
            messageDiv.classList.add('user-message');
        } else {
            messageDiv.classList.add('bot-message');
        }

        messageDiv.innerHTML = content.replace(/\n/g, '<br>');
        document.getElementById("chatbox").appendChild(messageDiv);
    }

    fetchMessages();
});
