import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-05-01-preview"
)

# Récupération de l'assistant
assistant_id = os.getenv("AZURE_OPENAI_ASSISTANT_ID")
assistant = client.beta.assistants.retrieve(assistant_id)
print("Assistant connecté")

def create_new_thread():
    try:
        # Création d'un thread pour stocker la conversation
        thread = client.beta.threads.create()
        return str(thread.id)
    
    except Exception as e:
        print(f"Erreur lors de la creation du thread : {str(e)}")
        return None


def bot_response(user_message, thread_id):
    if not client or not assistant:
        return "Erreur : Client OpenAI ou Assistant non initialisé."

    try:
        # Étape 2 : Ajouter le message utilisateur au thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message
        )

        # Étape 3 : Lancer l'exécution de l'assistant sur ce thread
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant.id
        )

        # Attendre que l'exécution se termine
        while run.status in ["queued", "in_progress"]:
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id, run_id=run.id
            )

        # Vérifier si l'exécution a réussi
        if run.status == "completed":
            # Étape 4 : Récupérer la réponse de l'assistant
            messages = client.beta.threads.messages.list(thread_id=thread_id)
            return messages.data[0].content[0].text.value
        else:
            return f"Erreur : l'exécution a échoué avec le statut {run.status}"

    except Exception as e:
        return f"Erreur : {str(e)}"


# Exemple d'utilisation
if __name__ == "__main__":
    user_message = "Bonjour, peux-tu me donner un résumé de ton contexte ?"
    print(bot_response(user_message))
