# ____________________________________________________________________________________________________
# Fichier d'aide pour gérer la conversation et créer des résumés
from openai import AzureOpenAI

# Fonction pour résumer les messages effacés
def summarize_deleted_messages(conversations, thread_id, max_messages):
    # Extraire les messages effacés (les plus anciens)
    deleted_messages = conversations[thread_id][:-max_messages * 2]  # Récupérer les messages avant les 5 derniers
    
    # Créer un résumé des messages effacés
    if deleted_messages:
        messages_to_summarize = " ".join([msg["content"] for msg in deleted_messages])
        summary_prompt = f"Résumé des échanges précédents : {messages_to_summarize}"

        # On retourne simplement le résumé sous forme de texte
        return summary_prompt
    return None
