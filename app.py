import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from openai_client import bot_response, create_new_thread
from routes.admin_routes import admin_bp
from extensions import db, migrate
from models.models import Thread, Message
from config import Config
from flask_basicauth import BasicAuth
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy import func

# Charger les variables d'environnement
load_dotenv()
MAX_SESSION_DURATION = int(os.getenv('MAX_SESSION_DURATION'))
MAX_CHARACTERS = int(os.getenv('MAX_CHARACTERS'))
MAX_MESSAGE_CHARACTERS = int(os.getenv('MAX_MESSAGE_CHARACTERS'))



# Initialiser Flask
app = Flask(__name__)

# Configuration de la base de données
class Config:
    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://{os.getenv('MYSQL_USER')}:{os.getenv('MYSQL_PASSWORD')}@"
        f"{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DB')}"
    )
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

app.config.from_object(Config)

app.config['BASIC_AUTH_USERNAME'] = os.getenv('BASIC_AUTH_USERNAME')
app.config['BASIC_AUTH_PASSWORD'] = os.getenv('BASIC_AUTH_PASSWORD')

# Initialisation des extensions
db.init_app(app)
migrate.init_app(app, db)  # Initialisation de Migrate

basic_auth = BasicAuth(app)

# Enregistrer le blueprint de l'admin
app.register_blueprint(admin_bp, url_prefix='/admin')

with app.app_context():
    db.session.remove()
    db.engine.dispose()

# Vérification connexion à la base
with app.app_context():
    try:
        db.engine.connect()
        print("✅ Connexion DB réussie !")
    except Exception as e:
        print(f"❌ Erreur DB : {e}")
conversations = {}

# Route pour le template html
template_name = "test.html"

@app.route('/test')
def test():
    return render_template(template_name)

@app.route('/session_status', methods=['GET'])
def session_status():
    thread_id = request.args.get('thread_id')
    if not thread_id:
        return jsonify({"error": "Thread ID manquant"}), 400

    thread = Thread.query.get(thread_id)
    if not thread:
        return jsonify({"error": "Thread introuvable"}), 404

    total_chars = db.session.query(func.sum(func.length(Message.content)))\
                  .filter(Message.thread_id == thread_id)\
                  .scalar() or 0

    session_age = (datetime.utcnow() - thread.created_at).total_seconds()
    remaining_time = MAX_SESSION_DURATION - session_age
    remaining_chars = MAX_CHARACTERS - total_chars

    expired = remaining_time <= 0 or remaining_chars <= 0

    return jsonify({
        "remaining_time": remaining_time,
        "remaining_chars": remaining_chars,
        "expired": expired
    })


# Nouvelle route pour créer un thread
@app.route('/start_chat', methods=['POST'])
def start_chat():
    # Appel à openai_client.py pour créer un nouveau thread
    thread_id = create_new_thread()

    if not thread_id:
        return jsonify({"error": "Impossible de créer un thread."}), 500
    
    # Créer l'entrée dans la table Thread
    new_thread = Thread(id=thread_id, title="Nouvelle conversation")
    db.session.add(new_thread)
    db.session.commit()
    
    # Retourner le thread_id au frontend
    return jsonify({"thread_id": thread_id}), 200

@app.route('/chat', methods=['POST'])
def chat():
    thread_id = request.json.get("thread_id")
    user_message = request.json.get("message")

    if not user_message:
        return jsonify({"error": "Message vide"}), 400

    if len(user_message) > MAX_MESSAGE_CHARACTERS:
        return jsonify({"error": f"Le message dépasse la limite de {MAX_MESSAGE_CHARACTERS} caractères."}), 400

    if not thread_id:
        return jsonify({"error": "Thread ID manquant. Veuillez démarrer une nouvelle conversation."}), 400

    thread = Thread.query.filter_by(id=thread_id).first()
    if not thread or thread.status == 'expired':
        return jsonify({"error": "Session bloquée"}), 403

    # Vérification de l'expiration par le temps
    session_age = (datetime.utcnow() - thread.created_at).total_seconds()
    if session_age > MAX_SESSION_DURATION:
        thread.status = 'expired'  # Marquer comme expiré au lieu de supprimer
        db.session.commit()
        return jsonify({"error": "Session expirée"}), 403

    # Calcul du nombre total de caractères déjà utilisés
    total_chars = db.session.query(func.sum(func.length(Message.content)))\
                   .filter(Message.thread_id == thread_id)\
                   .scalar() or 0

    if total_chars + len(user_message) > MAX_CHARACTERS:
        thread.status = 'expired'  # Marquer comme expiré
        db.session.commit()
        return jsonify({"error": "Limite de caractères pour le thread dépassée"}), 403

    # À ce stade, la session est encore valide. On peut enregistrer le message.
    user_message_db = Message(thread_id=thread.id, content=user_message, origin="user")
    db.session.add(user_message_db)
    db.session.commit()

    # Appel à bot_response pour obtenir la réponse du bot
    bot_reply = bot_response(user_message, thread_id)

    # Vérification si l'ajout de la réponse dépasse la limite de caractères
    if total_chars + len(user_message) + len(bot_reply) > MAX_CHARACTERS:
        thread.status = 'expired'  # Marquer le thread comme expiré
        db.session.commit()
        return jsonify({"error": "Limite de caractères du thread dépassée"}), 403

    bot_message_db = Message(thread_id=thread.id, content=bot_reply, origin="bot")
    db.session.add(bot_message_db)
    db.session.commit()

    return jsonify({
        "response": bot_reply,
        "thread_id": thread_id
    })



if __name__ == '__main__':
    app.run(debug=True)
