import os
import time
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2024-05-01-preview"
)

assistant_id = os.getenv("AZURE_OPENAI_ASSISTANT_ID")

def create_new_thread():
    try:
        thread = client.beta.threads.create()
        return str(thread.id)
    except Exception as e:
        print(f"Erreur création thread : {str(e)}")
        return None

def bot_response(user_message, thread_id):
    try:
        # Adding user message
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message[:5000]
        )

        # Run with timeout creation
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
            timeout=30
        )

        # Checking with exponential backoff
        start_time = time.time()
        while True:
            run_status = client.beta.threads.runs.retrieve(
                thread_id=thread_id, 
                run_id=run.id,
                timeout=10
            )
            
            if run_status.status == "completed":
                break
                
            if run_status.status in ["failed", "cancelled", "expired"]:
                return f"Erreur OpenAI: {run_status.last_error}"
                
            if time.time() - start_time > 30: 
                return "Erreur: Timeout de l'API OpenAI"
            
            time.sleep(1)

        # Recieving answer
        messages = client.beta.threads.messages.list(
            thread_id=thread_id, 
            timeout=10
        )
        return messages.data[0].content[0].text.value

    except Exception as e:
        return f"Erreur: {str(e)}"