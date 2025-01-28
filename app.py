import os
import uuid
from flask import Flask, render_template, request, jsonify
from openai import AzureOpenAI
from dotenv import load_dotenv
from flask_cors import CORS
from summarizer import summarize_deleted_messages  # Import de la fonction de résumé

# Charger les variables d'environnement depuis le fichier .env
# TODO : normalement plus besoin de ça
# load_dotenv()

# Récupère la clé API et l'endpoint depuis les variables d'environnement
azure_api_key = os.getenv("AZURE_OPENAI_API_KEY")
azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")

# Vérifie que la clé API et l'endpoint sont définis
if not azure_api_key or not azure_endpoint:
    raise ValueError("La clé API ou l'endpoint Azure OpenAI ne sont pas définis dans les variables d'environnement.")

# Configuration de l'API Azure OpenAI
client = AzureOpenAI(
    azure_endpoint=azure_endpoint,
    api_key=azure_api_key,
    api_version="2024-02-01"
)

app = Flask(__name__)

# Appliquer CORS à l'application pour autoriser les requêtes depuis le frontend sur le port 5500
CORS(app, resources={r"/chat": {"origins": "http://127.0.0.1:5500"}})

# Dictionnaire pour stocker les threads de conversation
conversations = {}

# Limite du nombre de paires question/réponse à garder
MAX_MESSAGES = 5

@app.route('/chat', methods=['POST'])
def chat():
    # Récupérer l'ID du thread s'il existe, sinon créer un nouveau thread
    thread_id = request.json.get("thread_id")
    if not thread_id:
        thread_id = str(uuid.uuid4())  # Générer un nouvel ID si aucun existe
    user_message = request.json.get("message")

    # Vérifier si le thread existe, sinon en créer un nouveau
    if thread_id not in conversations:
        conversations[thread_id] = []
        print(f"New conversation started with thread_id: {thread_id}")  # Debugging log

    # Ajouter le message utilisateur à l'historique de la conversation
    conversations[thread_id].append({"role": "user", "content": user_message})

    # Vérifier si nous avons plus de MAX_MESSAGES paires question/réponse et les supprimer
    if len(conversations[thread_id]) > MAX_MESSAGES * 2:  # *2 car chaque paire est composée d'un message utilisateur et d'une réponse
        # Récupérer un résumé des messages effacés
        summary = summarize_deleted_messages(conversations, thread_id, MAX_MESSAGES)

        # Supprimer les messages excédentaires et ajouter le résumé
        conversations[thread_id] = conversations[thread_id][-MAX_MESSAGES * 2:]
        
        if summary:
            # Ajouter le résumé des messages supprimés au contexte
            conversations[thread_id].insert(0, {"role": "system", "content": summary})

    # Traiter le message avec Azure OpenAI
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a helpful assistant. You end your messages with 'nhfnhg'"}] + conversations[thread_id]
    )

    # Extraire la réponse du bot
    bot_response = response.choices[0].message.content

    # Ajouter la réponse du bot à l'historique de la conversation
    conversations[thread_id].append({"role": "assistant", "content": bot_response})

    # Vérifier que la réponse est bien renvoyée en format JSON
    return jsonify({"response": bot_response, "thread_id": thread_id})

@app.route('/')
def index():
    return render_template('index.html')

# Lancer l'application Flask
if __name__ == '__main__':
    app.run(debug=True)
