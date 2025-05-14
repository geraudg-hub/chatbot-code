from extensions import db
from models import Thread, Message  # Adapte ce chemin si besoin
from datetime import datetime
import uuid
from app import app  # Assurez-vous que 'app' est le nom de ton fichier principal d'application Flask

# Crée un contexte d'application
with app.app_context():  # Cette ligne permet d'activer le contexte Flask pour utiliser la DB

    # Crée un nouveau thread (conversation)
    thread = Thread(
        id=str(uuid.uuid4()),
        title="Conversation de test manuelle",
        status="active"
    )
    db.session.add(thread)
    db.session.commit()

    # Liste des échanges
    messages = [
        Message(
            thread_id=thread.id,
            content="Bonjour, tu peux m'aider à apprendre l'anglais ?",
            origin="user"
        ),
        Message(
            thread_id=thread.id,
            content="Bien sûr ! Souhaites-tu apprendre du vocabulaire, de la grammaire ou t'exercer à parler ?",
            origin="bot"
        ),
        Message(
            thread_id=thread.id,
            content="J'aimerais travailler mon vocabulaire sur les animaux.",
            origin="user"
        ),
        Message(
            thread_id=thread.id,
            content="Très bien ! Commençons. Comment dit-on 'chien' en anglais ?",
            origin="bot"
        ),
        Message(
            thread_id=thread.id,
            content="Dog !",
            origin="user"
        ),
        Message(
            thread_id=thread.id,
            content="Exactement ! Bravo 🎉",
            origin="bot"
        )
    ]

    # Ajoute les messages à la session
    db.session.add_all(messages)
    db.session.commit()

    print("Conversation insérée avec succès.")
