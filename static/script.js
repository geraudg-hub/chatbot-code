const API_URL = "http://localhost:5000/chat"; // URL de l'API Flask

const chatbox = document.getElementById("chatbox");
const sendButton = document.getElementById("send-button");
const inputMessage = document.getElementById("input-message");

// Récupérer le thread_id du localStorage
let threadId = localStorage.getItem("thread_id");

if (!threadId) {
    console.error("No thread_id found in localStorage");
} else {
    console.log("Using existing thread_id:", threadId); // Vérification
}

// Événement pour envoyer le message avec la touche "Enter"
inputMessage.addEventListener("keypress", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        const userMessage = inputMessage.value.trim();
        if (userMessage) {
            await sendMessageToBot(userMessage);
            inputMessage.value = ""; // Réinitialiser le champ de texte
        }
        event.preventDefault(); // Empêche le retour à la ligne avec "Enter"
    }
});

// Événement pour envoyer le message avec le bouton "Envoyer"
sendButton.addEventListener("click", async () => {
    const userMessage = inputMessage.value.trim();
    if (userMessage) {
        await sendMessageToBot(userMessage);
        inputMessage.value = ""; // Réinitialiser le champ de texte
    }
});

function addMessageSpacing() {
    const spacer = document.createElement("div");
    spacer.style.height = "10px"; // Ajustez la hauteur selon vos besoins
    chatbox.appendChild(spacer);
}

async function sendMessageToBot(message) {
    // Affiche le message utilisateur
    const userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add("user-message");
    userMessageDiv.textContent = message;
    chatbox.appendChild(userMessageDiv);

    // Ajouter un espace après le message
    addMessageSpacing();

    // Ajoute un espace après le message
    chatbox.scrollTop = chatbox.scrollHeight;

    try {
        // Envoi du message et du thread_id vers le backend
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: message,
                thread_id: threadId // Inclure le thread_id dans la requête
            })
        });

        const data = await response.json();

        if (response.ok) {
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("bot-message");
            botMessageDiv.textContent = data.response;
            chatbox.appendChild(botMessageDiv);
        } else {
            throw new Error(data.error || "Erreur inconnue");
        }
        // Ajouter un espace après la réponse
        addMessageSpacing();

    } catch (error) {
        console.error("Erreur :", error.message);
        const botMessageDiv = document.createElement("div");
        botMessageDiv.classList.add("bot-message");
        botMessageDiv.textContent = "Erreur : Impossible de récupérer une réponse du bot.";
        chatbox.appendChild(botMessageDiv);
    }

    chatbox.scrollTop = chatbox.scrollHeight;
}
